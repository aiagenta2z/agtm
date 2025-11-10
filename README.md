
### agtm: Command Line CLI Tool for AI Agent Registry in the Open Source AI Agent Marketplace

[GitHub](https://github.com/aiagenta2z/agtm)|[AI Agent Marketplace CLI Doc](https://www.deepnlp.org/doc/ai_agent_marketplace)|[DeepNLP AI Agent Marketplace](https://www.deepnlp.org/store/ai-agent) | [OneKey Agent Router](https://www.deepnlp.org/agent/onekey-mcp-router) | [Agent MCP OneKey Router Ranking](https://www.deepnlp.org/agent/rankings)


The command line `agtm --upload` , `agtm --search` helps users to register and publish their AI Agents meta api information from agent.json/agent.yaml file
or a github repo URL in a few seconds.

'agtm' means 'ai agent marketplace' or 'ai agent manager'
To use the command line, you need to first install the package either using python or node environment


####  Install and Use `agtm` CLI
Python
``` Python
pip install ai-agent-marketplace
```

Node
``` NodeJS
npm install -g @aiagenta2z/agtm
```


note: run nodejs environment, you need to add -g to install, so you can just run command line `agtm` without the `npx agtm` prefix,


Command line to register your AI agent from GitHub, Local config(agent.json, agent.yaml) or search the AI agent marketplace.
To see detailed usage, visit the GitHub of `agtm` at Documentation (https://github.com/aiagenta2z/ai-agent-marketplace)


#### Tutorial 

Let's say you have create a repo of your open source AI Agent (e.g. https://github.com/AI-Hub-Admin/My-First-AI-Coding-Agent), And you want to 
register and get a registered detailed page of AI Agent in the marketplace and monitor the traffic.

**1. Setup Access Key**

First you need to setup an access_key in the environment to authenticate.
Register your AI Agent Marketplace Access Key here (https://deepnlp.org/workspace/keys)

```
export AI_AGENT_MARKETPLACE_ACCESS_KEY="{your_access_key}"
```

You can also use the test key for validation, which is associated with a test-only account on deepnlp.org and aiagenta2z.com. 

```
export AI_AGENT_MARKETPLACE_ACCESS_KEY="TEST_KEY_AI_AGENT_REGISTRY"
```

**2. Registry AI Agent from your GitHub**

The default registry provider endpoint includes: [DeepNLP AI Agent Registry Endpoint](https://www.deepnlp.org/api/ai_agent_marketplace/registry) | 
[aiagenta2z.com Registry Endpoint](https://www.aiagenta2z.com/api/ai_agent_marketplace/registry)|[aiagenta2z.org Registry Endpoint](https://www.aiagenta2z.org/api/ai_agent_marketplace/registry), etc. 

You can also set your customized registry endpoint via `--endpoint` parameter


```
agtm upload --github https://github.com/AI-Hub-Admin/My-First-AI-Coding-Agent
```


**3. Registry AI Agent from agent.json or agent.yaml file**


```

## Register from local config of AI Agent meta
agtm upload --config ./agent.json
agtm upload --config ./agent.yaml
```

You can download sample [agent.json](https://github.com/aiagenta2z/agtm/blob/main/agent.json) or [agent.yaml](https://github.com/aiagenta2z/agtm/blob/main/agent.yaml) file from github https://github.com/aiagenta2z/agtm
See the explanation of the schema, please visit the [documentation](https://www.deepnlp.org/doc/ai_agent_marketplace).


Demo agent.json file
```
{
    "name": "My First AI Coding Agent",
    "content": "This AI Agent can do complicated programming work for humans",
    "website": "https://www.my_first_agent.com",
    "field": "AI AGENT",
    "subfield": "Coding Agent",
    "content_tag_list": "coding,python",
    "github": "",
    "thumbnail_picture": "https://avatars.githubusercontent.com/u/242328252?s=200&v=4",
    "upload_image_files": "",
    "api": "https://www.my_first_agent.com/agent",
    "price_type": "PER_CALL",
    "price_per_call_credit": 0.0,
    "price_fixed_credit" : 0.0,
    "price_subscription": "Basic: your basic plan introduction, Advanced: Your Advanced Plan introduction, etc."
}
```
Demo agent.yaml file
```

name: "My First AI Coding Agent"
content: "This AI Agent can do complicated programming work for humans"
website: "https://www.my_first_agent.com"
field: "AI AGENT"
subfield: "Coding Agent"
content_tag_list: "coding,python"
github: "https://github.com/AI-Hub-Admin/My-First-AI-Coding-Agent"
thumbnail_picture: "https://avatars.githubusercontent.com/u/242328252?s=200&v=4"
upload_image_files: ""
api: "https://www.my_first_agent.com/agent"
price_type: "API Call"
price_per_call_credit: 0.0
price_fixed_credit: 0.0
price_subscription: "Basic: your basic plan introduction, Advanced: Your Advanced Plan introduction, etc."

```

**4. Use your customized endpoint and schema definition**

You have the flexibility to use the AI Agent marketplace/manager cli `agtm` to submit customized ai agent schema to your customized endpoint.

You need to define a customized `schema.json` (https://github.com/aiagenta2z/agtm/blob/main/schema.json) file similar to the default one below and your URL of `endpoint`.
Then the package will POST the the data schema to your endpoint. 


Note: the keys in agent.json and schema.json should match. Package will select keys from the agent.json/agent.yaml files.


`schema.json` should have two keys defined the required fields and optional fields you want to submit from the agent.json file. 

Remember to keep the `access_key` in safe place, the post request will post the `access_key` as well as schema to the endpoint. 

## default schema.json definition
```
{
    "required": [
        "name",
        "content"
    ],
    "optional": [
        "website", 
        "field", 
        "subfield", 
        "content_tag_list", 
        "github", 
        "price_type", 
        "api", 
        "thumbnail_picture", 
        "upload_image_files",
        "sdk",
        "package"
    ]
}
```


Please visit the command line github package [agtm](https://github.com/aiagenta2z/agtm) and [DOC](https://www.deepnlp.org/doc/ai_agent_marketplace) detailed usage.


Use the test account and access 

```
export AI_AGENT_MARKETPLACE_ACCESS_KEY="TEST_KEY_AI_AGENT_REGISTRY"

agtm upload --config ./agent.json --endpoint https://www.deepnlp.org/api/ai_agent_marketplace/registry --schema ./schema.json

agtm upload --config ./agent.json --endpoint https://www.aiagenta2z.com/api/ai_agent_marketplace/registry --schema ./schema.json
```


```
Setting Registry Endpoint to URL: https://www.deepnlp.org/api/ai_agent_marketplace/registry
Customized Schema is enabled : ./schema.json
Attempting to register agent from config file: ./agent.json
✅ Loaded custom schema from: ./schema.json
Using customized schema {"required": ["name", "content"], "optional": ["website", "field", "subfield", "content_tag_list", "github", "price_type", "api", "thumbnail_picture", "upload_image_files", "sdk", "package"]}
WARN: Calling AddServiceAPI input param optional keys filled fields ['website', 'field', 'subfield', 'content_tag_list', 'github', 'price_type', 'api', 'thumbnail_picture', 'upload_image_files']|missing_fields []
Submitting agent information to the marketplace...

✅ Registration Successful!
   URL: https://www.deepnlp.org/store/ai-agent/coding-agent/pub-test-agtm-registry/my-first-ai-coding-agent
   Message: Content Updated Successfully|Visit URL at https://www.deepnlp.org/store/ai-agent/coding-agent/pub-test-agtm-registry/my-first-ai-coding-agent and Login to View the Pending status webpage...
   Track its status at: https://www.deepnlp.org/store/ai-agent/coding-agent/pub-test-agtm-registry/my-first-ai-coding-agent
```


Use www.example.com as endpoint example 


```
agtm upload --config ./agent.json --endpoint https://www.example.com --schema ./schema.json

```

It will return an error message showing the endpoint and data, https://www.example.com doesn't have endpoint handling

```
❌ Registration Failed. Please check your endpoint https://www.example.com  and agent data {'name': 'My First AI Coding Agent', 'content': 'This AI Agent can do complicated programming work for humans', 'website': 'https://www.my_first_agent.com', 'field': 'AI AGENT', 'subfield': 'Coding Agent', 'content_tag_list': 'coding,python', 'github': '', 'thumbnail_picture': 'https://avatars.githubusercontent.com/u/242328252?s=200&v=4', 'upload_image_files': '', 'api': 'https://www.my_first_agent.com/agent', 'price_type': 'FREE', 'price_per_call_credit': 0.0, 'price_fixed_credit': 0.0, 'price_subscription': 'Basic: your basic plan introduction, Advanced: Your Advanced Plan introduction, etc.'}
```


**5. Search AI Agent Marketplace**

```

## Search Open Source AI Agent marketplace of deepnlp

agtm search --q 'coding agent'
agtm search --id 'google-maps/google-maps'
agtm search --id 'AI-Hub-Admin/My-First-AI-Coding-Agent'
```

Search Result of query q="coding agent"

```
[{'content_name': 'Cursor AI', 'publisher_id': 'pub-cursor', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/coding-agent/pub-cursor/cursor-ai', 'website': 'https://docs.cursor.com/agent', 'github': '', 'review_cnt': '3', 'rating': '3.3', 'description': 'Cursor AI Coding Editor provides Agent mode, which is the default mode in Cursor, equipped with all tools to efficiently handle a wide range of coding tasks. Agent is the default mode in Cursor that is best for most tasks. It has all tools enabled to allow it to perform all operations necessary to complete the task at hand. Make sure to read chat overview to learn more about how modes work in Curs', 'subfield': 'Coding Agent', 'field': 'AI AGENT', 'id': 'cursor/cursor-ai', 'content_tag_list': 'Coding Agent,AI AGENT', 'thumbnail_picture': 'https://static.aiagenta2z.com/scripts/img/ai_service_content/a7dd95e7eb419437ef4a91f4b0e853cb.jpg'}, {'content_name': 'trae ai', 'publisher_id': 'pub-trae-ai', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/coding-agent/pub-trae-ai/trae-ai', 'website': 'https://www.trae.ai/', 'github': '', 'review_cnt': '2', 'rating': '4.0', 'description': 'Trae AI IDE is a cutting-edge AI-integrated development environment designed to enhance developer productivity by leveraging advanced AI models like Claude3.5 and GPT-4o. It offers a seamless coding experience with features such as intelligent code generation, real-time feedback, and multi-modal input support, making it a powerful tool for developers. Introduction Trae AI IDE, developed by ByteDan', 'subfield': 'Coding Agent', 'field': 'AI AGENT', 'id': 'trae-ai/trae-ai', 'content_tag_list': 'CODING AGENT,AI AGENT', 'thumbnail_picture': 'https://static.aiagenta2z.com/scripts/img/ai_service_content/cc43d2dc25488b50b883781e0ae8c988.png'}, {'content_name': 'codex', 'publisher_id': 'pub-openai', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/coding-agent/pub-openai/codex', 'website': 'https://github.com/openai/codex', 'github': 'https://github.com/openai/codex', 'review_cnt': '1', 'rating': '5.0', 'description': 'npm i -g @openai/codexor brew install --cask codex\n\nCodex CLI is a coding agent from OpenAI that runs locally on your computer.\n\nIf you want Codex in your code editor (VS Code, Cursor, Windsurf), install in your IDE\nIf you are looking for the cloud-based agent from OpenAI, Codex Web, go to chatgpt.com/codex\n\n\n  \n  \n\n---\n\n## Quickstart\n\n### Installing and running Codex CLI\n\nInstall globally with yo', 'subfield': 'CODING AGENT', 'field': 'AI AGENT', 'id': 'openai/codex', 'content_tag_list': 'GitHub 48.6k', 'thumbnail_picture': 'https://avatars.githubusercontent.com/u/14957082?v=4'}, {'content_name': 'fine dev', 'publisher_id': 'pub-fine-dev', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/ai-agent/pub-fine-dev/fine-dev', 'website': 'https://www.fine.dev', 'github': '', 'review_cnt': '1', 'rating': '4.0', 'description': 'Full-Stack AI Developer Agent for Startups Accelerate your startup’s release schedule and ship daily improvements. Fine is the AI Coding Agent built to act like another team member, getting work done. Try free or watch it work.', 'subfield': 'AI AGENT', 'field': 'AI AGENT', 'id': 'fine-dev/fine-dev', 'content_tag_list': ',AI AGENT', 'thumbnail_picture': 'https://www.fine.dev/_next/static/media/logo.76f79362.svg'}, {'content_name': 'claude code', 'publisher_id': 'pub-claude-code', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/coding-agent/pub-claude-code/claude-code', 'website': 'https://www.anthropic.com/claude-code', 'github': '', 'review_cnt': '1', 'rating': '5.0', 'description': 'Claude Code by Anthropic is an AI-powered coding assistant designed to enhance developer productivity by providing intelligent code generation, debugging, and optimization capabilities. It integrates seamlessly with various developer tools, making it easy to use within existing workflows. Introduction Claude Code is a powerful AI coding assistant developed by Anthropic, aimed at helping developers', 'subfield': 'Coding Agent', 'field': 'AI AGENT', 'id': 'claude-code/claude-code', 'content_tag_list': 'CODING AGENT,AI AGENT', 'thumbnail_picture': 'https://static.aiagenta2z.com/scripts/img/ai_service_content/7d6c735321396b42b5c2e46499e17a6e.png'}, {'content_name': 'qwen code', 'publisher_id': 'pub-qwen-code', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/coding-agent/pub-qwen-code/qwen-code', 'website': '', 'github': '', 'review_cnt': '1', 'rating': '4.0', 'description': 'Qwen Coding Agent offers an advanced framework for developing applications utilizing large language models (LLMs), enhancing capabilities such as instruction following, tool usage, planning, and memory. Introduction Qwen Coding Agent provides a robust platform for building LLM applications, leveraging the advanced features of Qwen models (version 2.0 and above). It facilitates the development of i', 'subfield': 'Coding Agent', 'field': 'AI AGENT', 'id': 'qwen-code/qwen-code', 'content_tag_list': ',AI AGENT', 'thumbnail_picture': 'https://camo.githubusercontent.com/db544c14e8419ecf289564a79841e005c518fc29cd418ac4a31215e9377eaa22/68747470733a2f2f7169616e77656e2d7265732e6f73732d636e2d6265696a696e672e616c6979756e63732e636f6d2f5177656e322e352f5177656e322e352d436f6465722f7177656e322e352d636f6465722d6c6f676f'}, {'content_name': 'Qoder', 'publisher_id': 'pub-qoder', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/coding-agent/pub-qoder/qoder', 'website': 'https://qoder.com/download', 'github': '', 'review_cnt': '1', 'rating': '5.0', 'description': '\r\n## Qoder\r\n\r\nQoder is an agentic coding platform designed for real software development. It seamlessly integrates enhanced context engineering with intelligent agents to gain a comprehensive understanding of your codebase and systematically tackles software development tasks.\r\nIt goes beyond simple code completion-Qoder helps you think deeper, code smarter, and build better by automating intricat', 'subfield': 'Coding Agent', 'field': 'AI AGENT', 'id': 'qoder/qoder', 'content_tag_list': 'coding,agent', 'thumbnail_picture': 'https://static.aiagenta2z.com/scripts/img/ai_service_content/6d7c68c43f520b76251fe2ac7c0061a8.jpg'}, {'content_name': 'CodeBuddy IDE Tencent', 'publisher_id': 'pub-tencent', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/coding-agent/pub-tencent/codebuddy-ide-tencent', 'website': 'https://copilot.tencent.com/ide', 'github': '', 'review_cnt': '1', 'rating': '4.0', 'description': '\r\nCodeBuddy IDE Tencent AI 一站式工作台：从此用自然语言实现产品、设计、研发全流程\r\n\r\n\r\n\r\n## AI 智能代码补全\r\n所想即所码\r\nAI驱动的实时代码预测与智能补全，让编程如行云流水\r\n\r\n\r\n## AI 设计生成\r\n草图秒变原型\r\n手绘概念瞬间转化为高保真交互原型，创意无需等待\r\n\r\n## 设计稿转代码\r\n一稿生万码\r\nFigma设计 稿一键转换为生产级代码，还原度高达99.9%\r\n\r\n\r\n## AI 全栈开发\r\n你的AI编程搭档\r\n智能开发代理，自主完成多文件代码生成与重构\r\n\r\n\r\n## 内置后端服务\r\n后端开 发零门槛\r\n内置腾讯云 CloudBase 和 Supabase服务，数据库与用户认证一键搞定\r\n\r\n## 一键部署分享\r\n开发、部署、分享，一键搞定\r\n内置 Cloud Studio，EdgeOne Pages，从开发环境到在线演示，只需一秒钟', 'subfield': 'Coding Agent', 'field': 'AI AGENT', 'id': 'tencent/codebuddy-ide-tencent', 'content_tag_list': 'ide,coding agent', 'thumbnail_picture': 'https://static.aiagenta2z.com/scripts/img/ai_service_content/3ef7d0e02ecbf36eb9dbd25590c7c87e.jpg'}, {'content_name': 'zencoder ai', 'publisher_id': 'pub-zencoder-ai', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/coding-agent/pub-zencoder-ai/zencoder-ai', 'website': 'https://zencoder.ai', 'github': '', 'review_cnt': '0', 'rating': '0.0', 'description': "Zencoder AI provides a range of AI agents designed to streamline and enhance various business processes through intelligent automation and advanced AI capabilities. Introduction Zencoder AI's AI agents are built to act as digital assistants, automating complex tasks and improving operational efficiency across multiple industries. These agents leverage cutting-edge AI technologies to handle tasks s", 'subfield': 'Coding Agent', 'field': 'AI AGENT', 'id': 'zencoder-ai/zencoder-ai', 'content_tag_list': ',AI AGENT', 'thumbnail_picture': 'https://zencoder.ai/favicon.ico'}, {'content_name': 'gpt-engineer', 'publisher_id': 'pub-antonosika', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/ai-agent/pub-antonosika/gpt-engineer', 'website': 'https://github.com/AntonOsika/gpt-engineer', 'github': 'https://github.com/AntonOsika/gpt-engineer', 'review_cnt': '0', 'rating': '0.0', 'description': '# gpt-engineer\n\n](https://github.com/gpt-engineer-org/gpt-engineer)\n](https://discord.gg/8tcDQ89Ej2)\n](https://github.com/gpt-engineer-org/gpt-engineer/blob/main/LICENSE)\n](https://github.com/gpt-engineer-org/gpt-engineer/issues)\n\n](https://twitter.com/antonosika)\n\nThe OG code genereation experimentation platform!\n\nIf you are looking for the evolution that is an opinionated, managed service – chec', 'subfield': 'AI AGENT', 'field': 'AI AGENT', 'id': 'antonosika/gpt-engineer', 'content_tag_list': 'GitHub 55.0k,ai,autonomous-agent,code-generation,codebase-generation,codegen,coding-assistant,gpt-4,gpt-engineer,openai,python', 'thumbnail_picture': 'https://avatars.githubusercontent.com/u/4467025?v=4'}]
```

Search Result of Retrieving registered project id 'AI-Hub-Admin/My-First-AI-Coding-Agent'

```
Retrieving specific agent with unique ID: AI-Hub-Admin/My-First-AI-Coding-Agent

{'total_hits': 1, 'id': 'AI-Hub-Admin/My-First-AI-Coding-Agent', 'items': [{'content_name': 'My-First-AI-Coding-Agent', 'publisher_id': 'pub-ai-hub-admin', 'detail_url': 'https://www.deepnlp.org/store/ai-agent/ai-agent/pub-ai-hub-admin/my-first-ai-coding-agent', 'website': 'https://github.com/AI-Hub-Admin/My-First-AI-Coding-Agent', 'github': 'https://github.com/AI-Hub-Admin/My-First-AI-Coding-Agent', 'review_cnt': '0', 'rating': '0.0', 'description': '# My-First-AI-Coding-Agent\nAI Agent Registry Demo project\n\n', 'subfield': 'AI AGENT', 'field': 'AI AGENT', 'id': 'ai-hub-admin/my-first-ai-coding-agent', 'content_tag_list': 'GitHub 0', 'thumbnail_picture': 'https://avatars.githubusercontent.com/u/184629057?v=4'}]}
```

