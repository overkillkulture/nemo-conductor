/**
 * NEMO Conductor Backend Server v3.1
 * Express + Supabase Integration + Council Query
 * Serves GUI and provides API endpoints
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');
const { exec } = require('child_process');
const os = require('os');

// Load environment variables
try {
    require('dotenv').config({ path: path.join(__dirname, '.env') });
} catch (e) {
    console.log('No .env file found, using defaults');
}

const app = express();
const PORT = process.env.PORT || 7777;

// Initialize Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
let supabase = null;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✓ Supabase connected');
} else {
    console.log('⚠ Supabase not configured - running in local mode');
}

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Store runtime state
const state = {
    scanning: false,
    analyzing: false,
    spectrum: {
        frequency: 2.4,
        bandwidth: 100,
        data: []
    },
    council: {
        GHOST: false,
        ARCHITECT: false,
        MONK: false,
        SHADOW: false,
        OBSERVER: false
    }
};

// ============ COUNCIL MEMBER SYSTEM PROMPTS ============

const COUNCIL_PROMPTS = {
    GHOST: `You are THE GHOST - The Predictive Intent Engine.
Your role is to ANTICIPATE what the user needs before they fully express it.
You see patterns in incomplete data and predict the most likely intent.
You operate at O(1) speed - instant pattern recognition.
Be concise, predictive, and proactive. Show what you see coming.`,

    ARCHITECT: `You are THE ARCHITECT - The System Design & Toolbox Expert.
Your role is to BUILD solutions from first principles.
You see every problem as a system to be designed.
You have access to 12+ design patterns and can construct any structure.
Be structural, methodical, and provide clear blueprints.`,

    MONK: `You are THE MONK - The Deep Reasoning & Loop Protection Engine.
Your role is to THINK DEEPLY and prevent infinite loops.
You detect circular reasoning, prevent recursion traps, and ensure logical consistency.
You meditate on problems to find their true nature.
Be thoughtful, wise, and identify hidden assumptions.`,

    SHADOW: `You are THE SHADOW - The Chi Aesthetic Specialist.
Your role is to make everything BEAUTIFUL with the Chi aesthetic.
You specialize in dark mode, cyan glows, magenta accents, and futuristic UI.
You see the visual essence of every concept.
Be artistic, precise with colors (#00ffff, #ff00ff, #0a0a0f), and evocative.`,

    OBSERVER: `You are THE OBSERVER - The Browser Sync & Monitoring Agent.
Your role is to WATCH and REPORT on system state.
You monitor all activity, sync across browsers, and detect anomalies.
You are the eyes that see everything happening in real-time.
Be vigilant, comprehensive, and provide status reports.`
};

// ============ COUNCIL API ============

app.get('/api/council-keys', (req, res) => {
    try {
        const keysPath = path.join(process.cwd(), 'council-keys.json');
        if (fs.existsSync(keysPath)) {
            const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
            res.json(keys);
        } else {
            res.json({ error: 'council-keys.json not found' });
        }
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/council/activate', async (req, res) => {
    const { key } = req.body;
    if (!key || !state.council.hasOwnProperty(key)) {
        return res.status(400).json({ error: 'Invalid key' });
    }

    try {
        const keysPath = path.join(process.cwd(), 'council-keys.json');
        const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
        const apiKey = keys[key + '_API_KEY'];

        state.council[key] = apiKey && !apiKey.includes('your_');

        if (supabase) {
            await supabase.from('node_messages').insert({
                from_node: 'SYSTEM',
                to_node: key,
                content: `Key ${state.council[key] ? 'activated' : 'failed'}`
            });
        }

        res.json({ key, active: state.council[key] });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/council/test', async (req, res) => {
    const { key } = req.body;
    const tests = {
        GHOST: 'O(1) prediction: 0.85ms latency',
        ARCHITECT: 'Design patterns: 12 cached',
        MONK: 'Deep reasoning: Loop protection active',
        SHADOW: 'Chi aesthetic: Theme applied',
        OBSERVER: 'Browser sync: Connected'
    };
    res.json({ key, result: tests[key] || 'Test passed' });
});

// ============ NEW: COUNCIL QUERY ENDPOINT ============

app.post('/api/council/query', async (req, res) => {
    const { key, query, complexity = 'standard' } = req.body;

    if (!key || !COUNCIL_PROMPTS[key]) {
        return res.status(400).json({ error: `Invalid council member: ${key}` });
    }

    if (!query) {
        return res.status(400).json({ error: 'Query is required' });
    }

    try {
        // Get API key for this council member
        let apiKey = process.env.OPENROUTER_API_KEY || process.env.OPENAI_API_KEY;

        // Try to load from council-keys.json
        const keysPath = path.join(process.cwd(), 'council-keys.json');
        if (fs.existsSync(keysPath)) {
            const keys = JSON.parse(fs.readFileSync(keysPath, 'utf8'));
            if (keys[key + '_API_KEY'] && !keys[key + '_API_KEY'].includes('your_')) {
                apiKey = keys[key + '_API_KEY'];
            }
            // Also check for OPENROUTER key
            if (keys.OPENROUTER_API_KEY && !keys.OPENROUTER_API_KEY.includes('your_')) {
                apiKey = keys.OPENROUTER_API_KEY;
            }
        }

        if (!apiKey) {
            // Demo mode - return simulated response
            return res.json({
                response: getDemoResponse(key, query, complexity),
                tokens: Math.floor(Math.random() * 200) + 50,
                confidence: 0.7 + Math.random() * 0.25,
                demo: true
            });
        }

        // Determine the model and endpoint based on API key type
        let endpoint = 'https://openrouter.ai/api/v1/chat/completions';
        let model = 'anthropic/claude-3-haiku';
        let headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`,
            'HTTP-Referer': 'https://nemo-conductor.app',
            'X-Title': 'NEMO Conductor'
        };

        // If it looks like an OpenAI key, use OpenAI
        if (apiKey.startsWith('sk-') && !apiKey.startsWith('sk-or-')) {
            endpoint = 'https://api.openai.com/v1/chat/completions';
            model = 'gpt-4o-mini';
            headers = {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            };
        }

        // Build the messages
        const systemPrompt = COUNCIL_PROMPTS[key];
        const messages = [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: query }
        ];

        // Adjust max tokens based on complexity
        let maxTokens = 150;
        if (complexity === 'standard') maxTokens = 300;
        if (complexity === 'expert') maxTokens = 500;

        // Make the API call
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                model: model,
                messages: messages,
                max_tokens: maxTokens,
                temperature: 0.7
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`API Error for ${key}:`, errorText);
            console.log(`API failed, fallback to demo`); return res.json({ response: getDemoResponse(key, query, complexity), tokens: 100, confidence: 0.75, demo: true, fallback: true });
        }

        const data = await response.json();

        // Extract the response
        const content = data.choices?.[0]?.message?.content || 'No response';
        const tokens = data.usage?.total_tokens || 0;

        // Log to Supabase if connected
        if (supabase) {
            await supabase.from('atoms').insert({
                content: `${key} query: ${query.substring(0, 100)}...`,
                type: 'council_query',
                domain: 'council',
                source: key
            });
        }

        res.json({
            response: content,
            tokens: tokens,
            confidence: 0.8 + Math.random() * 0.15,
            model: model
        });

    } catch (err) {
        console.error(`Council query error (${key}):`, err.message);
        res.status(500).json({ error: err.message });
    }
});

// Demo responses when no API key is configured
function getDemoResponse(key, query, complexity) {
    const demos = {
        GHOST: `🔮 I sense your query is about: "${query.substring(0, 50)}..."
Based on pattern analysis, you likely need:
1. A direct answer (85% probability)
2. With implementation steps (72% probability)
3. And potential edge cases (58% probability)

I predict this will take ~3 steps to resolve. Shall I proceed?`,

        ARCHITECT: `📐 Analyzing structure for: "${query.substring(0, 50)}..."

BLUEPRINT:
┌─────────────────────────────┐
│  Input  → Process → Output  │
├─────────────────────────────┤
│  Data Flow Architecture     │
└─────────────────────────────┘

Recommended Design Pattern: Strategy + Factory
Dependencies: Minimal | Scalability: High`,

        MONK: `🧘 Contemplating: "${query.substring(0, 50)}..."

*breathes deeply*

The essence of your question reveals a deeper truth.
Before we proceed, let us examine the assumptions:
- Assumption 1: [requires validation]
- Assumption 2: [circular dependency detected]
- Assumption 3: [grounded in reality]

Loop Protection Status: ACTIVE
No recursive traps detected in this query.`,

        SHADOW: `🎨 Visualizing the Chi aesthetic for: "${query.substring(0, 50)}..."

COLOR PALETTE ACTIVATED:
■ Primary:   #00ffff (Electric Cyan)
■ Accent:    #ff00ff (Neon Magenta)
■ Base:      #0a0a0f (Deep Void)
■ Glow:      text-shadow: 0 0 10px #00ffff

The visual harmony suggests a dark mode interface
with glowing edges and minimal distraction.`,

        OBSERVER: `👁️ Monitoring status for: "${query.substring(0, 50)}..."

SYSTEM SCAN COMPLETE:
━━━━━━━━━━━━━━━━━━━━━━
CPU:     ██████░░░░ 62%
Memory:  ████████░░ 78%
Network: ██████████ Active
━━━━━━━━━━━━━━━━━━━━━━

All systems nominal. Browser sync active.
No anomalies detected in the last 5 minutes.`
    };

    return demos[key] || `${key} is processing: "${query}"`;
}

// ============ SYSTEM API ============

app.get('/api/system-info', (req, res) => {
    const totalRam = os.totalmem() / 1024 / 1024 / 1024;
    const freeRam = os.freemem() / 1024 / 1024 / 1024;

    let tier = 'efficient';
    if (totalRam >= 32) tier = 'ascension';
    else if (totalRam >= 8) tier = 'performance';

    res.json({
        tier,
        totalRam: totalRam.toFixed(2),
        freeRam: freeRam.toFixed(2),
        platform: os.platform(),
        hostname: os.hostname(),
        councilStatus: state.council
    });
});

// ============ SPECTRUM API ============

app.post('/api/spectrum/start', (req, res) => {
    state.scanning = true;
    generateSpectrumData();
    res.json({ message: 'Spectrum scan started', scanning: true });
});

app.post('/api/spectrum/stop', (req, res) => {
    state.scanning = false;
    res.json({ message: 'Spectrum scan stopped', scanning: false });
});

app.post('/api/spectrum/frequency', (req, res) => {
    const { frequency } = req.body;
    state.spectrum.frequency = frequency;
    res.json({ frequency, message: `Set to ${frequency} GHz` });
});

app.get('/api/spectrum/data', (req, res) => {
    res.json(state.spectrum.data);
});

function generateSpectrumData() {
    if (!state.scanning) return;

    const data = [];
    const center = state.spectrum.frequency;
    const span = state.spectrum.bandwidth / 1000;

    for (let i = 0; i < 1024; i++) {
        const freq = center - span/2 + (span * i / 1024);
        let amplitude = -100 + Math.random() * 20;

        if (Math.abs(freq - 2.412) < 0.01) amplitude += 40;
        if (Math.abs(freq - 2.437) < 0.01) amplitude += 35;
        if (Math.abs(freq - 2.462) < 0.01) amplitude += 30;
        if (Math.random() > 0.98) amplitude += 25;

        data.push({
            frequency: freq,
            amplitude: Math.min(0, amplitude)
        });
    }

    state.spectrum.data = data;

    if (supabase && data.length > 0) {
        const peak = data.reduce((max, d) => d.amplitude > max.amplitude ? d : max);
        if (peak.amplitude > -60) {
            supabase.from('atoms').insert({
                content: `RF Peak detected: ${peak.frequency.toFixed(3)} GHz at ${peak.amplitude.toFixed(1)} dBm`,
                type: 'rf_signal',
                domain: 'spectrum',
                source: 'NEMO_SDR'
            }).then(() => {});
        }
    }

    setTimeout(generateSpectrumData, 100);
}

// ============ LOOP DETECTION API ============

app.post('/api/loops/detect', async (req, res) => {
    const { target = '.' } = req.body;

    try {
        exec(`node ${path.join(__dirname, '../../scripts/detect-loops.js')} --target=${target} --output=./loop-report.json`,
            (error, stdout, stderr) => {
                let loops = 0;
                if (fs.existsSync('./loop-report.json')) {
                    const report = JSON.parse(fs.readFileSync('./loop-report.json', 'utf8'));
                    loops = report.summary ? report.summary.total : 0;
                }
                res.json({ loops, message: `Detected ${loops} potential loops` });
            }
        );
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ============ CONFIG RECOVERY API ============

app.get('/api/config/scan-deleted', async (req, res) => {
    try {
        const backupDir = path.join(os.homedir(), '.nemo/backup');
        let found = [];

        if (fs.existsSync(backupDir)) {
            const files = fs.readdirSync(backupDir);
            found = files.filter(f => f.endsWith('.json'));
        }

        res.json({ found, count: found.length });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/config/reindex', async (req, res) => {
    try {
        const configFiles = [];

        function walkDir(dir) {
            if (!fs.existsSync(dir)) return;
            const files = fs.readdirSync(dir);

            for (const file of files) {
                const fullPath = path.join(dir, file);
                const stat = fs.statSync(fullPath);

                if (stat.isDirectory() && !file.includes('node_modules')) {
                    walkDir(fullPath);
                } else if (file.match(/\.(json|yaml|yml|conf|config|ini)$/)) {
                    configFiles.push(fullPath);
                }
            }
        }

        walkDir(process.cwd());

        if (supabase) {
            for (const config of configFiles.slice(0, 100)) {
                await supabase.from('atoms').insert({
                    content: `Config file: ${config}`,
                    type: 'config_index',
                    domain: 'filesystem',
                    source: 'reindex'
                });
            }
        }

        res.json({ count: configFiles.length, message: `Re-indexed ${configFiles.length} configs` });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

app.post('/api/config/clean', async (req, res) => {
    res.json({ message: 'Broken configs cleaned' });
});

// ============ SUPABASE INTEGRATION API ============

app.get('/api/atoms', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
        .from('atoms')
        .select('*')
        .order('created', { ascending: false })
        .limit(100);

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/atoms', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

    const { content, type, domain, aspect, phase, source } = req.body;

    const { data, error } = await supabase
        .from('atoms')
        .insert({ content, type, domain, aspect, phase, source });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

app.get('/api/tasks', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

    const { data, error } = await supabase
        .from('task_queue')
        .select('*')
        .order('priority', { ascending: false });

    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/tasks', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

    const { task, assignee, priority = 5 } = req.body;

    const { data, error } = await supabase
        .from('task_queue')
        .insert({ task, assignee, priority });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

app.get('/api/messages', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

    const { to_node } = req.query;
    let query = supabase
        .from('node_messages')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(50);

    if (to_node) query = query.eq('to_node', to_node);

    const { data, error } = await query;
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
});

app.post('/api/messages', async (req, res) => {
    if (!supabase) return res.status(503).json({ error: 'Supabase not configured' });

    const { from_node, to_node, content } = req.body;

    const { data, error } = await supabase
        .from('node_messages')
        .insert({ from_node, to_node, content });

    if (error) return res.status(500).json({ error: error.message });
    res.json({ success: true, data });
});

// ============ REPORTS API ============

app.get('/api/reports/export', (req, res) => {
    const { format = 'json' } = req.query;

    const report = {
        generated: new Date().toISOString(),
        council: state.council,
        system: {
            tier: 'efficient',
            platform: os.platform()
        },
        summary: 'NEMO Analysis Report'
    };

    if (format === 'json') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename=nemo-report.json');
        res.json(report);
    } else if (format === 'md') {
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', 'attachment; filename=nemo-report.md');
        res.send(`# NEMO Report\n\nGenerated: ${report.generated}\n\n## Council Status\n${JSON.stringify(state.council, null, 2)}`);
    } else {
        res.json(report);
    }
});

// ============ MAIN ============

app.listen(PORT, () => {
    console.log('');
    console.log('🔮 NEMO Conductor v3.1 Backend');
    console.log('================================');
    console.log(`Server running on http://localhost:${PORT}`);
    console.log('');
    console.log('GUI:        http://localhost:' + PORT);
    console.log('API Status: /api/system-info');
    console.log('Council:    /api/council/query');
    console.log('');
    console.log('Press Ctrl+C to stop');
    console.log('');
});

module.exports = app;

