#!/usr/bin/env node

import { Command } from 'commander';
import axios from 'axios';
import * as fs from 'node:fs';
import * as yaml from 'js-yaml';


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


uploadCommand.hook('preAction', (thisCommand) => {
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
    .option('--count-per-page <count>', 'Count per page of search results returned.', (value) => parseInt(value, 10), 10) // default=10
    .action(handleSearch);

program.parse(process.argv);

