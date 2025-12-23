
export enum SubscriptionTier {
  FREE = 'FREE',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  YEARLY = 'YEARLY'
}

export enum Ethnicity {
  BLACK = 'Black',
  WHITE = 'White',
  ASIAN = 'Asian',
  INDIAN = 'Indian',
  MIXED = 'Mixed',
  NATIVE_INDIAN = 'Native Indian',
  LATINO = 'Latino',
  MIDDLE_EASTERN = 'Middle Eastern',
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
  NO_RESPONSE = 'No Response'
}

export enum SexualPreference {
  BAREBACK = 'Bareback',
  ON_PREP = 'On PrEP',
  NEEDS_DISCUSSION = 'Needs Discussion',
  NO_RESPONSE = 'No Response'
}

export enum HIVStatus {
  NEGATIVE = 'Negative',
  POSITIVE = 'Positive',
  UNDETECTABLE = 'Undetectable',
  ON_PREP = 'Negative (On PrEP)',
  NO_RESPONSE = 'No Response'
}

export enum RelationshipStatus {
  SINGLE = 'Single',
  TAKEN = 'Taken',
  OPEN = 'Open Relationship',
  DATING = 'Dating',
  MARRIED = 'Married',
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

export interface User {
  id: string;
  username: string;
  age: number;
  height?: string;
  weight?: string;
  bio: string;
  avatarUrl: string;
  bannerUrl?: string;
  
  // Demographics & Identity
  ethnicity?: Ethnicity;
  pronouns?: string;
  bodyType?: string;
  relationshipStatus?: RelationshipStatus;
  hairColor?: string;
  eyeColor?: string;
  category?: string; 
  
  // Lifestyle & Social
  smoking?: LifestyleChoice;
  drinking?: LifestyleChoice;
  marijuana?: LifestyleChoice;
  diet?: string;
  education?: EducationLevel;
  occupation?: string;
  kids?: string;
  lookingFor?: string[];
  
  // Sexual Profile
  role?: SexualRole;
  sexualPreference?: SexualPreference;
  hivStatus?: HIVStatus;
  lastTested?: string;
  kinks: string[];
  cumInAss?: string;
  cumInMouth?: string;
  
  // App Props
  isVerified: boolean;
  isModerator?: boolean;
  subscription: SubscriptionTier;
  location?: { lat: number; lng: number; name?: string };
  walletBalance: number;
  
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
  content: string;
  imageUrl?: string; // Legacy support
  audioUrl?: string; // Legacy support
  media?: MediaItem[]; // New multi-media support
  likes: number;
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
  transferAmount?: number;
  transferType?: 'send' | 'request' | 'crypto';
  timestamp: number;
  isSystem?: boolean;
  reactions?: Record<string, number>;
}

export interface ChatRoom {
  id: string;
  name: string;
  type: 'private' | 'group' | 'specialized';
  category?: string;
  participants: User[];
  lastMessage?: string;
  unreadCount: number;
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
