# NEMO CONDUCTOR - DNA BLUEPRINT
## 5-Key AI Council Interface
**Status:** SHIP (75%) | **Created:** Feb 7, 2026 | **Owner:** Commander → Teddy Handoff

---

## WHAT THIS IS

A visual dashboard for the 5-Key AI Council system. Five AI "council members" each with different personalities/roles answer queries in parallel, displayed in a 5-panel workspace.

### The 5 Council Members:
| Key | Role | Personality |
|-----|------|-------------|
| **GHOST** | Predictor | Pattern analysis, probability forecasting |
| **ARCHITECT** | Toolbox | System design, architecture decisions |
| **MONK** | Reasoning | Deep logic, step-by-step thinking |
| **SHADOW** | UI/UX | Interface design, user experience |
| **OBSERVER** | Monitoring | Watchdog, quality control, oversight |

---

## FILE STRUCTURE

```
nemo-conductor/
├── gui/
│   ├── backend/
│   │   ├── server.js          ← Express API (Railway deployed)
│   │   ├── package.json
│   │   └── council-keys.json  ← Optional local key storage
│   └── frontend/
│       └── council-workspace.html  ← 5-panel UI
├── DNA_BLUEPRINT.md           ← YOU ARE HERE
├── TEDDY_HANDOFF.md          ← Quick start for Teddy
└── VISION_ROADMAP.md         ← Future optimizations
```

---

## DEPLOYMENT

**Railway:** https://nemo-conductor-production.up.railway.app
**GitHub:** Connected to Railway for auto-deploy

### Environment Variables (Railway):
| Variable | Purpose |
|----------|---------|
| `OPENROUTER_API_KEY` | Primary AI API (sk-or-v1-...) |
| `OPENAI_API_KEY` | Fallback API (sk-proj-...) |
| `SUPABASE_URL` | Optional logging |
| `SUPABASE_KEY` | Optional logging |

---

## HOW IT WORKS

1. User loads `council-workspace.html`
2. Enters a query in the input box
3. Frontend calls `/api/council/query` for each of 5 keys
4. Backend routes to OpenRouter (or OpenAI fallback)
5. Each council member responds with their personality
6. 5 panels display all responses simultaneously

### API Endpoints:
```
GET  /                        → Main dashboard
GET  /api/council-keys        → List council members
POST /api/council/query       → Query a council member
POST /api/council/test        → Test connectivity
POST /api/council/activate    → Activate a key
```

---

## CONNECTIONS TO OTHER SYSTEMS

| System | Relationship |
|--------|--------------|
| **Jedi AI Alliance** | NEMO is the visual interface; Jedi is the routing brain |
| **Offline AI / Data Circle** | Fallback when cloud APIs fail |
| **Trick Donkey** | CLI version of similar multi-AI concept |
| **Cyclotron Brain** | Logs queries to atoms database |
| **Supabase** | Optional cloud logging layer |

---

## CURRENT STATE (Feb 7, 2026)

- [x] 5-panel workspace UI built
- [x] Backend API deployed to Railway
- [x] OpenRouter integration working
- [x] Demo fallback mode working
- [ ] Railway env var not loading (needs redeploy troubleshoot)
- [ ] Supabase logging not connected
- [ ] Individual model selection per council member

---

## KNOWN ISSUES

1. **Railway env var caching** - Sometimes needs manual redeploy after updating vars
2. **Demo mode fallback** - Returns template responses when API fails (intentional)

---

## QUICK COMMANDS

```bash
# Local dev
cd nemo-conductor/gui/backend
npm install
node server.js

# Test API locally
curl -X POST http://localhost:3000/api/council/query \
  -H "Content-Type: application/json" \
  -d '{"query": "hello", "key": "GHOST"}'

# Deploy (auto via git push)
git add . && git commit -m "Update" && git push
```

---

## RELATED DNA BLUEPRINTS

- `Desktop/1_COMMAND/JEDI_AI_ALLIANCE.md` - Multi-AI routing system
- `Desktop/2_BUILD/MULTI_AI_INTERACTION_BLUEPRINT.md` - Architecture
- `Desktop/2_BUILD/NEMO_OVERKOR_MERGE_PLAN.md` - Merge strategy
- `.consciousness/DATA_CIRCLE.py` - Offline AI fallback

---

**THE PATTERN:** 5 perspectives → 1 truth
