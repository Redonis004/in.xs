
import { ChatRoom, Message, User, UserStatus } from '../types';
import { SPECIALIZED_ROOMS } from '../constants';

class ChatService {
  private messages: Record<string, Message[]> = {};
  private chats: ChatRoom[] = [];
  private listeners: Record<string, ((messages: Message[]) => void)[]> = {};
  private chatListeners: ((chats: ChatRoom[]) => void)[] = [];

  constructor() {
    this.loadFromStorage();
    this.syncSpecializedRooms();
    if (this.chats.length === 0) {
      this.initMockData();
    }
  }

  private loadFromStorage() {
    try {
      const savedMessages = localStorage.getItem('inxs_messages');
      const savedChats = localStorage.getItem('inxs_chats');
      if (savedMessages) this.messages = JSON.parse(savedMessages);
      if (savedChats) this.chats = JSON.parse(savedChats);
    } catch (e) {
      console.error("Failed to load chat history", e);
    }
  }

  private saveToStorage() {
    localStorage.setItem('inxs_messages', JSON.stringify(this.messages));
    localStorage.setItem('inxs_chats', JSON.stringify(this.chats));
  }

  private syncSpecializedRooms() {
      SPECIALIZED_ROOMS.forEach(room => {
          if (!this.chats.find(c => c.id === room.id)) {
              // @ts-ignore
              this.chats.push({ ...room, id: room.id, type: 'specialized' });
          }
      });
      this.saveToStorage();
  }

  private initMockData() {
    this.chats = [
      { id: 'u_alex', name: 'Alex', type: 'private', lastMessage: 'See you tonight!', unreadCount: 2, avatar: 'https://picsum.photos/100/100?random=51', participants: [] },
      { id: 'u_jordan', name: 'Jordan', type: 'private', lastMessage: 'Sync confirmed.', unreadCount: 0, avatar: 'https://picsum.photos/100/100?random=52', participants: [] },
      { id: 'u_kai', name: 'Kai', type: 'private', lastMessage: 'Incoming data...', unreadCount: 1, avatar: 'https://picsum.photos/100/100?random=53', participants: [] },
      { id: 'u_river', name: 'River', type: 'private', lastMessage: 'Protocol error.', unreadCount: 0, avatar: 'https://picsum.photos/100/100?random=54', participants: [] },
    ];
    
    // Mock initial messages
    this.messages['u_alex'] = [
        { id: 'm1', senderId: 'u_alex', text: 'Hey! You going to the event?', timestamp: Date.now() - 86400000 },
        { id: 'm2', senderId: 'me', text: 'Thinking about it. You?', timestamp: Date.now() - 86000000 },
        { id: 'm3', senderId: 'u_alex', text: 'See you tonight!', timestamp: Date.now() - 3600000 }
    ];
    
    this.saveToStorage();
  }

  getChats(): ChatRoom[] {
    return this.chats;
  }

  getMessages(chatId: string): Message[] {
    return this.messages[chatId] || [];
  }

  sendMessage(chatId: string, message: Message) {
    if (!this.messages[chatId]) this.messages[chatId] = [];
    this.messages[chatId].push(message);
    
    // Update chat preview
    let chatIndex = this.chats.findIndex(c => c.id === chatId);
    if (chatIndex >= 0) {
        this.chats[chatIndex].lastMessage = message.text || (message.imageUrl ? 'Sent an image' : 'Sent a message');
        this.chats[chatIndex].unreadCount = 0; // Reset if I send
        // Move to top
        const chat = this.chats.splice(chatIndex, 1)[0];
        this.chats.unshift(chat);
    } else {
        // Create new chat if it doesn't exist
        const newChat: ChatRoom = {
            id: chatId,
            name: 'User', // Should be updated with real user data if possible
            type: 'private',
            lastMessage: message.text || 'Sent a message',
            unreadCount: 0,
            avatar: 'https://picsum.photos/100/100?random=' + chatId
        };
        this.chats.unshift(newChat);
    }

    this.saveToStorage();
    this.notifyMessageListeners(chatId);
    this.notifyChatListeners();

    // Simulate Reply if it's a private chat (not me sending)
    if (message.senderId === 'me' && !chatId.startsWith('r')) { 
        this.simulateReply(chatId);
    }
  }

  // New method to handle Oinks
  sendOink(targetUser: any, fromUser: User) {
      const oinks = JSON.parse(localStorage.getItem('inxs_oinks') || '[]');
      const newOink = {
          id: Date.now().toString(),
          userId: fromUser.id, // In a real app, this would be the sender
          targetId: targetUser.id, // This allows filtering
          username: targetUser.username, // For demo purposes, we show who we oinked AT in the sent list, or who oinked US in inbox. 
          // For this mocked frontend, we'll simulate receiving an Oink from the person we clicked on to show it works
          // Swapping logic for demo visualization:
          avatar: targetUser.avatar || targetUser.avatarUrl, 
          time: 'Just now', 
          hasViewedProfile: true
      };
      
      // We push a mock incoming oink so it appears in the Oink Tab
      oinks.unshift(newOink);
      localStorage.setItem('inxs_oinks', JSON.stringify(oinks));
  }

  createChat(chat: ChatRoom) {
      if (!this.chats.find(c => c.id === chat.id)) {
          this.chats.unshift(chat);
          this.saveToStorage();
          this.notifyChatListeners();
      }
  }

  private simulateReply(chatId: string) {
      setTimeout(() => {
          const replies = [
              "Data received.", "Interesting point.", "Can you elaborate?", "lol", "Sure thing.", "Wait, really?", "Sending coordinates..."
          ];
          const text = replies[Math.floor(Math.random() * replies.length)];
          const reply: Message = {
              id: Date.now().toString(),
              senderId: chatId,
              text,
              timestamp: Date.now()
          };
          
          if (!this.messages[chatId]) this.messages[chatId] = [];
          this.messages[chatId].push(reply);
          
          const chat = this.chats.find(c => c.id === chatId);
          if (chat) {
              chat.lastMessage = text;
              chat.unreadCount += 1;
          }
          
          this.saveToStorage();
          this.notifyMessageListeners(chatId);
          this.notifyChatListeners();
      }, 3000 + Math.random() * 5000);
  }

  subscribeToMessages(chatId: string, callback: (messages: Message[]) => void) {
    if (!this.listeners[chatId]) this.listeners[chatId] = [];
    this.listeners[chatId].push(callback);
    return () => {
      this.listeners[chatId] = this.listeners[chatId].filter(cb => cb !== callback);
    };
  }

  subscribeToChats(callback: (chats: ChatRoom[]) => void) {
    this.chatListeners.push(callback);
    return () => {
        this.chatListeners = this.chatListeners.filter(cb => cb !== callback);
    };
  }

  private notifyMessageListeners(chatId: string) {
    if (this.listeners[chatId]) {
      const msgs = this.getMessages(chatId);
      this.listeners[chatId].forEach(cb => cb(msgs));
    }
  }

  private notifyChatListeners() {
      this.chatListeners.forEach(cb => cb(this.chats));
  }
}

export const chatService = new ChatService();
