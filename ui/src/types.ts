export type MessageRole = "user" | "assistant" | "system" | "error";

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: number;
}

export type ConnectionState = "connecting" | "connected" | "reconnecting" | "disconnected";

export interface GatewayEvent {
  type: string;
  content?: string;
  role?: string;
  [key: string]: unknown;
}
