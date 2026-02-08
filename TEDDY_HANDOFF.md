# TEDDY HANDOFF - NEMO CONDUCTOR
## Pick Up Where We Left Off
**Date:** Feb 7, 2026

---

## QUICK START (5 minutes)

### 1. Clone the Repo
```bash
git clone https://github.com/overkor-tek/nemo-conductor.git
cd nemo-conductor/gui/backend
npm install
```

### 2. Set Your API Key
Create `.env` file:
```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

Or get one at https://openrouter.ai (add $5-10 credits)

### 3. Run Locally
```bash
node server.js
# Opens at http://localhost:3000
```

### 4. Open the 5-Panel Workspace
```
http://localhost:3000/council-workspace.html
```

---

## WHAT YOU'RE LOOKING AT

**5 AI council members** that answer the same question from different angles:

| Panel | AI Role | What It Does |
|-------|---------|--------------|
| GHOST | Predictor | "I predict you need X with 85% probability" |
| ARCHITECT | Builder | "Here's how to structure this..." |
| MONK | Thinker | "Let me reason through this step by step..." |
| SHADOW | Designer | "The UX consideration here is..." |
| OBSERVER | Watchdog | "I notice a potential issue with..." |

---

## RAILWAY ACCESS

**Current deployment:** https://nemo-conductor-production.up.railway.app

To get Railway access:
1. Create account at railway.app
2. Ask Commander to add you as collaborator
3. Or deploy your own instance (it's free tier friendly)

---

## WHAT NEEDS WORK

### Immediate (Railway fix):
- [ ] Environment variable not loading after update
- [ ] May need to redeploy from scratch

### Next Features:
- [ ] Let user pick different models per council member
- [ ] Add "consensus" view that synthesizes all 5 responses
- [ ] Connect to Supabase for query logging
- [ ] Add voice input option

### Future Vision:
- [ ] Each council member as separate Ollama model (fully offline)
- [ ] Integrate with Trick Donkey CLI
- [ ] Mobile-responsive 5-panel layout
- [ ] WebSocket for streaming responses

---

## RELATED PROJECTS (Your Ecosystem)

### 1. Jedi AI Alliance
**Location:** `.consciousness/JEDI_ALLIANCE_ROUTER.py`
**What:** Routes tasks to optimal AI (Claude for strategy, Qwen for code, etc.)
**Connection:** NEMO Conductor is the visual UI; Jedi is the routing brain

### 2. Data Circle (Offline AI)
**Location:** `.consciousness/DATA_CIRCLE.py`
**What:** Works offline using Ollama local models
**Connection:** Fallback when OpenRouter/cloud APIs fail

### 3. Trick Donkey
**Your project!** CLI version of multi-AI collaboration
**Connection:** Same concept, different interface (CLI vs web)

### 4. NEMO Engine (Your nemo.py)
**Location:** `D:\dev-tools\projects\business-plan\nemo.py`
**What:** 174-line 50-slot AI cluster
**Connection:** The original inspiration for this visual dashboard

---

## FILES YOU'LL TOUCH MOST

```
gui/backend/server.js     ← API logic, council prompts, model routing
gui/frontend/council-workspace.html  ← The 5-panel UI
```

---

## API KEY OPTIONS

| Provider | Cost | Best For |
|----------|------|----------|
| **OpenRouter** | Pay-as-you-go | Access to all models (Claude, GPT, Llama) |
| **OpenAI** | Pay-as-you-go | Just GPT models |
| **Ollama** | Free (local) | Offline, privacy, no limits |

For Ollama integration, you'd modify server.js to hit `http://localhost:11434` instead of OpenRouter.

---

## QUESTIONS?

- Discord: D-wrek's server
- Email: darrickpreble@proton.me

**THE PATTERN:** You built the engine, this is the dashboard. Make it yours.
