
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card3D from '../components/Card3D';
import ShareMenu from '../components/ShareMenu';
import TopUpModal from '../components/TopUpModal';
import { 
  ICONS, 
  CATEGORIES,
  BODY_TYPES, 
  LOOKING_FOR_OPTIONS, 
  CUM_IN_ASS_OPTIONS, 
  CUM_IN_MOUTH_OPTIONS, 
  KINKS_OPTIONS,
  PRONOUNS_OPTIONS,
  DIET_OPTIONS,
  EDUCATION_OPTIONS,
  LIFESTYLE_OPTIONS,
  HAIR_COLORS,
  EYE_COLORS
} from '../constants';
import { User, SubscriptionTier, SexualRole, Ethnicity, RelationshipStatus, SexualPreference, HIVStatus } from '../types';
import { soundService } from '../services/soundService';
import { generateProfileBio } from '../services/geminiService';

interface ProfileProps {
  user: User;
  onUpdateUser: (data: Partial<User>) => void;
}

const SectionHeader = ({ icon: Icon, title, color = "white" }: { icon: any, title: string, color?: string }) => (
    <div className="flex items-center gap-3 mb-4 pl-1 opacity-80 group hover:opacity-100 transition-opacity">
        <div className={`p-1.5 rounded-lg bg-${color === 'white' ? 'white' : `xs-${color}`}/10 border border-${color === 'white' ? 'white' : `xs-${color}`}/20`}>
            <Icon size={12} className={color === 'white' ? 'text-gray-300' : `text-xs-${color}`} />
        </div>
        <span className="text-[9px] font-black text-gray-500 uppercase tracking-[0.4em] group-hover:text-white transition-colors">{title}</span>
        <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
    </div>
);

const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser }) => {
  const navigate = useNavigate();
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [scrollPos, setScrollPos] = useState(0);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isEnhancing, setIsEnhancing] = useState(false);

  const [editingField, setEditingField] = useState<{ key: keyof User; title: string; options: string[]; multi?: boolean } | null>(null);
  const [tempValue, setTempValue] = useState<any>(null);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);

  const AGE_OPTIONS = Array.from({ length: 82 }, (_, i) => (i + 18).toString());

  useEffect(() => {
    const handleScroll = () => setScrollPos(window.scrollY);
    const handleMouseMove = (e: MouseEvent) => {
        const x = (e.clientX / window.innerWidth - 0.5) * 2;
        const y = (e.clientY / window.innerHeight - 0.5) * 2;
        setMousePos({ x, y });
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    window.addEventListener('mousemove', handleMouseMove);
    return () => {
        window.removeEventListener('scroll', handleScroll);
        window.removeEventListener('mousemove', handleMouseMove);
    };
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, type: 'photo' | 'banner' | 'avatar') => {
    const file = e.target.files?.[0];
    if (!file) return;
    soundService.play('unlock');
    const reader = new FileReader();
    reader.onload = (event) => {
        const url = event.target?.result as string;
        if (type === 'photo') onUpdateUser({ photos: [...user.photos, url] });
        else if (type === 'banner') onUpdateUser({ bannerUrl: url });
        else if (type === 'avatar') onUpdateUser({ avatarUrl: url });
        soundService.play('success');
    };
    reader.readAsDataURL(file);
  };

  const openEdit = (key: keyof User, title: string, options: string[], multi: boolean = false) => {
    soundService.play('tab');
    setEditingField({ key, title, options, multi });
    setTempValue(user[key]);
  };

  const commitEdit = () => {
    if (editingField) {
      const finalValue = editingField.key === 'age' ? parseInt(tempValue) : tempValue;
      onUpdateUser({ [editingField.key]: finalValue });
      soundService.play('success');
      setEditingField(null);
    }
  };

  const handleAiEnhance = async () => {
    if (editingField?.key === 'bio') {
      soundService.play('unlock');
      setIsEnhancing(true);
      try {
        const enhanced = await generateProfileBio(user.tags, tempValue || '', 'flirty');
        setTempValue(enhanced);
        soundService.play('success');
      } catch (err) {
        soundService.play('error');
      } finally {
        setIsEnhancing(false);
      }
    }
  };

  const BentoTile = ({ 
      label, 
      value, 
      icon: Icon, 
      color = 'gray', 
      colSpan = 1,
      onClick 
  }: { 
      label: string, 
      value: string | number | undefined, 
      icon?: any, 
      color?: string, 
      colSpan?: number,
      onClick?: () => void
  }) => (
      <div 
        onClick={onClick}
        className={`group relative overflow-hidden rounded-[1.5rem] bg-white/5 border border-white/5 hover:border-white/20 hover:bg-white/10 transition-all cursor-pointer ${colSpan === 2 ? 'col-span-2' : 'col-span-1'} h-24 flex flex-col justify-between p-4`}
      >
          <div className="flex justify-between items-start">
              <span className="text-[7px] font-black uppercase tracking-widest text-gray-500 group-hover:text-white transition-colors">{label}</span>
              {Icon && <Icon size={12} className={`text-xs-${color} opacity-50 group-hover:opacity-100 group-hover:scale-110 transition-all`} />}
          </div>
          <div>
              <p className={`font-black uppercase italic tracking-tighter leading-none truncate ${colSpan === 2 ? 'text-2xl' : 'text-lg'} text-white`}>
                  {value || '---'}
              </p>
          </div>
          {/* Hover Glint */}
          <div className="absolute inset-0 bg-gradient-to-tr from-white/0 via-white/5 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
      </div>
  );

  const EditModal = () => {
    if (!editingField) return null;
    const isTextField = editingField.options.length === 0;

    return (
      <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setEditingField(null)}>
        <div className="w-full max-w-md bg-xs-dark border border-white/10 rounded-[2.5rem] p-8 shadow-4xl relative overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-xs-cyan/10 flex items-center justify-center border border-xs-cyan/20">
                      <ICONS.Edit2 size={18} className="text-xs-cyan" />
                  </div>
                  <div>
                      <h3 className="text-xl font-black text-white italic tracking-tighter uppercase">{editingField.title}</h3>
                      <p className="text-[9px] text-gray-500 font-mono tracking-widest">UPDATE_CORE_DATA</p>
                  </div>
              </div>
              <button onClick={() => setEditingField(null)} className="p-3 hover:bg-white/10 rounded-full transition-colors"><ICONS.X size={20} className="text-gray-500" /></button>
          </div>

          {isTextField ? (
              <div className="mb-8 relative group">
                 <textarea 
                    value={tempValue || ''}
                    onChange={(e) => setTempValue(e.target.value)}
                    className="w-full h-40 bg-black/40 border border-white/10 rounded-2xl p-6 text-white text-lg font-light italic outline-none focus:border-xs-cyan transition-all resize-none shadow-inner"
                    placeholder="Enter data..."
                    autoFocus
                 />
                 {editingField.key === 'bio' && (
                    <button 
                      onClick={handleAiEnhance}
                      disabled={isEnhancing}
                      className="absolute right-4 bottom-4 px-4 py-2 bg-xs-purple/20 border border-xs-purple/40 rounded-xl text-[8px] font-black text-xs-purple uppercase tracking-widest hover:bg-xs-purple hover:text-white transition-all flex items-center gap-2 disabled:opacity-50"
                    >
                      {isEnhancing ? <ICONS.RefreshCw size={10} className="animate-spin" /> : <ICONS.Sparkles size={10} />}
                      {isEnhancing ? 'Optimizing...' : 'AI Boost'}
                    </button>
                 )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 mb-8 h-64 overflow-y-auto pr-2 custom-scrollbar">
                {editingField.options.map((option) => {
                  const isSelected = editingField.multi 
                    ? (tempValue as string[] || []).includes(option) 
                    : tempValue?.toString() === option;
                  return (
                    <button
                      key={option}
                      onClick={() => {
                        soundService.play('pop');
                        if (editingField.multi) {
                          const current = (tempValue as string[] || []);
                          setTempValue(current.includes(option) ? current.filter(o => o !== option) : [...current, option]);
                        } else {
                          setTempValue(option);
                        }
                      }}
                      className={`py-4 px-4 rounded-xl border text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-between group ${
                        isSelected ? `bg-white text-black border-white shadow-lg scale-[1.02]` : 'bg-white/5 border-white/5 text-gray-500 hover:bg-white/10 hover:border-white/20'
                      }`}
                    >
                      {option}
                      {isSelected && <ICONS.CheckCircle size={12} className="text-black" />}
                    </button>
                  );
                })}
              </div>
            )}

            <button onClick={commitEdit} className="w-full py-5 bg-gradient-to-r from-xs-cyan to-xs-purple text-black rounded-2xl font-black text-sm uppercase tracking-[0.3em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all">
              Save Changes
            </button>
        </div>
      </div>
    );
  };

  return (
    <div className="relative">
      <EditModal />
      <ShareMenu isOpen={showShareMenu} onClose={() => setShowShareMenu(false)} title="Share Identity" />
      <TopUpModal isOpen={showTopUpModal} onClose={() => setShowTopUpModal(false)} onSuccess={(a) => onUpdateUser({ walletBalance: user.walletBalance + a })} currentBalance={user.walletBalance} />

      <input type="file" ref={photoInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'photo')} />
      <input type="file" ref={bannerInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'banner')} />
      <input type="file" ref={avatarInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'avatar')} />

      {/* IMMERSIVE HERO */}
      <div className="relative h-[45vh] w-full overflow-hidden group/header">
          <div className="absolute inset-0 bg-xs-black z-0">
              <img src={user.bannerUrl} className="w-full h-full object-cover opacity-60 group-hover/header:opacity-80 transition-opacity duration-1000" alt="Banner" />
              <div className="absolute inset-0 bg-gradient-to-t from-xs-black via-xs-black/40 to-transparent"></div>
          </div>
          
          {/* Holographic Overlay Controls */}
          <div className="absolute top-6 right-6 z-20 flex gap-3">
              <button onClick={() => bannerInputRef.current?.click()} className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/20 transition-all"><ICONS.Camera size={18} /></button>
              <button onClick={() => setShowShareMenu(true)} className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:text-xs-cyan transition-all"><ICONS.Share2 size={18} /></button>
              <button onClick={() => navigate('/settings')} className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:text-xs-pink transition-all"><ICONS.Settings size={18} /></button>
          </div>

          <div className="absolute bottom-0 left-0 w-full p-6 z-20 flex flex-col md:flex-row items-end md:items-center gap-6 translate-y-1/2 md:translate-y-1/3">
              <div className="relative group/avatar cursor-pointer" onClick={() => avatarInputRef.current?.click()}>
                  <div className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] border-4 border-xs-black overflow-hidden relative shadow-4xl bg-xs-dark">
                      <img src={user.avatarUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/avatar:opacity-100 flex items-center justify-center transition-all">
                          <ICONS.Camera size={32} className="text-white" />
                      </div>
                  </div>
                  {user.isVerified && (
                      <div className="absolute -bottom-2 -right-2 bg-xs-cyan text-black p-1.5 rounded-full border-4 border-xs-black" title="Verified">
                          <ICONS.ShieldCheck size={20} fill="currentColor" />
                      </div>
                  )}
              </div>
              
              <div className="flex-1 mb-12 md:mb-0">
                  <h1 className="text-4xl md:text-6xl font-black text-white italic tracking-tighter uppercase leading-none mb-2 drop-shadow-lg">{user.username}</h1>
                  <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-white/10 backdrop-blur-md border border-white/10 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-300">{user.category || 'NO_CAT'}</span>
                      <span className="px-3 py-1 bg-xs-purple/20 backdrop-blur-md border border-xs-purple/30 rounded-lg text-[9px] font-black uppercase tracking-widest text-xs-purple">{user.subscription}</span>
                  </div>
              </div>

              <div className="hidden md:flex flex-col items-end mb-12 gap-2">
                  <div className="text-right">
                      <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Grid_Balance</p>
                      <p className="text-3xl font-black text-white italic tracking-tighter">${user.walletBalance.toFixed(2)}</p>
                  </div>
                  <button onClick={() => setShowTopUpModal(true)} className="px-6 py-2 bg-xs-yellow text-black rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 transition-transform shadow-lg">Top Up</button>
              </div>
          </div>
      </div>

      <div className="mt-24 px-4 md:px-8 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* LEFT COLUMN: MANIFESTO & IDENTITY MATRIX */}
          <div className="lg:col-span-8 space-y-10">
              
              {/* Manifesto */}
              <section className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-xs-purple/20 to-xs-cyan/20 rounded-[2.5rem] blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
                  <div 
                    className="relative bg-xs-dark/80 backdrop-blur-xl border border-white/10 p-8 rounded-[2.5rem] shadow-2xl cursor-pointer"
                    onClick={() => openEdit('bio', 'Identity Manifesto', [], false)}
                  >
                      <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3 opacity-60">
                              <ICONS.Fingerprint size={20} className="text-xs-purple" />
                              <span className="text-[9px] font-black uppercase tracking-[0.4em] text-gray-400">Identity_Manifesto</span>
                          </div>
                          <ICONS.Edit3 size={16} className="text-gray-600 group-hover:text-white transition-colors" />
                      </div>
                      <p className="text-xl md:text-2xl text-gray-200 font-light italic leading-relaxed tracking-wide">
                          "{user.bio || 'No manifesto synced.'}"
                      </p>
                      <div className="mt-6 flex flex-wrap gap-2">
                          {user.tags.map(tag => (
                              <span key={tag} className="px-3 py-1 bg-black/40 border border-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-gray-400">#{tag}</span>
                          ))}
                      </div>
                  </div>
              </section>

              {/* BENTO GRID: VITALS */}
              <section>
                  <SectionHeader icon={ICONS.Activity} title="Biometrics" color="purple" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <BentoTile label="Age" value={user.age} onClick={() => openEdit('age', 'Temporal Sync', AGE_OPTIONS)} />
                      <BentoTile label="Height" value={user.height} onClick={() => openEdit('height', 'Verticality', ["5'5", "5'7", "5'9", "5'11", "6'1", "6'3"])} />
                      <BentoTile label="Weight" value={user.weight} onClick={() => openEdit('weight', 'Mass', ["130 lbs", "150 lbs", "170 lbs", "190 lbs", "210 lbs+"])} />
                      <BentoTile label="Morphology" value={user.bodyType} onClick={() => openEdit('bodyType', 'Physical Form', BODY_TYPES)} />
                  </div>
              </section>

              {/* BENTO GRID: SPECTRUM */}
              <section>
                  <SectionHeader icon={ICONS.Dna} title="Spectrum_Data" color="cyan" />
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <BentoTile label="Role" value={user.role} color="cyan" onClick={() => openEdit('role', 'Sexual Role', Object.values(SexualRole))} colSpan={2} />
                      <BentoTile label="Orientation" value={user.sexualPreference} color="cyan" onClick={() => openEdit('sexualPreference', 'Preference', Object.values(SexualPreference))} colSpan={2} />
                      <BentoTile label="Status" value={user.relationshipStatus} color="cyan" onClick={() => openEdit('relationshipStatus', 'Relational Status', Object.values(RelationshipStatus))} />
                      <BentoTile label="Safety" value={user.hivStatus} color="cyan" onClick={() => openEdit('hivStatus', 'Health Protocol', Object.values(HIVStatus))} />
                      <BentoTile label="Pronouns" value={user.pronouns} color="cyan" onClick={() => openEdit('pronouns', 'Address Protocol', PRONOUNS_OPTIONS)} />
                      <BentoTile label="Identity" value={user.category} color="cyan" onClick={() => openEdit('category', 'Tribe Identity', CATEGORIES)} />
                  </div>
              </section>

              {/* KINKS / TAGS - Stylized List */}
              <section>
                  <SectionHeader icon={ICONS.Flame} title="Neural_Kinks" color="pink" />
                  <div 
                    className="bg-white/5 border border-white/5 rounded-[2rem] p-6 flex flex-wrap gap-2 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => openEdit('kinks', 'Desire Matrix', KINKS_OPTIONS, true)}
                  >
                      {user.kinks && user.kinks.length > 0 ? (
                          user.kinks.map(kink => (
                              <div key={kink} className="px-4 py-2 bg-xs-pink/10 border border-xs-pink/20 rounded-xl text-[10px] font-black uppercase tracking-widest text-xs-pink hover:scale-105 transition-transform cursor-default">
                                  {kink}
                              </div>
                          ))
                      ) : (
                          <span className="text-gray-500 text-xs italic">Tap to calibrate desires...</span>
                      )}
                  </div>
              </section>

          </div>

          {/* RIGHT COLUMN: VISUALS & LIFESTYLE */}
          <div className="lg:col-span-4 space-y-10">
              
              {/* VISUAL VAULT */}
              <section>
                  <div className="flex justify-between items-center mb-4 pl-1">
                      <SectionHeader icon={ICONS.Camera} title="Visual_Vault" color="yellow" />
                      <button onClick={() => photoInputRef.current?.click()} className="p-2 bg-white/5 rounded-lg hover:bg-white/10 text-xs-yellow transition-colors"><ICONS.Plus size={16} /></button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                      {user.photos.map((photo, i) => (
                          <div key={i} className="aspect-[3/4] rounded-2xl overflow-hidden relative group border border-white/5">
                              <img src={photo} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/opacity-100 transition-opacity flex items-center justify-center gap-2">
                                  <button onClick={() => onUpdateUser({ photos: user.photos.filter((_, idx) => idx !== i) })} className="p-2 bg-white/10 rounded-full text-white hover:bg-red-500 hover:text-white transition-all"><ICONS.Trash2 size={14} /></button>
                              </div>
                          </div>
                      ))}
                      <button onClick={() => photoInputRef.current?.click()} className="aspect-[3/4] rounded-2xl border border-dashed border-white/20 flex flex-col items-center justify-center gap-2 text-gray-500 hover:text-white hover:border-white/40 hover:bg-white/5 transition-all">
                          <ICONS.Upload size={24} />
                          <span className="text-[8px] font-black uppercase tracking-widest">Upload</span>
                      </button>
                  </div>
              </section>

              {/* LIFESTYLE DATA */}
              <section>
                  <SectionHeader icon={ICONS.Coffee} title="Lifestyle" color="white" />
                  <div className="bg-white/5 border border-white/5 rounded-[2rem] p-2 space-y-1">
                      {[
                          { label: "Diet", val: user.diet, key: 'diet', opts: DIET_OPTIONS },
                          { label: "Smoke", val: user.smoking, key: 'smoking', opts: LIFESTYLE_OPTIONS },
                          { label: "Drink", val: user.drinking, key: 'drinking', opts: LIFESTYLE_OPTIONS },
                          { label: "Edu", val: user.education, key: 'education', opts: EDUCATION_OPTIONS },
                      ].map((item, i) => (
                          <div 
                            key={i} 
                            onClick={() => openEdit(item.key as keyof User, item.label, item.opts)}
                            className="flex justify-between items-center p-4 hover:bg-white/5 rounded-2xl cursor-pointer transition-colors group"
                          >
                              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-gray-300">{item.label}</span>
                              <span className="text-xs font-bold text-white text-right truncate max-w-[120px]">{item.val || '-'}</span>
                          </div>
                      ))}
                  </div>
              </section>

              {/* ACCOUNT ACTIONS */}
              <section className="pt-4 border-t border-white/5">
                  <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setShowTopUpModal(true)} className="p-4 bg-xs-yellow/10 border border-xs-yellow/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-xs-yellow/20 transition-all group">
                          <ICONS.Wallet size={20} className="text-xs-yellow group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-black text-xs-yellow uppercase tracking-widest">Wallet</span>
                      </button>
                      <button onClick={() => navigate('/subscription')} className="p-4 bg-xs-pink/10 border border-xs-pink/20 rounded-2xl flex flex-col items-center justify-center gap-2 hover:bg-xs-pink/20 transition-all group">
                          <ICONS.Zap size={20} className="text-xs-pink group-hover:scale-110 transition-transform" />
                          <span className="text-[8px] font-black text-xs-pink uppercase tracking-widest">Upgrade</span>
                      </button>
                  </div>
              </section>
          </div>
      </div>
    </div>
  );
};

export default Profile;
