
import React, { useState, useEffect } from 'react';
import Card3D from '../components/Card3D';
import { ICONS } from '../constants';
import { User } from '../types';
import { soundService } from '../services/soundService';

interface RideShareProps {
    user: User;
    onUpdateUser: (data: Partial<User>) => void;
}

type RideState = 'unlinked' | 'linking' | 'idle' | 'selecting' | 'confirming' | 'active' | 'arrived';

const VEHICLES = [
    { id: 'lite', name: 'Hopp Lite', eta: '4 min', priceBase: 8.00, multiplier: 1.2, seats: 3, image: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=600&auto=format&fit=crop' },
    { id: 'plus', name: 'Hopp XL', eta: '6 min', priceBase: 12.00, multiplier: 1.5, seats: 5, image: 'https://images.unsplash.com/photo-1503376763036-066120622c74?q=80&w=600&auto=format&fit=crop' },
    { id: 'luxe', name: 'Hopp Luxe', eta: '9 min', priceBase: 20.00, multiplier: 2.0, seats: 3, image: 'https://images.unsplash.com/photo-1563720379-b56731959735?q=80&w=600&auto=format&fit=crop' },
];

const RideShare: React.FC<RideShareProps> = ({ user, onUpdateUser }) => {
    const [state, setState] = useState<RideState>('unlinked');
    const [pickup, setPickup] = useState('Current Location');
    const [destination, setDestination] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
    const [mapUrl, setMapUrl] = useState('');
    const [driver, setDriver] = useState<any>(null);
    const [progress, setProgress] = useState(0);
    const [estimatedPrice, setEstimatedPrice] = useState(0);

    // Simulate Hopp Account Link Status
    useEffect(() => {
        const isLinked = localStorage.getItem('inxs_hopp_linked') === 'true';
        if (isLinked) setState('idle');
        generateMapUrl();
    }, []);

    const generateMapUrl = (lat = 40.7128, lng = -74.0060) => {
        const uLat = user.location?.lat || lat;
        const uLng = user.location?.lng || lng;
        // Customized map style to look like a GPS navigation system
        const url = `https://maps.googleapis.com/maps/api/staticmap?center=${uLat},${uLng}&zoom=14&size=600x600&maptype=roadmap&markers=color:0x00ff00%7Clabel:A%7C${uLat},${uLng}&style=feature:all%7Celement:geometry%7Ccolor:0x242f3e&style=feature:all%7Celement:labels.text.stroke%7Cvisibility:off&style=feature:all%7Celement:labels.text.fill%7Ccolor:0x746855&style=feature:administrative.locality%7Celement:labels.text.fill%7Ccolor:0xd59563&style=feature:poi%7Celement:labels.text.fill%7Ccolor:0xd59563&style=feature:poi.park%7Celement:geometry%7Ccolor:0x263c3f&style=feature:poi.park%7Celement:labels.text.fill%7Ccolor:0x6b9a76&style=feature:road%7Celement:geometry%7Ccolor:0x38414e&style=feature:road%7Celement:geometry.stroke%7Ccolor:0x212a37&style=feature:road%7Celement:labels.text.fill%7Ccolor:0x9ca5b3&style=feature:road.highway%7Celement:geometry%7Ccolor:0x746855&style=feature:road.highway%7Celement:geometry.stroke%7Ccolor:0x1f2835&style=feature:road.highway%7Celement:labels.text.fill%7Ccolor:0xf3d19c&style=feature:transit%7Celement:geometry%7Ccolor:0x2f3948&style=feature:transit.station%7Celement:labels.text.fill%7Ccolor:0xd59563&style=feature:water%7Celement:geometry%7Ccolor:0x17263c&style=feature:water%7Celement:labels.text.fill%7Ccolor:0x515c6d&style=feature:water%7Celement:labels.text.stroke%7Ccolor:0x17263c&key=${process.env.API_KEY}`;
        setMapUrl(url);
    };

    const handleLinkAccount = () => {
        soundService.play('click');
        setState('linking');
        setTimeout(() => {
            localStorage.setItem('inxs_hopp_linked', 'true');
            setState('idle');
            soundService.play('success');
        }, 2500);
    };

    const handleSearch = () => {
        if (!destination.trim()) return;
        soundService.play('click');
        setState('selecting');
    };

    const handleSelectVehicle = (v: any) => {
        soundService.play('click');
        setSelectedVehicle(v);
        // Simulate dynamic pricing based on "distance" (randomized for demo)
        const distanceFactor = Math.random() * 5 + 2; 
        setEstimatedPrice(v.priceBase * distanceFactor);
    };

    const handleConfirmRide = () => {
        if (!selectedVehicle) return;
        if (user.walletBalance < estimatedPrice) {
            soundService.play('error');
            alert(`Insufficient funds. Need $${estimatedPrice.toFixed(2)} CAD.`);
            return;
        }

        setState('confirming');
        soundService.play('unlock');

        // Simulate network matching
        setTimeout(() => {
            const newBalance = user.walletBalance - estimatedPrice;
            onUpdateUser({ walletBalance: newBalance });
            
            setDriver({
                name: ['Liam', 'Noah', 'Ethan', 'Oliver'][Math.floor(Math.random() * 4)],
                rating: (4.5 + Math.random() * 0.5).toFixed(1),
                plate: 'HP-' + Math.floor(Math.random() * 9000 + 1000),
                car: selectedVehicle.name,
                image: 'https://picsum.photos/100/100?random=driver'
            });

            setState('active');
            soundService.play('success');
            
            // Simulate ride progress
            let p = 0;
            const interval = setInterval(() => {
                p += 2; // Slower progress for realism
                setProgress(p);
                if (p >= 100) {
                    clearInterval(interval);
                    setState('arrived');
                    soundService.play('success');
                }
            }, 500);
        }, 3000);
    };

    const resetRide = () => {
        setDestination('');
        setPickup('Current Location');
        setSelectedVehicle(null);
        setDriver(null);
        setProgress(0);
        setState('idle');
        soundService.play('click');
    };

    return (
        <div className="px-4 pt-10 pb-32 h-full flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center mb-6">
                <div>
                    <h1 className="text-4xl font-black italic tracking-tighter uppercase text-white flex items-center gap-2">
                        <span className="text-green-500">Hopp</span> <span className="text-gray-600">x</span> in.xs
                    </h1>
                    <p className="text-[10px] font-black uppercase text-gray-500 tracking-[0.4em]">Integrated_Transport_Grid</p>
                </div>
                <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-xl flex items-center gap-2">
                    <ICONS.Wallet size={16} className="text-xs-yellow" />
                    <span className="text-xs font-black text-white font-mono">${user.walletBalance.toFixed(2)}</span>
                </div>
            </header>

            {state === 'unlinked' && (
                <div className="flex-1 flex flex-col justify-center items-center space-y-8 animate-in zoom-in duration-500">
                    <Card3D className="w-full max-w-sm" innerClassName="p-10 flex flex-col items-center text-center bg-black/60 border-green-500/30" glowColor="cyan">
                        <div className="w-24 h-24 bg-green-500/20 rounded-full flex items-center justify-center border-2 border-green-500 mb-6 shadow-[0_0_30px_rgba(34,197,94,0.4)]">
                            <ICONS.Car size={48} className="text-green-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-4">Link Hopp Account</h2>
                        <p className="text-xs text-gray-400 font-medium leading-relaxed mb-8">
                            Authorize [in.xs] to access your Hopp profile for seamless ride requests, GPS tracking, and automated wallet payments.
                        </p>
                        <button 
                            onClick={handleLinkAccount}
                            className="w-full py-4 bg-green-500 hover:bg-green-400 text-black rounded-2xl font-black uppercase tracking-[0.3em] transition-all shadow-lg shadow-green-500/20"
                        >
                            Connect Securely
                        </button>
                    </Card3D>
                </div>
            )}

            {state === 'linking' && (
                <div className="flex-1 flex flex-col justify-center items-center space-y-6">
                    <div className="w-16 h-16 border-4 border-t-green-500 border-r-transparent border-b-green-500 border-l-transparent rounded-full animate-spin"></div>
                    <p className="text-xs font-black uppercase tracking-[0.3em] text-green-500 animate-pulse">Establishing_Handshake...</p>
                </div>
            )}

            {(state !== 'unlinked' && state !== 'linking') && (
                <div className="flex-1 flex flex-col gap-6 relative">
                    {/* Map Display */}
                    <div className="relative w-full aspect-square rounded-[2.5rem] overflow-hidden border border-white/10 shadow-4xl bg-xs-dark group">
                        <img 
                            src={mapUrl} 
                            className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-all duration-700" 
                            alt="GPS Map"
                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1000&auto=format&fit=crop'; }}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/40"></div>
                        
                        {/* User Pin */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                            <div className="relative">
                                <div className="absolute inset-[-30px] bg-green-500/10 rounded-full animate-ping"></div>
                                <div className="p-3 bg-black rounded-full border-2 border-green-500 text-green-500 shadow-2xl z-10 relative">
                                    <ICONS.Navigation size={24} fill="currentColor" />
                                </div>
                            </div>
                        </div>

                        {/* Status Overlay */}
                        <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
                            <div className="bg-black/80 backdrop-blur-md rounded-xl p-3 border border-green-500/30 shadow-lg">
                                <p className="text-[8px] font-black uppercase text-green-500 tracking-widest flex items-center gap-1"><ICONS.Signal size={8}/> Hopp_GPS_Active</p>
                            </div>
                            {state === 'active' && (
                                <div className="bg-green-500 text-black rounded-xl p-3 border border-green-400 animate-pulse shadow-lg">
                                    <p className="text-[8px] font-black uppercase tracking-widest">Status</p>
                                    <p className="text-xs font-bold">Driver En Route</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Controls */}
                    <div className="flex-1 bg-black/60 backdrop-blur-xl border-t border-white/10 -mt-10 pt-10 px-6 rounded-t-[3rem] relative z-10 space-y-6">
                        {state === 'idle' && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-10">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Pickup</label>
                                    <div className="relative">
                                        <ICONS.MapPin className="absolute left-5 top-1/2 -translate-y-1/2 text-green-500" size={18} />
                                        <input 
                                            type="text" 
                                            value={pickup}
                                            onChange={(e) => setPickup(e.target.value)}
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:border-green-500 transition-all placeholder-gray-600 font-medium text-sm"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-500 uppercase tracking-widest ml-4">Destination</label>
                                    <div className="relative">
                                        <ICONS.Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                        <input 
                                            type="text" 
                                            value={destination}
                                            onChange={(e) => setDestination(e.target.value)}
                                            placeholder="Where to?" 
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white outline-none focus:border-green-500 transition-all placeholder-gray-600 font-medium text-sm"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleSearch}
                                    disabled={!destination || !pickup}
                                    className="w-full py-5 bg-white text-black rounded-2xl font-black uppercase tracking-[0.3em] disabled:opacity-50 transition-all hover:scale-[1.02] shadow-xl"
                                >
                                    Find Ride
                                </button>
                            </div>
                        )}

                        {state === 'selecting' && (
                            <div className="space-y-4 animate-in slide-in-from-bottom-10">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-lg font-black text-white italic uppercase tracking-tight">Select Class</h3>
                                    <button onClick={() => setState('idle')} className="text-gray-500 hover:text-white"><ICONS.X size={20}/></button>
                                </div>
                                <div className="space-y-3 max-h-[300px] overflow-y-auto custom-scrollbar pr-1">
                                    {VEHICLES.map(v => (
                                        <div 
                                            key={v.id} 
                                            onClick={() => handleSelectVehicle(v)}
                                            className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer ${selectedVehicle?.id === v.id ? 'bg-green-500/20 border-green-500 shadow-[0_0_20px_rgba(34,197,94,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <img src={v.image} className="w-20 h-12 object-cover rounded-lg" alt={v.name} />
                                                <div>
                                                    <p className="text-sm font-bold text-white">{v.name}</p>
                                                    <p className="text-[10px] text-gray-400 flex items-center gap-1"><ICONS.Users size={10}/> {v.seats} • {v.eta}</p>
                                                </div>
                                            </div>
                                            <p className="text-lg font-black text-white">~${(v.priceBase * 1.5).toFixed(2)}</p>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => setState('confirming')}
                                    disabled={!selectedVehicle}
                                    className="w-full py-5 bg-green-500 text-black rounded-2xl font-black uppercase tracking-[0.3em] disabled:opacity-50 transition-all shadow-lg shadow-green-500/20 hover:scale-[1.02]"
                                >
                                    Review Order
                                </button>
                            </div>
                        )}

                        {state === 'confirming' && selectedVehicle && (
                            <div className="space-y-6 animate-in slide-in-from-right-10">
                                <div className="flex justify-between items-center px-2">
                                    <h3 className="text-lg font-black text-white italic uppercase">Confirm</h3>
                                    <button onClick={() => setState('selecting')} className="text-gray-500 hover:text-white text-xs uppercase font-bold">Edit</button>
                                </div>
                                
                                <div className="bg-white/5 border border-white/10 rounded-3xl p-6 space-y-6">
                                    <div className="flex gap-4 items-start">
                                        <div className="flex flex-col items-center gap-1 pt-1">
                                            <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.8)]"></div>
                                            <div className="w-0.5 h-8 bg-white/20"></div>
                                            <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]"></div>
                                        </div>
                                        <div className="flex-1 space-y-4">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Pickup</p>
                                                <p className="text-sm font-bold text-white">{pickup}</p>
                                            </div>
                                            <div>
                                                <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest">Dropoff</p>
                                                <p className="text-sm font-bold text-white">{destination}</p>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="h-px bg-white/10"></div>
                                    
                                    <div className="flex justify-between items-center">
                                        <div className="flex items-center gap-3">
                                            <img src={selectedVehicle.image} className="w-16 h-10 object-cover rounded-lg" alt="car" />
                                            <div>
                                                <p className="text-xs font-black text-white uppercase">{selectedVehicle.name}</p>
                                                <p className="text-[9px] text-gray-400">{selectedVehicle.seats} Seats</p>
                                            </div>
                                        </div>
                                        <p className="text-2xl font-black text-white">${estimatedPrice.toFixed(2)}</p>
                                    </div>
                                </div>

                                <button 
                                    onClick={handleConfirmRide}
                                    className="w-full py-6 bg-green-500 text-black rounded-3xl font-black uppercase tracking-[0.3em] shadow-4xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
                                >
                                    <ICONS.Lock size={16} /> Pay & Request
                                </button>
                            </div>
                        )}

                        {state === 'active' && driver && (
                            <div className="space-y-6 animate-in slide-in-from-bottom-10">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">On The Way</h3>
                                        <p className="text-xs text-green-500 font-mono">Arriving in {parseInt(selectedVehicle.eta) - Math.floor(progress/20)} mins</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-black text-white">{driver.plate}</p>
                                        <p className="text-[10px] text-gray-500 uppercase font-black">{driver.car}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/20">
                                        <img src={driver.image} className="w-full h-full object-cover" alt="Driver" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-white">{driver.name}</p>
                                        <p className="text-[10px] text-yellow-500 flex items-center gap-1"><ICONS.Star size={10} fill="currentColor"/> {driver.rating}</p>
                                    </div>
                                    <button className="p-3 bg-green-500 rounded-full text-black hover:scale-110 transition-transform"><ICONS.Phone size={18} /></button>
                                    <button className="p-3 bg-white/10 rounded-full text-white hover:bg-white/20 transition-transform"><ICONS.MessageCircle size={18} /></button>
                                </div>

                                <div className="space-y-2">
                                    <div className="flex justify-between text-[10px] font-black uppercase text-gray-500 tracking-widest">
                                        <span>Trip Progress</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-green-500 transition-all duration-500" style={{ width: `${progress}%` }}></div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {state === 'arrived' && (
                            <div className="text-center space-y-6 animate-in zoom-in duration-500 py-6">
                                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mx-auto shadow-[0_0_50px_rgba(34,197,94,0.5)]">
                                    <ICONS.CheckCircle size={48} className="text-black" />
                                </div>
                                <div>
                                    <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter">Arrived</h3>
                                    <p className="text-xs text-gray-400 font-medium mt-2">You have reached your destination.</p>
                                </div>
                                <div className="p-6 bg-white/5 border border-white/10 rounded-3xl flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Total Paid</span>
                                    <span className="text-3xl font-black text-green-500">${estimatedPrice.toFixed(2)}</span>
                                </div>
                                <button onClick={resetRide} className="w-full py-6 bg-white text-black rounded-3xl font-black uppercase tracking-[0.3em] hover:scale-105 transition-all shadow-4xl">
                                    Book New Ride
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default RideShare;
