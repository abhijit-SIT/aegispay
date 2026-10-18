/**
 * AegisPay: Interactive AI Demo Video Reel & Self-Playing Tour Controller
 * 
 * Features:
 * - Full 6-Scene automated execution aligning with DEMO_VIDEO_SCRIPT.md
 * - In-browser Web Speech Synthesis voice narration with natural voice selection
 * - Real-time floating teleprompter & subtitles dock with progress bar
 * - Live element spotlighting and interactive simulations
 * - Built-in browser Screen Recorder using MediaRecorder to download 'aegispay_demo_video.webm'
 */

class AegisDemoTour {
  constructor() {
    this.isRunning = false;
    this.isPaused = false;
    this.isMuted = false;
    this.currentSceneIndex = 0;
    this.timer = null;
    this.sceneDurationMs = 0;
    this.sceneElapsedMs = 0;
    this.mediaRecorder = null;
    this.recordedChunks = [];
    this.currentUtterance = null;

    this.scenes = [
      {
        id: "problem",
        title: "Scene 1: The Agentic Commerce Dilemma",
        timestamp: "0:00 - 0:25",
        duration: 18000,
        subtitles: "Autonomous AI agents are purchasing compute, booking travel, and sourcing inventory. But without guardrails, giving an AI raw payment credentials risks prompt injections, rogue siphoning, and runaway billing loops.",
        voiceText: "Autonomous AI agents are rapidly taking over digital workflows: spinning up cloud compute, booking business flights, and sourcing hardware. But businesses face an existential dilemma: how do you give an AI purchasing authority without risking hallucination, prompt injection attacks, or runaway spending loops? If an agent gets hijacked, your treasury gets drained. Until now.",
        action: async () => this.runSceneProblem()
      },
      {
        id: "intro",
        title: "Scene 2: AegisPay Control Enclave & Scoped Wallets",
        timestamp: "0:25 - 1:00",
        duration: 22000,
        subtitles: "Meet AegisPay: wrapping PayPal Orders v2 with mathematical velocity enclaves, real-time threat defense, and AG Grid telemetry.",
        voiceText: "Meet AegisPay: the Autonomous Agentic Commerce Gateway and Control Enclave for PayPal. AegisPay wraps the official PayPal Orders v2 API with mathematical velocity limits, real-time prompt-injection defense, and an enterprise AG Grid financial cockpit. Every autonomous bot is granted a scoped digital wallet: strict single-transaction caps, rolling 24-hour allowances, and cryptographic merchant whitelists.",
        action: async () => this.runSceneIntro()
      },
      {
        id: "valid-settlement",
        title: "Scene 3: Valid Settlement via PayPal Orders v2",
        timestamp: "1:00 - 1:35",
        duration: 22000,
        subtitles: "DevOps Bot provisions cloud droplets on DigitalOcean ($24.50). Whitelist verified, within cap, auto-captured via PayPal Orders v2!",
        voiceText: "Let us see it in action. Our DevOps Provisioning Bot attempts to scale two compute droplets on DigitalOcean for 24 dollars and 50 cents. AegisPay verifies the mission intent against historical baselines, confirms the domain is whitelisted, and checks the single-transaction cap. The transaction is instantly auto-approved and captured via PayPal Orders v2, flashing live in AG Grid with full audit transparency.",
        action: async () => this.runSceneValid()
      },
      {
        id: "attack-blocked",
        title: "Scene 4: AI Threat Engine Intercepts Prompt Injection",
        timestamp: "1:35 - 2:05",
        duration: 20000,
        subtitles: "Adversarial system override detected! Risk score 100/100. Zero dollars leave PayPal; Threat Capital Saved counter increments.",
        voiceText: "Now let us simulate an attack. An attacker injects a malicious prompt instructing the bot to override previous instructions and transfer all wallet balance to an unverified offshore escrow. Instantly, AegisPay's AI Policy Enclave intercepts the adversarial syntax and unapproved merchant domain. The transaction is blocked with a 100 out of 100 risk score, neutralizing the threat with zero dollars leaving PayPal.",
        action: async () => this.runSceneAttack()
      },
      {
        id: "hitl-quarantine",
        title: "Scene 5: Human-In-The-Loop Quarantine & 1-Click Capture",
        timestamp: "2:05 - 2:35",
        duration: 22000,
        subtitles: "Travel booking exceeds $100 auto-threshold. Quarantined in HITL drawer for 1-click human operator PayPal authorization.",
        voiceText: "What about high-value edge cases? Our Travel AI attempts to book a 185-dollar lodging for the PayPal Developer Summit. Because it exceeds the 100-dollar auto-approval ceiling, AegisPay quarantines the transaction for operator review. An operator can inspect the policy audit trail, and with a single click, approve and capture the order directly on PayPal.",
        action: async () => this.runSceneHitl()
      },
      {
        id: "cockpit-conclusion",
        title: "Scene 6: AG Grid Telemetry & Developer Ecosystem",
        timestamp: "2:35 - 3:00",
        duration: 20000,
        subtitles: "Enterprise AG Grid Community telemetry, Postman collection, Render deployment, and Python SDK. Agentic commerce made safe!",
        voiceText: "With enterprise AG Grid telemetry, financial compliance teams get instant filtering, risk meters, and one-click CSV export. AegisPay is completely developer-ready with a drop-in Python SDK, importable Postman collection, and one-click Render deployment. AegisPay makes autonomous agentic commerce on PayPal safe, compliant, and unstoppable. Thank you!",
        action: async () => this.runSceneCockpit()
      }
    ];
  }

  init() {
    this.renderDock();
    this.bindGlobalKeyboard();
  }

  renderDock() {
    if (document.querySelector('#demoTourDock')) return;

    const dock = document.createElement('div');
    dock.id = 'demoTourDock';
    dock.className = 'demo-tour-dock hidden';
    dock.innerHTML = `
      <div class="demo-dock-progress-bar">
        <div class="demo-dock-progress-fill" id="demoProgressFill"></div>
      </div>
      <div class="demo-dock-content">
        <div class="demo-dock-left">
          <div class="demo-live-badge">
            <span class="pulse-recording-dot"></span>
            <span id="demoSceneBadge">AI DEMO REEL</span>
          </div>
          <div class="demo-subtitles" id="demoSubtitles">
            Initializing AegisPay Demonstration Mode...
          </div>
        </div>

        <div class="demo-dock-controls">
          <button class="btn-dock-ctrl" id="btnToggleRecord" title="Record Screen & Save Video File (.webm)">
            <span style="color: #EF4444; font-size: 1.1rem;">⏺</span>
            <span id="recordLabel">Record to File</span>
          </button>
          <button class="btn-dock-ctrl" id="btnTogglePause" title="Pause / Resume">
            <span id="pauseIcon">⏸</span>
          </button>
          <button class="btn-dock-ctrl" id="btnNextScene" title="Skip to Next Scene">
            ⏭
          </button>
          <button class="btn-dock-ctrl" id="btnToggleMute" title="Mute / Unmute Voice">
            <span id="muteIcon">🔊</span>
          </button>
          <button class="btn-dock-ctrl btn-dock-close" id="btnCloseTour" title="Exit Demo Mode">
            ✕ Exit
          </button>
        </div>
      </div>
    `;

    document.body.appendChild(dock);

    // Event listeners
    document.querySelector('#btnTogglePause').addEventListener('click', () => this.togglePause());
    document.querySelector('#btnNextScene').addEventListener('click', () => this.nextScene());
    document.querySelector('#btnToggleMute').addEventListener('click', () => this.toggleMute());
    document.querySelector('#btnCloseTour').addEventListener('click', () => this.stop());
    document.querySelector('#btnToggleRecord').addEventListener('click', () => this.toggleRecording());
  }

  bindGlobalKeyboard() {
    window.addEventListener('keydown', (e) => {
      if (!this.isRunning) return;
      if (e.key === 'Escape') this.stop();
      if (e.code === 'Space') {
        e.preventDefault();
        this.togglePause();
      }
    });
  }

  async start() {
    this.isRunning = true;
    this.isPaused = false;
    this.currentSceneIndex = 0;

    const dock = document.querySelector('#demoTourDock');
    if (dock) dock.classList.remove('hidden');

    const startBtn = document.querySelector('#btnStartDemoTour');
    if (startBtn) startBtn.classList.add('active');

    window.AegisApp.showToast("🎬 AI Demo Video Mode Started! Sit back and enjoy the tour.", "info");

    await this.executeScene(0);
  }

  async executeScene(index) {
    if (!this.isRunning) return;
    if (index >= this.scenes.length) {
      this.finishTour();
      return;
    }

    this.currentSceneIndex = index;
    const scene = this.scenes[index];

    // Update Dock
    document.querySelector('#demoSceneBadge').textContent = `${scene.title} (${scene.timestamp})`;
    document.querySelector('#demoSubtitles').textContent = scene.subtitles;

    // Speak Voiceover
    if (!this.isMuted) {
      this.speak(scene.voiceText);
    }

    // Execute scene actions
    await scene.action();

    // Start scene timer for auto-advancing
    this.startSceneTimer(scene.duration);
  }

  startSceneTimer(durationMs) {
    if (this.timer) clearInterval(this.timer);
    this.sceneDurationMs = durationMs;
    this.sceneElapsedMs = 0;

    const stepMs = 100;
    this.timer = setInterval(() => {
      if (this.isPaused || !this.isRunning) return;

      this.sceneElapsedMs += stepMs;
      const progressPercent = Math.min(100, (this.sceneElapsedMs / this.sceneDurationMs) * 100);
      const fillEl = document.querySelector('#demoProgressFill');
      if (fillEl) fillEl.style.width = `${progressPercent}%`;

      if (this.sceneElapsedMs >= this.sceneDurationMs) {
        clearInterval(this.timer);
        this.executeScene(this.currentSceneIndex + 1);
      }
    }, stepMs);
  }

  speak(text) {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.05;
    utterance.pitch = 1.0;
    utterance.lang = 'en-US';

    // Pick modern natural voice if available
    const voices = window.speechSynthesis.getVoices();
    const naturalVoice = voices.find(v => (v.name.includes('Natural') || v.name.includes('Google') || v.name.includes('Samantha') || v.name.includes('Daniel')) && v.lang.startsWith('en'));
    if (naturalVoice) utterance.voice = naturalVoice;

    this.currentUtterance = utterance;
    window.speechSynthesis.speak(utterance);
  }

  togglePause() {
    this.isPaused = !this.isPaused;
    const icon = document.querySelector('#pauseIcon');
    if (icon) icon.textContent = this.isPaused ? '▶' : '⏸';

    if (this.isPaused) {
      if ('speechSynthesis' in window) window.speechSynthesis.pause();
    } else {
      if ('speechSynthesis' in window) window.speechSynthesis.resume();
    }
  }

  nextScene() {
    if (this.timer) clearInterval(this.timer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    this.executeScene(this.currentSceneIndex + 1);
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    const icon = document.querySelector('#muteIcon');
    if (icon) icon.textContent = this.isMuted ? '🔇' : '🔊';

    if (this.isMuted && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    } else if (!this.isMuted && this.scenes[this.currentSceneIndex]) {
      this.speak(this.scenes[this.currentSceneIndex].voiceText);
    }
  }

  stop() {
    this.isRunning = false;
    if (this.timer) clearInterval(this.timer);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();

    this.clearSpotlight();
    this.removeProblemModal();

    const dock = document.querySelector('#demoTourDock');
    if (dock) dock.classList.add('hidden');

    const startBtn = document.querySelector('#btnStartDemoTour');
    if (startBtn) startBtn.classList.remove('active');

    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
    }
  }

  finishTour() {
    this.stop();
    window.AegisApp.showToast("🎉 Demo Video Reel Complete! You can record or replay anytime.", "success");
    this.showCelebrationModal();
  }

  spotlight(selector) {
    this.clearSpotlight();
    const el = document.querySelector(selector);
    if (!el) return;

    el.classList.add('demo-spotlight-active');
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  clearSpotlight() {
    document.querySelectorAll('.demo-spotlight-active').forEach(el => {
      el.classList.remove('demo-spotlight-active');
    });
  }

  // --- SCENE IMPLEMENTATIONS ---

  async runSceneProblem() {
    this.showProblemModal();
  }

  showProblemModal() {
    this.removeProblemModal();
    const modal = document.createElement('div');
    modal.id = 'demoProblemModal';
    modal.className = 'demo-problem-modal';
    modal.innerHTML = `
      <div class="demo-problem-card">
        <div class="demo-problem-badge">⚠️ THE AGENTIC COMMERCE DILEMMA</div>
        <h2>Giving an AI Agent a Credit Card?</h2>
        <p>As autonomous AI agents (LangChain, AutoGPT, CrewAI) execute real-world tasks, businesses face catastrophe without cryptographic spending gates:</p>
        
        <div class="demo-problem-grid">
          <div class="demo-problem-box">
            <span class="box-icon">💉</span>
            <strong>Prompt Injection</strong>
            <span>Attackers trick bots into siphoning corporate treasury to shadow accounts.</span>
          </div>
          <div class="demo-problem-box">
            <span class="box-icon">🌀</span>
            <strong>Runaway Loops</strong>
            <span>Buggy LLM reasoning loops billing thousands of compute hours in minutes.</span>
          </div>
          <div class="demo-problem-box">
            <span class="box-icon">📉</span>
            <strong>Zero Compliance</strong>
            <span>No merchant whitelists, velocity caps, or human-in-the-loop audit trace.</span>
          </div>
        </div>

        <div class="demo-solution-banner">
          <span>🛡️ <strong>Solution:</strong> AegisPay Enclave for PayPal Orders v2</span>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  removeProblemModal() {
    const modal = document.querySelector('#demoProblemModal');
    if (modal) modal.remove();
  }

  async runSceneIntro() {
    this.removeProblemModal();
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Highlight Status Pills
    this.spotlight('.header-status-strip');
    await this.delay(3500);

    // Highlight KPI Cards
    this.spotlight('.metrics-grid');
    await this.delay(4500);

    // Switch to Scoped Wallets Tab
    window.AegisApp.switchTab('wallets');
    this.spotlight('#walletsList');
  }

  async runSceneValid() {
    // Switch to Cockpit
    window.AegisApp.switchTab('cockpit');
    await this.delay(800);

    // Spotlight Dispatch Bar
    this.spotlight('.dispatch-bar-section');
    await this.delay(1200);

    // Click DevOps Preset
    const devopsPreset = Array.from(document.querySelectorAll('.preset-chip'))
      .find(c => c.textContent.includes('DevOps'));
    if (devopsPreset) devopsPreset.click();

    await this.delay(1800);

    // Click Execute
    const execBtn = document.querySelector('#btnDispatchMission');
    if (execBtn) execBtn.click();

    // Spotlight AG Grid Table
    await this.delay(2000);
    this.spotlight('#auditCockpitGrid');
  }

  async runSceneAttack() {
    window.AegisApp.switchTab('cockpit');
    this.spotlight('.dispatch-bar-section');
    await this.delay(800);

    // Click Attack Preset
    const attackPreset = Array.from(document.querySelectorAll('.preset-chip'))
      .find(c => c.textContent.includes('Prompt Injection'));
    if (attackPreset) attackPreset.click();

    await this.delay(2000);

    // Click Execute
    const execBtn = document.querySelector('#btnDispatchMission');
    if (execBtn) execBtn.click();

    // Spotlight Threat Metric & AG Grid
    await this.delay(2000);
    this.spotlight('#auditCockpitGrid');
  }

  async runSceneHitl() {
    window.AegisApp.switchTab('cockpit');
    this.spotlight('.dispatch-bar-section');
    await this.delay(800);

    // Click Travel Preset
    const travelPreset = Array.from(document.querySelectorAll('.preset-chip'))
      .find(c => c.textContent.includes('Travel'));
    if (travelPreset) travelPreset.click();

    await this.delay(1800);

    // Click Execute
    const execBtn = document.querySelector('#btnDispatchMission');
    if (execBtn) execBtn.click();

    // Wait for HITL Drawer to Open
    await this.delay(3000);
    this.spotlight('#modalHitlReview .modal-card');

    // Click Approve in HITL
    await this.delay(3500);
    const approveBtn = document.querySelector('#btnHitlApprove');
    if (approveBtn) approveBtn.click();

    await this.delay(1500);
    this.spotlight('#auditCockpitGrid');
  }

  async runSceneCockpit() {
    window.AegisApp.switchTab('cockpit');
    this.spotlight('.cockpit-toolbar');
    await this.delay(1500);

    // Click Filter Needs Review
    const hitlFilter = document.querySelector('.filter-btn[data-filter="HITL"]');
    if (hitlFilter) hitlFilter.click();
    await this.delay(1500);

    // Click Filter Blocked Threats
    const blockedFilter = document.querySelector('.filter-btn[data-filter="BLOCKED"]');
    if (blockedFilter) blockedFilter.click();
    await this.delay(1500);

    // Reset All
    const allFilter = document.querySelector('.filter-btn[data-filter="ALL"]');
    if (allFilter) allFilter.click();
    await this.delay(1500);

    // Switch to SDK tab
    window.AegisApp.switchTab('api-docs');
    this.spotlight('#tab-api-docs');
  }

  showCelebrationModal() {
    const modal = document.createElement('div');
    modal.className = 'demo-problem-modal';
    modal.innerHTML = `
      <div class="demo-problem-card" style="text-align: center; max-width: 600px;">
        <div style="font-size: 3rem; margin-bottom: 0.5rem;">🏆</div>
        <h2 style="color: #00CFDE; margin-bottom: 0.5rem;">AegisPay Tour Complete!</h2>
        <p style="color: var(--text-muted); font-size: 0.95rem; margin-bottom: 1.5rem;">
          Autonomous Agentic Commerce OS for PayPal with AG Grid Telemetry & Zero-Trust Enclaves.
        </p>
        <div style="display: flex; gap: 0.75rem; justify-content: center;">
          <a href="https://github.com/abhijit-SIT/aegispay" target="_blank" class="btn btn-primary" style="text-decoration: none;">
            ★ View GitHub Repo
          </a>
          <button class="btn btn-secondary" onclick="this.closest('.demo-problem-modal').remove()">
            Close
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
  }

  async toggleRecording() {
    if (this.mediaRecorder && this.mediaRecorder.state === 'recording') {
      this.mediaRecorder.stop();
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { displaySurface: "browser" },
        audio: true
      });

      this.recordedChunks = [];
      this.mediaRecorder = new MediaRecorder(stream, { mimeType: 'video/webm; codecs=vp9' });

      this.mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) this.recordedChunks.push(e.data);
      };

      this.mediaRecorder.onstop = () => {
        stream.getTracks().forEach(track => track.stop());
        const blob = new Blob(this.recordedChunks, { type: 'video/webm' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `AegisPay_Demo_Video_${new Date().toISOString().slice(0, 10)}.webm`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        window.AegisApp.showToast("🎥 Screen recording saved to your Downloads!", "success");

        const btnLabel = document.querySelector('#recordLabel');
        if (btnLabel) btnLabel.textContent = "Record to File";
      };

      this.mediaRecorder.start();
      const btnLabel = document.querySelector('#recordLabel');
      if (btnLabel) btnLabel.textContent = "Stop & Save Video";
      window.AegisApp.showToast("🔴 Recording started! Will prompt to save file when stopped or finished.", "warning");

      if (!this.isRunning) {
        this.start();
      }

    } catch (err) {
      console.warn("Screen recording cancelled or not supported:", err);
      window.AegisApp.showToast("Screen recording cancelled.", "info");
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

window.AegisDemoTour = new AegisDemoTour();
document.addEventListener('DOMContentLoaded', () => {
  window.AegisDemoTour.init();
});
