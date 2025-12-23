import React from 'react';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
}

const ShareMenu: React.FC<ShareMenuProps> = ({ isOpen, onClose, title = "Share" }) => {
  if (!isOpen) return null;

  const handleShare = (platform: string) => {
    soundService.play('click');
    // Mock share functionality
    if (platform === 'Copy Link') {
        soundService.play('success');
        alert("Link copied to clipboard!");
    } else if (platform === 'System') {
        if (navigator.share) {
            navigator.share({
                title: 'in.xs',
                text: 'Check out this profile on in.xs!',
                url: window.location.href,
            }).catch(console.error);
        } else {
            soundService.play('error');
            alert("System share not available");
        }
    } else {
        soundService.play('send');
        alert(`Sharing to ${platform} (Mock)`);
    }
    onClose();
  };

  const options = [
    { icon: ICONS.Link, label: "Copy Link", color: "text-white", bg: "bg-white/10" },
    { icon: ICONS.MessageCircle, label: "Send in Chat", color: "text-xs-cyan", bg: "bg-xs-cyan/10" },
    { icon: ICONS.Share2, label: "More...", color: "text-xs-pink", bg: "bg-xs-pink/10", action: 'System' },
    { icon: ICONS.Globe, label: "X / Twitter", color: "text-blue-400", bg: "bg-blue-400/10" },
    { icon: ICONS.Smartphone, label: "WhatsApp", color: "text-green-500", bg: "bg-green-500/10" },
    { icon: ICONS.Camera, label: "Instagram", color: "text-pink-500", bg: "bg-pink-500/10" },
  ];

  return (
    <div 
        className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-end md:items-center justify-center animate-in fade-in duration-200"
        onClick={onClose}
    >
      <div 
        className="w-full max-w-sm bg-xs-dark border-t md:border border-white/20 rounded-t-3xl md:rounded-3xl p-6 relative animate-in slide-in-from-bottom-10 duration-300 shadow-[0_-10px_40px_rgba(0,0,0,0.8)]"
        onClick={e => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6"></div>
        <h3 className="text-xl font-bold text-white mb-6 text-center flex items-center justify-center gap-2">
            <ICONS.Share2 size={20} className="text-xs-cyan" /> {title}
        </h3>

        <div className="grid grid-cols-3 gap-y-6 gap-x-4 mb-8">
            {options.map((opt, i) => (
                    <button 
                    key={i} 
                    onClick={() => handleShare(opt.action || opt.label)}
                    className="flex flex-col items-center gap-2 group"
                    >
                        <div className={`w-14 h-14 rounded-2xl ${opt.bg} flex items-center justify-center border border-white/5 group-hover:scale-110 group-hover:border-white/20 transition-all shadow-lg`}>
                            <opt.icon size={24} className={opt.color} />
                        </div>
                        <span className="text-[10px] text-gray-400 font-bold group-hover:text-white transition-colors">{opt.label}</span>
                    </button>
            ))}
        </div>

        <button 
            onClick={() => {
                soundService.play('click');
                onClose();
            }}
            className="w-full py-3.5 bg-white/5 rounded-xl font-bold text-gray-400 hover:text-white hover:bg-white/10 transition-colors border border-white/5"
        >
            Cancel
        </button>
      </div>
    </div>
  );
};

export default ShareMenu;