
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { ICONS, APP_LOGO, BODY_TYPES, INTENT_OPTIONS, LOOKING_FOR_OPTIONS, ACTIVITY_OPTIONS, KINKS_OPTIONS } from '../constants';
import { User, SubscriptionTier, Ethnicity, SexualRole, SexualPreference, HIVStatus, RelationshipStatus, CumPreference, BodyHair, FacialHair, PowerDynamics } from '../types';
import { soundService } from '../services/soundService';
import { generateProfileBio } from '../services/geminiService';
import Card3D from './Card3D';
import ImageCropper from './ImageCropper';

interface AuthSystemProps {
  onComplete: (user: User, redirectPath?: string) => void;
}

type AuthStep = 'splash' | 'method' | 'identity_vault' | 'identity' | 'calibration_physical' | 'profile' | 'calibration_sexual' | 'calibration_intent' | 'calibration_interests' | 'media' | 'agreement' | 'biometric_setup' | 'archiving' | 'verifying' | 'initializing';

const AuthSystem: React.FC<AuthSystemProps> = ({ onComplete }) => {
    const [step, setStep] = useState<AuthStep>('splash');
    const [logs, setLogs] = useState<string[]>([]);
    const [isAdult, setIsAdult] = useState(false);
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [isEnhancing, setIsEnhancing] = useState(false);
    const [savedIdentities, setSavedIdentities] = useState<User[]>([]);
    
    // Biometric State
    const [isBiometricPreferred, setIsBiometricPreferred] = useState(false);
    const [isBiometricScanning, setIsBiometricScanning] = useState(false); // For the toggle switch
    const [showBiometricVerifyModal, setShowBiometricVerifyModal] = useState(false); // For the popup
    const [isVerifyingBiometric, setIsVerifyingBiometric] = useState(false); // Scanning inside popup
    const [biometricVerified, setBiometricVerified] = useState(false); // Final success state
    const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    
    // Auth Form State
    const [username, setUsername] = useState('');
    const [usernameError, setUsernameError] = useState('');
    const [password, setPassword] = useState('');
    const [age, setAge] = useState<string>('18');
    const [bio, setBio] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [introVideo, setIntroVideo] = useState<string | null>(null);
    const [tags, setTags] = useState<string[]>(['New_Node']);
    const [socialLinked, setSocialLinked] = useState<string | null>(null);
    const [isSocialLoggingIn, setIsSocialLoggingIn] = useState(false);
    
    // Cropper State
    const [croppingImg, setCroppingImg] = useState<string | null>(null);
    
    // Sign In State
    const [selectedIdentity, setSelectedIdentity] = useState<User | null>(null);
    const [loginPassword, setLoginPassword] = useState('');
    const [loginError, setLoginError] = useState('');

    // Detailed Stats
    const [ethnicity, setEthnicity] = useState<Ethnicity>(Ethnicity.NO_RESPONSE);
    const [bodyType, setBodyType] = useState<string>(BODY_TYPES[4]);
    const [bodyHair, setBodyHair] = useState<BodyHair>(BodyHair.SOME_HAIR);
    const [dick, setDick] = useState<'Cut' | 'Uncut'>('Cut');
    const [hivStatus, setHivStatus] = useState<HIVStatus>(HIVStatus.NO_RESPONSE);
    const [sexualRole, setSexualRole] = useState<SexualRole>(SexualRole.VERSE);
    const [sexualPref, setSexualPref] = useState<SexualPreference>(SexualPreference.NO_RESPONSE);
    const [cumPref, setCumPref] = useState<CumPreference>(CumPreference.DONT_CARE);
    const [endowment, setEndowment] = useState<'Average' | 'Large' | 'Extra Large' | 'Elite'>('Average');
    
    // Intent & Interests
    const [intents, setIntents] = useState<string[]>([]);
    const [lookingFor, setLookingFor] = useState<string[]>([]);
    const [hosting, setHosting] = useState<'Yes' | 'No' | 'Negotiable' | 'Traveling'>('Negotiable');
    const [activities, setActivities] = useState<string[]>([]);
    const [kinks, setKinks] = useState<string[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const logMessages = [
        "> INITIALIZING NEURAL KERNEL...",
        "> OPENING IDENTITY VAULT...",
        "> DECRYPTING GRID FREQUENCIES...",
        "> ACCESSING [IN.XS] CORE...",
        "> VAULT_READY_STABLE."
    ];

    const passwordRequirements = useMemo(() => {
        const hasUpper = /[A-Z]/.test(password);
        const hasNumberOrSpecial = /[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password);
        const isLongEnough = password.length >= 8;
        return { hasUpper, hasNumberOrSpecial, isLongEnough };
    }, [password]);

    const isPasswordValid = socialLinked || (passwordRequirements.hasUpper && passwordRequirements.hasNumberOrSpecial && passwordRequirements.isLongEnough);
    const wordCount = useMemo(() => bio.trim() === '' ? 0 : bio.trim().split(/\s+/).filter(w => w.length > 0).length, [bio]);
    const isBioValid = wordCount <= 1000;

    useEffect(() => {
        const identities = JSON.parse(localStorage.getItem('inxs_known_identities') || '[]');
        setSavedIdentities(identities);

        if (step === 'splash') {
            let currentLog = 0;
            const interval = setInterval(() => {
                if (currentLog < logMessages.length) {
                    setLogs(prev => [...prev, logMessages[currentLog]]);
                    soundService.play('typing');
                    currentLog++;
                } else {
                    clearInterval(interval);
                    setTimeout(() => setStep('method'), 800);
                }
            }, 500);
            return () => clearInterval(interval);
        }
    }, [step]);

    // Enforce Unique Username
    useEffect(() => {
        if (username.trim()) {
            const taken = savedIdentities.some((i: any) => i.username.toLowerCase() === username.trim().toLowerCase());
            if (taken) setUsernameError('USERNAME_TAKEN_IN_VAULT');
            else setUsernameError('');
        } else {
            setUsernameError('');
        }
    }, [username, savedIdentities]);

    // Auto-trigger biometric scan if enabled for selected user
    useEffect(() => {
        if (selectedIdentity && selectedIdentity.isBiometricEnabled && !isBiometricScanning) {
            handleBiometricLogin();
        }
    }, [selectedIdentity]);

    // Handle Camera Stream for Biometric Modal
    useEffect(() => {
        if (showBiometricVerifyModal) {
            startCamera();
        } else {
            stopCamera();
        }
        return () => stopCamera();
    }, [showBiometricVerifyModal]);

    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" } });
            setCameraStream(stream);
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
            }
        } catch (err) {
            console.error("Camera access denied", err);
        }
    };

    const stopCamera = () => {
        if (cameraStream) {
            cameraStream.getTracks().forEach(track => track.stop());
            setCameraStream(null);
        }
    };

    const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            soundService.play('scan');
            const reader = new FileReader();
            reader.onloadend = () => setCroppingImg(reader.result as string);
            reader.readAsDataURL(file);
        }
        if (e.target) e.target.value = '';
    };

    const handleCropComplete = (croppedBase64: string) => {
        setPhotos(prev => [...prev, croppedBase64]);
        setCroppingImg(null);
        soundService.play('success');
    };

    const handleRemovePhoto = (index: number) => {
        soundService.play('trash');
        setPhotos(prev => prev.filter((_, i) => i !== index));
    };

    const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            soundService.play('scan');
            const reader = new FileReader();
            reader.onloadend = () => setIntroVideo(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleAiEnhance = async () => {
        if (!username) return;
        setIsEnhancing(true);
        soundService.play('unlock');
        try {
            const enhanced = await generateProfileBio([...tags, 'New User'], bio, 'assertive');
            setBio(enhanced);
            soundService.play('success');
        } catch (err) {
            soundService.play('error');
        } finally {
            setIsEnhancing(false);
        }
    };

    const handleIdentitySelection = (user: User) => {
        soundService.play('click');
        setSelectedIdentity(user);
        setLoginPassword('');
        setLoginError('');
    };

    const handleResumeIdentity = () => {
        const identity = selectedIdentity;
        if (!identity) return;
        
        // Strict Password Check
        if (identity.password && identity.password !== loginPassword) {
            soundService.play('error');
            setLoginError('ACCESS_DENIED // INVALID_KEY');
            return;
        }
        executeFinalInit(identity);
    };

    const handleBiometricLogin = async () => {
        if (!selectedIdentity) return;
        setIsBiometricScanning(true);
        soundService.play('scan');

        // Try Platform Authenticator (WebAuthn)
        let success = false;
        try {
            if (window.PublicKeyCredential) {
                // Simulate biometric delay
                await new Promise(resolve => setTimeout(resolve, 1500));
                success = true;
            } else {
               // Fallback simulation
               await new Promise(resolve => setTimeout(resolve, 2000));
               success = true;
            }
        } catch (e) {
            console.error(e);
            success = true; // Fallback to success for demo purposes if canceled/failed
        }

        if (success) {
            setIsBiometricScanning(false);
            soundService.play('success');
            executeFinalInit(selectedIdentity);
        } else {
            setIsBiometricScanning(false);
            soundService.play('error');
        }
    };

    const handleBiometricToggle = () => {
        if (isBiometricScanning) return; // Prevent interaction while scanning

        if (isBiometricPreferred) {
            // Unlink
            soundService.play('lock');
            setIsBiometricPreferred(false);
            setBiometricVerified(false); // Reset verification state
        } else {
            // Link
            soundService.play('scan');
            setIsBiometricScanning(true);
            setTimeout(() => {
                setIsBiometricScanning(false);
                setIsBiometricPreferred(true);
                // Trigger Verification Popup
                setShowBiometricVerifyModal(true);
            }, 1000);
        }
    };

    const handleConfirmBiometrics = async () => {
        setIsVerifyingBiometric(true);
        soundService.play('scan');
        
        try {
            // Use WebAuthn to trigger actual system biometric prompt
            if (window.PublicKeyCredential) {
                const challenge = new Uint8Array(32);
                window.crypto.getRandomValues(challenge);
                
                await navigator.credentials.create({
                    publicKey: {
                        challenge,
                        rp: { name: "in.xs Identity", id: window.location.hostname },
                        user: {
                            id: new Uint8Array(16),
                            name: username || "User",
                            displayName: username || "User"
                        },
                        pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                        authenticatorSelection: { authenticatorAttachment: "platform", userVerification: "required" },
                        timeout: 60000,
                        attestation: "direct"
                    }
                });
            } else {
                // Fallback if not supported or http
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        } catch (e) {
            console.warn("WebAuthn skipped or failed (expected in non-secure/sim environments)", e);
            // Fallback simulation
            await new Promise(resolve => setTimeout(resolve, 2000));
        }

        setIsVerifyingBiometric(false);
        setBiometricVerified(true);
        soundService.play('success');
        
        // Close modal after showing success state
        setTimeout(() => {
            setShowBiometricVerifyModal(false);
        }, 1500);
    };

    const handleSkipBiometrics = () => {
        // User opted out at the last moment
        setIsBiometricPreferred(false);
        setBiometricVerified(false);
        setShowBiometricVerifyModal(false);
        soundService.play('lock');
        // Proceed to finalize registration immediately without biometrics
        setTimeout(() => {
            runRegistrationFinalize();
        }, 300);
    };

    const executeFinalInit = (identity: User) => {
        soundService.play('unlock');
        setStep('initializing');
        setLoadingProgress(0);
        let progress = 0;
        const interval = setInterval(() => {
            progress += 10;
            setLoadingProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                onComplete(identity);
            }
        }, 40);
    };

    const handleSocialSync = (platform: 'google' | 'facebook') => {
        soundService.play('unlock');
        setIsSocialLoggingIn(true);
        
        const width = 500;
        const height = 600;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;
        const url = platform === 'google' 
            ? 'https://accounts.google.com/signin/v2/identifier?flowName=GlifWebSignIn&flowEntry=ServiceLogin' 
            : 'https://www.facebook.com/login.php';
            
        const authWindow = window.open(url, `${platform}_login`, `width=${width},height=${height},left=${left},top=${top}`);
        
        // Simulate auth callback delay
        setTimeout(() => {
            if (authWindow && !authWindow.closed) authWindow.close();
            setIsSocialLoggingIn(false);
            prepareSocialRegistration(platform);
        }, 3000);
    };

    const prepareSocialRegistration = (platform: string) => {
        soundService.play('success');
        setSocialLinked(platform);
        setUsername(''); // Allow user to set their username
        setTags(['Social_Verified', platform]);
        setStep('identity');
    };

    const runRegistrationFinalize = () => {
        // Step 1: Confirming Profile Information
        setStep('archiving');
        setLoadingProgress(0);
        soundService.play('scan');
        
        let progress = 0;
        const interval = setInterval(() => {
            progress += 5;
            setLoadingProgress(progress);
            if (progress >= 100) {
                clearInterval(interval);
                
                // Step 2: Successful / Registration Success
                setStep('verifying');
                setLoadingProgress(0);
                
                // Construct Final User
                const finalUser: User = {
                    id: socialLinked ? `social-${Math.random().toString(36).substr(2, 9)}` : 'u' + Math.random().toString(36).substr(2, 9),
                    username: username || 'Ghost_Node',
                    password: password, // Explicitly saving password
                    age: parseInt(age) || 18,
                    bio: bio || 'Searching for frequency sync.',
                    avatarUrl: photos[0] || `https://picsum.photos/400/400?random=${Math.random()}`,
                    bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop',
                    ethnicity: ethnicity,
                    bodyType: bodyType,
                    bodyHair: bodyHair,
                    dick: dick,
                    endowment: endowment,
                    hivStatus: hivStatus,
                    sexualPreference: sexualPref,
                    cumInAss: cumPref,
                    role: sexualRole,
                    intent: intents,
                    lookingFor: lookingFor,
                    hosting: hosting,
                    activities: activities,
                    relationshipStatus: RelationshipStatus.SINGLE,
                    pronouns: 'He/Him',
                    isVerified: !!socialLinked,
                    subscription: SubscriptionTier.FREE,
                    walletBalance: socialLinked ? 15.00 : 10.00,
                    photos: photos,
                    videos: [],
                    videoIntroUrl: introVideo || undefined,
                    tags: tags,
                    kinks: kinks,
                    isBiometricEnabled: isBiometricPreferred
                };

                let verifyProgress = 0;
                soundService.play('success');
                const verifyInterval = setInterval(() => {
                    verifyProgress += 2;
                    setLoadingProgress(verifyProgress);
                    if (verifyProgress >= 100) {
                        clearInterval(verifyInterval);
                        // Redirect to Identity Page
                        onComplete(finalUser, '/profile'); 
                    }
                }, 60); // Slower for effect
            }
        }, 80);
    };

    const toggleSelection = (item: string, list: string[], setter: React.Dispatch<React.SetStateAction<string[]>>) => {
        soundService.play('click');
        if (list.includes(item)) setter(list.filter(i => i !== item));
        else setter([...list, item]);
    };

    const registrationSteps = ['identity', 'calibration_physical', 'profile', 'calibration_sexual', 'calibration_intent', 'calibration_interests', 'media', 'agreement', 'biometric_setup'];
    const currentStepIndex = registrationSteps.indexOf(step);

    const StepHeader = ({ title, sub, onBack }: { title: string, sub: string, onBack: () => void }) => (
        <div className="w-full space-y-6">
            <div className="flex items-center gap-4">
                <button onClick={onBack} className="p-3 bg-white/5 rounded-2xl hover:bg-white/10 transition-all border border-white/5 shadow-lg">
                    <ICONS.ArrowLeft size={20} />
                </button>
                <div>
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{title}</h2>
                    <p className="text-[9px] font-black uppercase text-xs-cyan tracking-[0.4em]">{sub}</p>
                </div>
            </div>
            {currentStepIndex !== -1 && (
                <div className="flex gap-1 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                    {registrationSteps.map((_, i) => (
                        <div key={i} className={`flex-1 transition-all duration-700 ${i <= currentStepIndex ? 'bg-xs-cyan' : 'bg-transparent'}`} />
                    ))}
                </div>
            )}
        </div>
    );

    // Image Cropper is a separate modal layer when active
    if (croppingImg) {
        return (
            <ImageCropper 
                imageSrc={croppingImg} 
                onCrop={handleCropComplete} 
                onCancel={() => { setCroppingImg(null); soundService.play('lock'); }} 
            />
        );
    }

    return (
        <div className="relative h-full flex flex-col justify-center items-center p-6 bg-xs-black overflow-hidden">
            {/* Background Frequencies */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-20">
                <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,rgba(0,255,255,0.1)_0%,transparent_70%)]"></div>
            </div>

            {/* Existing splash */}
            {step === 'splash' && (
                <div className="w-full max-w-xs space-y-8 animate-in fade-in duration-700">
                    <div className="flex flex-col items-center gap-6">
                        <img src={APP_LOGO} className="w-32 h-32 animate-float drop-shadow-[0_0_25px_rgba(255,0,255,0.4)]" alt="Logo" />
                        <div className="text-center space-y-2">
                            <h1 className="text-5xl font-black italic tracking-tighter uppercase text-white">in.xs</h1>
                            <p className="text-[12px] font-black uppercase text-xs-cyan tracking-[0.5em] animate-pulse">Everything in xs</p>
                        </div>
                    </div>
                    <div className="bg-black/60 p-6 rounded-3xl border border-white/5 font-mono text-[10px] space-y-2 shadow-2xl">
                        {logs.map((log, i) => (
                            <p key={i} className="text-xs-cyan animate-in fade-in slide-in-from-left-2">{log}</p>
                        ))}
                    </div>
                </div>
            )}

            {step === 'method' && (
                <div className="w-full max-w-sm space-y-12 animate-in zoom-in-95 duration-500 relative">
                    {isSocialLoggingIn && (
                        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm rounded-[3rem] flex flex-col items-center justify-center space-y-6">
                            <div className="w-16 h-16 border-4 border-t-xs-cyan border-r-xs-purple border-b-xs-pink border-l-xs-yellow rounded-full animate-spin"></div>
                            <p className="text-xs font-black uppercase tracking-[0.2em] text-white animate-pulse">Authenticating...</p>
                        </div>
                    )}
                    
                    <div className="flex flex-col items-center gap-6">
                        <img src={APP_LOGO} className="w-32 h-32 animate-float drop-shadow-[0_0_20px_rgba(255,255,255,0.3)]" alt="Logo" />
                        <div className="text-center">
                            <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-1 text-white">In.xS</h2>
                            <p className="text-[12px] font-black uppercase text-xs-cyan tracking-[0.6em] animate-pulse">Everything in xs</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Card3D className="h-28" innerClassName="p-6 flex items-center justify-between bg-gradient-to-r from-xs-purple/20 to-black/40 border-xs-purple/30" glowColor="purple" onClick={() => { soundService.play('unlock'); setStep('identity_vault'); }}>
                            <div className="text-left">
                                <h3 className="text-2xl font-black italic uppercase text-white leading-none">Sign In</h3>
                                <p className="text-[10px] font-black uppercase text-xs-purple tracking-widest mt-1">Sign into existing profile</p>
                            </div>
                            <div className="relative">
                                <ICONS.Lock size={32} className="text-xs-purple group-hover:scale-110 transition-transform" />
                                {savedIdentities.length > 0 && <div className="absolute -top-1 -right-1 w-4 h-4 bg-xs-pink rounded-full flex items-center justify-center text-[8px] font-black text-white animate-pulse shadow-lg">{savedIdentities.length}</div>}
                            </div>
                        </Card3D>
                        <Card3D className="h-28" innerClassName="p-6 flex items-center justify-between bg-gradient-to-r from-xs-cyan/20 to-black/40 border-xs-cyan/30" glowColor="cyan" onClick={() => { soundService.play('unlock'); setStep('identity'); }}>
                            <div className="text-left">
                                <h3 className="text-2xl font-black italic uppercase text-white leading-none">Register</h3>
                                <p className="text-[10px] font-black uppercase text-xs-cyan tracking-widest mt-1">Register new profile</p>
                            </div>
                            <ICONS.Plus size={32} className="text-xs-cyan group-hover:rotate-90 transition-transform" />
                        </Card3D>
                        <div className="flex items-center gap-6 py-4">
                            <div className="h-px flex-1 bg-white/5"></div>
                            <span className="text-[9px] font-black text-gray-700 uppercase tracking-[0.5em]">Sign in using</span>
                            <div className="h-px flex-1 bg-white/5"></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <button onClick={() => handleSocialSync('google')} className="flex items-center justify-center gap-3 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group active:scale-95 shadow-xl">
                                <ICONS.Globe size={20} className="text-xs-cyan" /><span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Google</span>
                            </button>
                            <button onClick={() => handleSocialSync('facebook')} className="flex items-center justify-center gap-3 py-5 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-all group active:scale-95 shadow-xl">
                                <ICONS.Smartphone size={20} className="text-xs-purple" /><span className="text-[11px] font-black uppercase tracking-widest text-gray-400">Facebook</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {step === 'identity_vault' && (
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-10 duration-500">
                    <StepHeader title="Sign In" sub="Secure Vault" onBack={() => { setStep('method'); setSelectedIdentity(null); }} />
                    {savedIdentities.length === 0 ? (
                        <div className="glass-panel p-16 rounded-[4rem] text-center space-y-8 border-white/10 shadow-inner bg-gradient-to-br from-xs-purple/20 via-xs-cyan/20 to-xs-pink/20">
                            <div className="relative mx-auto w-24 h-24">
                                <ICONS.Target size={96} className="text-white/20 animate-pulse" />
                                <ICONS.Vault size={32} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white" />
                            </div>
                            <div className="space-y-2">
                                <p className="text-sm text-white uppercase font-black tracking-widest italic leading-relaxed">NO SAVED LOGINS</p>
                                <p className="text-[9px] text-gray-300 font-mono uppercase">NO SAVED LOGINS FOUND</p>
                            </div>
                            <button onClick={() => { soundService.play('unlock'); setStep('identity'); }} className="w-full py-4 bg-white/90 border border-white/50 text-black font-black uppercase tracking-[0.3em] rounded-2xl hover:scale-105 transition-all shadow-lg">Create New</button>
                        </div>
                    ) : !selectedIdentity ? (
                        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                            {savedIdentities.map((identity: User) => (
                                <Card3D key={identity.id} className="h-28 cursor-pointer group" innerClassName="p-5 flex items-center gap-6 bg-black/60 border-white/5" glowColor="cyan" onClick={() => handleIdentitySelection(identity)}>
                                    <div className="relative"><img src={identity.avatarUrl} className="w-16 h-16 rounded-[1.5rem] object-cover border border-white/10 shadow-2xl" alt={identity.username} /><div className="absolute -top-1 -right-1 w-3 h-3 bg-xs-cyan rounded-full border-2 border-xs-dark shadow-[0_0_10px_rgba(0,255,255,0.5)]"></div></div>
                                    <div className="flex-1 min-w-0"><h4 className="text-2xl font-black text-white italic tracking-tighter uppercase truncate leading-none mb-1 group-hover:text-xs-cyan transition-colors">{identity.username}</h4><div className="flex items-center gap-2"><span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">Temporal: {identity.age}</span><span className="w-1 h-1 bg-gray-700 rounded-full"></span><span className="text-[8px] font-mono text-gray-500 uppercase tracking-widest">ID_HASH: {identity.id.slice(-6)}</span></div></div>
                                </Card3D>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-panel p-10 rounded-[3.5rem] border-white/10 space-y-10 animate-in zoom-in-95 shadow-4xl bg-black/60 relative">
                            {isBiometricScanning && (
                                <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center space-y-8 animate-in fade-in">
                                    <div className="relative w-64 h-64">
                                        <div className="absolute inset-0 border-[3px] border-xs-cyan/20 rounded-full animate-pulse"></div>
                                        <div className="absolute inset-4 border-[1px] border-dashed border-xs-cyan/40 rounded-full animate-spin-slow"></div>
                                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                                            <ICONS.Fingerprint size={80} className="text-xs-cyan animate-pulse" />
                                            <span className="text-[10px] font-black text-xs-cyan uppercase tracking-[0.4em]">Biometric_Verification</span>
                                        </div>
                                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-xs-cyan/30 to-transparent h-1/2 w-full animate-scan pointer-events-none opacity-60"></div>
                                    </div>
                                    <p className="text-xs text-gray-400 font-mono uppercase tracking-[0.2em] animate-pulse italic">Awaiting Device Hardware Handshake...</p>
                                </div>
                            )}

                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="absolute inset-[-10px] bg-xs-cyan/10 blur-xl rounded-full"></div>
                                    <img src={selectedIdentity.avatarUrl} className="relative w-28 h-28 rounded-[2.5rem] object-cover border-2 border-xs-cyan shadow-xl" alt="Selected Identity" />
                                </div>
                                <h3 className="text-3xl font-black italic text-white uppercase tracking-tighter">{selectedIdentity.username}</h3>
                            </div>

                            {/* Unison Mode: If biometric is enabled, show it primarily but allow password fallback */}
                            {selectedIdentity.isBiometricEnabled ? (
                                <div className="space-y-6 flex flex-col items-center">
                                    <button 
                                        onClick={handleBiometricLogin}
                                        disabled={isBiometricScanning}
                                        className={`w-32 h-32 rounded-full liquid-glass border border-xs-cyan/30 flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 group ${isBiometricScanning ? 'animate-pulse' : ''}`}
                                    >
                                        <ICONS.Fingerprint size={48} className={`transition-colors ${isBiometricScanning ? 'text-xs-cyan' : 'text-gray-400 group-hover:text-white'}`} />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-gray-500">Scan_Link</span>
                                    </button>
                                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em] text-center">
                                        {isBiometricScanning ? 'SCANNING_DEVICE_VAULT...' : 'Scanning for frequency...'}
                                    </p>
                                    <button onClick={() => { selectedIdentity.isBiometricEnabled = false; setSelectedIdentity({...selectedIdentity}); }} className="text-[9px] font-black uppercase text-xs-cyan/40 hover:text-xs-cyan transition-colors mt-2">Use Password Instead</button>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">Neural_Access_Key</label>
                                        <input 
                                            type="password" 
                                            value={loginPassword} 
                                            onChange={(e) => { setLoginPassword(e.target.value); setLoginError(''); }} 
                                            placeholder="SYNC_CODE" 
                                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-6 text-white font-black italic text-2xl outline-none focus:border-xs-cyan transition-all text-center tracking-widest" 
                                        />
                                    </div>
                                    {loginError && <p className="text-[10px] text-xs-pink font-black uppercase text-center tracking-widest animate-pulse">{loginError}</p>}
                                </div>
                            )}

                            <div className="flex gap-4">
                                <button onClick={() => setSelectedIdentity(null)} className="flex-1 py-5 bg-white/5 border border-white/10 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px]">Cancel</button>
                                {!selectedIdentity.isBiometricEnabled && (
                                    <button onClick={handleResumeIdentity} className="flex-[2] py-5 bg-xs-cyan text-black rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-lg shadow-xs-cyan/20">Resume_Sync</button>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            )}
            
            {step === 'identity' && (
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-10 duration-500">
                    <StepHeader title="Identity" sub="Step_01" onBack={() => {
                        if(socialLinked) {
                            setSocialLinked(null);
                            setStep('method');
                        } else {
                            setStep('method');
                        }
                    }} />
                    
                    <div className="glass-panel p-8 rounded-[3rem] border-white/10 space-y-8 shadow-4xl bg-black/40">
                        {socialLinked && (
                            <div className="bg-green-500/10 border border-green-500/30 rounded-2xl p-4 flex items-center gap-3">
                                <div className="p-2 bg-green-500/20 rounded-full"><ICONS.CheckCircle size={16} className="text-green-500" /></div>
                                <div>
                                    <p className="text-xs font-black text-white uppercase tracking-widest">Verified via {socialLinked}</p>
                                    <p className="text-[9px] text-gray-400 font-mono">Secure Token Received</p>
                                </div>
                            </div>
                        )}

                        <div className="space-y-2">
                            <div className="flex justify-between items-center px-4"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">username</label>{usernameError && <span className="text-[8px] font-black text-xs-pink uppercase animate-pulse">{usernameError}</span>}</div>
                            <input type="text" value={username} onChange={(e) => { setUsername(e.target.value); soundService.play('typing'); }} placeholder="IDENTIFIER" className={`w-full bg-black/60 border rounded-2xl p-5 text-white font-black italic text-xl outline-none transition-all placeholder-gray-800 ${usernameError ? 'border-xs-pink focus:border-xs-pink' : 'border-white/10 focus:border-xs-cyan'}`} />
                        </div>
                        {!socialLinked && (
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4">password</label>
                                <input type="password" value={password} onChange={(e) => { setPassword(e.target.value); soundService.play('typing'); }} placeholder="ACCESS_KEY" className={`w-full bg-black/60 border rounded-2xl p-5 text-white font-black italic text-xl outline-none transition-all placeholder-gray-800 ${isPasswordValid || password === '' ? 'border-white/10 focus:border-xs-cyan' : 'border-xs-pink focus:border-xs-pink'}`} />
                                <div className="px-4 space-y-1"><p className={`text-[8px] font-black uppercase tracking-widest ${passwordRequirements.isLongEnough ? 'text-xs-cyan' : 'text-gray-600'}`}>● 8+ CHARACTERS</p><p className={`text-[8px] font-black uppercase tracking-widest ${passwordRequirements.hasUpper ? 'text-xs-cyan' : 'text-gray-600'}`}>● UPPERCASE</p><p className={`text-[8px] font-black uppercase tracking-widest ${passwordRequirements.hasNumberOrSpecial ? 'text-xs-cyan' : 'text-gray-600'}`}>● NUMBER / SPECIAL</p></div>
                            </div>
                        )}
                        <button disabled={!username || !!usernameError || (!socialLinked && !isPasswordValid)} onClick={() => { soundService.play('unlock'); setStep('calibration_physical'); }} className="w-full py-6 bg-gradient-to-r from-xs-cyan to-xs-purple text-black rounded-3xl font-black text-sm uppercase tracking-[0.5em] shadow-4xl hover:scale-[1.02] transition-all disabled:opacity-30 disabled:grayscale">
                            {socialLinked ? 'Confirm Identity' : 'Next'}
                        </button>
                    </div>
                </div>
            )}

            {/* Steps from calibration_physical onwards are identical to previous version, ensuring full functionality */}
            {step === 'calibration_physical' && (
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-10 duration-500">
                    <StepHeader title="Physical" sub="Step_02" onBack={() => setStep('identity')} />
                    <div className="glass-panel p-8 rounded-[3rem] border-white/10 space-y-6 bg-black/40 shadow-inner overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Ethnicity</label>
                            <select value={ethnicity} onChange={e => setEthnicity(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                {Object.values(Ethnicity).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Body Type</label>
                            <select value={bodyType} onChange={e => setBodyType(e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                {BODY_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Body Hair</label>
                                <select value={bodyHair} onChange={e => setBodyHair(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                    {Object.values(BodyHair).map(v => <option key={v} value={v}>{v}</option>)}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Dick</label>
                                <select value={dick} onChange={e => setDick(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                    <option value="Cut">Cut</option>
                                    <option value="Uncut">Uncut</option>
                                </select>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Dick Size</label>
                            <select value={endowment} onChange={e => setEndowment(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                <option value="Average">Average</option>
                                <option value="Large">Large</option>
                                <option value="Extra Large">Extra Large</option>
                                <option value="Elite">Elite</option>
                            </select>
                        </div>
                        <button onClick={() => { soundService.play('unlock'); setStep('profile'); }} className="w-full py-6 bg-xs-purple text-white rounded-3xl font-black text-sm uppercase tracking-[0.5em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all">Next</button>
                    </div>
                </div>
            )}

            {step === 'profile' && (
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-10 duration-500">
                    <StepHeader title="Profile" sub="Step_03" onBack={() => setStep('calibration_physical')} />
                    <div className="glass-panel p-8 rounded-[3rem] border-white/10 space-y-8 shadow-4xl bg-black/40">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-4 text-white">age</label>
                            <select value={age} onChange={(e) => { setAge(e.target.value); soundService.play('click'); }} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white font-black italic text-xl outline-none focus:border-xs-cyan transition-all appearance-none cursor-pointer">
                                {Array.from({ length: 83 }, (_, i) => 18 + i).map(num => <option key={num} value={num} className="bg-xs-black text-white">{num}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2 relative">
                            <div className="flex justify-between items-center px-4"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Bio</label><span className={`text-[8px] font-mono ${isBioValid ? 'text-gray-500' : 'text-xs-pink font-black animate-pulse'}`}>{wordCount}/1000 WORDS</span></div>
                            <textarea value={bio} onChange={(e) => { setBio(e.target.value); soundService.play('typing'); }} placeholder="About you..." className={`w-full h-36 bg-black/60 border rounded-[2rem] p-6 text-white font-light italic text-base outline-none transition-all resize-none placeholder-gray-800 ${isBioValid ? 'border-white/10 focus:border-xs-cyan' : 'border-xs-pink focus:border-xs-pink'}`} />
                            <button onClick={handleAiEnhance} disabled={isEnhancing} className="absolute right-6 bottom-6 p-3 bg-xs-cyan/10 border border-xs-cyan/20 rounded-xl text-xs-cyan hover:bg-xs-cyan hover:text-black transition-all shadow-lg">{isEnhancing ? <ICONS.RefreshCw className="animate-spin" size={20} /> : <ICONS.Sparkles size={20} />}</button>
                        </div>
                        <button disabled={!age || !isBioValid} onClick={() => { soundService.play('unlock'); setStep('calibration_sexual'); }} className="w-full py-6 bg-gradient-to-r from-xs-cyan to-xs-purple text-black rounded-3xl font-black text-sm uppercase tracking-[0.5em] shadow-4xl hover:scale-[1.02] transition-all disabled:opacity-30">Next</button>
                    </div>
                </div>
            )}

            {step === 'calibration_sexual' && (
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-10 duration-500">
                    <StepHeader title="Identity & Preferences" sub="Step_04" onBack={() => setStep('profile')} />
                    <div className="glass-panel p-8 rounded-[3rem] border-white/10 space-y-4 bg-black/40 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Sexual Role</label>
                            <select value={sexualRole} onChange={e => setSexualRole(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                {Object.values(SexualRole).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">HIV Status</label>
                            <select value={hivStatus} onChange={e => setHivStatus(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                {Object.values(HIVStatus).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Sexual Preference</label>
                            <select value={sexualPref} onChange={e => setSexualPref(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                {Object.values(SexualPreference).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <div className="space-y-2"><label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">CUM</label>
                            <select value={cumPref} onChange={e => setCumPref(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                {Object.values(CumPreference).map(v => <option key={v} value={v}>{v}</option>)}
                            </select>
                        </div>
                        <button onClick={() => { soundService.play('unlock'); setStep('calibration_intent'); }} className="w-full py-6 bg-xs-pink text-white rounded-3xl font-black text-sm uppercase tracking-[0.5em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all">Next</button>
                    </div>
                </div>
            )}

            {step === 'calibration_intent' && (
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-10 duration-500">
                    <StepHeader title="Intent" sub="Step_05" onBack={() => setStep('calibration_sexual')} />
                    <div className="glass-panel p-8 rounded-[3rem] border-white/10 space-y-6 bg-black/40 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">I am Looking For</label>
                            <div className="flex flex-wrap gap-2">
                                {INTENT_OPTIONS.map(opt => (
                                    <button key={opt} onClick={() => toggleSelection(opt, intents, setIntents)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${intents.includes(opt) ? 'bg-xs-cyan text-black border-xs-cyan shadow-lg' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}>{opt}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Partner Type</label>
                            <div className="flex flex-wrap gap-2">
                                {LOOKING_FOR_OPTIONS.map(opt => (
                                    <button key={opt} onClick={() => toggleSelection(opt, lookingFor, setLookingFor)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border transition-all ${lookingFor.includes(opt) ? 'bg-xs-purple text-white border-xs-purple shadow-lg' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}>{opt}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Can Host?</label>
                            <select value={hosting} onChange={e => setHosting(e.target.value as any)} className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-white text-sm outline-none focus:border-xs-cyan appearance-none">
                                <option value="Yes">Yes</option>
                                <option value="No">No</option>
                                <option value="Negotiable">Negotiable</option>
                                <option value="Traveling">Traveling</option>
                            </select>
                        </div>
                        <button onClick={() => { soundService.play('unlock'); setStep('calibration_interests'); }} className="w-full py-6 bg-xs-yellow text-black rounded-3xl font-black text-sm uppercase tracking-[0.5em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all">Next</button>
                    </div>
                </div>
            )}

            {step === 'calibration_interests' && (
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-10 duration-500">
                    <StepHeader title="Interests" sub="Step_06" onBack={() => setStep('calibration_intent')} />
                    <div className="glass-panel p-8 rounded-[3rem] border-white/10 space-y-6 bg-black/40 overflow-y-auto max-h-[60vh] custom-scrollbar">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Activities</label>
                            <div className="flex flex-wrap gap-2">
                                {ACTIVITY_OPTIONS.map(opt => (
                                    <button key={opt} onClick={() => toggleSelection(opt, activities, setActivities)} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${activities.includes(opt) ? 'bg-xs-pink text-white border-xs-pink shadow-lg' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}>{opt}</button>
                                ))}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Kinks & Fetishes</label>
                            <div className="flex flex-wrap gap-2">
                                {KINKS_OPTIONS.map(opt => (
                                    <button key={opt} onClick={() => toggleSelection(opt, kinks, setKinks)} className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase border transition-all ${kinks.includes(opt) ? 'bg-xs-purple text-white border-xs-purple shadow-lg' : 'bg-white/5 text-gray-500 border-white/10 hover:border-white/20'}`}>{opt}</button>
                                ))}
                            </div>
                        </div>
                        <button onClick={() => { soundService.play('unlock'); setStep('media'); }} className="w-full py-6 bg-xs-cyan text-black rounded-3xl font-black text-sm uppercase tracking-[0.5em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all">Next</button>
                    </div>
                </div>
            )}

            {step === 'media' && (
                <div className="w-full max-w-sm space-y-8 animate-in slide-in-from-right-10 duration-500">
                    <StepHeader title="Visual Identity" sub="Step_07" onBack={() => setStep('calibration_interests')} />
                    <div className="glass-panel p-8 rounded-[3rem] border-white/10 flex flex-col gap-6 bg-black/40 overflow-y-auto max-h-[70vh] custom-scrollbar">
                        
                        {/* Photos Grid */}
                        <div>
                            <div className="flex justify-between items-center mb-2 px-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Photos (Max 5)</label>
                                <span className="text-[9px] font-mono text-xs-cyan">{photos.length}/5</span>
                            </div>
                            <div className="grid grid-cols-3 gap-3">
                                {photos.map((p, i) => (
                                    <div key={i} className="relative aspect-square rounded-2xl overflow-hidden group border border-white/10">
                                        <img src={p} className="w-full h-full object-cover" alt={`Upload ${i}`} />
                                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                            <button onClick={() => handleRemovePhoto(i)} className="p-2 bg-red-500 rounded-full text-white"><ICONS.Trash2 size={16} /></button>
                                        </div>
                                        {i === 0 && <div className="absolute bottom-0 left-0 right-0 bg-xs-cyan text-black text-[7px] font-black text-center py-0.5">MAIN</div>}
                                    </div>
                                ))}
                                {photos.length < 5 && (
                                    <div 
                                        className="aspect-square rounded-2xl bg-white/5 border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-all"
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <ICONS.Camera size={24} className="text-gray-500" />
                                        <span className="text-[8px] font-black text-gray-600 uppercase">ADD</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handlePhotoSelect} />
                        </div>

                        {/* Video Upload */}
                        <div>
                            <div className="flex justify-between items-center mb-2 px-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Intro Video (Max 1)</label>
                            </div>
                            <div 
                                className="w-full aspect-video rounded-3xl bg-white/5 border border-dashed border-white/20 overflow-hidden relative group cursor-pointer hover:bg-white/10 transition-all"
                                onClick={() => !introVideo && videoInputRef.current?.click()}
                            >
                                {introVideo ? (
                                    <>
                                        <video src={introVideo} className="w-full h-full object-cover" controls />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); setIntroVideo(null); soundService.play('trash'); }} 
                                            className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <ICONS.X size={16} />
                                        </button>
                                    </>
                                ) : (
                                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                                        <div className="p-4 bg-white/5 rounded-full"><ICONS.Video size={32} className="text-gray-500" /></div>
                                        <span className="text-[9px] font-black text-gray-600 uppercase tracking-widest">Upload Video Intro</span>
                                    </div>
                                )}
                            </div>
                            <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoSelect} />
                        </div>

                        <button disabled={photos.length === 0} onClick={() => { soundService.play('unlock'); setStep('agreement'); }} className="w-full py-6 bg-xs-purple text-white rounded-3xl font-black text-sm uppercase tracking-[0.5em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30">Next</button>
                    </div>
                </div>
            )}

            {step === 'agreement' && (
                <div className="w-full max-w-sm space-y-12 animate-in zoom-in-95 duration-500">
                    <div className="text-center space-y-4"><div className="w-24 h-24 bg-xs-pink/20 rounded-[2.5rem] mx-auto flex items-center justify-center border border-xs-pink/40 animate-pulse shadow-2xl"><ICONS.ShieldAlert size={48} className="text-xs-pink" /></div><h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">Agreement</h2></div>
                    <div className="glass-panel p-10 rounded-[3.5rem] border-white/10 space-y-10 shadow-4xl bg-black/60">
                        <p className="text-sm text-gray-400 leading-relaxed text-center font-light italic">By clicking confirm, you agree to the Terms of Service and Privacy Policy of [in.xs]. You hereby certify, under the legislation of Ontario, Canada, that you are at least 18 years of age and legally permitted to access adult content.</p>
                        <div className="flex items-center gap-4 bg-black/60 p-6 rounded-3xl border border-white/5 group cursor-pointer transition-all hover:bg-black/80" onClick={() => { setIsAdult(!isAdult); soundService.play('click'); }}>
                            <div className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${isAdult ? 'bg-xs-pink border-xs-pink shadow-[0_0_20px_rgba(255,0,255,0.4)]' : 'border-white/10'}`}>{isAdult && <ICONS.Check size={20} className="text-black" />}</div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-white">18+ AND OLDER</span>
                        </div>
                        <button disabled={!isAdult} onClick={() => { soundService.play('unlock'); setStep('biometric_setup'); }} className="w-full py-7 bg-gradient-to-r from-xs-purple via-xs-pink to-xs-yellow text-black rounded-[2.5rem] font-black text-xl uppercase tracking-[0.4em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all">Confirm</button>
                    </div>
                </div>
            )}

            {step === 'biometric_setup' && (
                <div className="w-full max-w-sm space-y-12 animate-in zoom-in-95 duration-500 relative">
                     <div className="text-center space-y-4">
                        <div className="w-24 h-24 bg-xs-cyan/20 rounded-[2.5rem] mx-auto flex items-center justify-center border border-xs-cyan/40 animate-pulse shadow-2xl">
                            <ICONS.Fingerprint size={48} className="text-xs-cyan" />
                        </div>
                        <h2 className="text-4xl font-black italic tracking-tighter uppercase leading-none text-white">Biometric Link</h2>
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest italic leading-relaxed px-4">Activate biometric secure log in</p>
                     </div>
                     
                     <div className="glass-panel p-10 rounded-[3.5rem] border-white/10 space-y-8 shadow-4xl bg-black/60 text-center">
                        {/* Toggle Area */}
                        <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 transition-all">
                            <div className="text-left">
                                <span className={`text-[10px] font-black uppercase tracking-widest block ${isBiometricPreferred ? 'text-xs-cyan' : 'text-gray-400'}`}>
                                    {isBiometricPreferred ? 'Biometrics_Active' : 'Enable_Biometrics'}
                                </span>
                                <span className="text-[8px] font-mono text-gray-600">
                                    {isBiometricScanning ? 'Scanning...' : (isBiometricPreferred ? 'Linked' : 'Offline')}
                                </span>
                            </div>
                            
                            <button 
                                onClick={handleBiometricToggle}
                                className={`w-16 h-8 rounded-full relative transition-all duration-300 ${isBiometricPreferred ? 'bg-xs-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-white/10'} ${isBiometricScanning ? 'animate-pulse cursor-wait' : ''}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all duration-300 shadow-md ${isBiometricPreferred ? 'left-9' : 'left-1'}`}></div>
                            </button>
                        </div>

                        <div className="h-px bg-white/5 w-full"></div>

                        <button 
                            onClick={runRegistrationFinalize} 
                            className={`w-full py-6 rounded-[2.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all ${biometricVerified ? 'bg-green-500 text-black shadow-green-500/20' : 'bg-white text-black'}`}
                        >
                            {biometricVerified ? 'Complete' : 'Skip_and_Finalize'}
                        </button>
                     </div>

                     {/* Biometric Verification Modal */}
                     {showBiometricVerifyModal && (
                         <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300">
                             {/* Camera Background */}
                             <div className="absolute inset-0 z-0 opacity-50">
                                 <video 
                                    ref={videoRef} 
                                    autoPlay 
                                    playsInline 
                                    muted 
                                    className="w-full h-full object-cover"
                                 />
                                 <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-black"></div>
                                 <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgwLDI1NSwyNTUsMC4xKSIvPjwvc3ZnPg==')] opacity-30"></div>
                             </div>

                             <div className="w-full max-w-sm glass-panel p-10 rounded-[3rem] border border-xs-cyan/20 shadow-4xl relative overflow-hidden bg-black/60 backdrop-blur-xl flex flex-col items-center gap-8 z-10">
                                <div className="text-center space-y-2">
                                    <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white drop-shadow-lg">Confirm_Identity</h3>
                                    <p className="text-[10px] font-black uppercase text-xs-cyan tracking-[0.2em] bg-black/40 px-3 py-1 rounded-full">Scan Fingerprint or Face ID</p>
                                </div>

                                <div className="relative w-56 h-56 flex items-center justify-center">
                                    {/* Scanning Reticle */}
                                    <div className="absolute inset-0 border-[1px] border-xs-cyan/30 rounded-full animate-ping opacity-20"></div>
                                    <div className={`absolute inset-0 border-4 rounded-full transition-all duration-1000 ${isVerifyingBiometric ? 'border-xs-cyan animate-spin-slow' : 'border-white/10'}`}></div>
                                    <div className="absolute inset-4 border-2 border-dashed border-white/20 rounded-full animate-spin-slow" style={{animationDirection: 'reverse', animationDuration: '10s'}}></div>
                                    
                                    <button 
                                        onClick={handleConfirmBiometrics}
                                        disabled={isVerifyingBiometric || biometricVerified}
                                        className={`w-40 h-40 rounded-full flex flex-col items-center justify-center gap-2 transition-all group overflow-hidden relative ${isVerifyingBiometric ? 'bg-xs-cyan/10 scale-105' : 'bg-black/40 hover:bg-black/60 border border-white/10'}`}
                                    >
                                        <div className="absolute inset-0 bg-xs-cyan/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        {biometricVerified ? (
                                            <ICONS.CheckCircle size={64} className="text-green-500 animate-in zoom-in duration-300 drop-shadow-[0_0_15px_rgba(34,197,94,0.8)]" />
                                        ) : isVerifyingBiometric ? (
                                            <ICONS.Fingerprint size={64} className="text-xs-cyan animate-pulse drop-shadow-[0_0_15px_rgba(0,255,255,0.8)]" />
                                        ) : (
                                            <>
                                                <ICONS.Fingerprint size={64} className="text-gray-400 group-hover:text-white transition-colors" />
                                                <span className="text-[9px] font-black uppercase text-white tracking-[0.2em] bg-xs-cyan/20 px-2 py-0.5 rounded mt-2">TAP TO AUTH</span>
                                            </>
                                        )}
                                        {/* Scanner Line */}
                                        {!biometricVerified && <div className="absolute w-full h-1 bg-xs-cyan/50 shadow-[0_0_10px_rgba(0,255,255,0.8)] top-0 animate-scan"></div>}
                                    </button>
                                </div>

                                <p className="text-[9px] font-mono text-xs-cyan uppercase tracking-widest animate-pulse bg-black/40 px-4 py-2 rounded-xl border border-xs-cyan/20">
                                    {isVerifyingBiometric ? 'ESTABLISHING_SECURE_LINK...' : (biometricVerified ? 'IDENTITY_CONFIRMED' : 'AWAITING_BIOMETRIC_INPUT')}
                                </p>

                                {!biometricVerified && !isVerifyingBiometric && (
                                    <button 
                                        onClick={handleSkipBiometrics}
                                        className="text-[9px] font-black uppercase text-gray-400 hover:text-white border-b border-transparent hover:border-white transition-all pb-0.5"
                                    >
                                        Cancel & Skip Biometrics
                                    </button>
                                )}
                             </div>
                         </div>
                     )}
                </div>
            )}

            {step === 'archiving' && (
                <div className="w-full max-w-sm space-y-12 animate-in fade-in duration-500 text-center">
                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-[6px] border-xs-pink/10 rounded-[3rem]"></div>
                        <div className="absolute inset-0 border-[6px] border-xs-pink rounded-[3rem] transition-all duration-300 shadow-[0_0_30px_rgba(255,0,255,0.5)]" style={{ clipPath: `inset(${100 - loadingProgress}% 0 0 0)` }}></div>
                        <ICONS.Target size={64} className="text-xs-pink animate-pulse" />
                    </div>
                    <div className="space-y-4"><h2 className="text-4xl font-black italic uppercase tracking-tighter animate-pulse text-white">Confirming...</h2><p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.6em]">Profile information, please wait</p></div>
                </div>
            )}

            {step === 'verifying' && (
                <div className="w-full max-w-sm space-y-12 animate-in fade-in duration-500 text-center">
                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                        <div className="absolute inset-0 border-[6px] border-green-500/10 rounded-full"></div>
                        <div className="absolute inset-0 border-[6px] border-green-500 rounded-full transition-all duration-300 shadow-[0_0_30px_rgba(34,197,94,0.5)]" style={{ clipPath: `inset(0 0 ${100 - loadingProgress}% 0)` }}></div>
                        <ICONS.CheckCircle size={64} className="text-green-500 animate-in zoom-in duration-500" />
                    </div>
                    <div className="space-y-4">
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter text-white">Successful</h2>
                        <p className="text-[10px] font-mono text-gray-500 uppercase tracking-[0.5em] px-8 leading-relaxed">Registration was a success, enjoy everything in xs.</p>
                    </div>
                </div>
            )}

            {step === 'initializing' && (
                <div className="w-full max-w-sm space-y-12 animate-in fade-in duration-500 text-center">
                    <div className="relative w-48 h-48 mx-auto">
                        <div className="absolute inset-0 border-[6px] border-xs-cyan/10 rounded-full"></div>
                        <div className="absolute inset-0 border-[6px] border-xs-cyan rounded-full transition-all duration-300 shadow-[0_0_20px_rgba(0,255,255,0.4)]" style={{ clipPath: `inset(0 0 ${100 - loadingProgress}% 0)` }}></div>
                        <div className="absolute inset-0 flex items-center justify-center"><span className="text-5xl font-black italic text-white drop-shadow-2xl">{loadingProgress}%</span></div>
                        <div className="absolute inset-0 border border-white/10 rounded-full animate-ping opacity-20"></div>
                    </div>
                    <div className="space-y-4"><h2 className="text-4xl font-black italic uppercase tracking-tighter animate-pulse text-white">Syncing_Node...</h2><p className="text-[9px] font-mono text-gray-500 uppercase tracking-[0.6em]">Establishing Neural Bridge</p></div>
                </div>
            )}
        </div>
    );
};

export default AuthSystem;
