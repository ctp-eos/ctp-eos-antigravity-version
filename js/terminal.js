/* ==========================================================================
   CTP-EOS // Retro Cyber Terminal & Interactive Shoutbox Module
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
    const termScreen = document.getElementById('terminalScreen');
    const termInput = document.getElementById('terminalInput');

    if (!termScreen || !termInput) return;

    function appendLine(text, className = '') {
        const line = document.createElement('div');
        line.className = `terminal-line ${className}`;
        line.textContent = text;
        termScreen.appendChild(line);
        termScreen.scrollTop = termScreen.scrollHeight;
    }

    // Initial welcome lines
    appendLine("CTP-EOS CYBER TERMINAL v3.14 [READY]", "term-sys");
    appendLine("Type 'help' for a list of available system commands.", "term-sys");
    appendLine("--------------------------------------------------", "term-sys");

    termInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            const rawCmd = termInput.value.trim();
            termInput.value = '';
            if (!rawCmd) return;

            appendLine(`> ${rawCmd}`, "term-cmd");
            processCommand(rawCmd);
        }
    });

    function processCommand(cmdStr) {
        const parts = cmdStr.split(' ');
        const cmd = parts[0].toLowerCase();
        const arg = parts.slice(1).join(' ').toLowerCase();

        switch (cmd) {
            case 'help':
                appendLine("AVAILABLE COMMANDS:", "term-sys");
                appendLine("  help               - Display this help message");
                appendLine("  stats              - Display ecosystem repo stats");
                appendLine("  repos              - Display category overview");
                appendLine("  search <query>     - Search all 189 repositories");
                appendLine("  theme <name>       - Set theme (nuke-dark, matrix, amber, catppuccin)");
                appendLine("  scanlines          - Toggle retro scanline overlay");
                appendLine("  nuke               - Trigger nuclear quantum burst");
                appendLine("  clear              - Clear terminal screen");
                break;

            case 'stats':
                if (typeof CTP_DATA !== 'undefined') {
                    appendLine(`TOTAL REPOS: ${CTP_DATA.meta.total}`, "term-sys");
                    appendLine(`ORIGINAL PROJECTS: ${CTP_DATA.meta.originals}`, "term-sys");
                    appendLine(`ECOSYSTEM FORKS: ${CTP_DATA.meta.forks}`, "term-sys");
                    appendLine(`COHERENCE INDEX: 98.4% [STABLE]`, "term-sys");
                }
                break;

            case 'repos':
                if (typeof CTP_DATA !== 'undefined') {
                    appendLine("CATEGORY SUMMARY:", "term-sys");
                    for (const [key, cat] of Object.entries(CTP_DATA.categories)) {
                        appendLine(`  ${cat.icon} ${cat.title}: ${cat.repos.length} repos`, "term-sys");
                    }
                }
                break;

            case 'search':
                if (!arg) {
                    appendLine("Error: Please provide a search term (e.g. 'search hyprland' or 'search vst')", "term-err");
                    return;
                }
                if (typeof CTP_DATA !== 'undefined') {
                    const matches = CTP_DATA.allRepos.filter(r => 
                        r.name.toLowerCase().includes(arg) || 
                        r.desc.toLowerCase().includes(arg)
                    );
                    appendLine(`Found ${matches.length} matching repos for '${arg}':`, "term-sys");
                    matches.slice(0, 5).forEach(m => {
                        appendLine(`  - ${m.name} [${m.fork ? 'FORK' : 'ORIGINAL'}]: ${m.desc.substring(0, 45)}...`, "term-sys");
                    });
                    if (matches.length > 5) {
                        appendLine(`  ... and ${matches.length - 5} more. View main matrix grid.`, "term-sys");
                    }
                }
                break;

            case 'theme':
                const validThemes = ['nuke-dark', 'cerulean', 'matrix', 'amber', 'catppuccin'];
                if (validThemes.includes(arg)) {
                    document.documentElement.setAttribute('data-theme', arg);
                    localStorage.setItem('ctp_theme', arg);
                    const themeSelect = document.getElementById('themeSelect');
                    if (themeSelect) themeSelect.value = arg;
                    appendLine(`Theme updated to '${arg}'.`, "term-sys");
                } else {
                    appendLine(`Invalid theme. Choose from: ${validThemes.join(', ')}`, "term-err");
                }
                break;

            case 'scanlines':
                document.body.classList.toggle('scanlines-off');
                appendLine("Scanlines overlay toggled.", "term-sys");
                break;

            case 'clear':
                termScreen.innerHTML = '';
                break;

            case 'nuke':
                appendLine("💥 WARNING: QUANTUM DETONATION INITIATED 💥", "term-err");
                appendLine("  ░▒▓█ C T P - E O S   O N T O E N E R G E T I C S █▓▒░", "term-cmd");
                appendLine("  [100% Consciousness Alignment Achieved]", "term-sys");
                break;

            default:
                appendLine(`Unknown command: '${cmd}'. Type 'help' for commands.`, "term-err");
                break;
        }
    }
});
