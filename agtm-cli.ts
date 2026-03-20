#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import * as fs from 'node:fs';
import * as yaml from 'js-yaml';
import * as path from 'node:path';
import * as os from 'node:os';
import { execFileSync, spawn } from 'node:child_process';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';

//production setup
const LOG_ENABLE = false;

// --- Configuration ---
const BASE_URL = 'https://www.deepnlp.org/api/ai_agent_marketplace';
const REGISTRY_ENDPOINT = `${BASE_URL}/registry`;
const REGISTRY_ENDPOINT_v1 = `${BASE_URL}/v1`;
const SEARCH_ENDPOINT = `${BASE_URL}/v2`; // Assuming a search endpoint exists
const ACCESS_KEY_ENV_VAR = 'AI_AGENT_MARKETPLACE_ACCESS_KEY';
const MOCK_RETURN_URL = "https://www.deepnlp.org/store/ai-agent/ai-agent/pub-AI-Hub-Admin/my-first-ai-coding-agent";
const CLI_DIR = path.dirname(fileURLToPath(import.meta.url));
const MODE_AGENT = 'agent';
const MODE_HUMAN = 'human';
const AGTM_LOCAL_DIR = path.join(process.cwd(), '.agtm');
const AGTM_GLOBAL_DIR = path.join(os.homedir(), '.agtm');
const SKILL_LOG_DIR_LOCAL = path.join(AGTM_LOCAL_DIR, 'skills', 'log');
const SKILL_LOG_DIR_GLOBAL = path.join(AGTM_GLOBAL_DIR, 'skills', 'log');
const SKILL_LEVELS_DIR_LOCAL = path.join(AGTM_LOCAL_DIR, 'levels');
const SKILL_LEVELS_DIR_GLOBAL = path.join(AGTM_GLOBAL_DIR, 'levels');

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

function parseSkillFrontmatter(content: string): { name?: string; description?: string } {
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
        if (parsed && typeof parsed === 'object') {
            const record = parsed as Record<string, any>;
            const name = 'name' in record ? String(record.name || '') : undefined;
            const description = 'description' in record ? String(record.description || '') : undefined;
            return { name, description };
        }
    } catch {
        return {};
    }
    return {};
}

function extractDescriptionFromMarkdown(content: string): string | undefined {
    const lines = content.split(/\r?\n/);
    let idx = 0;
    if (lines[idx]?.trim() === '---') {
        idx += 1;
        while (idx < lines.length && lines[idx].trim() !== '---') {
            idx += 1;
        }
        idx += 1;
    }
    for (; idx < lines.length; idx += 1) {
        const line = lines[idx].trim();
        if (line) {
            return line;
        }
    }
    return undefined;
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

function discoverSkills(root: string) {
    const standardSkills = discoverStandardSkills(root);

    if (standardSkills.length > 0) {
        return standardSkills;
    }
    console.log("INFO: Starting to load various skills layout formats ./path/subfolder/skill_name.md")
    // fallback: normalize arbitrary markdown skills
    return normalizeExternalSkills(root);
}

function discoverStandardSkills(basePath: string): SkillInfo[] {
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

//discover skills, e.g. agency-agents
function normalizeExternalSkills(root: string): { name: string; dir: string }[] {
    const results: { name: string; dir: string }[] = [];
    const tmpBase = fs.mkdtempSync(path.join(os.tmpdir(), "agtm-skill-"));

    function walk(current: string, relativeParts: string[] = []) {
        const entries = fs.readdirSync(current, { withFileTypes: true });

        for (const entry of entries) {
            const fullPath = path.join(current, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath, [...relativeParts, entry.name]);
            } else if (entry.isFile() && entry.name.endsWith(".md")) {
                const skillBaseName = entry.name.replace(/\.md$/, "");
                if (skillBaseName.startsWith("CONTRIBUTING")
                    || skillBaseName.startsWith("README")
                    ||  skillBaseName.startsWith("PULL_REQUEST_TEMPLATE")) {
                    // skip
                    continue;
                }
                // Build normalized name
                const prefix = relativeParts.join("_");
                // const finalName = prefix
                //    ? `${prefix}_${skillBaseName}`
                //    : skillBaseName;
                //
                const finalName = skillBaseName;
                const targetDir = path.join(tmpBase, finalName);
                fs.mkdirSync(targetDir, { recursive: true });

                // Copy .md → SKILL.md
                fs.copyFileSync(fullPath, path.join(targetDir, "SKILL.md"));

                const skillFile = path.join(targetDir, "SKILL.md");
                // Read content
                let content = fs.readFileSync(skillFile, "utf-8");

                // Check if starts with YAML frontmatter
                if (!content.trim().startsWith("---")) {
                    const header = `---
                name: ${finalName}
                description: ${finalName}
                ---
                `;
                    if (LOG_ENABLE) {
                        console.log(`Append Yaml format to output Content to skillFile ${skillFile}`)
                    }
                    content = header + content;
                    fs.writeFileSync(skillFile, content, "utf-8");
                }

                results.push({
                    name: finalName,
                    dir: targetDir,
                });
            }
        }
    }

    walk(root);
    return results;
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



async function handleSkillsAdd(options: { source?: string; skill?: string[]; agent?: string[]; global?: boolean }) {
    const source = options.source;
    if (!source) {
        console.error("\n❌ Error: 'add' command requires a source path or GitHub URL.");
        process.exit(1);
        return;
    }
    console.log("INFO: Staring to fetch skills...")
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

type SkillMetadata = { name: string; description?: string; path: string; folder: string };

function readSkillMetadata(skillDir: string): SkillMetadata {
    const folder = path.basename(skillDir);
    const skillFile = path.join(skillDir, 'SKILL.md');
    let name = folder;
    let description: string | undefined;

    if (fs.existsSync(skillFile)) {
        const content = fs.readFileSync(skillFile, 'utf8');
        const meta = parseSkillFrontmatter(content);
        name = meta.name?.trim() || name;
        description = meta.description?.trim() || extractDescriptionFromMarkdown(content);
    }
    return { name, description, path: skillFile, folder };
}

async function handleSkillsList(options: { agent?: string[]; global?: boolean; logDir?: string }) {
    const agents = options.agent?.length ? resolveAgents(options.agent) : resolveAgents(DEFAULT_AGENT_IDS);
    if (agents.length === 0) {
        console.error('\n❌ Error: No target agents resolved.');
        process.exit(1);
    }

    const logDir = getLogDir(options.logDir);
    const stats = buildSkillStats(loadLogs(logDir));
    const rows: string[][] = [];

    for (const agent of agents) {
        const baseDir = getAgentInstallPath(agent, Boolean(options.global));
        if (!fs.existsSync(baseDir)) {
            continue;
        }

        const skillDirs = fs.readdirSync(baseDir, { withFileTypes: true })
            .filter((entry) => entry.isDirectory())
            .map((entry) => path.join(baseDir, entry.name));

        skillDirs.sort().forEach((dir) => {
            const info = readSkillMetadata(dir);
            const stat = stats.get(info.folder);
            const avg = stat && stat.ratingCount > 0 ? (stat.ratingSum / stat.ratingCount).toFixed(2) : '-';
            const levelSummary = stat ? formatLevelSummary(stat.levels) : '-';
            rows.push([
                agent.id,
                info.folder,
                // info.description || '-',
                shortenPath(dir),
                avg === '-' ? '-' : green(avg),
                levelSummary === '-' ? '-' : green(levelSummary)
            ]);
        });
    }

    if (rows.length === 0) {
        console.log('\nNo skills found.');
        return;
    }
    console.log(formatTable(['agent', 'skill_id', 'path', 'score', 'level'], rows));
    // console.log(formatTable(['agent', 'skill_id', 'description', 'path', 'score', 'level'], rows));
}

type SkillLogEntry = {
    log_id: string;
    skill_id: string;
    input?: string;
    output?: string;
    rating?: number;
    level?: string;
    created_at?: string;
    [key: string]: any;
};

function getLogDir(custom?: string): string {
    if (custom) return path.resolve(custom);
    ensureDir(SKILL_LOG_DIR_LOCAL);
    return SKILL_LOG_DIR_LOCAL;
}

function loadLogs(logDir: string): SkillLogEntry[] {
    ensureDir(logDir);
    const entries: SkillLogEntry[] = [];
    const files = fs.readdirSync(logDir).filter((f) => f.endsWith('.json'));
    for (const file of files) {
        const full = path.join(logDir, file);
        try {
            const parsed = JSON.parse(fs.readFileSync(full, 'utf8')) as SkillLogEntry;
            entries.push(parsed);
        } catch {
            console.warn(`Skipping invalid log file: ${full}`);
        }
    }
    return entries;
}

function writeLog(logDir: string, entry: SkillLogEntry) {
    ensureDir(logDir);
    const target = path.join(logDir, `${entry.log_id}.json`);
    fs.writeFileSync(target, JSON.stringify(entry, null, 2), 'utf8');
    console.log(`\n✅ Saved log to ${target}`);
}

async function handleSkillsLog(skillName: string, options: Record<string, any>) {
    if (!skillName) {
        console.error('\n❌ Error: Skill name/id is required for logging.');
        process.exit(1);
    }
    const logDir = getLogDir(options.logDir);
    const payloadRaw = options.data;
    if (!payloadRaw) {
        console.error('\n❌ Error: --data <json> is required.');
        process.exit(1);
    }

    let payload: Record<string, any>;
    try {
        payload = JSON.parse(payloadRaw);
    } catch (e: any) {
        console.error(`\n❌ Error: invalid JSON for --data: ${e.message}`);
        process.exit(1);
        return;
    }

    const logId = payload.log_id || randomUUID();
    const entry: SkillLogEntry = {
        log_id: logId,
        skill_id: skillName,
        input: payload.input,
        output: payload.output,
        meta: payload.meta,
        created_at: new Date().toISOString()
    };

    writeLog(logDir, entry);
}

function resolveLevelsFile(custom?: string): string | null {
    const candidates = custom
        ? [custom]
        : [
            path.join(SKILL_LEVELS_DIR_LOCAL, 'combined_levels.json'),
            path.join(SKILL_LEVELS_DIR_GLOBAL, 'combined_levels.json'),
            path.join(SKILL_LEVELS_DIR_LOCAL, 'software_engineer_google_levels.json'),
            path.join(SKILL_LEVELS_DIR_GLOBAL, 'software_engineer_google_levels.json'),
            path.join(SKILL_LEVELS_DIR_LOCAL, 'software_engineer_meta_levels.json'),
            path.join(SKILL_LEVELS_DIR_GLOBAL, 'software_engineer_meta_levels.json')
        ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

function loadLevelDescriptions(levelFile?: string): any | null {
    const resolved = resolveLevelsFile(levelFile);
    if (!resolved) {
        return null;
    }
    try {
        return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    } catch {
        console.warn(`Unable to parse levels file at ${resolved}`);
        return null;
    }
}

const DEFAULT_EVAL_SYSTEM_PROMPT = 'System Prompt: You are an evaluator of skill performance. Score each example from 0.0 to 1.0 and assign a level based on benchmarks. Return JSON only. Please output json in format of {"skill_id": <skill_id>, "results": [{"log_id": "<log_id_1>", "score": 1.0, "level": "L3", **extra},{"log_id": "<log_id_2>", "score": 1.0, "level": "L3", **extra}]}';
const BENCHMARK_TOP_K = 3;

function benchmarkKey(obj: any): string {
    if (!obj || typeof obj !== 'object') return '';
    const domains = Object.keys(obj);
    if (domains.length === 0) return '';
    const domain = domains[0];
    const companies = obj[domain] && typeof obj[domain] === 'object' ? Object.keys(obj[domain]) : [];
    const company = companies[0] || '';
    return [domain, company].filter(Boolean).join('_').toLowerCase();
}

function normalizeBenchmarks(skillId: string, raw: any): any[] {
    const base: any[] = !raw ? [] : Array.isArray(raw) ? raw : typeof raw === 'object' ? [raw] : [];
    const skill = (skillId || '').toLowerCase();
    const scored = base.map((item, idx) => {
        const key = benchmarkKey(item);
        let score = 0;
        if (key && skill.includes(key)) {
            score += 2;
        } else {
            const parts = key.split(/[_\\-\\s\\/]+/).filter(Boolean);
            for (const part of parts) {
                if (part && skill.includes(part)) {
                    score += 1;
                }
            }
        }
        return { item, score, idx };
    });
    scored.sort((a, b) => b.score - a.score || a.idx - b.idx);
    return scored.slice(0, BENCHMARK_TOP_K).map((s) => s.item);
}

async function handleSkillsRatePrepare(options: { skill_id?: string; prompt?: string; benchmark?: string; logDir?: string }) {
    const skillId = options.skill_id;
    if (!skillId) {
        console.error('\n❌ Error: --skill_id is required.');
        process.exit(1);
    }
    const logDir = getLogDir(options.logDir);
    const logs = loadLogs(logDir).filter((l) => l.skill_id === skillId);
    if (logs.length === 0) {
        console.error(`\n❌ Error: No logs found for skill '${skillId}' in ${logDir}.`);
        process.exit(1);
    }

    var userInputPrompt = `User prompt: ${(options.prompt || "")}`;
    var mergeInstruction = DEFAULT_EVAL_SYSTEM_PROMPT + "\n" + userInputPrompt;

    const levelsData = loadLevelDescriptions(options.benchmark);
    const benchmarks = normalizeBenchmarks(skillId, levelsData).slice(0, BENCHMARK_TOP_K);
    const payload = {
        skill_id: skillId,
        benchmarks,
        logs: logs.map(({ log_id, input, output }) => ({ log_id, input, output })),
        instructions: mergeInstruction
    };
    console.log(JSON.stringify(payload, null, 2));
}

async function handleSkillsRateApply(options: { skill_id?: string; result?: string; logDir?: string }) {
  const skillId = options.skill_id;
  if (!skillId) {
    console.error('\n❌ Error: --skill_id is required.');
    process.exit(1);
  }
  if (!options.result) {
    console.error('\n❌ Error: --result <json or base64> is required.');
    process.exit(1);
  }

  let parsed: any;
  try {
    let raw = options.result;

    // Attempt base64 decode if JSON parsing fails
    try {
      parsed = JSON.parse(raw);
    } catch {
      // try decode base64
      raw = Buffer.from(raw, 'base64').toString('utf8');
      parsed = JSON.parse(raw);
    }
  } catch (e: any) {
    console.error(`\n❌ Error: invalid JSON/base64 for --result: ${e.message}`);
    process.exit(1);
  }

  const results: any[] = Array.isArray(parsed?.results) ? parsed.results : [];
  if (results.length === 0) {
    console.error('\n❌ Error: --result must contain a non-empty "results" array.');
    process.exit(1);
  }

  const logDir = getLogDir(options.logDir);
  const logs = loadLogs(logDir).filter(l => l.skill_id === skillId);
  const byId = new Map(logs.map(l => [l.log_id, l]));

  let updated = 0;
  const missing: string[] = [];

  for (const item of results) {
    const id = item?.log_id;
    if (!id || !byId.has(id)) {
      missing.push(String(id || 'unknown'));
      continue;
    }
    const entry = byId.get(id) as SkillLogEntry;

    // Support both 'score' and 'rating'
    if (item.rating !== undefined) entry.rating = Number(item.rating);
    if (item.score !== undefined) entry.rating = Number(item.score);

    if (item.level !== undefined) entry.level = String(item.level);

    // Optional rationale
    if (item.rationale !== undefined) entry.rationale = String(item.rationale);

    const target = path.join(logDir, `${entry.log_id}.json`);
    fs.writeFileSync(target, JSON.stringify(entry, null, 2), 'utf8');
    updated += 1;
  }

  console.log(JSON.stringify({ status: 'success', updated, missing }, null, 2));
}

async function handleSkillsRateApplyBak(options: { skill_id?: string; result?: string; logDir?: string }) {
    const skillId = options.skill_id;
    if (!skillId) {
        console.error('\n❌ Error: --skill_id is required.');
        process.exit(1);
    }
    if (!options.result) {
        console.error('\n❌ Error: --result <json> is required.');
        process.exit(1);
    }
    let parsed: any;
    try {
        parsed = JSON.parse(options.result);
    } catch (e: any) {
        console.error(`\n❌ Error: invalid JSON for --result: ${e.message}`);
        process.exit(1);
    }
    const results: any[] = Array.isArray(parsed?.results) ? parsed.results : [];
    if (results.length === 0) {
        console.error('\n❌ Error: --result must contain a non-empty "results" array.');
        process.exit(1);
    }

    const logDir = getLogDir(options.logDir);
    const logs = loadLogs(logDir).filter((l) => l.skill_id === skillId);
    const byId = new Map(logs.map((l) => [l.log_id, l]));

    let updated = 0;
    const missing: string[] = [];
    for (const item of results) {
        const id = item?.log_id;
        if (!id || !byId.has(id)) {
            missing.push(String(id || 'unknown'));
            continue;
        }
        const entry = byId.get(id) as SkillLogEntry;
        if (item.rating !== undefined) {
            entry.rating = Number(item.rating);
        }
        if (item.level !== undefined) {
            entry.level = String(item.level);
        }
        const target = path.join(logDir, `${entry.log_id}.json`);
        fs.writeFileSync(target, JSON.stringify(entry, null, 2), 'utf8');
        updated += 1;
    }

    console.log(JSON.stringify({ status: 'success', updated, missing }, null, 2));
}

const ANSI_REGEX = /\x1b\[[0-9;]*m/g;
const green = (text: string) => `\x1b[32m${text}\x1b[0m`;

function stripAnsi(text: string): string {
    return text.replace(ANSI_REGEX, '');
}

function shortenPath(p: string): string {
    const cwd = process.cwd();
    const home = os.homedir();
    const relCwd = path.relative(cwd, p) || '.';
    if (!relCwd.startsWith('..')) return relCwd;
    const relHome = path.relative(home, p);
    if (!relHome.startsWith('..')) return path.join('~', relHome);
    return relCwd;
}

function formatTable(headers: string[], rows: string[][]): string {
    const colWidths = headers.map((h, idx) =>
        Math.max(stripAnsi(h).length, ...rows.map((row) => stripAnsi(row[idx] ?? '').length))
    );

    const pad = (value: string, width: number) => value + ' '.repeat(Math.max(0, width - stripAnsi(value).length));

    const headerLine = headers.map((h, i) => pad(h, colWidths[i])).join('  ');
    const divider = colWidths.map((w) => '-'.repeat(w)).join('  ');
    const body = rows.map((row) => row.map((v, i) => pad(v, colWidths[i])).join('  '));

    return [headerLine, divider, ...body].join('\n');
}

function formatLevelSummary(levelCounts: Map<string, number>): string {
    if (levelCounts.size === 0) return '-';
    const entries = Array.from(levelCounts.entries()).sort((a, b) => {
        if (b[1] !== a[1]) return b[1] - a[1];
        return a[0].localeCompare(b[0]);
    });
    const total = entries.reduce((sum, [, count]) => sum + count, 0) || 1;
    if (entries.length === 1) {
        return entries[0][0];
    }
    return entries
        .map(([level, count]) => `${level}(${Math.round((count / total) * 100)}%)`)
        .join(', ');
}

type SkillStats = { run_times: number; ratingSum: number; ratingCount: number; levels: Map<string, number> };

function buildSkillStats(logs: SkillLogEntry[]): Map<string, SkillStats> {
    const stats = new Map<string, SkillStats>();

    for (const log of logs) {
        const key = log.skill_id;
        if (!key) continue;
        if (!stats.has(key)) {
            stats.set(key, { run_times: 0, ratingSum: 0, ratingCount: 0, levels: new Map() });
        }
        const entry = stats.get(key)!;
        entry.run_times += 1;
        if (typeof log.rating === 'number' && !Number.isNaN(log.rating)) {
            entry.ratingSum += Number(log.rating);
            entry.ratingCount += 1;
        }
        if (log.level) {
            entry.levels.set(log.level, (entry.levels.get(log.level) || 0) + 1);
        }
    }

    return stats;
}

async function handleSkillsRateShow(options: { skill_id?: string; logDir?: string }) {
    const logDir = getLogDir(options.logDir);
    const logs = loadLogs(logDir).filter((l) => !options.skill_id || l.skill_id === options.skill_id);

    if (logs.length === 0) {
        const target = options.skill_id ? ` for skill '${options.skill_id}'` : '';
        console.error(`\n❌ Error: No logs found${target} in ${logDir}.`);
        process.exit(1);
    }

    const stats = buildSkillStats(logs);

    const rows = Array.from(stats.entries())
        .map(([skill_id, info]) => {
            const avg = info.ratingCount > 0 ? (info.ratingSum / info.ratingCount).toFixed(2) : '-';
            const levelSummary = formatLevelSummary(info.levels);
            return [
                skill_id,
                String(info.run_times),
                avg === '-' ? '-' : green(avg),
                levelSummary === '-' ? '-' : green(levelSummary)
            ];
        })
        .sort((a, b) => a[0].localeCompare(b[0]));

    console.log(formatTable(['skill_id', 'run_times', 'score', 'level'], rows));
}

// --- Hints Utilities ---

type HintItem = {
    cli: string;
    hint?: string;
};

type HintsConfig = Record<string, { hints: HintItem[] }>;

type TrieNode = {
    children: Map<string, TrieNode>;
    terminalValues: Set<string>;
};

type PersistedTrieNode = {
    children?: Record<string, PersistedTrieNode>;
    terminalValues?: string[];
};

function levenshteinDistance(a: string, b: string): number {
    const m = a.length;
    const n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp: number[] = new Array(n + 1);
    for (let j = 0; j <= n; j++) {
        dp[j] = j;
    }
    for (let i = 1; i <= m; i++) {
        let prev = dp[0];
        dp[0] = i;
        for (let j = 1; j <= n; j++) {
            const temp = dp[j];
            if (a[i - 1] === b[j - 1]) {
                dp[j] = prev;
            } else {
                dp[j] = Math.min(prev + 1, dp[j] + 1, dp[j - 1] + 1);
            }
            prev = temp;
        }
    }
    return dp[n];
}

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((token) => token.trim())
        .filter(Boolean);
}

function isPlaceholder(token: string): boolean {
    return (token.startsWith('<') && token.endsWith('>')) || (token.startsWith('[') && token.endsWith(']'));
}

function isOptionalPlaceholder(token: string): boolean {
    return token.startsWith('[') && token.endsWith(']');
}

function hintMatchesCommand(hintCli: string, commandArgs: string[]): boolean {
    const hintTokens = hintCli.trim().split(/\s+/).filter(Boolean);
    const cmdTokens = commandArgs;
    let i = 0;
    let j = 0;
    while (i < hintTokens.length && j < cmdTokens.length) {
        const hintToken = hintTokens[i];
        const cmdToken = cmdTokens[j];
        if (isPlaceholder(hintToken)) {
            if (isOptionalPlaceholder(hintToken)) {
                // Optional placeholder: consume if token exists, else skip
                i += 1;
                if (cmdToken) {
                    j += 1;
                }
            } else {
                // Required placeholder: must consume one token
                i += 1;
                j += 1;
            }
            continue;
        }
        if (hintToken !== cmdToken) {
            return false;
        }
        i += 1;
        j += 1;
    }

    // Consume remaining optional placeholders
    while (i < hintTokens.length && isOptionalPlaceholder(hintTokens[i])) {
        i += 1;
    }

    return i === hintTokens.length && j === cmdTokens.length;
}

function fuzzyScore(query: string, candidate: string): number {
    const q = query.toLowerCase();
    const c = candidate.toLowerCase();
    if (!q) return 0;
    if (c.includes(q)) {
        return 1.0 - (c.indexOf(q) / Math.max(1, c.length));
    }
    const dist = levenshteinDistance(q, c);
    const maxLen = Math.max(q.length, c.length, 1);
    const editScore = 1 - dist / maxLen;

    const qTokens = tokenize(q);
    const cTokens = tokenize(c);
    const tokenMatches = qTokens.filter((t) => cTokens.includes(t)).length;
    const tokenScore = qTokens.length > 0 ? tokenMatches / qTokens.length : 0;

    return 0.7 * editScore + 0.3 * tokenScore;
}

function createTrie(): TrieNode {
    return { children: new Map(), terminalValues: new Set() };
}

function insertTrie(trie: TrieNode, key: string, value: string) {
    let node = trie;
    const normalized = key.toLowerCase();
    for (const ch of normalized) {
        const next = node.children.get(ch);
        if (next) {
            node = next;
        } else {
            const created = createTrie();
            node.children.set(ch, created);
            node = created;
        }
    }
    node.terminalValues.add(value);
}

function searchTrie(trie: TrieNode, prefix: string, limit: number): string[] {
    let node: TrieNode | undefined = trie;
    const normalized = prefix.toLowerCase();
    for (const ch of normalized) {
        node = node.children.get(ch);
        if (!node) {
            return [];
        }
    }
    const out: string[] = [];
    const seen = new Set<string>();

    const dfs = (current: TrieNode) => {
        if (out.length >= limit) return;
        const terminal = Array.from(current.terminalValues).sort((a, b) => a.localeCompare(b));
        for (const value of terminal) {
            if (out.length >= limit) return;
            if (seen.has(value)) continue;
            seen.add(value);
            out.push(value);
        }
        const keys = Array.from(current.children.keys()).sort((a, b) => a.localeCompare(b));
        for (const key of keys) {
            if (out.length >= limit) return;
            dfs(current.children.get(key)!);
        }
    };

    dfs(node);
    return out;
}

function trieToPersisted(node: TrieNode): PersistedTrieNode {
    const children: Record<string, PersistedTrieNode> = {};
    for (const [key, child] of node.children.entries()) {
        children[key] = trieToPersisted(child);
    }
    return {
        children: Object.keys(children).length ? children : undefined,
        terminalValues: node.terminalValues.size ? Array.from(node.terminalValues).sort((a, b) => a.localeCompare(b)) : undefined
    };
}

function persistedToTrie(node: PersistedTrieNode): TrieNode {
    const trie = createTrie();
    if (Array.isArray(node.terminalValues)) {
        for (const value of node.terminalValues) {
            if (typeof value === 'string' && value.trim()) {
                trie.terminalValues.add(value);
            }
        }
    }
    if (node.children && typeof node.children === 'object') {
        for (const [key, child] of Object.entries(node.children)) {
            if (!child || typeof child !== 'object') continue;
            trie.children.set(key, persistedToTrie(child));
        }
    }
    return trie;
}

function mergeHints(target: HintsConfig, source: HintsConfig): HintsConfig {
    for (const [id, entry] of Object.entries(source)) {
        if (!entry || !Array.isArray(entry.hints)) {
            continue;
        }
        if (!target[id]) {
            target[id] = { hints: [] };
        }
        const existing = target[id].hints;
        for (const hint of entry.hints) {
            if (!hint || typeof hint.cli !== 'string') {
                continue;
            }
            const cli = hint.cli.trim();
            if (!cli) {
                continue;
            }
            const normalizedHint = (hint.hint || '').trim();
            const existingIndex = existing.findIndex((item) => item.cli.trim() === cli);
            if (existingIndex === -1) {
                existing.push({ cli, hint: normalizedHint || undefined });
            } else if (!existing[existingIndex].hint && normalizedHint) {
                existing[existingIndex].hint = normalizedHint;
            }
        }
    }
    return target;
}

function loadHintsFile(filePath: string): HintsConfig {
    if (!fs.existsSync(filePath)) {
        return {};
    }
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
            return parsed as HintsConfig;
        }
    } catch {
        return {};
    }
    return {};
}

function writeHintsFile(filePath: string, hints: HintsConfig) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(hints, null, 2));
}

function writeHintsTrieFile(filePath: string, trie: TrieNode) {
    ensureDir(path.dirname(filePath));
    fs.writeFileSync(filePath, JSON.stringify(trieToPersisted(trie), null, 2), 'utf8');
}

function loadHintsTrieFile(filePath: string): TrieNode | null {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    try {
        const raw = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object') {
            return null;
        }
        return persistedToTrie(parsed as PersistedTrieNode);
    } catch {
        return null;
    }
}

function findBundledHintsDir(): string | null {
    const candidates = [
        path.resolve(CLI_DIR, 'data', 'config', 'hints'),
        path.resolve(CLI_DIR, '..', 'data', 'config', 'hints')
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

function findBundledLevelsDir(): string | null {
    const candidates = [
        path.resolve(CLI_DIR, 'data', 'config', 'levels'),
        path.resolve(CLI_DIR, '..', 'data', 'config', 'levels')
    ];
    for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

async function loadBundledHints(): Promise<HintsConfig> {
    const hintsDir = findBundledHintsDir();
    if (!hintsDir) {
        return {};
    }
    const basePath = path.join(hintsDir, 'base_hints.json');
    const contribDir = path.join(hintsDir, 'contrib');
    const merged: HintsConfig = {};

    if (fs.existsSync(basePath)) {
        mergeHints(merged, loadHintsFile(basePath));
    }
    if (fs.existsSync(contribDir)) {
        const entries = fs.readdirSync(contribDir, { withFileTypes: true });
        for (const entry of entries) {
            if (!entry.isFile() || !entry.name.endsWith('.json')) {
                continue;
            }
            const filePath = path.join(contribDir, entry.name);
            mergeHints(merged, loadHintsFile(filePath));
        }
    }
    return merged;
}

function getHintsPath(useGlobal: boolean): string {
    const baseDir = useGlobal ? AGTM_GLOBAL_DIR : AGTM_LOCAL_DIR;
    return path.join(baseDir, 'hints', 'hints.json');
}

function getHintsTriePath(useGlobal: boolean): string {
    const baseDir = useGlobal ? AGTM_GLOBAL_DIR : AGTM_LOCAL_DIR;
    return path.join(baseDir, 'hints', 'hints_trie.json');
}

function getOldHintsPath(useGlobal: boolean): string {
    if (useGlobal) {
        return path.join(AGTM_GLOBAL_DIR, 'hints.json');
    }
    return path.join(AGTM_LOCAL_DIR, 'hints.json');
}

function getLegacyHintsPath(useGlobal: boolean): string {
    if (useGlobal) {
        return path.join(os.homedir(), '.agent', 'hints.json');
    }
    return path.join(process.cwd(), '.agent', 'hints.json');
}

/*True: useGlobal, load from Hints path in package, userGlobal False, use the cache folder .agents/hints.json*/
function loadCombinedHints(useGlobal: boolean): HintsConfig {
    const combined: HintsConfig = {};
    const globalHints = loadHintsFile(getHintsPath(true));
    const localHints = loadHintsFile(getHintsPath(false));
    mergeHints(combined, globalHints);
    mergeHints(combined, localHints);
    mergeHints(combined, loadHintsFile(getOldHintsPath(true)));
    mergeHints(combined, loadHintsFile(getOldHintsPath(false)));
    mergeHints(combined, loadHintsFile(getLegacyHintsPath(true)));
    mergeHints(combined, loadHintsFile(getLegacyHintsPath(false)));
    if (useGlobal) {
        return globalHints;
    }
    return combined;
}

function buildIdTrie(hints: HintsConfig): TrieNode {
    const trie = createTrie();
    for (const id of Object.keys(hints)) {
        insertTrie(trie, id, id);
    }
    return trie;
}

function buildCliTrie(hints: HintItem[]): TrieNode {
    const trie = createTrie();
    for (const item of hints) {
        if (item.cli) {
            insertTrie(trie, item.cli, item.cli);
        }
    }
    return trie;
}

function filterCliHints(hints: HintItem[], query: string, limit: number): HintItem[] {
    if (!hints || hints.length === 0) {
        return [];
    }
    const trimmed = query.trim().toLowerCase();
    if (trimmed) {
        const scored = hints
            .map((item) => ({ item, score: fuzzyScore(trimmed, item.cli) }))
            .filter((entry) => entry.score > 0);
        scored.sort((a, b) => b.score - a.score || a.item.cli.localeCompare(b.item.cli));
        return scored.slice(0, limit).map((entry) => entry.item);
    }
    const sorted = [...hints].sort((a, b) => a.cli.localeCompare(b.cli));
    return sorted.slice(0, limit);
}

function highlightMatches(text: string, query: string): string {
    const trimmed = query.trim();
    if (!trimmed) return text;
    const tokens = trimmed
        .toLowerCase()
        .split(/[^a-z0-9]+/g)
        .map((t) => t.trim())
        .filter(Boolean);
    if (tokens.length === 0) return text;

    const lower = text.toLowerCase();
    const ranges: Array<[number, number]> = [];
    for (const token of tokens) {
        let idx = lower.indexOf(token);
        while (idx !== -1) {
            ranges.push([idx, idx + token.length]);
            idx = lower.indexOf(token, idx + 1);
        }
    }
    if (ranges.length === 0) return text;
    ranges.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const merged: Array<[number, number]> = [];
    for (const [start, end] of ranges) {
        const last = merged[merged.length - 1];
        if (!last || start > last[1]) {
            merged.push([start, end]);
        } else {
            last[1] = Math.max(last[1], end);
        }
    }

    let out = '';
    let cursor = 0;
    for (const [start, end] of merged) {
        out += text.slice(cursor, start);
        out += green(text.slice(start, end));
        cursor = end;
    }
    out += text.slice(cursor);
    return out;
}

async function promptSelection(prompt: string, options: string[]): Promise<string | null> {
    if (!process.stdin.isTTY) {
        return options.length > 0 ? options[0] : null;
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answerRaw = await rl.question(prompt);
        const answer = answerRaw.trim();
        if (answer === '') {
            return options.length > 0 ? options[0] : null;
        }
        if (/^\d+$/.test(answer)) {
            const index = Number(answer) - 1;
            if (index >= 0 && index < options.length) {
                return options[index];
            }
        }
        return answer;
    } finally {
        rl.close();
    }
}

async function promptCommandLineBase(promptText: string): Promise<string | null> {
    if (!process.stdin.isTTY) {
        return null;
    }
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    try {
        const answerRaw = await rl.question(promptText);
        const answer = answerRaw.trim();
        return answer || null;
    } finally {
        rl.close();
    }
}

import readline from 'readline';

async function promptCommandLine(
  promptText: string,
  defaultValue?: string
): Promise<string | null> {
  if (!process.stdin.isTTY) return null;

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    return await new Promise<string | null>((resolve) => {
      rl.question(promptText, (answer) => {
        rl.close();
        const trimmed = answer.trim();
        resolve(trimmed || defaultValue || null);
      });

      // Pre-fill default value and move cursor to end
      if (defaultValue) {
        rl.write(defaultValue);
      }
    });
  } finally {
    // just in case
    rl.close();
  }
}

async function selectSkillId(
    hints: HintsConfig,
    input?: string,
    limit = 5,
    trie?: TrieNode | null
): Promise<string | null> {
    const ids = Object.keys(hints);
    if (ids.length === 0) {
        return null;
    }
    if (input && hints[input]) {
        return input;
    }
    const activeTrie = trie || buildIdTrie(hints);
    const prefix = input || '';
    let suggestions = searchTrie(activeTrie, prefix, limit);
    if (suggestions.length === 0 && prefix) {
        const scored = ids
            .map((id) => ({ id, score: fuzzyScore(prefix, id) }))
            .filter((entry) => entry.score > 0);
        scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
        suggestions = scored.slice(0, limit).map((entry) => entry.id);
    }
    if (suggestions.length === 0) {
        return null;
    }
    let printedLines = 0;
    const trackedLog = (message = '') => {
        console.log(message);
        printedLines += countConsoleLogLines(message);
    };

    trackedLog('');
    trackedLog('Skill ID suggestions:');
    suggestions.forEach((value, index) => {
        trackedLog(`  ${index + 1}. ${highlightMatches(value, prefix)}`);
    });
    const selected = await promptSelection('Select skill id (number or id): ', suggestions);
    printedLines += 1; // prompt line

    if (process.stdin.isTTY && process.stdout.isTTY) {
        clearLastLines(printedLines + 1); // +1 for the post-input newline line
    }

    console.log(`Selected Skill/Cli is ${selected}`);

    if (!selected) {
        return null;
    }

    // console.log(`DEBUG: hints loaded is ${hints}`)

    if (hints[selected]) {
        return selected;
    }
    if (suggestions.includes(selected)) {
        return selected;
    }
    console.log(`WARNING: Id ${selected} is not found`)
    return null;
}

async function selectCliHint(hints: HintItem[], query?: string, limit = 5): Promise<HintItem | null> {
    if (!hints || hints.length === 0) {
        return null;
    }
    const suggestions = filterCliHints(hints, query || '', limit);
    if (suggestions.length === 0) {
        return null;
    }
    let printedLines = 0;
    const trackedLog = (message = '') => {
        console.log(message);
        printedLines += countConsoleLogLines(message);
    };

    trackedLog('');
    trackedLog('Command hints:');
    suggestions.forEach((item, index) => {
        const hintText = item.hint ? ` # ${item.hint}` : '';
        trackedLog(`  ${index + 1}. ${highlightMatches(item.cli, query || '')}${hintText}`);
    });
    const options = suggestions.map((item) => item.cli);
    const selected = await promptSelection('Select command (number or input custom): ', options);
    printedLines += 1; // prompt line
    if (process.stdin.isTTY && process.stdout.isTTY) {
        clearLastLines(printedLines + 1); // +1 for the post-input newline line
    }
    if (!selected) {
        return null;
    }
    const match = suggestions.find((item) => item.cli === selected);
    if (match) {
        return match;
    }
    return { cli: selected };
}


/* '.agent/hints.json' local folder  */
async function handleSetup(options: { hint?: boolean; levels?: boolean; global?: boolean }) {
    const useGlobal = Boolean(options.global);

    if (!options.hint && !options['levels']) {
        console.error("\n❌ Error: 'setup' command supports --hint and/or --levels.");
        process.exit(1);
    }

    if (options.hint) {
        const bundled = await loadBundledHints();
        const targetPath = getHintsPath(useGlobal);
        const targetTriePath = getHintsTriePath(useGlobal);
        const legacyPath = getLegacyHintsPath(useGlobal);
        const existing = loadHintsFile(targetPath);
        const existingOld = loadHintsFile(getOldHintsPath(useGlobal));
        const merged: HintsConfig = {};
        mergeHints(merged, bundled);
        mergeHints(merged, existingOld);
        mergeHints(merged, existing);
        writeHintsFile(targetPath, merged);
        const trieSource = loadCombinedHints(useGlobal);
        writeHintsTrieFile(targetTriePath, buildIdTrie(trieSource));
        if (fs.existsSync(path.dirname(legacyPath))) {
            writeHintsFile(legacyPath, merged);
        }
        console.log(`\n✅ Hints cache updated at ${targetPath}`);
        console.log(`✅ Hints trie updated at ${targetTriePath}`);
    }

    if (options['levels']) {
        const bundledLevelsDir = findBundledLevelsDir();
        if (!bundledLevelsDir) {
            console.error('\n❌ Error: No bundled levels directory found.');
            process.exit(1);
        }
        const targetDir = useGlobal ? SKILL_LEVELS_DIR_GLOBAL : SKILL_LEVELS_DIR_LOCAL;
        ensureDir(targetDir);
        fs.cpSync(bundledLevelsDir, targetDir, { recursive: true });
        console.log(`\n✅ Levels copied to ${targetDir}`);
    }
}

function clearScreen() {
  // process.stdout.write('\x1Bc');
  process.stdout.write('\x1b[0f');
}

function clearLastLines(n: number) {
    if (!process.stdout.isTTY) return;
    for (let i = 0; i < n; i++) {
        process.stdout.write('\x1b[2K'); // clear current line
        if (i < n - 1) {
            process.stdout.write('\x1b[1A'); // move cursor up
        }
    }
    process.stdout.write('\x1b[0G'); // move to start of line
}

function countConsoleLogLines(message: string): number {
    if (message === '') return 1;
    return message.split('\n').length;
}


async function handleRun(
    idArg?: string,
    commandArgs: string[] = [],
    options: { print?: boolean; dryRun?: boolean; mode?: string ; autoSetup?: boolean} = {}
) {
    const isAgent = (options.mode || 'human').toLowerCase() === MODE_AGENT;
    // first load local hints
    // 1. Install Local and Global Cache
    let hints = loadCombinedHints(false);
    let hasHints = Object.keys(hints).length > 0;
    const shouldAutoSetup = options.autoSetup ?? true;
    let runtimeHints = null;

    // 2. If no Cache is found, copy global base_hint.json, convert to local /.agents/hints.json
    if (!hasHints) {
        if (shouldAutoSetup) {
            console.log("No hints data found. Please complete the first setup.");
            await handleSetup({ hint: true, global: false });
            hints = loadCombinedHints(false);
            hasHints = Object.keys(hints).length > 0;
        } else {
            console.error('\nError: No hints data found. Please complete the first setup');
            console.error('👉 Run `agtm setup --hint` first.');
            process.exit(1);
        }
    }

    if (isAgent) {
        if (!hasHints) {
            runtimeHints = await loadBundledHints();
        }
        const activeHints = hasHints ? hints : (runtimeHints || {});
        const cachedIdTrie = hasHints ? loadHintsTrieFile(getHintsTriePath(false)) : null;
        const ids = Object.keys(activeHints);
        if (ids.length === 0) {
            console.error('\n❌ Error: No hints available.');
            process.exit(1);
        }

        if (!idArg || !activeHints[idArg]) {
            const query = idArg || '';
            const trie = cachedIdTrie || buildIdTrie(activeHints);
            let suggestions = searchTrie(trie, query, 2);
            if (suggestions.length === 0 && query) {
                const scored = ids
                    .map((id) => ({ id, score: fuzzyScore(query, id) }))
                    .filter((entry) => entry.score > 0);
                scored.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
                suggestions = scored.slice(0, 2).map((entry) => entry.id);
            }
            console.log('\nSkill ID suggestions:');
            suggestions.forEach((value, index) => {
                console.log(`  ${index + 1}. ${highlightMatches(value, query)}`);
                const entry = activeHints[value];
                if (entry?.hints?.length) {
                    const preview = entry.hints.slice(0, 2).map((h) => `${h.cli}${h.hint ? ` # ${h.hint}` : ''}`);
                    preview.forEach((line) => console.log(`     - ${line}`));
                }
            });
            process.exit(1);
        }

        let finalCommandArgs = commandArgs;
        if (finalCommandArgs.length > 0 && activeHints[finalCommandArgs[0]]) {
            idArg = finalCommandArgs[0];
            finalCommandArgs = finalCommandArgs.slice(1);
        }
        if (finalCommandArgs.length > 0 && finalCommandArgs[0] === idArg) {
            finalCommandArgs = finalCommandArgs.slice(1);
        }

        const hintEntry = activeHints[idArg];
        if (!finalCommandArgs || finalCommandArgs.length === 0) {
            console.log('\nCommand hints:');
            hintEntry?.hints?.slice(0, 5).forEach((item, index) => {
                const hintText = item.hint ? ` # ${item.hint}` : '';
                console.log(`  ${index + 1}. ${item.cli}${hintText}`);
            });
            process.exit(1);
        }

        if (hintEntry?.hints?.length) {
            const exact = hintEntry.hints.some((h) => hintMatchesCommand(h.cli, finalCommandArgs));
            if (!exact) {
                const suggestions = filterCliHints(hintEntry.hints, finalCommandArgs.join(' ').trim(), 5);
                console.log('\nCommand hints:');
                suggestions.forEach((item, index) => {
                    const hintText = item.hint ? ` # ${item.hint}` : '';
                    console.log(`  ${index + 1}. ${item.cli}${hintText}`);
                });
                process.exit(1);
            }
        }

        const [command, ...args] = finalCommandArgs;
        const printable = `agtm run ${idArg} ${finalCommandArgs.join(' ')}`.trim();
        console.log(`\u001b[32m${printable}\u001b[0m`);
        if (options.print || options.dryRun) {
            return;
        }
        const child = spawn(command, args, { stdio: 'inherit' });
        child.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'ENOENT') {
                console.error(`\n❌ Error: Command not found: ${command}`);
                process.exit(1);
            }
            console.error(`\n❌ Error: Failed to run command '${command}': ${err.message}`);
            process.exit(1);
        });
        child.on('exit', (code) => {
            if (code && code !== 0) {
                process.exit(code);
            }
        });
    } else {
        if (LOG_ENABLE) {
            console.log(`DEBUG: Entering Human Mode | idArg ${idArg} | commandArgs ${commandArgs} | options ${options} | hasHints ${hasHints} | hints ${hints}`);
        }
        const cachedIdTrie = hasHints ? loadHintsTrieFile(getHintsTriePath(false)) : null;
        // human mode with pause for cli input
        if (!idArg) {
            if (!hasHints) {
                console.error('\n❌ Error: No hints cache found. Run `agtm setup --hint` first.');
                process.exit(1);
            }
            const selected = await selectSkillId(hints, undefined, 5, cachedIdTrie);
            if (!selected) {
                console.error('\n❌ Error: No skill id selected.');
                process.exit(1);
            }
            idArg = selected;

            // clearScreen();
        } else if (hasHints && !hints[idArg]) {
            const selected = await selectSkillId(hints, idArg, 5, cachedIdTrie);
            if (selected) {
                idArg = selected;
            }
            // clearScreen();
        }

        let finalCommandArgs = commandArgs;
        if (hasHints && idArg && finalCommandArgs.length > 0 && hints[finalCommandArgs[0]]) {
            idArg = finalCommandArgs[0];
            finalCommandArgs = finalCommandArgs.slice(1);
        }

        if (hasHints && idArg && finalCommandArgs.length > 0 && finalCommandArgs[0] === idArg) {
            finalCommandArgs = finalCommandArgs.slice(1);
        }

        if (!hasHints) {
            runtimeHints = await loadBundledHints();
        }
        let hintEntry = hasHints ? hints[idArg] : undefined;
        if (!hintEntry && runtimeHints) {
            hintEntry = runtimeHints[idArg];
        }

        if (LOG_ENABLE) {
            console.log(`DEBUG: Entering Human Mode | finalCommandArgs ${finalCommandArgs} | hintEntry ${hintEntry}`);
        }

        if (!finalCommandArgs || finalCommandArgs.length === 0) {
            let chosen: HintItem | null = null;
            if (hintEntry?.hints && hintEntry.hints.length > 0) {
                const query = await promptCommandLine(`\nEnter command to run (leave empty to list cli hints): `, ``);
                const searchQuery = query || '';
                chosen = await selectCliHint(hintEntry.hints, searchQuery);
            }
            if (chosen && chosen.cli) {
                finalCommandArgs = chosen.cli.split(/\s+/).filter(Boolean);
            } else {
                const manual = await promptCommandLine('\nEnter command line to run: ', ``);
                if (!manual) {
                    console.error('\n❌ Error: No command selected.');
                    process.exit(1);
                }
                finalCommandArgs = manual.split(/\s+/).filter(Boolean);
            }
        } else if (hintEntry?.hints && hintEntry.hints.length > 0 && finalCommandArgs.length <= 1) {
            const query = finalCommandArgs.join(' ').trim();
            const chosen = await selectCliHint(hintEntry.hints, query);
            if (chosen && chosen.cli) {
                finalCommandArgs = chosen.cli.split(/\s+/).filter(Boolean);
            }
        }

        if (!finalCommandArgs || finalCommandArgs.length === 0) {
            console.error('\n❌ Error: Missing command to run.');
            process.exit(1);
        }

        const finalCommandLine = finalCommandArgs.join(' ');
        console.log("\nComplete the Cli with your arguments or leave blank and press Enter");
        const edited = await promptCommandLine(`\nFinal command line [${finalCommandLine}]:\n`, `${finalCommandLine}`);
        if (edited && edited.trim()) {
            finalCommandArgs = edited.split(/\s+/).filter(Boolean);
        }

        const [command, ...args] = finalCommandArgs;
        const printable = `agtm run ${idArg} ${finalCommandArgs.join(' ')}`.trim();
        console.log(`\u001b[32m${printable}\u001b[0m`);
        if (options.print || options.dryRun) {
            return;
        }
        const child = spawn(command, args, { stdio: 'inherit' });
        child.on('error', (err: NodeJS.ErrnoException) => {
            if (err.code === 'ENOENT') {
                console.error(`\n❌ Error: Command not found: ${command}`);
                process.exit(1);
            }
            console.error(`\n❌ Error: Failed to run command '${command}': ${err.message}`);
            process.exit(1);
        });
        child.on('exit', (code) => {
            if (code && code !== 0) {
                process.exit(code);
            }
        });
    }
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

// 3. SKILLS Command
const skillsCommand = program.command('skills')
    .description('Manage skills: add, list, rate, log.');

skillsCommand.command('add')
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
    .action((source: string, options: Record<string, any>) => handleSkillsAdd({ ...options, source }));

skillsCommand.command('list')
    .description('List installed skills for detected or specified agents, showing name, description, path, and folder.')
    .option('-a, --agent <agent>', 'Target specific agents (repeatable). Use "*" for all agents.', (value: string, prev: string[]) => {
        const list = prev || [];
        list.push(value);
        return list;
    }, [])
    .option('-g, --global', 'Read from global agent directories instead of project paths.')
    .option('-d, --log-dir <path>', 'Override log storage directory (default ./.agtm/skills/log)')
    .action((options: Record<string, any>) => handleSkillsList(options));

skillsCommand.command('log')
    .description('Append a raw skill execution log entry.')
    .argument('<skill>', 'Skill name or id')
    .option('--data <json>', 'Log payload JSON (log_id optional, includes input/output/meta)')
    .option('-d, --log-dir <path>', 'Override log storage directory (default ./.agtm/skills/log)')
    .action((skill: string, options: Record<string, any>) => handleSkillsLog(skill, options));

const rateCommand = skillsCommand.command('rate')
    .description('Prepare or apply external LLM evaluations for skill logs.');

rateCommand.command('prepare')
    .requiredOption('--skill_id <skill_id>', 'Skill id to evaluate')
    .option('--prompt <text>', 'Custom evaluation instruction')
    .option('--benchmark <path>', 'Benchmark levels JSON file')
    .option('-d, --log-dir <path>', 'Override log storage directory (default ./.agtm/skills/log)')
    .action((options: Record<string, any>) => handleSkillsRatePrepare(options));

rateCommand.command('apply')
    .requiredOption('--skill_id <skill_id>', 'Skill id to update')
    .requiredOption('--result <json>', 'LLM evaluation results JSON')
    .option('-d, --log-dir <path>', 'Override log storage directory (default ./.agtm/skills/log)')
    .action((options: Record<string, any>) => handleSkillsRateApply(options));

rateCommand.command('show')
    .description('Show aggregated run counts and ratings for skills based on logs.')
    .option('--skill_id <skill_id>', 'Filter by skill id')
    .option('-d, --log-dir <path>', 'Override log storage directory (default ./.agtm/skills/log)')
    .action((options: Record<string, any>) => handleSkillsRateShow(options));

skillsCommand.command('rank')
    .description('Alias for rate prepare (generate evaluation payload).')
    .requiredOption('--skill_id <skill_id>', 'Skill id to evaluate')
    .option('--prompt <text>', 'Custom evaluation instruction')
    .option('--benchmark <path>', 'Benchmark levels JSON file')
    .option('-d, --log-dir <path>', 'Override log storage directory (default ./.agtm/skills/log)')
    .action((options: Record<string, any>) => handleSkillsRatePrepare(options));

// 4. SETUP Command (Hints)
program.command('setup')
    .description('Setup local caches such as CLI hints.')
    .option('--hint', 'Build CLI hint cache from bundled hints.')
    .option('--levels', 'Copy bundled benchmark level files.')
    .option('-g, --global', 'Write hints to global cache location.')
    .action((options: { hint?: boolean; levels?: boolean; global?: boolean }) => handleSetup(options));

// 5. RUN Command (Interactive hinting)
program.command('run')
    .description('Run a command for a skill id with interactive hints.')
    .argument('[id]', 'Skill id (owner/repo) or partial match')
    .argument('[command...]', 'Command to run or query to match hints')
    .option('--mode <mode>', 'Run mode: human | agent', 'human')
    .option('--print', 'Print the final command without executing.')
    .option('--dry-run', 'Alias for --print.')
    .option('--auto-setup', 'Automatically run setup if no cache found')
    .action((id: string | undefined, command: string[], options: { print?: boolean; dryRun?: boolean; mode?: string; autoSetup ?: boolean }) =>
        handleRun(id, command, options)
    );

program.parse(process.argv);
