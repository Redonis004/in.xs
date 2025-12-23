
import React, { useRef, useState } from 'react';

interface Card3DProps {
  children: React.ReactNode;
  className?: string;
  innerClassName?: string;
  glowColor?: 'pink' | 'cyan' | 'purple' | 'yellow' | 'none';
  variant?: 'card' | 'circle';
  onClick?: (e: React.MouseEvent) => void;
  enableGlare?: boolean;
  hoverZ?: number;
}

const Card3D: React.FC<Card3DProps> = ({ 
  children, 
  className = '', 
  innerClassName = 'p-4',
  glowColor = 'none', 
  variant = 'card',
  onClick,
  enableGlare = true,
  hoverZ = 30 // Reduced default lift for subtlety
}) => {
  const [rotation, setRotation] = useState({ x: 0, y: 0 });
  const [glarePosition, setGlarePosition] = useState({ x: 50, y: 50 });
  const [opacity, setOpacity] = useState(0);
  const [activeZ, setActiveZ] = useState(0);
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const centerX = rect.width / 2;
    const centerY = rect.height / 2;

    // Smoother dampening (12 instead of 15/25)
    const intensity = variant === 'circle' ? 20 : 10; 

    const rotateX = ((y - centerY) / centerY) * -intensity; 
    const rotateY = ((x - centerX) / centerX) * intensity;

    setRotation({ x: rotateX, y: rotateY });
    setActiveZ(hoverZ);

    if (enableGlare) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        setGlarePosition({ x: glareX, y: glareY });
        setOpacity(0.5); // Subtler glare
    }
  };

  const handleMouseLeave = () => {
    setRotation({ x: 0, y: 0 });
    setOpacity(0);
    setActiveZ(0);
  };

  let glowShadow = '';
  switch (glowColor) {
    case 'pink': glowShadow = `0 20px 50px -15px rgba(255,0,255,0.3), ${rotation.y * -0.5}px ${rotation.x * 0.5}px 30px rgba(255,0,255,0.2)`; break;
    case 'cyan': glowShadow = `0 20px 50px -15px rgba(0,255,255,0.3), ${rotation.y * -0.5}px ${rotation.x * 0.5}px 30px rgba(0,255,255,0.2)`; break;
    case 'purple': glowShadow = `0 20px 50px -15px rgba(189,0,255,0.3), ${rotation.y * -0.5}px ${rotation.x * 0.5}px 30px rgba(189,0,255,0.2)`; break;
    case 'yellow': glowShadow = `0 20px 50px -15px rgba(249,249,0,0.3), ${rotation.y * -0.5}px ${rotation.x * 0.5}px 30px rgba(249,249,0,0.2)`; break;
    default: glowShadow = `0 15px 35px -10px rgba(0,0,0,0.7), ${rotation.y * -0.2}px ${rotation.x * 0.2}px 20px rgba(255,255,255,0.05)`; break;
  }

  const roundedClass = variant === 'circle' ? 'rounded-full' : 'rounded-[2rem]';
  
  return (
    <div
      ref={cardRef}
      className={`relative transition-transform duration-500 ease-out transform-gpu preserve-3d will-change-transform ${className}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        transform: `perspective(1000px) rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) translateZ(${activeZ}px)`,
        // @ts-ignore
        '--card-rx': `${rotation.x}deg`,
        '--card-ry': `${rotation.y}deg`
      } as React.CSSProperties}
    >
      <div 
        className={`h-full w-full bg-black/40 backdrop-blur-2xl border border-white/10 ${roundedClass} ${innerClassName} relative overflow-hidden transition-all duration-300`} 
        style={{ 
            transformStyle: 'preserve-3d',
            boxShadow: glowShadow
        }}
      >
        {/* Parallax Content Layer */}
        <div 
            className="relative z-10 w-full h-full" 
            style={{ 
                transform: `translateZ(${activeZ * 0.5}px)`, // Parallax depth
                transformStyle: 'preserve-3d'
            }}
        >
            {children}
        </div>
        
        {/* Shiny Internal Rim */}
        <div className={`absolute inset-0 ${roundedClass} border-t border-l border-white/10 pointer-events-none z-0`}></div>

        {/* Dynamic Light Overlay */}
        <div className={`absolute inset-0 ${roundedClass} bg-gradient-to-tr from-white/5 via-transparent to-transparent pointer-events-none z-20`}></div>

        {/* Reactive Glare */}
        {enableGlare && (
            <div 
                className={`absolute inset-0 pointer-events-none z-30 transition-opacity duration-300 mix-blend-soft-light ${roundedClass}`}
                style={{
                    opacity: opacity,
                    background: `radial-gradient(circle at ${glarePosition.x}% ${glarePosition.y}%, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0) 60%)`
                }}
            ></div>
        )}
      </div>
    </div>
  );
};

export default Card3D;
