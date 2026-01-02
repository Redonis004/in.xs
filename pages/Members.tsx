
import React, { useState, useEffect } from 'react';
import Card3D from '../components/Card3D';
import { ICONS, CATEGORIES } from '../constants';
import { useNavigate } from 'react-router-dom';
import { SexualRole, User } from '../types';
import { soundService } from '../services/soundService';
import UserProfileModal from '../components/UserProfileModal';

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
    hosting: Math.random() > 0.6 ? 'Hosting' : 'No',
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    // Add mock media for the modal
    photos: Array.from({length: 4}, (_, j) => `https://picsum.photos/400/500?random=${i * 10 + j}`),
    videos: Math.random() > 0.8 ? ['https://www.w3schools.com/html/mov_bbb.mp4'] : [],
    bio: "Just a digital soul wandering the grid. Into fitness, tech, and good vibes. Hmu if you want to sync."
  }));
};

// Generate 100 mock members
const ALL_MEMBERS = generateMockMembers(100);

const FILTER_OPTIONS = [
    { label: "Online", key: "isOnline", color: "green-500", bgActive: "bg-green-500", textActive: "text-black", textInactive: "text-green-500", borderInactive: "border-green-500" },
    { label: "Verified", key: "isVerified", color: "xs-cyan", bgActive: "bg-xs-cyan", textActive: "text-black", textInactive: "text-xs-cyan", borderInactive: "border-xs-cyan" },
    { label: "Hosting", key: "hosting", color: "xs-yellow", bgActive: "bg-xs-yellow", textActive: "text-black", textInactive: "text-xs-yellow", borderInactive: "border-xs-yellow" },
    { label: "Top", key: "role-Top", color: "xs-purple", bgActive: "bg-xs-purple", textActive: "text-white", textInactive: "text-xs-purple", borderInactive: "border-xs-purple" },
    { label: "Bottom", key: "role-Bottom", color: "xs-pink", bgActive: "bg-xs-pink", textActive: "text-white", textInactive: "text-xs-pink", borderInactive: "border-xs-pink" },
    { label: "Verse", key: "role-Verse", color: "blue-400", bgActive: "bg-blue-400", textActive: "text-black", textInactive: "text-blue-400", borderInactive: "border-blue-400" },
    { label: "Side", key: "role-Side", color: "orange-400", bgActive: "bg-orange-400", textActive: "text-black", textInactive: "text-orange-400", borderInactive: "border-orange-400" },
];

interface MembersProps {
    user: User;
}

const Members: React.FC<MembersProps> = ({ user }) => {
  const navigate = useNavigate();
  
  // View State
  const [displayLimit, setDisplayLimit] = useState(18);
  const [otherMembers, setOtherMembers] = useState(ALL_MEMBERS);
  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  
  // Modal State
  const [selectedMember, setSelectedMember] = useState<any | null>(null);

  // Payment State
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'paypal'>('card');
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const [processingPayment, setProcessingPayment] = useState(false);

  // Construct the "Me" profile object adapting User type to member structure
  const myProfile = {
    ...user, // Spread user props
    id: user.id,
    username: user.username,
    age: user.age,
    role: user.role || 'Verse',
    distance: '0',
    location: 'Here',
    avatar: user.avatarUrl,
    isOnline: true, 
    isVerified: user.isVerified,
    hosting: user.hosting || 'No',
    category: 'Me',
    // Ensure photos exist
    photos: user.photos && user.photos.length > 0 ? user.photos : [user.avatarUrl],
    videos: user.videos || [],
    bio: user.bio
  };

  // Combine user with other members
  const allMembers = [myProfile, ...otherMembers];

  // Apply filters logic
  const filteredMembers = allMembers.filter(m => {
      if (searchQuery && !m.username.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      
      // Check status filters
      if (activeFilters.includes("Online") && !m.isOnline) return false;
      if (activeFilters.includes("Verified") && !m.isVerified) return false;
      if (activeFilters.includes("Hosting") && m.hosting !== 'Hosting') return false;

      // Check role filters - if any role filter is active, member must match at least one
      const roleFilters = activeFilters.filter(f => ['Top', 'Bottom', 'Verse', 'Side'].includes(f));
      if (roleFilters.length > 0 && !roleFilters.includes(m.role)) return false;

      return true;
  });

  const visibleMembers = filteredMembers.slice(0, displayLimit);
  const hasMore = displayLimit < filteredMembers.length;

  const handleBoostClick = () => {
    soundService.play('click');
    setShowPaymentModal(true);
  };

  const handleMemberClick = (member: any) => {
      soundService.play('click');
      setSelectedMember(member);
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

  const handlePaymentSubmit = () => {
    if (paymentMethod === 'card') {
        if (!cardNumber || !expiry || !cvc || !cardName) {
            soundService.play('error');
            alert("Please fill in all card details.");
            return;
        }
    }

    setProcessingPayment(true);
    soundService.play('send');

    // Simulate secure payment processing
    setTimeout(() => {
        setProcessingPayment(false);
        setShowPaymentModal(false);
        setDisplayLimit(prev => prev + 18); // Permanent boost for this session
        soundService.play('success');
        setCardName('');
        setCardNumber('');
        setExpiry('');
        setCvc('');
    }, 2000);
  };

  const toggleFilter = (filter: string) => {
    soundService.play('tab');
    setActiveFilters(prev => 
        prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
    );
  };

  const getRoleColor = (role: string) => {
      switch(role) {
          case 'Top': return 'purple';
          case 'Bottom': return 'pink';
          case 'Verse': return 'cyan';
          case 'Side': return 'yellow';
          default: return 'none';
      }
  };

  return (
    <div className="space-y-6 relative px-4 pt-10 min-h-screen">
      {/* Profile Modal */}
      <UserProfileModal 
        isOpen={!!selectedMember} 
        onClose={() => setSelectedMember(null)} 
        currentUser={user} 
        targetUser={selectedMember} 
      />

      {/* Ambient Backgrounds */}
      <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-20 left-0 w-64 h-64 bg-xs-purple/10 rounded-full blur-[100px] opacity-50"></div>
          <div className="absolute bottom-40 right-0 w-64 h-64 bg-xs-cyan/10 rounded-full blur-[100px] opacity-50"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-xs-pink/5 rounded-full blur-[120px] opacity-30"></div>
      </div>

      <header className="flex justify-between items-center px-1 relative z-10">
        <div>
            <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
              <span className="bg-gradient-to-br from-xs-cyan to-blue-500 p-1.5 rounded-xl text-black shadow-[0_0_20px_rgba(0,255,255,0.4)]"><ICONS.Globe size={20} /></span>
              Networking
            </h1>
        </div>
        
        <div className="flex gap-3">
            <button onClick={handleBoostClick} className="p-3 bg-xs-yellow/10 border border-xs-yellow/30 text-xs-yellow rounded-2xl hover:bg-xs-yellow/20 transition-all shadow-[0_0_15px_rgba(249,249,0,0.15)]">
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

      {/* Filter Chips */}
      <div className="space-y-3 relative z-10">
          <div className="flex items-center justify-between px-2">
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-[0.4em]">Filters</span>
              {activeFilters.length > 0 && (
                  <button onClick={() => setActiveFilters([])} className="text-[9px] font-black text-xs-pink uppercase tracking-widest flex items-center gap-1">
                      <ICONS.X size={10} /> Clear
                  </button>
              )}
          </div>
          <div className="flex flex-wrap gap-2 px-1">
            {FILTER_OPTIONS.map(opt => {
                const isActive = activeFilters.includes(opt.label);
                return (
                    <button 
                        key={opt.label}
                        onClick={() => toggleFilter(opt.label)}
                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all duration-300 ${isActive ? `${opt.bgActive} ${opt.textActive} border-transparent shadow-lg scale-105` : `bg-transparent ${opt.textInactive} ${opt.borderInactive} border-opacity-30 hover:bg-white/5`}`}
                    >
                        {opt.label}
                    </button>
                );
            })}
          </div>
      </div>

      {/* Search Bar */}
      <div className="relative px-1 z-10">
        <ICONS.Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
            type="text" 
            placeholder="Search identity identifiers..." 
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); soundService.play('typing'); }}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white focus:border-xs-cyan outline-none transition-all placeholder-gray-600 text-sm font-black italic tracking-wide shadow-inner"
        />
      </div>

      {/* Grid Display */}
      <div className={`grid gap-3 transition-all duration-500 px-1 grid-cols-3 md:grid-cols-5 lg:grid-cols-6 relative z-10`}>
        {visibleMembers.map((member, idx) => {
            const isMe = member.id === user.id;
            return (
            <Card3D 
                key={member.id} 
                className={`cursor-pointer group relative h-40 ${isMe ? 'ring-2 ring-xs-cyan/50 shadow-[0_0_20px_rgba(0,255,255,0.2)]' : ''}`}
                innerClassName="p-0 border-white/10" 
                glowColor={getRoleColor(member.role) as any}
                hoverZ={60}
                onClick={() => handleMemberClick(member)}
            >
                <div className="w-full h-full relative overflow-hidden">
                    <img src={member.avatar} alt={member.username} className="w-full h-full object-cover transition-transform duration-[2000ms] group-hover:scale-125" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-80 group-hover:opacity-60 transition-opacity"></div>
                    
                    <div className="absolute top-2 right-2 flex gap-1.5 items-center">
                        {member.isOnline && (
                            <div className="w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-black shadow-[0_0_10px_rgba(0,255,0,0.8)] animate-pulse"></div>
                        )}
                        {member.isVerified && <ICONS.ShieldCheck size={14} className="text-xs-cyan drop-shadow-[0_0_5px_rgba(0,255,255,0.8)]" />}
                    </div>

                    {isMe && (
                        <div className="absolute top-2 left-2 bg-xs-cyan text-black text-[7px] font-black uppercase px-1.5 py-0.5 rounded shadow-lg">
                            YOU
                        </div>
                    )}

                    <div className="absolute bottom-0 left-0 right-0 p-3">
                        <h3 className={`font-black text-white italic tracking-tighter leading-none mb-1 group-hover:text-xs-cyan transition-colors text-xs truncate`}>
                            {member.username}
                        </h3>
                        <div className="flex items-center gap-1.5 flex-wrap">
                             <span className={`text-[7px] font-black uppercase tracking-widest bg-black/60 px-1.5 py-0.5 rounded border ${
                                 member.role === 'Top' ? 'text-xs-purple border-xs-purple/30' : 
                                 member.role === 'Bottom' ? 'text-xs-pink border-xs-pink/30' : 
                                 member.role === 'Verse' ? 'text-xs-cyan border-xs-cyan/30' : 'text-xs-yellow border-xs-yellow/30'
                             }`}>
                                 {member.role}
                             </span>
                             <span className="text-[7px] font-black text-gray-300 uppercase tracking-widest bg-black/60 px-1.5 py-0.5 rounded border border-white/10">
                                 {isMe ? '0mi' : `${member.distance}mi`}
                             </span>
                        </div>
                    </div>
                </div>
            </Card3D>
        )})}
      </div>

      {hasMore && visibleMembers.length > 0 && (
        <div className="mt-12 relative px-1 pb-10 z-10">
            <div className="flex justify-center z-20">
                <Card3D 
                    className="w-full max-w-sm mx-auto" 
                    glowColor="pink"
                    innerClassName="p-8 flex flex-col items-center text-center bg-black/80 backdrop-blur-3xl border-xs-pink/30"
                >
                    <div className="w-16 h-16 bg-xs-yellow rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(249,249,0,0.6)] animate-bounce">
                        <ICONS.Rocket size={36} className="text-black" />
                    </div>
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase mb-2">Network Expansion</h3>
                    <p className="text-gray-400 text-xs mb-8 font-medium leading-relaxed px-2">
                        To see more profiles, get a boost for an extra 18 profiles.<br/>
                        <span className="text-xs-pink font-black uppercase tracking-widest">Boosts are permanent.</span>
                    </p>
                    
                    <button 
                        onClick={handleBoostClick}
                        className="w-full py-5 bg-gradient-to-r from-xs-yellow via-xs-pink to-xs-purple text-black font-black text-lg rounded-2xl shadow-4xl hover:scale-[1.03] active:scale-95 transition-all flex items-center justify-center gap-3 uppercase tracking-widest"
                    >
                        <ICONS.Zap size={24} fill="currentColor" />
                        Boost $1.50
                    </button>
                </Card3D>
            </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && (
          <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 animate-in fade-in duration-300" onClick={() => setShowPaymentModal(false)}>
              <div 
                className="w-full max-w-md bg-xs-dark border border-white/10 rounded-[3rem] p-8 relative animate-in zoom-in-95 duration-300 shadow-4xl"
                onClick={e => e.stopPropagation()}
              >
                  <div className="flex justify-between items-center mb-6">
                      <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                          <ICONS.Zap size={24} className="text-xs-yellow" fill="currentColor" /> Boost_Network
                      </h3>
                      <button onClick={() => setShowPaymentModal(false)} className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500"><ICONS.X size={20} /></button>
                  </div>

                  <div className="mb-8 p-6 bg-gradient-to-r from-xs-yellow/10 to-black border border-xs-yellow/30 rounded-[2rem] flex justify-between items-center shadow-lg">
                      <div>
                          <p className="text-white font-black uppercase tracking-widest text-sm">Profile_Expansion</p>
                          <p className="text-[10px] text-gray-400 font-mono mt-1">+18 PERMANENT SLOTS</p>
                      </div>
                      <p className="text-3xl font-black text-white italic tracking-tighter">$1.50</p>
                  </div>

                  {/* Payment Methods Tabs */}
                  <div className="flex bg-white/5 p-1 rounded-2xl mb-6 border border-white/5">
                     <button 
                        onClick={() => { setPaymentMethod('card'); soundService.play('tab'); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${paymentMethod === 'card' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                     >
                        <ICONS.CreditCard size={14} /> Card
                     </button>
                     <button 
                        onClick={() => { setPaymentMethod('paypal'); soundService.play('tab'); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${paymentMethod === 'paypal' ? 'bg-[#0070BA] text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                     >
                        <ICONS.MessageCircle size={14} /> PayPal
                     </button>
                  </div>

                  <div className="space-y-6">
                      {paymentMethod === 'card' ? (
                          <div className="space-y-4 animate-in slide-in-from-right-4">
                              <div className="space-y-2 px-1">
                                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Cardholder</label>
                                  <input 
                                    type="text" placeholder="NAME ON CARD" value={cardName}
                                    onChange={e => { setCardName(e.target.value); soundService.play('typing'); }}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-xs-yellow outline-none font-black italic transition-all placeholder-gray-800"
                                  />
                              </div>
                              <div className="space-y-2 px-1">
                                  <label className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">Number</label>
                                  <div className="relative">
                                    <ICONS.Lock className="absolute left-6 top-1/2 -translate-y-1/2 text-xs-yellow" size={16} />
                                    <input 
                                        type="text" inputMode="numeric" placeholder="0000 0000 0000 0000"
                                        value={cardNumber} onChange={handleCardNumberChange} maxLength={19}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl pl-16 pr-6 py-4 text-white focus:border-xs-yellow outline-none font-mono transition-all placeholder-gray-800"
                                    />
                                  </div>
                              </div>
                              <div className="grid grid-cols-2 gap-4 px-1">
                                  <div className="space-y-2">
                                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">EXP</label>
                                      <input 
                                        type="text" inputMode="numeric" placeholder="MM/YY"
                                        value={expiry} onChange={handleExpiryChange} maxLength={5}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-xs-yellow outline-none text-center transition-all placeholder-gray-800"
                                      />
                                  </div>
                                  <div className="space-y-2">
                                      <label className="text-[10px] text-gray-500 uppercase font-black tracking-[0.4em]">CVC</label>
                                      <input 
                                        type="text" inputMode="numeric" placeholder="000"
                                        value={cvc} onChange={e => { setCvc(e.target.value.replace(/\D/g, '').slice(0, 4)); soundService.play('typing'); }}
                                        maxLength={4}
                                        className="w-full bg-black/60 border border-white/10 rounded-2xl px-6 py-4 text-white focus:border-xs-yellow outline-none text-center transition-all placeholder-gray-800"
                                      />
                                  </div>
                              </div>
                          </div>
                      ) : (
                          <div className="py-8 space-y-6 text-center animate-in slide-in-from-right-4">
                              <p className="text-xs text-gray-400 font-medium">Securely connect your PayPal account to boost instantly.</p>
                              <button className="w-full py-4 bg-[#FFC439] hover:bg-[#F4B400] rounded-2xl text-[#003087] font-black text-lg italic shadow-lg hover:scale-[1.02] transition-transform">
                                  PayPal <span className="text-[#009cde] not-italic">Checkout</span>
                              </button>
                          </div>
                      )}

                      <button 
                        onClick={handlePaymentSubmit}
                        disabled={processingPayment}
                        className="w-full py-6 bg-white text-black rounded-[1.8rem] font-black text-xl uppercase tracking-[0.3em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                      >
                          {processingPayment ? (
                              <>
                                <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                              </>
                          ) : (
                              <>
                                <ICONS.ShieldCheck size={20} />
                                Secure Pay $1.50
                              </>
                          )}
                      </button>
                      
                      <div className="text-center space-y-2 pt-2">
                          <p className="text-[8px] text-gray-500 font-mono uppercase tracking-widest flex items-center justify-center gap-2">
                              <ICONS.Lock size={10} /> SSL ENCRYPTED • SECURE TOKENIZATION
                          </p>
                          <p className="text-[7px] text-gray-600 font-medium leading-relaxed max-w-xs mx-auto">
                              Adhering to the Ontario Consumer Protection Act. Digital services provided by in.xs are final sale.
                          </p>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Members;
