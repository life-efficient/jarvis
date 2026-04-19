import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import type { MessageRole } from "../types";

export class ChatMessage extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 16px;
      border-bottom: 1px solid var(--color-border);
    }

    .message-wrapper {
      display: flex;
      gap: 12px;
      max-width: 100%;
    }

    :host([data-role="user"]) .message-wrapper {
      justify-content: flex-end;
    }

    :host([data-role="assistant"]) .message-wrapper {
      justify-content: flex-start;
    }

    :host([data-role="system"]) .message-wrapper {
      justify-content: center;
    }

    :host([data-role="error"]) .message-wrapper {
      justify-content: flex-start;
    }

    .bubble {
      padding: 12px 16px;
      border-radius: 8px;
      word-wrap: break-word;
      overflow-wrap: break-word;
      max-width: 70%;
      font-family: var(--font-mono);
      font-size: 13px;
      line-height: 1.5;
    }

    :host([data-role="user"]) .bubble {
      background: var(--color-user-bubble);
      color: var(--color-text);
    }

    :host([data-role="assistant"]) .bubble {
      background: var(--color-assistant-bubble);
      color: var(--color-text);
    }

    :host([data-role="system"]) .bubble {
      background: transparent;
      color: var(--color-muted);
      border: 1px solid var(--color-muted);
      max-width: 80%;
    }

    :host([data-role="error"]) .bubble {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border: 1px solid rgba(239, 68, 68, 0.3);
    }

    .timestamp {
      font-size: 11px;
      color: var(--color-muted);
      margin-top: 4px;
    }
  `;

  @property({ type: String })
  role: MessageRole = "assistant";

  @property({ type: String })
  content: string = "";

  @property({ type: Number })
  timestamp: number = Date.now();

  override render() {
    const time = new Date(this.timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    return html`
      <div class="message-wrapper">
        <div>
          <div class="bubble">${this.content}</div>
          <div class="timestamp">${time}</div>
        </div>
      </div>
    `;
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("role")) {
      this.setAttribute("data-role", this.role);
    }
  }
}

customElements.define("chat-message", ChatMessage);
