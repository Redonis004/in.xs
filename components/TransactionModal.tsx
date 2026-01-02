
import React, { useState, useEffect, useRef } from 'react';
import Card3D from './Card3D';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, note: string, type: 'send' | 'request' | 'crypto') => void;
  recipientName: string;
  recipientAvatar: string;
  currentBalance: number;
  initialType?: 'send' | 'request';
  biometricRequired?: boolean;
}

const CANADIAN_BANKS = [
    { id: 'td', name: 'TD Canada Trust', color: 'bg-[#008a00]', icon: ICONS.Landmark },
    { id: 'rbc', name: 'RBC Royal Bank', color: 'bg-[#0051a5]', icon: ICONS.ShieldCheck },
    { id: 'scotia', name: 'Scotiabank', color: 'bg-[#ec111a]', icon: ICONS.Globe },
    { id: 'bmo', name: 'BMO Montreal', color: 'bg-[#0079c1]', icon: ICONS.Landmark },
    { id: 'cibc', name: 'CIBC', color: 'bg-[#c41f3e]', icon: ICONS.CreditCard },
];

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  recipientName, 
  recipientAvatar,
  currentBalance,
  initialType = 'send',
  biometricRequired = false
}) => {
  const [type, setType] = useState<'send' | 'request' | 'add'>('send');
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [step, setStep] = useState<'input' | 'review' | 'verify' | 'processing' | 'success'>('input');
  const [isVerifying, setIsVerifying] = useState(false);
  const [dailyTransfers, setDailyTransfers] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  
  // Progress State
  const [transferProgress, setTransferProgress] = useState(0);
  const [networkStatus, setNetworkStatus] = useState("Initializing...");
  const [showMiniSuccess, setShowMiniSuccess] = useState(false);

  // Add Funds Specific State
  const [addMethod, setAddMethod] = useState<'visa' | 'bank' | 'interac' | null>(null);
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvc: '', name: '' });
  const [bankStep, setBankStep] = useState<'select' | 'login'>('select');
  const [selectedBank, setSelectedBank] = useState<typeof CANADIAN_BANKS[0] | null>(null);
  const [bankCreds, setBankCreds] = useState({ card: '', password: '' });
  const [interacEmail, setInteracEmail] = useState('');
  const [interacAutodeposit, setInteracAutodeposit] = useState(true);

  // Biometric & Camera State
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  // Retrieve current user avatar for visualization (mock or from props if available context, using placeholder for now)
  // In a real app, pass currentUser as prop. Here we assume we can get it or use a placeholder.
  const currentUserAvatar = "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop"; // Placeholder or User prop

  useEffect(() => {
      const stored = localStorage.getItem('inxs_daily_transfers');
      if (stored) {
          const { date, count } = JSON.parse(stored);
          const today = new Date().toDateString();
          if (date === today) {
              setDailyTransfers(count);
          } else {
              setDailyTransfers(0);
              localStorage.setItem('inxs_daily_transfers', JSON.stringify({ date: today, count: 0 }));
          }
      }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount('');
      setNote('');
      setIsVerifying(false);
      setAddMethod(null);
      setBankStep('select');
      setSelectedBank(null);
      setInteracEmail('');
      setTransferProgress(0);
      setShowMiniSuccess(false);
      setType(initialType === 'request' ? 'request' : 'send');
    } else {
        stopCamera();
    }
  }, [isOpen, initialType]);

  useEffect(() => {
      if (step === 'verify') {
          startCamera();
      } else {
          stopCamera();
      }
      return () => stopCamera();
  }, [step]);

  // Handle Processing Simulation
  useEffect(() => {
      if (step === 'processing') {
          let progress = 0;
          const interval = setInterval(() => {
              // Non-linear progress for realism
              const increment = Math.random() * 4 + 1; 
              progress += increment;
              
              if (progress > 100) progress = 100;
              setTransferProgress(progress);

              // Update Network Status Text
              if (progress < 20) setNetworkStatus("Resolving Destination Node...");
              else if (progress < 40) setNetworkStatus("Establishing P2P Handshake...");
              else if (progress < 60) setNetworkStatus("Encrypting Payload [AES-256]...");
              else if (progress < 80) setNetworkStatus("Broadcasting to [in.xs] Ledger...");
              else if (progress < 100) setNetworkStatus("Verifying Block Confirmation...");
              else setNetworkStatus("Transaction Finalized.");

              if (progress === 100) {
                  clearInterval(interval);
                  soundService.play('success');
                  setShowMiniSuccess(true);
                  setTimeout(() => {
                      setShowMiniSuccess(false);
                      setStep('success');
                      
                      // Finalize Logic
                      if (type === 'send') {
                        const newCount = dailyTransfers + 1;
                        setDailyTransfers(newCount);
                        const today = new Date().toDateString();
                        localStorage.setItem('inxs_daily_transfers', JSON.stringify({ date: today, count: newCount }));
                      }
                      onConfirm(parseFloat(amount), note, type);
                  }, 1500); // Show mini success for 1.5s
              }
          }, 80); // Speed of update
          return () => clearInterval(interval);
      }
  }, [step]);

  const startCamera = async () => {
      try {
          const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
          setCameraStream(stream);
          if (videoRef.current) {
              videoRef.current.srcObject = stream;
          }
      } catch (err) {
          console.error("Camera initialization failed:", err);
      }
  };

  const stopCamera = () => {
      if (cameraStream) {
          cameraStream.getTracks().forEach(track => track.stop());
          setCameraStream(null);
      }
  };

  const handleNext = () => {
    const num = parseFloat(amount);
    
    if (isNaN(num) || num < 5.00 || num > 40.00) {
        soundService.play('error');
        alert("Transaction amount must be between $5.00 and $40.00 CAD.");
        return;
    }

    if (type === 'send' && num > currentBalance) {
        soundService.play('error');
        alert("Insufficient reserves.");
        return;
    }

    if (type === 'send' && dailyTransfers >= 3) {
        soundService.play('error');
        alert("Daily transfer limit (3) reached.");
        return;
    }

    if (type === 'add') {
        if (!addMethod) {
            soundService.play('error');
            alert("Please select a funding source.");
            return;
        }
        if (addMethod === 'visa' && (!cardDetails.number || !cardDetails.cvc)) {
            soundService.play('error');
            alert("Please enter valid card details.");
            return;
        }
        if (addMethod === 'bank' && !selectedBank) {
             soundService.play('error');
             alert("Please connect a bank account.");
             return;
        }
        if (addMethod === 'interac' && !interacEmail.includes('@')) {
            soundService.play('error');
            alert("Please enter a valid email for e-Transfer.");
            return;
        }
    }

    soundService.play('click');
    setStep('review');
  };

  const handleVerify = async () => {
    soundService.play('scan');
    setIsVerifying(true);
    
    try {
        if (biometricRequired && window.PublicKeyCredential) {
            const challenge = new Uint8Array(32);
            window.crypto.getRandomValues(challenge);

            await navigator.credentials.create({
                publicKey: {
                    challenge,
                    rp: { name: "in.xs Secure Transfer", id: window.location.hostname },
                    user: {
                        id: new Uint8Array(16),
                        name: "Transfer Authorization",
                        displayName: "Transfer Authorization"
                    },
                    pubKeyCredParams: [{ alg: -7, type: "public-key" }],
                    authenticatorSelection: { 
                        authenticatorAttachment: "platform", 
                        userVerification: "required" 
                    },
                    timeout: 60000,
                    attestation: "direct"
                }
            });
        } else {
            await new Promise(resolve => setTimeout(resolve, 2500));
        }

        stopCamera();
        setIsVerifying(false);
        // Transition to Processing Step instead of Success directly
        setStep('processing');
        soundService.play('unlock');

    } catch (e) {
        console.error("Biometric failed or cancelled", e);
        setIsVerifying(false);
        soundService.play('error');
    }
  };

  const formatCardNumber = (val: string) => val.replace(/\D/g, '').slice(0, 16).replace(/(\d{4})(?=\d)/g, '$1 ');
  const formatExpiry = (val: string) => val.replace(/\D/g, '').slice(0, 4).replace(/(\d{2})(?=\d)/g, '$1/');

  const mainColor = type === 'send' ? 'xs-yellow' : (type === 'request' ? 'xs-cyan' : 'green-500');
  const bgGradient = type === 'send' 
    ? 'from-xs-yellow/20 via-black to-red-500/20' 
    : type === 'request' 
        ? 'from-xs-cyan/20 via-black to-blue-500/20'
        : 'from-green-500/20 via-black to-emerald-500/20';

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className={`w-full max-w-md bg-xs-dark border border-white/10 rounded-[3.5rem] p-10 shadow-4xl relative overflow-hidden preserve-3d bg-gradient-to-br ${bgGradient}`}>
        
        <button 
            onClick={() => setShowSettings(!showSettings)} 
            className="absolute top-8 left-8 p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500 hover:text-white transition-all z-20"
        >
            <ICONS.Settings size={20} />
        </button>

        {step !== 'success' && step !== 'processing' && (
            <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500 transition-all z-20">
                <ICONS.X size={20} />
            </button>
        )}

        {/* Settings Overlay */}
        {showSettings && (
            <div className="absolute inset-0 z-30 bg-black/95 p-8 animate-in fade-in flex flex-col">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-xl font-black text-white uppercase italic">Transfer Settings</h3>
                    <button onClick={() => setShowSettings(false)}><ICONS.X size={24} className="text-gray-500" /></button>
                </div>
                <div className="space-y-4 flex-1">
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-gray-300">Auto-Deposit</span>
                        <div className="w-10 h-5 bg-xs-cyan rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full"></div></div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                        <span className="text-xs font-bold text-gray-300">Biometric Confirm</span>
                        <div className="w-10 h-5 bg-green-500 rounded-full relative"><div className="absolute right-1 top-1 w-3 h-3 bg-black rounded-full"></div></div>
                    </div>
                </div>
                <div className="text-[8px] text-gray-500 font-mono text-center">
                    Authorized under FINTRAC & PCMLTFA guidelines.
                </div>
            </div>
        )}

        {step === 'input' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500 relative z-10">
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10 backdrop-blur-md">
                    <button 
                        onClick={() => { setType('send'); soundService.play('tab'); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${type === 'send' ? 'bg-xs-yellow text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Send
                    </button>
                    <button 
                        onClick={() => { setType('request'); soundService.play('tab'); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${type === 'request' ? 'bg-xs-cyan text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Request
                    </button>
                    <button 
                        onClick={() => { setType('add'); soundService.play('tab'); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${type === 'add' ? 'bg-green-500 text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Add Funds
                    </button>
                </div>

                <div className="text-center space-y-4">
                    {type === 'add' ? (
                        <div className="w-20 h-20 mx-auto rounded-full p-4 bg-white/5 border-2 border-green-500/50 flex items-center justify-center">
                            <ICONS.Landmark size={32} className="text-green-500" />
                        </div>
                    ) : (
                        <div className={`w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-${mainColor} to-black shadow-xl`}>
                            <img src={recipientAvatar} className="w-full h-full rounded-full object-cover border-2 border-xs-dark" alt="Recipient" />
                        </div>
                    )}
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">
                            {type === 'send' ? 'Transfer' : (type === 'request' ? 'Request' : 'Add Funds')}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">
                            {type === 'add' ? 'Secure Banking Link' : (type === 'request' ? `From: ${recipientName}` : `To: ${recipientName}`)}
                        </p>
                    </div>
                </div>

                <div className="space-y-2">
                    <div className="relative group">
                        <div className={`absolute left-6 top-1/2 -translate-y-1/2 text-${mainColor} font-black text-2xl group-focus-within:animate-pulse`}>$</div>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); soundService.play('typing'); }}
                            placeholder="0.00"
                            className={`w-full bg-black/60 border border-white/10 rounded-3xl py-8 pl-14 pr-8 text-white text-5xl font-black italic outline-none focus:border-${mainColor} transition-all placeholder-gray-800 tracking-tighter`}
                        />
                        <div className="absolute bottom-4 right-8 text-[9px] font-mono text-gray-600 uppercase tracking-widest">CAD</div>
                    </div>
                    <p className="text-center text-[9px] text-gray-500 font-mono uppercase">Min $5.00 • Max $40.00</p>
                </div>

                {type === 'add' ? (
                    <div className="space-y-3">
                        {addMethod === null ? (
                            <div className="grid grid-cols-3 gap-2">
                                <button onClick={() => { setAddMethod('visa'); soundService.play('click'); }} className="p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 hover:border-green-500/50 transition-all">
                                    <ICONS.CreditCard size={20} className="text-green-500" />
                                    <span className="text-[8px] font-black uppercase text-gray-400">Visa Debit</span>
                                </button>
                                <button onClick={() => { setAddMethod('bank'); soundService.play('click'); }} className="p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 hover:border-green-500/50 transition-all">
                                    <ICONS.Landmark size={20} className="text-green-500" />
                                    <span className="text-[8px] font-black uppercase text-gray-400">Bank</span>
                                </button>
                                <button onClick={() => { setAddMethod('interac'); soundService.play('click'); }} className="p-3 bg-white/5 border border-white/10 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-white/10 hover:border-green-500/50 transition-all">
                                    <ICONS.Smartphone size={20} className="text-green-500" />
                                    <span className="text-[8px] font-black uppercase text-gray-400">Interac</span>
                                </button>
                            </div>
                        ) : (
                            <div className="bg-black/40 border border-white/10 rounded-3xl p-4 animate-in slide-in-from-bottom-2">
                                <div className="flex justify-between items-center mb-4">
                                    <h4 className="text-[10px] font-black uppercase tracking-widest text-green-500">
                                        {addMethod === 'visa' ? 'Card_Details' : (addMethod === 'bank' ? 'Bank_Link' : 'e-Transfer_Setup')}
                                    </h4>
                                    <button onClick={() => { setAddMethod(null); soundService.play('click'); }} className="text-[9px] text-gray-500 hover:text-white uppercase font-bold">Change</button>
                                </div>
                                {addMethod === 'visa' && (
                                    <div className="space-y-3">
                                        <input type="text" placeholder="Card Number" value={cardDetails.number} onChange={(e) => setCardDetails({...cardDetails, number: formatCardNumber(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-green-500" />
                                        <div className="flex gap-3">
                                            <input type="text" placeholder="MM/YY" value={cardDetails.expiry} onChange={(e) => setCardDetails({...cardDetails, expiry: formatExpiry(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-green-500 text-center" />
                                            <input type="text" placeholder="CVC" value={cardDetails.cvc} onChange={(e) => setCardDetails({...cardDetails, cvc: e.target.value.replace(/\D/g,'').slice(0,3)})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white font-mono outline-none focus:border-green-500 text-center" />
                                        </div>
                                    </div>
                                )}
                                {addMethod === 'bank' && (
                                    <>
                                        {bankStep === 'select' ? (
                                            <div className="grid grid-cols-2 gap-2">
                                                {CANADIAN_BANKS.map(bank => (
                                                    <button key={bank.id} onClick={() => { setSelectedBank(bank); setBankStep('login'); soundService.play('click'); }} className="p-3 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2 hover:bg-white/10 transition-all">
                                                        <div className={`w-6 h-6 rounded-full ${bank.color} flex items-center justify-center text-white`}><bank.icon size={12} /></div>
                                                        <span className="text-[8px] font-black uppercase text-gray-300 truncate">{bank.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="space-y-3">
                                                <div className="flex items-center gap-2 mb-2 p-2 bg-white/5 rounded-lg">
                                                    <div className={`w-6 h-6 rounded-full ${selectedBank?.color} flex items-center justify-center text-white`}><ICONS.Lock size={12} /></div>
                                                    <span className="text-[9px] font-black text-white uppercase">{selectedBank?.name} Secure Login</span>
                                                </div>
                                                <input type="text" placeholder="Card / Username" value={bankCreds.card} onChange={e => setBankCreds({...bankCreds, card: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500" />
                                                <input type="password" placeholder="Password" value={bankCreds.password} onChange={e => setBankCreds({...bankCreds, password: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500" />
                                            </div>
                                        )}
                                    </>
                                )}
                                {addMethod === 'interac' && (
                                    <div className="space-y-4">
                                        <input type="email" placeholder="email@provider.com" value={interacEmail} onChange={e => setInteracEmail(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-green-500" />
                                        <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
                                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Enable Autodeposit</span>
                                            <button onClick={() => setInteracAutodeposit(!interacAutodeposit)} className={`w-10 h-5 rounded-full relative transition-all ${interacAutodeposit ? 'bg-green-500' : 'bg-gray-700'}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${interacAutodeposit ? 'left-6' : 'left-1'}`}></div>
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ) : (
                    <input 
                        type="text" value={note} onChange={(e) => { setNote(e.target.value); soundService.play('typing'); }}
                        placeholder={`Add memo / Bill splitting note...`}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-gray-300 italic outline-none focus:border-xs-purple transition-all text-sm placeholder-gray-700"
                    />
                )}

                <div className="flex justify-between items-center px-4 p-3 bg-white/5 rounded-xl">
                    <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Available Reserves</span>
                    <span className="text-sm font-black text-white italic">${currentBalance.toFixed(2)} CAD</span>
                </div>

                <button onClick={handleNext} className={`w-full py-6 bg-${mainColor} text-black rounded-3xl font-black text-xl uppercase tracking-[0.4em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all`}>
                    Review
                </button>
                {type === 'send' && <p className="text-center text-[9px] text-gray-600 font-mono">Daily Transfers: {dailyTransfers}/3</p>}
            </div>
        )}

        {step === 'review' && (
            <div className="space-y-8 py-4 animate-in slide-in-from-right-10 duration-500">
                <div className="text-center">
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-1">Confirm</h3>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">Review Transaction Details</p>
                </div>
                <div className="bg-black/60 border border-white/10 rounded-3xl p-6 space-y-4">
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Type</span>
                        <span className={`text-sm font-black uppercase tracking-wider text-${mainColor}`}>{type === 'add' ? 'Deposit' : type}</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Amount</span>
                        <span className="text-xl font-black text-white italic">${parseFloat(amount).toFixed(2)}</span>
                    </div>
                    {type !== 'add' && (
                        <div className="flex justify-between items-center border-b border-white/10 pb-4">
                            <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">{type === 'request' ? 'From' : 'To'}</span>
                            <span className="text-sm font-bold text-white">{recipientName}</span>
                        </div>
                    )}
                    <div className="flex justify-between items-center pt-2">
                        <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">Total</span>
                        <span className={`text-2xl font-black italic text-${mainColor}`}>${parseFloat(amount).toFixed(2)} CAD</span>
                    </div>
                </div>
                <div className="flex gap-4">
                    <button onClick={() => setStep('input')} className="flex-1 py-4 bg-white/5 text-gray-400 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:text-white transition-all">Back</button>
                    <button onClick={() => setStep('verify')} className={`flex-[2] py-4 bg-${mainColor} text-black rounded-2xl font-black uppercase text-sm tracking-widest shadow-lg hover:scale-[1.02] active:scale-95 transition-all`}>
                        {type === 'send' ? 'Send Funds' : (type === 'request' ? 'Request' : 'Confirm Deposit')}
                    </button>
                </div>
            </div>
        )}

        {step === 'verify' && (
            <div className="space-y-10 py-4 animate-in zoom-in-95 duration-500 relative flex flex-col items-center justify-center h-full min-h-[400px]">
                {/* Camera Background with Colorful Overlay */}
                <div className="absolute inset-0 rounded-[3rem] overflow-hidden z-0">
                    <video 
                        ref={videoRef}
                        autoPlay 
                        muted 
                        playsInline 
                        className="w-full h-full object-cover filter contrast-125 brightness-110"
                    />
                    {/* Colorful Tint based on type */}
                    <div className={`absolute inset-0 bg-gradient-to-b from-${mainColor}/20 via-transparent to-black/80 mix-blend-overlay`}></div>
                    {/* Scanlines & Grid */}
                    <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjEiIGhlaWdodD0iMSIgZmlsbD0icmdiYSgyNTUsMjU1LDI1NSwwLjEpIi8+PC9saW5lYXJHcmFkaWVudD48L3N2Zz4=')] opacity-20"></div>
                    <div className={`absolute inset-0 bg-gradient-to-b from-transparent via-${mainColor}/10 to-transparent h-1/2 w-full animate-scan`}></div>
                </div>

                <div className="relative z-10 text-center space-y-6">
                     <div className="relative w-40 h-40 mx-auto flex items-center justify-center">
                         {/* Rotating Colored Rings */}
                         <div className={`absolute inset-0 border-4 border-${mainColor} rounded-full animate-spin-slow opacity-80 shadow-[0_0_30px_rgba(var(--${mainColor}-rgb),0.6)]`}></div>
                         <div className={`absolute inset-2 border-2 border-dashed border-white rounded-full animate-spin reverse opacity-50`}></div>
                         
                         {/* Fingerprint / Face Icon */}
                         <button 
                            onClick={handleVerify}
                            disabled={isVerifying}
                            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 transition-all hover:scale-105 active:scale-95 group backdrop-blur-md bg-black/30 border border-white/20 relative overflow-hidden`}
                         >
                            {isVerifying ? (
                                <ICONS.Sparkles size={40} className={`text-${mainColor} animate-spin`} />
                            ) : (
                                <>
                                    <ICONS.Fingerprint size={48} className={`text-gray-300 group-hover:text-${mainColor} transition-colors`} />
                                    <span className="text-[7px] font-black uppercase text-white tracking-[0.2em] bg-black/50 px-2 py-0.5 rounded mt-1">TAP TO AUTH</span>
                                </>
                            )}
                         </button>
                     </div>
                     
                     <div>
                         <h3 className="text-4xl font-black italic tracking-tighter uppercase text-white drop-shadow-[0_2px_10px_rgba(0,0,0,0.8)]">
                            Confirm
                         </h3>
                         <p className={`text-[10px] font-black uppercase tracking-[0.4em] text-${mainColor} bg-black/60 px-3 py-1 rounded-full backdrop-blur-md inline-block mt-2 border border-${mainColor}/30`}>
                            {isVerifying ? 'VERIFYING_BIOMETRICS...' : 'IDENTITY_SCAN_READY'}
                         </p>
                     </div>
                </div>
            </div>
        )}

        {/* NEW PROCESSING STEP */}
        {step === 'processing' && (
            <div className="space-y-8 py-6 animate-in zoom-in-95 duration-500 relative flex flex-col items-center justify-center h-full">
                <div className="text-center mb-4">
                    <h3 className="text-3xl font-black italic tracking-tighter uppercase text-white">Transferring...</h3>
                    <p className="text-[9px] font-mono text-xs-cyan uppercase tracking-[0.3em] animate-pulse mt-1">{networkStatus}</p>
                </div>

                {/* Network Visualization */}
                <div className="relative w-full px-4 flex items-center justify-between">
                    {/* User Node */}
                    <div className="relative flex flex-col items-center gap-2 z-10">
                        <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative overflow-hidden">
                            <img src={currentUserAvatar} className="w-full h-full object-cover opacity-80" alt="Sender" />
                            <div className="absolute inset-0 bg-gradient-to-t from-xs-purple/50 to-transparent"></div>
                        </div>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded">Origin</span>
                    </div>

                    {/* Connecting Line & Data Packet */}
                    <div className="flex-1 h-1 bg-white/10 relative mx-4 rounded-full overflow-visible">
                        {/* Static dotted line */}
                        <div className="absolute inset-0 border-b border-dashed border-white/20"></div>
                        {/* Progress fill */}
                        <div className={`absolute top-0 left-0 h-full bg-${mainColor} shadow-[0_0_10px_rgba(var(--${mainColor}-rgb),0.8)] transition-all duration-100 ease-linear`} style={{ width: `${transferProgress}%` }}></div>
                        {/* Data Packet Icon */}
                        <div 
                            className="absolute top-1/2 -translate-y-1/2 transition-all duration-100 ease-linear z-20"
                            style={{ left: `${transferProgress}%` }}
                        >
                            <div className={`p-2 bg-black rounded-full border border-${mainColor} shadow-[0_0_15px_rgba(var(--${mainColor}-rgb),0.6)]`}>
                                <ICONS.Zap size={14} className={`text-${mainColor}`} />
                            </div>
                        </div>
                    </div>

                    {/* Recipient Node */}
                    <div className="relative flex flex-col items-center gap-2 z-10">
                        <div className="w-16 h-16 rounded-2xl bg-black border border-white/20 shadow-[0_0_20px_rgba(255,255,255,0.1)] relative overflow-hidden">
                            <img src={recipientAvatar} className="w-full h-full object-cover opacity-80" alt="Receiver" />
                            <div className="absolute inset-0 bg-gradient-to-t from-xs-cyan/50 to-transparent"></div>
                        </div>
                        <span className="text-[8px] font-black text-white uppercase tracking-widest bg-black/60 px-2 py-0.5 rounded">Dest.</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full max-w-[200px] mt-8 space-y-2">
                    <div className="flex justify-between text-[8px] font-mono text-gray-500 uppercase tracking-widest">
                        <span>Progress</span>
                        <span>{Math.floor(transferProgress)}%</span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                        <div 
                            className={`h-full bg-${mainColor} shadow-[0_0_15px_rgba(var(--${mainColor}-rgb),0.8)] transition-all duration-100 ease-linear`}
                            style={{ width: `${transferProgress}%` }}
                        ></div>
                    </div>
                </div>

                {/* Mini Pop-Up Simulation (Toast) */}
                {showMiniSuccess && (
                    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 px-6 py-3 bg-white text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.5)] flex items-center gap-3 animate-in slide-in-from-bottom-4 zoom-in duration-300 z-50">
                        <ICONS.CheckCircle size={18} className="text-green-600" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Transaction_Complete</span>
                    </div>
                )}
            </div>
        )}

        {step === 'success' && (
            <div className="space-y-10 py-4 animate-in zoom-in-95 duration-700">
                <div className={`w-24 h-24 mx-auto bg-green-500 rounded-full flex items-center justify-center shadow-4xl animate-bounce`}>
                    <ICONS.CheckCircle size={48} className="text-black" />
                </div>
                <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                        {type === 'add' ? 'Funds Added' : (type === 'send' ? 'Funds Sent' : 'Request Sent')}
                    </h3>
                    <div className={`p-6 bg-black/40 rounded-3xl border border-${mainColor}/20`}>
                        <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Transaction Authorized</p>
                        <p className={`text-5xl font-black text-${mainColor} italic tracking-tighter`}>${amount}</p>
                    </div>
                    {type === 'add' && addMethod === 'interac' && (
                        <div className="bg-white/5 p-4 rounded-xl border border-white/10">
                            <p className="text-[9px] text-gray-400 font-bold uppercase mb-2">Instructions</p>
                            <p className="text-xs text-white leading-relaxed">Autodeposit enabled. Please send e-Transfer to <span className="text-green-500 font-mono">transfer@in.xs.io</span> using your banking app. Use security answer: <span className="text-green-500 font-mono">inxs</span></p>
                        </div>
                    )}
                    <div className="flex flex-col items-center gap-1">
                        <p className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">REF_ID: {Math.random().toString(36).substr(2, 10).toUpperCase()}</p>
                        <p className="text-[8px] text-gray-700 font-mono uppercase">Bank_Node: TD_CANADA_TRUST_MOCK</p>
                    </div>
                </div>
                <button onClick={onClose} className="w-full py-6 bg-white text-black rounded-3xl font-black text-xl uppercase tracking-[0.4em] shadow-4xl active:scale-95 transition-all">Close_Vault</button>
            </div>
        )}

        <div className="absolute bottom-4 left-0 right-0 text-center pointer-events-none z-20">
            <p className="text-[6px] text-gray-700 font-mono uppercase tracking-widest opacity-50">
                Regulated by FINTRAC • Canada Banking Standards V2.0 • PCMLTFA Compliant
            </p>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;
