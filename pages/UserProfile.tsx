
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card3D from '../components/Card3D';
import ShareMenu from '../components/ShareMenu';
import TransactionModal from '../components/TransactionModal';
import { ICONS, LOOKING_FOR_OPTIONS, BODY_TYPES, KINKS_OPTIONS } from '../constants';
import { User } from '../types';
import { soundService } from '../services/soundService';
import { generateProfileBio } from '../services/geminiService';

interface UserProfileProps {
  user?: User; // The current logged-in user
  onUpdateUser: (data: Partial<User>) => void;
}

const NeuralNode: React.FC<{ delay?: number; size?: number; color?: string }> = ({ size = 4, color = 'cyan' }) => {
  const [pos] = useState({ x: Math.random() * 100, y: Math.random() * 100 });
  const [drift, setDrift] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleGlobalMouse = (e: MouseEvent) => {
      const nodeX = (pos.x / 100) * window.innerWidth;
      const nodeY = (pos.y / 100) * window.innerHeight;
      const dist = Math.sqrt((e.clientX - nodeX)**2 + (e.clientY - nodeY)**2);
      
      if (dist < 250) {
        const angle = Math.atan2(nodeY - e.clientY, nodeX - e.clientX);
        const force = (250 - dist) / 8;
        setDrift({ x: Math.cos(angle) * force, y: Math.sin(angle) * force });
      } else {
        setDrift(d => ({ x: d.x * 0.95, y: d.y * 0.95 }));
      }
    };
    window.addEventListener('mousemove', handleGlobalMouse);
    return () => window.removeEventListener('mousemove', handleGlobalMouse);
  }, [pos]);

  return (
    <div 
      className={`absolute rounded-full blur-[1px] opacity-40 pointer-events-none bg-xs-${color} transition-transform duration-75 ease-out`}
      style={{ 
        width: size, 
        height: size, 
        left: `${pos.x}%`, 
        top: `${pos.y}%`,
        transform: `translate(${drift.x}px, ${drift.y}px) translateZ(${size * 15}px)`,
        boxShadow: `0 0 15px var(--xs-${color})`
      }}
    />
  );
};

const IdentityHalo = ({ color = 'cyan', mousePos, scrollPos }: { color?: string, mousePos: { x: number, y: number }, scrollPos: number }) => (
    <div className="absolute inset-[-120px] pointer-events-none opacity-50 z-0 preserve-3d transition-transform duration-1000 ease-out" 
         style={{ transform: `rotateY(${mousePos.x * 1.5}deg) rotateX(${-mousePos.y * 1.5}deg) translateZ(-60px)` }}>
        <div className={`absolute inset-0 border-[3px] border-xs-${color} rounded-full animate-spin-slow opacity-10`} style={{ animationDuration: '25s' }}></div>
        <div className={`absolute inset-12 border-dashed border border-xs-${color} rounded-full animate-spin opacity-30`} style={{ animationDuration: '15s', animationDirection: 'reverse' }}></div>
        <div className={`absolute inset-24 border border-xs-${color}/20 rounded-full animate-pulse transition-transform duration-500`} 
             style={{ transform: `translateZ(${80 + scrollPos * 0.05}px)` }}></div>
    </div>
);

const PhotoGallery = ({ photos }: { photos: string[] }) => {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [touchStartX, setTouchStartX] = useState<number | null>(null);
    const [touchCurrentX, setTouchCurrentX] = useState<number | null>(null);
    const minSwipeDistance = 50;

    const handleTouchStart = (e: React.TouchEvent) => setTouchStartX(e.touches[0].clientX);
    const handleTouchMove = (e: React.TouchEvent) => setTouchCurrentX(e.touches[0].clientX);
    const handleTouchEnd = () => {
        if (!touchStartX || !touchCurrentX) return;
        const distance = touchStartX - touchCurrentX;
        if (distance > minSwipeDistance && currentIndex < photos.length - 1) {
            soundService.play('tab');
            setCurrentIndex(currentIndex + 1);
        } else if (distance < -minSwipeDistance && currentIndex > 0) {
            soundService.play('tab');
            setCurrentIndex(currentIndex - 1);
        }
        setTouchStartX(null); setTouchCurrentX(null);
    };

    return (
        <div className="relative w-full overflow-visible py-8 preserve-3d">
            <div className="relative flex items-center justify-center h-[340px] md:h-[440px] touch-none preserve-3d" onTouchStart={handleTouchStart} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
                {photos.map((photo, i) => {
                    const offset = i - currentIndex;
                    const isActive = offset === 0;
                    return (
                        <div key={`gallery-${i}`} className="absolute w-[220px] h-[320px] md:w-[320px] md:h-[440px] transition-all duration-1000 cubic-bezier(0.23, 1, 0.32, 1) cursor-pointer preserve-3d"
                            style={{
                                transform: `translateX(${offset * 90}%) translateZ(${isActive ? 120 : -150}px) rotateY(${offset * -35}deg) scale(${isActive ? 1.02 : 0.85})`,
                                opacity: Math.abs(offset) > 2 ? 0 : (isActive ? 1 : 0.4),
                                zIndex: 10 - Math.abs(offset),
                                pointerEvents: Math.abs(offset) > 2 ? 'none' : 'auto',
                            }}
                            onClick={() => { if (offset !== 0) { soundService.play('click'); setCurrentIndex(i); } }}
                        >
                            <Card3D className="w-full h-full" innerClassName="p-0 rounded-[2.5rem] overflow-hidden border-white/20 shadow-4xl" glowColor={isActive ? (i % 2 === 0 ? 'cyan' : 'purple') : 'none'} hoverZ={50}>
                                <img src={photo} className="w-full h-full object-cover" alt={`Asset ${i}`} />
                            </Card3D>
                        </div>
                    );
                })}
            </div>
            <div className="flex justify-center items-center gap-2.5 mt-8">
                {photos.map((_, i) => (
                    <button key={i} onClick={() => { soundService.play('pop'); setCurrentIndex(i); }} className={`h-1 rounded-full transition-all duration-700 ${i === currentIndex ? 'w-8 bg-xs-cyan shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'w-1 bg-white/10'}`} />
                ))}
            </div>
        </div>
    );
};

const EditableIndicator = ({ className = "" }) => (
    <div className={`flex items-center gap-1.5 px-2 py-0.5 bg-white/5 backdrop-blur-3xl rounded-md border border-white/5 transition-all group-hover:bg-xs-cyan group-hover:text-black group-hover:border-xs-cyan opacity-40 group-hover:opacity-100 animate-pulse ${className}`}>
        <ICONS.Pencil size={8} />
        <span className="text-[7px] font-black uppercase tracking-widest">EDIT</span>
    </div>
);

export default function UserProfile({ user, onUpdateUser }: UserProfileProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const member = location.state?.member;

  const isOwner = member?.id === user?.id;

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isAnthemPlaying, setIsAnthemPlaying] = useState(false);
  const anthemAudioRef = useRef<HTMLAudioElement>(null);

  const [isEditingBio, setIsEditingBio] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [localBio, setLocalBio] = useState(member?.bio || (isOwner ? user?.bio : '') || '');

  useEffect(() => {
    const handleScroll = () => setScrollPos(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        setMousePos({ x: x * 15, y: y * 15 });
        document.documentElement.style.setProperty('--user-mx', `${e.clientX}px`);
        document.documentElement.style.setProperty('--user-my', `${e.clientY}px`);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  if (!member) return null;

  const extendedProfile = {
      ...member,
      bio: localBio || member.bio || "Synthesizing frequencies in the metropolitan grid.",
      tags: member.tags || ["Tech", "Gym", "Cyber"],
      photos: member.photos || [member.avatar || 'https://picsum.photos/600/800?random=401'],
      anthemUrl: member.anthemUrl || 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
  };

  const handleAiEnhance = async () => {
    setIsEnhancing(true);
    soundService.play('unlock');
    try {
        const enhanced = await generateProfileBio(extendedProfile.tags, localBio, 'flirty');
        setLocalBio(enhanced);
        soundService.play('success');
    } catch (err) {
        console.error("AI Enhancement failed:", err);
        soundService.play('error');
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleSaveBio = () => {
    onUpdateUser({ bio: localBio });
    setIsEditingBio(false);
    soundService.play('success');
  };

  const ProfileStatView = ({ icon: Icon, label, value, color = 'cyan' }: { icon: any, label: string, value: any, color?: string }) => (
    <Card3D 
        className={`h-32 group/stat transition-all ${isOwner ? 'cursor-pointer hover:border-white/20' : ''}`} 
        innerClassName="p-5 flex flex-col justify-between" 
        glowColor={color as any} 
        hoverZ={40}
        onClick={() => { if (isOwner) { soundService.play('click'); navigate('/profile'); } }}
    >
        <div className="flex items-center gap-2.5">
            <Icon size={14} className="text-white/40" />
            <p className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{label}</p>
        </div>
        <div>
            <p className="text-white font-black text-sm uppercase italic tracking-tighter leading-tight truncate">
                {Array.isArray(value) ? value.join(', ') : (value || 'NULL')}
            </p>
            {isOwner && <EditableIndicator className="mt-2" />}
        </div>
    </Card3D>
  );

  return (
    <div className="relative preserve-3d overflow-x-hidden">
      <style>{`
        .neural-editable::after {
          content: ''; position: absolute; inset: 0; pointer-events: none;
          border: 1px dashed rgba(0, 255, 255, 0.1); border-radius: inherit;
          transition: all 0.3s ease;
        }
        .neural-editable:hover::after { border-color: rgba(0,255,255,0.6); background: rgba(0, 255, 255, 0.02); }
        .structural-grid { background-image: linear-gradient(rgba(0, 255, 255, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.05) 1px, transparent 1px); background-size: 40px 40px; pointer-events: none; }
        .spatial-glare { background: radial-gradient(circle at var(--user-mx) var(--user-my), rgba(255,255,255,0.2) 0%, transparent 45%); mix-blend-mode: overlay; }
        @keyframes profile-float { 0%, 100% { transform: translateZ(80px) translateY(0); } 50% { transform: translateZ(110px) translateY(-10px); } }
      `}</style>
      
      <ShareMenu isOpen={showShareMenu} onClose={() => setShowShareMenu(false)} title={`Broadcast Persona: ${member.username}`} />
      <TransactionModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} onConfirm={(a) => alert(`Sent ${a}`)} recipientName={extendedProfile.username} recipientAvatar={extendedProfile.avatar} currentBalance={100} />
      <audio ref={anthemAudioRef} src={extendedProfile.anthemUrl} onEnded={() => setIsAnthemPlaying(false)} className="hidden" />

      {/* Banner & Header */}
      <div className="relative h-[30vh] md:h-[40vh] overflow-hidden group/banner preserve-3d cursor-pointer">
          <div className="absolute inset-[-20%] transition-transform duration-500 ease-out transform-gpu" 
               style={{ 
                 transform: `translateX(${mousePos.x * -1.5}px) translateY(${scrollPos * 0.15 + mousePos.y * -1.5}px) translateZ(${scrollPos * -0.05}px) rotateY(${mousePos.x * 0.04}deg) rotateX(${mousePos.y * -0.04}deg) scale(1.25)` 
               }}>
              <img src={extendedProfile.bannerUrl || member.bannerUrl} className="w-full h-full object-cover opacity-70 group-hover/banner:opacity-90 transition-opacity duration-1000" alt="Banner" />
              <div className="absolute inset-0 spatial-glare opacity-0 group-hover/banner:opacity-100 transition-opacity duration-500"></div>
          </div>
          
          <div className="absolute inset-[-25%] structural-grid z-10 opacity-30 pointer-events-none transition-transform duration-500 ease-out transform-gpu" 
               style={{ 
                 transform: `translateX(${mousePos.x * 3}px) translateY(${scrollPos * 0.35 + mousePos.y * 3}px) translateZ(80px) rotateX(${15 + scrollPos * 0.01 + mousePos.y * 0.05}deg) rotateY(${mousePos.x * -0.05}deg)` 
               }}></div>
          
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-xs-black/40 to-xs-black"></div>
          
          <div className="absolute top-6 left-6 right-6 z-40 flex justify-between items-center transition-transform duration-500" style={{ transform: `translateZ(150px) translateX(${mousePos.x * 0.5}px)` }}>
              <button onClick={() => navigate(-1)} className="p-3 glass-panel rounded-2xl text-white hover:text-xs-cyan transition-all border-white/20 shadow-4xl hover:scale-110"><ICONS.ArrowLeft size={18} /></button>
              <div className="flex gap-2.5">
                  <button onClick={() => setIsAnthemPlaying(!isAnthemPlaying)} className={`p-3 glass-panel rounded-2xl transition-all border-white/20 shadow-4xl hover:scale-110 ${isAnthemPlaying ? 'text-xs-cyan border-xs-cyan/60' : 'text-white'}`}>
                    {isAnthemPlaying ? <ICONS.Volume2 size={18} className="animate-pulse" /> : <ICONS.Music size={18} />}
                  </button>
                  <button onClick={() => setShowShareMenu(true)} className="p-3 glass-panel rounded-2xl text-white hover:text-xs-cyan transition-all border-white/20 shadow-4xl hover:scale-110"><ICONS.Share2 size={18} /></button>
              </div>
          </div>
      </div>

      <div className="relative -mt-20 md:-mt-24 flex flex-col items-center z-20 px-4 preserve-3d">
          <div className="preserve-3d transition-transform duration-500 ease-out" 
               style={{ transform: `rotateY(${mousePos.x * 1.8}deg) rotateX(${-mousePos.y * 1.8}deg) translateY(${scrollPos * -0.08}px)`, animation: 'profile-float 6s ease-in-out infinite' }}>
                <IdentityHalo color={member.isVerified ? 'cyan' : 'purple'} mousePos={mousePos} scrollPos={scrollPos} />
                <Card3D variant="circle" className="w-36 h-36 md:w-44 md:h-44" innerClassName="p-0 border-[6px] border-xs-black shadow-[0_40px_100px_rgba(0,0,0,1)]" glowColor="cyan" hoverZ={180}>
                    <img src={member.avatar} className="w-full h-full object-cover rounded-full" alt="Avatar" />
                </Card3D>
          </div>
          <div className="text-center mt-8 space-y-3">
              <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter uppercase italic leading-none drop-shadow-4xl transition-transform duration-500" style={{ transform: `translateZ(50px) translateX(${mousePos.x * 0.2}px)` }}>{member.username}</h1>
              <div className="flex flex-wrap items-center justify-center gap-3">
                  <div className="bg-xs-purple/20 border border-xs-purple/50 px-5 py-1.5 rounded-full text-[10px] font-black uppercase text-xs-purple shadow-lg backdrop-blur-md">AGE {member.age}</div>
                  <div className="bg-white/5 border border-white/10 px-5 py-1.5 rounded-full text-[10px] font-black uppercase text-gray-400 shadow-lg backdrop-blur-md">{member.role}</div>
              </div>
          </div>
      </div>

      <div className="px-6 space-y-16 max-w-5xl mx-auto mt-12 relative z-10 preserve-3d">
          <div className="space-y-8">
              <div className="flex items-center gap-4 px-6">
                <ICONS.Rocket size={18} className="text-xs-purple animate-pulse" />
                <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.8em]">IDENTITY_MANIFESTO</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-xs-purple/30 to-transparent"></div>
              </div>
              <div className={`bg-xs-dark/40 p-10 rounded-[2.5rem] border border-white/10 shadow-4xl backdrop-blur-[40px] relative group overflow-hidden transition-all duration-700 ${isOwner ? 'neural-editable cursor-pointer' : ''}`}>
                  <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-xs-purple to-xs-pink"></div>
                  
                  {isEditingBio ? (
                    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                        <div className="relative group/bioinput">
                            <textarea 
                                value={localBio}
                                onChange={(e) => setLocalBio(e.target.value)}
                                placeholder="Syncing your frequency..."
                                className="w-full h-40 bg-black/60 border border-white/10 rounded-[2rem] p-8 text-white text-xl font-light italic leading-relaxed outline-none focus:border-xs-purple/60 transition-all resize-none shadow-inner"
                            />
                            <button 
                                onClick={handleAiEnhance}
                                disabled={isEnhancing}
                                className="absolute right-6 bottom-6 px-6 py-2.5 bg-xs-purple/20 border border-xs-purple/40 rounded-2xl text-[10px] font-black text-xs-purple uppercase tracking-[0.2em] hover:bg-xs-purple hover:text-white transition-all flex items-center gap-3 disabled:opacity-50 shadow-xl group/ai"
                            >
                                {isEnhancing ? <ICONS.RefreshCw size={14} className="animate-spin" /> : <ICONS.Sparkles size={14} />}
                                {isEnhancing ? 'Syncing...' : 'AI Enhance'}
                            </button>
                        </div>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => { setIsEditingBio(false); setLocalBio(extendedProfile.bio); }} className="px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors">Discard</button>
                            <button onClick={handleSaveBio} className="px-8 py-3 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-4xl hover:scale-105 active:scale-95 transition-all">Commit Sync</button>
                        </div>
                    </div>
                  ) : (
                    <>
                        <div className="relative">
                          <p className="text-xl md:text-2xl text-gray-100 leading-relaxed italic font-light tracking-wide mb-8">"{localBio}"</p>
                          {isOwner && <EditableIndicator className="absolute -top-4 -right-4" />}
                        </div>
                        <div className="flex flex-wrap gap-2.5 items-center">
                            {extendedProfile.tags.map(tag => <div key={tag} className="px-3 py-1 bg-xs-purple/10 border border-xs-purple/30 rounded-xl text-[8px] font-black text-white uppercase transition-all hover:scale-110">#{tag}</div>)}
                            {isOwner && (
                                <button 
                                    onClick={() => { setIsEditingBio(true); soundService.play('unlock'); }}
                                    className="ml-auto p-3 bg-white/5 border border-white/10 rounded-xl text-gray-500 hover:text-xs-purple transition-all group/edit"
                                >
                                    <ICONS.Pencil size={14} />
                                </button>
                            )}
                        </div>
                    </>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <ProfileStatView icon={ICONS.Ruler} label="Verticality" value={member.height} />
              <ProfileStatView icon={ICONS.Activity} label="Morphology" value={member.bodyType} color="purple" />
              <ProfileStatView icon={ICONS.Heart} label="Relational" value={member.relationshipStatus} color="pink" />
              <ProfileStatView icon={ICONS.MapPin} label="Zone" value={member.location || member.distance + 'mi'} color="yellow" />
          </div>

          <div className="space-y-8">
              <div className="flex items-center gap-4 px-6">
                <ICONS.Camera size={18} className="text-gray-500" />
                <h3 className="text-[10px] font-black text-gray-600 uppercase tracking-[0.8em]">VAULT_VISUALS</h3>
                <div className="h-px flex-1 bg-gradient-to-r from-gray-500/30 to-transparent"></div>
              </div>
              <div className="p-6 md:p-10 rounded-[3rem] border border-white/10 bg-xs-dark/40 backdrop-blur-[60px]">
                  <PhotoGallery photos={extendedProfile.photos} />
              </div>
          </div>
      </div>
    </div>
  );
}
