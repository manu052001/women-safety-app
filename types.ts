export interface Contact {
  id: string;
  name: string;
  phone: string;
  relation: string;
}

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

export interface PoliceStation {
  name: string;
  address: string;
  distance?: string;
  googleMapsUri?: string;
  phoneNumber?: string;
}

export interface SafetyTip {
  title: string;
  description: string;
  icon: 'shield' | 'alert' | 'map' | 'phone';
}

export enum AppView {
  HOME = 'HOME',
  CONTACTS = 'CONTACTS',
  TOOLS = 'TOOLS',
  CHAT = 'CHAT',
  SETTINGS = 'SETTINGS'
}

export enum AlertStatus {
  IDLE = 'IDLE',
  COUNTDOWN = 'COUNTDOWN',
  ACTIVE = 'ACTIVE',
  SENT = 'SENT'
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}