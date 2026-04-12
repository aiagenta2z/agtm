---
name: "{{SKILL_NAME}}"
description: "{{SKILL_DESCRIPTION}}"
env:
{{ENV_YAML}}
dependencies:
  node: []
  python: []
---


# {{SKILL_TITLE}}

Auto-generated skill for OneKey Agent Gateway registered agent `{{UNIQUE_ID}}` based on its `api_list` from registered API metas. Available 
to use in CLIs, Skills, Rest APIs, and more agent preferred formats.


## Quick Start
Set the API providers access key `` or the registered OneKey Gateway access key DEEPNLP_ONEKEY_ROUTER_ACCESS from AI Agent Marketplace.

```bash
export DEEPNLP_ONEKEY_ROUTER_ACCESS=YOUR_REGISTRY_KEY
```
Run an API via scripts:
- Node (JS): `node scripts/<api_name>.js --data '{"key":"value"}'`
- Python: `python3 scripts/<api_name>.py --data '{"key":"value"}'`

## APIs
{{API_SECTIONS}}

### Scripts

Each API has a dedicated script in `scripts/`:
```bash
node scripts/<api_name>.js --data '{"key":"value"}'
python3 scripts/<api_name>.py --data '{"key":"value"}'
```

### CLIs

{{CLI_SECTIONS}}


## References
- `reference/api_list.json`: original `api_list` payload
- `reference/api_meta.json`: normalized API metadata used by scripts
