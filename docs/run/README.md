### Agtm Run CLI Documentation

Execution of Agent Cli with hints and auto completion.

The `run` command executes agent workflows with interactive hints and fuzzy CLI completion. Typing a few characters surfaces suggested commands so you can finish the full invocation quickly (for example, typing `play` will suggest the Playwright runner).

Let's say you want to run an agent command of Playwright to go to a URL and fetch a webpage. You don't need to remember the full command—type `play`, pick the provider, then pick the CLI action.

### Usage

```
agtm run <provider_unique_id> <agent_cli>
```
### Example 

```shell
agtm run play
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


