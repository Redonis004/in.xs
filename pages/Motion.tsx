
import React, { useState, useRef } from 'react';
import Card3D from '../components/Card3D';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';
import { generateMotionVideo, chatWithNeuralPro } from '../services/geminiService';

const Motion = () => {
    const [image, setImage] = useState<string | null>(null);
    const [prompt, setPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [isSuggesting, setIsSuggesting] = useState(false);
    const [videoUrl, setVideoUrl] = useState<string | null>(null);
    const [progress, setProgress] = useState(0);
    const [aspectRatio, setAspectRatio] = useState<string>('9:16');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const checkKey = async () => {
        const hasKey = await (window as any).aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await (window as any).aistudio.openSelectKey();
            return true; // Proceed after dialog
        }
        return true;
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImage(reader.result as string);
                soundService.play('success');
            };
            reader.readAsDataURL(file);
        }
    };

    const handleAiSuggestion = async (theme?: string) => {
        setIsSuggesting(true);
        soundService.play('scan');
        try {
            const context = theme ? `Theme: ${theme}` : "Theme: Cyberpunk, high-fashion, LGBTQ+ aesthetic, or abstract art.";
            const response = await chatWithNeuralPro(
                `Generate a single, vivid, high-quality video generation prompt for Veo. ${context}. Focus on movement, lighting, and texture. Keep it under 25 words. Output ONLY the prompt text.`,
                [],
                "Creative Director"
            );
            setPrompt(response.text.replace(/"/g, ''));
            soundService.play('success');
        } catch (error) {
            console.error(error);
            soundService.play('error');
        } finally {
            setIsSuggesting(false);
        }
    };

    const handleGenerate = async () => {
        if (!image || !prompt) return;
        
        const ready = await checkKey();
        if (!ready) return;

        setIsGenerating(true);
        setVideoUrl(null);
        setProgress(0);
        soundService.play('unlock');

        const interval = setInterval(() => {
            setProgress(prev => (prev < 90 ? prev + 1 : prev));
        }, 800);

        try {
            const url = await generateMotionVideo(image, prompt, aspectRatio);
            setVideoUrl(url);
            setProgress(100);
            soundService.play('success');
        } catch (err) {
            console.error(err);
            soundService.play('error');
            alert("Neural synthesis failed. Ensure you have a paid API key selected.");
        } finally {
            clearInterval(interval);
            setIsGenerating(false);
        }
    };

    const SUGGESTION_CHIPS = [
        "Neon City", "Gym Pump", "Vogue Dance", "Liquid Metal", "Cyber Rain", "Prism Light"
    ];

    return (
        <div className="px-6 pt-12 space-y-12 pb-32">
            <header className="space-y-2">
                <h1 className="text-6xl font-black italic tracking-tighter uppercase bg-clip-text text-transparent bg-gradient-to-r from-xs-pink via-xs-purple to-xs-cyan">
                    Motion_Lab.
                </h1>
                <p className="text-[10px] font-black uppercase tracking-[0.6em] text-gray-500">Active motion generation</p>
            </header>

            {!videoUrl ? (
                <div className="space-y-8">
                    <Card3D 
                        className="h-[400px]" 
                        innerClassName="p-0 overflow-hidden relative"
                        onClick={() => !isGenerating && fileInputRef.current?.click()}
                    >
                        {image ? (
                            <img src={image} className="w-full h-full object-cover" alt="Source" />
                        ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-6 bg-black/40">
                                <div className="p-8 bg-xs-pink/20 rounded-full text-xs-pink animate-pulse">
                                    <ICONS.Camera size={48} />
                                </div>
                                <p className="text-sm font-black uppercase tracking-widest text-gray-500">Initialize_Visual_Asset</p>
                            </div>
                        )}
                        <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
                        
                        {isGenerating && (
                            <div className="absolute inset-0 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center p-10 space-y-8 animate-in fade-in">
                                <div className="relative w-32 h-32">
                                    <div className="absolute inset-0 border-4 border-xs-pink/20 rounded-full"></div>
                                    <div 
                                        className="absolute inset-0 border-4 border-xs-pink rounded-full transition-all duration-500" 
                                        style={{ clipPath: `inset(0 0 ${100 - progress}% 0)`, filter: 'drop-shadow(0 0 10px rgba(255,0,255,0.8))' }}
                                    ></div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <span className="text-2xl font-black text-white italic">{progress}%</span>
                                    </div>
                                </div>
                                <div className="text-center">
                                    <h3 className="text-xl font-black italic uppercase tracking-tighter text-white animate-pulse">Synthesizing_Motion...</h3>
                                    <p className="text-[8px] text-gray-500 uppercase font-mono mt-2 leading-relaxed">
                                        Veo is weaving neural fragments. <br/> This usually takes 60-120 seconds.
                                    </p>
                                </div>
                            </div>
                        )}
                    </Card3D>

                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <button 
                                onClick={() => setAspectRatio('9:16')}
                                className={`py-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all ${aspectRatio === '9:16' ? 'bg-xs-pink border-xs-pink text-black' : 'bg-white/5 border-white/10 text-gray-500'}`}
                            >
                                Portrait 9:16
                            </button>
                            <button 
                                onClick={() => setAspectRatio('16:9')}
                                className={`py-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all ${aspectRatio === '16:9' ? 'bg-xs-pink border-xs-pink text-black' : 'bg-white/5 border-white/10 text-gray-500'}`}
                            >
                                Landscape 16:9
                            </button>
                            <button 
                                onClick={() => setAspectRatio('3:4')}
                                className={`py-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all ${aspectRatio === '3:4' ? 'bg-xs-pink border-xs-pink text-black' : 'bg-white/5 border-white/10 text-gray-500'}`}
                            >
                                Portrait 3:4
                            </button>
                            <button 
                                onClick={() => setAspectRatio('4:3')}
                                className={`py-4 rounded-2xl border font-black uppercase text-[10px] tracking-widest transition-all ${aspectRatio === '4:3' ? 'bg-xs-pink border-xs-pink text-black' : 'bg-white/5 border-white/10 text-gray-500'}`}
                            >
                                Landscape 4:3
                            </button>
                        </div>

                        <div className="relative">
                            <textarea 
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe movement..."
                                className="w-full h-32 bg-black/60 border border-white/10 rounded-3xl p-6 pr-14 text-white italic outline-none focus:border-xs-pink transition-all resize-none text-sm"
                            />
                            <button 
                                onClick={() => handleAiSuggestion()}
                                disabled={isSuggesting}
                                className="absolute right-4 bottom-4 p-3 bg-white/10 hover:bg-xs-pink text-white hover:text-black rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                title="AI Inspire"
                            >
                                {isSuggesting ? <ICONS.RefreshCw size={18} className="animate-spin" /> : <ICONS.Sparkles size={18} />}
                            </button>
                        </div>

                        {/* Suggestion Chips */}
                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                            {SUGGESTION_CHIPS.map((chip, i) => (
                                <button
                                    key={i}
                                    onClick={() => handleAiSuggestion(chip)}
                                    disabled={isSuggesting}
                                    className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest text-gray-400 hover:text-xs-pink hover:border-xs-pink transition-all whitespace-nowrap active:scale-95"
                                >
                                    {chip}
                                </button>
                            ))}
                        </div>

                        <button 
                            disabled={!image || !prompt || isGenerating}
                            onClick={handleGenerate}
                            className="w-full py-6 bg-gradient-to-r from-xs-pink via-xs-purple to-xs-cyan rounded-[2rem] font-black text-black text-xl uppercase tracking-[0.4em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                        >
                            Generate
                        </button>
                    </div>
                </div>
            ) : (
                <div className="space-y-8 animate-in zoom-in-95 duration-500">
                    <Card3D className="h-[500px]" innerClassName="p-0 overflow-hidden">
                        <video 
                            src={videoUrl} 
                            controls 
                            autoPlay 
                            loop 
                            className="w-full h-full object-cover"
                        />
                    </Card3D>
                    <div className="flex gap-4">
                        <button 
                            onClick={() => setVideoUrl(null)}
                            className="flex-1 py-5 bg-white/5 border border-white/10 rounded-2xl text-white font-black uppercase tracking-widest hover:bg-white/10"
                        >
                            Reset_Lab
                        </button>
                        <a 
                            href={videoUrl} 
                            download="neural_motion.mp4"
                            className="flex-1 py-5 bg-xs-cyan text-black rounded-2xl text-center font-black uppercase tracking-widest shadow-4xl"
                        >
                            Download_Asset
                        </a>
                    </div>
                </div>
            )}

            <div className="p-8 bg-xs-cyan/5 border border-xs-cyan/20 rounded-[2.5rem] space-y-4">
                <div className="flex items-center gap-3 text-xs-cyan">
                    <ICONS.ShieldCheck size={20} />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em]">Veo_Integrity_Protocol</h4>
                </div>
                <p className="text-[11px] text-gray-400 italic leading-relaxed">
                    Veo generation requires a selected API key from a paid GCP project. You can manage your keys via 
                    <a href="https://ai.google.dev/gemini-api/docs/billing" target="_blank" className="text-xs-cyan underline ml-1">billing docs</a>. 
                    Generated assets are transient and stored in your local neural cache.
                </p>
            </div>
        </div>
    );
};

export default Motion;
