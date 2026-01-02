
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card3D from '../components/Card3D';
import CallInterface from '../components/CallInterface';
import LiveStreamInterface from '../components/LiveStreamInterface';
import TransactionModal from '../components/TransactionModal';
import { ICONS, REACTION_OPTIONS } from '../constants';
import { User, Message, Report, UserStatus, ChatRoom, SubscriptionTier } from '../types';
import { soundService } from '../services/soundService';
import { chatService } from '../services/chatService';
import { generateSmartReplies, rewriteMessage } from '../services/geminiService';

interface ChatProps {
  user: User;
  onReport: (report: Report) => void;
  onUpdateUser: (data: Partial<User>) => void;
}

interface OinkInteraction {
    id: string;
    userId: string;
    username: string;
    avatar: string;
    time: string;
    hasViewedProfile: boolean;
}

interface RightNowAd {
    id: string;
    userId: string;
    username: string;
    avatar: string;
    text: string;
    locationType: 'Hosting' | 'Travel' | 'Car' | 'Public' | 'Hotel';
    durationLabel: string;
    expiresAt: number;
    distance: string;
    likes: number;
    color: 'yellow' | 'pink' | 'cyan' | 'purple';
}

// 4D Particle Effect Component
const ParticleOverlay = ({ activeType }: { activeType: string | null }) => {
    if (!activeType) return null;
    
    const particles = useMemo(() => Array.from({ length: 20 }), [activeType]);
    const emojis = activeType === 'oink' ? ['🐷', '🐽', '✨', '🐖'] : ['😉', '❤️', '✨', '😍'];
    
    return (
        <div className="absolute inset-0 pointer-events-none z-[60] overflow-hidden">
            {particles.map((_, i) => (
                <div 
                    key={i}
                    className="absolute animate-float text-4xl opacity-0"
                    style={{
                        left: `${Math.random() * 80 + 10}%`,
                        bottom: '10%',
                        animation: `float-up ${1 + Math.random() * 1.5}s ease-out forwards`,
                        animationDelay: `${Math.random() * 0.3}s`
                    }}
                >
                    {emojis[Math.floor(Math.random() * emojis.length)]}
                </div>
            ))}
            <style>{`
                @keyframes float-up {
                    0% { transform: translateY(0) scale(0.5) rotate(0deg); opacity: 0; }
                    20% { opacity: 1; }
                    100% { transform: translateY(-70vh) scale(1.5) rotate(${Math.random() > 0.5 ? 360 : -360}deg); opacity: 0; }
                }
            `}</style>
        </div>
    );
};

const MediaDisplay: React.FC<{ msg: Message }> = ({ msg }) => {
    if (msg.imageUrl) return (
        <div className="mb-2 rounded-2xl overflow-hidden border border-white/10 group/media relative shadow-[0_0_15px_rgba(255,255,255,0.1)]">
            <img src={msg.imageUrl} className="w-full h-auto max-h-80 object-cover" alt="visual_sync" />
            <div className="absolute inset-0 bg-xs-cyan/10 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                <ICONS.Search className="text-white drop-shadow-lg" size={24} />
            </div>
        </div>
    );
    if (msg.videoUrl) return (
        <div className="mb-2 rounded-2xl overflow-hidden border border-white/10 bg-black relative aspect-video flex items-center justify-center shadow-[0_0_15px_rgba(189,0,255,0.2)]">
            <video src={msg.videoUrl} controls className="max-w-full max-h-full" />
        </div>
    );
    if (msg.audioUrl) return (
        <div className="mb-2 p-3 bg-white/10 rounded-2xl border border-white/10 flex items-center gap-3 min-w-[240px] backdrop-blur-md">
            <div className="p-2 bg-xs-purple/20 rounded-full text-xs-purple flex-shrink-0 animate-pulse">
                <ICONS.Mic size={18} />
            </div>
            <audio src={msg.audioUrl} controls className="h-8 w-full max-w-[200px] opacity-80 hover:opacity-100 transition-opacity" />
        </div>
    );
    return null;
};

const LocationMessage: React.FC<{ msg: Message, isMe: boolean }> = ({ msg, isMe }) => {
    if (!msg.location) return null;
    
    const now = Date.now();
    const isLive = msg.liveLocationExpiry && msg.liveLocationExpiry > now;
    const minutesLeft = isLive ? Math.ceil((msg.liveLocationExpiry! - now) / 60000) : 0;

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${msg.location.lat},${msg.location.lng}`;
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${msg.location.lat},${msg.location.lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:0x00ffff%7Clabel:X%7C${msg.location.lat},${msg.location.lng}&style=feature:all%7Celement:all%7Csaturation:-100%7Clightness:-20%7Cvisibility:on&style=feature:water%7Celement:geometry%7Ccolor:0x0d0d0d&style=feature:landscape%7Celement:geometry%7Ccolor:0x050505&style=feature:road%7Celement:geometry%7Ccolor:0x1a1a1a&style=feature:poi%7Cvisibility:off&key=${process.env.API_KEY}`;
    
    return (
        <div className="space-y-2 p-1">
            <div className="relative block aspect-[2/1] w-full rounded-[1.5rem] overflow-hidden border border-white/10 bg-xs-dark group shadow-2xl transition-all hover:scale-[1.02] hover:shadow-xs-cyan/20">
                 <a href={mapUrl} target="_blank" rel="noreferrer" className="block w-full h-full">
                     <img src={staticMapUrl} alt="Map Preview" className={`w-full h-full object-cover transition-opacity ${isLive ? 'opacity-80' : 'opacity-40 grayscale'}`} />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40"></div>
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="relative">
                            {isLive && <div className="absolute inset-[-30px] border border-xs-cyan/20 rounded-full animate-ping"></div>}
                            <ICONS.MapPin size={24} className={`${isLive ? 'text-xs-pink' : 'text-gray-500'}`} />
                        </div>
                     </div>
                 </a>

                 {isLive && (
                    <div className="absolute top-2 right-2 px-2 py-0.5 bg-xs-pink text-black text-[7px] font-black uppercase rounded-full shadow-lg flex items-center gap-1 z-10 animate-pulse">
                        <div className="w-1 h-1 bg-black rounded-full"></div>
                        LIVE • {minutesLeft}m
                    </div>
                 )}
                 
                 {!isLive && msg.liveLocationExpiry && (
                     <div className="absolute top-2 right-2 px-2 py-0.5 bg-gray-700 text-white text-[7px] font-black uppercase rounded-full shadow-lg z-10">
                         EXPIRED
                     </div>
                 )}
            </div>
            <p className="text-[9px] font-black text-xs-cyan uppercase tracking-widest px-1">{msg.location.label || 'Shared_Position'}</p>
        </div>
    );
};

const Chat: React.FC<ChatProps> = ({ user, onReport, onUpdateUser }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'direct' | 'rooms' | 'oink' | 'rightnow'>('direct');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'direct' | 'rooms' | 'oink' | 'rightnow'>('direct');
  const [showExtraMenu, setShowExtraMenu] = useState(false);
  const [showLocationDurations, setShowLocationDurations] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [activeMessageOptionsId, setActiveMessageOptionsId] = useState<string | null>(null);
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [showPremiumAlert, setShowPremiumAlert] = useState(false);
  const [activeParticleEffect, setActiveParticleEffect] = useState<string | null>(null);
  
  // Interaction State
  const [smileTarget, setSmileTarget] = useState<OinkInteraction | null>(null);

  // Voice Recording Refs
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  
  // Typing Indicator State
  const [inputText, setInputText] = useState('');

  // Call State
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');

  // Live Stream State
  const [showStreamInterface, setShowStreamInterface] = useState(false);

  // Transaction Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState<'send' | 'request'>('send');

  // RightNow Ad State
  const [showCreateAd, setShowCreateAd] = useState(false);
  const [selectedAd, setSelectedAd] = useState<RightNowAd | null>(null);
  const [showAdReplyModal, setShowAdReplyModal] = useState(false);
  const [adReplyText, setAdReplyText] = useState('');
  
  const [adText, setAdText] = useState('');
  const [adDuration, setAdDuration] = useState('1h');
  const [adLocationType, setAdLocationType] = useState<'Hosting' | 'Travel' | 'Car' | 'Public' | 'Hotel'>('Hosting');
  const [activeAds, setActiveAds] = useState<RightNowAd[]>([
      { id: 'ad1', userId: 'u22', username: 'HungJock_XL', avatar: 'https://picsum.photos/100/100?random=22', text: 'Hosting in Chelsea. Into chill and fun. 🍆', locationType: 'Hosting', durationLabel: '2h', expiresAt: Date.now() + 7200000, distance: '0.5km', likes: 24, color: 'yellow' },
      { id: 'ad2', userId: 'u33', username: 'VersBtm_City', avatar: 'https://picsum.photos/100/100?random=33', text: 'Looking for a top to drive. Car fun?', locationType: 'Car', durationLabel: '30m', expiresAt: Date.now() + 1800000, distance: '1.2km', likes: 12, color: 'pink' },
      { id: 'ad3', userId: 'u44', username: 'GymRat_Pump', avatar: 'https://picsum.photos/100/100?random=44', text: 'Post workout. Need protein. 💦', locationType: 'Travel', durationLabel: 'Tonight', expiresAt: Date.now() + 14400000, distance: '0.2km', likes: 5, color: 'cyan' },
  ]);

  // Data from Service
  const [chats, setChats] = useState<ChatRoom[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [smartReplies, setSmartReplies] = useState<string[]>([]);
  const [isRewriting, setIsRewriting] = useState(false);

  // Configure initial preferences
  const [chatSettings, setChatSettings] = useState({
      readReceipts: true,
      activityDisplay: true,
      mediaAutoDownload: false,
      notificationPreviews: true,
      blurNSFW: true,
      aiVoiceEnabled: true
  });

  const [oinkSettings, setOinkSettings] = useState({
      allowOinks: true,
      notifyOnView: true,
      publicHistory: false,
      soundEffects: true
  });

  const [roomSettings, setRoomSettings] = useState({
      incognitoMode: false,
      mediaAutoLoad: true,
      roomNotifications: true,
      locationTags: false
  });

  const [rightNowSettings, setRightNowSettings] = useState({
      ghostMode: false,
      matchAlerts: true,
      showExactDistance: true,
      incognitoBrowsing: false
  });

  const [oinks, setOinks] = useState<OinkInteraction[]>([]);

  const isPremium = user.subscription !== SubscriptionTier.FREE;
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
      const unsub = chatService.subscribeToChats((updatedChats) => {
          setChats(updatedChats);
      });
      setChats(chatService.getChats());
      return unsub;
  }, []);

  // Generate Smart Replies when new message arrives
  useEffect(() => {
      const lastMsg = messages[messages.length - 1];
      if (lastMsg && lastMsg.senderId !== 'me' && lastMsg.text) {
          generateSmartReplies(lastMsg.text).then(replies => setSmartReplies(replies));
      } else {
          setSmartReplies([]);
      }
  }, [messages]);

  // Load Oinks from storage
  useEffect(() => {
      const loadOinks = () => {
          const savedOinks = localStorage.getItem('inxs_oinks');
          if (savedOinks) {
              setOinks(JSON.parse(savedOinks));
          } else {
              // Initial Mock Data if empty
              const mocks = [
                { id: '1', userId: 'u88', username: 'Troye_Sivan_Stan', avatar: 'https://picsum.photos/100/100?random=88', time: '2m ago', hasViewedProfile: true },
                { id: '2', userId: 'u99', username: 'GymRat_TO', avatar: 'https://picsum.photos/100/100?random=99', time: '45m ago', hasViewedProfile: true },
              ];
              setOinks(mocks);
              localStorage.setItem('inxs_oinks', JSON.stringify(mocks));
          }
      };
      
      loadOinks();
      
      // Polling for demo purposes to pick up new Oinks from other tabs
      const interval = setInterval(loadOinks, 2000);
      return () => clearInterval(interval);
  }, []);

  useEffect(() => {
      if (selectedChatId) {
          setMessages(chatService.getMessages(selectedChatId));
          const unsub = chatService.subscribeToMessages(selectedChatId, (msgs) => {
              setMessages([...msgs]);
              scrollToBottom();
          });
          scrollToBottom();
          return unsub;
      }
  }, [selectedChatId]);

  useEffect(() => {
      const chatId = searchParams.get('chatId');
      if (chatId) setSelectedChatId(chatId);
      else setSelectedChatId(null);
  }, [searchParams]);

  const openChat = (id: string) => {
      setSearchParams({ chatId: id });
      soundService.play('unlock');
  };

  const closeChat = () => {
      setSearchParams({});
      setReplyingTo(null);
  };

  const openSettings = () => {
      setActiveSettingsTab(activeTab);
      setShowSettings(true);
      soundService.play('click');
  };

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  const handleSend = (options?: Partial<Message>) => {
    if ((!inputText.trim() && !options) || !selectedChatId) return;
    
    const newMsg: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        text: inputText,
        replyToId: replyingTo?.id,
        timestamp: Date.now(),
        ...options
    };

    chatService.sendMessage(selectedChatId, newMsg);
    setInputText('');
    setReplyingTo(null);
    setShowExtraMenu(false);
    setShowLocationDurations(false);
    soundService.play('send');
    scrollToBottom();
  };

  const handleRewrite = async () => {
      if (!inputText.trim() || isRewriting) return;
      setIsRewriting(true);
      soundService.play('scan');
      try {
          const tones: ('flirty' | 'formal' | 'cyberpunk')[] = ['flirty', 'cyberpunk'];
          const tone = tones[Math.floor(Math.random() * tones.length)];
          const rewritten = await rewriteMessage(inputText, tone);
          setInputText(rewritten);
          soundService.play('success');
      } catch {
          soundService.play('error');
      } finally {
          setIsRewriting(false);
      }
  };

  const handleSendInteraction = (type: 'oink' | 'smile') => {
    soundService.play(type === 'oink' ? 'oink' : 'success');
    setActiveParticleEffect(type);
    setTimeout(() => setActiveParticleEffect(null), 3000); 
    
    const text = type === 'oink' ? "🐷 *Oink!*" : "😉 *Sent a smile*";
    handleSend({ text });
    setShowExtraMenu(false);
  };

  const handleReaction = (emoji: string) => {
      if (!selectedChatId) return;
      handleSend({ text: `Reacted: ${emoji}` });
      soundService.play('pop');
      setShowExtraMenu(false);
  };

  // --- OINK TAB ACTIONS ---

  const handleReplyToOink = (oink: OinkInteraction) => {
      let chat = chats.find(c => c.id === oink.userId);
      if (!chat) {
          chatService.createChat({ 
              id: oink.userId, 
              name: oink.username, 
              type: 'private', 
              avatar: oink.avatar, 
              unreadCount: 0, 
              lastMessage: 'New Interaction' 
          });
      }
      openChat(oink.userId);
  };

  const handleOinkBack = (id: string) => { 
      soundService.play('oink'); 
      setActiveParticleEffect('oink');
      setTimeout(() => setActiveParticleEffect(null), 2500);
      
      // Simulate sending back
      const targetOink = oinks.find(o => o.id === id);
      if (targetOink) {
          chatService.sendMessage(targetOink.userId, {
              id: Date.now().toString(),
              senderId: 'me',
              text: "🐷 *Oinked Back!*",
              timestamp: Date.now()
          });
      }
  };

  const confirmSendSmile = (oink: OinkInteraction) => {
      soundService.play('success'); 
      setActiveParticleEffect('smile');
      setTimeout(() => setActiveParticleEffect(null), 2500);

      let chat = chats.find(c => c.id === oink.userId);
      if (!chat) {
          chatService.createChat({ 
              id: oink.userId, 
              name: oink.username, 
              type: 'private', 
              avatar: oink.avatar, 
              unreadCount: 0, 
              lastMessage: 'New Interaction' 
          });
      }

      chatService.sendMessage(oink.userId, {
          id: Date.now().toString(),
          senderId: 'me',
          text: "😉 *Sent a smile*",
          timestamp: Date.now()
      });
      
      setSmileTarget(null);
  };

  const handleDeleteOink = (id: string) => { 
      soundService.play('trash'); 
      const newOinks = oinks.filter(o => o.id !== id);
      setOinks(newOinks); 
      localStorage.setItem('inxs_oinks', JSON.stringify(newOinks));
  };

  // --- END OINK TAB ACTIONS ---

  const handleStartCall = (type: 'audio' | 'video') => {
      if (!isPremium) {
          soundService.play('error');
          setShowPremiumAlert(true);
          return;
      }
      setCallType(type);
      setCallActive(true);
  };

  const handleStartStream = () => {
      if (!isPremium) {
          soundService.play('error');
          setShowPremiumAlert(true);
          return;
      }
      setShowExtraMenu(false);
      setShowStreamInterface(true);
  };

  const handleStreamGoLive = () => {
      handleSend({ text: "🔴 STARTED A LIVE STREAM • JOIN NOW" });
  };

  const handlePostAd = () => {
      if (!adText.trim()) return;
      const newAd: RightNowAd = {
          id: Date.now().toString(),
          userId: user.id,
          username: user.username,
          avatar: user.avatarUrl,
          text: adText,
          locationType: adLocationType,
          durationLabel: adDuration,
          expiresAt: Date.now() + 3600000,
          distance: '0.1km',
          likes: 0,
          color: ['yellow', 'pink', 'cyan', 'purple'][Math.floor(Math.random() * 4)] as any
      };
      setActiveAds([newAd, ...activeAds]);
      setAdText('');
      setShowCreateAd(false);
      soundService.play('broadcast');
  };

  const handleAdAction = (action: 'message' | 'oink' | 'like' | 'report') => {
      if (!selectedAd) return;
      switch(action) {
          case 'message':
              soundService.play('click');
              setShowAdReplyModal(true);
              break;
          case 'oink':
              soundService.play('oink');
              const newOink = { 
                  id: Date.now().toString(), 
                  userId: selectedAd.userId, 
                  username: selectedAd.username, 
                  avatar: selectedAd.avatar, 
                  time: 'Just now', 
                  hasViewedProfile: true 
              };
              setOinks(prev => [newOink, ...prev]);
              localStorage.setItem('inxs_oinks', JSON.stringify([newOink, ...oinks]));
              alert(`Oink sent to ${selectedAd.username}`);
              break;
          case 'like':
              soundService.play('success');
              setActiveAds(prev => prev.map(a => a.id === selectedAd.id ? { ...a, likes: a.likes + 1 } : a));
              break;
          case 'report':
              soundService.play('error');
              alert("Signal reported.");
              setSelectedAd(null);
              break;
      }
  };

  const handleSendAdReply = () => {
      if (!selectedAd || !adReplyText.trim()) return;
      
      let chat = chats.find(c => c.id === selectedAd.userId);
      if (!chat) {
          chat = {
              id: selectedAd.userId,
              name: selectedAd.username,
              type: 'private',
              avatar: selectedAd.avatar,
              unreadCount: 0,
              lastMessage: 'New Connection'
          };
          chatService.createChat(chat);
      }
      
      const msg: Message = {
          id: Date.now().toString(),
          senderId: 'me',
          text: `[Replying to Signal: "${selectedAd.text}"] ${adReplyText}`,
          timestamp: Date.now()
      };
      chatService.sendMessage(selectedAd.userId, msg);
      
      soundService.play('send');
      setAdReplyText('');
      setShowAdReplyModal(false);
      setSelectedAd(null);
      setTimeout(() => openChat(selectedAd.userId), 100);
  };

  const handleVoiceNoteToggle = async () => { if(isRecordingVoice) { mediaRecorderRef.current?.stop(); setIsRecordingVoice(false); soundService.play('success'); } else { try { const stream = await navigator.mediaDevices.getUserMedia({audio:true}); const recorder = new MediaRecorder(stream); mediaRecorderRef.current = recorder; audioChunksRef.current = []; recorder.ondataavailable = e => audioChunksRef.current.push(e.data); recorder.onstop = () => { const blob = new Blob(audioChunksRef.current, {type:'audio/webm'}); handleSend({audioUrl: URL.createObjectURL(blob)}); stream.getTracks().forEach(t => t.stop()); }; recorder.start(); setIsRecordingVoice(true); soundService.play('scan'); } catch(e) { console.error(e); alert("Mic Access Denied"); } } };
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => { const file = e.target.files?.[0]; if(file) { const reader = new FileReader(); reader.onload = ev => { if(file.type.startsWith('image')) handleSend({imageUrl: ev.target?.result as string}); else if(file.type.startsWith('video')) handleSend({videoUrl: ev.target?.result as string}); }; reader.readAsDataURL(file); soundService.play('scan'); setShowExtraMenu(false); } };
  const handleShareLocation = (type: string) => { if(navigator.geolocation) navigator.geolocation.getCurrentPosition(pos => handleSend({location:{lat:pos.coords.latitude, lng:pos.coords.longitude, label: type === 'static' ? 'Pinned Location' : 'Live Location'}, liveLocationExpiry: type === 'static' ? undefined : Date.now() + 3600000})); setShowLocationDurations(false); };

  const getSettingsConfig = () => {
      if (activeSettingsTab === 'oink') return [{key:'allowOinks',label:'Allow Oinks',desc:'Receive signals',color:'xs-pink',state:oinkSettings,setter:setOinkSettings}, {key:'notifyOnView',label:'View Alerts',desc:'Notify on view',color:'xs-cyan',state:oinkSettings,setter:setOinkSettings}, {key:'soundEffects',label:'SFX Volume',desc:'Oink sounds',color:'xs-yellow',state:oinkSettings,setter:setOinkSettings}];
      if (activeSettingsTab === 'rooms') return [{key:'incognitoMode',label:'Incognito',desc:'Hide presence',color:'xs-purple',state:roomSettings,setter:setRoomSettings}, {key:'mediaAutoLoad',label:'Media Load',desc:'Auto-show',color:'xs-pink',state:roomSettings,setter:setRoomSettings}];
      if (activeSettingsTab === 'rightnow') return [{key:'ghostMode',label:'Ghost Protocol',desc:'Hide distance',color:'xs-pink',state:rightNowSettings,setter:setRightNowSettings}, {key:'matchAlerts',label:'Signal Alerts',desc:'Notify on new ads',color:'xs-yellow',state:rightNowSettings,setter:setRightNowSettings}, {key:'showExactDistance',label:'Precise Geo',desc:'Show meters',color:'xs-cyan',state:rightNowSettings,setter:setRightNowSettings}];
      return [{key:'readReceipts',label:'Read Receipts',desc:'Confirm delivery',color:'xs-cyan',state:chatSettings,setter:setChatSettings}, {key:'activityDisplay',label:'Activity',desc:'Show Online',color:'xs-cyan',state:chatSettings,setter:setChatSettings}, {key:'aiVoiceEnabled',label:'AI Voice',desc:'Speak messages',color:'xs-pink',state:chatSettings,setter:setChatSettings}];
  };

  const tabs = [
      { id: 'direct', label: 'Messages', bgActive: 'bg-xs-cyan', textInactive: 'text-xs-cyan', borderInactive: 'border-xs-cyan/30' },
      { id: 'rooms', label: 'Rooms', bgActive: 'bg-red-500', textInactive: 'text-red-500', borderInactive: 'border-red-500/30' },
      { id: 'oink', label: 'Oink', bgActive: 'bg-xs-cyan', textInactive: 'text-xs-cyan', borderInactive: 'border-xs-cyan/30' },
      { id: 'rightnow', label: 'RightNow', bgActive: 'bg-red-500', textInactive: 'text-red-500', borderInactive: 'border-red-500/30' }
  ];

  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Connect';
  const directChats = chats.filter(c => c.type === 'private');
  const roomsChats = chats.filter(c => c.type !== 'private');
  const selectedChatData = chats.find(c => c.id === selectedChatId);
  const totalUnreadMessages = directChats.reduce((acc, curr) => acc + curr.unreadCount, 0);
  const totalOinks = oinks.length;

  return (
    <div className="h-full flex flex-col relative preserve-3d">
      
      {/* 4D Effects Overlay */}
      <ParticleOverlay activeType={activeParticleEffect} />

      {/* Smile Confirmation Modal */}
      {smileTarget && (
          <div className="fixed inset-0 z-[200] bg-black/80 flex items-center justify-center p-6 animate-in fade-in">
              <div className="bg-xs-dark border border-xs-yellow/50 p-6 rounded-[2rem] w-full max-w-xs text-center shadow-4xl relative">
                  <h3 className="text-xl font-black text-white italic uppercase tracking-tighter mb-4">Send Smile?</h3>
                  <div className="w-16 h-16 mx-auto rounded-xl overflow-hidden mb-4 border border-white/20">
                      <img src={smileTarget.avatar} className="w-full h-full object-cover" />
                  </div>
                  <p className="text-sm text-gray-400 mb-6">To <span className="text-xs-yellow font-bold">{smileTarget.username}</span></p>
                  <div className="flex gap-3">
                      <button onClick={() => setSmileTarget(null)} className="flex-1 py-3 bg-white/10 rounded-xl font-black text-xs uppercase hover:bg-white/20">Cancel</button>
                      <button onClick={() => confirmSendSmile(smileTarget)} className="flex-1 py-3 bg-xs-yellow text-black rounded-xl font-black text-xs uppercase shadow-lg hover:scale-105 transition-all">Send 😉</button>
                  </div>
              </div>
          </div>
      )}

      {/* GLOBAL MODALS */}
      <CallInterface 
        isOpen={callActive} 
        onClose={() => setCallActive(false)} 
        type={callType} 
        partnerName={selectedChatData?.name || 'Unknown'} 
        partnerAvatar={selectedChatData?.avatar || ''} 
      />

      <LiveStreamInterface 
        isOpen={showStreamInterface}
        onClose={() => setShowStreamInterface(false)}
        onStartStream={handleStreamGoLive}
        onEndStream={() => handleSend({ text: "Stream Ended" })}
      />

      <TransactionModal 
        isOpen={showTransferModal} 
        onClose={() => setShowTransferModal(false)} 
        initialType={transferType}
        onConfirm={(a, n, t) => {
            handleSend({ transferAmount: a, transferType: t, text: n });
            setShowTransferModal(false);
        }}
        recipientName={selectedChatData?.name || ''}
        recipientAvatar={selectedChatData?.avatar || ''}
        currentBalance={user.walletBalance}
      />

      {/* Premium Alert */}
      {showPremiumAlert && (
          <div className="fixed inset-0 z-[300] bg-black/90 flex items-center justify-center p-6 animate-in zoom-in-95" onClick={() => setShowPremiumAlert(false)}>
              <div className="bg-xs-dark border border-xs-pink/50 p-8 rounded-[2.5rem] max-w-sm text-center shadow-[0_0_50px_rgba(255,0,255,0.3)]">
                  <ICONS.Lock size={48} className="mx-auto mb-4 text-xs-pink" />
                  <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter mb-2">Premium Feature</h3>
                  <p className="text-sm text-gray-400 mb-6">Live streaming and video calls require a premium subscription.</p>
                  <button onClick={() => navigate('/subscription')} className="w-full py-4 bg-xs-pink text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 transition-all">Upgrade Now</button>
              </div>
          </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-md glass-panel rounded-[3.5rem] border border-xs-cyan/20 p-8 shadow-4xl relative overflow-hidden flex flex-col max-h-[80vh]">
                  <header className="flex justify-between items-center mb-6 relative z-10 shrink-0">
                      <div><h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Config</h2><p className="text-[10px] font-black uppercase text-xs-cyan tracking-[0.4em] mt-1">Preferences</p></div>
                      <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500"><ICONS.X size={24}/></button>
                  </header>
                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2 shrink-0">
                      {tabs.map(t => (
                          <button key={t.id} onClick={() => { setActiveSettingsTab(t.id as any); soundService.play('tab'); }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeSettingsTab === t.id ? `${t.bgActive} text-black border-transparent` : `bg-white/5 text-gray-400 border-white/5`}`}>{t.label}</button>
                      ))}
                  </div>
                  <div className="space-y-4 relative z-10 overflow-y-auto custom-scrollbar pr-2 flex-1">
                      {getSettingsConfig().map((s: any) => (
                          <div key={s.key} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                              <div><p className={`text-xs font-black uppercase tracking-widest text-${s.color}`}>{s.label}</p><p className="text-[8px] text-gray-500 uppercase tracking-[0.2em] mt-0.5">{s.desc}</p></div>
                              <button onClick={() => s.setter((prev: any) => ({ ...prev, [s.key]: !prev[s.key] }))} className={`w-12 h-6 rounded-full relative transition-all duration-500 ${s.state[s.key] ? `bg-${s.color}` : 'bg-white/10'}`}><div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${s.state[s.key] ? 'left-7' : 'left-1'}`} /></button>
                          </div>
                      ))}
                  </div>
              </div>
          </div>
      )}

      {/* RightNow - Create Ad Modal */}
      {showCreateAd && (
          <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-sm glass-panel rounded-[3.5rem] border border-xs-yellow/30 p-8 shadow-4xl">
                  <header className="flex justify-between items-center mb-6">
                      <div><h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Broadcast</h2><p className="text-[9px] font-black uppercase text-xs-yellow tracking-[0.4em] mt-1">Hookup_Signal_V1</p></div>
                      <button onClick={() => setShowCreateAd(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500"><ICONS.X size={20}/></button>
                  </header>
                  <div className="space-y-6">
                      <div className="space-y-2"><label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Signal_Intent</label><textarea value={adText} onChange={(e) => setAdText(e.target.value)} placeholder="What are you looking for right now? Be specific..." className="w-full h-24 bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium italic outline-none focus:border-xs-yellow transition-all resize-none" /></div>
                      <div className="space-y-2"><label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Duration</label><div className="grid grid-cols-3 gap-2">{['30m', '1h', '2h', '4h', 'Tonight'].map(d => <button key={d} onClick={() => setAdDuration(d)} className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${adDuration === d ? 'bg-xs-yellow text-black border-xs-yellow' : 'bg-white/5 text-gray-400 border-white/10'}`}>{d}</button>)}</div></div>
                      <div className="space-y-2"><label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Location</label><div className="grid grid-cols-2 gap-2">{(['Hosting', 'Travel', 'Car', 'Public', 'Hotel'] as const).map(l => <button key={l} onClick={() => setAdLocationType(l)} className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${adLocationType === l ? 'bg-xs-cyan text-black border-xs-cyan' : 'bg-white/5 text-gray-400 border-white/10'}`}>{l}</button>)}</div></div>
                      <button onClick={handlePostAd} disabled={!adText.trim()} className="w-full py-5 bg-gradient-to-r from-xs-yellow via-orange-500 to-red-500 text-black rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50">Transmit_Signal</button>
                  </div>
              </div>
          </div>
      )}

      {/* RightNow - Ad Detail / Reply Modal */}
      {selectedAd && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-sm relative">
                  <button onClick={() => setSelectedAd(null)} className="absolute -top-12 right-0 p-3 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all hover:rotate-90"><ICONS.X size={24} /></button>
                  <Card3D className="min-h-[400px]" innerClassName="p-0 overflow-hidden bg-black/80 border-white/10" glowColor={selectedAd.color}>
                      <div className="h-48 relative">
                          <img src={selectedAd.avatar} className="w-full h-full object-cover opacity-60" alt="bg" />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black"></div>
                          <div className="absolute bottom-6 left-6">
                              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-lg">{selectedAd.username}</h2>
                              <div className="flex items-center gap-2 mt-2">
                                  <span className={`bg-xs-${selectedAd.color} text-black text-[9px] font-black px-2 py-0.5 rounded uppercase`}>{selectedAd.locationType}</span>
                                  <span className="text-white text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded">{rightNowSettings.ghostMode ? 'Unknown' : selectedAd.distance} Away</span>
                              </div>
                          </div>
                      </div>
                      <div className="p-8 space-y-8 relative">
                          <div className="space-y-3">
                              <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Signal_Message</label>
                              <div className="relative">
                                  <ICONS.MessageCircle className={`absolute -top-2 -left-2 text-xs-${selectedAd.color} opacity-20`} size={40} />
                                  <p className={`text-xl font-medium italic leading-relaxed text-white relative z-10`}>"{selectedAd.text}"</p>
                              </div>
                          </div>
                          {showAdReplyModal ? (
                              <div className="animate-in slide-in-from-bottom-2">
                                  <textarea value={adReplyText} onChange={(e) => setAdReplyText(e.target.value)} placeholder="Type your reply..." className="w-full h-24 bg-black/60 border border-white/10 rounded-xl p-3 text-white text-sm outline-none focus:border-xs-cyan transition-all mb-2" />
                                  <button onClick={handleSendAdReply} className="w-full py-3 bg-xs-cyan text-black rounded-xl font-black uppercase text-[10px] tracking-widest">Send Reply</button>
                              </div>
                          ) : (
                              <div className="grid grid-cols-4 gap-3">
                                  <button onClick={() => handleAdAction('message')} className="col-span-2 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg"><ICONS.MessageCircle size={16} /> Reply</button>
                                  <button onClick={() => handleAdAction('oink')} className="py-4 bg-xs-pink/20 text-xs-pink border border-xs-pink/50 rounded-2xl flex items-center justify-center hover:bg-xs-pink hover:text-black transition-all"><span className="font-black text-[10px]">OINK</span></button>
                                  <button onClick={() => handleAdAction('like')} className="py-4 bg-xs-yellow/20 text-xs-yellow border border-xs-yellow/50 rounded-2xl flex items-center justify-center hover:bg-xs-yellow hover:text-black transition-all"><ICONS.Flame size={18} /></button>
                              </div>
                          )}
                          <button onClick={() => handleAdAction('report')} className="w-full py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2"><ICONS.Flag size={12} /> Report_Signal</button>
                      </div>
                  </Card3D>
              </div>
          </div>
      )}

      {selectedChatId ? (
          // DIRECT & ROOM CHAT VIEW
          <div className="fixed inset-0 z-50 bg-xs-black flex flex-col animate-in slide-in-from-right duration-300">
              <header className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-xs-cyan/20 shadow-[0_0_30px_rgba(0,255,255,0.1)] relative z-20">
                  <div className="flex items-center gap-3">
                      <button onClick={closeChat} className="p-2 -ml-2 text-gray-400 hover:text-xs-cyan rounded-full transition-colors"><ICONS.ArrowLeft size={24} /></button>
                      <div className="flex items-center gap-3">
                          <div className="relative">
                              <img src={(selectedChatData as any)?.avatar} className="w-10 h-10 rounded-full border border-xs-cyan/30 shadow-lg object-cover" alt="avatar" />
                              {(selectedChatData as any)?.status === 'online' && (
                                  <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border border-black animate-pulse"></div>
                              )}
                          </div>
                          <div>
                              <h3 className="font-black text-white leading-tight italic tracking-tight text-lg uppercase truncate max-w-[120px]">{(selectedChatData as any)?.name}</h3>
                              <span className="text-[7px] font-black uppercase tracking-widest text-xs-cyan">{(selectedChatData as any)?.type === 'private' ? 'Encrypted' : 'Public'}</span>
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-2">
                      <button onClick={() => handleStartCall('audio')} className="p-2.5 bg-white/5 rounded-full text-white hover:bg-white/10 transition-transform"><ICONS.Phone size={18} /></button>
                      <button onClick={() => handleStartCall('video')} className="p-2.5 bg-white/5 rounded-full text-white hover:bg-white/10 transition-transform"><ICONS.Video size={18} /></button>
                      <button onClick={handleVoiceNoteToggle} className={`p-2.5 rounded-full transition-all ${isRecordingVoice ? 'bg-red-500 text-white animate-pulse' : 'bg-white/5 text-xs-purple'}`}><ICONS.Mic size={18} /></button>
                      <button onClick={() => setShowLocationDurations(!showLocationDurations)} className="p-2.5 bg-white/5 rounded-full text-xs-cyan"><ICONS.MapPin size={18} /></button>
                  </div>
                  {showLocationDurations && <div className="absolute top-full right-4 bg-black border border-white/20 p-2 rounded-xl flex flex-col gap-2 z-50"><button onClick={() => handleShareLocation('static')} className="text-white text-xs p-2 hover:bg-white/10 rounded">Static</button><button onClick={() => handleShareLocation('live')} className="text-xs-pink text-xs p-2 hover:bg-white/10 rounded">Live 1h</button></div>}
              </header>

              <div 
                className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar relative z-10" 
                style={{ 
                    backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(20,20,30,0.5) 0%, rgba(0,0,0,1) 100%)',
                    perspective: '1000px'
                }}
                onClick={() => { setActiveMessageOptionsId(null); setReplyingTo(null); setShowExtraMenu(false); }}
              >
                  {messages.map((msg, i) => {
                      const isMe = msg.senderId === 'me';
                      return (
                          <div 
                            key={msg.id} 
                            className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2 group/msg`}
                            style={{ 
                                transformStyle: 'preserve-3d', 
                                transition: 'transform 0.3s ease',
                            }}
                          >
                              {msg.replyToId && <div className="text-[9px] text-gray-400 italic mb-1 px-2">Replying to message...</div>}
                              <div 
                                className={`p-4 rounded-[1.5rem] shadow-lg backdrop-blur-md transition-all max-w-[85%] border border-white/10 relative ${isMe ? 'bg-gradient-to-r from-xs-cyan/80 to-blue-600/80 text-black rounded-tr-sm hover:scale-[1.02]' : 'bg-gradient-to-r from-xs-purple/80 to-pink-600/80 text-white rounded-tl-sm hover:scale-[1.02]'}`}
                                onContextMenu={(e) => { e.preventDefault(); soundService.play('click'); setActiveMessageOptionsId(msg.id); }}
                              >
                                  <MediaDisplay msg={msg} />
                                  {msg.location && <LocationMessage msg={msg} isMe={isMe} />}
                                  {msg.transferAmount && (
                                      <div className="flex items-center gap-2 mb-1 p-2 bg-black/20 rounded-lg">
                                          <ICONS.CreditCard size={14} />
                                          <span className="font-black">${msg.transferAmount.toFixed(2)}</span>
                                      </div>
                                  )}
                                  {msg.text && <p className="text-sm font-medium leading-snug tracking-wide">{msg.text}</p>}
                              </div>
                              
                              {/* Message Context Menu */}
                              {activeMessageOptionsId === msg.id && (
                                  <div className="flex gap-2 mt-2 animate-in zoom-in duration-200 origin-top">
                                      <button onClick={(e) => { e.stopPropagation(); setReplyingTo(msg); setActiveMessageOptionsId(null); }} className="text-[9px] bg-white/10 px-3 py-1.5 rounded-full text-white hover:bg-white/20">Reply</button>
                                      <div className="flex gap-1 bg-white/10 rounded-full px-2 py-1">
                                          {['🔥', '❤️', '👍'].map(emoji => (
                                              <button key={emoji} onClick={(e) => { e.stopPropagation(); handleReaction(emoji); setActiveMessageOptionsId(null); }} className="hover:scale-125 transition-transform">{emoji}</button>
                                          ))}
                                      </div>
                                      <button onClick={(e) => { e.stopPropagation(); /* delete logic */ setActiveMessageOptionsId(null); }} className="text-[9px] bg-red-500/20 text-red-500 px-3 py-1.5 rounded-full hover:bg-red-500 hover:text-white">Delete</button>
                                  </div>
                              )}
                          </div>
                      );
                  })}
                  <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-black/90 border-t border-xs-cyan/20 relative pb-10 md:pb-4 z-20">
                  {/* Smart Replies Area */}
                  {smartReplies.length > 0 && !inputText && (
                      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide px-1">
                          {smartReplies.map((reply, i) => (
                              <button 
                                key={i}
                                onClick={() => { setInputText(reply); soundService.play('click'); }}
                                className="bg-xs-cyan/10 border border-xs-cyan/20 text-xs-cyan text-[10px] font-black uppercase px-3 py-1.5 rounded-full whitespace-nowrap hover:bg-xs-cyan hover:text-black transition-all active:scale-95"
                              >
                                  {reply}
                              </button>
                          ))}
                      </div>
                  )}

                  {replyingTo && <div className="text-xs text-gray-400 mb-2 flex justify-between items-center bg-white/5 p-2 rounded-lg"><span>Replying to: {replyingTo.text?.substring(0,20)}...</span> <button onClick={() => setReplyingTo(null)}><ICONS.X size={12}/></button></div>}
                  
                  {showExtraMenu && <div className="absolute bottom-full left-4 bg-black/90 backdrop-blur-xl border border-white/20 p-3 rounded-2xl flex flex-col gap-2 z-50 mb-2 w-48 shadow-4xl animate-in slide-in-from-bottom-2">
                      <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-2 mb-1">Media</p>
                          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 text-white text-xs p-2 hover:bg-white/10 rounded-xl transition-all font-medium">
                              <ICONS.Camera size={14} className="text-xs-cyan" /> Photo/Video
                          </button>
                          <button onClick={handleStartStream} className="w-full flex items-center gap-3 text-white text-xs p-2 hover:bg-white/10 rounded-xl transition-all font-medium">
                              <ICONS.Radio size={14} className="text-red-500 animate-pulse" /> Live Stream
                          </button>
                      </div>

                      <div className="h-px bg-white/10" />

                      <div className="space-y-1">
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-2 mb-1">Interact</p>
                          <button onClick={() => handleSendInteraction('oink')} className="w-full flex items-center gap-3 text-white text-xs p-2 hover:bg-white/10 rounded-xl transition-all font-medium">
                              <span className="text-base">🐷</span> Send Oink
                          </button>
                          <button onClick={() => handleSendInteraction('smile')} className="w-full flex items-center gap-3 text-white text-xs p-2 hover:bg-white/10 rounded-xl transition-all font-medium">
                              <ICONS.Smile size={16} className="text-xs-yellow" /> Send Smile
                          </button>
                          <button onClick={() => { setTransferType('send'); setShowTransferModal(true); setShowExtraMenu(false); }} className="w-full flex items-center gap-3 text-white text-xs p-2 hover:bg-white/10 rounded-xl transition-all font-medium">
                              <ICONS.CreditCard size={16} className="text-green-500" /> Send Funds
                          </button>
                      </div>

                      <div className="h-px bg-white/10" />

                      <div>
                          <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest px-2 mb-2">React</p>
                          <div className="grid grid-cols-4 gap-2">
                              {['🔥', '❤️', '😈', '🍆'].map(emoji => (
                                  <button 
                                      key={emoji} 
                                      onClick={() => handleReaction(emoji)}
                                      className="aspect-square flex items-center justify-center bg-white/5 hover:bg-white/20 rounded-lg text-lg transition-all active:scale-90"
                                  >
                                      {emoji}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>}
                  
                  <div className="flex gap-2 items-end">
                      <button onClick={() => { soundService.play('click'); setShowExtraMenu(!showExtraMenu); }} className={`p-3 rounded-full transition-colors ${showExtraMenu ? 'bg-white/20 text-white' : 'bg-white/5 text-gray-400 hover:text-white'}`}><ICONS.Plus size={20} /></button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-[1.8rem] px-5 py-2.5 flex items-center transition-colors focus-within:border-xs-cyan/50 relative">
                          <input type="text" value={inputText} onChange={e => setInputText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSend()} placeholder="Message..." className="flex-1 bg-transparent text-white outline-none placeholder-gray-700 py-1 text-sm font-light italic tracking-wide w-full pr-8" />
                          {inputText && (
                              <button 
                                onClick={handleRewrite}
                                disabled={isRewriting}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs-purple/60 hover:text-xs-cyan transition-colors"
                                title="Magic Rewrite"
                              >
                                  {isRewriting ? <ICONS.RefreshCw size={14} className="animate-spin" /> : <ICONS.Sparkles size={14} />}
                              </button>
                          )}
                      </div>
                      <button onClick={() => handleSend()} className="p-3.5 bg-white/5 rounded-full text-white hover:bg-xs-cyan hover:text-black transition-all shadow-lg active:scale-90"><ICONS.Rocket size={20} /></button>
                  </div>
              </div>
          </div>
      ) : (
          // MAIN TAB VIEW
          <div className="flex flex-col h-full bg-gradient-to-br from-red-500/10 via-black to-xs-cyan/10">
            <header className="p-8 flex justify-between items-end">
                <div><h1 className="text-7xl font-black text-white italic tracking-tighter uppercase leading-none">Chats.</h1><p className="text-[10px] font-black text-xs-cyan uppercase tracking-[0.6em] mt-2 ml-1">{activeTabLabel}</p></div>
                <button onClick={openSettings} className="p-4 bg-white/5 rounded-[1.8rem] border border-white/10 text-red-500 hover:rotate-90 transition-all shadow-2xl hover:border-red-500/40"><ICONS.Settings size={28} /></button>
            </header>
            
            <div className="px-4 pb-6">
                <div className="grid grid-cols-4 gap-2">
                    {tabs.map(tab => {
                        let badge = 0;
                        if (tab.id === 'direct') badge = totalUnreadMessages;
                        if (tab.id === 'oink') badge = totalOinks;
                        return (
                            <button 
                                key={tab.id} 
                                onClick={() => { setActiveTab(tab.id as any); soundService.play('tab'); }} 
                                className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all relative truncate ${activeTab === tab.id ? `${tab.bgActive} text-black border-transparent shadow-lg scale-105` : `bg-white/5 ${tab.textInactive} ${tab.borderInactive} hover:bg-white/10`}`}
                            >
                                {tab.label}
                                {badge > 0 && <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white border-2 border-xs-black z-10 animate-in zoom-in">{badge > 99 ? '99+' : badge}</div>}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-8 custom-scrollbar pb-32">
                {activeTab === 'direct' ? directChats.map(chat => (
                        <Card3D key={chat.id} className="cursor-pointer h-24 group" innerClassName={`px-6 flex items-center border-white/5 transition-all ${chat.unreadCount > 0 ? 'bg-white/5 border-xs-pink/20' : 'bg-black/40 hover:bg-black/60'}`} glowColor={/* @ts-ignore */ (chat.status !== 'offline' ? (chat.status === 'online' ? 'cyan' : 'none') : 'none')} onClick={() => openChat(chat.id)}>
                            <div className="flex items-center gap-5 w-full">
                                <div className="relative">
                                    <img src={chat.avatar} className={`w-14 h-14 rounded-[1.8rem] border transition-transform group-hover:scale-105 ${chat.unreadCount > 0 ? 'border-xs-pink shadow-[0_0_10px_rgba(255,0,255,0.4)]' : 'border-white/10'}`} alt={chat.name} />
                                    {/* Mock Status based on unread count or random if user prop available, defaulting to online for active chats */}
                                    <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black animate-pulse bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className={`text-lg italic tracking-tighter uppercase transition-colors ${chat.unreadCount > 0 ? 'font-black text-xs-pink' : 'font-bold text-white'}`}>{chat.name}</h3>
                                            <span className="text-[8px] font-black bg-green-500/20 text-green-500 px-1.5 py-0.5 rounded uppercase tracking-widest">Online</span>
                                        </div>
                                        {chat.unreadCount > 0 && <div className="min-w-[18px] h-[18px] px-1.5 bg-xs-pink rounded-full flex items-center justify-center text-[9px] font-black text-black animate-pulse">{chat.unreadCount}</div>}
                                    </div>
                                    <p className={`text-xs truncate italic ${chat.unreadCount > 0 ? 'text-white font-bold' : 'text-gray-400 font-light'}`}>{chat.lastMessage}</p>
                                </div>
                            </div>
                        </Card3D>
                )) : activeTab === 'rooms' ? roomsChats.map(room => (
                    <Card3D key={room.id} className="cursor-pointer h-28 group" innerClassName="px-0 py-0 flex items-center border-white/5 bg-black/40 hover:bg-black/60 transition-all relative overflow-hidden" glowColor="purple" onClick={() => openChat(room.id)}>
                        <img src={room.avatar} className="absolute inset-0 w-full h-full object-cover opacity-40 group-hover:opacity-60 transition-opacity" alt="bg" />
                        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/60 to-transparent"></div>
                        <div className="flex items-center gap-5 w-full relative z-10 px-6">
                            <img src={room.avatar} className="w-16 h-16 rounded-[1.8rem] border-2 border-white/10 shadow-2xl" alt={room.name} />
                            <div className="flex-1 min-w-0"><h3 className="font-black text-white text-xl italic tracking-tighter uppercase group-hover:text-xs-purple transition-colors drop-shadow-lg">{room.name.replace(/_/g, ' ')}</h3><div className="flex items-center gap-2 mt-1"><span className="text-[8px] font-black uppercase tracking-[0.2em] bg-xs-purple/20 text-xs-purple border border-xs-purple/30 px-2 py-0.5 rounded">LIVE</span></div></div>
                        </div>
                    </Card3D>
                )) : activeTab === 'oink' ? (
                    <div className="space-y-4">
                        {oinks.map(oink => (
                            <Card3D key={oink.id} className="h-24 group" innerClassName="flex items-center gap-3 p-3 bg-black/40 border-white/5 relative overflow-hidden" glowColor="pink">
                                {/* Avatar */}
                                <div className="relative shrink-0 w-16 h-16">
                                    <img src={oink.avatar} className="w-full h-full rounded-2xl object-cover border border-white/10" alt={oink.username} />
                                    <div className="absolute -bottom-1 -right-1 bg-xs-pink text-black text-[8px] font-black px-1.5 py-0.5 rounded-full animate-pulse shadow-md">OINK</div>
                                </div>
                                
                                {/* Info */}
                                <div className="flex-1 min-w-0 flex flex-col justify-center h-full">
                                    <div className="flex justify-between items-center mb-1">
                                        <h3 className="font-black text-white text-sm italic tracking-tighter uppercase truncate">{oink.username}</h3>
                                        <span className="text-[8px] font-mono text-gray-500">{oink.time}</span>
                                    </div>
                                    <p className="text-[9px] text-gray-400 font-medium leading-tight line-clamp-2">Sent you an oink signal.</p>
                                </div>

                                {/* Actions - Compact Row */}
                                <div className="flex items-center gap-1 shrink-0">
                                    <button onClick={() => handleReplyToOink(oink)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-xs-cyan/20 border border-white/10 flex items-center justify-center text-gray-400 hover:text-xs-cyan transition-all" title="Reply">
                                        <ICONS.MessageCircle size={18} />
                                    </button>
                                    <button onClick={() => handleOinkBack(oink.id)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-xs-pink/20 border border-white/10 flex items-center justify-center text-gray-400 hover:text-xs-pink transition-all" title="Oink Back">
                                        <span className="text-base">🐷</span>
                                    </button>
                                    <button onClick={() => setSmileTarget(oink)} className="w-10 h-10 rounded-xl bg-white/5 hover:bg-xs-yellow/20 border border-white/10 flex items-center justify-center text-gray-400 hover:text-xs-yellow transition-all" title="Smile">
                                        <ICONS.Smile size={18} />
                                    </button>
                                </div>
                            </Card3D>
                        ))}
                        {oinks.length === 0 && <div className="text-center py-20 opacity-50"><ICONS.Bell size={32} className="mx-auto mb-4 text-gray-500" /><p className="text-sm font-black uppercase text-gray-500 tracking-widest">No Oinks Yet</p></div>}
                    </div>
                ) : (
                    // RIGHT NOW TAB
                    <div className="space-y-6">
                        <button onClick={() => { setShowCreateAd(true); soundService.play('click'); }} className="w-full py-6 bg-gradient-to-r from-xs-yellow via-orange-500 to-red-500 rounded-[2.5rem] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all group flex items-center justify-center gap-3 relative overflow-hidden">
                            <div className="absolute inset-0 bg-white/20 skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
                            <ICONS.Zap size={24} className="text-black" /><span className="text-black font-black uppercase tracking-[0.3em] text-lg">Broadcast_Signal</span>
                        </button>
                        <div className="grid grid-cols-1 gap-4">
                            {activeAds.map(ad => (
                                <Card3D key={ad.id} className="min-h-[160px]" innerClassName="p-5 flex gap-4 bg-black/40 border-white/5" glowColor={ad.color}>
                                    <div className="flex flex-col items-center justify-between">
                                        <div className="relative"><img src={ad.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white/10" alt={ad.username} /><div className="absolute -bottom-1 -right-1 bg-xs-yellow text-black text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">{rightNowSettings.ghostMode ? 'N/A' : ad.distance}</div></div>
                                        <div className="mt-2 bg-white/5 rounded-lg px-2 py-1 flex items-center gap-1 border border-white/5"><ICONS.MapPin size={10} className={`text-xs-${ad.color}`} /><span className="text-[7px] font-black uppercase tracking-widest text-white">{ad.locationType}</span></div>
                                    </div>
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1"><h3 className="font-black text-white text-lg italic tracking-tighter uppercase">{ad.username}</h3><span className="text-[8px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-1 rounded-lg flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>{ad.durationLabel} Left</span></div>
                                            <p className={`text-sm font-medium italic leading-snug text-xs-${ad.color} opacity-90`}>"{ad.text}"</p>
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => { setSelectedAd(ad); soundService.play('click'); }} className={`flex-1 py-2 bg-xs-${ad.color}/20 border border-xs-${ad.color}/40 rounded-xl text-xs-${ad.color} font-black uppercase tracking-widest text-[9px] hover:bg-xs-${ad.color} hover:text-black transition-all flex items-center justify-center gap-2`}><ICONS.MessageCircle size={12} /> Direct_Link</button>
                                            <div className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl flex items-center gap-1.5 shadow-inner"><ICONS.Heart size={10} className="text-xs-pink" /><span className="text-[9px] font-black text-white">{ad.likes}</span></div>
                                        </div>
                                    </div>
                                </Card3D>
                            ))}
                        </div>
                    </div>
                )}
            </div>
          </div>
      )}
    </div>
  );
};

export default Chat;
