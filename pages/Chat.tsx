
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Card3D from '../components/Card3D';
import TransactionModal from '../components/TransactionModal';
import { ICONS, CATEGORIES, REACTION_OPTIONS } from '../constants';
import { User, SubscriptionTier, Message, Report } from '../types';
import { generateIcebreaker } from '../services/geminiService';
import { soundService } from '../services/soundService';

interface ChatProps {
  user: User;
  onReport: (report: Report) => void;
  onUpdateUser: (data: Partial<User>) => void;
}

interface OinkItem {
  id: number;
  name: string;
  time: string;
  avatar: string;
  isOinkedBack: boolean;
  role?: string;
}

const pulseStyle = `
  @keyframes neon-glow {
    0% {
      text-shadow: 0 0 5px rgba(255, 0, 255, 0.5), 0 0 10px rgba(255, 0, 255, 0.3);
      opacity: 0.9;
    }
    100% {
      text-shadow: 0 0 10px rgba(255, 0, 255, 0.8), 0 0 20px rgba(255, 0, 255, 0.6), 0 0 30px rgba(255, 0, 255, 0.4);
      opacity: 1;
      transform: scale(1.02);
    }
  }
  .animate-neon-glow {
    animation: neon-glow 1.5s ease-in-out infinite alternate;
  }
  @keyframes record-wave {
    0% { transform: scaleY(1); }
    50% { transform: scaleY(2); }
    100% { transform: scaleY(1); }
  }
  .voice-bar {
    display: inline-block;
    width: 2px;
    height: 8px;
    background: currentColor;
    margin: 0 1px;
    animation: record-wave 0.6s ease-in-out infinite;
  }
  @keyframes radar-pulse {
    0% { transform: scale(0.1); opacity: 1; }
    100% { transform: scale(3); opacity: 0; }
  }
  .radar-pulse {
    animation: radar-pulse 3s cubic-bezier(0, 0, 0.2, 1) infinite;
  }
  .structural-girder {
    background: linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent);
    width: 2px;
    height: 100%;
    position: absolute;
  }
`;

const ROOM_COVERS: Record<string, string> = {
  "Bear": "https://images.unsplash.com/photo-1581622329681-4b1022839958?q=80&w=600&auto=format&fit=crop", 
  "Twink": "https://images.unsplash.com/photo-1506634572416-48cdfe530110?q=80&w=600&auto=format&fit=crop", 
  "Otter": "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=600&auto=format&fit=crop", 
  "Jock": "https://images.unsplash.com/photo-1583467875263-d502c918ee96?q=80&w=600&auto=format&fit=crop", 
  "Leather": "https://images.unsplash.com/photo-1520960858461-ac6756627787?q=80&w=600&auto=format&fit=crop", 
  "Queer": "https://images.unsplash.com/photo-1572635196237-14b3f281503f?q=80&w=600&auto=format&fit=crop", 
  "Trans": "https://images.unsplash.com/photo-1576779435071-85b42d130c24?q=80&w=600&auto=format&fit=crop", 
  "Daddy": "https://images.unsplash.com/photo-1556157382-97eda2d62296?q=80&w=600&auto=format&fit=crop", 
  "Black": "https://images.unsplash.com/photo-1514539079130-25950c84af65?q=80&w=600&auto=format&fit=crop", 
  "White": "https://images.unsplash.com/photo-1516339901601-2e1b62dc0c45?q=80&w=600&auto=format&fit=crop"
};

const Toggle = ({ label, checked, onChange }: { label: string, checked: boolean, onChange: (val: boolean) => void }) => (
    <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-white/10 transition-all group">
        <span className="text-sm font-black text-gray-300 group-hover:text-white uppercase tracking-wider">{label}</span>
        <button 
            onClick={() => {
                soundService.play('click');
                onChange(!checked);
            }}
            className={`w-14 h-7 rounded-full relative transition-colors duration-500 ${checked ? 'bg-xs-pink shadow-[0_0_15px_rgba(255,0,255,0.4)]' : 'bg-gray-800'}`}
        >
            <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${checked ? 'left-8 scale-110' : 'left-1'}`}></div>
        </button>
    </div>
);

const Slider = ({ label, value, min, max, unit, onChange }: { label: string, value: number, min: number, max: number, unit: string, onChange: (val: number) => void }) => (
    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
        <div className="flex justify-between mb-3">
            <span className="text-sm font-black text-gray-300 uppercase tracking-wider">{label}</span>
            <span className="text-xs font-black text-xs-cyan italic">{value} {unit}</span>
        </div>
        <input 
            type="range" 
            min={min} 
            max={max} 
            value={value} 
            onChange={(e) => {
                soundService.play('typing');
                onChange(parseInt(e.target.value));
            }}
            className="w-full h-2 bg-gray-800 rounded-lg appearance-none cursor-pointer accent-xs-cyan"
        />
    </div>
);

const Chat: React.FC<ChatProps> = ({ user, onReport, onUpdateUser }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'direct' | 'rooms' | 'oink' | 'rightnow'>('direct');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferInitialType, setTransferInitialType] = useState<'send' | 'request'>('send');
  const [settingsTab, setSettingsTab] = useState<'direct' | 'rooms' | 'oink' | 'rightnow' | 'ai'>('direct');
  const [showRoomInfrastructure, setShowRoomInfrastructure] = useState(false);
  const [visitedRooms, setVisitedRooms] = useState<Set<string>>(new Set());
  const [isGeneratingIcebreaker, setIsGeneratingIcebreaker] = useState(false);
  const [isOtherUserTyping, setIsOtherUserTyping] = useState(false);
  
  const [chatSettings, setChatSettings] = useState({
      direct: { readReceipts: true, showOnlineStatus: true, mediaAutoDownload: false, notificationPreview: true },
      rooms: { textSize: 'Medium', showJoinLeave: true, blurNSFW: true, soundEffects: false },
      oink: { soundEnabled: true, hapticFeedback: true, allowStrangers: true },
      rightNow: { visibilityRadius: 5, defaultDuration: 1, autoHideProfile: false },
      ai: { voice: 'Fenrir', autoSpeak: true, persona: 'Assertive' }
  });
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [activeReactionMessageId, setActiveReactionMessageId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [userCoords, setUserCoords] = useState<{ lat: number, lng: number } | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordDuration, setRecordDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<number | null>(null);

  const [callStatus, setCallStatus] = useState<'idle' | 'calling' | 'connected'>('idle');
  const [callType, setCallType] = useState<'voice' | 'video'>('voice');
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);

  const [oinks, setOinks] = useState<OinkItem[]>([
    { id: 101, name: 'MusclePig', time: '2 mins ago', avatar: 'https://picsum.photos/300/300?random=60', isOinkedBack: false, role: 'Top' },
    { id: 102, name: 'LeatherDad', time: '15 mins ago', avatar: 'https://picsum.photos/300/300?random=61', isOinkedBack: true, role: 'Top' },
    { id: 103, name: 'GymPup', time: '1 hour ago', avatar: 'https://picsum.photos/300/300?random=62', isOinkedBack: false, role: 'Verse' },
    { id: 104, name: 'BearCub', time: '3 hours ago', avatar: 'https://picsum.photos/300/300?random=63', isOinkedBack: false, role: 'Bottom' },
  ]);

  const unreadOinksCount = useMemo(() => oinks.filter(o => !o.isOinkedBack).length, [oinks]);

  const rightNowUsers = [
    { id: 201, name: 'Brad', status: 'Looking', avatar: 'https://picsum.photos/300/300?random=80', online: true, tags: ['1 Hour', 'My Place'] },
    { id: 202, name: 'Jake', status: 'Chatting', avatar: 'https://picsum.photos/300/300?random=81', online: true, tags: ['Your Place', 'Public'] },
    { id: 203, name: 'Tom', status: 'Travel', avatar: 'https://picsum.photos/300/300?random=82', online: true, tags: ['1 Day', 'Public'] },
    { id: 204, name: 'Leo', status: 'Friends', avatar: 'https://picsum.photos/300/300?random=83', online: true, tags: ['6 Hours'] },
    { id: 205, name: 'Max', status: 'Right Now', avatar: 'https://picsum.photos/300/300?random=84', online: true, tags: ['1 Hour', 'My Place'] },
  ];
  
  const [chats, setChats] = useState<{ id: string; name: string; lastMsg: string; time: string; online: boolean; avatar: string; unread: number }[]>([
    { id: '1', name: 'Alex', lastMsg: 'See you tonight!', time: '10:30 AM', online: true, avatar: 'https://picsum.photos/50/50?random=51', unread: 2 },
    { id: '2', name: 'Jordan', lastMsg: 'Did you like the photos?', time: 'Yesterday', online: false, avatar: 'https://picsum.photos/50/50?random=52', unread: 0 },
    { id: '3', name: 'Kai', lastMsg: 'Where are you?', time: '12:00 PM', online: true, avatar: 'https://picsum.photos/50/50?random=53', unread: 1 },
  ]);

  const selectedChatData = chats.find(c => c.id === selectedChatId);

  useEffect(() => {
    if (activeTab === 'rightnow') {
        setIsScanning(true);
        soundService.play('unlock');
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setUserCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
                    setTimeout(() => setIsScanning(false), 2000);
                },
                (err) => {
                    console.error("Location access denied", err);
                    setLocationError("Proximity Grid unavailable without GPS access.");
                    setIsScanning(false);
                }
            );
        } else {
            setLocationError("Geospatial features not supported by this device.");
            setIsScanning(false);
        }
    }
  }, [activeTab]);

  useEffect(() => {
    if (selectedChatId || selectedCategory) {
        const initialMessages = [
            { id: 'm1', senderId: 'them', text: selectedChatData?.lastMsg || 'Neural linkage complete. Enter the frequency.', timestamp: Date.now() - 100000, reactions: { '🔥': 1 } },
            { id: 'm2', senderId: 'me', text: 'Confirmed. Ready for sync.', timestamp: Date.now() }
        ];
        setMessages(initialMessages);
        setIsTyping(false);
        setIsOtherUserTyping(false);
        setActiveReactionMessageId(null);
        scrollToBottom();

        // Handle Specialized Room Icebreaker
        if (selectedCategory && !visitedRooms.has(selectedCategory)) {
            handleIcebreakerGeneration(selectedCategory);
            setVisitedRooms(prev => {
                const next = new Set(prev);
                next.add(selectedCategory!);
                return next;
            });
        }

        // Simulate "Other User" Typing for realism in Direct Messages
        if (selectedChatId && !selectedCategory) {
           const typingTimer = setTimeout(() => {
              setIsOtherUserTyping(true);
              soundService.play('pop');
              scrollToBottom();
              
              // End typing after 3.5 seconds
              setTimeout(() => {
                setIsOtherUserTyping(false);
              }, 3500);
           }, 2500);
           return () => clearTimeout(typingTimer);
        }
    }
  }, [selectedChatId, selectedChatData, selectedCategory]);

  const handleIcebreakerGeneration = async (category: string) => {
    setIsGeneratingIcebreaker(true);
    try {
        const icebreaker = await generateIcebreaker(category);
        const aiMessage: Message = {
            id: `ai-${Date.now()}`,
            senderId: 'assistant',
            text: icebreaker,
            timestamp: Date.now(),
            isSystem: true
        };
        setMessages(prev => [...prev, aiMessage]);
        soundService.play('success');
    } catch (err) {
        console.error("Icebreaker generation failed", err);
    } finally {
        setIsGeneratingIcebreaker(false);
        scrollToBottom();
    }
  };

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  const handleSendMessage = () => {
    if (!inputText.trim()) return;
    soundService.play('send');
    const newMsg: Message = { id: Date.now().toString(), senderId: 'me', text: inputText, timestamp: Date.now() };
    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    scrollToBottom();
  };

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
        soundService.play('send');
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const isVideo = file.type.startsWith('video/');
            const newMsg: Message = { id: Date.now().toString(), senderId: 'me', imageUrl: isVideo ? undefined : result, videoUrl: isVideo ? result : undefined, timestamp: Date.now() };
            setMessages(prev => [...prev, newMsg]); scrollToBottom();
        };
        reader.readAsDataURL(file);
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleReaction = (msgId: string, emoji: string) => {
      soundService.play('pop');
      setMessages(prev => prev.map(msg => msg.id === msgId ? { ...msg, reactions: { ...msg.reactions, [emoji]: ((msg.reactions?.[emoji] || 0) as number) + 1 } } : msg));
      setActiveReactionMessageId(null);
  };

  const handleStartRecording = async () => {
    soundService.play('unlock');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];
        mediaRecorder.ondataavailable = (event: BlobEvent) => { if (event.data.size > 0) audioChunksRef.current.push(event.data); };
        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            const audioUrl = URL.createObjectURL(audioBlob);
            const newMsg: Message = { id: Date.now().toString(), senderId: 'me', audioUrl: audioUrl, timestamp: Date.now() };
            setMessages(prev => [...prev, newMsg]); scrollToBottom();
            stream.getTracks().forEach(track => track.stop());
            setRecordDuration(0);
            setIsPaused(false);
        };
        mediaRecorder.start(); 
        setIsRecording(true);
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = window.setInterval(() => setRecordDuration(prev => prev + 1), 1000);
    } catch (error) { alert("Microphone access denied."); }
  };

  const handleStopRecording = () => { 
    soundService.play('send'); 
    if (mediaRecorderRef.current) { 
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        mediaRecorderRef.current.stop(); 
        setIsRecording(false); 
    } 
  };

  const handleCancelRecording = () => { 
    soundService.play('error'); 
    if (mediaRecorderRef.current) { 
        if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
        mediaRecorderRef.current.onstop = null; 
        mediaRecorderRef.current.stop(); 
        mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop()); 
        setIsRecording(false); 
        setRecordDuration(0);
        audioChunksRef.current = []; 
    } 
  };

  const startCall = async (type: 'voice' | 'video') => {
    soundService.play('click');
    if (user.subscription === SubscriptionTier.FREE) { setShowUpgradeModal(true); return; }
    setCallType(type); setCallStatus('calling');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: type === 'video', audio: true });
        setLocalStream(stream); setTimeout(() => setCallStatus('connected'), 2500);
    } catch (err) { alert("Media access failed."); setCallStatus('idle'); }
  };

  const endCall = () => { soundService.play('error'); if (localStream) localStream.getTracks().forEach(track => track.stop()); setLocalStream(null); setCallStatus('idle'); setIsMuted(false); setIsVideoOff(false); setCallDuration(0); };
  const toggleMute = () => { soundService.play('click'); if (localStream) { localStream.getAudioTracks().forEach(track => track.enabled = !track.enabled); setIsMuted(!isMuted); } };
  const toggleVideo = () => { soundService.play('click'); if (localStream && callType === 'video') { localStream.getVideoTracks().forEach(track => track.enabled = !track.enabled); setIsVideoOff(!isVideoOff); } };

  const switchTab = (tab: any) => { soundService.play('tab'); setActiveTab(tab); };

  const handleOinkBack = (id: number) => {
    soundService.play('oink');
    setOinks(prev => prev.map(o => o.id === id ? { ...o, isOinkedBack: true } : o));
    if ('vibrate' in navigator) navigator.vibrate([10, 50, 10]);
  };

  const startChatFromOink = (oink: OinkItem) => {
      soundService.play('unlock');
      const newChat = { 
          id: oink.id.toString(), 
          name: oink.name, 
          lastMsg: 'Started via Oink vault sync.', 
          time: 'Just now', 
          online: true, 
          avatar: oink.avatar, 
          unread: 0 
      };
      setChats([newChat, ...chats]);
      setSelectedChatId(newChat.id);
  };

  const handleConfirmTransfer = (amount: number, note: string, type: 'send' | 'request' | 'crypto') => {
    if (type === 'send') {
        onUpdateUser({ walletBalance: user.walletBalance - amount });
    }
    const newMsg: Message = { 
        id: Date.now().toString(), 
        senderId: 'me', 
        transferAmount: amount, 
        transferType: type,
        text: note || (type === 'send' ? `Sent you ${amount} Neural Credits! 💎` : `Requested ${amount} Neural Credits for sync.`),
        timestamp: Date.now() 
    };
    setMessages(prev => [...prev, newMsg]);
    setShowTransferModal(false);
    scrollToBottom();
  };

  const handlePayRequest = (msg: Message) => {
    if (!msg.transferAmount) return;
    if (user.walletBalance < msg.transferAmount) {
        soundService.play('error');
        alert("Insufficient Vault funds to process sync.");
        return;
    }
    soundService.play('unlock');
    onUpdateUser({ walletBalance: user.walletBalance - msg.transferAmount });
    const confirmMsg: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        transferAmount: msg.transferAmount,
        transferType: 'send',
        text: `Sync Request Paid! Processed $${msg.transferAmount} transfer. ✅`,
        timestamp: Date.now()
    };
    setMessages(prev => [...prev, confirmMsg]);
    scrollToBottom();
  };

  if (callStatus !== 'idle') {
      return (
          <div className="fixed inset-0 z-50 bg-black flex flex-col animate-in fade-in duration-300">
              <div className="flex-1 relative flex items-center justify-center">
                  {callType === 'video' ? (
                       <div className="w-full h-full relative">
                           <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
                                {callStatus === 'connected' ? (
                                    <div className="relative w-full h-full">
                                        <img src={selectedChatData?.avatar} className="w-full h-full object-cover blur-sm opacity-50" alt="remote_bg" />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white/20 shadow-2xl">
                                                <img src={selectedChatData?.avatar} className="w-full h-full object-cover" alt="remote_user" />
                                            </div>
                                        </div>
                                    </div>
                                ) : <p className="text-gray-500 animate-pulse text-lg font-bold">Connecting...</p>}
                           </div>
                           <div className="absolute top-6 right-6 w-32 h-48 bg-black rounded-2xl border border-white/20 overflow-hidden shadow-2xl z-20 transition-all hover:scale-110">
                                <video ref={localVideoRef} autoPlay muted playsInline className={`w-full h-full object-cover transform scale-x-[-1] ${isVideoOff ? 'hidden' : ''}`} />
                                {isVideoOff && <div className="w-full h-full flex items-center justify-center text-xs text-gray-500 bg-gray-900 font-bold">Camera Off</div>}
                           </div>
                       </div>
                  ) : (
                      <div className="flex flex-col items-center gap-6 animate-pulse z-10">
                          <div className="w-40 h-40 rounded-full p-1.5 bg-gradient-to-tr from-xs-purple to-xs-cyan shadow-[0_0_60px_rgba(189,0,255,0.4)]">
                              <div className="w-full h-full rounded-full border-4 border-black overflow-hidden">
                                <img src={selectedChatData?.avatar || 'https://picsum.photos/100'} className="w-full h-full object-cover" alt="User" />
                              </div>
                          </div>
                          <div className="text-center">
                            <h2 className="text-3xl font-black text-white mb-2 tracking-tight">{selectedChatData?.name || 'User'}</h2>
                            <p className="text-xs-cyan text-lg font-bold tracking-widest uppercase mb-1">{callStatus === 'calling' ? 'Calling...' : 'Connected'}</p>
                            {callStatus === 'connected' && <p className="text-white/60 font-mono text-sm">ACTIVE</p>}
                          </div>
                      </div>
                  )}
              </div>
              <div className="h-32 bg-black/80 backdrop-blur-xl flex items-center justify-center gap-8 pb-8 rounded-t-[3rem] border-t border-white/10 relative z-30">
                  <button onClick={toggleMute} className={`p-5 rounded-full ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white'} border border-white/20 hover:scale-110 shadow-lg`}>{isMuted ? <ICONS.MicOff size={24} /> : <ICONS.Mic size={24} />}</button>
                  <button onClick={endCall} className="p-7 rounded-full bg-red-600 text-white hover:bg-red-700 hover:scale-110 transition-all shadow-[0_0_30px_rgba(255,0,0,0.5)] border-4 border-black"><ICONS.PhoneOff size={32} /></button>
                  {callType === 'video' && <button onClick={toggleVideo} className={`p-5 rounded-full ${isVideoOff ? 'bg-white text-black' : 'bg-white/10 text-white'} border border-white/20 hover:scale-110 shadow-lg`}>{isVideoOff ? <ICONS.VideoOff size={24} /> : <ICONS.Video size={24} />}</button>}
              </div>
          </div>
      );
  }

  return (
    <div className="h-full flex flex-col relative preserve-3d">
      <style>{pulseStyle}</style>
      
      <TransactionModal 
        isOpen={showTransferModal}
        onClose={() => setShowTransferModal(false)}
        onConfirm={handleConfirmTransfer}
        recipientName={selectedChatData?.name || ''}
        recipientAvatar={selectedChatData?.avatar || ''}
        currentBalance={user.walletBalance}
        initialType={transferInitialType}
      />

      {/* ROOM ARCHITECTURAL VIEW */}
      {selectedCategory && (
          <div className={`fixed inset-0 z-[60] flex flex-col animate-in slide-in-from-bottom-10 duration-500 overflow-hidden ${selectedCategory.includes('Black') ? 'bg-black text-xs-cyan' : 'bg-white text-xs-purple'}`}>
              <div className="structural-girder left-8 top-0 opacity-20"></div>
              <div className="structural-girder right-8 top-0 opacity-20"></div>

              <header className={`relative z-20 p-8 border-b ${selectedCategory.includes('Black') ? 'border-white/10 bg-black/80' : 'border-black/10 bg-white/80'} backdrop-blur-3xl flex flex-col gap-6`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-6">
                        <button onClick={() => setSelectedCategory(null)} className={`p-4 rounded-full transition-all hover:scale-110 ${selectedCategory.includes('Black') ? 'bg-white/5 text-white hover:bg-white/10' : 'bg-black/5 text-black hover:bg-black/10'}`}>
                            <ICONS.ArrowLeft size={32} />
                        </button>
                        <div>
                            <span className={`text-[10px] font-black uppercase tracking-[0.6em] block mb-1 ${selectedCategory.includes('Black') ? 'text-xs-pink' : 'text-xs-purple'}`}>System_Room_Entry</span>
                            <h2 className={`text-5xl font-black italic tracking-tighter uppercase leading-none ${selectedCategory.includes('Black') ? 'text-white' : 'text-black'}`}>{selectedCategory}</h2>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setShowRoomInfrastructure(!showRoomInfrastructure)} className={`p-4 rounded-2xl border transition-all ${selectedCategory.includes('Black') ? 'bg-xs-cyan/10 border-xs-cyan/30 text-xs-cyan hover:bg-xs-cyan/20' : 'bg-xs-purple/10 border-xs-purple/30 text-xs-purple hover:bg-xs-purple/20'}`}>
                            <ICONS.Users size={28} />
                        </button>
                        <button onClick={() => { soundService.play('click'); setSettingsTab('rooms'); setShowSettings(true); }} className={`p-4 rounded-2xl border transition-all ${selectedCategory.includes('Black') ? 'bg-white/5 border-white/10 text-gray-400' : 'bg-black/5 border-black/10 text-gray-600'}`}>
                            <ICONS.Settings size={28} />
                        </button>
                    </div>
                  </div>
              </header>

              <div className="flex-1 flex overflow-hidden relative">
                  <aside className={`absolute right-0 top-0 bottom-0 z-30 w-80 shadow-4xl transform-gpu transition-transform duration-700 ease-out border-l ${showRoomInfrastructure ? 'translate-x-0' : 'translate-x-full'} ${selectedCategory.includes('Black') ? 'bg-xs-dark border-white/10' : 'bg-gray-100 border-black/10'}`}>
                      <div className="p-8 h-full flex flex-col">
                          <h3 className={`text-sm font-black uppercase tracking-[0.4em] mb-10 pb-4 border-b ${selectedCategory.includes('Black') ? 'text-xs-cyan border-white/10' : 'text-xs-purple border-black/10'}`}>Infrastructure_Nodes</h3>
                          <div className="flex-1 overflow-y-auto space-y-6 custom-scrollbar">
                              {[...Array(6)].map((_, i) => (
                                  <div key={i} className={`flex items-center gap-4 group cursor-pointer p-3 rounded-2xl transition-all ${selectedCategory.includes('Black') ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}>
                                      <div className="relative">
                                          <img src={`https://picsum.photos/50/50?random=${111+i}`} className={`w-12 h-12 rounded-full border-2 ${selectedCategory.includes('Black') ? 'border-white/10' : 'border-black/10'}`} />
                                          <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${selectedCategory.includes('Black') ? 'bg-xs-cyan border-xs-dark' : 'bg-xs-purple border-gray-100'}`}></div>
                                      </div>
                                      <div className="flex-1">
                                          <h4 className={`text-xs font-black uppercase tracking-widest ${selectedCategory.includes('Black') ? 'text-white' : 'text-black'}`}>User_{i}</h4>
                                          <p className="text-[8px] font-mono text-gray-500 uppercase">LVL: MAX</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </aside>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10 custom-scrollbar relative z-10">
                      {messages.map((msg, i) => {
                          const isMe = msg.senderId === 'me';
                          const isAI = msg.senderId === 'assistant' || msg.isSystem;
                          
                          return (
                              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4`} style={{ animationDelay: `${i * 0.1}s` }}>
                                  <div className={`relative group max-w-[85%] border-l-4 ${isMe ? 'border-xs-pink' : (isAI ? 'border-xs-cyan animate-pulse' : (selectedCategory.includes('Black') ? 'border-xs-cyan' : 'border-xs-purple'))} p-6 rounded-r-[2.5rem] shadow-2xl backdrop-blur-2xl ${isAI ? 'bg-xs-cyan/10 border-xs-cyan/20' : (selectedCategory.includes('Black') ? 'bg-white/5 border-white/5' : 'bg-black/5 border-black/5')} ${!isAI && chatSettings.rooms.blurNSFW ? 'blur-sm hover:blur-none transition-all' : ''}`}>
                                      {isAI && <div className="flex items-center gap-2 mb-2"><ICONS.Sparkles size={14} className="text-xs-cyan" /><span className="text-[9px] font-black uppercase tracking-[0.3em] text-xs-cyan">Neural_Icebreaker</span></div>}
                                      <p className={`text-lg italic font-light leading-relaxed tracking-wide ${selectedCategory.includes('Black') || isAI ? 'text-white' : 'text-black'}`}>{msg.text}</p>
                                  </div>
                              </div>
                          );
                      })}
                      {isGeneratingIcebreaker && (
                          <div className="flex justify-start animate-pulse">
                              <div className="bg-xs-cyan/10 border-l-4 border-xs-cyan p-6 rounded-r-[2.5rem]">
                                  <p className="text-xs-cyan font-black uppercase tracking-[0.4em] italic text-sm">SYNTHESIZING_ICEBREAKER...</p>
                              </div>
                          </div>
                      )}
                      <div ref={messagesEndRef} />
                  </div>
              </div>

              <footer className={`p-8 border-t ${selectedCategory.includes('Black') ? 'bg-black/90 border-white/10' : 'bg-white/90 border-black/10'} backdrop-blur-3xl z-40 relative`}>
                  <div className="flex gap-6 items-center max-w-5xl mx-auto">
                      <button className={`p-5 rounded-2xl transition-all hover:scale-110 ${selectedCategory.includes('Black') ? 'bg-white/5 text-gray-400 hover:text-xs-cyan' : 'bg-black/5 text-gray-600 hover:text-xs-purple'}`}>
                          <ICONS.Camera size={32} />
                      </button>
                      <div className={`flex-1 relative group flex items-center border rounded-[2rem] px-8 py-5 transition-all ${selectedCategory.includes('Black') ? 'bg-black/40 border-white/10 focus-within:border-xs-cyan' : 'bg-white/40 border-black/10 focus-within:border-xs-purple'}`}>
                          <input type="text" value={inputText} onChange={(e) => setInputText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="System Command Input..." className={`flex-1 bg-transparent outline-none text-xl font-light italic leading-none ${selectedCategory.includes('Black') ? 'text-white placeholder-gray-700' : 'text-black placeholder-gray-300'}`} />
                      </div>
                      <button onClick={handleSendMessage} className={`p-6 rounded-[2rem] transition-all hover:scale-110 shadow-4xl animate-pulse ${selectedCategory.includes('Black') ? 'bg-xs-cyan text-black' : 'bg-xs-purple text-white'}`}><ICONS.Rocket size={32} /></button>
                  </div>
              </footer>
          </div>
      )}

      {/* DEFAULT VIEW LOGIC */}
      {!selectedCategory && (
          (selectedChatId !== null && activeTab === 'direct') ? (
          <div className="fixed inset-0 z-50 bg-xs-black flex flex-col animate-in slide-in-from-right duration-300">
              <header className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-white/10 relative z-10">
                  <div className="flex items-center gap-3">
                      <button onClick={() => setSelectedChatId(null)} className="p-2 -ml-2 text-gray-300 hover:text-white rounded-full hover:bg-white/10"><ICONS.ArrowLeft size={24} /></button>
                      <div className="flex items-center gap-3">
                          <div className="relative">
                              <img src={selectedChatData?.avatar} className="w-10 h-10 rounded-full border border-white/20" alt="avatar" />
                              {selectedChatData?.online && <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black shadow-[0_0_5px_rgba(0,255,0,0.5)]"></div>}
                          </div>
                          <div>
                              <h3 className="font-bold text-white leading-tight text-lg">{selectedChatData?.name}</h3>
                              <span className="text-xs text-gray-400 font-medium">{selectedChatData?.online ? 'Online' : 'Offline'}</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-1">
                      <button onClick={() => { setTransferInitialType('send'); setShowTransferModal(true); }} className="p-3 text-xs-yellow hover:scale-110 transition-transform relative"><ICONS.CreditCard size={22} /></button>
                      <button onClick={() => startCall('voice')} className="p-3 text-gray-300 hover:text-xs-purple rounded-full transition-colors relative"><ICONS.Phone size={22} /></button>
                      <button onClick={() => startCall('video')} className="p-3 text-gray-300 hover:text-xs-cyan rounded-full transition-colors relative"><ICONS.Video size={22} /></button>
                      <button onClick={() => setShowReportModal(true)} className="p-3 text-gray-300 hover:text-red-500 rounded-full transition-colors"><ICONS.Flag size={22} /></button>
                  </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-4 relative z-0 custom-scrollbar">
                  {messages.map((msg, i) => {
                      const isMe = msg.senderId === 'me';
                      const isTransfer = msg.transferAmount !== undefined;
                      const isRequest = msg.transferType === 'request';

                      return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`} style={{ animationDelay: `${i * 0.05}s` }}>
                              <div 
                                className={`relative group max-w-[75%] p-4 rounded-[1.5rem] shadow-2xl backdrop-blur-md border ${isMe ? 'bg-xs-purple/10 border-xs-purple/30 rounded-tr-sm text-white' : 'bg-white/5 border-white/10 rounded-tl-sm text-gray-200'} ${isTransfer ? `border-l-4 ${isRequest ? 'border-l-xs-cyan' : 'border-l-xs-yellow'}` : ''}`}
                              >
                                  {isTransfer && (
                                      <div className={`flex flex-col gap-3 mb-2 pb-2 border-b border-white/10`}>
                                          <div className="flex items-center gap-3">
                                            <div className={`p-2 ${isRequest ? 'bg-xs-cyan' : 'bg-xs-yellow'} rounded-lg text-black`}>
                                                {isRequest ? <ICONS.Zap size={16} /> : <ICONS.CreditCard size={16} />}
                                            </div>
                                            <div>
                                                <p className={`text-[10px] font-black uppercase ${isRequest ? 'text-xs-cyan' : 'text-xs-yellow'} tracking-widest`}>
                                                    {isRequest ? 'Neural_Request' : 'Neural_Transfer'}
                                                </p>
                                                <p className="text-xl font-black text-white italic tracking-tighter">${msg.transferAmount?.toFixed(2)}</p>
                                            </div>
                                          </div>
                                          {!isMe && isRequest && (
                                              <button 
                                                onClick={() => handlePayRequest(msg)}
                                                className="w-full py-2.5 bg-xs-cyan text-black rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-lg"
                                              >
                                                Process_Sync
                                              </button>
                                          )}
                                      </div>
                                  )}
                                  {msg.imageUrl && (
                                    <div className="mb-2 rounded-xl overflow-hidden border border-white/10">
                                      <img src={msg.imageUrl} className="w-full h-auto object-cover" alt="attachment" />
                                    </div>
                                  )}
                                  {msg.text && <p className={`text-[15px] leading-relaxed font-light tracking-wide`}>{msg.text}</p>}
                                  
                                  {/* Timestamp & Status */}
                                  <div className="flex justify-end items-center gap-1 mt-1 opacity-50">
                                    <span className="text-[9px] font-mono uppercase">{new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                    {chatSettings.direct.readReceipts && isMe && <ICONS.CheckCircle size={10} className="text-xs-cyan" />}
                                  </div>
                              </div>
                          </div>
                      );
                  })}
                  {isOtherUserTyping && (
                    <div className="flex justify-start animate-in fade-in slide-in-from-left-4 duration-300">
                        <div className="bg-white/5 border border-white/5 p-3 rounded-2xl rounded-tl-none flex items-center gap-3 shadow-lg backdrop-blur-sm">
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 bg-xs-cyan rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-xs-cyan rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-1.5 h-1.5 bg-xs-cyan rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                            <span className="text-[9px] font-black uppercase text-xs-cyan tracking-[0.2em] italic opacity-70 animate-pulse">Syncing...</span>
                        </div>
                    </div>
                  )}
                  <div ref={messagesEndRef} />
              </div>

              <div className="p-3 bg-black/80 backdrop-blur-md border-t border-white/10 relative z-10 pb-6 md:pb-3">
                    <div className="flex gap-2 items-end">
                        <input type="file" accept="image/*,video/*" className="hidden" ref={fileInputRef} onChange={handleMediaUpload} />
                        <button onClick={() => { setTransferInitialType('send'); setShowTransferModal(true); }} className="p-3 bg-xs-yellow/10 text-xs-yellow rounded-full hover:bg-xs-yellow/20 transition-colors mb-0.5"><ICONS.CreditCard size={20} /></button>
                        <button onClick={() => { setTransferInitialType('request'); setShowTransferModal(true); }} className="p-3 bg-xs-cyan/10 text-xs-cyan rounded-full hover:bg-xs-cyan/20 transition-colors mb-0.5"><ICONS.Zap size={20} /></button>
                        <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/10 text-gray-400 rounded-full hover:text-xs-pink transition-colors mb-0.5"><ICONS.Camera size={20} /></button>
                        <button onClick={handleStartRecording} className="p-3 bg-white/10 text-gray-400 rounded-full hover:text-xs-pink transition-colors mb-0.5"><ICONS.Mic size={20} /></button>
                        <div className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 flex items-center transition-colors focus-within:border-xs-cyan">
                            <input type="text" value={inputText} onChange={(e) => { setInputText(e.target.value); soundService.play('typing'); }} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Message..." className="flex-1 bg-transparent text-white outline-none placeholder-gray-500 py-1" />
                        </div>
                        <button onClick={handleSendMessage} disabled={!inputText.trim()} className={`p-3 rounded-full font-bold transition-all mb-0.5 ${inputText.trim() ? 'bg-xs-cyan text-black shadow-lg shadow-xs-cyan/20' : 'bg-white/5 text-gray-600'}`}><ICONS.Share2 className="rotate-90" size={20} /></button>
                    </div>
              </div>
          </div>
      ) : (
          <>
            <header className="mb-6 flex justify-between items-center px-2 pt-4">
                <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase">Messages</h1>
                <button onClick={() => { soundService.play('click'); setShowSettings(true); }} className="bg-white/10 p-3 rounded-full hover:rotate-90 transition-all border border-white/5 hover:border-xs-pink shadow-xl"><ICONS.Settings size={24} /></button>
            </header>
            
            <div className="flex gap-3 overflow-x-auto pb-4 px-2 scrollbar-hide mb-4">
                {['direct', 'rooms', 'oink', 'rightnow'].map(tab => (
                    <button 
                        key={tab} 
                        onClick={() => switchTab(tab as any)} 
                        className={`px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-[0.2em] border transition-all flex items-center gap-3 ${activeTab === tab ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.3)]' : 'bg-white/5 text-gray-500 border-white/5'}`}
                    >
                        {tab}
                        {tab === 'oink' && unreadOinksCount > 0 && (
                            <span className="bg-xs-pink text-white w-5 h-5 rounded-full flex items-center justify-center text-[9px] animate-pulse shadow-[0_0_10px_rgba(255,0,255,0.6)]">
                                {unreadOinksCount}
                            </span>
                        )}
                    </button>
                ))}
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto px-2 custom-scrollbar">
                {activeTab === 'direct' && chats.map(chat => (
                    <Card3D key={chat.id} className="cursor-pointer group h-20" innerClassName="px-4 flex items-center" onClick={() => { soundService.play('click'); setSelectedChatId(chat.id); }}>
                        <div className="flex items-center gap-4 w-full">
                            <div className="relative"><img src={chat.avatar} className="w-12 h-12 rounded-full border border-white/10 object-cover" />{chat.online && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 rounded-full border-2 border-black shadow-[0_0_8px_rgba(0,255,0,0.5)]"></div>}</div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-0.5"><h3 className="font-bold text-white text-base truncate">{chat.name}</h3><span className="text-[9px] text-gray-500 font-black uppercase tracking-tighter">{chat.time}</span></div>
                                <p className="text-sm truncate text-gray-400 font-medium">{chat.lastMsg}</p>
                            </div>
                        </div>
                    </Card3D>
                ))}
                {activeTab === 'rooms' && (
                    <div className="grid grid-cols-2 gap-4">
                        {CATEGORIES.map(cat => (
                            <Card3D key={cat} className="h-48 cursor-pointer overflow-hidden group relative" innerClassName="p-0" onClick={() => { soundService.play('tab'); setSelectedCategory(`Bareback ${cat}`); }}>
                                <div className="absolute inset-0"><img src={ROOM_COVERS[cat]} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-70" /><div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div></div>
                                <div className="absolute bottom-0 left-0 p-5 w-full"><span className="text-[10px] font-black text-xs-pink uppercase tracking-widest mb-1 block animate-neon-glow flex items-center gap-2"><ICONS.Flame size={12} /> Bareback</span><span className="text-4xl font-black text-white uppercase tracking-tighter italic">{cat}</span></div>
                            </Card3D>
                        ))}
                    </div>
                )}
                {activeTab === 'oink' && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex items-center gap-4 px-2 mb-6">
                            <div className="p-3 bg-xs-pink/20 rounded-2xl text-xs-pink shadow-xl">
                                <ICONS.Droplet size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-white italic tracking-tighter uppercase leading-tight">Oink_Vault</h3>
                                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">Recent_Identity_Interactions</p>
                            </div>
                        </div>
                        
                        <div className="space-y-4">
                            {oinks.map((oink) => (
                                <Card3D key={oink.id} className="h-28 group" innerClassName="p-4 flex items-center gap-6" glowColor={!oink.isOinkedBack ? 'pink' : 'none'} hoverZ={50}>
                                    <div className="relative flex-shrink-0">
                                        <div className={`absolute -inset-1 rounded-2xl blur-md opacity-20 transition-opacity duration-500 ${!oink.isOinkedBack ? 'bg-xs-pink' : 'bg-transparent'}`}></div>
                                        <img src={oink.avatar} className="relative w-16 h-16 rounded-2xl object-cover border border-white/10 shadow-2xl" alt={oink.name} />
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between items-start mb-1">
                                            <h4 className="text-xl font-black text-white italic tracking-tighter uppercase truncate group-hover:text-xs-pink transition-colors">{oink.name}</h4>
                                            <span className="text-[9px] font-black text-gray-500 uppercase font-mono">{oink.time}</span>
                                        </div>
                                        <div className="flex gap-2 items-center mb-3">
                                            <span className="px-2 py-0.5 bg-xs-purple/10 border border-xs-purple/20 rounded-lg text-[8px] font-black text-xs-purple uppercase tracking-widest">{oink.role}</span>
                                            <span className="text-[8px] text-gray-500 font-mono">ID: {oink.id}</span>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 flex-shrink-0">
                                        <button 
                                            onClick={() => handleOinkBack(oink.id)}
                                            disabled={oink.isOinkedBack}
                                            className={`p-4 rounded-2xl border transition-all hover:scale-110 active:scale-95 shadow-xl flex flex-col items-center gap-1 min-w-[70px] ${
                                                oink.isOinkedBack 
                                                ? 'bg-green-500/10 border-green-500/30 text-green-500 opacity-60' 
                                                : 'bg-xs-pink/10 border-xs-pink/30 text-xs-pink hover:bg-xs-pink/20'
                                            }`}
                                        >
                                            <ICONS.Droplet size={20} fill={oink.isOinkedBack ? "currentColor" : "none"} />
                                            <span className="text-[8px] font-black uppercase tracking-tighter">{oink.isOinkedBack ? 'SYNCCED' : 'OINK'}</span>
                                        </button>
                                        <button 
                                            onClick={() => startChatFromOink(oink)}
                                            className="p-4 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:bg-white/10 hover:text-white hover:scale-110 active:scale-95 shadow-xl transition-all flex flex-col items-center gap-1 min-w-[70px]"
                                        >
                                            <ICONS.MessageCircle size={20} />
                                            <span className="text-[8px] font-black uppercase tracking-tighter">LINK</span>
                                        </button>
                                    </div>
                                </Card3D>
                            ))}
                        </div>
                    </div>
                )}
                {activeTab === 'rightnow' && (
                    <div className="space-y-4 pt-2">
                        {isScanning ? (
                            <div className="flex flex-col items-center justify-center py-24 space-y-8 animate-in fade-in duration-700">
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <div className="absolute inset-0 border-4 border-xs-cyan/30 rounded-full"></div>
                                    <div className="absolute inset-0 border-4 border-xs-cyan rounded-full radar-pulse"></div>
                                    <ICONS.MapPin size={40} className="text-xs-cyan animate-bounce" />
                                </div>
                                <div className="text-center">
                                    <p className="text-xs-cyan font-black uppercase tracking-[0.5em] animate-pulse">Scanning_Neural_Grid</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {rightNowUsers.map((rUser, idx) => (
                                    <Card3D key={rUser.id} className="h-32 group cursor-pointer" innerClassName="p-4 flex items-center gap-4 border-white/10 bg-black/60" glowColor={idx === 0 ? 'pink' : 'cyan'}>
                                        <img src={rUser.avatar} className="w-20 h-20 rounded-2xl object-cover border border-white/20" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h4 className="text-lg font-black text-white italic tracking-tighter uppercase truncate">{rUser.name}</h4>
                                                <span className="text-[10px] font-black text-xs-cyan font-mono">0.{idx + 1} mi</span>
                                            </div>
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em] mb-2">{rUser.status}</p>
                                            <div className="flex flex-wrap gap-1.5">
                                                {rUser.tags.map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-white/60 uppercase tracking-widest">{tag}</span>
                                                ))}
                                            </div>
                                        </div>
                                    </Card3D>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
          </>
      )}

      {/* COMPREHENSIVE SETTINGS MODAL */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setShowSettings(false)}>
              <div 
                className="bg-xs-dark border border-white/10 w-full max-w-lg h-[85vh] rounded-[3rem] p-10 shadow-4xl relative animate-in zoom-in-95 duration-300 flex flex-col"
                onClick={(e) => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center mb-10 pb-6 border-b border-white/10 flex-shrink-0">
                      <div>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                            <ICONS.Settings size={36} className="text-xs-pink animate-spin-slow" /> 
                            Matrix_Config
                        </h2>
                        <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">Operational_Parameters_V4.2</p>
                      </div>
                      <button onClick={() => setShowSettings(false)} className="p-4 bg-white/5 hover:bg-white/10 rounded-full transition-all group">
                          <ICONS.X size={28} className="text-gray-400 group-hover:text-white" />
                      </button>
                  </div>

                  <div className="flex bg-black/60 p-2 rounded-[2rem] border border-white/10 mb-10 overflow-x-auto scrollbar-hide flex-shrink-0">
                      {[
                        { id: 'direct', label: 'Direct', icon: ICONS.MessageCircle },
                        { id: 'rooms', label: 'Rooms', icon: ICONS.Users },
                        { id: 'oink', label: 'Oinks', icon: ICONS.Droplet },
                        { id: 'rightnow', label: 'RightNow', icon: ICONS.MapPin },
                        { id: 'ai', label: 'AI_Sync', icon: ICONS.Zap }
                      ].map(t => (
                        <button 
                            key={t.id} 
                            onClick={() => { soundService.play('tab'); setSettingsTab(t.id as any); }} 
                            className={`flex-1 py-4 px-6 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${settingsTab === t.id ? 'bg-xs-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.4)]' : 'text-gray-500 hover:text-white'}`}
                        >
                            <t.icon size={16} />
                            {t.label}
                        </button>
                      ))}
                  </div>

                  <div className="flex-1 overflow-y-auto space-y-10 pr-2 custom-scrollbar">
                      {settingsTab === 'direct' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                           <Toggle label="Read Receipts" checked={chatSettings.direct.readReceipts} onChange={v => setChatSettings({...chatSettings, direct: {...chatSettings.direct, readReceipts: v}})} />
                           <Toggle label="Show Online Status" checked={chatSettings.direct.showOnlineStatus} onChange={v => setChatSettings({...chatSettings, direct: {...chatSettings.direct, showOnlineStatus: v}})} />
                           <Toggle label="Media Auto-Download" checked={chatSettings.direct.mediaAutoDownload} onChange={v => setChatSettings({...chatSettings, direct: {...chatSettings.direct, mediaAutoDownload: v}})} />
                           <Toggle label="Notification Previews" checked={chatSettings.direct.notificationPreview} onChange={v => setChatSettings({...chatSettings, direct: {...chatSettings.direct, notificationPreview: v}})} />
                        </div>
                      )}
                      
                      {settingsTab === 'rooms' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                           <Toggle label="Blur NSFW Content" checked={chatSettings.rooms.blurNSFW} onChange={v => setChatSettings({...chatSettings, rooms: {...chatSettings.rooms, blurNSFW: v}})} />
                           <Toggle label="Show Join/Leave Alerts" checked={chatSettings.rooms.showJoinLeave} onChange={v => setChatSettings({...chatSettings, rooms: {...chatSettings.rooms, showJoinLeave: v}})} />
                           <Toggle label="UI Sound Effects" checked={chatSettings.rooms.soundEffects} onChange={v => setChatSettings({...chatSettings, rooms: {...chatSettings.rooms, soundEffects: v}})} />
                        </div>
                      )}

                      {settingsTab === 'oink' && (
                        <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                           <Toggle label="Resonant Sound" checked={chatSettings.oink.soundEnabled} onChange={v => setChatSettings({...chatSettings, oink: {...chatSettings.oink, soundEnabled: v}})} />
                           <Toggle label="Haptic Feedback" checked={chatSettings.oink.hapticFeedback} onChange={v => setChatSettings({...chatSettings, oink: {...chatSettings.oink, hapticFeedback: v}})} />
                           <Toggle label="Allow Direct Oinks" checked={chatSettings.oink.allowStrangers} onChange={v => setChatSettings({...chatSettings, oink: {...chatSettings.oink, allowStrangers: v}})} />
                        </div>
                      )}

                      {settingsTab === 'rightnow' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                           <Slider label="Visibility Radius" value={chatSettings.rightNow.visibilityRadius} min={1} max={50} unit="mi" onChange={v => setChatSettings({...chatSettings, rightNow: {...chatSettings.rightNow, visibilityRadius: v}})} />
                           <Toggle label="Auto-Hide On Offline" checked={chatSettings.rightNow.autoHideProfile} onChange={v => setChatSettings({...chatSettings, rightNow: {...chatSettings.rightNow, autoHideProfile: v}})} />
                        </div>
                      )}

                      {settingsTab === 'ai' && (
                        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                           <div className="space-y-4">
                               <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2">Neural Vocal Identity</label>
                               <div className="grid grid-cols-2 gap-3">
                                  {['Fenrir', 'Puck', 'Zephyr', 'Kore'].map(v => (
                                    <button 
                                        key={v} 
                                        onClick={() => setChatSettings({...chatSettings, ai: {...chatSettings.ai, voice: v}})} 
                                        className={`py-5 rounded-2xl border-2 transition-all font-black uppercase text-[11px] tracking-widest ${chatSettings.ai.voice === v ? 'bg-xs-pink text-black border-xs-pink' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
                                    >
                                        {v}
                                    </button>
                                  ))}
                               </div>
                           </div>
                           <Toggle label="Auto-Speak Messages" checked={chatSettings.ai.autoSpeak} onChange={v => setChatSettings({...chatSettings, ai: {...chatSettings.ai, autoSpeak: v}})} />
                           <div className="space-y-4">
                               <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2">AI Persona Matrix</label>
                               <div className="grid grid-cols-2 gap-3">
                                  {['Assertive', 'Chill', 'Chaotic', 'Deep'].map(p => (
                                    <button 
                                        key={p} 
                                        onClick={() => setChatSettings({...chatSettings, ai: {...chatSettings.ai, persona: p}})} 
                                        className={`py-4 rounded-2xl border transition-all font-black uppercase text-[10px] tracking-widest ${chatSettings.ai.persona === p ? 'bg-xs-purple text-white border-xs-purple' : 'bg-white/5 text-gray-600 border-white/5'}`}
                                    >
                                        {p}
                                    </button>
                                  ))}
                               </div>
                           </div>
                        </div>
                      )}
                  </div>
                  
                  <div className="mt-10 pt-10 border-t border-white/10 flex-shrink-0">
                      <button 
                        onClick={() => { soundService.play('success'); setShowSettings(false); }} 
                        className="w-full py-6 bg-gradient-to-r from-xs-purple via-xs-cyan to-xs-pink rounded-3xl font-black text-black text-xl uppercase tracking-[0.4em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all"
                      >
                          Save Parameters
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Chat;
