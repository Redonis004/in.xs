
import React, { useState, useEffect } from 'react';
import Card3D from './Card3D';
import { ICONS } from '../constants';
import { soundService } from '../services/soundService';

interface TopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
  currentBalance: number;
}

type PaymentMethod = 'card' | 'crypto' | 'wallet';
type CryptoType = 'BTC' | 'ETH' | 'SOL' | 'USDC';
type WalletType = 'google' | 'samsung' | 'apple' | 'paypal';

interface CryptoAsset {
  id: CryptoType;
  name: string;
  icon: string;
  address: string;
  color: string;
  rate: number; // Simulated price in USD
  networks: string[];
}

const TopUpModal: React.FC<TopUpModalProps> = ({ isOpen, onClose, onSuccess, currentBalance }) => {
  const [step, setStep] = useState<'tier' | 'payment' | 'deposit' | 'auth' | 'success'>('tier');
  const [selectedAmount, setSelectedAmount] = useState<number>(0);
  const [bonusAmount, setBonusAmount] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('card');
  const [selectedCrypto, setSelectedCrypto] = useState<CryptoType>('ETH');
  const [selectedNetwork, setSelectedNetwork] = useState<string>('Mainnet');
  const [selectedWallet, setSelectedWallet] = useState<WalletType>('google');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [depositConfirmed, setDepositConfirmed] = useState(false);

  const tiers = [
    { amount: 10, bonus: 0, label: 'Base_Fragment', color: 'xs-cyan' },
    { amount: 25, bonus: 5, label: 'Neural_Pulse', color: 'xs-purple', popular: true },
    { amount: 50, bonus: 15, label: 'Core_Synthesis', color: 'xs-pink' },
    { amount: 100, bonus: 40, label: 'Omni_Identity', color: 'xs-yellow' },
  ];

  const cryptoAssets: CryptoAsset[] = [
    { id: 'BTC', name: 'Bitcoin', icon: '₿', address: 'bc1qnx97m...v9pq4x', color: 'text-orange-500', rate: 64000, networks: ['Mainnet', 'Lightning'] },
    { id: 'ETH', name: 'Ethereum', icon: 'Ξ', address: '0x71C76...a294C5', color: 'text-blue-400', rate: 3450, networks: ['Mainnet', 'Arbitrum', 'Optimism'] },
    { id: 'SOL', name: 'Solana', icon: 'S', address: '4k3Dy...8Gz2mQ', color: 'text-purple-400', rate: 145, networks: ['Mainnet Beta'] },
    { id: 'USDC', name: 'USD Coin', icon: '$', address: '0x2791B...5c67E3', color: 'text-blue-600', rate: 1, networks: ['Ethereum', 'Polygon', 'Solana'] },
  ];

  const wallets = [
    { id: 'google', name: 'Google Pay', icon: ICONS.Smartphone, color: 'text-white' },
    { id: 'samsung', name: 'Samsung Wallet', icon: ICONS.Smartphone, color: 'text-blue-700' },
    { id: 'apple', name: 'Apple Pay', icon: ICONS.Smartphone, color: 'text-white' },
    { id: 'paypal', name: 'PayPal', icon: ICONS.MessageCircle, color: 'text-blue-500' },
  ];

  useEffect(() => {
    if (isOpen) {
        setStep('tier');
        setDepositConfirmed(false);
    }
  }, [isOpen]);

  const handleCopyAddress = (address: string) => {
    navigator.clipboard.writeText(address);
    setIsCopying(true);
    soundService.play('pop');
    setTimeout(() => setIsCopying(false), 2000);
  };

  const handleSelectTier = (amount: number, bonus: number) => {
    soundService.play('click');
    setSelectedAmount(amount);
    setBonusAmount(bonus);
    setStep('payment');
  };

  const handleProcessPayment = () => {
    soundService.play('unlock');
    if (paymentMethod === 'crypto') {
        setStep('deposit');
    } else {
        setStep('auth');
    }
  };

  const handleSimulateDeposit = () => {
      setIsProcessing(true);
      soundService.play('scan');
      // Simulate blockchain confirmation wait
      setTimeout(() => {
          setIsProcessing(false);
          setDepositConfirmed(true);
          soundService.play('success');
      }, 3000);
  };

  const handleNeuralAuth = () => {
    setIsProcessing(true);
    soundService.play('scan');
    setTimeout(() => {
      setIsProcessing(false);
      setStep('success');
      soundService.play('success');
      onSuccess(selectedAmount + bonusAmount);
    }, 2500);
  };

  if (!isOpen) return null;

  const currentCrypto = cryptoAssets.find(c => c.id === selectedCrypto)!;
  const cryptoQty = (selectedAmount / currentCrypto.rate).toFixed(6);

  return (
    <div className="fixed inset-0 z-[200] bg-black/95 backdrop-blur-3xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-xl bg-xs-dark border border-white/10 rounded-[3.5rem] p-8 md:p-12 shadow-4xl relative overflow-hidden preserve-3d">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-xs-purple/10 rounded-full blur-[120px]"></div>
        
        {step !== 'success' && (
          <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/5 rounded-full hover:bg-white/10 text-gray-500 transition-all z-50">
            <ICONS.X size={20} />
          </button>
        )}

        {step === 'tier' && (
          <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Vault_Synthesizer</h3>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.4em]">Select_Credit_Allocation_Tier</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {tiers.map((t) => (
                <Card3D 
                  key={t.amount} 
                  className="h-44 cursor-pointer group" 
                  innerClassName={`p-6 flex flex-col justify-between border-white/5 bg-black/40`} 
                  glowColor={t.color as any}
                  onClick={() => handleSelectTier(t.amount, t.bonus)}
                >
                  <div className="flex justify-between items-start">
                    <span className={`text-[8px] font-black uppercase tracking-widest text-${t.color}`}>{t.label}</span>
                    {t.popular && <span className="bg-white text-black text-[7px] font-black px-2 py-0.5 rounded-full">VALUED</span>}
                  </div>
                  <div>
                    <p className="text-4xl font-black text-white italic tracking-tighter">${t.amount}</p>
                    {t.bonus > 0 && (
                      <p className={`text-[9px] font-black text-${t.color} uppercase mt-1`}>+${t.bonus} Neural_Bonus</p>
                    )}
                  </div>
                </Card3D>
              ))}
            </div>

            <div className="p-6 bg-white/5 rounded-3xl border border-white/5 flex items-center justify-between">
               <div className="flex items-center gap-4">
                  <div className="p-3 bg-xs-yellow/20 rounded-2xl text-xs-yellow">
                    <ICONS.Wallet size={20} />
                  </div>
                  <div>
                    <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest">Active_Reserves</p>
                    <p className="text-lg font-black text-white italic tracking-tighter">${currentBalance.toFixed(2)}</p>
                  </div>
               </div>
               <ICONS.ShieldCheck size={24} className="text-gray-600" />
            </div>
          </div>
        )}

        {step === 'payment' && (
          <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
            <div className="flex items-center gap-4">
              <button onClick={() => setStep('tier')} className="p-2 text-gray-500 hover:text-white transition-colors">
                <ICONS.ArrowLeft size={24} />
              </button>
              <div>
                <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Allocation_Method</h3>
                <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">Target: ${selectedAmount} (+${bonusAmount})</p>
              </div>
            </div>

            <div className="flex bg-black/40 p-1.5 rounded-2xl border border-white/10">
              {(['card', 'crypto', 'wallet'] as PaymentMethod[]).map((m) => (
                <button 
                  key={m} 
                  onClick={() => { setPaymentMethod(m); soundService.play('tab'); }}
                  className={`flex-1 py-3 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all ${paymentMethod === m ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}
                >
                  {m}
                </button>
              ))}
            </div>

            {/* CARD VIEW */}
            {paymentMethod === 'card' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Neural_Key_Identifier</label>
                  <div className="relative group">
                    <ICONS.CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-xs-cyan" size={18} />
                    <input 
                      type="text" placeholder="XXXX XXXX XXXX XXXX" 
                      className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white text-sm font-mono focus:border-xs-cyan outline-none transition-all placeholder-gray-800" 
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Expiry</label>
                     <input type="text" placeholder="MM/YY" className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm text-center focus:border-xs-cyan outline-none transition-all" />
                  </div>
                  <div className="space-y-2">
                     <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">CVC</label>
                     <input type="text" placeholder="***" className="w-full bg-black/60 border border-white/10 rounded-2xl py-4 px-6 text-white text-sm text-center focus:border-xs-cyan outline-none transition-all" />
                  </div>
                </div>
              </div>
            )}

            {/* CRYPTO VIEW - ENHANCED */}
            {paymentMethod === 'crypto' && (
              <div className="space-y-6 animate-in fade-in duration-300">
                <div className="grid grid-cols-4 gap-2">
                  {cryptoAssets.map((crypto) => (
                    <button 
                      key={crypto.id}
                      onClick={() => { setSelectedCrypto(crypto.id); setSelectedNetwork(crypto.networks[0]); soundService.play('pop'); }}
                      className={`flex flex-col items-center p-3 rounded-2xl border-2 transition-all ${selectedCrypto === crypto.id ? 'bg-xs-cyan/10 border-xs-cyan scale-105 shadow-[0_0_15px_rgba(0,255,255,0.2)]' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                      <span className={`text-xl font-bold mb-1 ${selectedCrypto === crypto.id ? crypto.color : ''}`}>{crypto.icon}</span>
                      <span className="text-[8px] font-black uppercase tracking-tighter">{crypto.id}</span>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                    <label className="text-[9px] font-black text-gray-600 uppercase tracking-widest ml-2">Network_Protocol</label>
                    <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-2">
                        {currentCrypto.networks.map(net => (
                            <button 
                                key={net}
                                onClick={() => { setSelectedNetwork(net); soundService.play('tab'); }}
                                className={`px-4 py-2 rounded-xl border text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${selectedNetwork === net ? 'bg-xs-cyan text-black border-xs-cyan' : 'bg-white/5 text-gray-400 border-white/5'}`}
                            >
                                {net}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-4 bg-xs-cyan/5 border border-white/5 rounded-3xl flex items-center justify-between">
                    <div>
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1">Exchange_Rate</p>
                        <p className="text-xs font-mono text-white">1 {selectedCrypto} ≈ ${currentCrypto.rate.toLocaleString()}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[8px] text-gray-500 uppercase font-black tracking-widest mb-1">Conversion</p>
                        <p className="text-xs font-mono text-xs-cyan">{cryptoQty} {selectedCrypto}</p>
                    </div>
                </div>
              </div>
            )}

            {/* WALLET VIEW */}
            {paymentMethod === 'wallet' && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-2 gap-3">
                  {wallets.map((w) => (
                    <button 
                      key={w.id}
                      onClick={() => { setSelectedWallet(w.id as WalletType); soundService.play('pop'); }}
                      className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all group ${selectedWallet === w.id ? 'bg-white text-black border-white scale-102 shadow-2xl' : 'bg-black/40 border-white/5 text-gray-500 hover:border-white/20'}`}
                    >
                      <div className={`p-2 rounded-lg ${selectedWallet === w.id ? 'bg-black/10' : 'bg-white/5'}`}>
                        <w.icon size={20} className={selectedWallet === w.id ? '' : w.color} />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">{w.name}</span>
                    </button>
                  ))}
                </div>
                
                <div className="p-6 bg-black/40 border border-white/5 rounded-3xl text-center">
                   <p className="text-[9px] text-gray-500 uppercase tracking-[0.2em] mb-2">Bridge_Protocol_Ready</p>
                   <p className="text-xs font-medium text-gray-300 italic">One-tap authentication via {wallets.find(w => w.id === selectedWallet)?.name}</p>
                </div>
              </div>
            )}

            <button 
              onClick={handleProcessPayment}
              className="w-full py-5 bg-xs-cyan text-black rounded-3xl font-black text-xs uppercase tracking-[0.5em] shadow-[0_0_30px_rgba(0,255,255,0.3)] hover:scale-[1.02] active:scale-95 transition-all"
            >
              Verify_Transfer
            </button>
            
            <p className="text-center text-[8px] text-gray-600 uppercase font-mono tracking-widest flex items-center justify-center gap-2">
              <ICONS.Lock size={12} /> Encrypted Session_ID: {Math.random().toString(16).substr(2, 8).toUpperCase()}
            </p>
          </div>
        )}

        {/* NEW: DEPOSIT STEP FOR CRYPTO */}
        {step === 'deposit' && (
            <div className="space-y-6 animate-in slide-in-from-right-10 duration-500">
                <div className="flex items-center gap-4">
                    <button onClick={() => setStep('payment')} className="p-2 text-gray-500 hover:text-white transition-colors">
                        <ICONS.ArrowLeft size={24} />
                    </button>
                    <div>
                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase">Transmission_Active</h3>
                        <p className="text-[9px] text-gray-500 font-mono tracking-widest uppercase">Protocol: {selectedCrypto} on {selectedNetwork}</p>
                    </div>
                </div>

                <div className="flex flex-col items-center gap-6">
                    <div className="relative group">
                        <div className="absolute inset-0 bg-xs-cyan/20 blur-2xl group-hover:bg-xs-cyan/30 transition-all"></div>
                        <div className="relative bg-white p-6 rounded-[2.5rem] shadow-4xl transform group-hover:scale-105 transition-transform duration-500">
                            {/* Stylized Simulated QR Code */}
                            <div className="w-40 h-40 grid grid-cols-8 grid-rows-8 gap-1">
                                {[...Array(64)].map((_, i) => (
                                    <div key={i} className={`rounded-[2px] ${Math.random() > 0.4 ? 'bg-black' : 'bg-transparent'}`}></div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="w-full bg-black/60 border border-white/10 rounded-3xl p-6 space-y-4">
                        <div className="flex justify-between items-center">
                            <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Deposit_Address</span>
                            {isCopying && <span className="text-[8px] font-black text-xs-cyan uppercase animate-pulse">Copied!</span>}
                        </div>
                        <div className="flex gap-3 items-center">
                            <div className="flex-1 bg-black/40 border border-white/5 rounded-xl p-3 font-mono text-[10px] text-gray-300 truncate">
                                {currentCrypto.address}
                            </div>
                            <button 
                                onClick={() => handleCopyAddress(currentCrypto.address)}
                                className="p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
                            >
                                <ICONS.Copy size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div className="p-5 bg-xs-yellow/5 border border-xs-yellow/10 rounded-2xl flex items-center gap-3">
                    <ICONS.AlertTriangle size={20} className="text-xs-yellow flex-shrink-0" />
                    <p className="text-[9px] text-xs-yellow/80 uppercase font-black leading-tight">Identity loss is permanent if sent on incorrect network ({selectedNetwork}). Ensure amount transmitted is {cryptoQty} {selectedCrypto}.</p>
                </div>

                <button 
                    onClick={depositConfirmed ? handleNeuralAuth : handleSimulateDeposit}
                    disabled={isProcessing}
                    className={`w-full py-5 rounded-3xl font-black text-xs uppercase tracking-[0.5em] transition-all relative overflow-hidden ${depositConfirmed ? 'bg-xs-cyan text-black shadow-4xl hover:scale-[1.02]' : 'bg-white/10 text-white hover:bg-white/20'}`}
                >
                    {isProcessing ? 'SCANNING_LEDGER...' : (depositConfirmed ? 'AUTH_DEPOSIT' : 'CHECK_TRANSMISSION')}
                    {isProcessing && <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" style={{backgroundSize: '200% 100%'}}></div>}
                </button>
            </div>
        )}

        {step === 'auth' && (
          <div className="space-y-10 py-6 animate-in zoom-in-95 duration-500 flex flex-col items-center">
            <div className="text-center space-y-2">
              <h3 className="text-3xl font-black text-white italic tracking-tighter uppercase">Neural_Auth</h3>
              <p className="text-[10px] text-gray-500 font-mono tracking-[0.3em] uppercase">Biometric_Synapse_Verification</p>
            </div>

            <div className="relative w-56 h-56 flex items-center justify-center">
              <div className={`absolute inset-0 border-[3px] rounded-full transition-all duration-1000 ${isProcessing ? 'border-xs-cyan animate-spin-slow' : 'border-white/10'}`}></div>
              <div className={`absolute inset-6 border-[1px] border-dashed border-xs-purple rounded-full transition-all duration-[3000ms] ${isProcessing ? 'animate-spin scale-110 opacity-80' : 'opacity-20'}`} style={{animationDirection: 'reverse'}}></div>
              
              <button 
                onClick={handleNeuralAuth}
                disabled={isProcessing}
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center gap-3 transition-all relative overflow-hidden ${isProcessing ? 'bg-xs-cyan/20' : 'bg-white/5 hover:bg-white/10 hover:scale-105'}`}
              >
                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3 animate-pulse">
                     <ICONS.Sparkles size={40} className="text-xs-cyan animate-spin-slow" />
                     <span className="text-[8px] font-black uppercase text-xs-cyan tracking-[0.2em]">Syncing...</span>
                  </div>
                ) : (
                  <>
                    <ICONS.Locate size={48} className="text-gray-400 group-hover:text-white" />
                    <span className="text-[8px] font-black uppercase text-gray-500 tracking-[0.4em]">Touch_ID</span>
                  </>
                )}
                {/* Simulated Scanline */}
                {isProcessing && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-xs-cyan/40 to-transparent h-1/2 w-full animate-scan"></div>}
              </button>
            </div>

            <p className="text-[10px] text-gray-500 font-mono uppercase tracking-[0.5em] animate-pulse">
              {isProcessing ? 'STITCHING_NEURONS...' : 'AWAITING_BIO_SIGNAL'}
            </p>
          </div>
        )}

        {step === 'success' && (
          <div className="space-y-10 py-6 animate-in zoom-in-95 duration-700 flex flex-col items-center">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_50px_rgba(34,197,94,0.4)]">
              <ICONS.CheckCircle size={56} className="text-black" />
            </div>
            
            <div className="text-center space-y-4 w-full">
              <h3 className="text-4xl font-black text-white italic tracking-tighter uppercase">Sync_Verified</h3>
              <div className="p-8 bg-black/60 rounded-[2.5rem] border border-green-500/20 relative group">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-black text-[8px] font-black px-4 py-1 rounded-full">SUCCESS</div>
                <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest mb-1">Reserves_Allocated</p>
                <p className="text-6xl font-black text-white italic tracking-tighter">+${selectedAmount + bonusAmount}</p>
              </div>
              <p className="text-[9px] text-gray-500 font-mono uppercase tracking-[0.2em]">New_Balance: ${(currentBalance + selectedAmount + bonusAmount).toFixed(2)}</p>
            </div>

            <button 
              onClick={onClose}
              className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-xs uppercase tracking-[0.5em] shadow-4xl hover:brightness-125 transition-all"
            >
              Return_to_Identity
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default TopUpModal;
