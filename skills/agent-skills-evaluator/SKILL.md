---
name: agent-skills-evaluator
description: AI Agent Management Clis Hint and Completion Skill
---

## Description 
This skill run `agent rate` command line to evaluate 

The Agtm Skills CLI manages local skill bundles for supported agents (for example `claude-code`, `codex`, `openclaw`). It can download skills from GitHub, install them into the correct agent folders, list what is installed, record run logs, and apply rating benchmarks.

It also serves as a benchmarking tool to evaluate skill outputs:  
**Benchmark** your AI agent against real-world standards — from Google-level engineering to Apple-caliber product launches.   
**Rate** performance of each run with structured scores and levels, helping agents like Claude Code choose the right skills more effectively.   


## Tutorial

#### Setup

To use the rate command, have to setup the benchmark levels configuration. save to `./agtm/levels/*.json` files
```shell
agtm setup --levels
```

#### Description 
This skill run `agent rate` command line to evaluate 

The Agtm Skills CLI manages local skill bundles for supported agents (for example `claude-code`, `codex`, `openclaw`). It can download skills from GitHub, install them into the correct agent folders, list what is installed, record run logs, and apply rating benchmarks.

It also serves as a benchmarking tool to evaluate skill outputs:  
**Benchmark** your AI agent against real-world standards — from Google-level engineering to Apple-caliber product launches.   
**Rate** performance of each run with structured scores and levels, helping agents like Claude Code choose the right skills more effectively.   


#### Usage


Each time after your agent runs a skills, it runs a follow up skill agent-skills-evaluator to track
the log of this run with input, output summarized, keep them in a log file based memory. 
Then it calls the `agtm skills log` and  `agtm skills rate`, `agtm skills rate show`

`agtm skills log`: keep track of skills running in a local cache json log file
`agtm skills rate prepare`: Fetch the evaluator and benchmarks.json, load the criteria of evaluation, such as job levels, task fullfillment.
`agtm skills rate apply`: Append the LLM Based Evaluator to the local results.
`agtm skills rate show`: Show the table of historical scores, level ratings.

```
agtm skills log <skill_id> --data '<json_payload>'   
agtm skills rate prepare --skill_id <skill_id> --prompt "<eval_prompt>" --benchmark <path/benchmark.json>
agtm skills rate apply   --skill_id <skill_id> --result '<result_json: log_id>'
agtm skills rate show    --skill_id <skill_id>
```

#### Example 
Note: `code_success_skills` is a dummy skill which always produce success results, `code_fail_skills` is a dummy skill which always produce failure results, 


```shell
## log command will output a log_id
agtm skills log code_success_skills --data '{"input":"generate sql","output":"ok","meta":{"agent":"claude-code"}}'
agtm skills rate prepare --skill_id code_success_skills --prompt "Evaluate the code execution results"
agtm skills rate apply --skill_id code_success_skills --result '{"results":[{"log_id":"3679a3fe-4d97-4eb1-83bc-f83d711be195","rating":0.90,"level":"L4"}]}'
agtm skills rate show  ## show the historical skills dashboard, including score, evaluation levels
```

Note: 
- Persists a run record at `.agtm/skills/log/<uuid>.json` (or the `--logDir` you supply).
- `<json_payload>` must contain at least `input` and `output`; optional fields (meta, rating, level) are accepted.


#### Pipeline

**Step 1. Add log to memory**
```
agtm skills log code_success_skills --data '{"input":"generate sql","output":"ok","meta":{"agent":"claude-code"}}'
agtm skills log code_fail_skills --data '{"input":"generate sql","output":"failure","meta":{"agent":"claude-code"}}'

```

It will generate a {log_id}.json as memory
```shell
✅ Saved log to .agtm/skills/log/96c216f1-edc5-40f3-b041-b01a68b137a1.json
```

**Step 2. Prepare Evaluation prompt**

Prepare (<input, output>, benchmark) for LLM to compare the <input,output> with the benchmark..

```shell
agtm skills rate prepare --skill_id code_success_skills --prompt "Evaluate the code execution results"

agtm skills rate prepare --skill_id code_fail_skills --prompt "Evaluate the code execution results"
```

```shell
{"skill_id":"code_success_skills","benchmarks":[{"software-engineering":{"Google":[{"level":"L3","title":"Software Engineer II","description":"Entry-level engineer. Delivers well-scoped tasks with guidance. Learning codebase, tools, and best practices.","signals":["task execution","learning velocity","code quality basics"]},{"level":"L4","title":"Software Engineer III","description":"Independent contributor. Owns small features end-to-end. Writes maintainable code and participates in design discussions.","signals":["ownership","code quality","debugging ability"]},{"level":"L5","title":"Senior Software Engineer","description":"Leads projects and drives design decisions. Mentors others and improves system quality.","signals":["technical leadership","system design","mentorship"]},{"level":"L6","title":"Staff Software Engineer","description":"Owns large systems or cross-team initiatives. Sets technical direction and influences multiple teams.","signals":["architecture","cross-team impact","scalability thinking"]},{"level":"L7","title":"Senior Staff Software Engineer","description":"Drives org-level technical strategy. Solves ambiguous, high-impact problems.","signals":["org influence","complex problem solving","long-term vision"]},{"level":"L8","title":"Principal Engineer","description":"Company-wide impact. Defines technical standards and long-term architecture.","signals":["company impact","vision","industry-level thinking"]}]}}],"logs":[{"log_id":"1db0e927-79f1-46c2-b6dd-200d567f631d","input":"generate sql","output":"ok"},{"log_id":"94a2fae9-80ff-4b18-a77a-5714d34bcc20","input":"generate sql","output":"ok"},{"log_id":"96c216f1-edc5-40f3-b041-b01a68b137a1","input":"generate sql","output":"ok"},{"log_id":"b1f76f33-6f45-41e3-ae14-6b598f6aa357","input":"generate sql","output":"ok"}],"instructions":"System Prompt: You are an evaluator of skill performance. Score each example from 0.0 to 1.0 and assign a level based on benchmarks. Return JSON only. Please output json in format of {\"skill_id\": <skill_id>, \"results\": [{\"log_id\": \"<log_id_1>\", \"score\": 1.0, \"level\": \"L3\", **extra},{\"log_id\": \"<log_id_2>\", \"score\": 1.0, \"level\": \"L3\", **extra}]}\nUser prompt: Evaluate the code execution results"}

{"skill_id":"code_fail_skills","benchmarks":[{"software-engineering":{"Google":[{"level":"L3","title":"Software Engineer II","description":"Entry-level engineer. Delivers well-scoped tasks with guidance. Learning codebase, tools, and best practices.","signals":["task execution","learning velocity","code quality basics"]},{"level":"L4","title":"Software Engineer III","description":"Independent contributor. Owns small features end-to-end. Writes maintainable code and participates in design discussions.","signals":["ownership","code quality","debugging ability"]},{"level":"L5","title":"Senior Software Engineer","description":"Leads projects and drives design decisions. Mentors others and improves system quality.","signals":["technical leadership","system design","mentorship"]},{"level":"L6","title":"Staff Software Engineer","description":"Owns large systems or cross-team initiatives. Sets technical direction and influences multiple teams.","signals":["architecture","cross-team impact","scalability thinking"]},{"level":"L7","title":"Senior Staff Software Engineer","description":"Drives org-level technical strategy. Solves ambiguous, high-impact problems.","signals":["org influence","complex problem solving","long-term vision"]},{"level":"L8","title":"Principal Engineer","description":"Company-wide impact. Defines technical standards and long-term architecture.","signals":["company impact","vision","industry-level thinking"]}]}}],"logs":[{"log_id":"2e5513e7-27ae-4636-9d21-4b57ec9f739b","input":"generate sql","output":"failure"},{"log_id":"563747fb-ea62-4ebc-80c4-1bc1d1c82ed5","input":"generate sql","output":"failure"},{"log_id":"db699754-b1fd-491c-a49f-2af1a41ad1f7","input":"generate sql","output":"failure"}],"instructions":"System Prompt: You are an evaluator of skill performance. Score each example from 0.0 to 1.0 and assign a level based on benchmarks. Return JSON only. Please output json in format of {\"skill_id\": <skill_id>, \"results\": [{\"log_id\": \"<log_id_1>\", \"score\": 1.0, \"level\": \"L3\", **extra},{\"log_id\": \"<log_id_2>\", \"score\": 1.0, \"level\": \"L3\", **extra}]}\nUser prompt: Evaluate the code execution results"}
```

**Step 3. Local Agent Run the evaluation prompt of step 2.**

Your Agent give {"score": double, "level": str} to each of the log_id
```
{"skill_id":"code_success_skills","results":[{"log_id":"1db0e927-79f1-46c2-b6dd-200d567f631d","score":1,"level":"L3","rationale":"Successfully executed a well-scoped task generate sql. Matches entry-level performance criteria for task execution."},{"log_id":"94a2fae9-80ff-4b18-a77a-5714d34bcc20","score":1,"level":"L3","rationale":"Successfully executed a well-scoped task generate sql. Matches entry-level performance criteria for task execution."},{"log_id":"96c216f1-edc5-40f3-b041-b01a68b137a1","score":1,"level":"L3","rationale":"Successfully executed a well-scoped task generate sql. Matches entry-level performance criteria for task execution."},{"log_id":"b1f76f33-6f45-41e3-ae14-6b598f6aa357","score":1,"level":"L3","rationale":"Successfully executed a well-scoped task generate sql. Matches entry-level performance criteria for task execution."}]}

{"skill_id":"code_fail_skills","results":[{"log_id":"2e5513e7-27ae-4636-9d21-4b57ec9f739b","score":0,"level":"L3"},{"log_id":"563747fb-ea62-4ebc-80c4-1bc1d1c82ed5","score":0,"level":"L3"},{"log_id":"db699754-b1fd-491c-a49f-2af1a41ad1f7","score":0,"level":"L3"}]}
```

**Step 4. Apply Results to Local Log Status**

```shell
agtm skills rate apply --skill_id code_success_skills --result '{"skill_id":"code_success_skills","results":[{"log_id":"1db0e927-79f1-46c2-b6dd-200d567f631d","score":1,"level":"L3","rationale":"Successfully executed a well-scoped task generate sql. Matches entry-level performance criteria for task execution."},{"log_id":"94a2fae9-80ff-4b18-a77a-5714d34bcc20","score":1,"level":"L3","rationale":"Successfully executed a well-scoped task generate sql. Matches entry-level performance criteria for task execution."},{"log_id":"96c216f1-edc5-40f3-b041-b01a68b137a1","score":1,"level":"L3","rationale":"Successfully executed a well-scoped task generate sql. Matches entry-level performance criteria for task execution."},{"log_id":"b1f76f33-6f45-41e3-ae14-6b598f6aa357","score":1,"level":"L3","rationale":"Successfully executed a well-scoped task generate. Matches entry-level performance criteria for task execution."}]}'

agtm skills rate apply --skill_id code_fail_skills --result '{"skill_id":"code_fail_skills","results":[{"log_id":"2e5513e7-27ae-4636-9d21-4b57ec9f739b","score":0,"level":"L3"},{"log_id":"563747fb-ea62-4ebc-80c4-1bc1d1c82ed5","score":0,"level":"L3"},{"log_id":"db699754-b1fd-491c-a49f-2af1a41ad1f7","score":0,"level":"L3"}]}'
```

**Step 5.  Show final Result (Optional)**
```shell
agtm skills rate show
```


```shell
skill_id             run_times  score  level
-------------------  ---------  -----  -----
code_fail_skills     3          0.00   L3   
code_success_skills  4          1.00   L3   
```

#### CLI Documents

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



