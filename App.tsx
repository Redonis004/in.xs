
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { ICONS, APP_LOGO } from './constants';
import { User, SubscriptionTier, Ethnicity, SexualRole, SexualPreference, HIVStatus, RelationshipStatus, Report, CumPreference, BodyHair, FacialHair, PowerDynamics } from './types';
import { soundService } from './services/soundService';

// Components
import AuthSystem from './components/AuthSystem';

// Pages
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Chat from './pages/Chat';
import Subscription from './pages/Subscription';
import Moderation from './pages/Moderation';
import Members from './pages/Members';
import About from './pages/About';
import Motion from './pages/Motion';
import SupportChat from './pages/SupportChat';

const DEMO_USER: User = {
  id: 'demo_user_01',
  username: 'Neon_Drifter',
  age: 24,
  bio: 'Exploring the digital grid. 🏳️‍🌈✨ Into fitness, tech, and good vibes.',
  avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop',
  bannerUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?q=80&w=2000&auto=format&fit=crop',
  isVerified: true,
  subscription: SubscriptionTier.FREE,
  walletBalance: 420.69,
  photos: [
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?q=80&w=1000&auto=format&fit=crop',
    'https://images.unsplash.com/photo-1526779218895-c611172ea56f?q=80&w=1000&auto=format&fit=crop'
  ],
  videos: [],
  tags: ['Cyberpunk', 'Fitness', 'Tech', 'Demo'],
  role: SexualRole.VERSE,
  kinks: ['Leather', 'Tech'],
  activities: ['Gaming', 'Gym'],
  intent: ['Friends', 'Chat'],
  ethnicity: Ethnicity.WHITE,
  bodyType: 'Athletic',
  pronouns: 'He/Him',
  location: { lat: 40.7128, lng: -74.0060, name: 'New York' },
  bodyHair: BodyHair.SOME_HAIR,
  facialHair: FacialHair.STUBBLE,
  category: 'Twunk',
  isBiometricEnabled: false
};

const Navigation = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const navItems = [
    { to: "/", icon: ICONS.Home, label: "Scene", color: "text-xs-purple", glow: "shadow-xs-purple" },
    { to: "/chat", icon: ICONS.MessageCircle, label: "Chats", color: "text-xs-cyan", glow: "shadow-xs-cyan" },
    { to: "/members", icon: ICONS.Globe, label: "Network", color: "text-xs-yellow", glow: "shadow-xs-yellow" },
    { to: "camera", isCamera: true },
    { to: "/subscription", icon: ICONS.Star, label: "Premium", color: "text-xs-pink", glow: "shadow-xs-pink" },
    { to: "/motion", icon: ICONS.Play, label: "Motion", color: "text-xs-pink", glow: "shadow-xs-pink" },
    { to: "/profile", icon: ICONS.User, label: "Identity", color: "text-xs-cyan", glow: "shadow-xs-cyan" },
    { to: "/support", icon: ICONS.Bot, label: "Support", color: "text-white", glow: "shadow-white" },
    { to: "/about", icon: ICONS.Info, label: "About", color: "text-white", glow: "shadow-white" }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 px-4 pb-8 pt-4 bg-gradient-to-t from-black via-black/90 to-transparent pointer-events-none">
        <nav 
            className="max-w-2xl mx-auto h-20 liquid-glass rounded-[2.5rem] flex items-center justify-between px-2 pointer-events-auto shadow-[0_10px_30px_rgba(0,0,0,0.5)] ring-1 ring-white/10 preserve-3d"
            style={{ perspective: '1000px' }}
        >
            {navItems.map((item, i) => {
                if (item.isCamera) {
                    return (
                        <div key="cam" className="relative group perspective-500" style={{ perspective: '500px' }}>
                            <button 
                                onClick={() => { soundService.play('camera'); fileInputRef.current?.click(); }}
                                className="w-14 h-14 bg-gradient-to-tr from-xs-purple via-xs-cyan to-xs-pink rounded-2xl flex items-center justify-center text-black shadow-[0_0_20px_rgba(255,255,255,0.3)] transform transition-all duration-300 group-hover:rotate-6 group-hover:scale-110 group-active:scale-95 group-active:translate-z-[-10px]"
                                style={{ transformStyle: 'preserve-3d', transform: 'translateZ(20px)' }}
                            >
                                <ICONS.Camera size={24} className="group-hover:rotate-12 transition-transform" />
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" />
                            </button>
                        </div>
                    );
                }
                return (
                    <NavLink 
                        key={item.to} 
                        to={item.to} 
                        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center transition-all duration-500 relative transform-gpu preserve-3d group ${isActive ? 'z-10' : 'opacity-50 hover:opacity-80'}`}
                        style={({ isActive }) => ({
                            transform: isActive ? 'translateY(-10px) translateZ(30px) scale(1.1)' : 'translateY(0) translateZ(0) scale(1)',
                        })}
                        onClick={() => soundService.play('tab')}
                    >
                        {({ isActive }) => (
                            <div className="flex flex-col items-center gap-1 relative">
                                <div className={`relative transition-all duration-500 ${isActive ? `drop-shadow-[0_0_15px_rgba(255,255,255,0.6)]` : ''}`}>
                                    <item.icon 
                                      size={22} 
                                      className={`transition-all duration-500 ${isActive ? item.color : 'text-white'}`} 
                                    />
                                    {isActive && (
                                        <div className={`absolute inset-0 blur-lg opacity-50 ${item.color.replace('text-', 'bg-')}`}></div>
                                    )}
                                </div>
                                
                                <span className={`text-[8px] font-black uppercase tracking-[0.2em] transition-all duration-500 absolute -bottom-4 whitespace-nowrap ${isActive ? 'opacity-100 translate-y-0 text-white' : 'opacity-0 translate-y-2 text-gray-400'}`}>
                                  {item.label}
                                </span>
                                
                                {isActive && (
                                    <div className={`absolute -bottom-6 w-8 h-1 rounded-full ${item.color.replace('text-', 'bg-')} shadow-[0_0_10px_currentColor] animate-pulse`}></div>
                                )}
                            </div>
                        )}
                    </NavLink>
                );
            })}
        </nav>
    </div>
  );
};

const PageContainer = ({ children }: { children?: React.ReactNode }) => {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number, y: number } | null>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = 0;
  }, [pathname]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    
    const touchEnd = { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    const diffX = touchEnd.x - touchStart.current.x;
    const diffY = touchEnd.y - touchStart.current.y;

    // Logic: Swipe Left-to-Right (Back)
    // Must start from left edge area (< 50px) to avoid conflict with carousels
    // Must be primarily horizontal
    if (
        touchStart.current.x < 50 && // Edge swipe
        diffX > 50 && // Minimum distance
        Math.abs(diffY) < 50 // Horizontal constraint
    ) {
        if (window.history.length > 1) {
            soundService.play('tab');
            navigate(-1);
        }
    }
    
    touchStart.current = null;
  };

  return (
    <div 
        key={pathname} 
        ref={scrollRef} 
        className="page-transition h-full overflow-y-auto overflow-x-hidden custom-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
    >
      <div className="pb-[120px] max-w-2xl mx-auto">
        {children}
      </div>
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('inxs_user_profile');
    return saved ? JSON.parse(saved) : DEMO_USER;
  });

  const handleAuthComplete = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('inxs_user_profile', JSON.stringify(newUser));
    const savedIdentities = JSON.parse(localStorage.getItem('inxs_known_identities') || '[]');
    const exists = savedIdentities.find((i: User) => i.id === newUser.id);
    if (!exists) {
        localStorage.setItem('inxs_known_identities', JSON.stringify([newUser, ...savedIdentities]));
    } else {
        const updated = savedIdentities.map((i: User) => i.id === newUser.id ? newUser : i);
        localStorage.setItem('inxs_known_identities', JSON.stringify(updated));
    }
    soundService.play('success');
  };

  const handleSignOut = () => {
    soundService.play('lock');
    setUser(null);
    localStorage.removeItem('inxs_user_profile');
  };

  if (!user) {
      return (
          <div className="h-[100dvh] w-full bg-xs-black text-white font-sans overflow-hidden">
            <AuthSystem onComplete={handleAuthComplete} />
          </div>
      );
  }

  return (
    <Router>
      <div className="h-[100dvh] w-full bg-xs-black text-white font-sans overflow-hidden">
        <Navigation />
        <main className="h-full relative z-10 overflow-hidden">
          <PageContainer>
            <Routes>
              <Route path="/" element={<Feed user={user} onReport={() => {}} />} />
              <Route path="/chat" element={<Chat user={user} onReport={() => {}} onUpdateUser={(d) => {
                  const updated = {...user, ...d};
                  setUser(updated);
                  localStorage.setItem('inxs_user_profile', JSON.stringify(updated));
                  const savedIdentities = JSON.parse(localStorage.getItem('inxs_known_identities') || '[]');
                  const newIdentities = savedIdentities.map((i: User) => i.id === user.id ? updated : i);
                  localStorage.setItem('inxs_known_identities', JSON.stringify(newIdentities));
              }} />} />
              <Route path="/members" element={<Members user={user} />} />
              <Route path="/motion" element={<Motion />} />
              <Route path="/subscription" element={<Subscription user={user} onUpgrade={(t) => setUser({...user, subscription: t})} />} />
              <Route path="/profile" element={<Profile user={user} onSignOut={handleSignOut} onUpdateUser={(d) => {
                  const updated = {...user, ...d};
                  setUser(updated);
                  localStorage.setItem('inxs_user_profile', JSON.stringify(updated));
                  const savedIdentities = JSON.parse(localStorage.getItem('inxs_known_identities') || '[]');
                  const newIdentities = savedIdentities.map((i: User) => i.id === user.id ? updated : i);
                  localStorage.setItem('inxs_known_identities', JSON.stringify(newIdentities));
              }} />} />
              <Route path="/support" element={<SupportChat />} />
              <Route path="/user/:userId" element={<UserProfile user={user} onUpdateUser={(d) => setUser({...user, ...d})} />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </PageContainer>
        </main>
      </div>
    </Router>
  );
}
