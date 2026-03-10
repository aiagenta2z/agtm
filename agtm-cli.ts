#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import * as fs from 'node:fs';
import * as yaml from 'js-yaml';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFileSync } from 'node:child_process';
import { createInterface } from 'node:readline/promises';


// --- Configuration ---
const BASE_URL = 'https://www.deepnlp.org/api/ai_agent_marketplace';
const REGISTRY_ENDPOINT = `${BASE_URL}/registry`;
const REGISTRY_ENDPOINT_v1 = `${BASE_URL}/v1`;
const SEARCH_ENDPOINT = `${BASE_URL}/v2`; // Assuming a search endpoint exists
const ACCESS_KEY_ENV_VAR = 'AI_AGENT_MARKETPLACE_ACCESS_KEY';
const MOCK_RETURN_URL = "https://www.deepnlp.org/store/ai-agent/ai-agent/pub-AI-Hub-Admin/my-first-ai-coding-agent";

// --- Utility Functions ---

/**
 * Retrieves the access key from environment variables.
 */
function getAccessKey(): string {
    const key = process.env[ACCESS_KEY_ENV_VAR];
    if (!key) {
        console.error(`\n❌ Error: Access key not found.`);
        console.error(`Please set the environment variable '${ACCESS_KEY_ENV_VAR}'.`);
        console.error('You can get your access key from: https://deepnlp.org/workspace/keys');
        process.exit(1);
    } else if (key === '{AI_AGENT_MARKETPLACE_ACCESS_KEY}' || key === '{your_access_key}') {
        console.log(`\n Your Input key variable AI_AGENT_MARKETPLACE_ACCESS_KEY ${key} is mock key, Will Return a mock result. Please register and get your keys at https://www.deepnlp.org/workspace/keys. Detail Usage for Documentation: https://www.deepnlp.org/doc/ai_agent_marketplace...`);
        console.log("\n✅ Registration Successful!");
        console.log(`   URL: ${MOCK_RETURN_URL}`);
        console.log(`   Message: Your Input key is mock key, Will Return a mock result. `);
        console.log(`   Track its status at: ${MOCK_RETURN_URL} or submit your AI Agent registry through online website https://www.deepnlp.org/workspace/my_ai_services`);
        process.exit(1);
    }
    return key;
}

/**
 * Loads a configuration file (.json or .yaml) and returns the data.
 */
function loadConfigFile(filePath: string): Record<string, any> {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        if (filePath.endsWith('.json')) {
            return JSON.parse(content);
        } else if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
            return yaml.load(content) as Record<string, any>;
        } else {
            throw new Error("Unsupported configuration file format. Must be .json or .yaml.");
        }
    } catch (e: any) {
        console.error(`\n❌ Error loading configuration file '${filePath}': ${e.message}`);
        process.exit(1);
    }
}


/**
 * Fills a dictionary (JavaScript Object) with values from a source object based on 
 * a list of required and optional keys.
 */
function fillItemInfoDict(
        file_content: Record<string, any>, 
        required_keys: string[], 
        optional_keys: string[]
    ): Record<string, any> {
    
    const item_info: Record<string, any> = {};

    // 1. Process Required Keys
    if (required_keys && Array.isArray(required_keys)) {
        for (const key of required_keys) {
            if (file_content[key] === undefined || file_content[key] === null) {
                // If a required key is missing or explicitly null/undefined, throw an error.
                throw new Error(`❌ Error: Required key '${key}' is missing or empty in the file content.`);
            }
            // Add the key-value pair to the result dictionary
            item_info[key] = file_content[key];
        }
    }

    // 2. Process Optional Keys
    if (optional_keys && Array.isArray(optional_keys)) {
        for (const key of optional_keys) {
            // Check if the key exists in the file_content AND hasn't already been added as a required key
            // (The second part is mostly for efficiency, but also good practice)
            if (file_content[key] !== undefined && required_keys.indexOf(key) === -1) {
                // Add the optional key-value pair if it exists
                item_info[key] = file_content[key];
            }
        }
    }

    return item_info;
}

// --- Skills Utilities ---

type AgentSpec = {
    id: string;
    projectPath: string;
    globalPath: string;
};

type SkillInfo = {
    name: string;
    dir: string;
    source: string;
};

const AGENT_SPECS: AgentSpec[] = [
    { id: 'amp', projectPath: '.agents/skills', globalPath: '.config/agents/skills' },
    { id: 'kimi-cli', projectPath: '.agents/skills', globalPath: '.config/agents/skills' },
    { id: 'replit', projectPath: '.agents/skills', globalPath: '.config/agents/skills' },
    { id: 'universal', projectPath: '.agents/skills', globalPath: '.config/agents/skills' },
    { id: 'antigravity', projectPath: '.agent/skills', globalPath: '.gemini/antigravity/skills' },
    { id: 'augment', projectPath: '.augment/skills', globalPath: '.augment/skills' },
    { id: 'claude-code', projectPath: '.claude/skills', globalPath: '.claude/skills' },
    { id: 'openclaw', projectPath: 'skills', globalPath: '.openclaw/skills' },
    { id: 'cline', projectPath: '.agents/skills', globalPath: '.agents/skills' },
    { id: 'codebuddy', projectPath: '.codebuddy/skills', globalPath: '.codebuddy/skills' },
    { id: 'codex', projectPath: '.agents/skills', globalPath: '.codex/skills' },
    { id: 'command-code', projectPath: '.commandcode/skills', globalPath: '.commandcode/skills' },
    { id: 'continue', projectPath: '.continue/skills', globalPath: '.continue/skills' },
    { id: 'cortex', projectPath: '.cortex/skills', globalPath: '.snowflake/cortex/skills' },
    { id: 'crush', projectPath: '.crush/skills', globalPath: '.config/crush/skills' },
    { id: 'cursor', projectPath: '.agents/skills', globalPath: '.cursor/skills' },
    { id: 'droid', projectPath: '.factory/skills', globalPath: '.factory/skills' },
    { id: 'gemini-cli', projectPath: '.agents/skills', globalPath: '.gemini/skills' },
    { id: 'github-copilot', projectPath: '.agents/skills', globalPath: '.copilot/skills' },
    { id: 'goose', projectPath: '.goose/skills', globalPath: '.config/goose/skills' },
    { id: 'junie', projectPath: '.junie/skills', globalPath: '.junie/skills' },
    { id: 'iflow-cli', projectPath: '.iflow/skills', globalPath: '.iflow/skills' },
    { id: 'kilo', projectPath: '.kilocode/skills', globalPath: '.kilocode/skills' },
    { id: 'kiro-cli', projectPath: '.kiro/skills', globalPath: '.kiro/skills' },
    { id: 'kode', projectPath: '.kode/skills', globalPath: '.kode/skills' },
    { id: 'mcpjam', projectPath: '.mcpjam/skills', globalPath: '.mcpjam/skills' },
    { id: 'mistral-vibe', projectPath: '.vibe/skills', globalPath: '.vibe/skills' },
    { id: 'mux', projectPath: '.mux/skills', globalPath: '.mux/skills' },
    { id: 'opencode', projectPath: '.agents/skills', globalPath: '.config/opencode/skills' },
    { id: 'openhands', projectPath: '.openhands/skills', globalPath: '.openhands/skills' },
    { id: 'pi', projectPath: '.pi/skills', globalPath: '.pi/agent/skills' },
    { id: 'qoder', projectPath: '.qoder/skills', globalPath: '.qoder/skills' },
    { id: 'qwen-code', projectPath: '.qwen/skills', globalPath: '.qwen/skills' },
    { id: 'roo', projectPath: '.roo/skills', globalPath: '.roo/skills' },
    { id: 'trae', projectPath: '.trae/skills', globalPath: '.trae/skills' },
    { id: 'trae-cn', projectPath: '.trae/skills', globalPath: '.trae-cn/skills' },
    { id: 'windsurf', projectPath: '.windsurf/skills', globalPath: '.codeium/windsurf/skills' },
    { id: 'zencoder', projectPath: '.zencoder/skills', globalPath: '.zencoder/skills' },
    { id: 'neovate', projectPath: '.neovate/skills', globalPath: '.neovate/skills' },
    { id: 'pochi', projectPath: '.pochi/skills', globalPath: '.pochi/skills' },
    { id: 'adal', projectPath: '.adal/skills', globalPath: '.adal/skills' }
];
const DEFAULT_AGENT_IDS = ['antigravity', 'codex', 'claude-code', 'openclaw'];

function normalizeAgentId(value: string): string {
    return value.toLowerCase().replace(/[\s_]+/g, '-').replace(/-+/g, '-').trim();
}

function resolveAgents(agentArgs?: string[]): AgentSpec[] {
    if (agentArgs && agentArgs.length > 0) {
        const normalized = agentArgs.map(normalizeAgentId);
        if (normalized.includes('*')) {
            return AGENT_SPECS;
        }
        const selected: AgentSpec[] = [];
        for (const agentId of normalized) {
            const match = AGENT_SPECS.find((spec) => spec.id === agentId);
            if (!match) {
                console.error(`\n❌ Error: Unknown agent '${agentId}'.`);
                console.error(`Supported agents: ${AGENT_SPECS.map((spec) => spec.id).join(', ')}`);
                process.exit(1);
            }
            selected.push(match);
        }
        return selected;
    }

    const detected = AGENT_SPECS.filter((spec) =>
        fs.existsSync(path.join(process.cwd(), spec.projectPath))
    );

    if (detected.length > 0) {
        return detected;
    }

    const fallback = AGENT_SPECS.find((spec) => spec.id === 'codex');
    return fallback ? [fallback] : [];
}

function printAvailableAgents(): void {
    console.log('\nAvailable agents:');
    AGENT_SPECS.forEach((spec, index) => {
        const marker = DEFAULT_AGENT_IDS.includes(spec.id) ? ' (default)' : '';
        console.log(`  ${index + 1}. ${spec.id}${marker}`);
    });
}

async function promptAgentSelection(): Promise<AgentSpec[]> {
    if (!process.stdin.isTTY) {
        return resolveAgents(DEFAULT_AGENT_IDS);
    }

    printAvailableAgents();
    console.log('\nSelect agents by number or id (comma-separated).');
    console.log(`Press Enter to use defaults: ${DEFAULT_AGENT_IDS.join(', ')}`);
    console.log('Type "*" to select all agents.');

    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answerRaw = await rl.question('\nAgents: ');
        const answer = answerRaw.trim();
        if (answer === '') {
            return resolveAgents(DEFAULT_AGENT_IDS);
        }
        if (answer === '*') {
            return AGENT_SPECS;
        }

        const tokens = answer
            .split(/[,\s]+/)
            .map((token) => token.trim())
            .filter(Boolean);

        const ids: string[] = tokens.map((token) => {
            if (/^\d+$/.test(token)) {
                const index = Number(token) - 1;
                if (index < 0 || index >= AGENT_SPECS.length) {
                    console.error(`\n❌ Error: Invalid agent number '${token}'.`);
                    process.exit(1);
                }
                return AGENT_SPECS[index].id;
            }
            return token;
        });

        return resolveAgents(ids);
    } finally {
        rl.close();
    }
}

function getAgentInstallPath(agent: AgentSpec, useGlobal: boolean): string {
    if (useGlobal) {
        return path.join(os.homedir(), agent.globalPath);
    }
    return path.join(process.cwd(), agent.projectPath);
}

function parseSkillFrontmatter(content: string): { name?: string } {
    if (!content.startsWith('---')) {
        return {};
    }
    const endIndex = content.indexOf('\n---', 3);
    if (endIndex === -1) {
        return {};
    }
    const frontmatter = content.slice(3, endIndex);
    try {
        const parsed = yaml.load(frontmatter);
        if (parsed && typeof parsed === 'object' && 'name' in parsed) {
            return { name: String((parsed as Record<string, any>).name || '') };
        }
    } catch {
        return {};
    }
    return {};
}

function findSkillFiles(startDir: string): string[] {
    const results: string[] = [];
    const stack: string[] = [startDir];
    while (stack.length > 0) {
        const current = stack.pop();
        if (!current) {
            continue;
        }
        let entries: fs.Dirent[];
        try {
            entries = fs.readdirSync(current, { withFileTypes: true });
        } catch {
            continue;
        }
        for (const entry of entries) {
            if (entry.name === 'node_modules' || entry.name === '.git') {
                continue;
            }
            const fullPath = path.join(current, entry.name);
            if (entry.isDirectory()) {
                stack.push(fullPath);
            } else if (entry.isFile() && entry.name === 'SKILL.md') {
                results.push(fullPath);
            }
        }
    }
    return results;
}

function discoverSkills(basePath: string): SkillInfo[] {
    const skills: SkillInfo[] = [];
    const directSkill = path.join(basePath, 'SKILL.md');
    if (fs.existsSync(directSkill)) {
        const content = fs.readFileSync(directSkill, 'utf8');
        const meta = parseSkillFrontmatter(content);
        const name = meta.name && meta.name.trim() ? meta.name.trim() : path.basename(basePath);
        skills.push({ name, dir: basePath, source: directSkill });
        return skills;
    }

    const skillsRoot = path.join(basePath, 'skills');
    const searchRoot = fs.existsSync(skillsRoot) ? skillsRoot : basePath;
    const skillFiles = findSkillFiles(searchRoot);

    for (const skillFile of skillFiles) {
        const skillDir = path.dirname(skillFile);
        const content = fs.readFileSync(skillFile, 'utf8');
        const meta = parseSkillFrontmatter(content);
        const name = meta.name && meta.name.trim() ? meta.name.trim() : path.basename(skillDir);
        skills.push({ name, dir: skillDir, source: skillFile });
    }
    return skills;
}

function parseGitHubSource(input: string): { cloneUrl: string; subPath?: string; branch?: string } | null {
    if (input.startsWith('https://github.com/')) {
        const match = input.match(/^https:\/\/github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+)\/?(.*))?$/);
        if (!match) {
            return null;
        }
        const [, owner, repo, branch, subPath] = match;
        return {
            cloneUrl: `https://github.com/${owner}/${repo}.git`,
            branch,
            subPath: subPath ? subPath.replace(/^\/+/, '') : undefined
        };
    }
    if (/^[^/]+\/[^/]+$/.test(input)) {
        return {
            cloneUrl: `https://github.com/${input}.git`
        };
    }
    return null;
}

function resolveSkillSource(source: string): { root: string; cleanup?: () => void } {
    if (fs.existsSync(source)) {
        return { root: path.resolve(source) };
    }

    const parsed = parseGitHubSource(source);
    if (!parsed) {
        console.error(`\n❌ Error: Unsupported source '${source}'. Provide a local path or GitHub URL.`);
        process.exit(1);
    }
    const parsedValue = parsed as NonNullable<typeof parsed>;

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'agtm-skills-'));
    const gitArgs = ['clone', '--depth', '1'];
    if (parsedValue.branch) {
        gitArgs.push('--branch', parsedValue.branch);
    }
    gitArgs.push(parsedValue.cloneUrl, tmpDir);
    try {
        execFileSync('git', gitArgs, { stdio: 'ignore' });
    } catch (e: any) {
        console.error(`\n❌ Error: Failed to clone repository. Ensure 'git' is installed and the URL is correct.`);
        process.exit(1);
    }

    const root = parsedValue.subPath ? path.join(tmpDir, parsedValue.subPath) : tmpDir;
    if (!fs.existsSync(root)) {
        console.error(`\n❌ Error: Path '${parsedValue.subPath}' does not exist in the repository.`);
        process.exit(1);
    }
    return {
        root,
        cleanup: () => {
            try {
                fs.rmSync(tmpDir, { recursive: true, force: true });
            } catch {
                // ignore cleanup errors
            }
        }
    };
}

function ensureDir(dirPath: string) {
    fs.mkdirSync(dirPath, { recursive: true });
}

function copySkillDir(sourceDir: string, targetDir: string) {
    if (fs.existsSync(targetDir)) {
        fs.rmSync(targetDir, { recursive: true, force: true });
    }
    fs.cpSync(sourceDir, targetDir, { recursive: true });
}

async function handleAdd(options: { source?: string; skill?: string[]; agent?: string[]; global?: boolean }) {
    const source = options.source;
    if (!source) {
        console.error("\n❌ Error: 'add' command requires a source path or GitHub URL.");
        process.exit(1);
        return;
    }

    const resolved = resolveSkillSource(source);
    const skills = discoverSkills(resolved.root);
    if (skills.length === 0) {
        console.error(`\n❌ Error: No skills found in source '${source}'.`);
        resolved.cleanup?.();
        process.exit(1);
    }

    const requestedSkills = (options.skill && options.skill.length > 0) ? options.skill : ['*'];
    const normalizedRequested = requestedSkills.map((name) => name.toLowerCase());
    const filteredSkills = normalizedRequested.includes('*')
        ? skills
        : skills.filter((skill) => normalizedRequested.includes(skill.name.toLowerCase()));

    if (filteredSkills.length === 0) {
        console.error(`\n❌ Error: Requested skills not found. Available skills: ${skills.map((s) => s.name).join(', ')}`);
        resolved.cleanup?.();
        process.exit(1);
    }

    const agents = (options.agent && options.agent.length > 0)
        ? resolveAgents(options.agent)
        : resolveAgents(DEFAULT_AGENT_IDS);
    if (agents.length === 0) {
        console.error('\n❌ Error: No target agents resolved.');
        resolved.cleanup?.();
        process.exit(1);
    }

    for (const agent of agents) {
        const baseDir = getAgentInstallPath(agent, Boolean(options.global));
        ensureDir(baseDir);
        for (const skill of filteredSkills) {
            const targetDir = path.join(baseDir, skill.name);
            copySkillDir(skill.dir, targetDir);
            console.log(`Installed skill '${skill.name}' to ${agent.id} at ${targetDir}`);
        }
    }

    resolved.cleanup?.();
}

// --- Command Handlers ---

const default_required_keys = ["name", "content"];
const default_optional_keys = [
    "website", "field", "subfield", "content_tag_list", "github", "price_type", 
    "api", "thumbnail_picture",  "upload_image_files", "sdk", "package"];

/**
 * Handles the 'agtm upload' command.
 */
async function handleUpload(options: { github?: string, config?: string, endpoint?: string, schema?: string }) {
    const access_key = getAccessKey();
    let item_info: Record<string, any> = {};

    // 1.0 set endpoint 
    const url = options.endpoint || REGISTRY_ENDPOINT;

    // 2.0 schema
    var required_keys = [];
    var optional_keys = [];
    if (options.schema && options.schema != "") {
        const schemaConfig = loadConfigFile(options.schema);
        required_keys = schemaConfig.required;
        optional_keys = schemaConfig.optional;
    } else {
        required_keys = default_required_keys;
        optional_keys = default_optional_keys;
    }
    
    // set default registry endpoint and then change according to github/other configs
    if (options.github) {
        console.log(`\nAttempting to register agent from GitHub: ${options.github}`);
        item_info.github = options.github;
    } else if (options.config) {

        console.log(`\nAttempting to register agent from config file: ${options.config}`);
        const file_content = loadConfigFile(options.config);
        
        // Basic validation for config upload
        item_info = fillItemInfoDict(file_content, required_keys, optional_keys);
    } else {
        // Should be handled by commander's required option check, but kept as safeguard.
        console.error("❌ Error: 'upload' command requires either --github or --config.");
        process.exit(1);
    }
    
    // decide endpoint
    // if github mode, set to REGISTRY_ENDPOINT, otherwise if config mode set to REGISTRY_ENDPOINT_v1
    // if endpoint set externally, has higher priority.
    // console.log(`DEBUG: options.endpoint ${options.endpoint}`);
    // console.log(`DEBUG: internal_endpoint ${internal_endpoint}`);
    // console.log(`DEBUG: final url ${url}`);
    // Prepare payload (combining item info and access key)
    const payload = { ...item_info, access_key };

    console.log(`Submitting agent information to endpoint: ${url}`);
    console.log(`Submitting agent information to payload: ${JSON.stringify(item_info)}`);
    
    try {
        const response = await axios.post(url, payload, {
            headers: { 'Content-Type': 'application/json' },
            // Set a reasonable timeout
            timeout: 10000 
        });

        const result = response.data;
        const result_url = result.url || 'N/A';
        const result_msg = result.msg || 'No message provided.';

        if (response.status >= 200 && response.status < 300) {
            console.log("\n✅ Registration Successful!");
            console.log(`   URL: ${result_url}`);
            console.log(`   Message: ${result_msg}`);
            console.log(`   Track its status at: ${result_url} or submit your AI Agent registry through online website https://www.deepnlp.org/workspace/my_ai_services`);
        } else {
            console.log("\n❌ Registration Failed.");
            console.log(`   Status: ${response.status}`);
            console.log(`   Response Message: ${result_msg}`);
            process.exit(1);
        }

    } catch (e: any) {
        const status = e.response ? e.response.status : 'N/A';
        const msg = e.response?.data?.msg || e.message;
        console.error(`\n❌ An unexpected error occurred during submission (Status: ${status}): ${msg}`);
        process.exit(1);
    }
}

/**
 * Handles the 'agtm search' command.
 */
async function handleSearch(options: { q?: string, id?: number, countPerPage?: number }) {
    const { q, id, countPerPage } = options;
    
    if (!q && !id) {
        console.error("❌ Error: 'search' command requires either --q (query) or --id (Agent ID).");
        process.exit(1);
    }

    var defaultSearchMode = "dict";
    const searchParams = new URLSearchParams();
    if (q) searchParams.append('q', q);
    if (id) searchParams.append('id', id.toString());
    searchParams.append('count_per_page', (countPerPage || 10).toString());
    searchParams.append('mode', defaultSearchMode);

    const url = `${SEARCH_ENDPOINT}?${searchParams.toString()}`;
    console.log(`\nSearching marketplace at: ${url}`);

    try {
        const response = await axios.get(url, { timeout: 10000 });
        const results = response.data;
        if (results != null) {
            console.log(`\n✅ Search Complete.`);
            console.log(`\n${JSON.stringify(results, null, 2)}`);
        } else {
            console.log(`\n✅ Search Complete. Found Empty results.`);
        }
    } catch (e: any) {
        const msg = e.response?.data?.msg || e.message;
        console.error(`\n❌ Error during search: ${msg}`);
        process.exit(1);
    }
}

// --- CLI Setup (Commander) ---

const program = new Command();

program
    .name('agtm')
    .description('An Open Source Command-line Tool for AI Agents meta registry, AI Agents Marketplace Management, AI Agents Search and AI Agents Index Services. Help users to explore interesting AI Agents. Documentation: https://www.deepnlp.org/doc/ai_agent_marketplace, Marketplace: https://www.deepnlp.org/store/ai-agent')
    .version('1.0.4');

// 1. UPLOAD Command
const uploadCommand = program.command('upload')
    .description('Register or update AI Agent meta information in the marketplace.')
    .action(handleUpload);

// Mutually Exclusive Group (managed with custom logic and checks)
uploadCommand.option('--github <url>', 'The GitHub repository URL for the open-sourced agent.');
uploadCommand.option('--config <path>', 'Path to a .json or .yaml, agent.json file containing the agent\'s meta information.');
uploadCommand.option('--endpoint <url>', 'The endpoint URL to post data to (overrides default).', "");
uploadCommand.option('--schema <path>', 'Path to a .json or .yaml, schema.json file containing the agent\'s meta information.', "");


uploadCommand.hook('preAction', (thisCommand: Command) => {
    const options = thisCommand.opts();
    if (!options.github && !options.config) {
        console.error("\n❌ Error: 'upload' command requires either --github or --config.");
        thisCommand.outputHelp();
        process.exit(1);
    }
    if (options.github && options.config) {
        console.error("\n❌ Error: Cannot use both --github and --config simultaneously.");
        thisCommand.outputHelp();
        process.exit(1);
    }
});


// 2. SEARCH Command
program.command('search')
    .description('Search for registered AI Agents by query or specific ID.')
    .option('--q <query>', 'A free-text query string to search for agents.')
    .option('--id <id>', 'The specific unique ID of the AI Agent to retrieve, e.g. "AI-Hub-Admin/my-first-ai-coding-agent" ')
    .option('--count-per-page <count>', 'Count per page of search results returned.', (value: string) => parseInt(value, 10), 10) // default=10
    .action(handleSearch);

// 3. ADD Command (Skills)
program.command('add')
    .description('Download and install skills from a GitHub repo or local path.')
    .argument('<source>', 'GitHub repo URL, owner/repo, or local path')
    .option('-s, --skill <skill>', 'Install a specific skill (repeatable). Use "*" for all skills.', (value: string, prev: string[]) => {
        const list = prev || [];
        list.push(value);
        return list;
    }, [])
    .option('-a, --agent <agent>', 'Target specific agents (repeatable). Use "*" for all agents.', (value: string, prev: string[]) => {
        const list = prev || [];
        list.push(value);
        return list;
    }, [])
    .option('-g, --global', 'Install to global agent directories instead of project paths.')
    .action((source: string, options: Record<string, any>) => handleAdd({ ...options, source }));

program.parse(process.argv);
