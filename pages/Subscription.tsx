import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card3D from '../components/Card3D';
import { ICONS } from '../constants';
import { User, SubscriptionTier } from '../types';
import { soundService } from '../services/soundService';

interface SubscriptionProps {
  user: User;
  onUpgrade: (tier: SubscriptionTier) => void;
}

const Subscription: React.FC<SubscriptionProps> = ({ user, onUpgrade }) => {
  const navigate = useNavigate();
  const [selectedPlan, setSelectedPlan] = useState<{ id: SubscriptionTier, price: string, label: string } | null>(null);
  const [processing, setProcessing] = useState(false);
  const [activePaymentMethod, setActivePaymentMethod] = useState<'card' | 'wallet'>('card');
  
  // Card Form State
  const [cardName, setCardName] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  const features = [
    { icon: ICONS.Video, text: "Video & Voice Calling" },
    { icon: ICONS.MapPin, text: "Live Location Sharing" },
    { icon: ICONS.Calendar, text: "Scheduled Messaging" },
    { icon: ICONS.User, text: "Unlimited Profile Pics" },
    { icon: ICONS.Settings, text: "Change Username" },
  ];

  const plans = [
    { id: SubscriptionTier.WEEKLY, price: "$2.00", label: "Weekly", color: "text-white" },
    { id: SubscriptionTier.MONTHLY, price: "$10.00", label: "Monthly", color: "text-xs-cyan", popular: true },
    { id: SubscriptionTier.YEARLY, price: "$120.00", label: "Yearly", color: "text-xs-yellow" },
  ];

  const handlePayment = (method: string) => {
    soundService.play('click');
    if (activePaymentMethod === 'card') {
      if (!cardNumber || !expiry || !cvc || !cardName) {
        soundService.play('error');
        alert("Please fill in all card details.");
        return;
      }
    }

    setProcessing(true);
    soundService.play('send');
    
    // Simulate API Latency
    setTimeout(() => {
      setProcessing(false);
      if (selectedPlan) {
        onUpgrade(selectedPlan.id);
        soundService.play('success');
        alert(`Payment processed successfully via ${method}! You are now a Premium member.`);
        navigate('/profile');
      }
    }, 2500);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    soundService.play('typing');
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 16) value = value.slice(0, 16);
    setCardNumber(value.replace(/(\d{4})(?=\d)/g, '$1 '));
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    soundService.play('typing');
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.slice(0, 2) + '/' + value.slice(2, 4);
    }
    setExpiry(value);
  };

  if (selectedPlan) {
    return (
      <div className="pb-20 pt-4 px-4 max-w-lg mx-auto">
        <button 
          onClick={() => {
              soundService.play('click');
              setSelectedPlan(null);
          }}
          className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition-colors"
        >
          <ICONS.ArrowLeft size={20} /> Back to Plans
        </button>

        <Card3D className="mb-6 border-xs-pink/50 h-24" glowColor="pink">
          <div className="flex justify-between items-center h-full">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Order Summary <ICONS.Lock size={16} className="text-xs-pink" />
            </h2>
            <div className="text-right">
                <div className="text-sm text-gray-300">{selectedPlan.label} Subscription</div>
                <div className="text-lg font-bold text-white">{selectedPlan.price}</div>
            </div>
          </div>
        </Card3D>

        <h3 className="text-lg font-bold text-white mb-4">Payment Method</h3>
        
        {/* Payment Tabs */}
        <div className="flex bg-white/5 p-1 rounded-xl mb-6">
           <button 
             onClick={() => {
                 soundService.play('tab');
                 setActivePaymentMethod('card');
             }}
             className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activePaymentMethod === 'card' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
           >
             <ICONS.CreditCard size={18} /> Card
           </button>
           <button 
             onClick={() => {
                 soundService.play('tab');
                 setActivePaymentMethod('wallet');
             }}
             className={`flex-1 py-3 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all ${activePaymentMethod === 'wallet' ? 'bg-white text-black shadow-lg' : 'text-gray-400 hover:text-white'}`}
           >
             <ICONS.Wallet size={18} /> Wallets
           </button>
        </div>

        {activePaymentMethod === 'card' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Cardholder Name</label>
                <input 
                  type="text" 
                  value={cardName}
                  onChange={(e) => {
                      setCardName(e.target.value);
                      soundService.play('typing');
                  }}
                  placeholder="John Doe"
                  className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-xs-pink focus:ring-1 focus:ring-xs-pink outline-none transition-all"
                />
             </div>

             <div className="space-y-2">
                <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Card Number</label>
                <div className="relative">
                  <ICONS.CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                  <input 
                    type="text" 
                    value={cardNumber}
                    onChange={handleCardNumberChange}
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    className="w-full bg-black/40 border border-white/20 rounded-xl pl-12 pr-4 py-3 text-white focus:border-xs-pink focus:ring-1 focus:ring-xs-pink outline-none transition-all font-mono"
                  />
                </div>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">Expiry</label>
                  <input 
                    type="text" 
                    value={expiry}
                    onChange={handleExpiryChange}
                    maxLength={5}
                    placeholder="MM/YY"
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-xs-pink focus:ring-1 focus:ring-xs-pink outline-none transition-all text-center"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs text-gray-400 uppercase font-bold tracking-wider">CVC</label>
                  <input 
                    type="text" 
                    value={cvc}
                    onChange={(e) => {
                        setCvc(e.target.value.replace(/\D/g, '').slice(0, 4));
                        soundService.play('typing');
                    }}
                    maxLength={4}
                    placeholder="123"
                    className="w-full bg-black/40 border border-white/20 rounded-xl px-4 py-3 text-white focus:border-xs-pink focus:ring-1 focus:ring-xs-pink outline-none transition-all text-center"
                  />
                </div>
             </div>

             <button 
                onClick={() => handlePayment('Credit Card')}
                disabled={processing}
                className="w-full mt-6 py-4 bg-gradient-to-r from-xs-purple to-xs-pink rounded-xl font-black text-white text-lg shadow-[0_0_20px_rgba(255,0,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
             >
                {processing ? (
                  <>Processing...</>
                ) : (
                  <>Pay {selectedPlan.price}</>
                )}
             </button>
             
             <p className="text-center text-xs text-gray-500 mt-4 flex items-center justify-center gap-2">
               <ICONS.ShieldCheck size={12} /> Secure 256-bit SSL Encrypted Payment
             </p>
          </div>
        )}

        {activePaymentMethod === 'wallet' && (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
             <button 
                onClick={() => handlePayment('PayPal')}
                disabled={processing}
                className="w-full py-4 bg-[#0070BA] hover:bg-[#005ea6] rounded-xl font-bold text-white flex items-center justify-center gap-3 transition-transform hover:scale-[1.02] shadow-lg"
             >
                <span className="text-xl italic font-black">PayPal</span>
             </button>

             <button 
                onClick={() => handlePayment('Google Pay')}
                disabled={processing}
                className="w-full py-4 bg-black border border-white/20 hover:bg-white/10 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg"
             >
               <div className="flex items-center gap-1">
                 <span className="font-sans font-bold text-lg">G</span>
                 <span className="font-sans font-medium text-lg">Pay</span>
               </div>
             </button>

             <button 
                onClick={() => handlePayment('Samsung Wallet')}
                disabled={processing}
                className="w-full py-4 bg-[#1428a0] hover:bg-[#0f1e7a] rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-transform hover:scale-[1.02] shadow-lg"
             >
               <span className="font-sans font-bold text-lg tracking-wide">SAMSUNG</span> <span className="font-light">Wallet</span>
             </button>
             
             {processing && (
               <div className="text-center text-xs-cyan animate-pulse mt-4 font-bold">
                 Connecting to provider...
               </div>
             )}
          </div>
        )}

      </div>
    );
  }

  return (
    <div className="pb-10 pt-4">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-black bg-gradient-to-r from-xs-purple via-xs-pink to-xs-yellow bg-clip-text text-transparent mb-4">
          Go Limitless.
        </h1>
        <p className="text-gray-400">Unlock the full [in.xs] experience.</p>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
        {features.map((feat, idx) => (
          <div key={idx} className="flex items-center gap-4 p-4 bg-white/5 rounded-xl border border-white/10">
            <div className="p-2 bg-xs-pink/20 rounded-lg text-xs-pink">
              <feat.icon size={20} />
            </div>
            <span className="font-medium text-gray-200">{feat.text}</span>
          </div>
        ))}
      </div>

      {/* Plans - Smaller Tiles (Approx 1 inch height) */}
      <div className="space-y-3">
        {plans.map((plan) => (
          <Card3D 
            key={plan.id} 
            className={`relative overflow-hidden cursor-pointer h-24 ${user.subscription === plan.id ? 'border-xs-green' : ''}`}
            glowColor={plan.popular ? 'cyan' : 'purple'}
            onClick={() => {
              if (user.subscription !== plan.id) {
                soundService.play('click');
                setSelectedPlan(plan);
              }
            }}
          >
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-xs-cyan text-black text-[10px] font-bold px-2 py-0.5 rounded-bl-lg z-10">
                BEST
              </div>
            )}
            <div className="flex justify-between items-center h-full">
              <div className="flex flex-col justify-center">
                <h3 className={`text-lg font-bold leading-tight ${plan.color}`}>{plan.label}</h3>
                <span className="text-gray-500 text-xs">Billed {plan.label.toLowerCase()}</span>
              </div>
              <div className="text-right flex flex-col justify-center">
                <span className="text-xl font-bold block leading-tight">{plan.price}</span>
                {user.subscription === plan.id ? (
                    <span className="text-green-500 text-[10px] font-bold flex items-center justify-end gap-1">
                        <ICONS.ShieldCheck size={10}/> Active
                    </span>
                ) : (
                    <span className="text-xs-pink text-[10px] hover:underline cursor-pointer">Select</span>
                )}
              </div>
            </div>
          </Card3D>
        ))}
      </div>

      <p className="text-center text-xs text-gray-600 mt-8">
        Recurring billing. Cancel anytime. Terms and conditions apply. <br/>
        Your privacy is our priority.
      </p>
    </div>
  );
};

export default Subscription;