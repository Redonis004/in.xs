
import React, { useState, useEffect } from 'react';
import Card3D from './Card3D';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amount: number, note: string, type: 'send' | 'request' | 'crypto') => void;
  recipientName: string;
  recipientAvatar: string;
  currentBalance: number;
  initialType?: 'send' | 'request';
}

const TransactionModal: React.FC<TransactionModalProps> = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  recipientName, 
  recipientAvatar,
  currentBalance,
  initialType = 'send'
}) => {
  const [type, setType] = useState<'send' | 'request' | 'crypto'>(initialType);
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [selectedCoin, setSelectedCoin] = useState('ETH');
  const [step, setStep] = useState<'input' | 'verify' | 'success'>('input');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isCopying, setIsCopying] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep('input');
      setAmount('');
      setNote('');
      setIsVerifying(false);
      setType(initialType);
    }
  }, [isOpen, initialType]);

  if (!isOpen) return null;

  const handleCopyAddress = () => {
    const mockAddr = `0x${Math.random().toString(16).slice(2, 10)}...${Math.random().toString(16).slice(2, 6)}`;
    navigator.clipboard.writeText(mockAddr);
    setIsCopying(true);
    soundService.play('pop');
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleNext = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
        soundService.play('error');
        alert("Enter a valid amount.");
        return;
    }
    if (type === 'send' && num > currentBalance) {
        soundService.play('error');
        alert("Insufficient Neural Credits in your Vault.");
        return;
    }
    soundService.play('click');
    setStep('verify');
  };

  const handleVerify = () => {
    soundService.play('unlock');
    setIsVerifying(true);
    
    setTimeout(() => {
        setIsVerifying(false);
        setStep('success');
        soundService.play('success');
        onConfirm(parseFloat(amount), note, type);
    }, 2500);
  };

  const mainColor = type === 'send' ? 'xs-yellow' : (type === 'request' ? 'xs-cyan' : 'xs-purple');

  return (
    <div className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-xs-dark border border-white/10 rounded-[3.5rem] p-10 shadow-4xl relative overflow-hidden preserve-3d">
        <div className={`absolute inset-0 pointer-events-none opacity-10 bg-[radial-gradient(circle_at_center,var(--${mainColor})_0%,transparent_70%)]`}></div>
        
        {step !== 'success' && (
            <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500 transition-all">
                <ICONS.X size={20} />
            </button>
        )}

        {step === 'input' && (
            <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
                    <button 
                        onClick={() => { setType('send'); soundService.play('tab'); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${type === 'send' ? 'bg-xs-yellow text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Credits
                    </button>
                    <button 
                        onClick={() => { setType('crypto'); soundService.play('tab'); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${type === 'crypto' ? 'bg-xs-purple text-white shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Crypto
                    </button>
                    <button 
                        onClick={() => { setType('request'); soundService.play('tab'); }}
                        className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${type === 'request' ? 'bg-xs-cyan text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                    >
                        Request
                    </button>
                </div>

                <div className="text-center space-y-4">
                    <div className={`w-20 h-20 mx-auto rounded-full p-1 bg-gradient-to-tr from-${mainColor} to-black shadow-xl`}>
                        <img src={recipientAvatar} className="w-full h-full rounded-full object-cover border-2 border-xs-dark" alt="Recipient" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase leading-tight">
                            {type === 'send' ? 'Transfer_Sync' : (type === 'crypto' ? 'Blockchain_Direct' : 'Request_Protocol')}
                        </h3>
                        <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.3em]">{type === 'request' ? 'From:' : 'To:'} {recipientName}</p>
                    </div>
                </div>

                {type === 'crypto' && (
                    <div className="grid grid-cols-4 gap-2 mb-2">
                        {['BTC', 'ETH', 'SOL', 'USDC'].map(coin => (
                            <button 
                                key={coin}
                                onClick={() => { setSelectedCoin(coin); soundService.play('pop'); }}
                                className={`py-2 rounded-xl border text-[8px] font-black transition-all ${selectedCoin === coin ? 'bg-xs-purple border-xs-purple text-white' : 'bg-white/5 border-white/5 text-gray-500'}`}
                            >
                                {coin}
                            </button>
                        ))}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="relative group">
                        <div className={`absolute left-6 top-1/2 -translate-y-1/2 text-${mainColor} font-black text-2xl group-focus-within:animate-pulse`}>
                            {type === 'crypto' ? (selectedCoin === 'USDC' ? '$' : 'Ξ') : '$'}
                        </div>
                        <input 
                            type="number" 
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); soundService.play('typing'); }}
                            placeholder="0.00"
                            className={`w-full bg-black/60 border border-white/10 rounded-3xl py-8 pl-14 pr-8 text-white text-5xl font-black italic outline-none focus:border-${mainColor} transition-all placeholder-gray-800 tracking-tighter`}
                        />
                        <div className="absolute bottom-4 right-8 text-[9px] font-mono text-gray-600 uppercase tracking-widest">
                            {type === 'crypto' ? selectedCoin : 'Neural_Credits'}
                        </div>
                    </div>

                    {type === 'crypto' && (
                        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{recipientName}'s ID</span>
                                {isCopying && <span className="text-[8px] font-black text-xs-cyan uppercase animate-pulse">Copied</span>}
                            </div>
                            <div className="flex gap-2 items-center">
                                <div className="flex-1 bg-black/40 px-3 py-2 rounded-xl font-mono text-[9px] text-gray-400 truncate">
                                    {`0x${Math.random().toString(16).slice(2, 22).toUpperCase()}`}
                                </div>
                                <button onClick={handleCopyAddress} className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-white"><ICONS.Copy size={14}/></button>
                            </div>
                        </div>
                    )}
                    
                    <input 
                        type="text"
                        value={note}
                        onChange={(e) => { setNote(e.target.value); soundService.play('typing'); }}
                        placeholder={`Add ${type} memo (optional)...`}
                        className="w-full bg-black/40 border border-white/5 rounded-2xl p-5 text-gray-300 italic outline-none focus:border-xs-purple transition-all text-sm placeholder-gray-700"
                    />
                </div>

                {type === 'send' && (
                    <div className="flex justify-between items-center px-4">
                        <span className="text-[10px] text-gray-500 font-black uppercase tracking-widest">Available Credits</span>
                        <span className="text-sm font-black text-white italic">${currentBalance.toFixed(2)}</span>
                    </div>
                )}

                <button 
                    onClick={handleNext}
                    className={`w-full py-6 bg-${mainColor} text-${type === 'crypto' ? 'white' : 'black'} rounded-3xl font-black text-xl uppercase tracking-[0.4em] shadow-4xl hover:scale-[1.02] active:scale-95 transition-all`}
                >
                    Review {type === 'crypto' ? 'Chain_Sync' : 'Protocol'}
                </button>
            </div>
        )}

        {step === 'verify' && (
            <div className="space-y-10 py-4 animate-in zoom-in-95 duration-500">
                <div className="text-center space-y-2">
                    <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Identity_Confirm</h3>
                    <p className="text-xs text-gray-500 font-medium tracking-wide">
                        {type === 'crypto' ? `Sending ${amount} ${selectedCoin} to ${recipientName}` : (type === 'send' ? `Syncing $${amount} to ${recipientName}` : `Requesting $${amount} from ${recipientName}`)}
                    </p>
                </div>

                <div className="relative w-48 h-48 mx-auto flex items-center justify-center">
                    <div className={`absolute inset-0 border-4 rounded-full transition-all duration-1000 ${isVerifying ? `border-${mainColor} animate-spin-slow` : 'border-white/10'}`}></div>
                    <div className={`absolute inset-4 border-2 border-dashed rounded-full transition-all duration-1000 ${isVerifying ? 'border-xs-purple animate-spin-slow scale-110 opacity-60' : 'border-white/5 opacity-20'}`} style={{animationDirection: 'reverse'}}></div>
                    
                    <button 
                        onClick={handleVerify}
                        disabled={isVerifying}
                        className={`w-32 h-32 rounded-full flex flex-col items-center justify-center gap-2 transition-all ${isVerifying ? `bg-${mainColor}/20 scale-110` : 'bg-white/5 hover:bg-white/10 hover:scale-105'}`}
                    >
                        {isVerifying ? (
                            <ICONS.ShieldCheck size={40} className={`text-${mainColor} animate-pulse`} />
                        ) : (
                            <>
                                <ICONS.Locate size={32} className="text-gray-400" />
                                <span className="text-[8px] font-black uppercase text-gray-500 tracking-widest">Sync_Bio</span>
                            </>
                        )}
                    </button>
                </div>

                <p className="text-center text-[9px] text-gray-600 uppercase font-mono tracking-[0.2em] animate-pulse">
                    {isVerifying ? 'Broadcasting_to_Ledger...' : 'Awaiting_Biometric_Pulse'}
                </p>

                {!isVerifying && (
                    <button onClick={() => setStep('input')} className="w-full py-4 text-gray-500 text-[10px] font-black uppercase tracking-[0.4em] hover:text-white transition-all">
                        Edit_Parameters
                    </button>
                )}
            </div>
        )}

        {step === 'success' && (
            <div className="space-y-10 py-4 animate-in zoom-in-95 duration-700">
                <div className={`w-24 h-24 mx-auto bg-${type === 'send' || type === 'crypto' ? 'green-500' : 'xs-cyan'} rounded-full flex items-center justify-center shadow-4xl animate-heart-burst`}>
                    <ICONS.CheckCircle size={48} className="text-black" />
                </div>
                
                <div className="text-center space-y-4">
                    <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">
                        {type === 'crypto' ? 'Direct_Linked' : (type === 'send' ? 'Sync_Linked' : 'Request_Sent')}
                    </h3>
                    <div className={`p-6 bg-black/40 rounded-3xl border border-${mainColor}/20`}>
                        <p className="text-xs text-gray-500 uppercase font-black tracking-widest mb-1">
                            {type === 'crypto' ? 'Ledger Entry Confirmed' : (type === 'send' ? 'Transfer Complete' : 'Network Request Open')}
                        </p>
                        <p className={`text-5xl font-black text-${mainColor} italic tracking-tighter`}>
                            {type === 'crypto' ? '' : '$'}{amount}{type === 'crypto' ? ` ${selectedCoin}` : ''}
                        </p>
                    </div>
                    <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.2em]">Hash: {Math.random().toString(36).substr(2, 16).toUpperCase()}</p>
                </div>

                <button 
                    onClick={onClose}
                    className="w-full py-6 bg-white text-black rounded-3xl font-black text-xl uppercase tracking-[0.4em] shadow-4xl active:scale-95 transition-all"
                >
                    Close_Link
                </button>
            </div>
        )}
      </div>
    </div>
  );
};

export default TransactionModal;
