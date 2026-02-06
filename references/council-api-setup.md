# Council API Setup

This guide explains how to configure the 5-Key Council API keys for NEMO Conductor.

## The 5 Keys

| Key | Name | Provider Suggestions | Purpose |
|-----|------|---------------------|---------|
| GHOST_API_KEY | THE GHOST | Gemini Flash, GPT-4o-mini | Fast autocomplete prediction |
| ARCHITECT_API_KEY | THE ARCHITECT | Claude 3.5 Sonnet, Kimi | System design, Git automation |
| MONK_API_KEY | THE MONK | o3-mini, DeepSeek-R1 | Deep reasoning, loop protection |
| SHADOW_API_KEY | THE SHADOW | DALL-E, Stable Diffusion | UI styling (Chi aesthetic) |
| OBSERVER_API_KEY | THE OBSERVER | GPT-4o, Gemini Pro | Browser sync, monitoring |

## Supported Providers

### OpenRouter (Recommended)
Single API key for multiple models:
```json
{
  "GHOST_API_KEY": "sk-or-v1-...",
  "ARCHITECT_API_KEY": "sk-or-v1-...",
  "MONK_API_KEY": "sk-or-v1-...",
  "SHADOW_API_KEY": "sk-or-v1-...",
  "OBSERVER_API_KEY": "sk-or-v1-..."
}
```

Models on OpenRouter:
- `google/gemini-2.0-flash-exp:free` (GHOST)
- `moonshotai/kimi-k2.5` (ARCHITECT)
- `openai/o3-mini` (MONK)
- `stability-ai/stable-diffusion-xl` (SHADOW)
- `openai/gpt-4o` (OBSERVER)

### Individual Providers

**OpenAI:**
```json
{
  "MONK_API_KEY": "sk-...",
  "OBSERVER_API_KEY": "sk-..."
}
```

**Anthropic:**
```json
{
  "ARCHITECT_API_KEY": "sk-ant-..."
}
```

**Google (Gemini):**
```json
{
  "GHOST_API_KEY": "AIza..."
}
```

**DeepSeek:**
```json
{
  "MONK_API_KEY": "sk-..."
}
```

## Setup Steps

1. **Create council-keys.json:**
   ```bash
   node .skills/nemo-conductor/scripts/init-memory.js
   ```

2. **Get API keys:**
   - OpenRouter: https://openrouter.ai/keys
   - OpenAI: https://platform.openai.com/api-keys
   - Anthropic: https://console.anthropic.com/settings/keys
   - Google: https://aistudio.google.com/app/apikey
   - DeepSeek: https://platform.deepseek.com/api_keys

3. **Edit council-keys.json** with your keys

4. **Test the council:**
   ```bash
   node .skills/nemo-conductor/scripts/run-nemo.js
   ```

## Fallback Strategy

If a key is missing, NEMO will:
1. Try to use PRIMARY_MODEL for all operations
2. Fall back to FALLBACK_MODEL if primary fails
3. Degrade to local-only mode if no keys available

## Security

- Never commit council-keys.json to git
- Add to .gitignore:
  ```
  council-keys.json
  .nemo/memory/
  ```
- Use environment variables as alternative:
  ```bash
  export GHOST_API_KEY="..."
  export ARCHITECT_API_KEY="..."
  # etc.
  ```

## Testing Individual Keys

```javascript
const { NEMOConductor } = require('./scripts/run-nemo.js');

const nemo = new NEMOConductor({
  keys: './council-keys.json'
});

await nemo.initialize();
nemo.statusReport();
```
