
import React, { useState, useEffect, useRef } from 'react';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';
import Card3D from './Card3D';

interface CallInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'audio' | 'video';
  partnerName: string;
  partnerAvatar: string;
}

const CallInterface: React.FC<CallInterfaceProps> = ({ isOpen, onClose, type, partnerName, partnerAvatar }) => {
  const [callStatus, setCallStatus] = useState<'dialing' | 'connecting' | 'connected' | 'ended'>('dialing');
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      startCallSequence();
    } else {
      cleanup();
    }
    return () => cleanup();
  }, [isOpen]);

  const startCallSequence = async () => {
    setCallStatus('dialing');
    soundService.play('ring');

    try {
      // Request Media Permissions
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: type === 'video' 
      });
      
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Simulate connection delay
      setTimeout(() => {
        setCallStatus('connecting');
        soundService.play('ring'); // Second ring
        
        setTimeout(() => {
          setCallStatus('connected');
          soundService.play('success');
          // Start simulating remote video if applicable
          if (remoteVideoRef.current && type === 'video') {
             // Loop a sample video to simulate a person on the other end
             remoteVideoRef.current.src = "https://media.w3.org/2010/05/sintel/trailer.mp4"; 
             remoteVideoRef.current.loop = true;
             remoteVideoRef.current.play().catch(e => console.error("Remote video play failed", e));
          }
          // Start timer
          timerRef.current = window.setInterval(() => {
            setDuration(prev => prev + 1);
          }, 1000);
        }, 2000);
      }, 2000);

    } catch (err) {
      console.error("Media Access Error:", err);
      alert("Microphone/Camera access required for calls.");
      onClose();
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
    setDuration(0);
    setCallStatus('dialing');
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    soundService.play('hangup');
    setTimeout(onClose, 1000);
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = !isMuted);
      setIsMuted(!isMuted);
      soundService.play('click');
    }
  };

  const toggleCamera = () => {
    if (streamRef.current && type === 'video') {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = !isCameraOff);
      setIsCameraOff(!isCameraOff);
      soundService.play('click');
    }
  };

  const formatTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const s = secs % 60;
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] bg-black text-white flex flex-col overflow-hidden animate-in fade-in duration-500">
      
      {/* Background Layer - Blurs the partner avatar for ambience */}
      <div className="absolute inset-0 z-0">
        <img src={partnerAvatar} className="w-full h-full object-cover blur-3xl opacity-40 scale-110" alt="bg" />
        <div className="absolute inset-0 bg-black/60"></div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        
        {/* Remote Video / Avatar Area */}
        <div className="flex-1 relative flex items-center justify-center">
          {type === 'video' && callStatus === 'connected' ? (
            <video 
              ref={remoteVideoRef} 
              className="w-full h-full object-cover" 
              playsInline 
            />
          ) : (
            <div className="flex flex-col items-center gap-6 animate-in zoom-in duration-700">
              <div className="relative">
                <div className={`absolute inset-[-20px] rounded-full border-2 border-xs-cyan/30 ${callStatus !== 'connected' ? 'animate-ping' : ''}`}></div>
                <div className="w-32 h-32 rounded-full p-1 bg-gradient-to-br from-xs-cyan to-xs-purple shadow-4xl">
                  <img src={partnerAvatar} className="w-full h-full rounded-full object-cover border-4 border-black" alt={partnerName} />
                </div>
              </div>
              <div className="text-center space-y-2">
                <h2 className="text-3xl font-black italic tracking-tighter uppercase">{partnerName}</h2>
                <p className="text-sm font-mono text-xs-cyan uppercase tracking-[0.3em] animate-pulse">
                  {callStatus === 'dialing' ? 'Dialing...' : 
                   callStatus === 'connecting' ? 'Connecting...' : 
                   callStatus === 'ended' ? 'Call Ended' : formatTime(duration)}
                </p>
              </div>
            </div>
          )}

          {/* Local Video PIP */}
          {type === 'video' && (
            <div className="absolute top-6 right-6 w-32 h-48 bg-black rounded-2xl overflow-hidden border border-white/20 shadow-2xl transition-all hover:scale-105 active:scale-95">
               <video 
                 ref={localVideoRef} 
                 autoPlay 
                 muted 
                 playsInline 
                 className={`w-full h-full object-cover ${isCameraOff ? 'hidden' : ''}`} 
               />
               {isCameraOff && (
                 <div className="w-full h-full flex items-center justify-center bg-gray-900">
                   <ICONS.CameraOff size={24} className="text-gray-500" />
                 </div>
               )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="p-10 pb-16 flex justify-center items-center gap-6">
           <button 
             onClick={toggleMute}
             className={`p-5 rounded-full transition-all duration-300 ${isMuted ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
           >
             {isMuted ? <ICONS.MicOff size={28} /> : <ICONS.Mic size={28} />}
           </button>

           <button 
             onClick={handleEndCall}
             className="p-6 bg-red-500 text-white rounded-full shadow-[0_0_30px_rgba(239,68,68,0.5)] hover:bg-red-600 hover:scale-110 active:scale-95 transition-all"
           >
             <ICONS.PhoneOff size={32} />
           </button>

           {type === 'video' && (
             <button 
               onClick={toggleCamera}
               className={`p-5 rounded-full transition-all duration-300 ${isCameraOff ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
             >
               {isCameraOff ? <ICONS.VideoOff size={28} /> : <ICONS.Video size={28} />}
             </button>
           )}
        </div>
      </div>
    </div>
  );
};

export default CallInterface;
