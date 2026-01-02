
export enum SubscriptionTier {
  FREE = 'FREE',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export enum Ethnicity {
  WHITE = 'White',
  BLACK = 'Black',
  ASIAN = 'Asian',
  LATINO = 'Latino',
  MIDDLE_EASTERN = 'Middle Eastern',
  SOUTH_ASIAN = 'South Asian',
  MIXED = 'Mixed',
  NATIVE_AMERICAN = 'Native American',
  PACIFIC_ISLANDER = 'Pacific Islander',
  OTHER = 'Other',
  NO_RESPONSE = 'No Response'
}

export enum SexualRole {
  TOP = 'Top',
  BOTTOM = 'Bottom',
  VERSE = 'Verse',
  VERSE_TOP = 'Verse Top',
  VERSE_BOTTOM = 'Verse Bottom',
  SIDE = 'Side',
  SWITCH = 'Switch',
  NO_RESPONSE = 'No Response'
}

export enum SexualPreference {
  BAREBACK = 'Bareback',
  ON_PREP_BB = 'On PrEP BB',
  NO_RESPONSE = 'No Response'
}

export enum HIVStatus {
  UNDETECTABLE = 'Undetectable',
  POZ = 'Poz',
  NEG = 'Neg',
  UNKNOWN = 'Unknown',
  NO_RESPONSE = 'No Response'
}

export enum RelationshipStatus {
  SINGLE = 'Single',
  PARTNERED = 'Partnered',
  MARRIED = 'Married',
  OPEN_RELATIONSHIP = 'Open Relationship',
  DIVORCED = 'Divorced',
  WIDOWED = 'Widowed',
  NO_RESPONSE = 'No Response'
}

export enum LifestyleChoice {
  NEVER = 'Never',
  SOMETIMES = 'Sometimes',
  OFTEN = 'Often',
  QUIT = 'Quit',
  NO_RESPONSE = 'No Response'
}

export enum EducationLevel {
  HIGH_SCHOOL = 'High School',
  COLLEGE = 'College',
  UNIVERSITY = 'University',
  MASTERS = 'Masters / PhD',
  NO_RESPONSE = 'No Response'
}

export enum BodyHair {
  SHAVED = 'Shaved',
  SMOOTH = 'Smooth',
  SOME_HAIR = 'Some Hair',
  BEAR = 'Bear'
}

export enum FacialHair {
  CLEAN = 'Clean Shaven',
  STUBBLE = 'Stubble',
  BEARD = 'Beard',
  MUSTACHE = 'Mustache',
  GOATEE = 'Goatee'
}

export enum PowerDynamics {
  DOMINANT = 'Dominant',
  SUBMISSIVE = 'Submissive',
  SWITCH = 'Switch',
  NEUTRAL = 'Neutral'
}

export enum CumPreference {
  INSIDE = 'Cum Inside',
  OUTSIDE = 'Cum Outside',
  DONT_CARE = "Don't Care"
}

export type UserStatus = 'online' | 'offline' | 'busy' | 'away';

export interface User {
  id: string;
  username: string;
  password?: string; 
  age: number;
  height?: string;
  weight?: string;
  bio: string;
  avatarUrl: string;
  bannerUrl?: string;
  status?: UserStatus;
  
  // Demographics & Identity
  ethnicity?: Ethnicity;
  pronouns?: string;
  bodyType?: string;
  relationshipStatus?: RelationshipStatus;
  hairColor?: string;
  eyeColor?: string;
  category?: string; 
  
  // Grooming Spec
  bodyHair?: BodyHair;
  facialHair?: FacialHair;
  
  // Sexual Profile (Hookup Relevant)
  role?: SexualRole;
  dynamics?: PowerDynamics;
  sexualPreference?: SexualPreference;
  hivStatus?: HIVStatus;
  lastTested?: string;
  kinks: string[];
  activities: string[];
  intent: string[];
  cumInAss?: CumPreference;
  cumInMouth?: string;
  hosting?: 'Yes' | 'No' | 'Negotiable' | 'Traveling';
  endowment?: 'Average' | 'Large' | 'Extra Large' | 'Elite';
  dick?: 'Cut' | 'Uncut';
  
  // Lifestyle & Social
  smoking?: LifestyleChoice;
  drinking?: LifestyleChoice;
  marijuana?: LifestyleChoice;
  diet?: string;
  education?: EducationLevel;
  occupation?: string;
  kids?: string;
  lookingFor?: string[];
  sexualLifestyle?: string;
  
  // App Props
  isVerified: boolean;
  isModerator?: boolean;
  subscription: SubscriptionTier;
  location?: { lat: number; lng: number; name?: string };
  walletBalance: number;
  isBiometricEnabled?: boolean;
  
  // Content
  photos: string[];
  videos: string[];
  videoIntroUrl?: string;
  tags: string[];
}

export interface Comment {
  id: string;
  userId: string;
  username: string;
  text: string;
  timestamp: number;
}

export interface MediaItem {
  type: 'image' | 'audio';
  url: string;
}

export interface Post {
  id: string;
  userId: string;
  username: string;
  userAvatar: string;
  userStatus?: UserStatus;
  content: string;
  imageUrl?: string; 
  audioUrl?: string; 
  location?: string; 
  locationCoords?: { lat: number; lng: number };
  liveLocationExpiry?: number; 
  media?: MediaItem[]; 
  likes: number;
  reactions?: Record<string, number>;
  timestamp: number;
  isLiked: boolean;
  comments: Comment[];
}

export interface Message {
  id: string;
  senderId: string;
  text?: string;
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  albumUrls?: string[]; 
  replyToId?: string; 
  location?: { lat: number; lng: number; label?: string };
  liveLocationExpiry?: number; 
  transferAmount?: number;
  transferType?: 'send' | 'request' | 'crypto';
  timestamp: number;
  isSystem?: boolean;
  reactions?: Record<string, number>;
  isForwarded?: boolean;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'private' | 'group' | 'specialized' | 'public';
  category?: string;
  participants?: User[];
  lastMessage?: string;
  unreadCount: number;
  avatar: string;
}

export interface Report {
  id: string;
  targetId: string;
  targetType: 'post' | 'user';
  reason: string;
  reporterId: string;
  status: 'pending' | 'resolved' | 'dismissed';
  timestamp: number;
}
