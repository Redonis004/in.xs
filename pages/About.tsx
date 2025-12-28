
import React, { useState } from 'react';
import Card3D from '../components/Card3D';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';

const About: React.FC = () => {
  const [reportState, setReportState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [reportCategory, setReportCategory] = useState('General');
  const [reportDesc, setReportDesc] = useState('');
  const [attachedFile, setAttachedFile] = useState<string | null>(null);

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportDesc.trim()) return;

    soundService.play('send');
    setReportState('submitting');

    // Simulate neural report transmission
    setTimeout(() => {
      setReportState('success');
      soundService.play('success');
      // Reset form after a delay
      setTimeout(() => {
        setReportState('idle');
        setReportDesc('');
        setAttachedFile(null);
      }, 3000);
    }, 2000);
  };

  const handleFileSim = () => {
    soundService.play('click');
    // Simulate finding a log/screenshot
    setAttachedFile('system_log_dump_0x44.txt');
  };

  return (
    <div className="pb-24 space-y-6 px-4 pt-10">
       {/* Header */}
       <div className="text-center space-y-2 pt-0">
           <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-xs-purple via-white to-xs-cyan italic tracking-tighter uppercase">
               Core_Protocol
           </h1>
           <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.5em] max-w-xs mx-auto">
               The intersection of identity and neural sync.
           </p>
       </div>

       <div className="grid grid-cols-1 gap-6">
           {/* Vision & Inspiration */}
           <Card3D glowColor="purple" className="h-80" innerClassName="p-8 overflow-y-auto custom-scrollbar">
               <div className="flex items-center gap-4 mb-6 text-xs-purple sticky top-0 bg-black/40 backdrop-blur-md p-2 -ml-2 rounded-xl z-10 border border-white/5">
                   <ICONS.Eye size={24} />
                   <h2 className="text-xl font-black uppercase italic tracking-tighter">Vision_Matrix</h2>
               </div>
               <p className="text-gray-300 text-sm leading-relaxed mb-8 italic font-light">
                   "[In.xS] represents the total synthesis of digital safety, queer identity, and cutting-edge neural architecture. We envision a platform where the LGBTQ+ community can connect with zero latency of expression, free from the flat grids of the past. Our 3D ecosystem is built to celebrate individual frequencies."
               </p>

               <div className="flex items-center gap-4 mb-6 text-xs-cyan sticky top-0 bg-black/40 backdrop-blur-md p-2 -ml-2 rounded-xl z-10 border border-white/5">
                   <ICONS.Sparkles size={24} />
                   <h2 className="text-xl font-black uppercase italic tracking-tighter">Inspiration_Stream</h2>
               </div>
               <p className="text-gray-300 text-sm leading-relaxed italic font-light">
                   Born from a desire to reimagine gay social networking for the high-tech age. In.xS was inspired by the vibrant, messy, and electric energy of global queer spaces. We move beyond the binary of 'apps' into 'living neural networks'.
               </p>
           </Card3D>

           {/* FAULT REPORTING FORM */}
           <Card3D glowColor="pink" className="min-h-[400px]" innerClassName="p-8">
                <div className="flex items-center gap-4 mb-8 text-xs-pink">
                   <ICONS.ShieldAlert size={28} />
                   <h2 className="text-2xl font-black uppercase italic tracking-tighter">Report_Neural_Fault</h2>
               </div>

               {reportState === 'success' ? (
                   <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in duration-500">
                       <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                           <ICONS.CheckCircle size={40} className="text-green-500" />
                       </div>
                       <div className="text-center">
                           <h3 className="text-xl font-black text-white uppercase italic mb-2">Transmission_Logged</h3>
                           <p className="text-gray-500 text-xs font-mono uppercase tracking-widest">Neural Moderators are investigating your frequency.</p>
                       </div>
                   </div>
               ) : (
                   <form onSubmit={handleReportSubmit} className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Fault_Category</label>
                                <select 
                                    value={reportCategory}
                                    onChange={(e) => setReportCategory(e.target.value)}
                                    className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-xs-pink font-black uppercase outline-none focus:border-xs-pink transition-all appearance-none"
                                >
                                    <option>UI_Glitch</option>
                                    <option>Neural_Latency</option>
                                    <option>Connection_Drop</option>
                                    <option>AI_Persona_Error</option>
                                    <option>Other_Inconsistency</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Diagnostic_Dump</label>
                                <button 
                                    type="button"
                                    onClick={handleFileSim}
                                    className={`w-full p-4 rounded-2xl border flex items-center justify-center gap-3 transition-all ${attachedFile ? 'bg-xs-cyan/20 border-xs-cyan text-xs-cyan' : 'bg-white/5 border-white/10 text-gray-500 hover:border-white/30'}`}
                                >
                                    <ICONS.Upload size={16} />
                                    <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[100px]">
                                        {attachedFile || 'Attach_Log'}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-2">Error_Description</label>
                            <textarea 
                                required
                                value={reportDesc}
                                onChange={(e) => { setReportDesc(e.target.value); soundService.play('typing'); }}
                                placeholder="Describe the system inconsistency in detail..."
                                className="w-full h-32 bg-black/60 border border-white/10 rounded-3xl p-6 text-white text-sm font-medium italic outline-none focus:border-xs-pink transition-all resize-none placeholder-gray-800 shadow-inner"
                            ></textarea>
                        </div>

                        <button 
                            disabled={reportState === 'submitting' || !reportDesc.trim()}
                            className="w-full py-5 bg-xs-pink text-black rounded-[1.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30 disabled:grayscale"
                        >
                            {reportState === 'submitting' ? 'Transmitting_Signal...' : 'Send_Report'}
                        </button>
                   </form>
               )}
           </Card3D>

           {/* Contact Info */}
           <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card3D glowColor="yellow" className="h-64" innerClassName="p-8">
                    <div className="flex items-center gap-4 mb-6 text-xs-yellow">
                        <ICONS.MapPin size={24} />
                        <h2 className="text-xl font-black uppercase italic tracking-tighter">Grid_Location</h2>
                    </div>
                    
                    <div className="space-y-4 text-xs font-mono text-gray-400 uppercase tracking-widest">
                        <div className="flex gap-4 items-start">
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/10"><ICONS.Home size={20} className="text-white"/></div>
                            <div>
                                <p className="font-black text-white text-sm mb-1 italic">IN.XS_NODE_ALPHA</p>
                                <p>Toronto_Sector_01</p>
                                <p>Ontario_M4J_5B6</p>
                            </div>
                        </div>
                        <div className="flex gap-4 items-center">
                            <div className="bg-white/5 p-3 rounded-2xl border border-white/10"><ICONS.Phone size={20} className="text-white"/></div>
                            <p className="font-bold">1_416_357_8000</p>
                        </div>
                    </div>
                </Card3D>

                <Card3D glowColor="cyan" className="h-64" innerClassName="p-8 flex flex-col">
                    <div className="flex items-center gap-4 mb-6 text-xs-cyan">
                        <ICONS.ShieldCheck size={24} />
                        <h2 className="text-xl font-black uppercase italic tracking-tighter">Safety_Net</h2>
                    </div>
                    <p className="text-gray-400 text-xs font-medium leading-relaxed italic mb-8">
                        Your frequency is secured by encrypted vault protocols. For deep documentation on our safety matrix, access the core portal below.
                    </p>
                    <div className="mt-auto">
                        <a href="https://www.in-xs.ca" target="_blank" rel="noreferrer" className="block w-full py-4 bg-xs-cyan/10 border border-xs-cyan/30 rounded-2xl text-center text-[10px] text-xs-cyan font-black uppercase tracking-[0.4em] hover:bg-xs-cyan hover:text-black transition-all shadow-xl">
                            Verify_Security_Portal
                        </a>
                    </div>
                </Card3D>
           </div>
       </div>
    </div>
  );
};

export default About;
