---
name: agent-cli-hint-completion
description: AI Agent Management Clis Hint and Completion Skill
---

## Installation & Setup

Install the required Python package before running any scripts.

```shell
npm install -g @aiagenta2z/agtm
agtm setup --hint
```


## Start to Run Other Agent Clis with Hints

`Run`

Execution of Agent Cli with hints and auto completion.

The `run` command executes agent workflows with interactive hints and fuzzy CLI completion. Typing a few characters surfaces suggested commands so you can finish the full invocation quickly (for example, typing `play` will suggest the Playwright runner).

Let's say you want to run an agent command of Playwright to go to a URL and fetch a webpage. You don't need to remember the full command—type `play`, pick the provider, then pick the CLI action.

### Usage

Remember to setup hint before running the agent-cli

```
agtm run <provider_unique_id> <agent_cli> --mode agent
```

- provider_unique_id: following the <owner_id/repo_id> 
- agent_cli: the cli to run e.g. "playwright-cli "
- --mode: agent mode will not pause the workflow and keep the process running.


### Example 
Run playwright cli with hint "play" and wants to visit https://www.google.com
Run
```shell
agtm run play --mode agent
```
Result 
```shell
Skill ID suggestions:
  1. microsoft/playwright-cli
     - playwright-cli open [url] # open browser, optionally navigate to url
     - playwright-cli goto <url> # navigate to a url
  2. googleworkspace/cli
     - gws drive files list --params # List the 10 most recent files
     - playwright-cli goto <url> # navigate to a url
```

### Second time fetch the function and fill the parameter
Run
```shell
agtm run microsoft/playwright-cli playwright-cli open https://www.google.com --mode agent
```

Direct Result 
```shell
agtm run microsoft/playwright-cli playwright-cli open https://www.google.com

### Browser `default` opened with pid 87106.
- default:
  - browser-type: chrome
  - user-data-dir: <in-memory>
  - headed: false
---

### Ran Playwright code

await page.goto('https://www.google.com');

### Page
- Page URL: https://www.google.com/
- Page Title: Google
### Snapshot
- [Snapshot](.playwright-cli/page-2026-03-20T07-00-58-535Z.yml)
```


## Support CLI List, Please welcome to contrib

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

And more can be downloaded from https://github.com/aiagenta2z/agtm 
project folder [/data/config/hints/contrib](https://github.com/aiagenta2z/agtm/tree/main/data/config/hints/contrib) and [/data/config/hints/base_hints.json](https://github.com/aiagenta2z/agtm/blob/main/data/config/hints/base_hints.json)

