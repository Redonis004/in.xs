
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';
import { chatWithNeuralPro, searchPlacesGrounded } from '../services/geminiService';
import Card3D from '../components/Card3D';

interface SupportChatProps {
    onSignOut?: () => void;
    onDeleteAccount?: () => void;
}

interface Message {
    role: 'user' | 'model';
    text: string;
    timestamp: number;
    links?: { uri: string, title: string, snippet?: string }[];
}

const SUGGESTIONS = [
    "Where is in.xs HQ?",
    "How do I verify my account?",
    "What are 'Oinks'?",
    "Upgrade my subscription",
    "Privacy & Safety",
    "Report a user",
];

const SupportChat: React.FC<SupportChatProps> = ({ onSignOut, onDeleteAccount }) => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Greetings. I am the Neural Architect, your AI support interface for [in.xs]. How can I assist with your grid experience today?", timestamp: Date.now() }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
    const [showAccountOptions, setShowAccountOptions] = useState(false);
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isThinking]);

    const handleSend = async (textOverride?: string) => {
        const textToSend = textOverride || inputText;
        if (!textToSend.trim()) return;
        
        const userMsg: Message = { role: 'user', text: textToSend, timestamp: Date.now() };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsThinking(true);
        soundService.play('send');

        try {
            let responseText = "";
            let responseLinks: any[] = [];

            const lowMsg = textToSend.toLowerCase();
            // Check for location intent to use Maps Grounding
            if (lowMsg.includes('where') || lowMsg.includes('location') || lowMsg.includes('near') || lowMsg.includes('office') || lowMsg.includes('hq') || lowMsg.includes('place')) {
                 let lat, lng;
                 try {
                     const loc = await new Promise<GeolocationPosition>((res, rej) => 
                         navigator.geolocation.getCurrentPosition(res, rej, { timeout: 5000 })
                     );
                     lat = loc.coords.latitude;
                     lng = loc.coords.longitude;
                 } catch (e) {
                     console.warn("Geo-lock failed");
                 }
                 const mapsResponse = await searchPlacesGrounded(textToSend, lat, lng);
                 responseText = mapsResponse.text;
                 responseLinks = mapsResponse.mapsLinks;
            } else {
                // Prepare history for context
                const history = messages.map(m => ({ role: m.role, text: m.text }));
                // Call Gemini 3 Pro
                const response = await chatWithNeuralPro(textToSend, history, 'Helpful Support');
                responseText = response.text;
                responseLinks = response.mapsLinks || [];
            }
            
            const botMsg: Message = { role: 'model', text: responseText, links: responseLinks, timestamp: Date.now() };
            setMessages(prev => [...prev, botMsg]);
            soundService.play('success');
        } catch (error) {
            console.error("Support Chat Error", error);
            const errorMsg: Message = { role: 'model', text: "My neural link is experiencing latency. Please try again shortly.", timestamp: Date.now() };
            setMessages(prev => [...prev, errorMsg]);
            soundService.play('error');
        } finally {
            setIsThinking(false);
        }
    };

    const handleDeactivate = () => {
        if (onSignOut) {
            if (confirm("Deactivate your profile? You can reactivate by signing in again.")) {
                soundService.play('lock');
                onSignOut();
            }
        }
    };

    const handleDelete = () => {
        if (onDeleteAccount) {
            soundService.play('error'); // Alert sound
            setShowDeleteConfirm(true);
        }
    };

    const confirmDelete = () => {
        if (onDeleteAccount) {
            setShowDeleteConfirm(false);
            onDeleteAccount();
        }
    };

    return (
        <div className="flex flex-col h-full pt-10 pb-28 px-4 relative">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                        <ICONS.Bot size={32} className="text-xs-cyan" />
                        AI Support
                    </h1>
                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.4em] mt-1 ml-1">Neural Architect Online</p>
                </div>
                <button 
                    onClick={() => setShowAccountOptions(true)} 
                    className="p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-400 hover:text-white transition-all border border-white/5"
                >
                    <ICONS.UserX size={20} />
                </button>
            </header>

            <div className="flex-1 overflow-hidden relative rounded-[2.5rem] border border-white/10 bg-black/40 backdrop-blur-3xl shadow-4xl flex flex-col">
                {/* Chat Area */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar" ref={scrollRef}>
                    {messages.map((msg, idx) => (
                        <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
                            <div 
                                className={`max-w-[85%] p-4 rounded-2xl text-sm font-medium leading-relaxed shadow-lg ${
                                    msg.role === 'user' 
                                    ? 'bg-xs-cyan/10 border border-xs-cyan/30 text-white rounded-tr-none' 
                                    : 'bg-white/5 border border-white/10 text-gray-200 rounded-tl-none'
                                }`}
                            >
                                {msg.text}
                            </div>
                            {msg.links && msg.links.length > 0 && (
                                <div className={`mt-2 max-w-[85%] flex flex-col gap-2 ${msg.role === 'user' ? 'mr-2' : 'ml-2'}`}>
                                    {msg.links.map((link, i) => (
                                        <a 
                                            key={i} 
                                            href={link.uri} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="bg-black/40 border border-white/10 p-3 rounded-xl hover:border-xs-cyan/50 transition-all group"
                                        >
                                            <div className="flex items-center gap-2 text-xs-cyan font-bold text-xs mb-1">
                                                <ICONS.MapPin size={12} /> {link.title}
                                            </div>
                                            {link.snippet && <p className="text-[10px] text-gray-400 italic line-clamp-2">"{link.snippet}"</p>}
                                        </a>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                    {isThinking && (
                        <div className="flex justify-start animate-in fade-in">
                            <div className="bg-white/5 border border-white/10 text-gray-400 px-4 py-3 rounded-2xl rounded-tl-none text-xs font-mono animate-pulse flex items-center gap-2">
                                <ICONS.Sparkles size={12} className="animate-spin" />
                                <span className="uppercase tracking-widest">Processing_Neural_Request...</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Suggestions & Input Area */}
                <div className="bg-black/60 border-t border-white/10 p-4 space-y-4">
                    {/* Suggestions Chips */}
                    {messages.length < 3 && !isThinking && (
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {SUGGESTIONS.map((s, i) => (
                                <button 
                                    key={i}
                                    onClick={() => handleSend(s)}
                                    className="whitespace-nowrap px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-xs-cyan transition-all active:scale-95"
                                >
                                    {s}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="flex gap-2 relative">
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                            placeholder="Ask a question..."
                            className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-white focus:border-xs-cyan outline-none transition-all placeholder-gray-600 font-medium text-sm"
                            disabled={isThinking}
                        />
                        <button 
                            onClick={() => handleSend()}
                            disabled={!inputText.trim() || isThinking}
                            className={`p-4 rounded-2xl transition-all flex items-center justify-center aspect-square ${
                                inputText.trim() && !isThinking
                                ? 'bg-xs-cyan text-black hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.4)]' 
                                : 'bg-white/5 text-gray-600'
                            }`}
                        >
                            <ICONS.Send size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* Account Options Modal */}
            {showAccountOptions && (
                <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in">
                    <div className="w-full max-w-sm glass-panel border border-white/20 rounded-[2.5rem] p-8 shadow-4xl relative overflow-hidden">
                        <header className="flex justify-between items-center mb-8">
                            <div>
                                <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white">Account_Core</h3>
                                <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.2em]">Management_Protocol</p>
                            </div>
                            <button onClick={() => setShowAccountOptions(false)} className="p-2 bg-white/5 rounded-full hover:bg-white/10 text-gray-500"><ICONS.X size={20}/></button>
                        </header>

                        <div className="space-y-4">
                            <button 
                                onClick={() => { soundService.play('click'); onSignOut && onSignOut(); }}
                                className="w-full py-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all"
                            >
                                <ICONS.LogOut size={16} /> Log Out_Session
                            </button>
                            
                            <button 
                                onClick={handleDeactivate}
                                className="w-full py-4 bg-xs-yellow/10 hover:bg-xs-yellow/20 border border-xs-yellow/30 text-xs-yellow rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all"
                            >
                                <ICONS.Power size={16} /> Deactivate_Profile
                            </button>

                            <button 
                                onClick={handleDelete}
                                className="w-full py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-500 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-3 transition-all mt-4"
                            >
                                <ICONS.Trash2 size={16} /> Delete_Account
                            </button>
                        </div>
                        
                        <p className="text-center text-[8px] text-gray-600 mt-8 font-mono uppercase tracking-widest">
                            Warning: Deletion is permanent and irreversible.
                        </p>
                    </div>
                </div>
            )}

            {/* Delete Confirmation */}
            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[60] bg-black/95 flex items-center justify-center p-6 animate-in zoom-in-95 duration-200">
                    <div className="w-full max-w-sm bg-xs-dark border-2 border-red-500 rounded-[3rem] p-8 shadow-[0_0_50px_rgba(239,68,68,0.3)] text-center">
                        <ICONS.AlertTriangle size={64} className="text-red-500 mx-auto mb-6 animate-pulse" />
                        <h3 className="text-3xl font-black italic uppercase tracking-tighter text-white mb-2">Final_Warning</h3>
                        <p className="text-sm font-medium text-gray-300 leading-relaxed mb-8">
                            You are about to permanently erase your identity from the [in.xs] grid. This action cannot be undone. All matches, chats, and data will be lost.
                        </p>
                        <div className="space-y-3">
                            <button 
                                onClick={confirmDelete}
                                className="w-full py-5 bg-red-500 text-white rounded-2xl font-black uppercase text-xs tracking-[0.4em] shadow-lg hover:scale-[1.02] active:scale-95 transition-all"
                            >
                                Confirm_Delete
                            </button>
                            <button 
                                onClick={() => setShowDeleteConfirm(false)}
                                className="w-full py-5 bg-white/5 text-gray-400 hover:text-white rounded-2xl font-black uppercase text-xs tracking-[0.4em] transition-all"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SupportChat;
