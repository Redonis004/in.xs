
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';

interface LiveStreamInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  onStartStream: () => void;
  onEndStream: () => void;
}

const LiveStreamInterface: React.FC<LiveStreamInterfaceProps> = ({ isOpen, onClose, onStartStream, onEndStream }) => {
  const [status, setStatus] = useState<'initializing' | 'ready' | 'live'>('initializing');
  const [error, setError] = useState<string | null>(null);
  const [streamDuration, setStreamDuration] = useState(0);
  
  // Media State
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      initializeStream();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const initializeStream = async () => {
    setStatus('initializing');
    setError(null);
    soundService.play('scan');

    try {
      // Request Permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }, 
        audio: true 
      });
      
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      
      soundService.play('success');
      setStatus('ready');
    } catch (err) {
      console.error("Stream Init Error:", err);
      soundService.play('error');
      setError("HARDWARE_ACCESS_DENIED // CHECK PERMISSIONS");
    }
  };

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setStreamDuration(0);
    setStatus('initializing');
  };

  const handleGoLive = () => {
    soundService.play('broadcast');
    setStatus('live');
    onStartStream();
    
    timerRef.current = window.setInterval(() => {
      setStreamDuration(prev => prev + 1);
    }, 1000);
  };

  const handleStopStream = () => {
    soundService.play('power');
    onEndStream();
    cleanup();
    onClose();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      const audioTracks = streamRef.current.getAudioTracks();
      audioTracks.forEach(track => track.enabled = !isMuted);
      setIsMuted(!isMuted);
      soundService.play('click');
    }
  };

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTracks = streamRef.current.getVideoTracks();
      videoTracks.forEach(track => track.enabled = !isCameraOff);
      setIsCameraOff(!isCameraOff);
      soundService.play('click');
    }
  };

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h > 0 ? h + ':' : ''}${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] bg-black flex flex-col animate-in fade-in duration-500 overflow-hidden font-sans">
      
      {/* Video Layer */}
      <div className="absolute inset-0 z-0">
        <video 
          ref={videoRef} 
          autoPlay 
          muted 
          playsInline 
          className={`w-full h-full object-cover transition-opacity duration-300 ${isCameraOff ? 'opacity-0' : 'opacity-100'}`} 
        />
        {isCameraOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <ICONS.CameraOff size={64} className="text-gray-700" />
            </div>
        )}
        
        {/* HUD Scanlines */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3Qgd2lkdGg9IjQwIiBoZWlnaHQ9IjEiIGZpbGw9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4wNSkiLz48L3N2Zz4=')] pointer-events-none opacity-30"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-transparent to-black/60"></div>
      </div>

      {/* HUD Interface */}
      <div className="relative z-10 flex-1 flex flex-col justify-between p-6 safe-area-inset-top safe-area-inset-bottom">
        
        {/* Top Bar */}
        <div className="flex justify-between items-start">
            <div className="flex items-center gap-3">
                <button onClick={() => { soundService.play('click'); onClose(); }} className="p-3 bg-black/40 backdrop-blur-md border border-white/10 rounded-full text-white hover:bg-white/10 transition-all">
                    <ICONS.X size={20} />
                </button>
                {status === 'live' && (
                    <div className="flex items-center gap-2 px-3 py-1.5 bg-red-500/20 border border-red-500/50 rounded-lg backdrop-blur-md">
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest">LIVE • {formatTime(streamDuration)}</span>
                    </div>
                )}
                {status === 'ready' && (
                    <div className="px-3 py-1.5 bg-xs-cyan/20 border border-xs-cyan/50 rounded-lg backdrop-blur-md">
                        <span className="text-[10px] font-black text-xs-cyan uppercase tracking-widest">SYSTEM_READY</span>
                    </div>
                )}
            </div>
            
            <div className="flex gap-2">
                <div className="p-2 bg-black/40 border border-white/10 rounded-lg">
                    <ICONS.Signal size={16} className={`transition-colors ${status === 'initializing' ? 'text-gray-500 animate-pulse' : 'text-green-500'}`} />
                </div>
                <div className="p-2 bg-black/40 border border-white/10 rounded-lg">
                    <ICONS.BatteryCharging size={16} className="text-xs-yellow" />
                </div>
            </div>
        </div>

        {/* Center Status / Error */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full text-center pointer-events-none">
            {status === 'initializing' && !error && (
                <div className="flex flex-col items-center gap-4">
                    <ICONS.Loader size={48} className="text-xs-cyan animate-spin" />
                    <p className="text-xs font-mono text-xs-cyan uppercase tracking-[0.3em] animate-pulse">Initializing_Optical_Sensors...</p>
                </div>
            )}
            {error && (
                <div className="bg-red-500/20 border border-red-500/50 p-6 rounded-3xl backdrop-blur-xl animate-in zoom-in duration-300">
                    <ICONS.AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
                    <p className="text-sm font-black text-white uppercase tracking-widest">{error}</p>
                    <p className="text-[10px] text-gray-300 mt-2">Please enable camera/microphone access in your browser settings.</p>
                </div>
            )}
        </div>

        {/* Bottom Controls */}
        <div className="space-y-6">
            {/* Stats/Info */}
            {status === 'live' && (
                <div className="flex items-center gap-4 animate-in slide-in-from-bottom-4">
                    <div className="flex -space-x-2">
                        {[1,2,3].map(i => (
                            <div key={i} className="w-8 h-8 rounded-full border-2 border-black bg-gray-800 overflow-hidden">
                                <img src={`https://picsum.photos/100/100?random=${i+50}`} className="w-full h-full object-cover" />
                            </div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-white uppercase tracking-widest bg-black/40 px-2 py-1 rounded-lg backdrop-blur-sm">
                        +12 Viewing
                    </span>
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-6">
                <button 
                    onClick={toggleMute}
                    className={`p-4 rounded-full border backdrop-blur-md transition-all active:scale-95 ${isMuted ? 'bg-white text-black border-white' : 'bg-black/40 text-white border-white/20 hover:bg-white/10'}`}
                >
                    {isMuted ? <ICONS.MicOff size={24} /> : <ICONS.Mic size={24} />}
                </button>

                {status === 'ready' && !error && (
                    <button 
                        onClick={handleGoLive}
                        className="h-20 w-20 rounded-full bg-red-500 border-4 border-red-500/30 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.6)] hover:scale-110 active:scale-95 transition-all group"
                    >
                        <div className="w-16 h-16 rounded-full border-2 border-white/20 flex items-center justify-center">
                            <div className="w-12 h-12 bg-white rounded-full group-hover:bg-red-100 transition-colors"></div>
                        </div>
                    </button>
                )}

                {status === 'live' && (
                    <button 
                        onClick={handleStopStream}
                        className="h-20 w-20 rounded-full bg-white border-4 border-white/30 flex items-center justify-center shadow-[0_0_40px_rgba(255,255,255,0.4)] hover:scale-110 active:scale-95 transition-all"
                    >
                        <div className="w-8 h-8 bg-red-500 rounded-lg"></div>
                    </button>
                )}

                <button 
                    onClick={toggleCamera}
                    className={`p-4 rounded-full border backdrop-blur-md transition-all active:scale-95 ${isCameraOff ? 'bg-white text-black border-white' : 'bg-black/40 text-white border-white/20 hover:bg-white/10'}`}
                >
                    {isCameraOff ? <ICONS.VideoOff size={24} /> : <ICONS.Video size={24} />}
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default LiveStreamInterface;
