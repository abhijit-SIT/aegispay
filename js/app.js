/**
 * AegisPay: Master Application Controller
 */

class AegisApp {
  constructor() {
    this.transactions = [];
    this.wallets = [];
    this.stats = {};
    this.currentTxInReview = null;
  }

  async init() {
    console.log("Initializing AegisPay OS...");
    this.bindNavigation();
    this.bindModals();
    this.bindFilters();

    // Load initial data
    await this.refreshMetrics();
    await this.refreshWallets();
    await this.refreshTransactions();

    // Initialize Subsystems
    if (window.AgentEngine) window.AgentEngine.init();
    if (window.PayPalGateway) window.PayPalGateway.loadConfig();

    // Auto-poll metrics every 10 seconds for real-time telemetry
    setInterval(() => this.refreshMetrics(), 10000);
  }

  bindNavigation() {
    const tabs = document.querySelectorAll('.tab-btn');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetId = tab.dataset.tab;
        this.switchTab(targetId);
      });
    });
  }

  switchTab(tabId) {
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.tab === tabId);
    });
    document.querySelectorAll('.tab-content').forEach(panel => {
      panel.classList.toggle('active', panel.id === `tab-${tabId}`);
    });

    if (tabId === 'cockpit' && window.AegisGrid && window.AegisGrid.gridApi) {
      setTimeout(() => window.AegisGrid.gridApi.sizeColumnsToFit(), 50);
    }
  }

  bindFilters() {
    const searchInput = document.querySelector('#gridSearchInput');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        if (window.AegisGrid) window.AegisGrid.searchGrid(e.target.value);
      });
    }

    const filterBtns = document.querySelectorAll('.filter-btn');
    filterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        filterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filterVal = btn.dataset.filter;
        if (window.AegisGrid) window.AegisGrid.filterGridStatus(filterVal);
      });
    });

    const exportBtn = document.querySelector('#btnExportCsv');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        if (window.AegisGrid) window.AegisGrid.exportGridCsv();
      });
    }
  }

  bindModals() {
    // Generic Modal Closer
    document.querySelectorAll('.modal-close-btn, .modal-cancel-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.modal-overlay').forEach(modal => modal.classList.remove('active'));
      });
    });

    // Close when clicking overlay backdrop
    document.querySelectorAll('.modal-overlay').forEach(overlay => {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
      });
    });

    // Create New Wallet Form
    const newWalletForm = document.querySelector('#newWalletForm');
    if (newWalletForm) {
      newWalletForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = document.querySelector('#wName').value;
        const role = document.querySelector('#wRole').value;
        const dailyCap = parseFloat(document.querySelector('#wDailyCap').value);
        const singleTxLimit = parseFloat(document.querySelector('#wSingleLimit').value);
        const domains = document.querySelector('#wDomains').value.split(',').map(s => s.trim()).filter(Boolean);

        try {
          const res = await fetch('/api/wallets', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, role, daily_cap: dailyCap, single_tx_limit: singleTxLimit, whitelisted_domains: domains })
          });
          if (res.ok) {
            this.showToast(`Scoped Wallet '${name}' provisioned`, "success");
            document.querySelector('#modalNewWallet').classList.remove('active');
            newWalletForm.reset();
            await this.refreshWallets();
          }
        } catch (err) {
          this.showToast("Failed to create wallet", "error");
        }
      });
    }

    // PayPal Config Form
    const cfgForm = document.querySelector('#paypalConfigForm');
    if (cfgForm) {
      cfgForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const mode = document.querySelector('#cfgPayPalMode').value;
        const clientId = document.querySelector('#cfgClientId').value;
        const autoThreshold = parseFloat(document.querySelector('#cfgAutoThreshold').value);
        const riskTolerance = parseInt(document.querySelector('#cfgRiskTolerance').value);

        if (window.PayPalGateway) {
          await window.PayPalGateway.saveConfig({
            paypal_mode: mode,
            client_id: clientId,
            auto_approval_threshold: autoThreshold,
            max_risk_tolerance: riskTolerance
          });
        }
      });
    }
  }

  async refreshMetrics() {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        this.stats = await res.json();
        this.renderMetrics();
      }
    } catch (e) {
      console.warn("Could not fetch metrics", e);
    }
  }

  renderMetrics() {
    const setVal = (id, val) => {
      const el = document.getElementById(id);
      if (el) el.textContent = val;
    };

    setVal('metricTotalSettled', `$${Number(this.stats.total_settled_usd || 0).toFixed(2)}`);
    setVal('metricBlockedCapital', `$${Number(this.stats.blocked_capital_usd || 0).toFixed(2)}`);
    setVal('metricActiveWallets', this.stats.total_agents || 4);
    setVal('metricAvgRisk', `${this.stats.average_risk_score || 18}/100`);

    const hitlBadge = document.querySelector('#badgeHitlCount');
    if (hitlBadge) {
      const count = this.stats.pending_hitl_approvals || 0;
      hitlBadge.textContent = count;
      hitlBadge.style.display = count > 0 ? 'inline-block' : 'none';
    }
  }

  async refreshWallets() {
    try {
      const res = await fetch('/api/wallets');
      if (res.ok) {
        const data = await res.json();
        this.wallets = data.wallets || [];
        this.renderWallets();
        this.updateAgentDropdown();
      }
    } catch (e) {
      console.warn("Could not fetch wallets", e);
    }
  }

  renderWallets() {
    const container = document.querySelector('#walletsList');
    if (!container) return;

    container.innerHTML = this.wallets.map(w => {
      const pct = Math.min(100, Math.round((w.spent_today / w.daily_cap) * 100));
      let emoji = "🤖";
      if (w.id.includes("travel")) emoji = "✈️";
      else if (w.id.includes("procure")) emoji = "🛒";
      else if (w.id.includes("research")) emoji = "🔬";

      return `
        <div class="wallet-card">
          <div class="wallet-card-header">
            <div class="wallet-avatar">${emoji}</div>
            <div class="wallet-info">
              <h4>${w.name}</h4>
              <span>${w.role}</span>
            </div>
          </div>
          <div class="wallet-progress-bar-wrap">
            <div class="progress-labels">
              <span>Daily Allowance</span>
              <span><strong>$${w.spent_today.toFixed(2)}</strong> / $${w.daily_cap.toFixed(2)} (${pct}%)</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${pct}%;"></div>
            </div>
          </div>
          <div class="wallet-rules">
            <div class="rule-row">
              <span>Single Transaction Limit:</span>
              <strong>$${w.single_tx_limit.toFixed(2)} USD</strong>
            </div>
            <div class="rule-row">
              <span>Enclave Status:</span>
              <span style="color: #10B981; font-weight: 700;">● ${w.status}</span>
            </div>
            <div class="rule-row">
              <span>Whitelisted Merchants:</span>
              <span style="font-family: var(--font-mono); font-size: 0.72rem; color: #94A3B8;">${w.whitelisted_domains.slice(0, 3).join(', ')}${w.whitelisted_domains.length > 3 ? '...' : ''}</span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  updateAgentDropdown() {
    const select = document.querySelector('#dispatchAgentSelect');
    if (!select) return;

    select.innerHTML = this.wallets.map(w => {
      return `<option value="${w.id}">${w.name} ($${w.single_tx_limit.toFixed(0)} max/tx)</option>`;
    }).join('');
  }

  async refreshTransactions() {
    try {
      const res = await fetch('/api/transactions');
      if (res.ok) {
        const data = await res.json();
        this.transactions = data.transactions || [];
        if (window.AegisGrid) {
          if (!window.AegisGrid.gridApi) {
            window.AegisGrid.initAGGrid(this.transactions);
          } else {
            window.AegisGrid.updateAGGridData(this.transactions);
          }
        }
      }
    } catch (e) {
      console.warn("Could not fetch transactions", e);
    }
  }

  openHitlDrawer(txId) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) return;
    this.currentTxInReview = tx;

    const modal = document.querySelector('#modalHitlDrawer');
    if (!modal) return;

    document.querySelector('#hitlTxId').textContent = tx.id;
    document.querySelector('#hitlAgent').textContent = tx.agent_name;
    document.querySelector('#hitlIntent').textContent = tx.intent;
    document.querySelector('#hitlMerchant').textContent = tx.merchant;
    document.querySelector('#hitlAmount').textContent = `$${Number(tx.amount).toFixed(2)} ${tx.currency}`;
    document.querySelector('#hitlRiskScore').textContent = `${tx.risk_score}/100`;
    document.querySelector('#hitlNotes').textContent = tx.policy_notes;

    // Render PayPal Sandbox Action
    if (window.PayPalGateway) {
      window.PayPalGateway.renderPayPalButton('hitlPayPalContainer', tx, async () => {
        await this.approveTransaction(tx.id);
      });
    }

    const rejectBtn = document.querySelector('#btnHitlReject');
    if (rejectBtn) {
      rejectBtn.onclick = async () => {
        await this.rejectTransaction(tx.id);
      };
    }

    modal.classList.add('active');
  }

  async approveTransaction(txId) {
    try {
      const res = await fetch(`/api/transactions/${txId}/approve`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        this.showToast(`Transaction ${txId} approved & captured on PayPal!`, "success");
        document.querySelector('#modalHitlDrawer').classList.remove('active');
        await this.refreshTransactions();
        await this.refreshMetrics();
        await this.refreshWallets();
      } else {
        this.showToast(data.error || "Approval failed", "error");
      }
    } catch (e) {
      this.showToast("Approval error", "error");
    }
  }

  async rejectTransaction(txId) {
    try {
      const res = await fetch(`/api/transactions/${txId}/reject`, { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        this.showToast(`Transaction ${txId} rejected and cancelled`, "danger");
        document.querySelector('#modalHitlDrawer').classList.remove('active');
        await this.refreshTransactions();
        await this.refreshMetrics();
      }
    } catch (e) {
      this.showToast("Rejection error", "error");
    }
  }

  openAuditModal(txId) {
    const tx = this.transactions.find(t => t.id === txId);
    if (!tx) return;

    const modal = document.querySelector('#modalAuditTrace');
    if (!modal) return;

    document.querySelector('#auditTxId').textContent = tx.id;
    document.querySelector('#auditTimestamp').textContent = tx.timestamp;
    document.querySelector('#auditAgent').textContent = tx.agent_name;
    document.querySelector('#auditIntent').textContent = tx.intent;
    document.querySelector('#auditMerchant').textContent = tx.merchant;
    document.querySelector('#auditCategory').textContent = tx.category || 'General';
    document.querySelector('#auditAmount').textContent = `$${Number(tx.amount).toFixed(2)} ${tx.currency}`;
    document.querySelector('#auditStatus').textContent = tx.status;
    document.querySelector('#auditRisk').textContent = `${tx.risk_score}/100`;
    document.querySelector('#auditPayPalOrder').textContent = tx.paypal_order_id || 'N/A (Blocked)';
    document.querySelector('#auditPayPalCapture').textContent = tx.paypal_capture_id || 'N/A';

    const alertBox = document.querySelector('#auditPolicyAlert');
    alertBox.className = `trace-alert ${tx.status === 'BLOCKED_THREAT' ? 'danger' : (tx.status === 'HITL_REQUIRED' ? 'warning' : 'success')}`;
    alertBox.textContent = tx.policy_notes;

    modal.classList.add('active');
  }

  showToast(message, type = "info") {
    const container = document.querySelector('#toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';
    let icon = 'ℹ️';
    if (type === 'success') icon = '✅';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'danger' || type === 'error') icon = '🛑';

    toast.innerHTML = `
      <div class="toast-icon">${icon}</div>
      <div class="toast-content">
        <h5>${type.toUpperCase()}</h5>
        <p>${message}</p>
      </div>
    `;

    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }
}

window.AegisApp = new AegisApp();
document.addEventListener('DOMContentLoaded', () => {
  window.AegisApp.init();
});
