export type ParsedHintItem = { cli: string; hint: string };

export function parseCliHintItemsFromHelp(helpText: string, options: { binName?: string } = {}): ParsedHintItem[] {
    const binName = (options.binName || '').trim();
    const normalizedText = String(helpText || '');
    if (!normalizedText.trim()) return [];

    const fromCommands = parseCommandsSection(normalizedText, binName);
    if (fromCommands.length > 0) {
        return dedupePreserveOrder(fromCommands);
    }

    const fromUsage = parseUsageSection(normalizedText);
    if (fromUsage.length > 0) {
        return dedupePreserveOrder(fromUsage);
    }

    return [];
}

export function parseCliHintsFromHelp(helpText: string, options: { binName?: string } = {}): string[] {
    return parseCliHintItemsFromHelp(helpText, options).map((item) => item.cli);
}

function parseCommandsSection(helpText: string, binName: string): ParsedHintItem[] {
    const lines = helpText.split(/\r?\n/);
    const commandsIndex = lines.findIndex((l) => {
        const trimmed = (l ?? '').trim().toLowerCase();
        return trimmed === 'commands:' || trimmed === 'available commands:';
    });
    if (commandsIndex === -1) return [];

    const commands: ParsedHintItem[] = [];
    for (let i = commandsIndex + 1; i < lines.length; i++) {
        const rawLine = lines[i] ?? '';
        const trimmed = rawLine.trim();
        if (!trimmed) continue;

        // Stop at next section header like "Options:" / "Flags:" / "Examples:".
        if (/^[A-Z][A-Za-z0-9 _-]*:$/.test(trimmed)) {
            break;
        }

        const splitMatch = trimmed.match(/^(.+?)(?:\s{2,}|\t)(.+)$/);
        let cmd = (splitMatch?.[1] ?? trimmed).trim();
        const hint = (splitMatch?.[2] ?? '').trim();

        // Cobra-style CLIs sometimes prefix subcommands with "+" to denote non-leaf or "recommended" commands.
        // Example: "+create" -> "create".
        cmd = cmd.replace(/^\++/, '').trim();

        if (binName) {
            if (cmd === binName || cmd.startsWith(`${binName} `)) {
                // ok
            } else {
                cmd = `${binName} ${cmd}`.trim();
            }
        }

        commands.push({ cli: normalizeSpaces(cmd), hint: normalizeSpaces(hint) });
    }

    // Many CLIs show subcommands but omit the bare command; keep it for hinting.
    if (binName) {
        commands.unshift({ cli: binName, hint: '' });
    }

    return commands.filter((item) => Boolean(item.cli));
}

function parseUsageSection(helpText: string): ParsedHintItem[] {
    const lines = helpText.split(/\r?\n/);
    const usageIndex = lines.findIndex((l) => /^usage:/i.test(l.trim()));
    if (usageIndex === -1) return [];

    const usageLine = (lines[usageIndex] ?? '').trim();
    const afterColon = usageLine.replace(/^usage:\s*/i, '').trim();

    const commands: ParsedHintItem[] = [];
    if (afterColon) {
        commands.push({ cli: normalizeSpaces(afterColon), hint: '' });
    }

    // Also support multi-line "Usage:" blocks where "Usage:" is a standalone header.
    if (usageLine.toLowerCase() === 'usage:') {
        for (let i = usageIndex + 1; i < lines.length; i++) {
            const rawLine = lines[i] ?? '';
            const trimmed = rawLine.trim();
            if (!trimmed) continue;

            // Stop at the next section header like "Flags:" / "Options:" / "Examples:".
            if (/^[A-Z][A-Za-z0-9 _-]*:$/.test(trimmed)) {
                break;
            }

            if (/^[a-zA-Z0-9@._-]+\b/.test(trimmed)) {
                const firstToken = trimmed.split(/\s+/)[0];
                if (commands.length === 0) {
                    commands.push({ cli: normalizeSpaces(trimmed), hint: '' });
                    continue;
                }
                const previousFirstToken = commands[commands.length - 1].cli.split(/\s+/)[0];
                if (firstToken === previousFirstToken) {
                    commands.push({ cli: normalizeSpaces(trimmed), hint: '' });
                    continue;
                }
            }

            if (/^\s/.test(rawLine) && commands.length > 0) {
                commands[commands.length - 1] = {
                    cli: normalizeSpaces(`${commands[commands.length - 1].cli} ${trimmed}`),
                    hint: commands[commands.length - 1].hint
                };
            }
        }
    }

    return commands
        .map((item) => ({ cli: normalizeSpaces(item.cli), hint: normalizeSpaces(item.hint) }))
        .filter((item) => Boolean(item.cli));
}

function normalizeSpaces(value: string): string {
    return String(value || '').replace(/\s+/g, ' ').trim();
}

function dedupePreserveOrder(items: ParsedHintItem[]): ParsedHintItem[] {
    const seen = new Set<string>();
    const out: ParsedHintItem[] = [];
    for (const item of items) {
        const cli = normalizeSpaces(item.cli);
        if (!cli) continue;
        if (seen.has(cli)) continue;
        seen.add(cli);
        out.push({ cli, hint: normalizeSpaces(item.hint) });
    }
    return out;
}
