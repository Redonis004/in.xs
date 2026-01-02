
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';
import { chatWithNeuralPro, searchPlacesGrounded } from '../services/geminiService';
import Card3D from '../components/Card3D';

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

const SupportChat: React.FC = () => {
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: "Greetings. I am the Neural Architect, your AI support interface for [in.xs]. How can I assist with your grid experience today?", timestamp: Date.now() }
    ]);
    const [inputText, setInputText] = useState('');
    const [isThinking, setIsThinking] = useState(false);
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

    return (
        <div className="flex flex-col h-full pt-10 pb-28 px-4">
            <header className="mb-6 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white italic tracking-tighter uppercase flex items-center gap-3">
                        <ICONS.Bot size={32} className="text-xs-cyan" />
                        AI Support
                    </h1>
                    <p className="text-[9px] font-black uppercase text-gray-500 tracking-[0.4em] mt-1 ml-1">Neural Architect Online</p>
                </div>
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
        </div>
    );
};

export default SupportChat;
