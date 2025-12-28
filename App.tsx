
import React, { useState, useEffect, useRef } from 'react';
import { HashRouter as Router, Routes, Route, NavLink, useLocation, Navigate } from 'react-router-dom';
import { ICONS, APP_LOGO } from './constants';
import { User, SubscriptionTier, Ethnicity, SexualRole, SexualPreference, HIVStatus, RelationshipStatus, Report } from './types';
import { soundService } from './services/soundService';

// Pages
import Feed from './pages/Feed';
import Profile from './pages/Profile';
import UserProfile from './pages/UserProfile';
import Chat from './pages/Chat';
import Subscription from './pages/Subscription';
import Moderation from './pages/Moderation';
import Members from './pages/Members';
import About from './pages/About';

// Mock current user
const INITIAL_USER: User = {
  id: 'u1',
  username: 'Identity_X',
  age: 24,
  height: "5'11",
  weight: "180 lbs",
  bio: 'Synthesizing digital connections in the modern age. Tech enthusiast and coffee addict.',
  avatarUrl: 'https://picsum.photos/200/200?random=10',
  bannerUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2064&auto=format&fit=crop',
  ethnicity: Ethnicity.WHITE,
  role: SexualRole.VERSE,
  sexualPreference: SexualPreference.ON_PREP,
  hivStatus: HIVStatus.NEGATIVE,
  relationshipStatus: RelationshipStatus.SINGLE,
  pronouns: 'He/Him',
  bodyType: 'Athletic',
  hairColor: 'Brown',
  eyeColor: 'Blue',
  category: 'Jock',
  location: { lat: 0, lng: 0, name: 'Downtown Core' },
  isVerified: true,
  isModerator: true, 
  subscription: SubscriptionTier.FREE,
  walletBalance: 250.00,
  photos: [
    'https://picsum.photos/300/300?random=101',
    'https://picsum.photos/300/300?random=102',
    'https://picsum.photos/300/300?random=103'
  ],
  videos: [],
  tags: ['Tech', 'Gym', 'Cyber', 'Nightlife'],
  kinks: ['Leather', 'Roleplay'],
  cumInAss: 'Into it',
  cumInMouth: 'Negotiable',
  smoking: 'Never' as any,
  drinking: 'Sometimes' as any,
  marijuana: 'Never' as any,
  diet: 'Omnivore',
  education: 'University' as any,
  occupation: 'Lead Developer'
};

const INITIAL_REPORTS: Report[] = [];

const AgeGate: React.FC<{ onConfirm: () => void }> = ({ onConfirm }) => {
  const [day, setDay] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');

  const handleVerify = () => {
    soundService.play('click');
    if (!day || !month || !year || year.length < 4) {
      return;
    }
    const age = new Date().getFullYear() - parseInt(year);
    if (age < 18) {
      alert("You must be 18+ to enter [in.xs]");
      return;
    }
    soundService.play('success');
    onConfirm();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black flex items-center justify-center p-4">
        <div className="relative max-w-md w-full bg-xs-dark/80 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 text-center shadow-[0_0_100px_rgba(0,0,0,1)] overflow-hidden preserve-3d" style={{ transform: 'rotateX(5deg)' }}>
            <div className="absolute -top-24 -left-24 w-48 h-48 bg-xs-purple/20 rounded-full blur-[80px]"></div>
            <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-xs-cyan/20 rounded-full blur-[80px]"></div>
            
            <div className="mb-6 relative mx-auto w-32 h-32 animate-float" style={{ transform: 'translateZ(50px)' }}>
                <img src={APP_LOGO} className="w-full h-full object-contain drop-shadow-[0_0_20px_rgba(189,0,255,0.6)]" alt="in.xs logo" />
            </div>

            <h1 className="text-4xl font-black text-white mb-3 uppercase italic tracking-tighter" style={{ transform: 'translateZ(30px)' }}>Biometric Access</h1>
            <p className="text-gray-400 text-sm mb-10 leading-relaxed font-medium">Verify your temporal alignment (18+) to access the Neural Net.</p>
            
            <div className="flex gap-3 mb-8">
                <input 
                  type="text" 
                  maxLength={2} 
                  placeholder="DD" 
                  value={day}
                  onChange={(e) => { setDay(e.target.value.replace(/\D/g, '')); soundService.play('typing'); }}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-center font-black text-white focus:border-xs-purple outline-none transition-all placeholder-gray-700" 
                />
                <input 
                  type="text" 
                  maxLength={2} 
                  placeholder="MM" 
                  value={month}
                  onChange={(e) => { setMonth(e.target.value.replace(/\D/g, '')); soundService.play('typing'); }}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-center font-black text-white focus:border-xs-purple outline-none transition-all placeholder-gray-700" 
                />
                <input 
                  type="text" 
                  maxLength={4} 
                  placeholder="YYYY" 
                  value={year}
                  onChange={(e) => { setYear(e.target.value.replace(/\D/g, '')); soundService.play('typing'); }}
                  className="w-full bg-black/60 border border-white/10 rounded-2xl p-5 text-center font-black text-white focus:border-xs-purple outline-none transition-all placeholder-gray-700" 
                />
            </div>
            
            <button 
              onClick={handleVerify} 
              className="w-full py-5 bg-gradient-to-r from-xs-purple via-xs-cyan to-xs-pink rounded-[1.5rem] font-black text-black uppercase tracking-[0.2em] text-sm hover:scale-[1.02] active:scale-95 transition-all shadow-[0_10px_40px_rgba(0,255,255,0.2)]"
            >
              Access Neural Net
            </button>
        </div>
    </div>
  );
};

const Navigation = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [navRotate, setNavRotate] = useState({ x: 0, y: 0 });

  const navItems = [
    { to: "/", icon: ICONS.Home, color: "text-xs-purple", glow: "shadow-[0_0_20px_rgba(189,0,255,0.6)]", label: "Scene" },
    { to: "/chat", icon: ICONS.MessageCircle, color: "text-xs-cyan", glow: "shadow-[0_0_20px_rgba(0,255,255,0.6)]", label: "Neural" },
    { to: "/members", icon: ICONS.Globe, color: "text-xs-yellow", glow: "shadow-[0_0_20px_rgba(249,249,0,0.6)]", label: "Grid" },
    { to: "camera", isCamera: true },
    { to: "/subscription", icon: ICONS.Zap, color: "text-xs-pink", glow: "shadow-[0_0_20px_rgba(255,0,255,0.6)]", label: "Boost" },
    { to: "/about", icon: ICONS.Info, color: "text-white", glow: "shadow-[0_0_20px_rgba(255,255,255,0.6)]", label: "Core" },
    { to: "/profile", icon: ICONS.User, color: "text-xs-cyan", glow: "shadow-[0_0_20px_rgba(0,255,255,0.6)]", label: "Identity" }
  ];

  const handleMouseMove = (e: React.MouseEvent) => {
    const nav = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - nav.left;
    const y = e.clientY - nav.top;
    const centerX = nav.width / 2;
    const centerY = nav.height / 2;
    setNavRotate({
      x: (y - centerY) / 20, 
      y: -(x - centerX) / 40,
    });
  };

  const handleMouseLeave = () => setNavRotate({ x: 0, y: 0 });

  return (
    <div className="fixed bottom-6 left-0 right-0 z-50 flex justify-center px-4 md:px-8 preserve-3d pointer-events-none">
        <nav 
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
            style={{ 
              transform: `rotateX(${navRotate.x}deg) rotateY(${navRotate.y}deg)`,
              boxShadow: `0 20px 50px -10px rgba(0,0,0,0.8), inset 0 1px 0 rgba(255,255,255,0.1)`
            }}
            className="w-full max-w-4xl glass-panel h-20 rounded-[2.5rem] flex items-stretch justify-between px-2 transition-transform duration-500 ease-out border border-white/10 bg-black/60 backdrop-blur-xl preserve-3d overflow-visible pointer-events-auto"
        >
            {navItems.map((item, i) => {
                if (item.isCamera) {
                    return (
                        <div key="cam-wrap" className="flex-1 flex items-center justify-center relative preserve-3d">
                          <button 
                              onClick={() => { soundService.play('camera'); fileInputRef.current?.click(); }}
                              className="w-16 h-16 bg-black rounded-full flex items-center justify-center -translate-y-10 shadow-[0_15px_40px_rgba(0,255,255,0.3)] border-4 border-xs-dark transform hover:scale-110 active:scale-95 transition-all duration-300 group preserve-3d overflow-hidden relative"
                              style={{ transform: 'translateZ(30px)' }}
                          >
                              <div className="absolute inset-0 bg-gradient-to-tr from-xs-purple via-xs-cyan to-xs-pink opacity-80 group-hover:opacity-100 transition-opacity"></div>
                              <ICONS.Camera size={26} className="text-white relative z-10 group-hover:rotate-12 transition-transform" />
                              <div className="absolute inset-0 rounded-full border border-white/20"></div>
                              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" />
                          </button>
                        </div>
                    );
                }
                return (
                    <NavLink 
                        key={item.to} 
                        to={item.to} 
                        className={({ isActive }) => `flex-1 flex flex-col items-center justify-center transition-all duration-500 relative group min-w-0 preserve-3d ${isActive ? 'z-10' : 'opacity-60 hover:opacity-100'}`}
                        onClick={() => soundService.play('tab')}
                    >
                        {({ isActive }) => (
                            <div className="flex flex-col items-center gap-1 w-full h-full justify-center">
                              <div 
                                className={`p-2 rounded-2xl transition-all duration-500 relative flex items-center justify-center ${isActive ? `bg-white/10 ${item.color} ${item.glow} scale-110` : 'text-gray-400 group-hover:text-white'}`} 
                                style={{ transform: isActive ? 'translateZ(20px) translateY(-5px)' : 'translateZ(0px)' }}
                              >
                                  <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className="relative z-10 drop-shadow-lg" />
                                  
                                  {isActive && (
                                    <>
                                      <div className={`absolute inset-0 rounded-2xl blur-lg opacity-40 ${item.color.replace('text', 'bg')}`}></div>
                                      <div className="absolute -bottom-8 w-1 h-8 bg-gradient-to-t from-transparent to-current opacity-30 blur-[1px]"></div>
                                    </>
                                  )}
                              </div>
                              <span 
                                className={`text-[9px] font-black uppercase tracking-widest transition-all duration-500 text-center w-full truncate px-0.5 absolute bottom-1 ${isActive ? 'opacity-100 text-white translate-y-0' : 'opacity-0 translate-y-2'}`}
                              >
                                {item.label}
                              </span>
                              {isActive && <div className={`absolute bottom-0 w-1 h-1 rounded-full ${item.color.replace('text', 'bg')} shadow-[0_0_10px_currentColor]`}></div>}
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
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div key={pathname} className="page-transition preserve-3d" ref={containerRef}>
      {children}
    </div>
  );
};

export default function App() {
  const [user, setUser] = useState<User>(INITIAL_USER);
  const [reports, setReports] = useState<Report[]>(INITIAL_REPORTS);
  const [isAdultConfirmed, setIsAdultConfirmed] = useState<boolean>(() => localStorage.getItem('inxs_adult_confirmed') === 'true');
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({
        x: (e.clientX / window.innerWidth - 0.5) * 40,
        y: (e.clientY / window.innerHeight - 0.5) * 40
      });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const updateUser = (updated: Partial<User>) => {
    setUser(prev => ({ ...prev, ...updated }));
  };

  if (!isAdultConfirmed) return <AgeGate onConfirm={() => { localStorage.setItem('inxs_adult_confirmed', 'true'); setIsAdultConfirmed(true); }} />;

  return (
    <Router>
      <div className="min-h-screen bg-xs-black text-white font-sans overflow-x-hidden selection:bg-xs-cyan/30 preserve-3d">
        {/* Interactive Neural background layer */}
        <div 
          className="fixed inset-0 pointer-events-none opacity-20 z-0 transition-transform duration-1000 ease-out"
          style={{ transform: `rotateY(${mousePos.x / 20}deg) rotateX(${-mousePos.y / 20}deg) scale(1.05)` }}
        >
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-xs-purple rounded-full blur-[180px] animate-blob"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[500px] h-[500px] bg-xs-cyan rounded-full blur-[180px] animate-blob delay-2000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,rgba(189,0,255,0.3)_0%,transparent_80%)]"></div>
        </div>

        <Navigation />
        
        <main className="max-w-5xl mx-auto relative z-10 pb-[104px] perspective-[2000px]">
          <PageContainer>
            <Routes>
              <Route path="/" element={<Feed user={user} onReport={(r) => setReports([r, ...reports])} />} />
              <Route path="/chat" element={<Chat user={user} onReport={(r) => setReports([r, ...reports])} onUpdateUser={updateUser} />} />
              <Route path="/members" element={<Members />} />
              <Route path="/subscription" element={<Subscription user={user} onUpgrade={(t) => updateUser({ subscription: t })} />} />
              <Route path="/profile" element={<Profile user={user} onUpdateUser={updateUser} />} />
              <Route path="/user/:userId" element={<UserProfile user={user} onUpdateUser={updateUser} />} />
              <Route path="/moderation" element={user.isModerator ? <Moderation reports={reports} onResolve={(id) => setReports(reports.filter(r => r.id !== id))} /> : <Navigate to="/" />} />
              <Route path="/about" element={<About />} />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </PageContainer>
        </main>
      </div>
    </Router>
  );
}
