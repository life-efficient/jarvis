import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import { query, queryAll } from "lit/decorators.js";
import type { ChatMessage as ChatMessageType, ConnectionState, GatewayEvent } from "../types";
import "./connection-banner";
import "./chat-message";
import "./chat-input";

export class ChatApp extends LitElement {
  static override styles = css`
    :host {
      display: flex;
      flex-direction: column;
      height: 100%;
      background: var(--color-bg);
      color: var(--color-text);
    }

    connection-banner {
      flex-shrink: 0;
    }

    .messages-container {
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    }

    .empty-state {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--color-muted);
      text-align: center;
      padding: 40px;
    }

    chat-input {
      flex-shrink: 0;
    }
  `;

  @property({ type: Array })
  messages: ChatMessageType[] = [];

  @property({ type: String })
  connectionState: ConnectionState = "disconnected";

  @query(".messages-container")
  private messagesContainer!: HTMLElement;

  @queryAll("chat-message")
  private messageElements!: NodeListOf<HTMLElement>;

  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  override connectedCallback() {
    super.connectedCallback();
    this.connect();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    if (this.ws) {
      this.ws.close();
    }
  }

  private connect() {
    if (this.ws) return;

    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const url = `${protocol}//${window.location.host}/gateway-ws`;

    this.setConnectionState("connecting");

    this.ws = new WebSocket(url);

    this.ws.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnectionState("connected");
    };

    this.ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as GatewayEvent;
        this.handleGatewayEvent(data);
      } catch (e) {
        console.error("Failed to parse gateway message:", e);
      }
    };

    this.ws.onerror = () => {
      console.error("WebSocket error");
      this.setConnectionState("reconnecting");
    };

    this.ws.onclose = () => {
      this.ws = null;
      this.setConnectionState("disconnected");
      this.attemptReconnect();
    };
  }

  private attemptReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.setConnectionState("disconnected");
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts})`);

    setTimeout(() => this.connect(), delay);
  }

  private setConnectionState(state: ConnectionState) {
    this.connectionState = state;
  }

  private handleGatewayEvent(event: GatewayEvent) {
    if (event.type === "message" || event.type === "response") {
      const role = (event.role as "user" | "assistant" | "system" | "error") || "assistant";
      const content = event.content || "";

      const message: ChatMessageType = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        role,
        content,
        timestamp: Date.now(),
      };

      this.messages = [...this.messages, message];
      this.scrollToLatest();
    }
  }

  private onSendMessage(e: CustomEvent<{ content: string }>) {
    const content = e.detail.content;

    const userMessage: ChatMessageType = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      role: "user",
      content,
      timestamp: Date.now(),
    };

    this.messages = [...this.messages, userMessage];
    this.scrollToLatest();

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: "message", content }));
    }
  }

  private scrollToLatest() {
    this.updateComplete.then(() => {
      if (this.messagesContainer) {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      }
    });
  }

  override render() {
    return html`
      <connection-banner .state=${this.connectionState}></connection-banner>
      <div class="messages-container">
        ${this.messages.length === 0
          ? html`<div class="empty-state">Start a conversation...</div>`
          : this.messages.map(
              (msg) =>
                html`<chat-message
                  .role=${msg.role}
                  .content=${msg.content}
                  .timestamp=${msg.timestamp}
                ></chat-message>`
            )}
      </div>
      <chat-input
        .disabled=${this.connectionState !== "connected"}
        @send=${(e: CustomEvent<{ content: string }>) =>
          this.onSendMessage(e)}
      ></chat-input>
    `;
  }
}

customElements.define("chat-app", ChatApp);
