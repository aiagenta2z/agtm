### Agtm Skills CLI Documentation

The Agtm Skills CLI manages local skill bundles for supported agents (for example `claude-code`, `codex`, `openclaw`). It can download skills from GitHub, install them into the correct agent folders, list what is installed, record run logs, and apply rating benchmarks.

It also serves as a benchmarking tool to evaluate skill outputs:  
**Benchmark** your AI agent against real-world standards — from Google-level engineering to Apple-caliber product launches.   
**Rate** performance of each run with structured scores and levels, helping agents like Claude Code choose the right skills more effectively.   

## CLI Skills Usage

### skills add

#### Usage
```
agtm skills add <unique_id>
agtm skills add <github_url>
agtm skills add <github_url> -a <agent_id>
agtm skills add <owner_id/repo_id> -s <skill_id>
```
- `<unique_id>` is always `owner_id/repo_id`.
- Installs to local cache by default; add `--global` to write to the global agent location.
- `-s`, When `-s` is omitted (install a single skill), all discovered skills are installed.
- `-a`, The agent local folder to download skills, the list of agents supported can be found below.

#### Example
```
agtm skills add anthropics/skills -a claude-code  ## install skills only to claude-codex
agtm skills add msitarzewski/agency-agents
agtm skills add aiagenta2z/onekey-gateway
agtm skills add msitarzewski/agency-agents -s academic-anthropologist -a codex
agtm skills add anthropics/skills -s skill-creator -a claude-code --global
```

The command scans the repo for `SKILL.md` files (or `<name>.md` files in agency‑agents style) and normalizes them before copying into each target agent folder.

### skills list

#### Usage
```
agtm skills list
agtm skills list --agent <agent_id> --global
```
Lists installed skills with `agent`, `skill_id`, `description`, install `path`, average `score`, and aggregated `level` (if ratings exist).

#### Example
```
agtm skills list
agtm skills list --agent codex
agtm skills list --agent claude-code --global
```
Results 

```
agent  skill_id                     score                                       path  level
-----  ---------------------------  ------------------------------------------  ----  -----
codex  agtm_agent_management_skill  .agents/skills/agtm_agent_management_skill  -     -    
codex  code_fail_skills             .agents/skills/code_fail_skills             -     -    
codex  code_success_skills          .agents/skills/code_success_skills          0.88  L4   
```

### skills log

#### Usage
```
agtm skills log <skill_id> --data '<json_payload>'
```
- Persists a run record at `.agtm/skills/log/<uuid>.json` (or the `--logDir` you supply).
- `<json_payload>` must contain at least `input` and `output`; optional fields (meta, rating, level) are accepted.

#### Example
```
agtm skills log <skill_id> --data '{"input":"write a website for store","output":"success"}'
agtm skills log code_success_skills --data '{"input":"generate sql","output":"ok","meta":{"agent":"claude-code"}}'
```

### skills rate

#### Setup

To use the rate command, have to setup the benchmark levels configuration. save to `./agtm/levels/*.json` files
```shell
agtm setup --levels
```

#### Usage
```
agtm skills rate prepare --skill_id <skill_id> --prompt "<eval_prompt>" --benchmark <path/benchmark.json>
agtm skills rate apply   --skill_id <skill_id> --result '<result_json>'
agtm skills rate show    --skill_id <skill_id>
```
- `prepare` exports logs plus the top benchmark slices (e.g., Google SWE L3–L7) for an external evaluator.
- `apply` writes evaluator outputs (`rating`, `level`) back to each log.
- `show` summarizes run counts, average score, and level distribution.

#### Example
```
agtm skills rate prepare --skill_id code_success_skills --prompt "Evaluate the results" --benchmark path/customized_agent_benchmark.json
agtm skills rate apply --skill_id code_success_skills --result '{"results":[{"log_id":"3679a3fe-4d97-4eb1-83bc-f83d711be195","rating":0.90,"level":"L4"}]}'
agtm skills rate show --skill_id code_success_skills
```
Sample output:
```
skill_id             run_times  score  level
-------------------  ---------  -----  -----
code_success_skills  3          0.88   L4(100%)
```
Benchmarks live in `data/config/levels/*.json` and follow this structure:
```
{
  "software-engineering": {
    "Google": [
      { "level": "L3", "title": "Software Engineer II", "description": "Entry-level engineer. Delivers well-scoped tasks with guidance.", "signals": ["task execution","learning velocity","code quality basics"] },
      { "level": "L4", "title": "Software Engineer III", "description": "Independent contributor. Owns small features end-to-end.", "signals": ["ownership","code quality","debugging ability"] }
    ]
  }
}
```
The evaluator compares each `<input,output>` log to the benchmark definitions and assigns a rating. You can customize levels such as `poor`, `fair`, `good`, `excellent` in your benchmark file.

write your `customized_agent_benchmark.json` following the formats

```
{
  "domain": {
    "my_benchmark": [
      { "level": "poor", "description": "the skill failed or the output is meaningless"},
      { "level": "fair", "description": "the skills produces fair results, complete the task"},
      { "level": "good", "description": "the skills output a report, an image is good in real life standards.."},
    ]
  }
}
```

## Supported Agents
We provide the same skills local folder as vercel/skills packages.
Skills can be installed to any of these agents

<!-- supported-agents:start -->

| Agent | `--agent` | Project Path | Global Path |
|-------|-----------|--------------|-------------|
| Amp, Kimi Code CLI, Replit, Universal | `amp`, `kimi-cli`, `replit`, `universal` | `.agents/skills/` | `~/.config/agents/skills/` |
| Antigravity | `antigravity` | `.agent/skills/` | `~/.gemini/antigravity/skills/` |
| Augment | `augment` | `.augment/skills/` | `~/.augment/skills/` |
| Claude Code | `claude-code` | `.claude/skills/` | `~/.claude/skills/` |
| OpenClaw | `openclaw` | `skills/` | `~/.openclaw/skills/` |
| Cline | `cline` | `.agents/skills/` | `~/.agents/skills/` |
| CodeBuddy | `codebuddy` | `.codebuddy/skills/` | `~/.codebuddy/skills/` |
| Codex | `codex` | `.agents/skills/` | `~/.codex/skills/` |
| Command Code | `command-code` | `.commandcode/skills/` | `~/.commandcode/skills/` |
| Continue | `continue` | `.continue/skills/` | `~/.continue/skills/` |
| Cortex Code | `cortex` | `.cortex/skills/` | `~/.snowflake/cortex/skills/` |
| Crush | `crush` | `.crush/skills/` | `~/.config/crush/skills/` |
| Cursor | `cursor` | `.agents/skills/` | `~/.cursor/skills/` |
| Droid | `droid` | `.factory/skills/` | `~/.factory/skills/` |
| Gemini CLI | `gemini-cli` | `.agents/skills/` | `~/.gemini/skills/` |
| GitHub Copilot | `github-copilot` | `.agents/skills/` | `~/.copilot/skills/` |
| Goose | `goose` | `.goose/skills/` | `~/.config/goose/skills/` |
| Junie | `junie` | `.junie/skills/` | `~/.junie/skills/` |
| iFlow CLI | `iflow-cli` | `.iflow/skills/` | `~/.iflow/skills/` |
| Kilo Code | `kilo` | `.kilocode/skills/` | `~/.kilocode/skills/` |
| Kiro CLI | `kiro-cli` | `.kiro/skills/` | `~/.kiro/skills/` |
| Kode | `kode` | `.kode/skills/` | `~/.kode/skills/` |
| MCPJam | `mcpjam` | `.mcpjam/skills/` | `~/.mcpjam/skills/` |
| Mistral Vibe | `mistral-vibe` | `.vibe/skills/` | `~/.vibe/skills/` |
| Mux | `mux` | `.mux/skills/` | `~/.mux/skills/` |
| OpenCode | `opencode` | `.agents/skills/` | `~/.config/opencode/skills/` |
| OpenHands | `openhands` | `.openhands/skills/` | `~/.openhands/skills/` |
| Pi | `pi` | `.pi/skills/` | `~/.pi/agent/skills/` |
| Qoder | `qoder` | `.qoder/skills/` | `~/.qoder/skills/` |
| Qwen Code | `qwen-code` | `.qwen/skills/` | `~/.qwen/skills/` |
| Roo Code | `roo` | `.roo/skills/` | `~/.roo/skills/` |
| Trae | `trae` | `.trae/skills/` | `~/.trae/skills/` |
| Trae CN | `trae-cn` | `.trae/skills/` | `~/.trae-cn/skills/` |
| Windsurf | `windsurf` | `.windsurf/skills/` | `~/.codeium/windsurf/skills/` |
| Zencoder | `zencoder` | `.zencoder/skills/` | `~/.zencoder/skills/` |
| Neovate | `neovate` | `.neovate/skills/` | `~/.neovate/skills/` |
| Pochi | `pochi` | `.pochi/skills/` | `~/.pochi/skills/` |
| AdaL | `adal` | `.adal/skills/` | `~/.adal/skills/` |
<!-- supported-agents:end -->

### Claude Code

<details>
<summary>Install location</summary>
Skills are stored at `.claude/skills/` (or `~/.claude/skills/` when `--global` is used).
</details>

<details>
<summary>Usage</summary>

```shell
agtm skills add anthropics/skills -a claude-code
agtm skills list --agent claude-code
agtm skills log <skill_id> --data '{"input":"build ui","output":"done","meta":{"agent":"claude-code"}}'
```
</details>

<details>
<summary>Examples</summary>

```shell
# Install a single skill into Claude Code only
agtm skills add msitarzewski/agency-agents -s academic-anthropologist -a claude-code

# Install all skills and record a run
agtm skills add aiagenta2z/onekey-gateway -a claude-code
agtm skills log <skill_id> --data '{"input":"write tests","output":"pass"}'
```
</details>

### Codex

<details>
<summary>Install location</summary>
Skills are stored at `.agents/skills/` (or `~/.codex/skills/` when `--global` is used).
</details>

<details>
<summary>Usage</summary>

```shell
agtm skills add anthropics/skills -a codex
agtm skills list --agent codex
agtm skills rate show --skill_id <skill_id>
```
</details>

<details>
<summary>Examples</summary>

```shell
# Install a specific skill into Codex
agtm skills add msitarzewski/agency-agents -s academic-anthropologist -a codex

# Install all skills and evaluate later
agtm skills add aiagenta2z/onekey-gateway -a codex --global
agtm skills rate prepare --skill_id <skill_id> --benchmark kdata/config/levels/software_engineer_google_levels.json
```
</details>

### OpenClaw

<details>
<summary>Install location</summary>
Skills are stored at `skills/` in the project root (or `~/.openclaw/skills/` when `--global` is used).
</details>

### Gemini CLI

<details>
<summary>Install location</summary>
Skills are stored at `.agents/skills/` (or `~/.gemini/skills/` when `--global` is used).
</details>

<details>
<summary>Usage</summary>

```shell
agtm skills add anthropics/skills -a gemini-cli
agtm skills list --agent gemini-cli
agtm skills log <skill_id> --data '{"input":"summarize paper","output":"ok","meta":{"agent":"gemini-cli"}}'
```
</details>

<details>
<summary>Examples</summary>

```shell
# Install one skill into Gemini CLI
agtm skills add msitarzewski/agency-agents -s academic-anthropologist -a gemini-cli

# Install all skills globally and prepare for rating
agtm skills add aiagenta2z/onekey-gateway -a gemini-cli --global
agtm skills rate prepare --skill_id <skill_id> --benchmark kdata/config/levels/software_engineer_google_levels.json
```
</details>

<details>
<summary>Usage</summary>

```shell
agtm skills add anthropics/skills -a openclaw
agtm skills list --agent openclaw
agtm skills log <skill_id> --data '{"input":"debug api","output":"fixed"}'
```
</details>

<details>
<summary>Examples</summary>

```shell
# Install a single skill into OpenClaw
agtm skills add msitarzewski/agency-agents -s academic-anthropologist -a openclaw

# Install the full pack and view summary
agtm skills add aiagenta2z/onekey-gateway -a openclaw
agtm skills rate show --skill_id <skill_id>
```
</details>
