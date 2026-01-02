
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ICONS, BODY_TYPES } from '../constants';
import { User, UserStatus } from '../types';
import Card3D from './Card3D';
import { soundService } from '../services/soundService';
import { chatService } from '../services/chatService';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  targetUser: any; // Using any to accept both User and the mock Member type from Members page
}

const UserProfileModal: React.FC<UserProfileModalProps> = ({ isOpen, onClose, currentUser, targetUser }) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'profile' | 'photos' | 'videos'>('profile');
  const [isLiked, setIsLiked] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  
  // Media Viewer State
  const [selectedMedia, setSelectedMedia] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [mediaComments, setMediaComments] = useState<{user: string, text: string}[]>([
      { user: 'GymRat99', text: 'Looking huge bro! 💪' },
      { user: 'CityBoi', text: 'Great shot.' }
  ]);
  const [newComment, setNewComment] = useState('');
  const [mediaLiked, setMediaLiked] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Reset state when opening new user
  useEffect(() => {
      if (isOpen) {
          setIsLiked(false);
          setIsBlocked(false);
          setActiveTab('profile');
          setSelectedMedia(null);
      }
  }, [isOpen, targetUser]);

  if (!isOpen || !targetUser) return null;

  // Normalizing data between User type and Members mock type
  const isMe = currentUser.id === targetUser.id;
  const status: UserStatus = targetUser.status || (targetUser.isOnline ? 'online' : 'offline');
  const photos = targetUser.photos || [targetUser.avatar || targetUser.avatarUrl];
  const videos = targetUser.videos || [];
  
  // Status Colors
  const statusColor = {
      online: 'bg-green-500',
      busy: 'bg-red-500',
      away: 'bg-yellow-500',
      offline: 'bg-gray-500'
  }[status] || 'bg-gray-500';

  const handleAction = (action: string) => {
      switch(action) {
          case 'oink':
              soundService.play('oink');
              // Use chatService to send Oink
              chatService.sendOink(targetUser, currentUser);
              alert(`🐷 OINK! You oinked at ${targetUser.username}`);
              break;
          case 'message':
              soundService.play('click');
              // Create chat if needed via logic in chat page or here, but navigating with ID is enough for Chat.tsx to pick it up
              onClose();
              navigate(`/chat?chatId=${targetUser.id}`);
              break;
          case 'like':
              soundService.play('pop');
              setIsLiked(!isLiked);
              if (!isLiked) {
                  // Send Like Notification Message
                  chatService.sendMessage(targetUser.id, {
                      id: Date.now().toString(),
                      senderId: 'me',
                      text: "❤️ Liked your profile",
                      timestamp: Date.now()
                  });
              }
              break;
          case 'block':
              if(confirm(`Block ${targetUser.username}? You won't see them on the grid.`)) {
                  soundService.play('trash');
                  setIsBlocked(true);
                  setTimeout(onClose, 1000);
              }
              break;
          case 'report':
              soundService.play('error');
              alert('Profile reported to moderation team for review.');
              break;
      }
  };

  const handlePostComment = () => {
      if (!newComment.trim()) return;
      soundService.play('send');
      setMediaComments([...mediaComments, { user: currentUser.username, text: newComment }]);
      setNewComment('');
  };

  return (
    <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
        
        {/* Main Modal Card */}
        <div className="w-full max-w-lg h-[85vh] bg-xs-dark rounded-[3rem] border border-white/10 shadow-4xl flex flex-col overflow-hidden relative preserve-3d">
            
            {/* Header / Banner Area */}
            <div className="relative h-48 shrink-0">
                <img 
                    src={targetUser.bannerUrl || photos[0]} 
                    className="w-full h-full object-cover opacity-60" 
                    alt="banner" 
                />
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-xs-dark"></div>
                
                <button onClick={onClose} className="absolute top-6 right-6 p-3 bg-black/40 backdrop-blur-md rounded-full text-white hover:bg-white/20 transition-all z-10 border border-white/10">
                    <ICONS.X size={20} />
                </button>

                <div className="absolute -bottom-10 left-8 flex items-end gap-4">
                    <div className="relative">
                        <div className="w-24 h-24 rounded-[2rem] p-1 bg-xs-dark shadow-2xl relative z-10 overflow-hidden group cursor-pointer" onClick={() => { setSelectedMedia(targetUser.avatar || targetUser.avatarUrl); setMediaType('image'); }}>
                            <img src={targetUser.avatar || targetUser.avatarUrl} className="w-full h-full object-cover rounded-[1.8rem]" alt="avatar" />
                        </div>
                        {/* Online Indicator Pulse */}
                        <div className={`absolute bottom-2 right-2 w-5 h-5 ${statusColor} rounded-full border-4 border-xs-dark z-20 flex items-center justify-center`}>
                            {status === 'online' && <div className="w-full h-full rounded-full bg-white animate-ping opacity-75"></div>}
                        </div>
                    </div>
                    <div className="pb-11">
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none flex items-center gap-2">
                            {targetUser.username}
                            {targetUser.isVerified && <ICONS.ShieldCheck size={18} className="text-xs-cyan" />}
                        </h2>
                        <div className="flex items-center gap-2 mt-1">
                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${statusColor} text-black`}>{status}</span>
                            <span className="text-[9px] font-mono text-gray-400 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded">{targetUser.distance || '0'}mi Away</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="mt-12 px-8 flex gap-3 shrink-0">
                {!isMe ? (
                    <>
                        <button onClick={() => handleAction('message')} className="flex-1 py-3 bg-xs-cyan text-black rounded-2xl font-black uppercase text-[10px] tracking-widest hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-lg shadow-xs-cyan/20">
                            <ICONS.MessageCircle size={16} /> Chat
                        </button>
                        <button onClick={() => handleAction('oink')} className="py-3 px-6 bg-xs-pink/10 border border-xs-pink/30 text-xs-pink rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-xs-pink hover:text-black transition-all flex items-center justify-center gap-2">
                            <span className="text-lg">🐷</span> Oink
                        </button>
                        <button onClick={() => handleAction('like')} className={`p-3 rounded-2xl border transition-all ${isLiked ? 'bg-red-500 border-red-500 text-white' : 'bg-white/5 border-white/10 text-gray-400 hover:text-red-500'}`}>
                            <ICONS.Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                        </button>
                        <div className="relative group">
                            <button className="p-3 bg-white/5 border border-white/10 rounded-2xl text-gray-400 hover:text-white transition-all h-full">
                                <ICONS.Menu size={20} />
                            </button>
                            <div className="absolute right-0 top-full mt-2 w-40 bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl opacity-0 group-hover:opacity-100 pointer-events-none group-hover:pointer-events-auto transition-opacity z-50">
                                <button onClick={() => handleAction('block')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-gray-400 hover:bg-white/10 hover:text-white flex items-center gap-2">
                                    <ICONS.UserX size={14} /> Block
                                </button>
                                <button onClick={() => handleAction('report')} className="w-full text-left px-4 py-3 text-[10px] font-black uppercase text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                                    <ICONS.Flag size={14} /> Report
                                </button>
                            </div>
                        </div>
                    </>
                ) : (
                    <button className="flex-1 py-3 bg-white/10 border border-white/10 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-white/20 transition-all flex items-center justify-center gap-2">
                        <ICONS.Edit3 size={16} /> Edit My Profile
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="px-8 mt-6 flex gap-6 border-b border-white/5 shrink-0">
                {['profile', 'photos', 'videos'].map(tab => (
                    <button 
                        key={tab}
                        onClick={() => { setActiveTab(tab as any); soundService.play('tab'); }}
                        className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? 'text-white' : 'text-gray-600 hover:text-gray-400'}`}
                    >
                        {tab}
                        {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-xs-cyan shadow-[0_0_10px_rgba(0,255,255,0.8)]"></div>}
                    </button>
                ))}
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar" ref={scrollRef}>
                
                {activeTab === 'profile' && (
                    <div className="space-y-8 animate-in slide-in-from-bottom-4">
                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black text-xs-purple uppercase tracking-[0.4em]">Manifesto</h3>
                            <p className="text-sm font-light italic text-gray-200 leading-relaxed">
                                "{targetUser.bio || "No bio transmitted yet."}"
                            </p>
                            <div className="flex flex-wrap gap-2 pt-2">
                                {(targetUser.tags || ['New_Node']).map((tag: string) => (
                                    <span key={tag} className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-gray-400 uppercase tracking-widest">#{tag}</span>
                                ))}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 mb-1 opacity-50"><ICONS.User size={14} /><span className="text-[8px] font-black uppercase tracking-widest">Age</span></div>
                                <p className="text-lg font-black italic">{targetUser.age}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 mb-1 opacity-50"><ICONS.Activity size={14} /><span className="text-[8px] font-black uppercase tracking-widest">Role</span></div>
                                <p className="text-lg font-black italic text-xs-purple">{targetUser.role || 'Unknown'}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 mb-1 opacity-50"><ICONS.Ruler size={14} /><span className="text-[8px] font-black uppercase tracking-widest">Height</span></div>
                                <p className="text-lg font-black italic">{targetUser.height || '---'}</p>
                            </div>
                            <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                <div className="flex items-center gap-2 mb-1 opacity-50"><ICONS.Home size={14} /><span className="text-[8px] font-black uppercase tracking-widest">Hosting</span></div>
                                <p className="text-lg font-black italic text-xs-yellow">{targetUser.hosting || 'No'}</p>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <h3 className="text-[9px] font-black text-xs-cyan uppercase tracking-[0.4em]">Details</h3>
                            <div className="space-y-2">
                                {targetUser.ethnicity && <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-[9px] text-gray-500 uppercase">Ethnicity</span><span className="text-[9px] text-white uppercase font-bold">{targetUser.ethnicity}</span></div>}
                                {targetUser.bodyType && <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-[9px] text-gray-500 uppercase">Body Type</span><span className="text-[9px] text-white uppercase font-bold">{targetUser.bodyType}</span></div>}
                                {targetUser.hivStatus && <div className="flex justify-between border-b border-white/5 pb-1"><span className="text-[9px] text-gray-500 uppercase">Status</span><span className="text-[9px] text-white uppercase font-bold">{targetUser.hivStatus}</span></div>}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'photos' && (
                    <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-4">
                        {photos.map((photo: string, i: number) => (
                            <div 
                                key={i} 
                                onClick={() => { setSelectedMedia(photo); setMediaType('image'); soundService.play('click'); }}
                                className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer"
                            >
                                <img src={photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={`gallery_${i}`} />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <ICONS.Eye size={24} className="text-white drop-shadow-lg" />
                                </div>
                            </div>
                        ))}
                        {photos.length === 0 && <p className="col-span-2 text-center text-[10px] text-gray-600 uppercase py-10">No visual data available.</p>}
                    </div>
                )}

                {activeTab === 'videos' && (
                    <div className="grid grid-cols-2 gap-3 animate-in slide-in-from-bottom-4">
                         {videos.map((vid: string, i: number) => (
                            <div 
                                key={i} 
                                onClick={() => { setSelectedMedia(vid); setMediaType('video'); soundService.play('click'); }}
                                className="aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 relative group cursor-pointer bg-black"
                            >
                                <video src={vid} className="w-full h-full object-cover opacity-80" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="p-3 bg-white/20 backdrop-blur-md rounded-full border border-white/20">
                                        <ICONS.Play size={20} className="text-white fill-white" />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {videos.length === 0 && <p className="col-span-2 text-center text-[10px] text-gray-600 uppercase py-10">No motion data available.</p>}
                    </div>
                )}
            </div>
        </div>

        {/* Media Lightbox Overlay */}
        {selectedMedia && (
            <div className="fixed inset-0 z-[160] bg-black/95 backdrop-blur-2xl flex flex-col md:flex-row animate-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
                
                {/* Media Content */}
                <div className="flex-1 flex items-center justify-center p-4 relative bg-black/40">
                    <button onClick={() => setSelectedMedia(null)} className="absolute top-4 left-4 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 z-50">
                        <ICONS.X size={24} />
                    </button>
                    
                    {mediaType === 'image' ? (
                        <img src={selectedMedia} className="max-w-full max-h-[85vh] rounded-[2rem] shadow-4xl border border-white/10 object-contain" alt="Selected" />
                    ) : (
                        <video src={selectedMedia} controls autoPlay className="max-w-full max-h-[85vh] rounded-[2rem] shadow-4xl border border-white/10" />
                    )}
                </div>

                {/* Interaction Panel */}
                <div className="w-full md:w-96 bg-xs-dark border-l border-white/10 flex flex-col">
                    <div className="p-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                        <div className="flex items-center gap-3">
                            <img src={targetUser.avatar || targetUser.avatarUrl} className="w-10 h-10 rounded-xl object-cover border border-white/10" alt="avatar" />
                            <div>
                                <p className="text-sm font-black text-white italic uppercase">{targetUser.username}</p>
                                <p className="text-[8px] text-gray-500 font-mono uppercase tracking-widest">Posted recently</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => { setMediaLiked(!mediaLiked); soundService.play(mediaLiked ? 'click' : 'pop'); }} 
                            className={`p-3 rounded-full transition-all ${mediaLiked ? 'text-red-500 bg-red-500/10' : 'text-gray-500 hover:text-white bg-white/5'}`}
                        >
                            <ICONS.Heart size={20} fill={mediaLiked ? "currentColor" : "none"} className={mediaLiked ? 'animate-bounce' : ''} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                        {mediaComments.length === 0 ? (
                            <p className="text-center text-[10px] text-gray-600 uppercase italic py-10">Neural silence... Be the first to resonate.</p>
                        ) : (
                            mediaComments.map((c, i) => (
                                <div key={i} className="flex gap-3 items-start animate-in fade-in slide-in-from-bottom-2">
                                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-white/10 to-transparent flex items-center justify-center text-[10px] font-black text-gray-400 border border-white/5">
                                        {c.user.charAt(0)}
                                    </div>
                                    <div>
                                        <p className="text-[9px] font-black text-xs-cyan uppercase tracking-widest mb-0.5">{c.user}</p>
                                        <p className="text-xs text-gray-300 font-light leading-relaxed">{c.text}</p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    <div className="p-4 border-t border-white/10 bg-black/40">
                        <div className="flex gap-2">
                            <input 
                                type="text" 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handlePostComment()}
                                placeholder="Add a comment..."
                                className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-xs-cyan transition-all"
                            />
                            <button 
                                onClick={handlePostComment}
                                disabled={!newComment.trim()}
                                className="p-3 bg-xs-cyan text-black rounded-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 disabled:scale-100"
                            >
                                <ICONS.Send size={16} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

export default UserProfileModal;
