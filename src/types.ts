export interface Message {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  type: 'chat' | 'call';
  timestamp: number;
}
