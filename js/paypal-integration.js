/**
 * AegisPay: PayPal Sandbox Gateway & Webhook Simulator
 */

class PayPalIntegration {
  constructor() {
    this.config = {
      paypal_mode: "sandbox",
      client_id: "AegisPay-Sandbox-Mock-Client-ID",
      auto_approval_threshold: 100.00,
      max_risk_tolerance: 35
    };
  }

  async loadConfig() {
    try {
      const res = await fetch('/api/config');
      if (res.ok) {
        this.config = await res.json();
        this.renderConfigUI();
      }
    } catch (e) {
      console.warn("Using offline PayPal config", e);
    }
  }

  renderConfigUI() {
    const modeEl = document.querySelector('#cfgPayPalMode');
    const clientIdEl = document.querySelector('#cfgClientId');
    const thresholdEl = document.querySelector('#cfgAutoThreshold');
    const riskEl = document.querySelector('#cfgRiskTolerance');

    if (modeEl) modeEl.value = this.config.paypal_mode || "sandbox";
    if (clientIdEl) clientIdEl.value = this.config.client_id || "";
    if (thresholdEl) thresholdEl.value = this.config.auto_approval_threshold || 100;
    if (riskEl) riskEl.value = this.config.max_risk_tolerance || 35;
  }

  async saveConfig(formData) {
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (res.ok) {
        this.config = data.config;
        window.AegisApp.showToast("PayPal Sandbox settings saved successfully", "success");
      }
    } catch (e) {
      window.AegisApp.showToast("Failed to update PayPal settings", "error");
    }
  }

  renderPayPalButton(containerId, tx, onApproveCallback) {
    const container = document.getElementById(containerId);
    if (!container) return;

    container.innerHTML = `
      <div style="background: rgba(0, 112, 186, 0.1); border: 1px solid rgba(0, 207, 222, 0.3); border-radius: 8px; padding: 12px; margin-top: 10px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 6px;">
            <span style="color: #00CFDE; font-size: 14px; font-weight: 700;">PayPal Sandbox Checkout</span>
            <span style="font-size: 10px; background: rgba(0, 207, 222, 0.2); color: #00CFDE; padding: 2px 6px; border-radius: 10px;">Orders v2</span>
          </div>
          <span style="font-family: var(--font-mono); font-weight: 700; color: #fff;">$${Number(tx.amount).toFixed(2)} USD</span>
        </div>
        <p style="font-size: 11px; color: #94A3B8; margin-bottom: 12px; text-align: left;">
          Clicking approve executes PayPal Capture for pre-authorized Order ID: <code style="color: #00CFDE;">${tx.paypal_order_id || 'PP-ORD-PENDING'}</code>
        </p>
        <button id="btnPayPalApproveAction" class="btn btn-primary" style="width: 100%; justify-content: center; font-size: 13px; font-weight: 700;">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.004.425 5.412.072 5.892.072h7.616c3.42 0 6.096 1.34 6.784 4.887.487 2.51-.237 4.778-1.927 6.082 1.94.75 2.748 2.68 2.378 5.156-.47 3.12-2.88 5.14-6.335 5.14H7.076z"/></svg>
          Authorize & Capture via PayPal Sandbox
        </button>
      </div>
    `;

    const btn = document.getElementById('btnPayPalApproveAction');
    if (btn) {
      btn.addEventListener('click', async () => {
        btn.disabled = true;
        btn.textContent = "Processing PayPal Sandbox Capture...";
        await onApproveCallback();
      });
    }
  }
}

window.PayPalGateway = new PayPalIntegration();
