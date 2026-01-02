
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Card3D from '../components/Card3D';
import TransactionModal from '../components/TransactionModal';
import CallInterface from '../components/CallInterface';
import { ICONS, REACTION_OPTIONS, SPECIALIZED_ROOMS } from '../constants';
import { User, Message, Report, UserStatus, ChatRoom, SubscriptionTier } from '../types';
import { soundService } from '../services/soundService';
import { synthesizeSpeech } from '../services/geminiService';

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

const statusConfig: Record<UserStatus, { color: string, label: string, glow: string }> = {
    online: { color: 'bg-green-500', label: 'ONLINE', glow: 'shadow-[0_0_12px_rgba(34,197,94,0.9)]' },
    busy: { color: 'bg-red-500', label: 'BUSY', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.9)]' },
    away: { color: 'bg-yellow-500', label: 'AWAY', glow: 'shadow-[0_0_12px_rgba(234,179,8,0.9)]' },
    offline: { color: 'bg-gray-500', label: 'OFFLINE', glow: 'none' }
};

const MediaDisplay: React.FC<{ msg: Message }> = ({ msg }) => {
    if (msg.imageUrl) return (
        <div className="mb-2 rounded-2xl overflow-hidden border border-white/10 group/media relative">
            <img src={msg.imageUrl} className="w-full h-auto max-h-80 object-cover" alt="visual_sync" />
            <div className="absolute inset-0 bg-xs-cyan/10 opacity-0 group-hover/media:opacity-100 transition-opacity flex items-center justify-center">
                <ICONS.Search className="text-white" size={24} />
            </div>
        </div>
    );
    if (msg.videoUrl) return (
        <div className="mb-2 rounded-2xl overflow-hidden border border-white/10 bg-black relative aspect-video flex items-center justify-center">
            <video src={msg.videoUrl} controls className="max-w-full max-h-full" />
        </div>
    );
    if (msg.albumUrls && msg.albumUrls.length > 0) return (
        <div className="mb-2 grid grid-cols-2 gap-2">
            {msg.albumUrls.map((url, i) => (
                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-white/10">
                    <img src={url} className="w-full h-full object-cover" alt={`album_item_${i}`} />
                </div>
            ))}
        </div>
    );
    return null;
};

const LocationMessage: React.FC<{ msg: Message, isMe: boolean, onStopSharing: (id: string) => void }> = ({ msg, isMe, onStopSharing }) => {
    if (!msg.location) return null;
    
    // Force re-render every minute to update countdown (handled by parent or simple heuristic)
    const now = Date.now();
    const isLive = msg.liveLocationExpiry && msg.liveLocationExpiry > now;
    const minutesLeft = isLive ? Math.ceil((msg.liveLocationExpiry! - now) / 60000) : 0;

    const mapUrl = `https://www.google.com/maps/search/?api=1&query=${msg.location.lat},${msg.location.lng}`;
    const staticMapUrl = `https://maps.googleapis.com/maps/api/staticmap?center=${msg.location.lat},${msg.location.lng}&zoom=15&size=600x300&maptype=roadmap&markers=color:0x00ffff%7Clabel:X%7C${msg.location.lat},${msg.location.lng}&style=feature:all%7Celement:all%7Csaturation:-100%7Clightness:-20%7Cvisibility:on&style=feature:water%7Celement:geometry%7Ccolor:0x0d0d0d&style=feature:landscape%7Celement:geometry%7Ccolor:0x050505&style=feature:road%7Celement:geometry%7Ccolor:0x1a1a1a&style=feature:poi%7Cvisibility:off&key=${process.env.API_KEY}`;
    
    return (
        <div className="space-y-2 p-1">
            <div className="relative block aspect-[2/1] w-full rounded-[1.5rem] overflow-hidden border border-white/10 bg-xs-dark group shadow-2xl transition-all hover:scale-[1.02]">
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

                 <div className="absolute bottom-2 left-2 flex items-center gap-1.5 pointer-events-none">
                    <div className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-xs-cyan shadow-[0_0_8px_rgba(0,255,255,1)]' : 'bg-gray-500'}`}></div>
                    <span className="text-[7px] font-black text-white uppercase tracking-widest">{isLive ? 'GPS_LOCKED' : 'GPS_OFFLINE'}</span>
                 </div>
            </div>
            
            <div className="flex justify-between items-center px-1">
                <p className="text-[9px] font-black text-xs-cyan uppercase tracking-widest">{msg.location.label || 'Shared_Position'}</p>
                {isLive && isMe && (
                    <button 
                        onClick={() => onStopSharing(msg.id)}
                        className="text-[8px] font-black text-red-500 hover:text-white uppercase tracking-wider border border-red-500/30 hover:bg-red-500 rounded px-2 py-0.5 transition-all"
                    >
                        STOP_SHARING
                    </button>
                )}
            </div>
        </div>
    );
};

const Chat: React.FC<ChatProps> = ({ user, onReport, onUpdateUser }) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<'direct' | 'rooms' | 'oink' | 'rightnow'>('direct');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [activeSettingsTab, setActiveSettingsTab] = useState<'direct' | 'rooms' | 'oink' | 'rightnow'>('direct');
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferType, setTransferType] = useState<'send' | 'request'>('send');
  const [showExtraMenu, setShowExtraMenu] = useState(false);
  const [showLocationDurations, setShowLocationDurations] = useState(false);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const [activeReactionId, setActiveReactionId] = useState<string | null>(null);
  const [activeMessageOptionsId, setActiveMessageOptionsId] = useState<string | null>(null);
  
  // Typing Indicator State
  const [isTyping, setIsTyping] = useState(false);

  // Call State
  const [callActive, setCallActive] = useState(false);
  const [callType, setCallType] = useState<'audio' | 'video'>('audio');

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

  // Sync state with URL params to support back button
  useEffect(() => {
      const chatId = searchParams.get('chatId');
      const adId = searchParams.get('adId');
      
      if (chatId) {
          setSelectedChatId(chatId);
          if (activeTab === 'rightnow' && !adId) setActiveTab('direct');
      } else {
          setSelectedChatId(null);
      }

      if (adId) {
          const ad = activeAds.find(a => a.id === adId);
          if (ad) setSelectedAd(ad);
          setActiveTab('rightnow');
      } else {
          setSelectedAd(null);
          setShowAdReplyModal(false);
      }
  }, [searchParams, activeAds]);

  const openChat = (id: string) => {
      setSearchParams({ chatId: id });
      soundService.play('unlock');
  };

  const closeChat = () => {
      setSearchParams({});
      setReplyingTo(null);
  };

  const openAd = (ad: RightNowAd) => {
      setSearchParams({ adId: ad.id });
      soundService.play('unlock');
  };

  const closeAd = () => {
      setSearchParams({});
  };

  const openSettings = () => {
      setActiveSettingsTab(activeTab);
      setShowSettings(true);
      soundService.play('click');
  };

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

  const [oinks, setOinks] = useState<OinkInteraction[]>([
    { id: '1', userId: 'u88', username: 'Troye_Sivan_Stan', avatar: 'https://picsum.photos/100/100?random=88', time: '2m ago', hasViewedProfile: true },
    { id: '2', userId: 'u99', username: 'GymRat_TO', avatar: 'https://picsum.photos/100/100?random=99', time: '45m ago', hasViewedProfile: true },
    { id: '3', userId: 'u77', username: 'BearChaser', avatar: 'https://picsum.photos/100/100?random=77', time: '3h ago', hasViewedProfile: true },
    { id: '4', userId: 'u66', username: 'LeatherDaddy', avatar: 'https://picsum.photos/100/100?random=66', time: '5h ago', hasViewedProfile: true },
  ]);

  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [chats, setChats] = useState<{ id: string, name: string, lastMsg: string, time: string, status: UserStatus, avatar: string, unread: number }[]>([
    { id: '1', name: 'Alex', lastMsg: 'See you tonight!', time: '10:30 AM', status: 'online', avatar: 'https://picsum.photos/100/100?random=51', unread: 2 },
    { id: '2', name: 'Jordan', lastMsg: 'Sync confirmed.', time: 'Yesterday', status: 'away', avatar: 'https://picsum.photos/100/100?random=52', unread: 0 },
    { id: '3', name: 'Kai', lastMsg: 'Incoming data...', time: '12:00 PM', status: 'busy', avatar: 'https://picsum.photos/100/100?random=53', unread: 1 },
    { id: '4', name: 'River', lastMsg: 'Protocol error.', time: '2 days ago', status: 'offline', avatar: 'https://picsum.photos/100/100?random=54', unread: 0 },
  ]);

  const roomsList = SPECIALIZED_ROOMS as any as ChatRoom[];
  const selectedChatData = activeTab === 'direct' 
    ? chats.find(c => c.id === selectedChatId) 
    : roomsList.find(r => r.id === selectedChatId);

  // Calculate totals for badges
  const totalUnreadMessages = chats.reduce((acc, curr) => acc + curr.unread, 0);
  const totalOinks = oinks.length;

  useEffect(() => {
    if (selectedChatId) {
        setIsTyping(false);
        setMessages([
            { id: 'm1', senderId: 'them', text: 'Neural linkage established. Ready for data exchange.', timestamp: Date.now() - 3600000 },
            { id: 'm2', senderId: 'me', text: 'Sync confirmed. Grid status stable.', timestamp: Date.now() - 1800000 }
        ]);
        scrollToBottom();
    }
  }, [selectedChatId]);

  // UseEffect to update live location timers every minute to force re-render
  useEffect(() => {
      const interval = setInterval(() => {
          setMessages(prev => [...prev]); // Force re-render
      }, 60000);
      return () => clearInterval(interval);
  }, []);

  const scrollToBottom = () => setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);

  const playAudioReply = (text: string) => {
      synthesizeSpeech(text).then(buffer => {
          if (buffer) {
              const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start();
          }
      });
  };

  const handleSend = (options?: Partial<Message>) => {
    if (!inputText.trim() && !options) return;
    
    const newMsg: Message = {
        id: Date.now().toString(),
        senderId: 'me',
        text: inputText,
        replyToId: replyingTo?.id,
        timestamp: Date.now(),
        ...options
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setReplyingTo(null);
    setShowExtraMenu(false);
    setShowLocationDurations(false);
    soundService.play('send');
    scrollToBottom();

    // Simulate typing indicator and reply
    if (activeTab === 'direct' && selectedChatId) {
        // Random delay before typing starts (0.5s - 1.5s)
        setTimeout(() => {
            setIsTyping(true);
            scrollToBottom();
            
            // Random typing duration (2s - 4s)
            setTimeout(() => {
                setIsTyping(false);
                const replies = [
                    "Data received. Processing...",
                    "Grid coordinates locked.",
                    "Nice.",
                    "Are you heading to the event tonight?",
                    "Sync rate 100%.",
                    "Sent you a private key.",
                    "lol same",
                    "Wait, really?"
                ];
                const randomReply = replies[Math.floor(Math.random() * replies.length)];
                
                const replyMsg: Message = {
                    id: Date.now().toString(),
                    senderId: selectedChatId,
                    text: randomReply,
                    timestamp: Date.now()
                };
                
                setMessages(prev => [...prev, replyMsg]);
                
                // Trigger AI Voice if enabled
                if (chatSettings.aiVoiceEnabled) {
                    playAudioReply(randomReply);
                } else {
                    soundService.play('pop');
                }
                
                scrollToBottom();
            }, 2000 + Math.random() * 2000);
        }, 500 + Math.random() * 1000);
    }
  };

  const handleStartCall = (type: 'audio' | 'video') => {
      if (user.subscription === SubscriptionTier.FREE) {
          soundService.play('error');
          if(confirm("Calling is a Premium feature. Upgrade to unlock voice and video calls?")) {
              navigate('/subscription');
          }
          return;
      }
      setCallType(type);
      setCallActive(true);
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
      soundService.play('success');
  };

  const handleSendAdReply = () => {
      if (!selectedAd || !adReplyText.trim()) return;

      setChats(prev => {
          const exists = prev.find(c => c.id === selectedAd.userId);
          if (exists) {
              return prev.map(c => c.id === selectedAd.userId ? { ...c, lastMsg: `You: ${adReplyText}`, time: 'Now' } : c);
          } else {
              return [{
                  id: selectedAd.userId,
                  name: selectedAd.username,
                  lastMsg: `You: ${adReplyText}`,
                  time: 'Now',
                  status: 'online' as UserStatus,
                  avatar: selectedAd.avatar,
                  unread: 0
              }, ...prev];
          }
      });

      soundService.play('send');
      setAdReplyText('');
      setShowAdReplyModal(false);
      
      // Close Ad Modal then Open Chat with user
      closeAd();
      setTimeout(() => openChat(selectedAd.userId), 100);
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
              const newOink: OinkInteraction = {
                  id: Date.now().toString(),
                  userId: selectedAd.userId,
                  username: selectedAd.username,
                  avatar: selectedAd.avatar,
                  time: 'Just now',
                  hasViewedProfile: true
              };
              setOinks(prev => [newOink, ...prev]);
              alert(`Oink sent to ${selectedAd.username}`);
              break;
          case 'like':
              soundService.play('success');
              // Increment likes in local state
              setActiveAds(prev => prev.map(a => a.id === selectedAd.id ? { ...a, likes: a.likes + 1 } : a));
              alert(`You liked ${selectedAd.username}'s ad`);
              break;
          case 'report':
              soundService.play('error');
              onReport({
                  id: Date.now().toString(),
                  targetId: selectedAd.id,
                  targetType: 'post',
                  reason: 'Inappropriate Signal',
                  reporterId: user.id,
                  status: 'pending',
                  timestamp: Date.now()
              });
              alert("Signal reported for review.");
              closeAd();
              break;
      }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
          const result = event.target?.result as string;
          if (file.type.startsWith('image')) handleSend({ imageUrl: result });
          else if (file.type.startsWith('video')) handleSend({ videoUrl: result });
      };
      reader.readAsDataURL(file);
      soundService.play('scan');
  };

  const handleShareLocation = (type: 'static' | '15m' | '1h' | '8h') => {
      if (!navigator.geolocation) {
          alert("Geolocation Unavailable.");
          return;
      }
      navigator.geolocation.getCurrentPosition((pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          let expiry: number | undefined = undefined;
          if (type === '15m') expiry = Date.now() + 15 * 60000;
          else if (type === '1h') expiry = Date.now() + 60 * 60000;
          else if (type === '8h') expiry = Date.now() + 8 * 60 * 60000;

          handleSend({
              location: { lat, lng, label: type === 'static' ? 'Actual Position' : `Live Share (${type})` },
              liveLocationExpiry: expiry
          });
      }, () => alert("GPS Sync Denied."));
  };

  const handleStopSharing = (msgId: string) => {
      setMessages(prev => prev.map(m => 
          m.id === msgId ? { ...m, liveLocationExpiry: Date.now() - 1000 } : m // Set expiry to past to invalidate
      ));
      soundService.play('lock');
  };

  const deleteMessage = (id: string) => {
      setMessages(prev => prev.filter(m => m.id !== id));
      setActiveMessageOptionsId(null);
      soundService.play('trash');
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      setActiveMessageOptionsId(null);
      soundService.play('success');
  };

  const pinMessage = (id: string) => {
      alert("Message pinned.");
      setActiveMessageOptionsId(null);
      soundService.play('unlock');
  };

  const handleOinkBack = (id: string) => {
      soundService.play('oink');
      alert("Oinked back successfully!");
  };

  const handleSmile = (id: string) => {
      soundService.play('success');
      alert("Smiled at user!");
  };

  const handleDeleteOink = (id: string) => {
      soundService.play('trash');
      setOinks(prev => prev.filter(o => o.id !== id));
  };

  const tabs = [
      { id: 'direct', label: 'Direct', color: 'xs-cyan', bg: 'bg-xs-cyan', text: 'text-xs-cyan' },
      { id: 'rooms', label: 'Rooms', color: 'xs-purple', bg: 'bg-xs-purple', text: 'text-xs-purple' },
      { id: 'oink', label: 'Oink', color: 'xs-pink', bg: 'bg-xs-pink', text: 'text-xs-pink' },
      { id: 'rightnow', label: 'RightNow', color: 'xs-yellow', bg: 'bg-xs-yellow', text: 'text-xs-yellow' }
  ];

  const getSettingsConfig = () => {
      if (activeSettingsTab === 'oink') {
          return [
              { key: 'allowOinks', label: 'Allow_Oinks', desc: 'Receive oinks', color: 'xs-pink', state: oinkSettings, setter: setOinkSettings },
              { key: 'notifyOnView', label: 'View_Alerts', desc: 'Notify on profile view', color: 'xs-cyan', state: oinkSettings, setter: setOinkSettings },
              { key: 'publicHistory', label: 'Public_History', desc: 'Show received oinks', color: 'xs-purple', state: oinkSettings, setter: setOinkSettings },
              { key: 'soundEffects', label: 'SFX_Volume', desc: 'Oink sounds', color: 'xs-yellow', state: oinkSettings, setter: setOinkSettings }
          ];
      } else if (activeSettingsTab === 'rooms') {
          return [
              { key: 'incognitoMode', label: 'Incognito', desc: 'Hide presence in rooms', color: 'xs-purple', state: roomSettings, setter: setRoomSettings },
              { key: 'mediaAutoLoad', label: 'Media_Load', desc: 'Auto-show room media', color: 'xs-pink', state: roomSettings, setter: setRoomSettings },
              { key: 'roomNotifications', label: 'Room_Alerts', desc: 'Notify mentions only', color: 'xs-yellow', state: roomSettings, setter: setRoomSettings },
              { key: 'locationTags', label: 'Geo_Tags', desc: 'Share city in rooms', color: 'xs-cyan', state: roomSettings, setter: setRoomSettings }
          ];
      } else if (activeSettingsTab === 'rightnow') {
          return [
              { key: 'ghostMode', label: 'Ghost_Protocol', desc: 'Hide my distance', color: 'xs-pink', state: rightNowSettings, setter: setRightNowSettings },
              { key: 'matchAlerts', label: 'Signal_Alerts', desc: 'Notify on new ads', color: 'xs-yellow', state: rightNowSettings, setter: setRightNowSettings },
              { key: 'showExactDistance', label: 'Precise_Geo', desc: 'Show exact meters', color: 'xs-cyan', state: rightNowSettings, setter: setRightNowSettings },
              { key: 'incognitoBrowsing', label: 'Silent_Scan', desc: 'View ads without trace', color: 'xs-purple', state: rightNowSettings, setter: setRightNowSettings }
          ];
      } else {
          // Direct & Default
          return [
              { key: 'readReceipts', label: 'Read_Receipts', desc: 'Confirm delivery', color: 'xs-cyan', state: chatSettings, setter: setChatSettings },
              { key: 'activityDisplay', label: 'Activity_Display', desc: "Show 'Online' Status", color: 'xs-cyan', state: chatSettings, setter: setChatSettings },
              { key: 'mediaAutoLoad', label: 'Auto_Download', desc: 'Cache media', color: 'xs-purple', state: chatSettings, setter: setChatSettings },
              { key: 'notificationPreviews', label: 'Msg_Previews', desc: 'Show text in alerts', color: 'xs-yellow', state: chatSettings, setter: setChatSettings },
              { key: 'blurNSFW', label: 'Blur_NSFW', desc: 'Obscure explicit', color: 'red-500', state: chatSettings, setter: setChatSettings },
              { key: 'aiVoiceEnabled', label: 'AI_Voice', desc: 'Speak incoming msgs', color: 'xs-pink', state: chatSettings, setter: setChatSettings }
          ];
      }
  };

  const activeTabLabel = tabs.find(t => t.id === activeTab)?.label || 'Connect';
  
  // Check for active live sharing
  const isSharingLocation = messages.some(m => m.senderId === 'me' && m.liveLocationExpiry && m.liveLocationExpiry > Date.now());

  return (
    <div className="h-full flex flex-col relative preserve-3d">
      <TransactionModal 
        isOpen={showTransferModal} 
        onClose={() => setShowTransferModal(false)} 
        initialType={transferType}
        biometricRequired={user.isBiometricEnabled}
        onConfirm={(a, n, t) => {
            handleSend({ transferAmount: a, transferType: t, text: n });
            setShowTransferModal(false);
        }}
        recipientName={selectedChatData?.name || ''}
        recipientAvatar={(selectedChatData as any)?.avatar || ''}
        currentBalance={user.walletBalance}
      />

      <CallInterface 
        isOpen={callActive} 
        onClose={() => setCallActive(false)} 
        type={callType} 
        partnerName={selectedChatData?.name || 'Unknown'} 
        partnerAvatar={(selectedChatData as any)?.avatar || ''} 
      />

      {/* Settings Modal */}
      {showSettings && (
          <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-md glass-panel rounded-[3.5rem] border border-xs-cyan/20 p-8 shadow-4xl relative overflow-hidden flex flex-col max-h-[80vh]">
                  <header className="flex justify-between items-center mb-6 relative z-10 shrink-0">
                      <div>
                          <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">Config</h2>
                          <p className="text-[10px] font-black uppercase text-xs-cyan tracking-[0.4em] mt-1">Preferences</p>
                      </div>
                      <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500"><ICONS.X size={24}/></button>
                  </header>

                  <div className="flex gap-2 mb-6 overflow-x-auto pb-2 shrink-0">
                      {tabs.map(t => (
                          <button 
                            key={t.id}
                            onClick={() => { setActiveSettingsTab(t.id as any); soundService.play('tab'); }}
                            className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${activeSettingsTab === t.id ? `${t.bg} text-black border-transparent` : 'bg-white/5 text-gray-400 border-white/5'}`}
                          >
                              {t.label}
                          </button>
                      ))}
                  </div>

                  <div className="space-y-4 relative z-10 overflow-y-auto custom-scrollbar pr-2 flex-1">
                      
                      {/* My Status Selector for Direct Tab */}
                      {activeSettingsTab === 'direct' && (
                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all mb-4">
                              <div>
                                  <p className="text-xs font-black uppercase tracking-widest text-white">My_Status</p>
                                  <p className="text-[8px] text-gray-500 uppercase tracking-[0.2em] mt-0.5">Current Signal</p>
                              </div>
                              <div className="flex gap-1 bg-black/40 p-1 rounded-lg">
                                  {['online', 'busy', 'away', 'offline'].map((s) => (
                                      <button
                                          key={s}
                                          onClick={() => { onUpdateUser({ status: s as UserStatus }); soundService.play('click'); }}
                                          className={`w-6 h-6 rounded-md flex items-center justify-center transition-all ${user.status === s ? statusConfig[s as UserStatus].color : 'bg-white/5 hover:bg-white/10'}`}
                                          title={s}
                                      >
                                          <div className={`w-2 h-2 rounded-full ${user.status === s ? 'bg-white' : statusConfig[s as UserStatus].color.replace('bg-', 'bg-')}`}></div>
                                      </button>
                                  ))}
                              </div>
                          </div>
                      )}

                      {getSettingsConfig().map((s: any) => (
                          <div key={s.key} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 group hover:border-white/20 transition-all">
                              <div>
                                  <p className={`text-xs font-black uppercase tracking-widest text-${s.color}`}>{s.label}</p>
                                  <p className="text-[8px] text-gray-500 uppercase tracking-[0.2em] mt-0.5">{s.desc}</p>
                              </div>
                              <button 
                                onClick={() => s.setter((prev: any) => ({ ...prev, [s.key]: !prev[s.key] }))}
                                className={`w-12 h-6 rounded-full relative transition-all duration-500 ${s.state[s.key] ? `bg-${s.color}` : 'bg-white/10'}`}
                              >
                                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all duration-300 ${s.state[s.key] ? 'left-7' : 'left-1'}`} />
                              </button>
                          </div>
                      ))}
                  </div>
                  <button onClick={() => setShowSettings(false)} className="w-full mt-6 py-5 bg-white text-black rounded-[2rem] font-black uppercase tracking-widest text-xs shadow-4xl active:scale-95 transition-transform relative z-10 shrink-0">Apply Changes</button>
              </div>
          </div>
      )}

      {/* RightNow Ad Detail Modal */}
      {selectedAd && (
          <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-sm relative">
                  <button 
                      onClick={closeAd}
                      className="absolute -top-12 right-0 p-3 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all hover:rotate-90"
                  >
                      <ICONS.X size={24} />
                  </button>
                  
                  <Card3D className="min-h-[400px]" innerClassName="p-0 overflow-hidden bg-black/80 border-white/10" glowColor={selectedAd.color}>
                      <div className="h-48 relative">
                          <img src={selectedAd.avatar} className="w-full h-full object-cover opacity-60" alt="bg" />
                          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/40 to-black"></div>
                          <div className="absolute bottom-6 left-6">
                              <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none drop-shadow-lg">{selectedAd.username}</h2>
                              <div className="flex items-center gap-2 mt-2">
                                  <span className={`bg-xs-${selectedAd.color} text-black text-[9px] font-black px-2 py-0.5 rounded uppercase`}>{selectedAd.locationType}</span>
                                  <span className="text-white text-[9px] font-mono bg-white/10 px-2 py-0.5 rounded">{selectedAd.distance} Away</span>
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

                          <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                              <div>
                                  <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Expires_In</p>
                                  <p className="text-white font-mono text-xs mt-0.5">{selectedAd.durationLabel}</p>
                              </div>
                              <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                          </div>

                          <div className="grid grid-cols-4 gap-3">
                              <button onClick={() => handleAdAction('message')} className="col-span-2 py-4 bg-white text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 transition-all flex items-center justify-center gap-2 shadow-lg">
                                  <ICONS.MessageCircle size={16} /> Reply
                              </button>
                              <button onClick={() => handleAdAction('oink')} className="py-4 bg-xs-pink/20 text-xs-pink border border-xs-pink/50 rounded-2xl flex items-center justify-center hover:bg-xs-pink hover:text-black transition-all">
                                  <span className="font-black text-[10px]">OINK</span>
                              </button>
                              <button onClick={() => handleAdAction('like')} className="py-4 bg-xs-yellow/20 text-xs-yellow border border-xs-yellow/50 rounded-2xl flex items-center justify-center hover:bg-xs-yellow hover:text-black transition-all">
                                  <ICONS.Flame size={18} />
                              </button>
                          </div>
                          
                          <button onClick={() => handleAdAction('report')} className="w-full py-3 text-[9px] font-black text-gray-600 uppercase tracking-widest hover:text-red-500 transition-colors flex items-center justify-center gap-2">
                              <ICONS.Flag size={12} /> Report_Signal
                          </button>
                      </div>
                  </Card3D>
              </div>
          </div>
      )}

      {/* RightNow Reply Modal */}
      {showAdReplyModal && selectedAd && (
          <div className="fixed inset-0 z-[250] bg-black/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-sm glass-panel rounded-[2.5rem] border border-white/20 p-6 shadow-4xl relative overflow-hidden">
                  <header className="flex justify-between items-center mb-4">
                      <div>
                          <h3 className="text-xl font-black italic uppercase tracking-tighter text-white">Reply</h3>
                          <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.2em]">To: {selectedAd.username}</p>
                      </div>
                      <button onClick={() => setShowAdReplyModal(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-500"><ICONS.X size={18}/></button>
                  </header>
                  <textarea 
                      value={adReplyText}
                      onChange={(e) => setAdReplyText(e.target.value)}
                      placeholder={`Message ${selectedAd.username}...`}
                      className="w-full h-32 bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium italic outline-none focus:border-xs-cyan transition-all resize-none mb-4"
                  />
                  <div className="flex gap-2">
                      <button onClick={() => setShowAdReplyModal(false)} className="flex-1 py-3 bg-white/5 text-gray-400 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-white/10">Cancel</button>
                      <button onClick={handleSendAdReply} disabled={!adReplyText.trim()} className="flex-[2] py-3 bg-xs-cyan text-black rounded-xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all disabled:opacity-50">Send</button>
                  </div>
              </div>
          </div>
      )}

      {/* RightNow Create Ad Modal */}
      {showCreateAd && (
          <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in">
              <div className="w-full max-w-sm glass-panel rounded-[3.5rem] border border-xs-yellow/30 p-8 shadow-4xl">
                  <header className="flex justify-between items-center mb-6">
                      <div>
                          <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white">Broadcast</h2>
                          <p className="text-[9px] font-black uppercase text-xs-yellow tracking-[0.4em] mt-1">Hookup_Signal_V1</p>
                      </div>
                      <button onClick={() => setShowCreateAd(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500"><ICONS.X size={20}/></button>
                  </header>
                  
                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Signal_Intent</label>
                          <textarea 
                            value={adText}
                            onChange={(e) => setAdText(e.target.value)}
                            placeholder="What are you looking for right now? Be specific..."
                            className="w-full h-24 bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-sm font-medium italic outline-none focus:border-xs-yellow transition-all resize-none"
                          />
                      </div>

                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Duration</label>
                          <div className="grid grid-cols-3 gap-2">
                              {['30m', '1h', '2h', '4h', 'Tonight'].map(d => (
                                  <button 
                                    key={d}
                                    onClick={() => setAdDuration(d)}
                                    className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${adDuration === d ? 'bg-xs-yellow text-black border-xs-yellow' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                  >
                                      {d}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Location</label>
                          <div className="grid grid-cols-2 gap-2">
                              {(['Hosting', 'Travel', 'Car', 'Public', 'Hotel'] as const).map(l => (
                                  <button 
                                    key={l}
                                    onClick={() => setAdLocationType(l)}
                                    className={`py-2 rounded-xl text-[9px] font-black uppercase border transition-all ${adLocationType === l ? 'bg-xs-cyan text-black border-xs-cyan' : 'bg-white/5 text-gray-400 border-white/10'}`}
                                  >
                                      {l}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <button 
                        onClick={handlePostAd}
                        disabled={!adText.trim()}
                        className="w-full py-5 bg-gradient-to-r from-xs-yellow via-orange-500 to-red-500 text-black rounded-[2rem] font-black text-sm uppercase tracking-[0.3em] shadow-lg shadow-orange-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                      >
                          Transmit_Signal
                      </button>
                  </div>
              </div>
          </div>
      )}

      {selectedChatId ? (
          <div className="fixed inset-0 z-50 bg-xs-black flex flex-col animate-in slide-in-from-right duration-300">
              <header className="flex items-center justify-between p-4 bg-black/80 backdrop-blur-md border-b border-xs-cyan/20 shadow-[0_0_30px_rgba(0,255,255,0.1)] relative z-20">
                  <div className="flex items-center gap-3">
                      <button onClick={closeChat} className="p-2 -ml-2 text-gray-400 hover:text-xs-cyan rounded-full transition-colors"><ICONS.ArrowLeft size={24} /></button>
                      <div className="flex items-center gap-3">
                          <div className="relative">
                              <img src={(selectedChatData as any)?.avatar} className="w-10 h-10 rounded-full border border-xs-cyan/30 shadow-lg" alt="avatar" />
                              {(selectedChatData as any).status && chatSettings.activityDisplay && (
                                  <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-black animate-pulse ${statusConfig[(selectedChatData as any).status || 'offline'].color} ${statusConfig[(selectedChatData as any).status || 'offline'].glow}`} />
                              )}
                          </div>
                          <div>
                              <h3 className="font-black text-white leading-tight italic tracking-tight text-lg uppercase">{selectedChatData?.name}</h3>
                              {(selectedChatData as any).status && chatSettings.activityDisplay && (
                                  <div className="flex items-center gap-1.5">
                                      <span className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 ${statusConfig[(selectedChatData as any).status || 'offline'].color.replace('bg-', 'text-')}`}>
                                          {statusConfig[(selectedChatData as any).status || 'offline'].label}
                                      </span>
                                  </div>
                              )}
                          </div>
                      </div>
                  </div>
                  <div className="flex gap-1">
                      {activeTab === 'direct' && (
                          <>
                            <button onClick={() => handleStartCall('audio')} className="p-3 text-xs-purple hover:scale-110 transition-transform"><ICONS.Phone size={22} /></button>
                            <button onClick={() => handleStartCall('video')} className="p-3 text-xs-cyan hover:scale-110 transition-transform"><ICONS.Video size={22} /></button>
                            <button onClick={() => { setTransferType('send'); setShowTransferModal(true); }} className="p-3 text-xs-yellow hover:scale-110 transition-transform" title="Send credits"><ICONS.CreditCard size={22} /></button>
                          </>
                      )}
                      <button onClick={openSettings} className="p-3 text-red-500 hover:rotate-90 transition-all"><ICONS.Settings size={22} /></button>
                      <button className="p-3 text-gray-300"><ICONS.Menu size={22} /></button>
                  </div>
              </header>

              <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-gradient-to-br from-red-500/5 via-black to-xs-cyan/10 custom-scrollbar relative z-10" onClick={() => { setActiveMessageOptionsId(null); setActiveReactionId(null); }}>
                  {messages.map((msg, i) => {
                      const isMe = msg.senderId === 'me';
                      const replyContext = msg.replyToId ? messages.find(m => m.id === msg.replyToId) : null;
                      const showOptions = activeMessageOptionsId === msg.id;

                      return (
                          <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                              {replyContext && (
                                  <div className={`mb-[-15px] px-4 py-3 rounded-t-2xl text-[9px] italic border-l-2 opacity-60 ${isMe ? 'bg-red-500/10 border-red-500 mr-4' : 'bg-xs-cyan/10 border-xs-cyan ml-4'} text-gray-400`}>
                                      Replying to: {replyContext.text?.substring(0, 40)}...
                                  </div>
                              )}
                              <div className="relative group max-w-[85%]" onClick={(e) => e.stopPropagation()}>
                                  <div 
                                    className={`p-4 rounded-[1.8rem] shadow-4xl backdrop-blur-md border transition-all cursor-pointer ${isMe ? 'bg-gradient-to-br from-red-500/20 to-black/40 border-red-500/40 rounded-tr-sm text-white' : 'bg-gradient-to-br from-xs-cyan/20 to-black/40 border-xs-cyan/40 rounded-tl-sm text-gray-200'} ${showOptions ? 'scale-95 ring-2 ring-white/20' : ''}`}
                                    onContextMenu={(e) => { e.preventDefault(); setActiveMessageOptionsId(msg.id); soundService.play('click'); }}
                                    onClick={() => { setActiveMessageOptionsId(showOptions ? null : msg.id); soundService.play('click'); }}
                                  >
                                      <MediaDisplay msg={msg} />
                                      {msg.location && <LocationMessage msg={msg} isMe={isMe} onStopSharing={handleStopSharing} />}
                                      {msg.transferAmount && (
                                          <div className="mb-2 pb-2 border-b border-white/10">
                                              <p className={`text-[10px] font-black uppercase tracking-widest ${msg.transferType === 'request' ? 'text-xs-cyan' : 'text-xs-yellow'}`}>
                                                  {msg.transferType === 'request' ? 'Request' : 'Transfer'}
                                              </p>
                                              <p className="text-2xl font-black italic tracking-tighter">${msg.transferAmount.toFixed(2)}</p>
                                          </div>
                                      )}
                                      {msg.text && <p className="text-sm font-light leading-relaxed italic tracking-wide">{msg.text}</p>}
                                      {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                                          <div className={`absolute -bottom-3 ${isMe ? 'left-2' : 'right-2'} flex gap-1 bg-black/90 border border-white/10 rounded-full px-2 py-0.5 z-20 shadow-lg`}>
                                              {Object.entries(msg.reactions).map(([e]) => <span key={e} className="text-[10px]">{e}</span>)}
                                          </div>
                                      )}
                                      
                                      {/* Read Receipts */}
                                      {isMe && (
                                          <div className="absolute bottom-1 right-2">
                                              <div className={`flex -space-x-1 ${chatSettings.readReceipts ? 'text-xs-cyan' : 'text-gray-500'}`}>
                                                  <ICONS.Check size={10} />
                                                  <ICONS.Check size={10} />
                                              </div>
                                          </div>
                                      )}
                                  </div>

                                  {showOptions && (
                                      <div className={`absolute bottom-full mb-4 ${isMe ? 'right-0' : 'left-0'} w-48 liquid-glass border border-white/10 rounded-3xl z-[70] py-2 animate-in zoom-in-95 duration-200 shadow-4xl overflow-hidden`}>
                                          <button onClick={() => { setReplyingTo(msg); setActiveMessageOptionsId(null); }} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                                              <ICONS.MessageCircle size={14} /> Reply
                                          </button>
                                          {msg.text && (
                                              <button onClick={() => copyToClipboard(msg.text!)} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                                                  <ICONS.Copy size={14} /> Copy
                                              </button>
                                          )}
                                          <button onClick={() => pinMessage(msg.id)} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                                              <ICONS.Link size={14} /> Pin
                                          </button>
                                          <div className="h-px bg-white/5 my-1 mx-2"></div>
                                          <button onClick={() => deleteMessage(msg.id)} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-red-500 hover:bg-red-500/5 transition-all">
                                              <ICONS.Trash2 size={14} /> Delete
                                          </button>
                                      </div>
                                  )}

                                  <div className={`absolute top-0 ${isMe ? 'right-full mr-3' : 'left-full ml-3'} opacity-0 group-hover:opacity-100 transition-all flex flex-col gap-2`}>
                                      <button onClick={() => { setReplyingTo(msg); soundService.play('click'); }} className="p-2 bg-white/5 rounded-full hover:text-xs-cyan hover:bg-white/10 transition-colors"><ICONS.Edit3 size={14}/></button>
                                      <button onClick={() => setActiveReactionId(activeReactionId === msg.id ? null : msg.id)} className="p-2 bg-white/5 rounded-full hover:text-red-500 hover:bg-white/10 transition-colors"><ICONS.Smile size={14}/></button>
                                  </div>
                              </div>
                          </div>
                      );
                  })}
                  
                  {/* Typing Indicator */}
                  {isTyping && (
                      <div className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2">
                          <div className="bg-gradient-to-br from-xs-cyan/20 to-black/40 border border-xs-cyan/40 rounded-[1.8rem] rounded-tl-sm p-4 shadow-4xl backdrop-blur-md min-w-[60px]">
                              <div className="flex gap-1.5 justify-center">
                                  <div className="w-1.5 h-1.5 bg-xs-cyan/60 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                                  <div className="w-1.5 h-1.5 bg-xs-cyan/60 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                                  <div className="w-1.5 h-1.5 bg-xs-cyan/60 rounded-full animate-bounce"></div>
                              </div>
                          </div>
                          <p className="text-[8px] text-gray-500 font-mono uppercase tracking-widest mt-1 ml-2 animate-pulse">Typing...</p>
                      </div>
                  )}
                  
                  <div ref={messagesEndRef} />
              </div>

              <div className="p-4 bg-black/90 border-t border-xs-cyan/20 relative pb-10 md:pb-4 z-20">
                  {replyingTo && (
                      <div className="absolute bottom-full left-0 right-0 p-3 bg-red-500/10 backdrop-blur-xl border-t border-red-500/30 flex justify-between items-center animate-in slide-in-from-bottom-2">
                          <p className="text-[10px] italic text-gray-400">Replying to: {replyingTo.text?.substring(0, 40)}...</p>
                          <button onClick={() => setReplyingTo(null)} className="text-gray-500"><ICONS.X size={16}/></button>
                      </div>
                  )}
                  
                  {showExtraMenu && (
                      <div className="absolute bottom-full left-4 mb-4 w-72 glass-panel rounded-3xl p-4 space-y-3 shadow-4xl animate-in slide-in-from-bottom-4 border border-xs-cyan/20 backdrop-blur-3xl">
                          <h4 className="text-[9px] font-black text-xs-cyan uppercase tracking-[0.4em] mb-4">Actions</h4>
                          <div className="grid grid-cols-2 gap-2">
                              <button onClick={() => fileInputRef.current?.click()} className="py-4 flex flex-col items-center justify-center bg-white/5 hover:bg-white/10 rounded-xl transition-all group border border-white/5">
                                  <ICONS.Camera size={20} className="text-xs-cyan mb-2" />
                                  <span className="text-[8px] font-black uppercase text-white">Photo</span>
                              </button>
                              {activeTab === 'direct' && (
                                <>
                                    <button onClick={() => { setTransferType('send'); setShowTransferModal(true); setShowExtraMenu(false); }} className="py-4 flex flex-col items-center justify-center bg-xs-yellow/10 hover:bg-xs-yellow/20 rounded-xl transition-all group border border-xs-yellow/20">
                                        <ICONS.CreditCard size={20} className="text-xs-yellow mb-2" />
                                        <span className="text-[8px] font-black uppercase text-white">Transfer</span>
                                    </button>
                                    <button onClick={() => { setTransferType('request'); setShowTransferModal(true); setShowExtraMenu(false); }} className="py-4 flex flex-col items-center justify-center bg-xs-cyan/10 hover:bg-xs-cyan/20 rounded-xl transition-all group border border-xs-cyan/20">
                                        <ICONS.Smartphone size={20} className="text-xs-cyan mb-2" />
                                        <span className="text-[8px] font-black uppercase text-white">Request</span>
                                    </button>
                                </>
                              )}
                              <div className="py-4 flex flex-col items-center justify-center bg-white/5 rounded-xl">
                                <ICONS.MapPin size={20} className="text-xs-pink mb-2" />
                                <div className="flex gap-1 flex-wrap justify-center">
                                    <button onClick={() => handleShareLocation('static')} className="text-[7px] font-black uppercase text-white hover:text-xs-pink bg-white/5 px-1.5 py-0.5 rounded">Stat</button>
                                    <button onClick={() => handleShareLocation('15m')} className="text-[7px] font-black uppercase text-white hover:text-xs-pink bg-white/5 px-1.5 py-0.5 rounded">15m</button>
                                    <button onClick={() => handleShareLocation('1h')} className="text-[7px] font-black uppercase text-white hover:text-xs-pink bg-white/5 px-1.5 py-0.5 rounded">1h</button>
                                    <button onClick={() => handleShareLocation('8h')} className="text-[7px] font-black uppercase text-white hover:text-xs-pink bg-white/5 px-1.5 py-0.5 rounded">8h</button>
                                </div>
                              </div>
                          </div>
                      </div>
                  )}

                  <div className="flex gap-2 items-end">
                      <button 
                        onClick={() => { soundService.play('click'); setShowExtraMenu(!showExtraMenu); }} 
                        className={`p-3 rounded-full transition-all mb-0.5 ${showExtraMenu ? 'bg-xs-cyan text-black shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-white/5 text-gray-400 hover:text-xs-cyan'}`}
                      >
                        <ICONS.Plus size={20} className={`transition-transform duration-300 ${showExtraMenu ? 'rotate-45' : ''}`} />
                      </button>
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,video/*" onChange={handleFileUpload} />
                      <div className="flex-1 bg-white/5 border border-white/10 rounded-[1.8rem] px-5 py-2.5 flex items-center focus-within:border-xs-cyan transition-colors shadow-inner">
                          <input 
                            type="text" 
                            value={inputText} 
                            onChange={e => setInputText(e.target.value)} 
                            onKeyDown={e => e.key === 'Enter' && handleSend()} 
                            placeholder="Direct message..." 
                            className="flex-1 bg-transparent text-white outline-none placeholder-gray-700 py-1 text-sm font-light italic tracking-wide" 
                          />
                      </div>
                      <button 
                        onClick={() => handleSend()} 
                        disabled={!inputText.trim()} 
                        className={`p-3.5 rounded-full transition-all mb-0.5 ${inputText.trim() ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'bg-white/5 text-gray-700'}`}
                      >
                        <ICONS.Rocket size={20} className={inputText.trim() ? 'animate-pulse' : ''} />
                      </button>
                  </div>
              </div>
          </div>
      ) : (
          <div className="flex flex-col h-full bg-gradient-to-br from-red-500/10 via-black to-xs-cyan/10">
            <header className="p-8 flex justify-between items-end">
                <div>
                    <h1 className="text-7xl font-black text-white italic tracking-tighter uppercase leading-none">Chats.</h1>
                    <p className="text-[10px] font-black text-xs-cyan uppercase tracking-[0.6em] mt-2 ml-1">{activeTabLabel}</p>
                </div>
                <button 
                    onClick={openSettings} 
                    className="p-4 bg-white/5 rounded-[1.8rem] border border-white/10 text-red-500 hover:rotate-90 transition-all shadow-2xl hover:border-red-500/40"
                >
                    <ICONS.Settings size={28} />
                </button>
            </header>
            
            <div className="px-4 pb-6">
                <div className="grid grid-cols-4 gap-2">
                    {tabs.map(tab => {
                        let badgeCount = 0;
                        if (tab.id === 'direct') badgeCount = totalUnreadMessages;
                        if (tab.id === 'oink') badgeCount = totalOinks;

                        return (
                        <button 
                            key={tab.id} 
                            onClick={() => { setActiveTab(tab.id as any); soundService.play('tab'); }} 
                            className={`py-3 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all relative ${activeTab === tab.id ? `${tab.bg} text-black border-transparent shadow-lg scale-105` : `bg-white/5 ${tab.text} border-white/5 hover:border-white/20`}`}
                        >
                            {tab.label}
                            {badgeCount > 0 && (
                                <div className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-red-500 rounded-full flex items-center justify-center text-[8px] font-black text-white border-2 border-xs-black z-10 animate-in zoom-in">
                                    {badgeCount > 99 ? '99+' : badgeCount}
                                </div>
                            )}
                        </button>
                    )})}
                </div>
            </div>

            <div className="flex-1 space-y-4 overflow-y-auto px-8 custom-scrollbar pb-32">
                {activeTab === 'direct' ? chats.map(chat => (
                    <Card3D 
                        key={chat.id} 
                        className="cursor-pointer h-24 group" 
                        innerClassName="px-6 flex items-center border-white/5 bg-black/40 hover:bg-black/60 transition-all" 
                        glowColor={chat.status !== 'offline' ? (chat.status === 'online' ? 'cyan' : (chat.status === 'busy' ? 'pink' : 'yellow')) : 'none'} 
                        onClick={() => openChat(chat.id)}
                    >
                        <div className="flex items-center gap-5 w-full">
                            <div className="relative">
                                <img src={chat.avatar} className="w-14 h-14 rounded-[1.8rem] border border-white/10 transition-transform group-hover:scale-105" alt={chat.name} />
                                {chatSettings.activityDisplay && (
                                    <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-black animate-pulse ${statusConfig[chat.status].color} ${statusConfig[chat.status].glow}`} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="flex items-center gap-2">
                                        <h3 className="font-black text-white text-lg italic tracking-tighter uppercase group-hover:text-xs-cyan transition-colors">{chat.name}</h3>
                                        {chatSettings.activityDisplay && (
                                            <span className={`text-[7px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded bg-white/5 ${statusConfig[chat.status].color.replace('bg-', 'text-')}`}>
                                                {statusConfig[chat.status].label}
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] text-gray-500 font-mono">{chat.time}</span>
                                </div>
                                <p className="text-xs truncate text-gray-400 font-light italic">{chat.lastMsg}</p>
                            </div>
                            {chat.unread > 0 && <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-[10px] font-black text-white animate-jiggle shadow-lg">{chat.unread}</div>}
                        </div>
                    </Card3D>
                )) : activeTab === 'rooms' ? roomsList.map(room => (
                    <Card3D 
                        key={room.id} 
                        className="cursor-pointer h-24 group" 
                        innerClassName="px-6 flex items-center border-white/5 bg-black/40 hover:bg-black/60 transition-all" 
                        glowColor="purple"
                        onClick={() => openChat(room.id)}
                    >
                        <div className="flex items-center gap-5 w-full">
                            <img src={room.avatar} className="w-14 h-14 rounded-[1.8rem] border border-white/10" alt={room.name} />
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-white text-lg italic tracking-tighter uppercase group-hover:text-xs-cyan transition-colors">
                                    {room.name.startsWith('Bareback') ? (
                                        <>
                                            <span className="text-xs-pink animate-pulse drop-shadow-[0_0_8px_rgba(255,0,255,0.8)]">Bareback</span>
                                            {room.name.substring(8)}
                                        </>
                                    ) : (
                                        room.name
                                    )}
                                </h3>
                                <p className="text-[10px] text-xs-purple font-black uppercase tracking-widest">Public Space • Active Now</p>
                            </div>
                            {room.unreadCount > 0 && <div className="px-2 py-0.5 bg-xs-cyan rounded-full text-[10px] font-black text-black">{room.unreadCount}</div>}
                        </div>
                    </Card3D>
                )) : activeTab === 'oink' ? (
                    <div className="space-y-4">
                        {oinks.map(oink => (
                            <Card3D key={oink.id} className="h-32" innerClassName="p-4 flex items-center gap-4 bg-black/40 border-white/5" glowColor="pink">
                                <div className="relative">
                                    <img src={oink.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover border border-white/10" alt={oink.username} />
                                    <div className="absolute -bottom-1 -right-1 bg-xs-pink text-black text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-bounce">OINK</div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-black text-white text-lg italic tracking-tighter uppercase truncate">{oink.username}</h3>
                                        <span className="text-[9px] text-gray-500 font-mono">{oink.time}</span>
                                    </div>
                                    <p className="text-[9px] text-xs-pink font-black uppercase tracking-widest mt-1">Viewed Profile & Oinked</p>
                                    
                                    <div className="flex gap-2 mt-3">
                                        <button onClick={() => handleOinkBack(oink.id)} className="flex-1 py-2 bg-xs-pink/20 border border-xs-pink/40 rounded-xl text-[9px] font-black uppercase text-xs-pink hover:bg-xs-pink hover:text-black transition-all">
                                            Oink Back
                                        </button>
                                        <button onClick={() => handleSmile(oink.id)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-yellow-400 hover:bg-white/10 transition-all">
                                            <ICONS.Smile size={14} />
                                        </button>
                                        <button onClick={() => handleDeleteOink(oink.id)} className="px-3 py-2 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-red-500 transition-all">
                                            <ICONS.Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                            </Card3D>
                        ))}
                        {oinks.length === 0 && (
                            <div className="text-center py-20 opacity-50">
                                <div className="p-6 bg-white/5 rounded-full inline-block mb-4">
                                    <ICONS.Bell size={32} className="text-gray-500" />
                                </div>
                                <p className="text-sm font-black uppercase text-gray-500 tracking-widest">No Oinks Yet</p>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-6">
                        <button 
                            onClick={() => { setShowCreateAd(true); soundService.play('click'); }}
                            className="w-full py-6 bg-gradient-to-r from-xs-yellow via-orange-500 to-red-500 rounded-[2.5rem] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all group flex items-center justify-center gap-3 relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-white/20 skew-x-12 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-700"></div>
                            <ICONS.Zap size={24} className="text-black" />
                            <span className="text-black font-black uppercase tracking-[0.3em] text-lg">Broadcast_Signal</span>
                        </button>

                        <div className="grid grid-cols-1 gap-4">
                            {activeAds.map(ad => (
                                <Card3D key={ad.id} className="min-h-[160px]" innerClassName="p-5 flex gap-4 bg-black/40 border-white/5" glowColor={ad.color}>
                                    <div className="flex flex-col items-center justify-between">
                                        <div className="relative">
                                            <img src={ad.avatar} className="w-16 h-16 rounded-[1.5rem] object-cover border-2 border-white/10" alt={ad.username} />
                                            <div className="absolute -bottom-1 -right-1 bg-xs-yellow text-black text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-lg animate-pulse">{ad.distance}</div>
                                        </div>
                                        <div className="mt-2 bg-white/5 rounded-lg px-2 py-1 flex items-center gap-1 border border-white/5">
                                            <ICONS.MapPin size={10} className={`text-xs-${ad.color}`} />
                                            <span className="text-[7px] font-black uppercase tracking-widest text-white">{ad.locationType}</span>
                                        </div>
                                    </div>
                                    
                                    <div className="flex-1 flex flex-col justify-between">
                                        <div>
                                            <div className="flex justify-between items-start mb-1">
                                                <h3 className="font-black text-white text-lg italic tracking-tighter uppercase">{ad.username}</h3>
                                                <span className="text-[8px] font-black uppercase tracking-widest text-gray-500 bg-white/5 px-2 py-1 rounded-lg flex items-center gap-1">
                                                    <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>
                                                    {ad.durationLabel} Left
                                                </span>
                                            </div>
                                            <p className={`text-sm font-medium italic leading-snug text-xs-${ad.color} opacity-90`}>"{ad.text}"</p>
                                        </div>
                                        
                                        <div className="mt-3 flex gap-2">
                                            <button onClick={() => openAd(ad)} className={`flex-1 py-2 bg-xs-${ad.color}/20 border border-xs-${ad.color}/40 rounded-xl text-xs-${ad.color} font-black uppercase tracking-widest text-[9px] hover:bg-xs-${ad.color} hover:text-black transition-all flex items-center justify-center gap-2`}>
                                                <ICONS.MessageCircle size={12} /> Direct_Link
                                            </button>
                                            <div className="px-3 py-2 bg-black/40 border border-white/10 rounded-xl flex items-center gap-1.5 shadow-inner">
                                                <ICONS.Heart size={10} className="text-xs-pink" />
                                                <span className="text-[9px] font-black text-white">{ad.likes}</span>
                                            </div>
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
