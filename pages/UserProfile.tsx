
import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Card3D from '../components/Card3D';
import ShareMenu from '../components/ShareMenu';
import TransactionModal from '../components/TransactionModal';
import { 
    ICONS, 
    LOOKING_FOR_OPTIONS, 
    BODY_TYPES, 
    INTENT_OPTIONS, 
    ACTIVITY_OPTIONS, 
    PRONOUNS_OPTIONS,
    HAIR_COLORS,
    EYE_COLORS,
    DIET_OPTIONS,
    KIDS_OPTIONS
} from '../constants';
import { 
    User, 
    BodyHair, 
    FacialHair, 
    PowerDynamics, 
    HIVStatus, 
    SexualPreference, 
    CumPreference, 
    Ethnicity, 
    LifestyleChoice, 
    SexualRole, 
    SubscriptionTier,
    RelationshipStatus,
    EducationLevel
} from '../types';
import { soundService } from '../services/soundService';
import { generateProfileBio } from '../services/geminiService';

interface UserProfileProps {
  user?: User; 
  onUpdateUser: (data: Partial<User>) => void;
  onSignOut?: () => void;
}

const MediaGrid = ({ 
    photos, 
    videos, 
    isOwner, 
    isPremium, 
    onUploadPhoto, 
    onUploadVideo, 
    onRemovePhoto, 
    onRemoveVideo 
}: { 
    photos: string[], 
    videos: string[], 
    isOwner: boolean, 
    isPremium: boolean, 
    onUploadPhoto: () => void, 
    onUploadVideo: () => void, 
    onRemovePhoto: (i: number) => void, 
    onRemoveVideo: (i: number) => void 
}) => {
    const photoLimit = isPremium ? 999 : 5;
    const videoLimit = isPremium ? 5 : 1;
    
    return (
        <div className="space-y-6">
            <div>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-xs-cyan">
                        <ICONS.Camera size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Photos</span>
                    </div>
                    <span className="text-[9px] font-mono text-white">{photos.length} / {isPremium ? '∞' : photoLimit}</span>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
                    {photos.map((photo, i) => (
                        <div key={`p-${i}`} className="relative aspect-[3/4] rounded-xl overflow-hidden group border border-white/10 bg-black/40 shadow-lg hover:shadow-xs-cyan/20 transition-all">
                            <img src={photo} className="w-full h-full object-cover transition-transform group-hover:scale-110" alt={`img-${i}`} />
                            {isOwner && (
                                <button 
                                    onClick={() => onRemovePhoto(i)}
                                    className="absolute top-1 right-1 p-1.5 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                    <ICONS.Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    {isOwner && (photos.length < photoLimit || isPremium) && (
                        <button 
                            onClick={onUploadPhoto}
                            className="aspect-[3/4] rounded-xl border border-dashed border-xs-cyan/30 flex flex-col items-center justify-center gap-2 hover:bg-xs-cyan/10 transition-all group"
                        >
                            <div className="p-3 bg-xs-cyan/10 rounded-full group-hover:bg-xs-cyan/20 text-xs-cyan transition-colors">
                                <ICONS.Plus size={20} />
                            </div>
                            <span className="text-[8px] font-black uppercase text-xs-cyan tracking-widest">Add_Img</span>
                        </button>
                    )}
                </div>
            </div>

            <div>
                <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2 text-xs-purple">
                        <ICONS.Video size={16} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Videos</span>
                    </div>
                    <span className="text-[9px] font-mono text-white">{videos.length} / {videoLimit}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {videos.map((vid, i) => (
                        <div key={`v-${i}`} className="relative aspect-video rounded-xl overflow-hidden group border border-white/10 bg-black/40 shadow-lg hover:shadow-xs-purple/20 transition-all cursor-pointer">
                            <video 
                                src={vid} 
                                className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-300" 
                                muted
                                loop
                                playsInline
                                onMouseEnter={(e) => (e.target as HTMLVideoElement).play()}
                                onMouseLeave={(e) => { (e.target as HTMLVideoElement).pause(); (e.target as HTMLVideoElement).currentTime = 0; }}
                            />
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none group-hover:opacity-0 transition-opacity duration-300">
                                <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-lg animate-pulse">
                                    <ICONS.Play size={18} className="text-white fill-white ml-0.5" />
                                </div>
                            </div>
                            {isOwner && (
                                <button 
                                    onClick={() => onRemoveVideo(i)}
                                    className="absolute top-1 right-1 p-1.5 bg-red-500/80 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10"
                                >
                                    <ICONS.Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                    {isOwner && videos.length < videoLimit && (
                        <button 
                            onClick={onUploadVideo}
                            className="aspect-video rounded-xl border border-dashed border-xs-purple/30 flex flex-col items-center justify-center gap-2 hover:bg-xs-purple/10 transition-all group"
                        >
                            <div className="p-3 bg-xs-purple/10 rounded-full group-hover:bg-xs-purple/20 text-xs-purple transition-colors">
                                <ICONS.Plus size={20} />
                            </div>
                            <span className="text-[8px] font-black uppercase text-xs-purple tracking-widest">Add_Motion</span>
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default function UserProfile({ user, onUpdateUser, onSignOut }: UserProfileProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const member = location.state?.member;

  const isOwner = !member || member.id === user?.id;
  const isPremium = user?.subscription && user.subscription !== SubscriptionTier.FREE;

  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [isAnthemPlaying, setIsAnthemPlaying] = useState(false);
  const anthemAudioRef = useRef<HTMLAudioElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  
  // Expanded State for Comprehensive Editing
  const [editData, setEditData] = useState({
    username: member?.username || user?.username || '',
    age: member?.age || user?.age || 18,
    pronouns: member?.pronouns || user?.pronouns || 'He/Him',
    bio: member?.bio || user?.bio || '',
    tags: member?.tags || user?.tags || [],
    height: member?.height || user?.height || '',
    weight: member?.weight || user?.weight || '',
    bodyType: member?.bodyType || user?.bodyType || '',
    hairColor: member?.hairColor || user?.hairColor || '',
    eyeColor: member?.eyeColor || user?.eyeColor || '',
    endowment: member?.endowment || user?.endowment || '',
    dick: member?.dick || user?.dick || 'Cut',
    bodyHair: member?.bodyHair || user?.bodyHair || BodyHair.SOME_HAIR,
    facialHair: member?.facialHair || user?.facialHair || FacialHair.CLEAN,
    dynamics: member?.dynamics || user?.dynamics || PowerDynamics.NEUTRAL,
    hivStatus: member?.hivStatus || user?.hivStatus || HIVStatus.NO_RESPONSE,
    lastTested: member?.lastTested || user?.lastTested || '',
    sexualPreference: member?.sexualPreference || user?.sexualPreference || SexualPreference.NO_RESPONSE,
    cumInAss: member?.cumInAss || user?.cumInAss || CumPreference.DONT_CARE,
    cumInMouth: member?.cumInMouth || user?.cumInMouth || '',
    ethnicity: member?.ethnicity || user?.ethnicity || Ethnicity.NO_RESPONSE,
    smoking: member?.smoking || user?.smoking || LifestyleChoice.NEVER,
    drinking: member?.drinking || user?.drinking || LifestyleChoice.SOMETIMES,
    marijuana: member?.marijuana || user?.marijuana || LifestyleChoice.NO_RESPONSE,
    relationshipStatus: member?.relationshipStatus || user?.relationshipStatus || RelationshipStatus.NO_RESPONSE,
    education: member?.education || user?.education || EducationLevel.NO_RESPONSE,
    occupation: member?.occupation || user?.occupation || '',
    diet: member?.diet || user?.diet || '',
    kids: member?.kids || user?.kids || '',
    intent: member?.intent || user?.intent || [],
    lookingFor: member?.lookingFor || user?.lookingFor || [],
    activities: member?.activities || user?.activities || [],
    hosting: member?.hosting || user?.hosting || 'Negotiable',
    role: member?.role || user?.role || SexualRole.VERSE,
    photos: member?.photos || user?.photos || [],
    videos: member?.videos || user?.videos || []
  });

  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    const handleScroll = (e: any) => {
        const target = e.target;
        if (target) setScrollPos(target.scrollTop);
    };
    const container = document.querySelector('.overflow-y-auto');
    container?.addEventListener('scroll', handleScroll, { passive: true });
    return () => container?.removeEventListener('scroll', handleScroll);
  }, []);

  if (!member && !user) return null; 
  const targetUser = member || user; 
  if (!targetUser) return null;

  const displayData = isOwner ? editData : {
      ...targetUser,
      photos: targetUser.photos || [targetUser.avatarUrl],
      videos: targetUser.videos || [],
      intent: targetUser.intent || [],
      lookingFor: targetUser.lookingFor || [],
      activities: targetUser.activities || [],
      tags: targetUser.tags || [],
      pronouns: targetUser.pronouns || 'He/Him'
  };

  const handleAiEnhance = async () => {
    setIsEnhancing(true);
    soundService.play('unlock');
    try {
        const enhanced = await generateProfileBio(editData.tags, editData.bio, 'flirty');
        setEditData({ ...editData, bio: enhanced });
        soundService.play('success');
    } catch (err) {
        soundService.play('error');
    } finally {
        setIsEnhancing(false);
    }
  };

  const handleSaveProfile = () => {
    onUpdateUser(editData as any);
    setIsEditingProfile(false);
    soundService.play('success');
  };

  const handleCancelEdit = () => {
    setIsEditingProfile(false);
    soundService.play('lock');
  };

  const addTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!editData.tags.includes(tagInput.trim())) {
        setEditData({ ...editData, tags: [...editData.tags, tagInput.trim()] });
        soundService.play('pop');
      }
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
      setEditData({ ...editData, tags: editData.tags.filter(t => t !== tag) });
      soundService.play('trash');
  };

  const toggleList = (item: string, field: 'intent' | 'lookingFor' | 'activities') => {
      soundService.play('click');
      const list = editData[field];
      if (list.includes(item)) setEditData({ ...editData, [field]: list.filter(i => i !== item) });
      else setEditData({ ...editData, [field]: [...list, item] });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          setEditData(prev => ({ ...prev, photos: [...prev.photos, reader.result as string] }));
          soundService.play('success');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };

  const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onloadend = () => {
          setEditData(prev => ({ ...prev, videos: [...prev.videos, reader.result as string] }));
          soundService.play('success');
      };
      reader.readAsDataURL(file);
      e.target.value = '';
  };

  const handleRemovePhoto = (index: number) => setEditData(prev => ({ ...prev, photos: prev.photos.filter((_, i) => i !== index) }));
  const handleRemoveVideo = (index: number) => setEditData(prev => ({ ...prev, videos: prev.videos.filter((_, i) => i !== index) }));

  // Enhanced Colorful StatField Component
  const StatField = ({ 
      icon: Icon, 
      label, 
      value, 
      color = 'cyan', 
      fieldName, 
      options,
      fullWidth = false 
  }: { 
      icon: any, label: string, value: any, color?: string, fieldName?: keyof typeof editData, options?: string[], fullWidth?: boolean 
  }) => (
    <div className={`relative group p-4 rounded-2xl border transition-all duration-300 backdrop-blur-sm
        ${isEditingProfile 
            ? 'bg-black/80 border-white/20' 
            : `bg-xs-${color}/5 border-xs-${color}/20 hover:bg-xs-${color}/10 hover:border-xs-${color}/60 hover:shadow-[0_0_15px_rgba(var(--${color}-rgb),0.15)]`
        }
        ${fullWidth ? 'col-span-2' : ''}
    `}>
        <div className="flex justify-between items-start mb-2">
            <div className={`p-2 rounded-lg bg-xs-${color}/10 text-xs-${color} mb-1 shadow-inner`}>
                <Icon size={16} />
            </div>
            <p className={`text-[8px] font-black uppercase tracking-widest transition-colors ${isEditingProfile ? 'text-gray-400' : `text-xs-${color}/60 group-hover:text-xs-${color}`}`}>
                {label}
            </p>
        </div>
        
        {isEditingProfile && fieldName ? (
            options ? (
                <select 
                    value={editData[fieldName] as string}
                    onChange={(e) => setEditData({ ...editData, [fieldName]: e.target.value })}
                    className="w-full bg-transparent text-white font-bold text-sm outline-none border-b border-white/20 focus:border-xs-cyan py-1 appearance-none"
                >
                    <option value="" className="bg-black text-gray-500">Select...</option>
                    {options.map((opt: string) => <option key={opt} value={opt} className="bg-black">{opt}</option>)}
                </select>
            ) : (
                <input 
                    type="text"
                    value={editData[fieldName] as string}
                    onChange={(e) => setEditData({ ...editData, [fieldName]: e.target.value })}
                    className="w-full bg-transparent text-white font-bold text-sm outline-none border-b border-white/20 focus:border-xs-cyan py-1"
                />
            )
        ) : (
            <p className="text-white font-bold text-sm truncate leading-tight">
                {Array.isArray(value) ? value.join(', ') : (value || <span className="text-gray-600 italic text-xs">Unspecified</span>)}
            </p>
        )}
    </div>
  );

  return (
    <div className="relative preserve-3d">
      <ShareMenu isOpen={showShareMenu} onClose={() => setShowShareMenu(false)} title={`Persona: ${displayData.username}`} />
      <TransactionModal isOpen={showTransferModal} onClose={() => setShowTransferModal(false)} onConfirm={(a) => alert(`Sent ${a}`)} recipientName={displayData.username} recipientAvatar={targetUser.avatarUrl} currentBalance={100} />
      <audio ref={anthemAudioRef} src={targetUser.videoIntroUrl} onEnded={() => setIsAnthemPlaying(false)} className="hidden" />

      {/* Header Banner */}
      <div className="relative h-64 overflow-hidden group/banner preserve-3d cursor-pointer rounded-b-[3rem] shadow-4xl mb-6">
          <div className="absolute inset-0">
              <img src={targetUser.bannerUrl || 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2070&auto=format&fit=crop'} className="w-full h-full object-cover opacity-60" alt="Banner" />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-xs-black via-xs-black/40 to-transparent"></div>
          
          <div className="absolute top-6 left-6 right-6 z-40 flex justify-between items-center">
              <button onClick={() => navigate(-1)} className="p-2.5 glass-panel rounded-xl text-white border-white/20"><ICONS.ArrowLeft size={18} /></button>
              <div className="flex gap-2">
                  {isOwner && (
                    <button 
                        onClick={() => { isEditingProfile ? handleSaveProfile() : setIsEditingProfile(true); soundService.play('unlock'); }} 
                        className={`px-4 py-2.5 rounded-xl transition-all border font-black uppercase text-[10px] tracking-widest flex items-center gap-2 ${isEditingProfile ? 'bg-xs-cyan text-black border-xs-cyan shadow-[0_0_20px_rgba(0,255,255,0.4)]' : 'glass-panel text-white border-white/20'}`}
                    >
                      {isEditingProfile ? <ICONS.Check size={14} /> : <ICONS.Edit3 size={14} />}
                      {isEditingProfile ? 'SAVE_SYNC' : 'EDIT_ID'}
                    </button>
                  )}
                  {isOwner && onSignOut && (
                    <button onClick={() => { soundService.play('lock'); onSignOut(); }} className="p-2.5 glass-panel rounded-xl text-red-500 border-red-500/20 hover:bg-red-500/10">
                        <ICONS.LogOut size={16} />
                    </button>
                  )}
              </div>
          </div>

          <div className="absolute bottom-6 left-6 right-6 flex items-end gap-5 z-20">
              <div className="relative shrink-0 group cursor-pointer">
                  <div className="w-24 h-24 rounded-[2rem] p-1 bg-black/50 backdrop-blur-md border border-white/10 shadow-2xl overflow-hidden relative z-10">
                      <img 
                        src={targetUser.avatarUrl} 
                        className="w-full h-full object-cover rounded-[1.8rem] transition-transform duration-700 ease-out group-hover:scale-110 group-hover:rotate-6" 
                        alt="Avatar" 
                      />
                      <div className="absolute inset-0 bg-gradient-to-tr from-white/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
              </div>
              <div className="pb-2">
                  <h1 className="text-3xl font-black text-white italic tracking-tighter uppercase leading-none mb-1 flex items-center gap-2">
                      {isEditingProfile ? (
                          <input 
                            value={editData.username} 
                            onChange={e => setEditData({...editData, username: e.target.value})} 
                            className="bg-transparent border-b border-white/20 outline-none w-48 focus:border-xs-cyan" 
                          />
                      ) : displayData.username}
                      {isPremium && <ICONS.Star size={16} className="text-xs-yellow animate-spin-slow" />}
                  </h1>
                  <div className="flex items-center gap-2">
                      {isEditingProfile ? (
                          <input type="number" value={editData.age} onChange={e => setEditData({...editData, age: parseInt(e.target.value)})} className="w-12 bg-black/40 text-white text-[9px] rounded px-1" />
                      ) : (
                          <span className="text-[9px] font-black uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded text-white">{displayData.age}</span>
                      )}
                      <span className="text-[9px] font-black uppercase tracking-widest bg-xs-purple/20 text-xs-purple border border-xs-purple/30 px-2 py-0.5 rounded">{displayData.role || 'Verify'}</span>
                  </div>
              </div>
          </div>
      </div>

      <div className="px-4 pb-32 space-y-8 max-w-5xl mx-auto relative z-10 mt-6">
          
          {/* Identity & Manifesto (Purple Theme) */}
          <section className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-xs-purple/50"></div>
                  <h3 className="text-xl font-black italic text-xs-purple uppercase tracking-tighter flex items-center gap-2">
                      <ICONS.Fingerprint size={20} /> Identity_Matrix
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-xs-purple/50"></div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card3D className="min-h-[220px]" innerClassName="p-6 bg-gradient-to-br from-black/80 to-xs-purple/5 border-white/5 flex flex-col justify-between" glowColor="purple">
                      <div className="flex justify-between items-start mb-2">
                          <h3 className="text-[10px] font-black text-xs-purple uppercase tracking-[0.4em]">Manifesto</h3>
                          {isEditingProfile && (
                              <button onClick={handleAiEnhance} disabled={isEnhancing} className="text-xs-cyan hover:text-white transition-colors">
                                  {isEnhancing ? <ICONS.RefreshCw className="animate-spin" size={14} /> : <ICONS.Sparkles size={14} />}
                              </button>
                          )}
                      </div>
                      {isEditingProfile ? (
                          <textarea 
                            value={editData.bio} 
                            onChange={e => setEditData({...editData, bio: e.target.value})} 
                            className="w-full h-24 bg-black/40 border border-white/10 rounded-xl p-3 text-white text-sm font-light italic outline-none resize-none focus:border-xs-purple"
                            placeholder="Write your signal..."
                          />
                      ) : (
                          <p className="text-sm font-light italic text-gray-200 leading-relaxed">"{displayData.bio}"</p>
                      )}
                      <div className="flex flex-wrap gap-2 mt-4">
                          {displayData.tags.map((tag: string) => (
                              <span key={tag} className="px-2 py-1 bg-xs-purple/10 border border-xs-purple/20 rounded-lg text-[8px] font-black text-gray-300 uppercase tracking-widest flex items-center gap-1">
                                  #{tag}
                                  {isEditingProfile && <button onClick={() => removeTag(tag)} className="text-red-500 hover:text-white"><ICONS.X size={8}/></button>}
                              </span>
                          ))}
                          {isEditingProfile && (
                              <input 
                                type="text" 
                                value={tagInput}
                                onChange={e => setTagInput(e.target.value)}
                                onKeyDown={addTag}
                                placeholder="+TAG" 
                                className="px-2 py-1 bg-white/5 border border-white/10 rounded-lg text-[8px] font-black text-white uppercase w-16 outline-none focus:border-xs-purple"
                              />
                          )}
                      </div>
                  </Card3D>

                  <div className="grid grid-cols-2 gap-3">
                      <StatField icon={ICONS.Fingerprint} label="Pronouns" value={displayData.pronouns} fieldName="pronouns" options={PRONOUNS_OPTIONS} color="purple" />
                      <StatField icon={ICONS.Briefcase} label="Occupation" value={displayData.occupation} fieldName="occupation" color="purple" />
                      <StatField icon={ICONS.MapPin} label="Location" value={user?.location?.name || "Unknown"} color="gray" />
                      <StatField icon={ICONS.GraduationCap} label="Education" value={displayData.education} fieldName="education" options={Object.values(EducationLevel)} color="purple" />
                      <StatField icon={ICONS.Heart} label="Status" value={displayData.relationshipStatus} fieldName="relationshipStatus" options={Object.values(RelationshipStatus)} color="purple" />
                  </div>
              </div>
          </section>

          {/* Physical Stats (Cyan Theme) */}
          <section className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-xs-cyan/50"></div>
                  <h3 className="text-xl font-black italic text-xs-cyan uppercase tracking-tighter flex items-center gap-2">
                      <ICONS.Activity size={20} /> Physical_Specs
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-xs-cyan/50"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatField icon={ICONS.Ruler} label="Height" value={displayData.height} fieldName="height" color="cyan" />
                  <StatField icon={ICONS.Activity} label="Weight" value={displayData.weight} fieldName="weight" color="cyan" />
                  <StatField icon={ICONS.User} label="Body Type" value={displayData.bodyType} fieldName="bodyType" options={BODY_TYPES} color="cyan" />
                  <StatField icon={ICONS.Globe} label="Ethnicity" value={displayData.ethnicity} fieldName="ethnicity" options={Object.values(Ethnicity)} color="cyan" />
                  <StatField icon={ICONS.User} label="Hair" value={displayData.hairColor} fieldName="hairColor" options={HAIR_COLORS} color="cyan" />
                  <StatField icon={ICONS.Eye} label="Eyes" value={displayData.eyeColor} fieldName="eyeColor" options={EYE_COLORS} color="cyan" />
                  <StatField icon={ICONS.Droplet} label="Body Hair" value={displayData.bodyHair} fieldName="bodyHair" options={Object.values(BodyHair)} color="cyan" />
                  <StatField icon={ICONS.Scissors} label="Grooming" value={displayData.facialHair} fieldName="facialHair" options={Object.values(FacialHair)} color="cyan" />
              </div>
          </section>

          {/* Sexual Profile (Pink Theme) */}
          <section className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-xs-pink/50"></div>
                  <h3 className="text-xl font-black italic text-xs-pink uppercase tracking-tighter flex items-center gap-2">
                      <ICONS.Flame size={20} /> Sexual_Protocol
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-xs-pink/50"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatField icon={ICONS.Target} label="Role" value={displayData.role} fieldName="role" options={Object.values(SexualRole)} color="pink" />
                  <StatField icon={ICONS.Zap} label="Endowment" value={displayData.endowment} fieldName="endowment" options={['Average', 'Large', 'Extra Large', 'Elite']} color="pink" />
                  <StatField icon={ICONS.Scissors} label="Dick" value={displayData.dick} fieldName="dick" options={['Cut', 'Uncut']} color="pink" />
                  <StatField icon={ICONS.Activity} label="Dynamics" value={displayData.dynamics} fieldName="dynamics" options={Object.values(PowerDynamics)} color="pink" />
                  <StatField icon={ICONS.ShieldCheck} label="HIV Status" value={displayData.hivStatus} fieldName="hivStatus" options={Object.values(HIVStatus)} color="pink" />
                  <StatField icon={ICONS.Calendar} label="Last Tested" value={displayData.lastTested} fieldName="lastTested" color="pink" />
                  <StatField icon={ICONS.Lock} label="Protection" value={displayData.sexualPreference} fieldName="sexualPreference" options={Object.values(SexualPreference)} color="pink" />
                  <StatField icon={ICONS.Droplets} label="Cum (Ass)" value={displayData.cumInAss} fieldName="cumInAss" options={Object.values(CumPreference)} color="pink" />
                  <StatField icon={ICONS.Droplet} label="Cum (Mouth)" value={displayData.cumInMouth} fieldName="cumInMouth" options={['Swallow', 'Spit', 'Gargle', 'No']} color="pink" />
                  <StatField icon={ICONS.Home} label="Hosting" value={displayData.hosting} fieldName="hosting" options={['Yes', 'No', 'Negotiable', 'Traveling']} color="pink" />
              </div>
          </section>

          {/* Lifestyle (Yellow Theme) */}
          <section className="space-y-4">
              <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-gradient-to-r from-transparent to-xs-yellow/50"></div>
                  <h3 className="text-xl font-black italic text-xs-yellow uppercase tracking-tighter flex items-center gap-2">
                      <ICONS.Coffee size={20} /> Lifestyle_Sync
                  </h3>
                  <div className="h-px flex-1 bg-gradient-to-l from-transparent to-xs-yellow/50"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <StatField icon={ICONS.Cigarette} label="Smoking" value={displayData.smoking} fieldName="smoking" options={Object.values(LifestyleChoice)} color="yellow" />
                  <StatField icon={ICONS.Wine} label="Drinking" value={displayData.drinking} fieldName="drinking" options={Object.values(LifestyleChoice)} color="yellow" />
                  <StatField icon={ICONS.Leaf} label="420" value={displayData.marijuana} fieldName="marijuana" options={Object.values(LifestyleChoice)} color="yellow" />
                  <StatField icon={ICONS.Leaf} label="Diet" value={displayData.diet} fieldName="diet" options={DIET_OPTIONS} color="yellow" />
                  <StatField icon={ICONS.Baby} label="Kids" value={displayData.kids} fieldName="kids" options={KIDS_OPTIONS} color="yellow" />
              </div>
          </section>

          {/* Directives & Interests - Mixed Theme */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-xs-dark/60 border border-white/5 rounded-[2rem] p-6 h-full">
                  <div className="flex items-center gap-2 mb-4">
                      <ICONS.Target size={18} className="text-xs-purple" />
                      <h3 className="text-[12px] font-black text-xs-purple uppercase tracking-[0.4em]">Directives</h3>
                  </div>
                  <div className="space-y-6">
                      <div>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Intent</span>
                          <div className="flex flex-wrap gap-2">
                              {isEditingProfile ? INTENT_OPTIONS.map(opt => (
                                  <button key={opt} onClick={() => toggleList(opt, 'intent')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${editData.intent.includes(opt) ? 'bg-xs-yellow text-black border-xs-yellow' : 'bg-white/5 text-gray-500 border-white/10'}`}>{opt}</button>
                              )) : displayData.intent.map((i: string) => <span key={i} className="px-3 py-1.5 bg-xs-yellow/10 border border-xs-yellow/20 rounded-xl text-[9px] font-black text-white uppercase">{i}</span>)}
                          </div>
                      </div>
                      <div>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Looking For</span>
                          <div className="flex flex-wrap gap-2">
                              {isEditingProfile ? LOOKING_FOR_OPTIONS.map(opt => (
                                  <button key={opt} onClick={() => toggleList(opt, 'lookingFor')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${editData.lookingFor.includes(opt) ? 'bg-xs-purple text-white border-xs-purple' : 'bg-white/5 text-gray-500 border-white/10'}`}>{opt}</button>
                              )) : displayData.lookingFor.map((i: string) => <span key={i} className="px-3 py-1.5 bg-xs-purple/10 border border-xs-purple/20 rounded-xl text-[9px] font-black text-white uppercase">{i}</span>)}
                          </div>
                      </div>
                  </div>
              </div>

              <div className="bg-xs-dark/60 border border-white/5 rounded-[2rem] p-6 h-full">
                  <div className="flex items-center gap-2 mb-4">
                      <ICONS.Zap size={18} className="text-xs-pink" />
                      <h3 className="text-[12px] font-black text-xs-pink uppercase tracking-[0.4em]">Interests</h3>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest block mb-2">Activities</span>
                          <div className="flex flex-wrap gap-2">
                              {isEditingProfile ? ACTIVITY_OPTIONS.map(opt => (
                                  <button key={opt} onClick={() => toggleList(opt, 'activities')} className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border transition-all ${editData.activities.includes(opt) ? 'bg-xs-pink text-white border-xs-pink' : 'bg-white/5 text-gray-500 border-white/10'}`}>{opt}</button>
                              )) : displayData.activities.map((i: string) => <span key={i} className="px-3 py-1.5 bg-xs-pink/10 border border-xs-pink/20 rounded-xl text-[9px] font-black text-white uppercase">{i}</span>)}
                          </div>
                      </div>
                  </div>
              </div>
          </div>

          {/* Visuals */}
          <div className="bg-black/40 border border-white/5 rounded-[2rem] p-6 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-xs-cyan/5 to-xs-purple/5 pointer-events-none"></div>
              <div className="flex items-center gap-3 mb-6 relative z-10">
                  <ICONS.Camera size={18} className="text-white" />
                  <h3 className="text-[10px] font-black text-white uppercase tracking-[0.8em]">VAULT_VISUALS</h3>
              </div>
              
              <MediaGrid 
                  photos={displayData.photos}
                  videos={displayData.videos}
                  isOwner={isOwner}
                  isPremium={isPremium}
                  onUploadPhoto={() => photoInputRef.current?.click()}
                  onUploadVideo={() => videoInputRef.current?.click()}
                  onRemovePhoto={handleRemovePhoto}
                  onRemoveVideo={handleRemoveVideo}
              />
              
              <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={handlePhotoUpload} />
              <input type="file" ref={videoInputRef} className="hidden" accept="video/*" onChange={handleVideoUpload} />
          </div>

          {/* Sticky Edit Footer Actions */}
          {isEditingProfile && (
            <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 flex gap-3 animate-in slide-in-from-bottom-10 duration-500 w-full max-w-sm px-4">
                <button onClick={handleCancelEdit} className="flex-1 py-4 bg-black/90 backdrop-blur-xl border border-white/20 text-gray-400 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-2xl hover:bg-white/10">Discard</button>
                <button onClick={handleSaveProfile} className="flex-[2] py-4 bg-xs-cyan text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-[0_0_30px_rgba(0,255,255,0.4)] hover:scale-105 active:scale-95 transition-all">Commit Sync</button>
            </div>
          )}
      </div>
    </div>
  );
}
