import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import type { ConnectionState } from "../types";

export class ConnectionBanner extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 12px 16px;
      background: var(--color-surface);
      border-bottom: 1px solid var(--color-border);
      font-size: 13px;
      text-align: center;
    }

    :host([data-state="connected"]) {
      color: #22c55e;
    }

    :host([data-state="connecting"]) {
      color: var(--color-muted);
    }

    :host([data-state="reconnecting"]) {
      color: #f59e0b;
    }

    :host([data-state="disconnected"]) {
      color: #ef4444;
    }
  `;

  @property({ type: String })
  state: ConnectionState = "disconnected";

  override render() {
    const messages: Record<ConnectionState, string> = {
      connected: "Connected",
      connecting: "Connecting...",
      reconnecting: "Reconnecting...",
      disconnected: "Disconnected",
    };

    return html`${messages[this.state]}`;
  }

  override updated(changedProperties: Map<string, unknown>) {
    if (changedProperties.has("state")) {
      this.setAttribute("data-state", this.state);
    }
  }
}

customElements.define("connection-banner", ConnectionBanner);
