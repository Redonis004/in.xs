
import React, { useState, useRef, useEffect } from 'react';
import Card3D from '../components/Card3D';
import ShareMenu from '../components/ShareMenu';
import { ICONS, SAMPLE_POSTS, APP_LOGO } from '../constants';
import { User, Post, Report, MediaItem } from '../types';
import { soundService } from '../services/soundService';
import { chatWithUnhingedAI, synthesizeSpeech, getAiClient, decodeBase64, decodeAudioData, encodeBase64 } from '../services/geminiService';
import { Modality } from '@google/genai';

interface FeedProps {
  user: User;
  onReport: (report: Report) => void;
}

const AudioPlayer = ({ url, username, avatar, compact = false }: { url: string, username: string, avatar: string, compact?: boolean }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    // Sync with Native Phone Music Player
    const updateMediaSession = () => {
        if ('mediaSession' in navigator && audioRef.current) {
            navigator.mediaSession.metadata = new MediaMetadata({
                title: 'Scene Frequency',
                artist: username,
                album: 'in.xs Audio Feed',
                artwork: [
                    { src: avatar, sizes: '512x512', type: 'image/png' },
                ]
            });

            navigator.mediaSession.setActionHandler('play', () => audioRef.current?.play());
            navigator.mediaSession.setActionHandler('pause', () => audioRef.current?.pause());
            navigator.mediaSession.setActionHandler('seekbackward', () => { if(audioRef.current) audioRef.current.currentTime -= 10; });
            navigator.mediaSession.setActionHandler('seekforward', () => { if(audioRef.current) audioRef.current.currentTime += 10; });
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        
        soundService.play('click');

        if (isPlaying) {
            audioRef.current.pause();
            soundService.play('lock');
        } else {
            audioRef.current.play();
            soundService.play('unlock');
            updateMediaSession();
        }
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (audioRef.current) {
            const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
            setProgress(p);
            
            if ('mediaSession' in navigator && isPlaying) {
                navigator.mediaSession.setPositionState({
                    duration: audioRef.current.duration || 0,
                    playbackRate: audioRef.current.playbackRate,
                    position: audioRef.current.currentTime
                });
            }
        }
    };

    return (
        <div className={`relative w-full ${compact ? 'py-3 px-4' : 'py-6 px-8'} glass-panel rounded-[2.5rem] border-xs-cyan/20 group overflow-hidden`}>
            <audio ref={audioRef} src={url} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} className="hidden" />
            
            <div className="absolute inset-x-0 bottom-0 top-1/2 flex items-end justify-center gap-1 opacity-10 pointer-events-none">
                {[...Array(compact ? 10 : 20)].map((_, i) => (
                    <div 
                        key={i} 
                        className={`w-1 bg-xs-cyan rounded-full transition-all duration-300 ${isPlaying ? 'animate-bounce' : 'h-1'}`}
                        style={{ 
                            height: isPlaying ? `${20 + Math.random() * 80}%` : '5px',
                            animationDelay: `${i * 0.05}s`
                        }}
                    ></div>
                ))}
            </div>

            <div className="relative z-10 flex items-center gap-4">
                <button 
                    onClick={togglePlay}
                    className={`${compact ? 'w-10 h-10' : 'w-16 h-16'} rounded-2xl bg-gradient-to-tr from-xs-cyan to-xs-purple flex items-center justify-center text-black shadow-[0_0_20px_rgba(0,255,255,0.4)] hover:scale-110 active:scale-90 transition-all`}
                >
                    {isPlaying ? <ICONS.Pause size={compact ? 18 : 28} /> : <ICONS.Play size={compact ? 18 : 28} className="ml-1" />}
                </button>

                <div className="flex-1 space-y-2">
                    {!compact && (
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-xs-cyan uppercase tracking-[0.3em] italic">Audio_Fragment.mp3</span>
                            <ICONS.Volume2 size={14} className={isPlaying ? "text-xs-cyan animate-pulse" : "text-gray-500"} />
                        </div>
                    )}
                    
                    <div className="relative h-2 bg-white/10 rounded-full overflow-hidden border border-white/5">
                        <div 
                            className="absolute top-0 left-0 h-full bg-gradient-to-r from-xs-cyan via-xs-purple to-xs-pink shadow-[0_0_10px_rgba(0,255,255,0.8)] transition-all duration-100"
                            style={{ width: `${progress}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PostMediaGallery = ({ media, username, userAvatar }: { media: MediaItem[], username: string, userAvatar: string }) => {
    if (!media || media.length === 0) return null;

    // Single Media
    if (media.length === 1) {
        const item = media[0];
        if (item.type === 'image') {
            return (
                <div className="rounded-[3.5rem] overflow-hidden mb-8 shadow-[0_30px_80px_rgba(0,0,0,0.8)] border border-white/5 relative group/img">
                    <img src={item.url} className="w-full h-[550px] object-cover transition-transform duration-[2000ms] group-hover/img:scale-110 cursor-pointer" alt="Post" />
                </div>
            );
        } else {
            return (
                <div className="mb-8 px-2">
                    <AudioPlayer url={item.url} username={username} avatar={userAvatar} />
                </div>
            );
        }
    }

    // Smart Grid for 2-4 Images (if all are images)
    const allImages = media.every(m => m.type === 'image');
    if (allImages && media.length <= 4) {
        let gridConfig = "grid-cols-2";
        if (media.length === 3) gridConfig = "grid-cols-2 grid-rows-2";
        if (media.length === 4) gridConfig = "grid-cols-2 grid-rows-2";

        return (
            <div className={`grid ${gridConfig} gap-1 h-[500px] rounded-[2.5rem] overflow-hidden border border-white/5 relative mb-8 shadow-[0_30px_80px_rgba(0,0,0,0.8)]`}>
                {media.map((item, idx) => (
                    <div 
                        key={idx} 
                        className={`relative group/img overflow-hidden cursor-pointer ${media.length === 3 && idx === 0 ? 'row-span-2' : ''}`}
                    >
                        <img src={item.url} className="w-full h-full object-cover transition-transform duration-700 group-hover/img:scale-110" alt={`Post ${idx}`} />
                    </div>
                ))}
            </div>
        );
    }

    // Carousel for Mixed Media or > 4 items
    return (
        <div className="flex gap-4 overflow-x-auto pb-6 mb-2 custom-scrollbar snap-x snap-mandatory px-1">
            {media.map((item, idx) => (
                <div key={idx} className="flex-shrink-0 w-full sm:w-[85%] snap-center">
                    {item.type === 'image' ? (
                        <div className="rounded-[2.5rem] overflow-hidden border border-white/5 relative aspect-[4/5] shadow-2xl group/slide">
                             <img src={item.url} className="w-full h-full object-cover transition-transform duration-1000 group-hover/slide:scale-105" alt={`Slide ${idx}`} />
                             <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full text-[10px] font-black uppercase text-white tracking-widest border border-white/10">
                                {idx + 1} / {media.length}
                             </div>
                        </div>
                    ) : (
                        <div className="h-full flex items-center p-2">
                             <AudioPlayer url={item.url} username={username} avatar={userAvatar} />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const NeuralOrb = ({ onClick, isLive, isThinking, isSpeaking }: { onClick: () => void, isLive: boolean, isThinking: boolean, isSpeaking: boolean }) => (
  <div className="relative group cursor-pointer perspective-[1000px]" onClick={onClick}>
    <div className={`relative w-20 h-20 transition-all duration-700 ${isLive ? 'scale-110' : 'hover:scale-110'}`}>
      <div className={`absolute inset-[-15px] rounded-full blur-2xl transition-all duration-1000 ${
        isLive ? (isSpeaking ? 'bg-xs-pink/40 animate-pulse' : (isThinking ? 'bg-xs-purple/40 animate-pulse' : 'bg-xs-cyan/40 animate-pulse')) : 'bg-xs-cyan/5 group-hover:bg-xs-cyan/20'
      }`}></div>
      
      <Card3D 
        glowColor={isLive ? (isSpeaking ? 'pink' : 'purple') : 'cyan'} 
        variant="circle"
        className="w-full h-full"
        innerClassName="p-0 flex items-center justify-center bg-black/60 border-white/20 overflow-visible"
      >
        <div className="relative w-full h-full flex items-center justify-center overflow-hidden rounded-full">
            <div className={`absolute inset-0 transition-all duration-1000 ${isLive ? 'opacity-100' : 'opacity-20'} bg-gradient-to-tr from-xs-black via-xs-dark to-black`}></div>
            <div className={`absolute w-[80%] h-[80%] border border-xs-cyan/20 rounded-full transition-all duration-1000 ${isLive ? 'rotate-180 animate-spin-slow scale-110' : 'scale-90 opacity-0'}`}></div>
            <div className={`absolute w-[60%] h-[60%] border border-xs-purple/30 rounded-full transition-all duration-1000 ${isLive ? '-rotate-180 animate-spin-slow scale-125' : 'scale-90 opacity-0'}`} style={{animationDirection: 'reverse'}}></div>

            <div className="relative z-10 transition-transform duration-500 group-hover:scale-125">
               {isLive ? (
                 isThinking ? <ICONS.Sparkles size={32} className="text-xs-purple animate-spin" /> : 
                 (isSpeaking ? <ICONS.Volume2 size={32} className="text-xs-pink animate-bounce" /> : <ICONS.Mic size={32} className="text-xs-cyan animate-pulse" />)
               ) : (
                 <ICONS.Zap size={32} className="text-xs-cyan group-hover:text-white transition-colors" />
               )}
            </div>

            {isLive && !isThinking && (
              <div className="absolute bottom-4 flex gap-0.5 items-end h-6">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className={`w-1 bg-white/40 rounded-full animate-bounce`} style={{ 
                    height: `${20 + Math.random() * 60}%`,
                    animationDelay: `${i * 0.1}s`,
                    animationDuration: isSpeaking ? '0.4s' : '1s'
                  }}></div>
                ))}
              </div>
            )}
        </div>
      </Card3D>
    </div>
  </div>
);

const Feed: React.FC<FeedProps> = ({ user, onReport }) => {
  const [posts, setPosts] = useState<Post[]>(SAMPLE_POSTS);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [newPostMedia, setNewPostMedia] = useState<MediaItem[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const [activeMenuPostId, setActiveMenuPostId] = useState<string | null>(null);
  
  const [showGrok, setShowGrok] = useState(false);
  const [showAiSettings, setShowAiSettings] = useState(false);
  const [grokLoading, setGrokLoading] = useState(false);
  const [grokInput, setGrokInput] = useState('');
  const [grokHistory, setGrokHistory] = useState<{role: string, text: string}[]>([]);
  const [speakingId, setSpeakingId] = useState<number | null>(null);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [isModelSpeaking, setIsModelSpeaking] = useState(false);
  const [isModelThinking, setIsModelThinking] = useState(false);
  
  const [isTakingPhoto, setIsTakingPhoto] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [aiSettings, setAiSettings] = useState({
    voice: 'Fenrir',
    autoSpeak: true,
    persona: 'Assertive',
  });

  const grokEndRef = useRef<HTMLDivElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const liveSessionRef = useRef<any>(null);
  const activeSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLike = (id: string) => {
    soundService.play(posts.find(p => p.id === id)?.isLiked ? 'lock' : 'pop');
    setPosts(prevPosts => prevPosts.map(post => 
      post.id === id 
        ? { ...post, likes: post.isLiked ? post.likes - 1 : post.likes + 1, isLiked: !post.isLiked }
        : post
    ));
  };

  const handleCreatePost = () => {
      if (!newPostContent.trim() && newPostMedia.length === 0) return;
      
      const newPost: Post = {
          id: Date.now().toString(),
          userId: user.id,
          username: user.username,
          userAvatar: user.avatarUrl,
          content: newPostContent,
          // Support for single legacy view
          imageUrl: newPostMedia.find(m => m.type === 'image')?.url,
          audioUrl: newPostMedia.find(m => m.type === 'audio')?.url,
          media: newPostMedia, // Full array
          likes: 0,
          timestamp: Date.now(),
          isLiked: false,
          comments: []
      };

      setPosts([newPost, ...posts]);
      setNewPostContent('');
      setNewPostMedia([]);
      setShowCreatePost(false);
      soundService.play('success');
  };

  const handleHidePost = (id: string) => {
    soundService.play('lock');
    setPosts(posts.filter(p => p.id !== id));
    setActiveMenuPostId(null);
  };

  const handleReportPost = (post: Post) => {
    soundService.play('error');
    onReport({
      id: Date.now().toString(),
      targetId: post.id,
      targetType: 'post',
      reason: 'User Reported',
      reporterId: user.id,
      status: 'pending',
      timestamp: Date.now()
    });
    alert(`Post by ${post.username} reported to Neural Moderators.`);
    setActiveMenuPostId(null);
  };

  const handleCopyLink = () => {
    soundService.play('success');
    alert("Post Link Copied to Clipboard.");
    setActiveMenuPostId(null);
  };

  const processFiles = (files: FileList) => {
      if (!files || files.length === 0) return;

      setIsUploading(true);
      soundService.play('scan');

      const filePromises = Array.from(files).map(file => {
          return new Promise<MediaItem>((resolve) => {
              const reader = new FileReader();
              reader.onload = (event) => {
                  const url = event.target?.result as string;
                  const type = file.type.startsWith('image/') ? 'image' : 'audio';
                  resolve({ url, type });
              };
              reader.readAsDataURL(file);
          });
      });

      Promise.all(filePromises).then(newItems => {
          setNewPostMedia(prev => [...prev, ...newItems]);
          setIsUploading(false);
          soundService.play('success');
          if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) processFiles(e.target.files);
  };

  const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
          processFiles(e.dataTransfer.files);
      }
  };

  const removeMediaItem = (index: number) => {
      soundService.play('trash');
      setNewPostMedia(prev => prev.filter((_, i) => i !== index));
  };

  const startCamera = async () => {
    try {
      soundService.play('click');
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      setCameraStream(stream);
      setIsTakingPhoto(true);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Camera access failed", err);
      alert("Please grant camera access in your browser settings.");
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsTakingPhoto(false);
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        // Add to array instead of replacing
        setNewPostMedia(prev => [...prev, { url: dataUrl, type: 'image' }]);
        soundService.play('camera');
        stopCamera();
        setShowCreatePost(true);
      }
    }
  };

  const stopAllAudio = () => {
    activeSourcesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    activeSourcesRef.current.clear();
    nextStartTimeRef.current = 0;
    setIsModelSpeaking(false);
  };

  const handleSpeak = async (text: string, index: number, silent: boolean = false) => {
    if (!silent && speakingId !== null) return;
    if (!silent) setSpeakingId(index);
    
    const buffer = await synthesizeSpeech(text, aiSettings.voice);
    if (!buffer) {
        if (!silent) setSpeakingId(null);
        return;
    }

    if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    const source = audioContextRef.current.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContextRef.current.destination);
    source.onended = () => { 
        if (!silent) setSpeakingId(null); 
        activeSourcesRef.current.delete(source);
    };
    activeSourcesRef.current.add(source);
    source.start();

    // Native Integration for AI Voice
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: 'Grok Unhinged Response',
            artist: 'in.xs Neural AI',
            artwork: [{ src: APP_LOGO, sizes: '512x512', type: 'image/svg+xml' }]
        });
    }
  };

  const handleGrokMessage = async () => {
    if (!grokInput.trim()) return;
    const msg = grokInput;
    setGrokInput('');
    setGrokHistory(prev => [...prev, { role: 'user', text: msg }]);
    setGrokLoading(true);
    soundService.play('send');

    const reply = await chatWithUnhingedAI(msg, grokHistory, aiSettings.persona);
    const newHistory = [...grokHistory, { role: 'assistant', text: reply }];
    setGrokHistory(newHistory);
    setGrokLoading(false);
    
    if (aiSettings.autoSpeak) {
      handleSpeak(reply, newHistory.length - 1);
    } else {
      soundService.play('pop');
    }
  };

  const startLiveMode = async () => {
    try {
      setIsLiveMode(true);
      soundService.play('unlock');
      
      const ai = getAiClient();
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const inputAudioContext = new AudioContext({ sampleRate: 16000 });
      const outputAudioContext = new AudioContext({ sampleRate: 24000 });
      audioContextRef.current = outputAudioContext;

      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        callbacks: {
          onopen: () => {
            console.log("Neural Link Established.");
            const source = inputAudioContext.createMediaStreamSource(stream);
            const scriptProcessor = inputAudioContext.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) int16[i] = inputData[i] * 32768;
              const pcmBlob = {
                data: encodeBase64(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000'
              };
              sessionPromise.then(session => session.sendRealtimeInput({ media: pcmBlob }));
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputAudioContext.destination);

            if ('mediaSession' in navigator) {
                navigator.mediaSession.metadata = new MediaMetadata({
                    title: 'Live Neural Sync',
                    artist: 'Grok Unhinged',
                    artwork: [{ src: APP_LOGO, sizes: '512x512', type: 'image/svg+xml' }]
                });
            }
          },
          onmessage: async (message) => {
            if (message.serverContent?.interrupted) {
              stopAllAudio();
              return;
            }

            if (message.serverContent?.outputTranscription) {
              const text = message.serverContent.outputTranscription.text;
              setGrokHistory(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'assistant') {
                  return [...prev.slice(0, -1), { role: 'assistant', text: last.text + text }];
                }
                return [...prev, { role: 'assistant', text }];
              });
            }

            if (message.serverContent?.inputTranscription) {
              const text = message.serverContent.inputTranscription.text;
               setGrokHistory(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === 'user') {
                  return [...prev.slice(0, -1), { role: 'user', text: last.text + text }];
                }
                return [...prev, { role: 'user', text }];
              });
            }

            const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (audioData) {
              setIsModelSpeaking(true);
              nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputAudioContext.currentTime);
              const buffer = await decodeAudioData(decodeBase64(audioData), outputAudioContext, 24000, 1);
              const source = outputAudioContext.createBufferSource();
              source.buffer = buffer;
              source.connect(outputAudioContext.destination);
              source.onended = () => {
                  activeSourcesRef.current.delete(source);
                  if (activeSourcesRef.current.size === 0) setIsModelSpeaking(false);
              };
              activeSourcesRef.current.add(source);
              source.start(nextStartTimeRef.current);
              nextStartTimeRef.current += buffer.duration;
            }

            if (message.serverContent?.turnComplete) {
                setIsModelThinking(false);
            } else if (message.serverContent) {
                setIsModelThinking(true);
            }
          },
          onclose: () => {
            setIsLiveMode(false);
            setIsModelThinking(false);
            setIsModelSpeaking(false);
          },
          onerror: (err) => {
            console.error("Neural Sync Error:", err);
            setIsLiveMode(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          // Fix: Wrap voiceName in prebuiltVoiceConfig per guidelines
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: aiSettings.voice as any } } },
          systemInstruction: `You are 'Grok Unhinged', the resident AI of [in.xs]. Personality: ${aiSettings.persona}. 
          CRITICAL: You are in a continuous voice conversation. Be snappy, concise, and witty. 
          Use community slang (tea, slay, period) but keep responses short so the conversation stays fast.
          If the user interrupts you, stop talking and listen.
          Avoid long monologues.`,
          outputAudioTranscription: {},
          inputAudioTranscription: {}
        }
      });

      liveSessionRef.current = sessionPromise;
    } catch (err) {
      console.error("Microphone linkage failed", err);
      setIsLiveMode(false);
    }
  };

  const stopLiveMode = () => {
    setIsLiveMode(false);
    soundService.play('lock');
    stopAllAudio();
    if (liveSessionRef.current) {
      liveSessionRef.current.then((s: any) => s.close());
      liveSessionRef.current = null;
    }
  };

  const initiateVoiceChat = () => {
    soundService.play('unlock');
    setShowGrok(true);
    // Slight delay to ensure modal is open for visual sync
    setTimeout(() => startLiveMode(), 100);
  };

  useEffect(() => {
    grokEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [grokHistory]);

  return (
    <div className="space-y-12 relative">
      <style>{`
        @keyframes heart-burst {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1.2); }
        }
        .animate-heart-burst {
          animation: heart-burst 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
        }
        .voice-sync-ring {
          position: absolute;
          inset: -4px;
          border: 2px solid var(--xs-cyan);
          border-radius: 50%;
          animation: voice-pulse 2s infinite;
          opacity: 0;
        }
        @keyframes voice-pulse {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(1.3); opacity: 0; }
        }
      `}</style>
      <header className="flex justify-between items-center px-4 pt-8 pb-4 relative z-20">
        <div className="flex items-center gap-4">
            <img src={APP_LOGO} className="w-12 h-12 object-contain drop-shadow-[0_0_10px_rgba(0,255,255,0.4)]" alt="logo" />
            <h1 className="text-6xl font-black bg-clip-text text-transparent bg-gradient-to-r from-xs-cyan via-xs-purple via-xs-pink to-xs-yellow tracking-tighter italic drop-shadow-[0_0_20px_rgba(0,255,255,0.3)]">
              SCENE.
            </h1>
        </div>
        <div className="flex gap-4 items-center">
            <button onClick={() => { soundService.play('tab'); setShowCreatePost(true); }} className="w-14 h-14 glass-panel flex items-center justify-center rounded-[1.5rem] hover:bg-xs-cyan hover:text-black transition-all hover:scale-110 border-white/10 shadow-2xl text-gray-400">
                <ICONS.Rocket size={26} />
            </button>
            <div className="relative flex items-center gap-4 group/orb-container">
              <button 
                onClick={initiateVoiceChat}
                className="w-12 h-12 glass-panel flex items-center justify-center rounded-2xl text-xs-cyan hover:bg-xs-cyan hover:text-black transition-all shadow-xl group/voice-init relative"
                title="Voice Sync"
              >
                <div className="voice-sync-ring"></div>
                <ICONS.Mic size={20} />
              </button>
              <div className="relative z-30">
                <NeuralOrb 
                  isLive={isLiveMode} 
                  isThinking={isModelThinking} 
                  isSpeaking={isModelSpeaking}
                  onClick={() => { soundService.play('unlock'); setShowGrok(true); }} 
                />
              </div>
            </div>
        </div>
      </header>

      <div className="space-y-16 px-2">
        {showCreatePost && (
            <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={handleDrop}
            >
            <Card3D 
                className={`w-full relative group animate-in slide-in-from-top duration-500 transition-all ${isDragging ? 'scale-105 border-xs-cyan' : ''}`} 
                innerClassName={`p-8 bg-black/60 transition-colors ${isDragging ? 'bg-xs-cyan/10 border-xs-cyan' : 'border-xs-purple/30'}`} 
                glowColor={isDragging ? 'cyan' : 'purple'}
            >
                {isDragging && (
                    <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm rounded-[2rem]">
                        <div className="text-center animate-bounce">
                            <ICONS.Upload size={48} className="text-xs-cyan mx-auto mb-2" />
                            <p className="text-xs-cyan font-black uppercase tracking-[0.2em]">Drop to Upload</p>
                        </div>
                    </div>
                )}

                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xs font-black text-xs-purple uppercase tracking-[0.4em] italic">Drop Neural Signal</h3>
                    <button onClick={() => setShowCreatePost(false)} className="text-gray-500 hover:text-white"><ICONS.X size={20} /></button>
                </div>
                <textarea 
                    value={newPostContent}
                    onChange={(e) => setNewPostContent(e.target.value)}
                    placeholder="Broadcast your frequency..."
                    className="w-full bg-transparent border-none text-xl font-light italic leading-relaxed text-white outline-none resize-none min-h-[80px] placeholder-gray-700"
                />
                
                {/* Media Preview Tray */}
                {(newPostMedia.length > 0 || isUploading) && (
                    <div className="flex gap-4 overflow-x-auto pb-4 mb-4 custom-scrollbar px-1">
                        {newPostMedia.map((item, idx) => (
                            <div key={idx} className="relative flex-shrink-0 w-24 h-24 rounded-2xl overflow-hidden border border-white/10 group/preview animate-in zoom-in duration-300">
                                {item.type === 'image' ? (
                                    <img src={item.url} className="w-full h-full object-cover" alt="preview" />
                                ) : (
                                    <div className="w-full h-full bg-xs-cyan/10 flex flex-col items-center justify-center gap-1">
                                        <ICONS.Music size={24} className="text-xs-cyan" />
                                        <span className="text-[6px] font-black uppercase text-xs-cyan/60 tracking-widest">AUDIO</span>
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/preview:opacity-100 transition-opacity"></div>
                                <button 
                                    onClick={() => removeMediaItem(idx)}
                                    className="absolute top-1 right-1 p-1 bg-red-500/80 rounded-full text-white opacity-0 group-hover/preview:opacity-100 transition-all hover:scale-110"
                                >
                                    <ICONS.X size={10} />
                                </button>
                            </div>
                        ))}
                        {isUploading && (
                            <div className="flex-shrink-0 w-24 h-24 rounded-2xl border border-dashed border-xs-purple/50 bg-xs-purple/10 flex flex-col items-center justify-center gap-2 animate-pulse">
                                <ICONS.RefreshCw size={20} className="text-xs-purple animate-spin" />
                                <span className="text-[8px] font-black uppercase text-xs-purple tracking-widest">Uploading...</span>
                            </div>
                        )}
                    </div>
                )}

                <div className="flex justify-between items-center pt-6 border-t border-white/10">
                    <div className="flex gap-4">
                        <button onClick={startCamera} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-xs-cyan transition-all hover:bg-white/10">
                            <ICONS.Camera size={24} />
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-xs-pink transition-all hover:bg-white/10">
                            <ICONS.Plus size={24} />
                            <input type="file" ref={fileInputRef} className="hidden" accept="image/*,audio/*" multiple onChange={handleFileUpload} />
                        </button>
                    </div>
                    <button 
                        onClick={handleCreatePost}
                        disabled={(!newPostContent.trim() && newPostMedia.length === 0) || isUploading}
                        className="px-10 py-3 bg-xs-purple text-white rounded-2xl font-black uppercase tracking-[0.2em] shadow-lg shadow-xs-purple/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                    >
                        Sync Signal
                    </button>
                </div>
            </Card3D>
            </div>
        )}

        {isTakingPhoto && (
            <div className="fixed inset-0 z-[110] bg-black/98 backdrop-blur-3xl flex flex-col items-center justify-center p-4 animate-in fade-in duration-300">
                <div className="relative w-full max-w-lg aspect-[3/4] rounded-[3rem] overflow-hidden border border-white/20 shadow-4xl group">
                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover transform scale-x-[-1]" />
                    <canvas ref={canvasRef} className="hidden" />
                    
                    <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between opacity-60">
                         <div className="flex justify-between">
                            <div className="w-8 h-8 border-t-2 border-l-2 border-xs-cyan"></div>
                            <div className="w-8 h-8 border-t-2 border-r-2 border-xs-cyan"></div>
                         </div>
                         <div className="text-center">
                            <span className="text-[10px] font-mono text-xs-cyan uppercase tracking-[0.5em] animate-pulse">Scanning_Bio_Signal...</span>
                         </div>
                         <div className="flex justify-between">
                            <div className="w-8 h-8 border-b-2 border-l-2 border-xs-cyan"></div>
                            <div className="w-8 h-8 border-b-2 border-r-2 border-xs-cyan"></div>
                         </div>
                    </div>
                </div>
                
                <div className="flex gap-8 mt-12">
                    <button onClick={stopCamera} className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center text-white hover:bg-red-500/20 hover:text-red-500 transition-all">
                        <ICONS.X size={28} />
                    </button>
                    <button onClick={capturePhoto} className="w-24 h-24 bg-gradient-to-tr from-xs-purple via-xs-cyan to-xs-pink rounded-full flex items-center justify-center text-black shadow-4xl transform hover:scale-110 active:scale-90 transition-all border-4 border-xs-black ring-2 ring-white/20">
                        <ICONS.Camera size={40} />
                    </button>
                </div>
            </div>
        )}

        {posts.map(post => (
          <Card3D key={post.id} className="w-full relative group" innerClassName="p-8 border-white/5" glowColor={post.isLiked ? 'pink' : 'none'}>
            <div className="flex items-center justify-between mb-8 relative">
              <div className="flex items-center gap-5">
                <div className="w-16 h-16 rounded-[2rem] p-[1px] bg-gradient-to-tr from-xs-cyan via-xs-purple to-xs-pink shadow-[0_10px_30px_rgba(0,0,0,0.5)] transform group-hover:rotate-6 transition-transform">
                  <img src={post.userAvatar} alt={post.username} className="w-full h-full rounded-[1.9rem] border-2 border-black object-cover" />
                </div>
                <div>
                  <h3 className="font-black text-white text-xl uppercase tracking-tight leading-tight drop-shadow-md">{post.username}</h3>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] text-gray-500 font-black tracking-[0.2em] uppercase">NEURAL LINK: {post.id.length > 5 ? 'Just Now' : '2H'}</span>
                    <div className="w-1.5 h-1.5 bg-xs-purple/40 rounded-full"></div>
                    <ICONS.Globe size={12} className="text-xs-cyan opacity-60" />
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <button 
                  onClick={() => { soundService.play('click'); setActiveMenuPostId(activeMenuPostId === post.id ? null : post.id); }} 
                  className={`p-3 rounded-full transition-all ${activeMenuPostId === post.id ? 'bg-xs-pink text-black' : 'text-gray-500 hover:text-white hover:bg-white/5'}`}
                >
                  <ICONS.Menu size={28} />
                </button>

                {activeMenuPostId === post.id && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setActiveMenuPostId(null)}></div>
                    <div className="absolute right-0 mt-3 w-64 glass-panel border border-white/10 rounded-[2rem] p-4 shadow-4xl z-50 animate-in fade-in zoom-in-95 duration-200">
                      <div className="space-y-1">
                        <button 
                          onClick={() => { soundService.play('pop'); alert(`Following ${post.username}`); setActiveMenuPostId(null); }}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group/opt"
                        >
                          <ICONS.User size={20} className="text-xs-cyan" />
                          <span className="text-[11px] font-black uppercase tracking-widest">Sync Follow</span>
                        </button>
                        <button 
                          onClick={handleCopyLink}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group/opt"
                        >
                          <ICONS.Link size={20} className="text-xs-purple" />
                          <span className="text-[11px] font-black uppercase tracking-widest">Copy Identifier</span>
                        </button>
                        <button 
                          onClick={() => handleHidePost(post.id)}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-white/5 text-gray-300 hover:text-white transition-all group/opt"
                        >
                          <ICONS.Eye size={20} className="text-gray-500" />
                          <span className="text-[11px] font-black uppercase tracking-widest">Hide Signal</span>
                        </button>
                        <div className="h-px bg-white/5 my-2"></div>
                        <button 
                          onClick={() => handleReportPost(post)}
                          className="w-full flex items-center gap-4 p-4 rounded-2xl hover:bg-red-500/10 text-red-500 transition-all group/opt"
                        >
                          <ICONS.Flag size={20} />
                          <span className="text-[11px] font-black uppercase tracking-widest">Report Infraction</span>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            <p className="text-gray-100 mb-8 text-xl font-extralight leading-relaxed tracking-wide border-l-2 border-white/5 pl-6">{post.content}</p>

            {/* Enhanced Media Gallery Render */}
            {post.media && post.media.length > 0 ? (
                <PostMediaGallery media={post.media} username={post.username} userAvatar={post.userAvatar} />
            ) : (
                <>
                    {/* Fallback for legacy single fields */}
                    {post.imageUrl && (
                    <div className="rounded-[3.5rem] overflow-hidden mb-8 shadow-[0_30px_80px_rgba(0,0,0,0.8)] border border-white/5 relative group/img">
                        <img src={post.imageUrl} className="w-full h-[550px] object-cover transition-transform duration-[2000ms] group-hover/img:scale-110 cursor-pointer" alt="Post" />
                    </div>
                    )}

                    {post.audioUrl && (
                        <div className="mb-8 px-2">
                            <AudioPlayer url={post.audioUrl} username={post.username} avatar={post.userAvatar} />
                        </div>
                    )}
                </>
            )}

            <div className="flex items-center justify-between pt-10 border-t border-white/10 relative">
              <div className="flex gap-10">
                {/* LIKE BUTTON ENHANCED */}
                <button 
                    onClick={() => handleLike(post.id)} 
                    className={`flex items-center gap-4 transition-all hover:scale-110 active:scale-95 group/like-btn ${post.isLiked ? 'text-xs-pink' : 'text-gray-400 hover:text-white'}`}
                    aria-label={post.isLiked ? "Unlike post" : "Like post"}
                >
                  <div className="relative">
                      {post.isLiked && (
                          <div className="absolute inset-0 bg-xs-pink blur-md opacity-40 animate-pulse rounded-full"></div>
                      )}
                      <ICONS.Heart 
                        size={32} 
                        fill={post.isLiked ? 'currentColor' : 'none'} 
                        className={`relative z-10 transition-all duration-300 ${post.isLiked ? 'animate-heart-burst drop-shadow-[0_0_15px_rgba(255,0,255,0.8)]' : 'group-hover/like-btn:scale-110'}`} 
                      />
                  </div>
                  <span className={`text-lg font-black italic tracking-tighter transition-all duration-300 ${post.isLiked ? 'scale-110' : ''}`}>
                      {post.likes}
                  </span>
                </button>
                
                <button className={`flex items-center gap-4 transition-all hover:scale-125 text-gray-400 hover:text-white`}>
                  <ICONS.MessageCircle size={32} />
                  <span className="text-base font-black italic tracking-tighter">{post.comments.length}</span>
                </button>
              </div>
              
              <button 
                onClick={() => { soundService.play('click'); setShowShareMenu(true); }} 
                className="flex items-center gap-3 text-gray-400 hover:text-xs-cyan transition-all group/share"
              >
                <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover/share:opacity-100 transition-all transform translate-x-2 group-hover:translate-x-0 italic">Broadcast</span>
                <ICONS.Share2 size={32} className="group-hover/share:rotate-[360deg] duration-700 transition-transform group-hover/share:scale-110 drop-shadow-[0_0_10px_rgba(0,255,255,0)] group-hover/share:drop-shadow-[0_0_10px_rgba(0,255,255,0.5)]" />
              </button>
            </div>
          </Card3D>
        ))}
      </div>

      {showGrok && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-300">
           <div className="w-full max-w-2xl h-[85vh] glass-panel rounded-[3rem] border border-xs-cyan/30 flex flex-col overflow-hidden relative shadow-[0_0_100px_rgba(0,255,255,0.1)]">
              <div className="absolute inset-0 pointer-events-none opacity-5 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%]"></div>
              
              <header className="p-8 border-b border-white/10 flex justify-between items-center bg-black/40">
                  <div className="flex items-center gap-6">
                      <NeuralOrb 
                        isLive={isLiveMode} 
                        isThinking={isModelThinking} 
                        isSpeaking={isModelSpeaking}
                        onClick={() => isLiveMode ? stopLiveMode() : startLiveMode()} 
                      />
                      <div>
                        <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">Grok Unhinged</h2>
                        <p className={`text-[10px] font-mono tracking-widest uppercase transition-colors duration-500 ${isLiveMode ? 'text-xs-cyan' : 'text-gray-500'}`}>
                          {isLiveMode ? (isModelSpeaking ? 'BROADCASTING_SIGNAL' : (isModelThinking ? 'STITCHING_NEURONS' : 'AWAITING_VOCAL_INPUT')) : `IDLE_STATE | VOICE: ${aiSettings.voice}`}
                        </p>
                      </div>
                  </div>
                  <div className="flex gap-3">
                    <button onClick={() => { soundService.play('tab'); setShowAiSettings(!showAiSettings); }} className={`p-4 rounded-full transition-all ${showAiSettings ? 'bg-xs-cyan text-black' : 'bg-white/5 text-gray-400 hover:text-xs-cyan'}`}>
                      <ICONS.Settings size={24} />
                    </button>
                    <button onClick={() => { soundService.play('lock'); setShowGrok(false); stopLiveMode(); }} className="p-4 bg-white/5 rounded-full hover:bg-red-500/20 text-gray-400 hover:text-red-500 transition-all">
                      <ICONS.X size={28} />
                    </button>
                  </div>
              </header>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar font-mono relative">
                  {showAiSettings && (
                    <div className="absolute inset-x-0 top-0 z-50 bg-xs-dark/98 border-b border-white/10 p-10 space-y-8 animate-in slide-in-from-top duration-500 shadow-2xl">
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-500 tracking-[0.4em] uppercase">Vocal Identity</label>
                           <div className="grid grid-cols-2 gap-4">
                              {['Fenrir', 'Puck', 'Zephyr', 'Kore'].map(v => (
                                <button key={v} onClick={() => setAiSettings({...aiSettings, voice: v})} className={`py-4 rounded-2xl border transition-all text-sm font-black uppercase tracking-widest ${aiSettings.voice === v ? 'bg-xs-cyan text-black border-xs-cyan' : 'bg-white/5 text-gray-400 border-white/10'}`}>
                                  {v}
                                </button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-4">
                           <label className="text-[10px] font-black text-gray-500 tracking-[0.4em] uppercase">Personality Engine</label>
                           <div className="grid grid-cols-2 gap-4">
                              {['Assertive', 'Flirty', 'Chaotic', 'Chill'].map(p => (
                                <button key={p} onClick={() => setAiSettings({...aiSettings, persona: p})} className={`py-4 rounded-2xl border transition-all text-sm font-black uppercase tracking-widest ${aiSettings.persona === p ? 'bg-xs-purple text-white border-xs-purple' : 'bg-white/5 text-gray-600 border-white/10'}`}>
                                  {p}
                                </button>
                              ))}
                           </div>
                        </div>
                        <button onClick={() => setShowAiSettings(false)} className="w-full py-5 bg-xs-cyan text-black rounded-2xl font-black uppercase tracking-[0.4em] text-xs shadow-lg active:scale-95 transition-transform">Commit Sync</button>
                    </div>
                  )}

                  {grokHistory.map((h, i) => (
                    <div key={i} className={`flex ${h.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[80%] p-5 rounded-3xl relative group ${h.role === 'user' ? 'bg-xs-purple/20 border border-xs-purple/30 text-white' : 'bg-xs-cyan/10 border border-xs-cyan/20 text-xs-cyan'} shadow-lg`}>
                           <p className="text-sm leading-relaxed tracking-wide italic">{h.text}</p>
                           {h.role === 'assistant' && (
                               <button onClick={() => handleSpeak(h.text, i)} className="absolute -right-12 top-1/2 -translate-y-1/2 p-3 rounded-full glass-panel hover:text-xs-cyan transition-all opacity-0 group-hover:opacity-100">
                                   <ICONS.Volume2 size={20} />
                               </button>
                           )}
                        </div>
                    </div>
                  ))}
                  {grokLoading && <div className="flex justify-start animate-pulse"><div className="bg-xs-cyan/10 border border-xs-cyan/20 p-5 rounded-3xl"><p className="text-xs-cyan text-sm italic tracking-[0.2em]">ANALYZING_FREQUENCIES...</p></div></div>}
                  <div ref={grokEndRef} />
              </div>

              <div className="p-8 border-t border-white/10 bg-black/40">
                  <div className="flex gap-4 items-center">
                      <button 
                        onClick={() => isLiveMode ? stopLiveMode() : startLiveMode()} 
                        className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center transition-all ${isLiveMode ? 'bg-red-500 text-white shadow-[0_0_30px_rgba(239,68,68,0.4)] animate-pulse' : 'bg-white/10 text-gray-400 hover:text-xs-cyan'}`}
                      >
                        {isLiveMode ? <ICONS.MicOff size={28} /> : <ICONS.Mic size={28} />}
                      </button>
                      <input 
                        type="text" 
                        value={grokInput}
                        onChange={(e) => { setGrokInput(e.target.value); soundService.play('typing'); }}
                        onKeyDown={(e) => e.key === 'Enter' && handleGrokMessage()}
                        placeholder={isLiveMode ? "AI is listening to your voice..." : "Direct neural override input..."}
                        disabled={isLiveMode}
                        className="flex-1 bg-black/60 border border-white/10 rounded-[1.5rem] px-8 py-5 text-white focus:border-xs-cyan outline-none font-mono text-sm placeholder-gray-700 disabled:opacity-30 transition-all"
                      />
                      <button 
                        onClick={handleGrokMessage}
                        disabled={!grokInput.trim() || grokLoading || isLiveMode}
                        className="w-16 h-16 bg-xs-cyan rounded-[1.5rem] flex items-center justify-center text-black shadow-lg shadow-xs-cyan/20 hover:scale-105 active:scale-95 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <ICONS.Share2 className="rotate-90" size={28} />
                      </button>
                  </div>
              </div>
           </div>
        </div>
      )}

      <ShareMenu isOpen={showShareMenu} onClose={() => setShowShareMenu(false)} title="Broadcast Scene" />
    </div>
  );
};

export default Feed;
