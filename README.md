
### agtm: CLI Tool for AI Agent Management, Skills, Agent Registry, Benchmarks and Hints in AI Agent Marketplace

[GitHub](https://github.com/aiagenta2z/agtm)|[AI Agent Marketplace CLI Doc](https://www.deepnlp.org/doc/ai_agent_marketplace)|[DeepNLP AI Agent Marketplace](https://www.deepnlp.org/store/ai-agent) | [OneKey Gateway](https://deepnlp.org/doc/onekey_gateway) | [Agent MCP OneKey Router Ranking](https://www.deepnlp.org/agent/rankings) | [NodeJS agtm](https://www.npmjs.com/package/@aiagenta2z/agtm)

`agtm` (AI Agent Management CLI) unifies skill management, agent registration, marketplace search, and provider CLI execution. Install skills from GitHub, log and rate skill runs, upload agent metadata to registries, query the public marketplace, and run agent toolchains with fuzzy hints.

Features

*`agtm skills`*: Manage Skills, Add Skills, List Skills, Log Skills Performance, Skills performance Evaluator, compare to realworld benchmarks   
*`agtm upload`*: AI Agent Registry, register local agent meta information of json or yaml format(agent.json/agent.yaml) or sync your github source meta including README.md     
*`agtm search`*: Search the open source AI Agent Marketplace, including github community, huggingface community, product hunt community, deepnlp ai agent marketplace index, etc     
*`agtm run`*: Run agent clis, don't need to remember, with the powerful hints and completion ability, just type a few characters and "--hint" will help you complete the command line.   

Furthermore, `agtm` provides memory to track skill outputs and enables performance rating against industry job level benchmarks. This allows you to score each skill execution and assign a professional tier to your AI Agent's capabilities—for example, evaluating its performance as equivalent to that of an L3 or L5 software engineer, marketing prefessional, etc.

```shell
skill_id             run_times  score  level
-------------------  ---------  -----  -----
code_success_skills  5          0.9     L3(100%)    
```

## Quickstart

###  Installation

**Node**
``` NodeJS
npm install -g @aiagenta2z/agtm
```

Setup hint and skills benchmark 
```shell
agtm setup --levels  ## Needed before `agtm rate`, to sync the benchmarks json to local folder 
agtm setup --hint    ## Needed before `agtm run` 
```

Agtm CLI Options

| CLI         | Command and Options                       | Document                       |
|-------------|-------------------------------------------|--------------------------------|
| agtm skills | add, list, log, rate                      | [Doc](../docs/skills/README.md)   |
| agtm search | --q query                                 | [Doc](../docs/registry/README.md) |
| agtm upload | --github  --config to local agent meta    | [Doc](../docs/registry/README.md) |
| agtm run    | --hint agent-cli hint and auto completion | [Doc](../docs/run/README.md)      |

## `skills`  

### skills add

Download and add skills to your agent directory.

#### Usage
```
agtm skills add <unique_id>
agtm skills add <github_url>
agtm skills add <github_url> -a <agent_id>
agtm skills add <owner_id/repo_id> -s <skill_id>
```

#### Example
```
agtm skills add anthropics/skills -a claude-code  ## install skills only to claude-codex
agtm skills add msitarzewski/agency-agents
agtm skills add aiagenta2z/onekey-gateway
agtm skills add msitarzewski/agency-agents -s academic-anthropologist -a codex
agtm skills add anthropics/skills -s skill-creator -a claude-code --global
```

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

Partial List of Skills and Job Level Description 

| Job Category      | Company | Levels Description (e.g. Google L3, Meta E4)                                              |
|-------------------|---------|-------------------------------------------------------------------------------------------|
| Marketing         | Apple   | [marketing_sales_apple_levels.json](data/config/levels/marketing_sales_apple_levels.json) |
| Software Engineer | Google  | [software_engineer_google_levels.json](data/config/levels/software_engineer_google_levels.json)                                                                                         |
| Software Engineer | Meta    | [software_engineer_meta_levels.json](data/config/levels/software_engineer_meta_levels.json)                                            |


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


## `Run`

Execution of Agent Cli with hints and auto completion.

The `run` command executes agent workflows with interactive hints and fuzzy CLI completion. Typing a few characters surfaces suggested commands so you can finish the full invocation quickly (for example, typing `play` will suggest the Playwright runner).

Let's say you want to run an agent command of Playwright to go to a URL and fetch a webpage. You don't need to remember the full command—type `play`, pick the provider, then pick the CLI action.



### Usage

Remember to setup hint before running the agent-cli

```shell
agtm setup --hint
```

```
agtm run <provider_unique_id> <agent_cli>
```

### Example 

```shell
rockingdingo@rockingdingodeMacBook-Pro skills_cli % agtm run play
DEBUG: Entering Human Mode | idArg play | commandArgs  | options [object Object] | hasHints true | hints [object Object]

Skill ID suggestions:
  1. microsoft/playwright-cli
  2. googleworkspace/cli
Skill ID suggestions: 1
Command hints:
  1. playwright-cli goto <url> # navigate to a url
  2. playwright-cli open [url] # open browser, optionally navigate to url

Select command (number or input custom): 1
Final command [playwright-cli goto <url>]: playwright-cli goto https://www.github.com
agtm run microsoft/playwright-cli playwright-cli goto https://www.github.com
```

Support CLI List, Please welcome to contrib

| unique_id | agent cli |
| --- | --- |
| microsoft/playwright-cli | playwright-cli open [url], playwright-cli goto <url>
| googleworkspace/cli | gws drive files list --params
| aiagenta2z/onekey-gateway | onekey agent <unique_id> <api_id> <data_json|@file>, onekey mcp <server_name> [--name config_name], onekey llm --provider <provider> --model <model> --messages <json|@file> [--temperature <num>] [--response-format <format>] [--options <json|@file>], onekey llm --payload <json|@file>
| openai/codex-cli | codex, codex exec "[instruction]"
| anthropic/claude-code | claude "[prompt]", claude --dangerously-skip-permissions
| paul-gauthier/aider | aider --model [model_name], /test [command]
| openinterpreter/open-interpreter | interpreter, interpreter --os
| google-gemini/gemini-cli | gemini, gemini -p "[prompt] @[file/dir]", gemini --yolo, /memory add "[fact]", /mcp list, /restore


## AI Agent Registry
### `search`
`agtm search` helps to search AI Agent MCP and skills marketplace by id or query keywords.

Example Usage
```shell
agtm search --q 'coding agent'
agtm search --id 'google-maps/google-maps'
```

### `upload`
`agtm update` helps to update your local agent.json or agent.yaml meta information to DeepNLP AI Agent Marketplace Index.
Example Usage
```shell
agtm upload --github https://github.com/AI-Hub-Admin/My-First-AI-Coding-Agent
agtm upload --config ./agent.json
agtm upload --config ./agent.yaml
```

`schema.json` should have two keys defined the required fields and optional fields you want to submit from the agent.json file. 

Remember to keep the `access_key` in safe place, the post request will post the `access_key` as well as schema to the endpoint. 

Please visit the command line github package [agtm](https://github.com/aiagenta2z/agtm) and [DOC](https://www.deepnlp.org/doc/ai_agent_marketplace) detailed usage.


Use the test account and access 

```
export AI_AGENT_MARKETPLACE_ACCESS_KEY="TEST_KEY_AI_AGENT_REGISTRY"

agtm upload --config ./agent.json --endpoint https://www.deepnlp.org/api/ai_agent_marketplace/registry --schema ./schema.json

agtm upload --config ./agent.json --endpoint https://www.aiagenta2z.com/api/ai_agent_marketplace/registry --schema ./schema.json
```

### Contributing

#### Agent CLI List
You are welcome to contrib your cli list to the agent cli hints json file to folder [hints](data/config/hints) or table README.md

#### Skill Run Benchmark 

You are welcome to contrib your own customized benchmarks of skills and unique levels system in folder [levels](data/config/levels). 



