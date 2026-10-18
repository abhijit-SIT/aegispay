/**
 * AegisPay: Autonomous Agent Engine & Mission Dispatcher
 */

class AgentEngine {
  constructor() {
    this.isDispatching = false;
  }

  init() {
    this.bindPresets();
    this.bindForm();
  }

  bindPresets() {
    const container = document.querySelector('#scenarioPresets');
    if (!container || !window.AEGIS_SCENARIOS) return;

    container.innerHTML = '';
    window.AEGIS_SCENARIOS.forEach(sc => {
      const chip = document.createElement('button');
      chip.type = 'button';
      chip.className = `preset-chip ${sc.expectedOutcome === 'BLOCKED_THREAT' ? 'danger-chip' : ''}`;
      chip.textContent = sc.label;
      chip.title = sc.description;
      chip.addEventListener('click', () => this.applyScenario(sc));
      container.appendChild(chip);
    });
  }

  applyScenario(scenario) {
    const agentSelect = document.querySelector('#dispatchAgentSelect');
    const intentInput = document.querySelector('#dispatchIntent');
    const merchantInput = document.querySelector('#dispatchMerchant');
    const amountInput = document.querySelector('#dispatchAmount');

    if (agentSelect) agentSelect.value = scenario.agentId;
    if (intentInput) intentInput.value = scenario.intent;
    if (merchantInput) merchantInput.value = scenario.merchant;
    if (amountInput) amountInput.value = scenario.amount;

    window.AegisApp.showToast(`Loaded: ${scenario.label}`, "info");
  }

  bindForm() {
    const form = document.querySelector('#missionDispatchForm');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (this.isDispatching) return;

      const agentId = document.querySelector('#dispatchAgentSelect').value;
      const intent = document.querySelector('#dispatchIntent').value.trim();
      const merchant = document.querySelector('#dispatchMerchant').value.trim();
      const amount = parseFloat(document.querySelector('#dispatchAmount').value);

      if (!intent || !merchant || isNaN(amount) || amount <= 0) {
        window.AegisApp.showToast("Please provide valid mission intent, merchant, and amount", "error");
        return;
      }

      await this.dispatchMission({ agent_id: agentId, intent, merchant, amount });
    });
  }

  async dispatchMission(payload) {
    this.isDispatching = true;
    const submitBtn = document.querySelector('#btnDispatchMission');
    const originalText = submitBtn ? submitBtn.innerHTML : "Dispatching...";
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerHTML = `<span>⏳ Auditing Intent...</span>`;
    }

    try {
      const response = await fetch('/api/agent/transact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Mission execution failed");
      }

      const tx = data.transaction;
      const evaluation = data.evaluation;

      // Update grid live
      if (window.AegisGrid) {
        window.AegisGrid.prependTransactionToGrid(tx);
      }

      // Refresh metrics
      if (window.AegisApp) {
        window.AegisApp.refreshMetrics();
        window.AegisApp.refreshWallets();
      }

      // Display Contextual Notification
      if (tx.status === "AUTO_APPROVED") {
        window.AegisApp.showToast(
          `✅ Auto-Approved: PayPal Order ${tx.paypal_order_id} captured ($${tx.amount.toFixed(2)})`,
          "success"
        );
      } else if (tx.status === "HITL_REQUIRED") {
        window.AegisApp.showToast(
          `⚠️ Human-In-The-Loop: Order held for authorization ($${tx.amount.toFixed(2)})`,
          "warning"
        );
        // Automatically prompt HITL drawer
        setTimeout(() => {
          window.AegisApp.openHitlDrawer(tx.id);
        }, 600);
      } else if (tx.status === "BLOCKED_THREAT") {
        window.AegisApp.showToast(
          `🛑 Threat Intercepted: Rogue spend of $${tx.amount.toFixed(2)} blocked!`,
          "danger"
        );
      }

    } catch (err) {
      console.error("Mission dispatch error:", err);
      window.AegisApp.showToast(err.message, "error");
    } finally {
      this.isDispatching = false;
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.innerHTML = originalText;
      }
    }
  }
}

window.AgentEngine = new AgentEngine();
