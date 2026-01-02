
import React, { useState } from 'react';
import Card3D from '../components/Card3D';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';

const About: React.FC = () => {
  const [formState, setFormState] = useState<'idle' | 'submitting' | 'success'>('idle');
  const [formData, setFormData] = useState({
      name: '',
      email: '',
      subject: '',
      message: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        soundService.play('error');
        alert("Please fill in all mandatory fields.");
        return;
    }

    soundService.play('send');
    setFormState('submitting');

    // Simulate backend automation logic (e.g. EmailJS or serverless function)
    setTimeout(() => {
      setFormState('success');
      soundService.play('success');
      
      // Reset form after delay
      setTimeout(() => {
          setFormState('idle');
          setFormData({ name: '', email: '', subject: '', message: '' });
      }, 4000);
    }, 2000);
  };

  return (
    <div className="space-y-8 px-4 pt-10 pb-24">
       {/* Header */}
       <div className="text-center space-y-2">
           <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-xs-purple via-white to-xs-cyan italic tracking-tighter uppercase">
               Mission & Support
           </h1>
           <p className="text-gray-500 text-[10px] font-mono uppercase tracking-[0.5em]">
               v2.5.0 // Operations
           </p>
       </div>

       {/* Mission & About Us */}
       <Card3D glowColor="purple" innerClassName="p-8">
           <div className="flex items-center gap-4 mb-6 text-xs-purple">
               <ICONS.Globe size={24} />
               <h2 className="text-xl font-black uppercase italic tracking-tighter">About_Us</h2>
           </div>
           <p className="text-gray-300 text-sm leading-relaxed mb-6 font-light">
               [In.xS] is an innovative gay social app designed to celebrate individual frequencies. Born from a desire to reimagine connection for the high-tech age, we provide a safe, 3D ecosystem where the LGBTQ+ community can connect with zero latency of expression.
           </p>
           <p className="text-gray-300 text-sm leading-relaxed font-light">
               Our team in Toronto is dedicated to building the future of digital identity, moving beyond the binary of flat grids into living neural networks.
           </p>
       </Card3D>

       {/* Contact Information */}
       <Card3D glowColor="cyan" innerClassName="p-8">
            <div className="flex items-center gap-4 mb-6 text-xs-cyan">
                <ICONS.MapPin size={24} />
                <h2 className="text-xl font-black uppercase italic tracking-tighter">Contact_Nodes</h2>
            </div>
            
            <div className="space-y-4">
                <a href="tel:+14163578000" onClick={() => soundService.play('click')} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group active:scale-95">
                    <div className="p-3 bg-xs-cyan/20 rounded-xl text-xs-cyan group-hover:scale-110 transition-transform"><ICONS.Phone size={20} /></div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Phone_Uplink</p>
                        <p className="text-lg font-black text-white group-hover:text-xs-cyan transition-colors">+1 (416) 357-8000</p>
                    </div>
                </a>

                <a href="mailto:in.xs@outlook.com" onClick={() => soundService.play('click')} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group active:scale-95">
                    <div className="p-3 bg-xs-purple/20 rounded-xl text-xs-purple group-hover:scale-110 transition-transform"><ICONS.MessageCircle size={20} /></div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Neural_Mail</p>
                        <p className="text-lg font-black text-white group-hover:text-xs-purple transition-colors">in.xs@outlook.com</p>
                    </div>
                </a>

                <a href="https://maps.google.com/?q=Toronto,ON,M4J5B6" target="_blank" rel="noreferrer" onClick={() => soundService.play('click')} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group active:scale-95">
                    <div className="p-3 bg-xs-pink/20 rounded-xl text-xs-pink group-hover:scale-110 transition-transform"><ICONS.MapPin size={20} /></div>
                    <div>
                        <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Base_Coordinates</p>
                        <p className="text-lg font-black text-white group-hover:text-xs-pink transition-colors">Toronto, ON, M4J 5B6</p>
                    </div>
                </a>
            </div>
       </Card3D>

       {/* Support Query Form */}
       <Card3D glowColor="yellow" innerClassName="p-8">
            <div className="flex items-center gap-4 mb-8 text-xs-yellow">
               <ICONS.ShieldCheck size={28} />
               <h2 className="text-2xl font-black uppercase italic tracking-tighter">Submit_Query</h2>
           </div>

           {formState === 'success' ? (
               <div className="flex flex-col items-center justify-center py-12 space-y-6 animate-in zoom-in duration-500">
                   <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                       <ICONS.CheckCircle size={40} className="text-green-500" />
                   </div>
                   <div className="text-center">
                       <h3 className="text-xl font-black text-white uppercase italic mb-2">Transmission_Received</h3>
                       <p className="text-gray-500 text-xs font-mono uppercase tracking-widest max-w-[200px] mx-auto">
                           Our automated support protocol has logged your request. Expect a neural link shortly.
                       </p>
                   </div>
               </div>
           ) : (
               <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Identity_Name</label>
                        <input 
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({...formData, name: e.target.value})}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-xs-yellow transition-all placeholder-gray-700 min-h-[44px]"
                            placeholder="Your Name"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Contact_Email</label>
                        <input 
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-xs-yellow transition-all placeholder-gray-700 min-h-[44px]"
                            placeholder="email@domain.com"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Subject_Line</label>
                        <input 
                            type="text"
                            value={formData.subject}
                            onChange={(e) => setFormData({...formData, subject: e.target.value})}
                            className="w-full bg-black/60 border border-white/10 rounded-2xl p-4 text-white text-sm outline-none focus:border-xs-yellow transition-all placeholder-gray-700 min-h-[44px]"
                            placeholder="Topic of Inquiry"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-2">Message_Content</label>
                        <textarea 
                            value={formData.message}
                            onChange={(e) => setFormData({...formData, message: e.target.value})}
                            className="w-full h-32 bg-black/60 border border-white/10 rounded-3xl p-4 text-white text-sm outline-none focus:border-xs-yellow transition-all resize-none placeholder-gray-700"
                            placeholder="Describe your request..."
                        ></textarea>
                    </div>

                    <button 
                        type="submit"
                        disabled={formState === 'submitting'}
                        className="w-full py-5 bg-xs-yellow text-black rounded-[1.5rem] font-black text-sm uppercase tracking-[0.4em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 mt-4 min-h-[44px] flex items-center justify-center gap-2"
                    >
                        {formState === 'submitting' ? (
                            <>
                                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                                Transmitting...
                            </>
                        ) : (
                            <>
                                <ICONS.Send size={16} /> Submit_Query
                            </>
                        )}
                    </button>
                    
                    <p className="text-center text-[7px] text-gray-600 font-mono uppercase tracking-widest pt-2">
                        By submitting, you agree to allow automated processing of your query.
                    </p>
               </form>
           )}
       </Card3D>
    </div>
  );
};

export default About;
