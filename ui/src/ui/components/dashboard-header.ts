import { LitElement, html, nothing } from "lit";
import { property } from "lit/decorators.js";
import { titleForTab, type Tab } from "../navigation.js";

export class DashboardHeader extends LitElement {
  override createRenderRoot() {
    return this;
  }

  @property() tab: Tab = "overview";
  @property({ attribute: false }) actions: unknown = nothing;

  override render() {
    const label = titleForTab(this.tab);

    return html`
      <div class="dashboard-header">
        <div class="dashboard-header__breadcrumb">
          <span
            class="dashboard-header__breadcrumb-link"
            @click=${() =>
              this.dispatchEvent(
                new CustomEvent("navigate", { detail: "overview", bubbles: true, composed: true }),
              )}
          >
            Jarvis
          </span>
          <span class="dashboard-header__breadcrumb-sep">›</span>
          <span class="dashboard-header__breadcrumb-current">${label}</span>
        </div>
        <div class="dashboard-header__actions">
          ${this.actions}
        </div>
      </div>
    `;
  }
}

if (!customElements.get("dashboard-header")) {
  customElements.define("dashboard-header", DashboardHeader);
}
