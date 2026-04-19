import { LitElement, html, css } from "lit";
import { property } from "lit/decorators.js";
import { query } from "lit/decorators.js";

export class ChatInput extends LitElement {
  static override styles = css`
    :host {
      display: block;
      padding: 16px;
      background: var(--color-surface);
      border-top: 1px solid var(--color-border);
    }

    .input-wrapper {
      display: flex;
      gap: 12px;
    }

    textarea {
      flex: 1;
      padding: 12px;
      background: var(--color-bg);
      color: var(--color-text);
      border: 1px solid var(--color-border);
      border-radius: 6px;
      font-family: var(--font-mono);
      font-size: 14px;
      resize: vertical;
      max-height: 120px;
    }

    textarea:focus {
      outline: none;
      border-color: var(--color-accent);
      box-shadow: 0 0 0 2px rgba(124, 106, 247, 0.1);
    }

    button {
      padding: 12px 16px;
      background: var(--color-accent);
      color: white;
      border: none;
      border-radius: 6px;
      font-weight: 500;
      cursor: pointer;
      font-family: var(--font-sans);
      transition: background 0.2s;
    }

    button:hover:not(:disabled) {
      background: #6d5ce9;
    }

    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
  `;

  @property({ type: Boolean })
  disabled: boolean = false;

  @query("textarea")
  private textarea!: HTMLTextAreaElement;

  private onKeyDown(e: KeyboardEvent) {
    if (e.key === "Enter" && e.ctrlKey) {
      this.send();
    }
  }

  private send() {
    const content = this.textarea.value.trim();
    if (!content || this.disabled) return;

    this.dispatchEvent(
      new CustomEvent("send", {
        detail: { content },
        composed: true,
        bubbles: true,
      })
    );

    this.textarea.value = "";
  }

  override render() {
    return html`
      <div class="input-wrapper">
        <textarea
          placeholder="Message... (Ctrl+Enter to send)"
          .disabled=${this.disabled}
          @keydown=${this.onKeyDown}
        ></textarea>
        <button
          @click=${() => this.send()}
          .disabled=${this.disabled}
          type="button"
        >
          Send
        </button>
      </div>
    `;
  }
}

customElements.define("chat-input", ChatInput);
