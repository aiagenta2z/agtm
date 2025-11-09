### AgentM: Command Line CLI Tool for AI Agent Registry in Open Source AI Agent Marketplace

[Doc](https://deepnlp.org/doc/ai_agent_marketplace)|[AI Agent Marketplace](https://www.deepnlp.org/store/ai-agent)


The command line `agtm --upload` , `agtm --search` helps users to register and publish their AI Agents meta api information from agent.json/agent.yaml file
or a github repo URL in a few seconds.

'agtm' means 'ai agent marketplace' or 'ai agent manager'
To use the command line, you need to first install the package either using python or node environment


####  Install and Use `agtm` CLI
Python
``` Python
pip install ai_agent_marketplace
```

Node
``` NodeJS
npm install -g @aiagenta2z/agtm
```
note: run nodejs environment, you need to add -g to install, so you can just run command line `agtm` without the `npx agtm` prefix,


Command line to register your AI agent from GitHub, Local config(agent.json, agent.yaml) or search the AI agent marketplace.
To see detailed usage, visit the GitHub of `agtm` at Documentation (https://github.com/aiagenta2z/ai-agent-marketplace)

#### Tutorial 

Let's say you have create a repo of your open source AI Agent (e.g. https://github.com/AI-Hub-Admin/FinanceAgent), And you want to 
register and get a registered detailed page of AI Agent in the marketplace and monitor the traffic.

**1. Setup Access Key**

First you need to setup an access_key in the environment to authenticate.
Register your AI Agent Marketplace Access Key here (https://deepnlp.org/workspace/keys)

```
export AI_AGENT_MARKETPLACE_ACCESS_KEY="${your_access_key}"

```

**2. Registry AI Agent from your GitHub**

```
agtm upload --github https://github.com/aiagenta2z/ai-agent-marketplace
```

**3. Registry AI Agent from agent.json or agent.yaml file**

```

## Or register from local config of AI Agent meta
agtm upload --config ./agent.json
agtm upload --config ./agent.yaml

## Search Open Source AI Agent marketplace of deepnlp
agtm search --q 'coding agent'
agtm search --id 'google-maps/google-maps'

```

**4. Search AI Agent Marketplace**

```

## Search Open Source AI Agent marketplace of deepnlp
agtm search --q 'coding agent'
agtm search --id 'google-maps/google-maps'

```
