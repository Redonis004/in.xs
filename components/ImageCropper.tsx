
import React, { useState, useRef, useEffect } from 'react';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';

interface ImageCropperProps {
  imageSrc: string;
  onCrop: (croppedImage: string) => void;
  onCancel: () => void;
}

const ImageCropper: React.FC<ImageCropperProps> = ({ imageSrc, onCrop, onCancel }) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
    setPosition({ x: clientX - dragStart.x, y: clientY - dragStart.y });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    soundService.play('success');
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const outputSize = 500;
    canvas.width = outputSize;
    canvas.height = outputSize;

    // Clear canvas
    ctx.clearRect(0, 0, outputSize, outputSize);

    // Draw the image transformed to match the view
    // We translate the center of the canvas to 0,0, apply transforms, then draw image centered
    const naturalWidth = img.naturalWidth;
    const naturalHeight = img.naturalHeight;

    ctx.save();
    ctx.translate(outputSize / 2, outputSize / 2);
    ctx.translate(position.x, position.y);
    ctx.scale(scale, scale);
    ctx.drawImage(img, -naturalWidth / 2, -naturalHeight / 2);
    ctx.restore();

    const base64 = canvas.toDataURL('image/jpeg', 0.9);
    onCrop(base64);
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 flex flex-col items-center justify-center p-4 animate-in fade-in">
        <h3 className="text-white font-black uppercase tracking-widest mb-8 text-xl italic">Crop_Visual</h3>
        
        <div 
            className="relative w-[300px] h-[300px] overflow-hidden rounded-full border-4 border-xs-cyan shadow-[0_0_50px_rgba(0,255,255,0.3)] bg-black/50 cursor-move touch-none"
            onMouseDown={handleMouseDown}
            onTouchStart={handleMouseDown}
            onMouseMove={handleMouseMove}
            onTouchMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onTouchEnd={handleMouseUp}
            onMouseLeave={handleMouseUp}
            ref={containerRef}
        >
            <img 
                ref={imgRef}
                src={imageSrc}
                alt="Crop target"
                draggable={false}
                style={{
                    transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px)) scale(${scale})`,
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transformOrigin: 'center',
                    maxWidth: 'none',
                    maxHeight: 'none'
                }}
            />
            {/* Grid overlay */}
            <div className="absolute inset-0 pointer-events-none opacity-30">
                <div className="absolute top-1/3 left-0 right-0 h-px bg-white"></div>
                <div className="absolute top-2/3 left-0 right-0 h-px bg-white"></div>
                <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white"></div>
                <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white"></div>
            </div>
        </div>

        <div className="w-[300px] mt-10 space-y-8">
            <div className="flex items-center gap-4">
                <ICONS.Minus size={16} className="text-gray-500" />
                <input 
                    type="range" 
                    min="0.5" 
                    max="3" 
                    step="0.05" 
                    value={scale} 
                    onChange={(e) => setScale(parseFloat(e.target.value))}
                    className="flex-1 accent-xs-cyan h-1 bg-white/20 rounded-full appearance-none cursor-pointer"
                />
                <ICONS.Plus size={16} className="text-gray-500" />
            </div>

            <div className="flex gap-4">
                <button 
                    onClick={() => { soundService.play('click'); onCancel(); }}
                    className="flex-1 py-4 bg-white/10 rounded-2xl font-black uppercase tracking-widest text-[10px] text-gray-400 hover:bg-white/20 hover:text-white transition-all"
                >
                    Cancel
                </button>
                <button 
                    onClick={handleCrop}
                    className="flex-1 py-4 bg-xs-cyan text-black rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-105 active:scale-95 transition-all shadow-lg"
                >
                    Confirm_Crop
                </button>
            </div>
        </div>
        
        <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ImageCropper;
