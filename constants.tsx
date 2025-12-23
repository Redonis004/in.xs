
import { 
  Home, MessageCircle, User, Settings, Camera, Heart, Share2, Lock, Zap, MapPin, Video, Phone, Calendar, ShieldCheck, Sparkles, Menu, X, Flag, AlertTriangle, Trash2, CheckCircle, ShieldAlert, Ruler, Users, Activity, Tag, Dna, Thermometer, ArrowLeft, Mic, MicOff, VideoOff, PhoneOff, Bell, Eye, Flame, Droplets, CreditCard, Wallet, Smartphone, Globe, Play, Rocket, Info, Search, Link, Copy, UserX, Briefcase, GraduationCap, Wine, Cigarette, Leaf, Baby, Volume2, Music, Pause, Pencil, Plus, Droplet, Upload, RefreshCw, Locate, Sparkle, Target, Compass, Dumbbell, Star, History, Edit2, Fingerprint, Edit3, Coffee
} from 'lucide-react';

export const ICONS = {
  Home, MessageCircle, User, Settings, Camera, Heart, Share2, Lock, Zap, MapPin, Video, Phone, Calendar, ShieldCheck, Sparkles, Menu, X,
  Flag, AlertTriangle, Trash2, CheckCircle, ShieldAlert, Ruler, Users, Activity, Tag, Dna, Thermometer,
  ArrowLeft, Mic, MicOff, VideoOff, PhoneOff, Bell, Eye, Flame, Droplets,
  CreditCard, Wallet, Smartphone, Globe, Play, Rocket, Info, Search, Link, Copy, UserX,
  Briefcase, GraduationCap, Wine, Cigarette, Leaf, Baby, Volume2, Music, Pause, Pencil, Plus, Droplet, Upload, RefreshCw, Locate, Sparkle, Target, Compass, Dumbbell, Star, History, Edit2, Fingerprint, Edit3, Coffee
};

export const APP_LOGO = `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNTEyIiBoZWlnaHQ9IjUxMiIgdmlld0JveD0iMCAwIDUxMiA1MTIiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PGxpbmVhckdyYWRpZW50IGlkPSJnMSIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3R5bGU9InN0b3AtY29sb3I6IzAwZmZmZjtzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjUwJSIgc3R5bGU9InN0b3AtY29sb3I6I2JkMDBmZitzdG9wLW9wYWNpdHk6MSIgLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNmZjAwZmY7c3RvcC1vcGFjaXR5OjEiIC8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHJlY3Qgd2lkdGg9IjUxMiIgaGVpZ2h0PSI1MTIiIHJ4PSIxMjgiIGZpbGw9IiMwNTA1MDUiLz48ZyBzdHJva2U9InVybCgjZzEpIiBzdHJva2Utd2lkdGg9IjYwIiBzdHJva2UtbGluZWNhcD0icm91bmQiPjxwYXRoIGQ9Ik0xNjAgMTYwTDM1MiAzNTJNMzUyIDE2MEwxNjAgMzUyIi8+PC9nPjxwYXRoIGQ9Ik0xODAgMTgwTDMzMiAzMzJNMzMyIDE4MEwxODAgMzMyIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjEwIiBzdHJva2UtbGluZWNhcD0icm91bmQiIG9wYWNpdHk9IjAuNSIvPjwvc3ZnPg==`;

export const SAMPLE_POSTS = [
  {
    id: '1',
    userId: 'u2',
    username: 'NeonSky',
    userAvatar: 'https://picsum.photos/100/100?random=1',
    content: 'Just arrived in the city for Pride week! Who wants to grab a drink? 🏳️‍🌈',
    imageUrl: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?q=80&w=1200&auto=format&fit=crop',
    likes: 45,
    timestamp: Date.now() - 3600000,
    isLiked: false,
    comments: [
        { id: 'c1', userId: 'u10', username: 'PartyBoi', text: 'Im down! Where you headed?', timestamp: Date.now() - 1000000 },
        { id: 'c2', userId: 'u11', username: 'LocalGuide', text: 'Welcome! Check out The Eagle tonight.', timestamp: Date.now() - 500000 }
    ]
  },
  {
    id: '3',
    userId: 'u4',
    username: 'AudioRebel',
    userAvatar: 'https://picsum.photos/100/100?random=44',
    content: 'Dropping a new synthwave clip for your workout session. Check the frequencies! 🎧⚡️',
    audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    likes: 89,
    timestamp: Date.now() - 1800000,
    isLiked: false,
    comments: []
  },
  {
    id: '2',
    userId: 'u3',
    username: 'GymBro99',
    userAvatar: 'https://picsum.photos/100/100?random=3',
    content: 'Late night workout complete. The grind never stops. 🔥💪',
    imageUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop',
    likes: 120,
    timestamp: Date.now() - 7200000,
    isLiked: true,
    comments: []
  }
];

export const CATEGORIES = ["Bear", "Twink", "Otter", "Jock", "Leather", "Queer", "Trans", "Daddy", "Black", "White"];
export const BODY_TYPES = ["Average", "Athletic", "Muscular", "Slim", "Swimmer", "Bear", "Otter", "Chub", "Large"];
export const HAIR_COLORS = ["Black", "Brown", "Blonde", "Red", "Gray", "White", "Bald", "Dyed", "Other"];
export const EYE_COLORS = ["Brown", "Blue", "Green", "Hazel", "Gray", "Other"];
export const DIET_OPTIONS = ["Omnivore", "Vegetarian", "Vegan", "Keto", "Paleo", "Other"];
export const KIDS_OPTIONS = ["No", "Yes", "Want them", "Maybe", "Don't want them"];
export const LOOKING_FOR_OPTIONS = ["Sex", "Hook-ups", "FWB", "Anonymity", "Pig", "Nasty Fun", "Dates", "Friends", "Chat", "Right Now"];
export const CUM_IN_ASS_OPTIONS = ["Feed Me", "Pull Out", "Condoms Only", "Negotiable"];
export const CUM_IN_MOUTH_OPTIONS = ["Swallow", "Spit", "Snowball", "Not into it"];
export const KINKS_OPTIONS = ["Leather", "Rubber", "Feet", "Armpits", "Bondage", "Roleplay", "Dom/Sub", "Watersports", "Puppy Play", "Fisting", "Spanking", "Public", "Voyeurism", "Exhibitionism"];
export const PRONOUNS_OPTIONS = ["He/Him", "She/Her", "They/Them", "He/They", "She/They", "Other"];
export const EDUCATION_OPTIONS = ["High School", "College", "University", "Masters", "PhD", "Trade School"];
export const LIFESTYLE_OPTIONS = ["Never", "Sometimes", "Often", "Socially"];
export const REACTION_OPTIONS = ["🔥", "❤️", "😈", "🍆", "🍑", "💦", "🏳️‍🌈"];
