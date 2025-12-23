
import React, { useState, useEffect } from 'react';
import Card3D from '../components/Card3D';
import { ICONS, CATEGORIES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { SexualRole } from '../types';
import { soundService } from '../services/soundService';

// Mock Data Generator for Members
const generateMockMembers = (count: number) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `m-${i}`,
    username: `User_${Math.floor(Math.random() * 10000)}`,
    age: Math.floor(Math.random() * 40) + 18,
    role: ['Top', 'Bottom', 'Verse', 'Side'][Math.floor(Math.random() * 4)],
    distance: (Math.random() * 50).toFixed(1), // Mock distance in miles
    location: ['Downtown', 'West Side', 'Chelsea', 'SoHo', 'The Village', 'East End', 'Uptown'][Math.floor(Math.random() * 7)],
    avatar: `https://picsum.photos/300/300?random=${i + 200}`,
    isOnline: Math.random() > 0.7,
    isVerified: Math.random() > 0.8,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)]
  }));
};

// Generate 100 mock members
const ALL_MEMBERS = generateMockMembers(100);

const CATEGORY_COLORS: Record<string, string> = {
  "Bear": "from-orange-500/40 to-amber-900/60",
  "Twink": "from-xs-pink/40 to-purple-900/60",
  "Otter": "from-emerald-500/40 to-teal-900/60",
  "Jock": "from-xs-cyan/40 to-blue-900/60",
  "Leather": "from-gray-600/40 to-black/60",
  "Queer": "from-xs-purple/40 to-violet-900/60",
  "Trans": "from-sky-400/40 to-pink-400/40",
  "Daddy": "from-indigo-500/40 to-slate-900/60",
  "Black": "from-zinc-700/40 to-black",
  "White": "from-slate-200/20 to-slate-500/40"
};

const ROLE_COLORS: Record<string, string> = {
    "Top": "border-xs-purple text-xs-purple bg-xs-purple/10",
    "Bottom": "border-xs-pink text-xs-pink bg-xs-pink/10",
    "Verse": "border-xs-cyan text-xs-cyan bg-xs-cyan/10",
    "Side": "border-xs-yellow text-xs-yellow bg-xs-yellow/10",
    "Verse Top": "border-xs-purple/50 text-xs-purple bg-xs-purple/5",
    "Verse Bottom": "border-xs-pink/50 text-xs-pink bg-xs-pink/5"
};

const Members: React.FC = () => {
  const navigate = useNavigate();
  
  // View State
  const [displayLimit, setDisplayLimit] = useState(20);
  const [members, setMembers] = useState(ALL_MEMBERS);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Settings / Filter State
  const [filters, setFilters] = useState({
      onlineOnly: false,
      verifiedOnly: false,
      gridSize: 'compact' as 'compact' | 'large',
      sortBy: 'distance' as 'distance' | 'newest',
      selectedRoles: [] as string[]
  });

  // Apply filters logic
  const filteredMembers = members.filter(m => {
      if (searchQuery && !m.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (selectedCategory && m.category !== selectedCategory) return false;
      if (filters.onlineOnly && !m.isOnline) return false;
      if (filters.verifiedOnly && !m.isVerified) return false;
      if (filters.selectedRoles.length > 0 && !filters.selectedRoles.includes(m.role)) return false;
      return true;
  });

  const visibleMembers = filteredMembers.slice(0, displayLimit);
  const hasMore = displayLimit < filteredMembers.length;

  const handleBoostClick = () => {
    soundService.play('click');
    setShowPaymentModal(true);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    soundService.play('typing');
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    setCardNumber(value.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    soundService.play('typing');
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiry(value);
  };

  const handlePaymentSubmit = (method: 'card' | 'wallet' = 'card') => {
    if (method === 'card') {
        if (!cardNumber || !expiry || !cvc || !cardName) {
            soundService.play('error');
            alert("Please fill in all card details.");
            return;
        }
    }

    setProcessingPayment(true);
    soundService.play('send');

    setTimeout(() => {
        setProcessingPayment(false);
        setShowPaymentModal(false);
        setDisplayLimit(prev => prev + 10);
        soundService.play('success');
        setCardName('');
        setCardNumber('');
        setExpiry('');
        setCvc('');
    }, 2000);
  };

  const toggleRoleFilter = (role: string) => {
      soundService.play('click');
      setFilters(prev => {
          const newRoles = prev.selectedRoles.includes(role)
            ? prev.selectedRoles.filter(r => r !== role)
            : [...prev.selectedRoles, role];
          return { ...prev, selectedRoles: newRoles };
      });
  };

  const handleCategorySelect = (cat: string) => {
    soundService.play('tab');
    setSelectedCategory(selectedCategory === cat ? null : cat);
  };

  return (
    <div className="pb-24 space-y-6 relative">
      <style>{`
        .category-tile {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .category-tile:active {
            transform: scale(0.9);
        }
        .scrollbar-hide::-webkit-scrollbar {
            display: none;
        }
        .scrollbar-hide {
            -ms-overflow-style: none;
            scrollbar-width: none;
        }
      `}</style>
      
      <header className="flex justify-between items-center px-1">
        <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
              <span className="bg-xs-cyan p-1.5 rounded-lg text-black shadow-[0_0_15px_rgba(0,255,255,0.4)]"><ICONS.Globe size={20} /></span>
              Grid_Sync
            </h1>
        </div>
        
        <div className="flex gap-3">
            <button onClick={handleBoostClick} className="p-3 bg-xs-yellow/10 border border-xs-yellow/30 text-xs-yellow rounded-2xl hover:bg-xs-yellow/20 transition-all">
                <ICONS.Zap size={22} fill="currentColor" />
            </button>
            <button 
                onClick={() => { soundService.play('click'); setShowSettings(true); }}
                className="bg-white/5 p-3 rounded-2xl hover:bg-white/10 border border-white/10 text-gray-400"
            >
                <ICONS.Settings size={22} />
            </button>
        </div>
      </header>

      {/* NEW: Vibrant Category Tiles */}
      <div className="space-y-3">
          <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Spectrum_Filters</span>
              {selectedCategory && (
                  <button onClick={() => setSelectedCategory(null)} className="text-[9px] font-black text-xs-pink uppercase tracking-widest flex items-center gap-1">
                      <ICONS.X size={10} /> Clear
                  </button>
              )}
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide px-1">
            {CATEGORIES.map(cat => {
                const isActive = selectedCategory === cat;
                return (
                    <button 
                        key={cat}
                        onClick={() => handleCategorySelect(cat)}
                        className={`category-tile flex-shrink-0 group relative w-24 h-24 rounded-[1.8rem] overflow-hidden border-2 transition-all ${isActive ? 'border-white scale-110 shadow-2xl z-10' : 'border-white/5 opacity-70 hover:opacity-100 hover:scale-105'}`}
                    >
                        <div className={`absolute inset-0 bg-gradient-to-br ${CATEGORY_COLORS[cat] || 'from-gray-500 to-gray-800'}`}></div>
                        {/* Static Identity Icon overlay (simulated) */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center p-2">
                            <span className={`text-[9px] font-black uppercase tracking-tighter text-white drop-shadow-md transition-transform duration-500 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`}>
                                {cat}
                            </span>
                            {isActive && <div className="mt-1 w-1 h-1 bg-white rounded-full animate-ping"></div>}
                        </div>
                        {/* Glass edge highlight */}
                        <div className="absolute inset-0 border border-white/10 rounded-[1.7rem] pointer-events-none"></div>
                    </button>
                );
            })}
          </div>
      </div>

      {/* Search Bar Refined */}
      <div className="relative px-1">
        <ICONS.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
            type="text" 
            placeholder="Search identity identifiers..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); soundService.play('typing'); }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white focus:border-xs-cyan outline-none transition-all placeholder-gray-600 text-sm font-black italic tracking-wide"
        />
      </div>

      {/* Status Hub & Roles */}
      <div className="space-y-4 px-1">
        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => { soundService.play('click'); setFilters(prev => ({...prev, onlineOnly: !prev.onlineOnly})); }}
                className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all flex items-center justify-center gap-3 ${filters.onlineOnly ? 'bg-green-500 border-green-500 text-black shadow-[0_0_20px_rgba(34,197,94,0.4)]' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
            >
                <div className={`w-2.5 h-2.5 rounded-full ${filters.onlineOnly ? 'bg-black animate-pulse' : 'bg-gray-600'}`}></div>
                Sync_Online
            </button>
            <button 
                onClick={() => { soundService.play('click'); setFilters(prev => ({...prev, verifiedOnly: !prev.verifiedOnly})); }}
                className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border-2 transition-all flex items-center justify-center gap-3 ${filters.verifiedOnly ? 'bg-xs-cyan border-xs-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.4)]' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/20'}`}
            >
                <ICONS.ShieldCheck size={16} />
                Verified_Only
            </button>
        </div>

        {/* Roles Refined Tiles */}
        <div className="flex gap-2 overflow-x-auto pb-4 scrollbar-hide">
            {Object.values(SexualRole).filter(r => r !== 'No Response').map(role => {
                const isActive = filters.selectedRoles.includes(role);
                const colorStyles = ROLE_COLORS[role] || "border-white/10 text-gray-400 bg-white/5";
                return (
                    <button 
                        key={role}
                        onClick={() => toggleRoleFilter(role)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 whitespace-nowrap transition-all ${isActive ? 'bg-white border-white text-black shadow-xl scale-105' : `${colorStyles} opacity-80 hover:opacity-100`}`}
                    >
                        {role}
                    </button>
                );
            })}
        </div>
      </div>

      {/* Grid Display */}
      <div className={`grid gap-3 transition-all duration-500 px-1 ${filters.gridSize === 'compact' ? 'grid-cols-3 md:grid-cols-5 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-4 lg:grid-cols-5'}`}>
        {visibleMembers.map((member, idx) => (
            <Card3D 
                key={member.id} 
                className={`cursor-pointer group relative ${filters.gridSize === 'compact' ? 'h-40' : 'h-64'}`}
                innerClassName="p-0 border-white/10" 
                glowColor={member.isOnline ? 'cyan' : 'none'}
                hoverZ={60}
                onClick={() => {
                    soundService.play('click');
                    navigate(`/user/${member.id}`, { state: { member } });
                }}
            >
                <div className="w-full h-full relative overflow-hidden">
                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-125" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    
                    {/* Activity Indicator */}
                    <div className="absolute top-2 right-2 flex gap-1.5 items-center">
                        {member.isOnline && (
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black shadow-[0_0_10px_rgba(0,255,0,0.8)] animate-pulse"></div>
                        )}
                        {member.isVerified && <ICONS.ShieldCheck size={14} className="text-xs-cyan drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" />}
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className={`font-black text-white italic tracking-tighter leading-none mb-1 group-hover:text-xs-cyan transition-colors ${filters.gridSize === 'compact' ? 'text-xs' : 'text-xl'}`}>
                            {member.username}
                        </h3>
                        <div className="flex items-center gap-2">
                             <span className="text-[8px] font-black text-xs-purple/80 uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded-lg border border-xs-purple/20">{member.role}</span>
                             <span className="text-[8px] font-black text-xs-cyan/80 uppercase tracking-widest bg-black/40 px-1.5 py-0.5 rounded-lg border border-xs-cyan/20">{member.distance}mi</span>
                        </div>
                    </div>
                </div>
            </Card3D>
        ))}
      </div>

      {visibleMembers.length === 0 && (
          <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-dashed border-white/10 mx-1">
              <ICONS.UserX size={48} className="mx-auto text-gray-600 mb-4 opacity-30" />
              <p className="text-gray-500 font-black uppercase tracking-[0.2em] italic">No_Neural_Match_Found</p>
              <button 
                onClick={() => {
                    soundService.play('click');
                    setFilters({ onlineOnly: false, verifiedOnly: false, gridSize: 'compact', sortBy: 'distance', selectedRoles: [] });
                    setSearchQuery('');
                    setSelectedCategory(null);
                }}
                className="mt-4 px-8 py-3 bg-xs-pink text-black font-black uppercase tracking-widest rounded-xl hover:scale-105 transition-transform"
              >
                  Reset Grid
              </button>
          </div>
      )}

      {hasMore && visibleMembers.length > 0 && (
        <div className="mt-12 relative px-1">
            <div className="absolute -top-20 left-0 right-0 p-6 flex justify-center z-20">
                <Card3D 
                    className="w-full max-w-sm mx-auto" 
                    glowColor="pink"
                    innerClassName="p-8 flex flex-col items-center text-center bg-black/80 backdrop-blur-3xl border-xs-pink/30"
                >
                    <div className="w-16 h-16 bg-xs-yellow rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,249,0,0.6)] animate-bounce">
                        <ICONS.Rocket size={36} className="text-black" />
                    </div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Grid Expansion</h3>
                    <p className="text-gray-500 text-xs mb-8 font-medium leading-relaxed">
                        Neural limits reached for this cycle. <br/> Upgrade core to see more members.
                    </p>
                    
                    <button 
                        onClick={handleBoostClick}
                        className="w-full py-5 bg-gradient-to-r from-xs-yellow via-xs-pink to-xs-purple text-black font-black text-lg rounded-2xl shadow-4xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        <ICONS.Zap size={24} fill="currentColor" />
                        Boost Sync $1.50
                    </button>
                </Card3D>
            </div>
            <div className="h-64"></div>
        </div>
      )}

      {/* Payment Modal Refined */}
      {showPaymentModal && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowPaymentModal(false)}>
              <div 
                className="w-full max-w-md bg-xs-dark border border-white/10 rounded-[3rem] p-8 relative animate-in zoom-in-95 duration-300 shadow-4xl"
                onClick={e => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center mb-8">
                      <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                          <ICONS.CreditCard size={32} className="text-xs-yellow" /> Sync_Secure
                      </h3>
                      <button onClick={() => setShowPaymentModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500"><ICONS.X size={24} /></button>
                  </div>

                  <div className="mb-10 p-6 bg-gradient-to-tr from-xs-purple/20 via-black to-xs-cyan/20 border border-white/10 rounded-[2rem] flex justify-between items-center shadow-xl relative overflow-hidden">
                      <div className="relative z-10">
                          <p className="text-white font-black uppercase tracking-widest italic">Expansion Pack</p>
                          <p className="text-[10px] text-gray-500 font-mono">FRAG_COUNT: 10_NODES</p>
                      </div>
                      <p className="text-4xl font-black text-white italic tracking-tighter">$1.50</p>
                  </div>

                  <div className="space-y-6">
                      <section className="space-y-4">
                          <div className="space-y-4">
                              <div className="space-y-2 px-1">
                                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Node_Owner</label>
                                  <input 
                                    type="text" placeholder="IDENTITY NAME" value={cardName}
                                    onChange={e => { setCardName(e.target.value); soundService.play('typing'); }}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-xs-pink outline-none font-black italic transition-all placeholder-gray-800"
                                  />
                              </div>
                              <div className="space-y-2 px-1">
                                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Credit_String</label>
                                  <div className="relative">
                                    <ICONS.CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-700" size={20} />
                                    <input 
                                        type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
                                        value={cardNumber} onChange={handleCardNumberChange} maxLength={19}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl pl-16 pr-6 py-4 text-white focus:border-xs-pink outline-none font-mono transition-all placeholder-gray-800"
                                    />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 px-1">
                                  <div className="space-y-2">
                                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">EXP</label>
                                      <input 
                                        type="text" inputMode="numeric" placeholder="MM/YY"
                                        value={expiry} onChange={handleExpiryChange} maxLength={5}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-xs-pink outline-none text-center transition-all placeholder-gray-800"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">CVC</label>
                                      <input 
                                        type="text" inputMode="numeric" placeholder="000"
                                        value={cvc} onChange={e => { setCvc(e.target.value.replace(/\D/g, '').slice(0, 4)); soundService.play('typing'); }}
                                        maxLength={4}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-xs-pink outline-none text-center transition-all placeholder-gray-800"
                                      />
                                  </div>
                              </div>
                          </div>

                          <button 
                            onClick={() => handlePaymentSubmit('card')}
                            disabled={processingPayment}
                            className="w-full py-6 bg-gradient-to-r from-xs-purple via-xs-cyan to-xs-pink rounded-[1.8rem] font-black text-black text-xl uppercase tracking-[0.3em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
                          >
                              {processingPayment ? 'Processing_Sync...' : 'Commit Sync'}
                          </button>
                      </section>
                  </div>
                  
                  <p className="text-center text-[10px] text-gray-600 mt-8 font-mono flex items-center justify-center gap-3">
                      <ICONS.ShieldCheck size={14} className="text-green-500" /> SECURED BY ENCRYPTED_VAULT_PROTOCOL_V4
                  </p>
              </div>
          </div>
      )}

      {/* Settings Modal Refined */}
      {showSettings && (
          <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-xl flex items-center justify-center p-6 animate-in fade-in duration-300" onClick={() => setShowSettings(false)}>
              <div 
                className="bg-xs-dark border border-white/10 w-full max-w-md rounded-[3rem] p-10 shadow-4xl relative animate-in zoom-in-95 duration-300"
                onClick={(e) => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center mb-10 border-b border-white/10 pb-6">
                      <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase flex items-center gap-4">
                          <ICONS.Settings size={32} className="text-xs-pink animate-spin-slow" /> 
                          Matrix_Config
                      </h2>
                      <button onClick={() => setShowSettings(false)} className="p-3 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
                          <ICONS.X size={24} className="text-gray-400" />
                      </button>
                  </div>

                  <div className="space-y-10 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                      <section>
                          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-6">Grid_Architecture</h3>
                          <div className="flex bg-black/60 p-2 rounded-[1.8rem] border border-white/10">
                              <button 
                                onClick={() => { soundService.play('click'); setFilters(prev => ({ ...prev, gridSize: 'compact' })); }}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${filters.gridSize === 'compact' ? 'bg-xs-cyan text-black shadow-[0_0_20px_rgba(0,255,255,0.4)]' : 'text-gray-500 hover:text-white'}`}
                              >
                                  Compact
                              </button>
                              <button 
                                onClick={() => { soundService.play('click'); setFilters(prev => ({ ...prev, gridSize: 'large' })); }}
                                className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-3 transition-all ${filters.gridSize === 'large' ? 'bg-xs-purple text-white shadow-[0_0_20px_rgba(189,0,255,0.4)]' : 'text-gray-500 hover:text-white'}`}
                              >
                                  Large_View
                              </button>
                          </div>
                      </section>

                       <section>
                          <h3 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.5em] mb-6">Sorting_Logic</h3>
                          <div className="grid grid-cols-2 gap-4">
                              <button 
                                onClick={() => { soundService.play('click'); setFilters(prev => ({ ...prev, sortBy: 'distance' })); }}
                                className={`py-4 border-2 rounded-[1.5rem] font-black text-[10px] flex items-center justify-center gap-3 uppercase tracking-widest transition-all ${filters.sortBy === 'distance' ? 'bg-white text-black border-white shadow-xl' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/20'}`}
                              >
                                  <ICONS.MapPin size={14} /> Distance
                              </button>
                              <button 
                                onClick={() => { soundService.play('click'); setFilters(prev => ({ ...prev, sortBy: 'newest' })); }}
                                className={`py-4 border-2 rounded-[1.5rem] font-black text-[10px] flex items-center justify-center gap-3 uppercase tracking-widest transition-all ${filters.sortBy === 'newest' ? 'bg-white text-black border-white shadow-xl' : 'bg-transparent border-white/10 text-gray-500 hover:border-white/20'}`}
                              >
                                  <ICONS.Sparkles size={14} /> Newest
                              </button>
                          </div>
                       </section>
                  </div>
                  
                  <div className="mt-12 pt-6 border-t border-white/10">
                      <button 
                        onClick={() => { soundService.play('success'); setShowSettings(false); }}
                        className="w-full py-5 bg-xs-cyan text-black rounded-2xl font-black uppercase tracking-[0.3em] shadow-4xl active:scale-95 transition-transform"
                      >
                          Apply Parameters
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Members;
