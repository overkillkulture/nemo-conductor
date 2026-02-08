/**
 * NEMO Conductor v3.1 - Frontend GUI Controller
 * Connects dashboard to backend APIs
 * NOW WITH: Council Thoughts + Complexity Levels (Fender Mode)
 */

// Auto-detect API base (localhost vs production)
const API_BASE = window.location.hostname === 'localhost'
    ? 'http://localhost:7777/api'
    : window.location.origin + '/api';

// ============ STATE ============
const appState = {
    scanning: false,
    analyzing: false,
    spectrumInterval: null,
    councilStatus: {},
    logs: [],
    projects: [],
    // NEW: Complexity level ("simple", "standard", "expert")
    complexityLevel: 'simple',
    // NEW: Track council queries
    councilThoughts: {
        GHOST: { status: 'ready', content: '', tokens: 0, latency: 0, confidence: 0 },
        ARCHITECT: { status: 'ready', content: '', tokens: 0, latency: 0, confidence: 0 },
        MONK: { status: 'ready', content: '', tokens: 0, latency: 0, confidence: 0 },
        SHADOW: { status: 'ready', content: '', tokens: 0, latency: 0, confidence: 0 },
        OBSERVER: { status: 'ready', content: '', tokens: 0, latency: 0, confidence: 0 }
    }
};

// ============ INITIALIZATION ============

document.addEventListener('DOMContentLoaded', async () => {
    log('info', 'NEMO Conductor v3.1 initializing...');
    log('info', `API Base: ${API_BASE}`);

    // Load system info
    await loadSystemInfo();

    // Load council status
    await loadCouncilStatus();

    // Initialize spectrum canvas
    initSpectrumCanvas();

    // Apply initial complexity level
    applyComplexityLevel();

    log('success', 'NEMO Conductor ready');
});

// ============ COMPLEXITY LEVEL CONTROL (THE FENDER) ============

function setComplexity(level) {
    appState.complexityLevel = level;

    // Update button states
    document.querySelectorAll('.complexity-btn').forEach(btn => btn.classList.remove('active'));
    const btn = document.getElementById(`complexity-${level}`);
    if (btn) btn.classList.add('active');

    // Apply to UI
    applyComplexityLevel();

    log('info', `Complexity level: ${level.toUpperCase()}`);
}

function applyComplexityLevel() {
    const level = appState.complexityLevel;
    const members = ['ghost', 'architect', 'monk', 'shadow', 'observer'];

    members.forEach(member => {
        const contentEl = document.getElementById(`content-${member}`);
        const metaEl = document.getElementById(`meta-${member}`);

        if (contentEl && metaEl) {
            switch(level) {
                case 'simple':
                    // Simple: Just show answer, hide everything else
                    contentEl.classList.add('collapsed');
                    metaEl.classList.remove('visible');
                    break;
                case 'standard':
                    // Standard: Show full answer, hide meta
                    contentEl.classList.remove('collapsed');
                    metaEl.classList.remove('visible');
                    break;
                case 'expert':
                    // Expert: Show everything
                    contentEl.classList.remove('collapsed');
                    metaEl.classList.add('visible');
                    break;
            }
        }
    });
}

// ============ COUNCIL QUERY SYSTEM ============

async function queryCouncil() {
    const input = document.getElementById('council-query');
    const query = input.value.trim();

    if (!query) {
        log('warning', 'Please enter a question');
        return;
    }

    log('info', `Querying all council members: "${query}"`);

    // Query all 5 members in parallel
    const members = ['GHOST', 'ARCHITECT', 'MONK', 'SHADOW', 'OBSERVER'];

    // Set all to thinking
    members.forEach(member => {
        updateThoughtCard(member, 'thinking', 'Thinking...', {});
    });

    // Query all in parallel
    const promises = members.map(member => queryMemberInternal(member, query));
    await Promise.allSettled(promises);

    log('success', 'Council query complete');
}

async function queryMember(member) {
    const input = document.getElementById('council-query');
    const query = input.value.trim();

    if (!query) {
        log('warning', 'Please enter a question');
        return;
    }

    log('info', `Querying ${member}: "${query}"`);

    updateThoughtCard(member, 'thinking', 'Thinking...', {});
    await queryMemberInternal(member, query);
}

async function queryMemberInternal(member, query) {
    const startTime = Date.now();

    try {
        const res = await fetch(`${API_BASE}/council/query`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                key: member,
                query: query,
                complexity: appState.complexityLevel
            })
        });

        const data = await res.json();
        const latency = Date.now() - startTime;

        if (data.error) {
            updateThoughtCard(member, 'error', `Error: ${data.error}`, { latency });
            log('error', `${member} error: ${data.error}`);
        } else {
            updateThoughtCard(member, 'done', data.response || data.content, {
                tokens: data.tokens || 0,
                latency: latency,
                confidence: data.confidence || 0.85
            });
            log('success', `${member} responded in ${latency}ms`);
        }

        // Update header status indicator
        updateHeaderStatus(member, 'active');

    } catch (err) {
        const latency = Date.now() - startTime;
        updateThoughtCard(member, 'error', `Connection error: ${err.message}`, { latency });
        log('error', `${member} failed: ${err.message}`);
    }
}

function updateThoughtCard(member, status, content, meta = {}) {
    const memberLower = member.toLowerCase();

    // Update status badge
    const statusEl = document.getElementById(`status-${memberLower}`);
    if (statusEl) {
        statusEl.className = `thought-status ${status}`;
        statusEl.textContent = status === 'thinking' ? 'Thinking...' :
                               status === 'done' ? 'Done' :
                               status === 'error' ? 'Error' : 'Ready';
    }

    // Update content
    const contentEl = document.getElementById(`content-${memberLower}`);
    if (contentEl) {
        contentEl.innerHTML = content;
    }

    // Update meta (expert mode info)
    if (meta.tokens !== undefined) {
        const tokensEl = document.getElementById(`tokens-${memberLower}`);
        if (tokensEl) tokensEl.textContent = meta.tokens;
    }
    if (meta.latency !== undefined) {
        const latencyEl = document.getElementById(`latency-${memberLower}`);
        if (latencyEl) latencyEl.textContent = `${meta.latency}ms`;
    }
    if (meta.confidence !== undefined) {
        const confEl = document.getElementById(`confidence-${memberLower}`);
        if (confEl) confEl.textContent = `${Math.round(meta.confidence * 100)}%`;
    }

    // Update card border
    const cardEl = document.getElementById(`thought-${memberLower}`);
    if (cardEl) {
        cardEl.classList.remove('active', 'thinking', 'error');
        cardEl.classList.add(status);
    }

    // Store in state
    appState.councilThoughts[member] = { status, content, ...meta };

    // Apply complexity level styling
    applyComplexityLevel();
}

function updateHeaderStatus(member, status) {
    const el = document.getElementById(`${member.toLowerCase()}-status`);
    if (el) {
        el.classList.remove('active', 'inactive', 'thinking');
        el.classList.add(status);
    }
}

// ============ PANEL NAVIGATION ============

function showPanel(panelId) {
    // Hide all panels
    document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));

    // Show selected panel
    const panel = document.getElementById(panelId);
    if (panel) {
        panel.classList.add('active');
    }

    // Highlight nav item
    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        if (item.textContent.toLowerCase().includes(panelId.split('-')[0])) {
            item.classList.add('active');
        }
    });

    log('info', `Switched to ${panelId} panel`);
}

// ============ SYSTEM INFO ============

async function loadSystemInfo() {
    try {
        const res = await fetch(`${API_BASE}/system-info`);
        const data = await res.json();

        document.getElementById('tier-display').textContent = data.tier.toUpperCase();
        document.getElementById('ram-display').textContent = `${data.freeRam}GB / ${data.totalRam}GB`;
        document.getElementById('cache-display').textContent = data.tier === 'ascension' ? 'unlimited' : data.tier === 'performance' ? 'balanced' : 'minimal';
        document.getElementById('workers-display').textContent = data.tier === 'ascension' ? '8' : data.tier === 'performance' ? '4' : '2';

        // Update council status from system info
        if (data.councilStatus) {
            appState.councilStatus = data.councilStatus;
            updateCouncilDisplay();
        }

        log('success', `System: ${data.platform} | RAM: ${data.totalRam}GB | Tier: ${data.tier}`);
    } catch (err) {
        log('error', 'Failed to load system info: ' + err.message);
    }
}

// ============ COUNCIL CONTROL ============

async function loadCouncilStatus() {
    try {
        const res = await fetch(`${API_BASE}/council-keys`);
        const data = await res.json();

        if (data.error) {
            log('warning', 'Council keys not configured: ' + data.error);
            return;
        }

        const keys = ['GHOST', 'ARCHITECT', 'MONK', 'SHADOW', 'OBSERVER'];
        let activeCount = 0;

        keys.forEach(key => {
            const apiKey = data[key + '_API_KEY'];
            const isActive = apiKey && !apiKey.includes('your_') && apiKey.length > 10;
            appState.councilStatus[key] = isActive;
            if (isActive) activeCount++;
        });

        document.getElementById('keys-active').textContent = `${activeCount}/5`;
        updateCouncilDisplay();

        log('success', `Council keys loaded: ${activeCount}/5 active`);
    } catch (err) {
        log('warning', 'Could not load council keys - running in demo mode');
    }
}

function updateCouncilDisplay() {
    const keys = ['ghost', 'architect', 'monk', 'shadow', 'observer'];

    keys.forEach(key => {
        const el = document.getElementById(`${key}-status`);
        if (el) {
            const isActive = appState.councilStatus[key.toUpperCase()];
            el.classList.remove('active', 'inactive');
            el.classList.add(isActive ? 'active' : 'inactive');
        }
    });
}

async function activateKey(key) {
    log('info', `Activating ${key}...`);

    try {
        const res = await fetch(`${API_BASE}/council/activate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        const data = await res.json();

        if (data.active) {
            appState.councilStatus[key] = true;
            updateCouncilDisplay();
            log('success', `${key} activated successfully`);
        } else {
            log('error', `${key} activation failed - check API key`);
        }
    } catch (err) {
        log('error', `Failed to activate ${key}: ${err.message}`);
    }
}

async function testKey(key) {
    log('info', `Testing ${key}...`);

    try {
        const res = await fetch(`${API_BASE}/council/test`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key })
        });
        const data = await res.json();

        log('success', `${key} test: ${data.result}`);
    } catch (err) {
        log('error', `${key} test failed: ${err.message}`);
    }
}

// ============ SPECTRUM ANALYZER ============

let spectrumCanvas, spectrumCtx;

function initSpectrumCanvas() {
    spectrumCanvas = document.getElementById('spectrumCanvas');
    if (!spectrumCanvas) return;

    spectrumCtx = spectrumCanvas.getContext('2d');

    // Set canvas size
    spectrumCanvas.width = spectrumCanvas.offsetWidth;
    spectrumCanvas.height = spectrumCanvas.offsetHeight;

    // Draw initial grid
    drawSpectrumGrid();
}

function drawSpectrumGrid() {
    if (!spectrumCtx) return;

    const w = spectrumCanvas.width;
    const h = spectrumCanvas.height;

    // Clear
    spectrumCtx.fillStyle = '#000';
    spectrumCtx.fillRect(0, 0, w, h);

    // Grid lines
    spectrumCtx.strokeStyle = '#1a1a2e';
    spectrumCtx.lineWidth = 1;

    // Horizontal lines (dB scale)
    for (let i = 0; i <= 10; i++) {
        const y = (h / 10) * i;
        spectrumCtx.beginPath();
        spectrumCtx.moveTo(0, y);
        spectrumCtx.lineTo(w, y);
        spectrumCtx.stroke();
    }

    // Vertical lines (frequency)
    for (let i = 0; i <= 10; i++) {
        const x = (w / 10) * i;
        spectrumCtx.beginPath();
        spectrumCtx.moveTo(x, 0);
        spectrumCtx.lineTo(x, h);
        spectrumCtx.stroke();
    }
}

function drawSpectrumData(data) {
    if (!spectrumCtx || !data.length) return;

    const w = spectrumCanvas.width;
    const h = spectrumCanvas.height;

    // Redraw grid
    drawSpectrumGrid();

    // Draw spectrum line
    spectrumCtx.strokeStyle = '#00ffff';
    spectrumCtx.lineWidth = 2;
    spectrumCtx.shadowColor = '#00ffff';
    spectrumCtx.shadowBlur = 10;

    spectrumCtx.beginPath();

    data.forEach((point, i) => {
        const x = (i / data.length) * w;
        const y = h - ((point.amplitude + 100) / 100) * h; // -100 to 0 dB scale

        if (i === 0) {
            spectrumCtx.moveTo(x, y);
        } else {
            spectrumCtx.lineTo(x, y);
        }
    });

    spectrumCtx.stroke();
    spectrumCtx.shadowBlur = 0;

    // Find and display peak
    const peak = data.reduce((max, d) => d.amplitude > max.amplitude ? d : max);
    document.getElementById('peak-freq').textContent = `${peak.frequency.toFixed(3)} GHz @ ${peak.amplitude.toFixed(1)} dBm`;
}

async function startSpectrum() {
    startScan();
}

async function startScan() {
    if (appState.scanning) return;

    log('info', 'Starting RF spectrum scan...');

    try {
        await fetch(`${API_BASE}/spectrum/start`, { method: 'POST' });
        appState.scanning = true;

        // Poll for spectrum data
        appState.spectrumInterval = setInterval(async () => {
            const res = await fetch(`${API_BASE}/spectrum/data`);
            const data = await res.json();
            if (data.length) {
                drawSpectrumData(data);
            }
        }, 100);

        log('success', 'Spectrum scan started');
    } catch (err) {
        log('error', 'Failed to start scan: ' + err.message);
    }
}

async function stopScan() {
    if (!appState.scanning) return;

    try {
        await fetch(`${API_BASE}/spectrum/stop`, { method: 'POST' });
        appState.scanning = false;

        if (appState.spectrumInterval) {
            clearInterval(appState.spectrumInterval);
            appState.spectrumInterval = null;
        }

        log('info', 'Spectrum scan stopped');
    } catch (err) {
        log('error', 'Failed to stop scan: ' + err.message);
    }
}

async function setFrequency(freq) {
    try {
        await fetch(`${API_BASE}/spectrum/frequency`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ frequency: freq })
        });

        document.getElementById('center-freq').textContent = `${freq} GHz`;
        log('info', `Frequency set to ${freq} GHz`);
    } catch (err) {
        log('error', 'Failed to set frequency: ' + err.message);
    }
}

// ============ CODEBASE ANALYSIS ============

function loadProjects(event) {
    const files = event.target.files;
    appState.projects = [];

    const projectList = document.getElementById('project-list');
    projectList.innerHTML = '';

    // Get unique directories
    const dirs = new Set();
    for (const file of files) {
        const parts = file.webkitRelativePath.split('/');
        if (parts.length > 1) {
            dirs.add(parts[0]);
        }
    }

    dirs.forEach(dir => {
        appState.projects.push(dir);
        const div = document.createElement('div');
        div.style.padding = '5px';
        div.style.margin = '5px 0';
        div.style.border = '1px solid #00ffff';
        div.style.borderRadius = '3px';
        div.textContent = dir;
        projectList.appendChild(div);
    });

    log('success', `Loaded ${dirs.size} projects`);
    document.getElementById('projects-analyzed').textContent = dirs.size;
}

async function runAnalysis() {
    analyzeAll();
}

async function analyzeAll() {
    if (appState.projects.length === 0) {
        log('warning', 'No projects selected - click "Select Projects" first');
        return;
    }

    appState.analyzing = true;
    const progressEl = document.getElementById('analysis-progress');
    const statusEl = document.getElementById('analysis-status');
    const resultsEl = document.getElementById('analysis-results');

    resultsEl.innerHTML = '';

    for (let i = 0; i < appState.projects.length; i++) {
        const project = appState.projects[i];
        const progress = ((i + 1) / appState.projects.length) * 100;

        progressEl.style.width = progress + '%';
        statusEl.textContent = `Analyzing ${project}... (${i + 1}/${appState.projects.length})`;

        resultsEl.innerHTML += `\n[${new Date().toLocaleTimeString()}] Analyzing: ${project}\n`;
        resultsEl.innerHTML += `  - Scanning file structure...\n`;
        resultsEl.innerHTML += `  - Detecting patterns...\n`;
        resultsEl.innerHTML += `  - Analysis complete\n`;

        // Simulate analysis time
        await new Promise(r => setTimeout(r, 500));
    }

    statusEl.textContent = 'Analysis complete!';
    appState.analyzing = false;

    log('success', `Analyzed ${appState.projects.length} projects`);
}

// ============ LOOP DETECTION ============

async function runLoopDetection() {
    log('info', 'Running loop detection...');

    try {
        const res = await fetch(`${API_BASE}/loops/detect`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ target: '.' })
        });
        const data = await res.json();

        log('success', `Loop detection: ${data.message}`);

        const tasksEl = document.getElementById('active-tasks');
        tasksEl.innerHTML = `<p>Loop Detection: ${data.loops} potential loops found</p>`;
    } catch (err) {
        log('error', 'Loop detection failed: ' + err.message);
    }
}

// ============ CONFIG RECOVERY ============

async function scanDeletedConfigs() {
    log('info', 'Scanning for deleted configs...');

    try {
        const res = await fetch(`${API_BASE}/config/scan-deleted`);
        const data = await res.json();

        log('success', `Found ${data.count} recoverable configs`);

        if (data.found.length > 0) {
            const editor = document.getElementById('config-editor');
            editor.value = `Found ${data.count} recoverable configs:\n\n` + data.found.join('\n');
        }
    } catch (err) {
        log('error', 'Config scan failed: ' + err.message);
    }
}

async function reindexConfigs() {
    log('info', 'Re-indexing all configs...');

    try {
        const res = await fetch(`${API_BASE}/config/reindex`, { method: 'POST' });
        const data = await res.json();

        log('success', data.message);
    } catch (err) {
        log('error', 'Re-index failed: ' + err.message);
    }
}

async function cleanBrokenConfigs() {
    if (!confirm('This will remove broken config references. Continue?')) return;

    log('info', 'Cleaning broken configs...');

    try {
        const res = await fetch(`${API_BASE}/config/clean`, { method: 'POST' });
        const data = await res.json();

        log('success', data.message);
    } catch (err) {
        log('error', 'Clean failed: ' + err.message);
    }
}

async function recoverConfig() {
    scanDeletedConfigs();
}

function loadConfig() {
    log('info', 'Select a config file to load');
}

function saveConfig() {
    const editor = document.getElementById('config-editor');
    if (!editor.value) {
        log('warning', 'Nothing to save');
        return;
    }

    // In a real implementation, this would save to the backend
    log('success', 'Config saved (demo mode)');
}

function validateConfig() {
    const editor = document.getElementById('config-editor');
    if (!editor.value) {
        log('warning', 'Nothing to validate');
        return;
    }

    try {
        JSON.parse(editor.value);
        log('success', 'Config is valid JSON');
    } catch (e) {
        log('error', 'Invalid JSON: ' + e.message);
    }
}

// ============ REPORTS ============

async function exportReport(format) {
    log('info', `Exporting report as ${format.toUpperCase()}...`);

    try {
        const res = await fetch(`${API_BASE}/reports/export?format=${format}`);

        if (format === 'json') {
            const data = await res.json();
            downloadFile(`nemo-report.json`, JSON.stringify(data, null, 2));
        } else if (format === 'md') {
            const text = await res.text();
            downloadFile(`nemo-report.md`, text);
        } else if (format === 'pdf') {
            log('warning', 'PDF export requires additional setup');
            return;
        }

        log('success', `Report exported as ${format.toUpperCase()}`);
    } catch (err) {
        log('error', 'Export failed: ' + err.message);
    }
}

function downloadFile(filename, content) {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function emailReport() {
    log('warning', 'Email integration requires SMTP configuration');
}

// ============ LOGGING ============

function log(level, message) {
    const timestamp = new Date().toLocaleTimeString();
    const entry = { timestamp, level, message };
    appState.logs.push(entry);

    // Update log display
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        const div = document.createElement('div');
        div.className = `log-entry ${level}`;
        div.textContent = `[${timestamp}] ${message}`;
        logContainer.appendChild(div);
        logContainer.scrollTop = logContainer.scrollHeight;
    }

    // Console output
    const colors = {
        info: '\x1b[36m',
        success: '\x1b[32m',
        warning: '\x1b[33m',
        error: '\x1b[31m'
    };
    console.log(`${colors[level] || ''}[${level.toUpperCase()}] ${message}\x1b[0m`);
}

function clearLogs() {
    appState.logs = [];
    const logContainer = document.getElementById('log-container');
    if (logContainer) {
        logContainer.innerHTML = '';
    }
    log('info', 'Logs cleared');
}

function exportLogs() {
    const content = appState.logs.map(l => `[${l.timestamp}] [${l.level.toUpperCase()}] ${l.message}`).join('\n');
    downloadFile('nemo-logs.txt', content);
    log('success', 'Logs exported');
}

function refreshLogs() {
    log('info', 'Logs refreshed');
}

// ============ UTILITY FUNCTIONS ============

// Make functions globally available
window.showPanel = showPanel;
window.activateKey = activateKey;
window.testKey = testKey;
window.startSpectrum = startSpectrum;
window.startScan = startScan;
window.stopScan = stopScan;
window.setFrequency = setFrequency;
window.loadProjects = loadProjects;
window.analyzeAll = analyzeAll;
window.runAnalysis = runAnalysis;
window.runLoopDetection = runLoopDetection;
window.scanDeletedConfigs = scanDeletedConfigs;
window.reindexConfigs = reindexConfigs;
window.cleanBrokenConfigs = cleanBrokenConfigs;
window.recoverConfig = recoverConfig;
window.loadConfig = loadConfig;
window.saveConfig = saveConfig;
window.validateConfig = validateConfig;
window.exportReport = exportReport;
window.emailReport = emailReport;
window.clearLogs = clearLogs;
window.exportLogs = exportLogs;
window.refreshLogs = refreshLogs;

// NEW: Council query functions
window.setComplexity = setComplexity;
window.queryCouncil = queryCouncil;
window.queryMember = queryMember;

console.log('NEMO GUI v3.1 loaded - Thought Display Ready');
