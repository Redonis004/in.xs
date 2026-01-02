
import React, { useState, useRef, useEffect } from 'react';
import Card3D from '../components/Card3D';
import ShareMenu from '../components/ShareMenu';
import TransactionModal from '../components/TransactionModal';
import { ICONS, SAMPLE_POSTS, APP_LOGO, REACTION_OPTIONS } from '../constants';
import { User, Post, Report, MediaItem, Comment, UserStatus } from '../types';
import { soundService } from '../services/soundService';
import { 
    chatWithUnhingedAI, 
    chatWithNeuralPro, 
    searchPlacesGrounded,
    generateProfileBio,
    checkContentSafety
} from '../services/geminiService';

// Categorized emoji sets for the "All Emojis" request
const EMOJI_MATRIX = [
    { label: 'TRENDING', items: ['🔥', '😈', '🍆', '🍑', '💦', '🌈', '✨', '💅', '👀', '🥵'] },
    { label: 'LOVE', items: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '❣️', '💕', '💞', '💓', '💗'] },
    { label: 'PRIDE', items: ['🏳️‍🌈', '🏳️‍⚧️', '🦄', '🧚‍♂️', '💅', '👑', '💄', '👠', '🕺', '💃'] },
    { label: 'MOOD', items: ['😂', '🥺', '😭', '😎', '😜', '🤤', '🫠', '💀', '🤡', '🫡', '🫣', '😏', '😒', '🤔'] },
    { label: 'ACTION', items: ['💪', '🏋️‍♂️', '🍆', '🍑', '💦', '🔞', '⛓️', '🎭', '💊', '🐺', '🐻', '🦦', '🐾'] }
];

interface EmojiPickerProps {
    onSelect: (emoji: string) => void;
    onClose: () => void;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onSelect, onClose }) => (
    <div className="absolute bottom-full mb-4 right-0 z-[100] w-64 liquid-glass rounded-[2rem] border border-white/10 p-4 shadow-4xl animate-in zoom-in-95 slide-in-from-bottom-2 duration-200">
        <div className="flex justify-between items-center mb-3 px-1">
            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-xs-cyan">Emoji_Matrix</span>
            <button onClick={onClose} className="text-gray-500 hover:text-white"><ICONS.X size={14} /></button>
        </div>
        <div className="max-h-60 overflow-y-auto custom-scrollbar pr-1 space-y-4">
            {EMOJI_MATRIX.map(cat => (
                <div key={cat.label}>
                    <p className="text-[7px] font-black text-gray-600 uppercase tracking-widest mb-2 ml-1">{cat.label}</p>
                    <div className="grid grid-cols-5 gap-2">
                        {cat.items.map(emoji => (
                            <button 
                                key={emoji} 
                                onClick={() => { onSelect(emoji); soundService.play('pop'); }}
                                className="w-10 h-10 flex items-center justify-center text-xl hover:bg-white/5 rounded-xl transition-all hover:scale-110 active:scale-90"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                </div>
            ))}
        </div>
    </div>
);

interface FeedProps {
  user: User;
  onReport: (report: Report) => void;
}

const AudioPlayer: React.FC<{ url: string, onTranscribe?: () => void }> = ({ url, onTranscribe }) => {
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (isPlaying) {
            audioRef.current.pause();
            soundService.play('lock');
        } else {
            audioRef.current.play();
            soundService.play('unlock');
        }
        setIsPlaying(!isPlaying);
    };

    const onTimeUpdate = () => {
        if (audioRef.current) {
            const current = audioRef.current.currentTime;
            const total = audioRef.current.duration;
            setProgress((current / total) * 100);
        }
    };

    const onLoadedMetadata = () => {
        if (audioRef.current) setDuration(audioRef.current.duration);
    };

    const onEnded = () => {
        setIsPlaying(false);
        setProgress(0);
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return "0:00";
        const mins = Math.floor(time / 60);
        const secs = Math.floor(time % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div className="mb-6 p-4 bg-white/5 border border-white/10 rounded-[2.5rem] flex items-center gap-5 group/audio relative overflow-hidden">
            <audio 
                ref={audioRef} 
                src={url} 
                onTimeUpdate={onTimeUpdate} 
                onLoadedMetadata={onLoadedMetadata} 
                onEnded={onEnded}
            />
            <button 
                onClick={togglePlay}
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-black shadow-xl active:scale-90 transition-all z-10 ${isPlaying ? 'bg-xs-cyan shadow-xs-cyan/40' : 'bg-xs-purple shadow-xs-purple/40'}`}
            >
                {isPlaying ? <ICONS.Pause size={24} fill="currentColor" /> : <ICONS.Play size={24} fill="currentColor" className="ml-1" />}
            </button>
            <div className="flex-1 space-y-2 z-10">
                <div className="h-1.5 bg-white/10 rounded-full overflow-hidden relative">
                    <div 
                        className={`h-full transition-all duration-300 ${isPlaying ? 'bg-xs-cyan shadow-[0_0_15px_rgba(0,255,255,0.8)]' : 'bg-xs-purple'}`}
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <div className="flex justify-between items-center">
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{formatTime(audioRef.current?.currentTime || 0)}</span>
                    <button 
                        onClick={onTranscribe}
                        className="text-[8px] font-black text-xs-cyan uppercase tracking-[0.3em] hover:brightness-125 transition-all"
                    >
                        {isPlaying ? 'VOICE_SYNC_ACTIVE' : 'AI_TRANSCRIBE'}
                    </button>
                    <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">{formatTime(duration)}</span>
                </div>
            </div>
            {isPlaying && <div className="absolute inset-0 bg-xs-cyan/5 animate-pulse-slow"></div>}
        </div>
    );
};

const NeuralOrb: React.FC<{ onClick: () => void, isLive: boolean, isThinking: boolean, isSpeaking: boolean, variant?: 'pro' | 'flash' }> = ({ onClick, isLive, isThinking, isSpeaking, variant = 'flash' }) => (
  <div className="relative group cursor-pointer" onClick={onClick}>
    <div className={`relative w-14 h-14 transition-all duration-700 ease-out transform ${
        isLive ? 'scale-115' : 'scale-100 group-hover:scale-110 active:scale-95'
    }`}>
      <div className={`absolute inset-[-8px] rounded-full blur-2xl transition-all duration-700 ${
        variant === 'pro' ? 'bg-xs-cyan/40 shadow-[0_0_40px_rgba(0,255,255,0.4)]' : 'bg-xs-purple/20'
      }`}></div>
      
      <div className={`w-full h-full rounded-full liquid-glass flex items-center justify-center ring-1 ${isLive ? 'ring-xs-cyan/60 shadow-[0_0_30px_rgba(0,255,255,0.3)]' : 'ring-white/10'}`}>
         <div className={`transition-all duration-500 ${isSpeaking ? 'scale-125' : (isThinking ? 'animate-spin' : '')}`}>
            {variant === 'pro' ? <ICONS.Sparkles size={20} className="text-xs-cyan" /> : <ICONS.Zap size={20} className="text-xs-purple" />}
         </div>
      </div>
    </div>
  </div>
);

const PostCard: React.FC<{ 
    post: Post, 
    user: User,
    onLike: (id: string, emoji?: string) => void,
    onComment: (id: string, text: string) => void,
    onTip: (id: string) => void,
    showNSFW: boolean
}> = ({ post, user, onLike, onComment, onTip, showNSFW }) => {
    const [showComments, setShowComments] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showCommentEmojiPicker, setShowCommentEmojiPicker] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isGeneratingReply, setIsGeneratingReply] = useState(false);
    const [isSaved, setIsSaved] = useState(false);
    const [aiTranscription, setAiTranscription] = useState<string | null>(null);
    const [isTranscribing, setIsTranscribing] = useState(false);

    const isNSFW = post.content.toLowerCase().includes('nsfw') || post.content.includes('🍆') || post.content.includes('🍑');

    const statusConfig: Record<UserStatus, { color: string, label: string }> = {
        online: { color: 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]', label: 'Online' },
        busy: { color: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]', label: 'Busy' },
        away: { color: 'bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]', label: 'Away' },
        offline: { color: 'bg-gray-500 shadow-none', label: 'Offline' }
    };

    const currentStatus = post.userStatus || 'online';
    const statusInfo = statusConfig[currentStatus];

    const handleMagicReply = async () => {
        soundService.play('unlock');
        setIsGeneratingReply(true);
        try {
            const reply = await chatWithUnhingedAI(`The post says: "${post.content}". Write a very short, community-slang heavy, flirty comment as a reply.`, [], 'Chaotic');
            setCommentText(reply.replace(/"/g, ''));
            soundService.play('success');
        } catch (err) {
            soundService.play('error');
        } finally {
            setIsGeneratingReply(false);
        }
    };

    const handleTranscribe = async () => {
        if (aiTranscription || isTranscribing) return;
        setIsTranscribing(true);
        soundService.play('scan');
        try {
            const text = await chatWithNeuralPro(`Simulate transcribing this voice note content based on user context: "${post.username} just posted an audio note." Return a short sentence in quotes.`, [], 'Deep');
            setAiTranscription(text.text);
            soundService.play('success');
        } catch (err) {
            soundService.play('error');
        } finally {
            setIsTranscribing(false);
        }
    };

    const handleToggleSave = () => {
        soundService.play(isSaved ? 'lock' : 'unlock');
        setIsSaved(!isSaved);
        setShowOptions(false);
    };

    const handleCopyLink = () => {
        navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
        soundService.play('success');
        setShowOptions(false);
        alert("Link cached to clipboard.");
    };

    if (isNSFW && !showNSFW) return null;

    const isLive = post.liveLocationExpiry && post.liveLocationExpiry > Date.now();
    const mapUrl = post.locationCoords ? `https://www.google.com/maps/search/?api=1&query=${post.locationCoords.lat},${post.locationCoords.lng}` : null;
    
    // Aesthetic Google Maps "Screenshot" URL using Google Static Maps API
    const staticMapUrl = post.locationCoords 
        ? `https://maps.googleapis.com/maps/api/staticmap?center=${post.locationCoords.lat},${post.locationCoords.lng}&zoom=16&size=600x400&maptype=roadmap&markers=color:0xbd00ff%7C${post.locationCoords.lat},${post.locationCoords.lng}&style=feature:all%7Celement:all%7Csaturation:-100%7Clightness:-20%7Cvisibility:on&style=feature:water%7Celement:geometry%7Ccolor:0x0d0d0d&style=feature:landscape%7Celement:geometry%7Ccolor:0x050505&style=feature:road%7Celement:geometry%7Ccolor:0x1a1a1a&style=feature:poi%7Cvisibility:off&key=${process.env.API_KEY}`
        : null;

    return (
        <div className="glass-panel rounded-[2.5rem] p-6 mb-6 ring-1 ring-white/5 group hover:ring-white/20 transition-all relative overflow-hidden">
            <header className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-4">
                    <div className="relative w-12 h-12">
                        <div className="w-12 h-12 rounded-2xl overflow-hidden ring-2 ring-xs-purple/30 group-hover:rotate-3 transition-transform">
                            <img src={post.userAvatar} className="w-full h-full object-cover" alt={post.username} />
                        </div>
                        <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-2 border-xs-black ${statusInfo.color} animate-pulse`}></div>
                    </div>
                    <div>
                        <h3 className="font-black text-white text-lg italic tracking-tight leading-none mb-1 uppercase">{post.username}</h3>
                        <div className="flex items-center gap-2">
                             <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1">
                                {isNSFW && <span className="text-xs-pink mr-2">● LIVE</span>}
                                {statusInfo.label}
                            </p>
                            {post.location && (
                                <span className="text-[9px] font-black text-xs-cyan uppercase tracking-widest flex items-center gap-1 bg-xs-cyan/10 px-2 py-0.5 rounded-full">
                                    <ICONS.MapPin size={10} /> {post.location}
                                    {isLive && <span className="ml-1 text-xs-pink animate-pulse">● LIVE</span>}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
                <div className="relative">
                    <button 
                        onClick={() => { soundService.play('click'); setShowOptions(!showOptions); }}
                        className={`p-3 rounded-full transition-colors ${showOptions ? 'bg-xs-purple/20 text-xs-purple' : 'bg-white/5 text-gray-500 hover:bg-white/10'}`}
                    >
                        <ICONS.Menu size={20}/>
                    </button>
                    {showOptions && (
                        <div className="absolute right-0 top-14 w-48 liquid-glass border border-white/10 rounded-2xl z-[50] py-2 animate-in zoom-in-95 duration-200 shadow-4xl">
                            <button onClick={handleToggleSave} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                                <ICONS.Target size={14} className={isSaved ? 'text-xs-yellow' : ''} /> {isSaved ? 'In_Vault' : 'Save_to_Vault'}
                            </button>
                            <button onClick={handleCopyLink} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:bg-white/5 transition-all">
                                <ICONS.Link size={14} /> Copy_Link
                            </button>
                            {mapUrl && (
                                <a href={mapUrl} target="_blank" rel="noreferrer" className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-xs-cyan hover:bg-xs-cyan/5 transition-all">
                                    <ICONS.Globe size={14} /> View_on_Maps
                                </a>
                            )}
                            <div className="h-px bg-white/5 my-1 mx-2"></div>
                            <button onClick={() => { soundService.play('unlock'); onTip(post.id); setShowOptions(false); }} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-xs-yellow hover:bg-xs-yellow/5 transition-all">
                                <ICONS.CreditCard size={14} /> Sync_Credits
                            </button>
                            <button onClick={() => { soundService.play('error'); setShowOptions(false); }} className="w-full px-4 py-3 flex items-center gap-3 text-[10px] font-black uppercase tracking-widest text-xs-pink hover:bg-xs-pink/5 transition-all">
                                <ICONS.Flag size={14} /> Report_Node
                            </button>
                        </div>
                    )}
                </div>
            </header>

            <p className="body-text mb-6 pl-4 border-l-2 border-xs-purple/40 italic relative z-10">
                {post.content}
            </p>

            {/* ENHANCED MAP PREVIEW WITH HUD */}
            {staticMapUrl && (
                <div className="mb-6 space-y-3 relative z-10">
                    <div className="flex justify-between items-center px-1">
                        <span className="text-[8px] font-black text-xs-cyan uppercase tracking-[0.3em]">GPS_Data_Intercept</span>
                        <span className="text-[8px] font-mono text-gray-600 uppercase tracking-widest">Signal_Lock: Stable</span>
                    </div>
                    <a 
                        href={mapUrl!} 
                        target="_blank" 
                        rel="noreferrer" 
                        className="block rounded-[2rem] overflow-hidden border border-white/10 shadow-4xl relative aspect-video group/map hover:scale-[1.01] transition-all duration-500 bg-xs-dark"
                    >
                        <img 
                            src={staticMapUrl} 
                            className="w-full h-full object-cover opacity-60 group-hover/map:opacity-80 transition-opacity" 
                            alt="Google Map Screenshot"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?q=80&w=600&auto=format&fit=crop'; }}
                        />
                        
                        {/* HUD Tech Overlays */}
                        <div className="absolute inset-0 bg-gradient-to-t from-xs-black/80 via-transparent to-xs-black/40"></div>
                        
                        <div className="absolute top-4 left-4 right-4 flex justify-between items-start pointer-events-none">
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2 flex flex-col gap-0.5">
                                <span className="text-[7px] font-black text-gray-500 uppercase">Latitude</span>
                                <span className="text-[9px] font-mono text-xs-cyan">{post.locationCoords?.lat.toFixed(6)}°</span>
                            </div>
                            <div className="bg-black/60 backdrop-blur-md border border-white/10 rounded-lg p-2 flex flex-col gap-0.5 text-right">
                                <span className="text-[7px] font-black text-gray-500 uppercase">Longitude</span>
                                <span className="text-[9px] font-mono text-xs-cyan">{post.locationCoords?.lng.toFixed(6)}°</span>
                            </div>
                        </div>

                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                             <div className="relative">
                                <div className="absolute inset-[-40px] border border-xs-cyan/20 rounded-full animate-ping"></div>
                                <div className="absolute inset-[-20px] border border-xs-cyan/40 rounded-full animate-pulse"></div>
                                <div className="p-4 rounded-full bg-xs-black/40 backdrop-blur-md border border-white/20">
                                    <ICONS.MapPin size={28} className={isLive ? "text-xs-pink" : "text-xs-cyan"} />
                                </div>
                             </div>
                        </div>

                        {isLive && (
                             <div className="absolute top-4 right-4 animate-in fade-in duration-500">
                                <div className="px-3 py-1 bg-xs-pink text-black text-[9px] font-black uppercase rounded-full shadow-lg flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-black animate-pulse"></div>
                                    LIVE_SYNC_ACTIVE
                                </div>
                             </div>
                        )}

                        <div className="absolute bottom-6 left-6 right-6 flex justify-between items-end pointer-events-none">
                             <div className="flex flex-col gap-2">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-xs-cyan shadow-[0_0_10px_rgba(0,255,255,1)]"></div>
                                    <span className="text-[8px] font-black text-white uppercase tracking-widest drop-shadow-md">GPS_SIGNAL_LOCKED</span>
                                </div>
                                <span className="text-[10px] font-black text-white uppercase tracking-[0.2em] drop-shadow-lg group-hover/map:text-xs-cyan transition-colors">Syncing_Real_Time</span>
                             </div>
                             <div className="p-3 bg-black/80 rounded-2xl backdrop-blur-xl border border-white/20 shadow-xl group-hover/map:border-xs-cyan/50 transition-colors">
                                 <ICONS.Globe size={18} className="text-white group-hover/map:rotate-12 transition-transform" />
                             </div>
                        </div>
                        
                        {/* Scanning HUD effect */}
                        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-xs-cyan/5 to-transparent h-1/3 w-full animate-scan pointer-events-none opacity-40"></div>
                    </a>
                </div>
            )}

            {post.imageUrl && !staticMapUrl && (
                <div className={`rounded-[2rem] overflow-hidden mb-6 shadow-2xl relative aspect-[4/5] z-10 ${isNSFW && !showNSFW ? 'blur-3xl grayscale' : ''}`}>
                    <img src={post.imageUrl} className="w-full h-full object-cover transition-transform duration-[5s] group-hover:scale-110" alt="post content" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"></div>
                </div>
            )}

            {post.audioUrl && (
                <div className="relative z-10">
                    <AudioPlayer url={post.audioUrl} onTranscribe={handleTranscribe} />
                    {aiTranscription && (
                        <div className="mb-6 p-4 bg-xs-cyan/5 border border-xs-cyan/20 rounded-2xl animate-in slide-in-from-top-2">
                             <p className="text-[8px] font-black uppercase tracking-[0.2em] text-xs-cyan mb-2">AI_Neural_Transcription:</p>
                             <p className="text-xs italic text-gray-300">"{aiTranscription}"</p>
                        </div>
                    )}
                    {isTranscribing && (
                        <div className="mb-6 p-4 text-center">
                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-xs-cyan animate-pulse">Analyzing_Audio_Stream...</span>
                        </div>
                    )}
                </div>
            )}

            {/* Exact Emojis Reactions */}
            {post.reactions && Object.keys(post.reactions).length > 0 && (
                <div className="flex flex-wrap gap-2 mb-4 relative z-10">
                    {Object.entries(post.reactions).map(([emoji, count]) => (
                        <button 
                            key={emoji}
                            onClick={() => onLike(post.id, emoji)}
                            className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full flex items-center gap-2 hover:bg-white/10 transition-all active:scale-95"
                        >
                            <span className="text-sm">{emoji}</span>
                            <span className="text-[10px] font-black text-gray-400">{count}</span>
                        </button>
                    ))}
                </div>
            )}

            <footer className="flex justify-between items-center pt-2 relative z-10">
                <div className="flex gap-6">
                    <button 
                      onClick={() => onLike(post.id)}
                      className={`flex items-center gap-3 transition-all active:scale-75 ${post.isLiked ? 'text-xs-pink' : 'text-gray-500 hover:text-white'}`}
                    >
                        <ICONS.Heart size={28} fill={post.isLiked ? 'currentColor' : 'none'} className={post.isLiked ? 'animate-jiggle' : ''} />
                        <span className="text-sm font-black italic">{post.likes}</span>
                    </button>
                    <button 
                        onClick={() => { setShowComments(!showComments); soundService.play('tab'); }}
                        className={`flex items-center gap-3 transition-all ${showComments ? 'text-xs-cyan' : 'text-gray-500 hover:text-white'}`}
                    >
                        <ICONS.MessageCircle size={28} />
                        <span className="text-sm font-black italic">{post.comments.length}</span>
                    </button>
                    <button 
                        onClick={() => onTip(post.id)}
                        className="flex items-center gap-3 text-gray-500 hover:text-xs-yellow transition-all hover:scale-110 active:scale-90"
                    >
                        <ICONS.Zap size={28} />
                    </button>
                </div>
                <div className="flex gap-2 relative">
                    {REACTION_OPTIONS.slice(0,3).map(emoji => (
                        <button key={emoji} onClick={() => { onLike(post.id, emoji); soundService.play('pop'); }} className="w-10 h-10 liquid-glass rounded-full text-lg flex items-center justify-center hover:scale-125 transition-all grayscale hover:grayscale-0 active:scale-75">{emoji}</button>
                    ))}
                    <button 
                        onClick={() => { soundService.play('click'); setShowEmojiPicker(!showEmojiPicker); }}
                        className={`w-10 h-10 liquid-glass rounded-full text-lg flex items-center justify-center transition-all hover:rotate-90 ${showEmojiPicker ? 'text-xs-cyan border-xs-cyan' : 'text-gray-500 hover:text-white'}`}
                    >
                        <ICONS.Plus size={20} />
                    </button>
                    {showEmojiPicker && (
                        <EmojiPicker 
                            onSelect={(emoji) => { onLike(post.id, emoji); setShowEmojiPicker(false); }} 
                            onClose={() => setShowEmojiPicker(false)} 
                        />
                    )}
                </div>
            </footer>

            {showComments && (
                <div className="mt-8 pt-8 border-t border-white/5 space-y-6 animate-in slide-in-from-top-2 duration-300 relative z-10">
                    <div className="space-y-4 max-h-60 overflow-y-auto custom-scrollbar pr-2">
                        {post.comments.length === 0 ? (
                            <p className="text-[10px] text-gray-600 font-black uppercase tracking-[0.3em] text-center py-4 italic">Neural_Silence... Be the first.</p>
                        ) : (
                            post.comments.map((c) => (
                                <div key={c.id} className="flex gap-3 items-start animate-in fade-in slide-in-from-left-2">
                                    <div className="w-8 h-8 rounded-xl bg-white/5 overflow-hidden flex-shrink-0">
                                        <img src={`https://picsum.photos/50/50?random=${c.id}`} className="w-full h-full object-cover" alt="avatar" />
                                    </div>
                                    <div className="flex-1 bg-white/5 p-3 rounded-2xl rounded-tl-none border border-white/5">
                                        <div className="flex justify-between items-center mb-1">
                                            <p className="text-[9px] font-black text-xs-purple uppercase tracking-widest">{c.username}</p>
                                            <span className="text-[7px] text-gray-600 font-mono">ID_{c.id.slice(-4)}</span>
                                        </div>
                                        <p className="text-xs text-gray-300 italic">{c.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="flex gap-3 items-center relative">
                        <div className="flex-1 relative group">
                            <input 
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Sync reply..."
                                className="w-full bg-black/40 border border-white/10 rounded-2xl px-5 py-3 pr-24 text-xs italic outline-none focus:border-xs-cyan transition-all"
                            />
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                                <button 
                                    onClick={() => { soundService.play('click'); setShowCommentEmojiPicker(!showCommentEmojiPicker); }}
                                    className={`p-1 transition-colors ${showCommentEmojiPicker ? 'text-xs-cyan' : 'text-gray-500 hover:text-white'}`}
                                >
                                    <ICONS.Smile size={14} />
                                </button>
                                <button 
                                    onClick={handleMagicReply}
                                    disabled={isGeneratingReply}
                                    className="p-1 text-xs-purple/60 hover:text-xs-cyan transition-colors"
                                >
                                    {isGeneratingReply ? <ICONS.RefreshCw size={14} className="animate-spin" /> : <ICONS.Sparkles size={14} />}
                                </button>
                            </div>
                        </div>
                        <button 
                            onClick={() => { onComment(post.id, commentText); setCommentText(''); }}
                            disabled={!commentText.trim()}
                            className="p-3 bg-xs-cyan text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-30"
                        >
                            <ICONS.Rocket size={18} />
                        </button>
                        {showCommentEmojiPicker && (
                            <EmojiPicker 
                                onSelect={(emoji) => { setCommentText(prev => prev + emoji); }} 
                                onClose={() => setShowCommentEmojiPicker(false)} 
                            />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const Feed: React.FC<FeedProps> = ({ user, onReport }) => {
  const initialPosts = SAMPLE_POSTS.map(p => ({
      ...p,
      userStatus: (['online', 'busy', 'away', 'offline'][Math.floor(Math.random() * 4)]) as UserStatus,
      reactions: {}
  }));

  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [showGrok, setShowGrok] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showTipModal, setShowTipModal] = useState(false);
  const [activeTipTarget, setActiveTipTarget] = useState<{name: string, avatar: string} | null>(null);
  
  // Settings State
  const [feedSettings, setFeedSettings] = useState({
      showNSFW: true,
      autoPlayGifs: true,
      aiModeration: 'High',
      sortMethod: 'Recency',
      dataSaver: false,
      audioAutoplay: false,
      streamQuality: 'High'
  });

  const [chatType, setChatType] = useState<'flash' | 'pro'>('flash');
  const [messages, setMessages] = useState<{role: 'user' | 'model', text: string, links?: any[]}[]>([]);
  const [inputText, setInputText] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  
  // Create Post State
  const [createContent, setCreateContent] = useState('');
  const [createMedia, setCreateMedia] = useState<string | null>(null);
  const [createAudio, setCreateAudio] = useState<string | null>(null);
  const [createLocation, setCreateLocation] = useState<string | null>(null);
  const [createLocationCoords, setCreateLocationCoords] = useState<{lat: number, lng: number} | null>(null);
  const [liveExpiry, setLiveExpiry] = useState<number | null>(null);
  const [isNSFWUpload, setIsNSFWUpload] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [showCreateEmojiPicker, setShowCreateEmojiPicker] = useState(false);
  const [showLocationMenu, setShowLocationMenu] = useState(false);
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const handleLike = (id: string, emoji?: string) => {
    soundService.play('pop');
    setPosts(prev => prev.map(p => {
        if (p.id !== id) return p;
        
        if (emoji) {
            const currentReactions = { ...(p.reactions || {}) };
            currentReactions[emoji] = (currentReactions[emoji] || 0) + 1;
            return { ...p, reactions: currentReactions };
        } else {
            return { 
                ...p, 
                likes: p.isLiked ? p.likes - 1 : p.likes + 1, 
                isLiked: !p.isLiked 
            };
        }
    }));
  };

  const handleComment = (postId: string, text: string) => {
      soundService.play('send');
      const newComment: Comment = {
          id: Date.now().toString(),
          userId: user.id,
          username: user.username,
          text,
          timestamp: Date.now()
      };
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
  };

  const handleTip = (id: string) => {
      const p = posts.find(post => post.id === id);
      if (p) {
          setActiveTipTarget({ name: p.username, avatar: p.userAvatar });
          setShowTipModal(true);
          soundService.play('unlock');
      }
  };

  const handleOptimizePost = async () => {
    if (!createContent.trim()) return;
    setIsOptimizing(true);
    soundService.play('unlock');
    try {
        const enhanced = await generateProfileBio(['broadcast', 'social', 'unfiltered'], createContent, 'edgy');
        setCreateContent(enhanced);
        soundService.play('success');
    } catch (err) {
        soundService.play('error');
    } finally {
        setIsOptimizing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          soundService.play('camera');
          const reader = new FileReader();
          reader.onloadend = () => {
              setCreateMedia(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleSelectLocation = (type: 'actual' | '5m' | '1h' | '8h') => {
      soundService.play('unlock');
      setShowLocationMenu(false);
      if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition((pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              setCreateLocationCoords({ lat, lng });
              
              let expiry = null;
              let label = "Location";
              
              if (type === '5m') { expiry = Date.now() + 5 * 60 * 1000; label = "Live (5m)"; }
              else if (type === '1h') { expiry = Date.now() + 60 * 60 * 1000; label = "Live (1h)"; }
              else if (type === '8h') { expiry = Date.now() + 8 * 60 * 60 * 1000; label = "Live (8h)"; }
              
              setCreateLocation(label);
              setLiveExpiry(expiry);
              soundService.play('success');
          }, () => {
              alert("Neural geo-uplink failed. Enable GPS access.");
          });
      }
  };

  const handleToggleRecording = async () => {
      if (isRecording) {
          mediaRecorderRef.current?.stop();
          setIsRecording(false);
          soundService.play('lock');
      } else {
          try {
              const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
              const recorder = new MediaRecorder(stream);
              mediaRecorderRef.current = recorder;
              audioChunksRef.current = [];
              recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
              recorder.onstop = () => {
                  const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                  setCreateAudio(URL.createObjectURL(blob));
                  stream.getTracks().forEach(t => t.stop());
              };
              recorder.start();
              setIsRecording(true);
              soundService.play('unlock');
          } catch (err) {
              alert("Neural audio-uplink failed. Enable microphone access.");
          }
      }
  };

  const handleBroadcast = async () => {
      if (!createContent.trim() && !createMedia && !createAudio) return;
      
      // Safety Check
      if (createContent.trim()) {
          setIsCheckingSafety(true);
          const safety = await checkContentSafety(createContent);
          setIsCheckingSafety(false);
          
          if (!safety.safe) {
              soundService.play('error');
              alert(`Content Flagged: ${safety.reason || "Violates community guidelines."}`);
              return;
          }
      }

      const newPost: Post = {
          id: Date.now().toString(),
          userId: user.id,
          username: user.username,
          userAvatar: user.avatarUrl,
          userStatus: user.status || 'online',
          content: isNSFWUpload ? `[NSFW] ${createContent}` : createContent,
          imageUrl: createMedia || undefined,
          audioUrl: createAudio || undefined,
          location: createLocation || undefined,
          locationCoords: createLocationCoords || undefined,
          liveLocationExpiry: liveExpiry || undefined,
          likes: 0,
          reactions: {},
          timestamp: Date.now(),
          isLiked: false,
          comments: []
      };

      setPosts([newPost, ...posts]);
      setCreateContent('');
      setCreateMedia(null);
      setCreateAudio(null);
      setCreateLocation(null);
      setCreateLocationCoords(null);
      setLiveExpiry(null);
      setIsNSFWUpload(false);
      setShowCreate(false);
      soundService.play('success');
  };

  const handleSendChat = async () => {
    if (!inputText.trim()) return;
    const msg = inputText;
    setInputText('');
    setMessages(prev => [...prev, { role: 'user', text: msg }]);
    setIsThinking(true);
    soundService.play('typing');

    try {
        let response;
        const lowMsg = msg.toLowerCase();
        
        // Extended trigger keywords for maps
        if (lowMsg.includes('near') || lowMsg.includes('where is') || lowMsg.includes('place') || lowMsg.includes('restaurant') || lowMsg.includes('bar') || lowMsg.includes('club') || lowMsg.includes('gym')) {
            let lat, lng;
            try {
                // Attempt to get location, but fallback gracefully if failed/denied
                const loc = await new Promise<GeolocationPosition>((res, rej) => 
                    navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
                );
                lat = loc.coords.latitude;
                lng = loc.coords.longitude;
            } catch (e) {
                console.warn("Geo-lock failed, proceeding with general grounding.");
            }
            response = await searchPlacesGrounded(msg, lat, lng);
        } else if (chatType === 'pro') {
            response = await chatWithNeuralPro(msg, messages as any);
        } else {
            const text = await chatWithUnhingedAI(msg, messages as any);
            response = { text };
        }

        setMessages(prev => [...prev, { role: 'model', text: response.text, links: (response as any).mapsLinks }]);
        soundService.play('success');
    } catch (err) {
        setMessages(prev => [...prev, { role: 'model', text: "Neural uplink failed. Signal lost in the grid." }]);
        soundService.play('error');
    } finally {
        setIsThinking(false);
    }
  };

  return (
    <div className="px-4 pt-12 space-y-10 pb-20">
      <header className="flex justify-between items-end pb-4">
        <div className="space-y-1">
            <h1 className="text-7xl font-black italic tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-xs-cyan via-xs-purple to-xs-pink">
              Scene.
            </h1>
            <p className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 ml-1">Everything in xs</p>
        </div>
        <div className="flex gap-4 items-center">
            <button 
                onClick={() => { soundService.play('click'); setShowSettings(true); }}
                className="w-12 h-12 liquid-glass flex items-center justify-center rounded-2xl text-gray-400 hover:text-white transition-all hover:rotate-45"
            >
                <ICONS.Settings size={22} />
            </button>
            <button 
                onClick={() => { soundService.play('click'); setShowCreate(!showCreate); }}
                className={`w-12 h-12 liquid-glass flex items-center justify-center rounded-2xl transition-all ${showCreate ? 'text-xs-cyan bg-xs-cyan/10 border-xs-cyan/30' : 'text-gray-400 hover:text-white'}`}
            >
                <ICONS.Plus size={24} />
            </button>
            <NeuralOrb 
                onClick={() => setShowGrok(true)}
                isLive={isThinking}
                isThinking={isThinking}
                isSpeaking={false}
                variant={chatType}
            />
        </div>
      </header>

      {showCreate && (
          <div className="animate-in slide-in-from-top-4 duration-300">
              <div className="glass-panel p-6 rounded-[2.5rem] border-xs-cyan/20 ring-1 ring-xs-cyan/10">
                  <div className="flex gap-4 mb-4">
                      <div className="w-10 h-10 rounded-xl overflow-hidden ring-1 ring-white/10">
                          <img src={user.avatarUrl} className="w-full h-full object-cover" alt="me" />
                      </div>
                      <div className="flex-1 relative">
                        <textarea 
                            value={createContent}
                            onChange={(e) => setCreateContent(e.target.value)}
                            placeholder="Broadcast your frequency... Audio & Location tags active ⚡️"
                            className="w-full bg-transparent outline-none italic text-white placeholder-gray-600 resize-none h-24 pt-1"
                        />
                        <div className="absolute right-0 bottom-0 flex items-center gap-2">
                            <button 
                                onClick={() => { soundService.play('click'); setShowCreateEmojiPicker(!showCreateEmojiPicker); }}
                                className={`p-2 text-xs transition-colors ${showCreateEmojiPicker ? 'text-xs-cyan' : 'text-gray-500 hover:text-white'}`}
                            >
                                <ICONS.Smile size={16} />
                            </button>
                            <button 
                                onClick={handleOptimizePost}
                                disabled={isOptimizing || !createContent.trim()}
                                className="p-2 text-xs-purple hover:text-xs-cyan transition-colors"
                                title="AI Optimize Broadcast"
                            >
                                {isOptimizing ? <ICONS.RefreshCw size={14} className="animate-spin" /> : <ICONS.Sparkles size={14} />}
                            </button>
                            {showCreateEmojiPicker && (
                                <EmojiPicker 
                                    onSelect={(emoji) => { setCreateContent(prev => prev + emoji); }} 
                                    onClose={() => setShowCreateEmojiPicker(false)} 
                                />
                            )}
                        </div>
                      </div>
                  </div>
                  
                  <div className="flex flex-col gap-4 mb-4">
                      {createMedia && (
                          <div className="relative h-48">
                              <img src={createMedia} className="w-full h-full object-cover rounded-2xl border border-white/10" alt="preview" />
                              <button onClick={() => setCreateMedia(null)} className="absolute top-2 right-2 p-2 bg-black/60 text-white rounded-full"><ICONS.X size={16} /></button>
                          </div>
                      )}
                      {createAudio && (
                          <div className="p-4 bg-xs-purple/10 border border-xs-purple/30 rounded-2xl flex flex-col gap-3">
                              <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                      <ICONS.Volume2 className="text-xs-purple" size={20} />
                                      <span className="text-[10px] font-black uppercase text-xs-purple tracking-widest">Audio_Clip_Recorded</span>
                                  </div>
                                  <button onClick={() => setCreateAudio(null)} className="text-gray-500 hover:text-white"><ICONS.X size={16} /></button>
                              </div>
                              <audio src={createAudio} controls className="w-full" />
                          </div>
                      )}
                      {createLocation && (
                          <div className="p-4 bg-xs-cyan/10 border border-xs-cyan/30 rounded-2xl flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                  <ICONS.MapPin className="text-xs-cyan" size={20} />
                                  <span className="text-[10px] font-black uppercase text-xs-cyan tracking-widest">{createLocation}</span>
                              </div>
                              <button onClick={() => { setCreateLocation(null); setCreateLocationCoords(null); setLiveExpiry(null); }} className="text-gray-500 hover:text-white"><ICONS.X size={16} /></button>
                          </div>
                      )}
                  </div>

                  <div className="flex justify-between items-center pt-4 border-t border-white/5 relative">
                      <div className="flex gap-2">
                          <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/5 rounded-xl text-gray-400 hover:text-xs-cyan transition-all"><ICONS.Camera size={20} /></button>
                          <button 
                            onClick={handleToggleRecording} 
                            className={`p-3 rounded-xl transition-all ${isRecording ? 'bg-red-500 text-white animate-pulse shadow-[0_0_15px_rgba(255,0,0,0.4)]' : 'bg-white/5 text-gray-400 hover:text-xs-purple'}`}
                          >
                            <ICONS.Mic size={20} />
                          </button>
                          <div className="relative">
                            <button 
                                onClick={() => { soundService.play('click'); setShowLocationMenu(!showLocationMenu); }} 
                                className={`p-3 rounded-xl transition-all ${createLocation ? 'bg-xs-cyan text-black' : 'bg-white/5 text-gray-400 hover:text-xs-cyan'}`}
                            >
                                <ICONS.MapPin size={20} />
                            </button>
                            {showLocationMenu && (
                                <div className="absolute bottom-full left-0 mb-4 w-64 glass-panel rounded-3xl p-4 space-y-3 z-50 animate-in slide-in-from-bottom-4 shadow-4xl border border-white/10">
                                    <h4 className="text-[9px] font-black text-xs-cyan uppercase tracking-[0.4em] mb-4">Geospatial_Select</h4>
                                    <button onClick={() => handleSelectLocation('actual')} className="w-full py-3 flex items-center justify-between px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Actual Position</span>
                                        <ICONS.Globe size={14} className="text-xs-cyan" />
                                    </button>
                                    <button onClick={() => handleSelectLocation('5m')} className="w-full py-3 flex items-center justify-between px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Live: 5 Minutes</span>
                                        <ICONS.Zap size={14} className="text-xs-pink" />
                                    </button>
                                    <button onClick={() => handleSelectLocation('1h')} className="w-full py-3 flex items-center justify-between px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Live: 1 Hour</span>
                                        <ICONS.Flame size={14} className="text-xs-pink" />
                                    </button>
                                    <button onClick={() => handleSelectLocation('8h')} className="w-full py-3 flex items-center justify-between px-4 bg-white/5 hover:bg-white/10 rounded-xl transition-all">
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Live: 8 Hours</span>
                                        <ICONS.ShieldCheck size={14} className="text-xs-pink" />
                                    </button>
                                </div>
                            )}
                          </div>
                          <button onClick={() => setIsNSFWUpload(!isNSFWUpload)} className={`p-3 rounded-xl transition-all ${isNSFWUpload ? 'bg-xs-pink text-white' : 'bg-white/5 text-gray-400'}`}><ICONS.ShieldAlert size={20} /></button>
                          <input type="file" ref={fileInputRef} className="hidden" accept="image/*,.gif" onChange={handleFileChange} />
                      </div>
                      <button 
                        onClick={handleBroadcast}
                        disabled={(!createContent.trim() && !createMedia && !createAudio) || isCheckingSafety}
                        className="px-10 py-3 bg-xs-cyan text-black rounded-xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-4xl flex items-center gap-2"
                      >
                          {isCheckingSafety ? 'Scanning...' : 'Broadcast'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      <div className="space-y-4">
        {posts.map(post => (
          <PostCard 
            key={post.id} 
            post={post} 
            user={user}
            onLike={handleLike} 
            onComment={handleComment}
            onTip={handleTip}
            showNSFW={feedSettings.showNSFW}
          />
        ))}
      </div>

      <TransactionModal 
        isOpen={showTipModal}
        onClose={() => setShowTipModal(false)}
        recipientName={activeTipTarget?.name || ''}
        recipientAvatar={activeTipTarget?.avatar || ''}
        currentBalance={user.walletBalance}
        onConfirm={(amt) => { setShowTipModal(false); soundService.play('success'); }}
      />

      {/* FEED SETTINGS MODAL */}
      {showSettings && (
          <div className="fixed inset-0 z-[110] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="w-full max-w-md glass-panel rounded-[3.5rem] p-10 ring-1 ring-white/10 shadow-4xl overflow-y-auto max-h-[85vh] custom-scrollbar">
                  <header className="flex justify-between items-center mb-10">
                      <div>
                          <h2 className="text-3xl font-black italic uppercase tracking-tighter">Settings</h2>
                          <p className="text-[9px] font-mono text-gray-500 uppercase tracking-widest mt-1">Operational_Feed_V1.0</p>
                      </div>
                      <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500 transition-all"><ICONS.X size={24} /></button>
                  </header>

                  <div className="space-y-8">
                      <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 group">
                          <div className="flex items-center gap-4">
                              <ICONS.ShieldAlert size={20} className="text-xs-pink" />
                              <span className="text-sm font-black uppercase tracking-wider text-gray-300">NSFW</span>
                          </div>
                          <button 
                            onClick={() => setFeedSettings({...feedSettings, showNSFW: !feedSettings.showNSFW})}
                            className={`w-14 h-7 rounded-full relative transition-colors duration-500 ${feedSettings.showNSFW ? 'bg-xs-pink shadow-[0_0_15px_rgba(255,0,255,0.4)]' : 'bg-gray-800'}`}
                          >
                              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${feedSettings.showNSFW ? 'left-8 scale-110' : 'left-1'}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 group">
                          <div className="flex items-center gap-4">
                              <ICONS.Zap size={20} className="text-xs-yellow" />
                              <span className="text-sm font-black uppercase tracking-wider text-gray-300">Autoplay</span>
                          </div>
                          <button 
                            onClick={() => setFeedSettings({...feedSettings, autoPlayGifs: !feedSettings.autoPlayGifs})}
                            className={`w-14 h-7 rounded-full relative transition-colors duration-500 ${feedSettings.autoPlayGifs ? 'bg-xs-yellow shadow-[0_0_15px_rgba(249,249,0,0.4)]' : 'bg-gray-800'}`}
                          >
                              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${feedSettings.autoPlayGifs ? 'left-8 scale-110' : 'left-1'}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 group">
                          <div className="flex items-center gap-4">
                              <ICONS.Volume2 size={20} className="text-xs-cyan" />
                              <span className="text-sm font-black uppercase tracking-wider text-gray-300">Audio Autoplay</span>
                          </div>
                          <button 
                            onClick={() => setFeedSettings({...feedSettings, audioAutoplay: !feedSettings.audioAutoplay})}
                            className={`w-14 h-7 rounded-full relative transition-colors duration-500 ${feedSettings.audioAutoplay ? 'bg-xs-cyan shadow-[0_0_15px_rgba(0,255,255,0.4)]' : 'bg-gray-800'}`}
                          >
                              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${feedSettings.audioAutoplay ? 'left-8 scale-110' : 'left-1'}`}></div>
                          </button>
                      </div>

                      <div className="flex items-center justify-between p-5 bg-white/5 rounded-3xl border border-white/5 group">
                          <div className="flex items-center gap-4">
                              <ICONS.ArrowLeft size={20} className="text-xs-purple" />
                              <span className="text-sm font-black uppercase tracking-wider text-gray-300">Data Saver</span>
                          </div>
                          <button 
                            onClick={() => setFeedSettings({...feedSettings, dataSaver: !feedSettings.dataSaver})}
                            className={`w-14 h-7 rounded-full relative transition-colors duration-500 ${feedSettings.dataSaver ? 'bg-xs-purple shadow-[0_0_15px_rgba(189,0,255,0.4)]' : 'bg-gray-800'}`}
                          >
                              <div className={`absolute top-1 w-5 h-5 rounded-full bg-white shadow-md transition-all duration-300 ${feedSettings.dataSaver ? 'left-8 scale-110' : 'left-1'}`}></div>
                          </button>
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2">AI Assistance Sync</label>
                          <div className="grid grid-cols-2 gap-3">
                              {['None', 'Assist', 'Heavy', 'Auto'].map(lvl => (
                                  <button 
                                    key={lvl}
                                    onClick={() => setFeedSettings({...feedSettings, aiModeration: lvl})}
                                    className={`py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${feedSettings.aiModeration === lvl ? 'bg-xs-cyan text-black border-xs-cyan shadow-xl' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
                                  >
                                      {lvl}
                                  </button>
                              ))}
                          </div>
                      </div>
                      
                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2">Frequency Sort</label>
                          <div className="grid grid-cols-2 gap-3">
                              {['Recency', 'Impact', 'Distance', 'Global'].map(s => (
                                  <button 
                                    key={s}
                                    onClick={() => setFeedSettings({...feedSettings, sortMethod: s})}
                                    className={`py-4 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${feedSettings.sortMethod === s ? 'bg-xs-purple text-white border-xs-purple shadow-xl' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
                                  >
                                      {s}
                                  </button>
                              ))}
                          </div>
                      </div>

                      <div className="space-y-4">
                          <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em] ml-2">Stream Quality</label>
                          <div className="grid grid-cols-3 gap-3">
                              {['Low', 'Medium', 'High'].map(q => (
                                  <button 
                                    key={q}
                                    onClick={() => setFeedSettings({...feedSettings, streamQuality: q})}
                                    className={`py-3 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest ${feedSettings.streamQuality === q ? 'bg-xs-pink text-white border-xs-pink shadow-xl' : 'bg-white/5 text-gray-500 border-white/5 hover:border-white/20'}`}
                                  >
                                      {q}
                                  </button>
                              ))}
                          </div>
                      </div>
                  </div>

                  <button 
                    onClick={() => { soundService.play('success'); setShowSettings(false); }}
                    className="w-full mt-12 py-6 bg-white text-black rounded-[2rem] font-black uppercase tracking-[0.4em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-4xl"
                  >
                      Sync
                  </button>
              </div>
          </div>
      )}

      {/* GROK UNHINGED MODAL */}
      {showGrok && (
          <div className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
              <div className="w-full max-w-lg glass-panel rounded-[3rem] flex flex-col h-[80vh] ring-1 ring-xs-cyan/20 bg-gradient-to-br from-xs-purple/10 to-xs-cyan/10">
                  <header className="p-8 border-b border-white/5 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <NeuralOrb isLive={isThinking} isThinking={isThinking} isSpeaking={false} onClick={() => {}} variant={chatType} />
                        <div>
                            <h2 className="text-2xl font-black italic uppercase tracking-tighter">
                                {chatType === 'pro' ? 'Neural Architect' : 'Grok Unhinged'}
                            </h2>
                            <p className="text-[9px] font-mono text-xs-cyan uppercase tracking-widest">
                                {chatType === 'pro' ? 'Active' : 'Active'}
                            </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button 
                            onClick={() => { setChatType(chatType === 'pro' ? 'flash' : 'pro'); soundService.play('tab'); }}
                            className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border transition-all ${chatType === 'pro' ? 'bg-xs-cyan text-black border-xs-cyan shadow-xl' : 'bg-white/5 text-xs-cyan border-xs-cyan/30'}`}
                        >
                            {chatType === 'pro' ? 'Pro' : 'Flash'}
                        </button>
                        <button onClick={() => { setShowGrok(false); setMessages([]); }} className="p-2 bg-white/5 rounded-full text-gray-500 hover:text-white transition-colors"><ICONS.X size={20}/></button>
                      </div>
                  </header>

                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 font-mono text-xs text-xs-cyan italic space-y-6 custom-scrollbar">
                      {messages.length === 0 && (
                          <p className="bg-xs-cyan/10 p-5 rounded-2xl border border-xs-cyan/20 leading-relaxed animate-in fade-in slide-in-from-bottom-2">
                            > INITIALIZING NEURAL UPLINK... <br/>
                            > MODE: {chatType.toUpperCase()} SYNC <br/>
                            > GEO_GROUNDING: ACTIVE <br/>
                            > AI_PERSONALITY: {feedSettings.aiModeration.toUpperCase()} <br/>
                            > READY FOR INPUT. ✨
                          </p>
                      )}
                      {messages.map((m, i) => (
                          <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-1`}>
                              <div className={`max-w-[85%] p-4 rounded-2xl ${m.role === 'user' ? 'bg-white/10 text-white ml-12' : 'bg-gradient-to-br from-xs-purple/20 to-xs-cyan/20 border border-xs-cyan/30 mr-12 shadow-xl text-white'}`}>
                                  {m.text}
                                  {m.links && m.links.length > 0 && (
                                      <div className="mt-4 flex flex-col gap-2">
                                          <p className="text-[8px] font-black uppercase text-xs-cyan border-b border-xs-cyan/20 pb-1">Geospatial_Nodes:</p>
                                          {m.links.map((link: any, idx: number) => (
                                              <a key={idx} href={link.uri} target="_blank" className="block bg-white/5 p-2 rounded-lg hover:bg-white/10 transition-all group/link">
                                                  <div className="flex items-center gap-2 text-[10px] text-white group-hover/link:text-xs-cyan transition-colors mb-1">
                                                      <ICONS.MapPin size={12} /> <span className="font-bold">{link.title}</span>
                                                  </div>
                                                  {link.snippet && (
                                                      <p className="text-[8px] text-gray-400 italic pl-5 line-clamp-2">"{link.snippet}"</p>
                                                  )}
                                              </a>
                                          ))}
                                      </div>
                                  )}
                              </div>
                          </div>
                      ))}
                      {isThinking && (
                          <div className="animate-pulse text-xs-cyan ml-2">> SYNCHRONIZING_DATA...</div>
                      )}
                  </div>

                  <footer className="p-6 border-t border-white/5">
                      <div className="flex gap-4">
                          <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                            placeholder="Imput" 
                            className="flex-1 bg-black/40 border border-white/10 rounded-2xl px-6 py-4 outline-none focus:border-xs-cyan transition-all text-sm italic"
                          />
                          <button onClick={handleSendChat} className="p-5 bg-xs-cyan text-black rounded-2xl active:scale-90 transition-transform shadow-4xl shadow-xs-cyan/20"><ICONS.Rocket size={24}/></button>
                      </div>
                  </footer>
              </div>
          </div>
      )}
    </div>
  );
};

export default Feed;
