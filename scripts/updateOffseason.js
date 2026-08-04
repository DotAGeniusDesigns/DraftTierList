/*
 * Refreshes src/utils/offseasonNews.js from ESPN's public NFL news and
 * transactions feeds. Hand-curated offseason summaries live in
 * src/utils/offseasonData.js and are not overwritten by this script.
 *
 * Run: npm run offseason   (or node scripts/updateOffseason.js)
 *       node scripts/updateOffseason.js [--dry-run] [--verbose]
 *
 * Requires Node 18+ (global fetch). If your shell defaults to an older Node,
 * use nvm:  source ~/.nvm/nvm.sh && npm run offseason
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.join(__dirname, '..');
const TEAM_FILE = path.join(ROOT, 'src', 'utils', 'teamData.js');
const OUT_FILE = path.join(ROOT, 'src', 'utils', 'offseasonNews.js');
const TEAMS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams?limit=32';
const NEWS_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/news';
const TXN_URL = 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/transactions';
const FETCH_TIMEOUT_MS = 45000;
const NEWS_LIMIT = 8;
const TXN_LIMIT = 5;
const CONCURRENCY = 6;

const args = new Set(process.argv.slice(2));
const DRY_RUN = args.has('--dry-run');
const VERBOSE = args.has('--verbose');

// ESPN abbreviations that differ from the board's.
const ESPN_TO_BOARD = { WSH: 'WAS', JAC: 'JAX' };
const boardAbbr = (espnAbbr) => ESPN_TO_BOARD[espnAbbr] || espnAbbr;

function loadModule(file) {
    if (!fs.existsSync(file)) return null;
    const source = fs.readFileSync(file, 'utf8');
    const names = [...source.matchAll(/^export const (\w+)/gm)].map((m) => m[1]);
    const script = source.replace(/^export /gm, '') + `\nmodule.exports = { ${names.join(', ')} };`;
    const sandbox = { module: { exports: {} } };
    sandbox.exports = sandbox.module.exports;
    vm.runInNewContext(script, sandbox, { filename: file });
    return sandbox.module.exports;
}

async function fetchJson(url) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
        const res = await fetch(url, {
            signal: controller.signal,
            headers: { accept: 'application/json', 'user-agent': 'DraftList/offseason-sync' },
        });
        if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
        return await res.json();
    } finally {
        clearTimeout(timer);
    }
}

function briefly(text, max = 180) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    if (clean.length <= max) return clean;
    const cut = clean.slice(0, max);
    const stop = Math.max(cut.lastIndexOf('. '), cut.lastIndexOf('; '));
    return (stop > max * 0.45 ? cut.slice(0, stop + 1) : cut.trimEnd() + '…');
}

// League-wide camp roundups show up on every team's feed — drop them unless
// the headline names this team.
function isTeamRelevant(headline, teamName, nickname) {
    const h = headline.toLowerCase();
    if (/^2026 nfl training camp:/i.test(headline)) return false;
    if (/for all 32 teams/i.test(headline)) return false;
    if (/each depth chart/i.test(headline)) return false;
    const tokens = [
        teamName.toLowerCase(),
        nickname.toLowerCase(),
        ...teamName.toLowerCase().split(/\s+/),
    ].filter((t) => t.length > 3);
    return tokens.some((t) => h.includes(t));
}

function parseArticle(article) {
    const links = article.links || {};
    const web = links.web || links.mobile || {};
    return {
        id: String(article.id || article.nowId || ''),
        headline: String(article.headline || '').trim(),
        summary: briefly(article.description || ''),
        date: article.published || article.lastModified || '',
        url: web.href || '',
    };
}

function parseTransaction(txn) {
    return {
        date: txn.date || '',
        description: String(txn.description || '').trim(),
    };
}

async function mapPool(items, fn, limit) {
    const results = new Array(items.length);
    let next = 0;
    async function worker() {
        while (next < items.length) {
            const i = next++;
            results[i] = await fn(items[i], i);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
    return results;
}

async function fetchTeamBundle(espnTeam, boardTeam) {
    const id = espnTeam.id;
    const [newsFeed, txnFeed] = await Promise.all([
        fetchJson(`${NEWS_URL}?team=${id}&limit=${NEWS_LIMIT}`),
        fetchJson(`${TXN_URL}?team=${id}`),
    ]);

    const nickname = espnTeam.name || '';
    const articles = (newsFeed.articles || [])
        .map(parseArticle)
        .filter((a) => a.headline && isTeamRelevant(a.headline, boardTeam.name, nickname))
        .slice(0, 4);

    const transactions = (txnFeed.transactions || [])
        .map(parseTransaction)
        .filter((t) => t.description)
        .slice(0, TXN_LIMIT);

    return { abbr: boardAbbr(espnTeam.abbreviation), articles, transactions };
}

function serialize(feed, fetchedAt) {
    const abbrs = Object.keys(feed).sort();
    const blocks = abbrs.map((abbr) => {
        const { news, transactions } = feed[abbr];
        const newsLines = news.map((n) => `            ${JSON.stringify(n)},`).join('\n');
        const txnLines = transactions.map((t) => `            ${JSON.stringify(t)},`).join('\n');
        return `    ${JSON.stringify(abbr)}: {
        news: [
${newsLines || '            // none'}
        ],
        transactions: [
${txnLines || '            // none'}
        ],
    },`;
    }).join('\n');

    return `// Auto-generated by scripts/updateOffseason.js — do not edit by hand.
// Source: ESPN public NFL news + transactions feeds, read ${fetchedAt}.
// Refresh with: npm run offseason
//
// Hand-curated coaching/moves/key points live in offseasonData.js.
// This file carries live headlines and roster transactions only.

export const OFFSEASON_NEWS_UPDATED_AT = ${JSON.stringify(fetchedAt)};

export const offseasonNews = {
${blocks}
};

export const getOffseasonNews = (abbr) => offseasonNews[abbr] || { news: [], transactions: [] };
`;
}

function stableKey(feed) {
    return JSON.stringify(feed);
}

function diff(before, after) {
    const changed = [];
    for (const abbr of Object.keys(after).sort()) {
        const prev = before[abbr] || { news: [], transactions: [] };
        const next = after[abbr];
        const prevNews = (prev.news || []).map((n) => n.id).join('|');
        const nextNews = (next.news || []).map((n) => n.id).join('|');
        const prevTxn = (prev.transactions || []).map((t) => t.description).join('|');
        const nextTxn = (next.transactions || []).map((t) => t.description).join('|');
        if (prevNews !== nextNews || prevTxn !== nextTxn) {
            changed.push(abbr);
        }
    }
    return changed;
}

async function main() {
    if (typeof fetch !== 'function') {
        console.error('Node 18+ is required (global fetch missing). Try: source ~/.nvm/nvm.sh && npm run offseason');
        process.exit(1);
    }

    const teamMod = loadModule(TEAM_FILE);
    if (!teamMod || !teamMod.teamData) throw new Error(`Could not read teams from ${TEAM_FILE}`);

    const started = Date.now();
    let teamsPayload;
    try {
        teamsPayload = await fetchJson(TEAMS_URL);
    } catch (err) {
        console.error(`Could not reach ESPN teams feed: ${err.message}`);
        process.exit(1);
    }

    const espnTeams = (teamsPayload.sports[0].leagues[0].teams || []).map((t) => t.team);
    if (espnTeams.length === 0) throw new Error('ESPN returned no teams');

    if (VERBOSE) console.log(`Fetching news + transactions for ${espnTeams.length} teams…`);

    const bundles = await mapPool(
        espnTeams,
        async (espnTeam) => {
            const abbr = boardAbbr(espnTeam.abbreviation);
            const boardTeam = teamMod.teamData[abbr];
            if (!boardTeam) {
                if (VERBOSE) console.log(`  skip unknown board team ${espnTeam.abbreviation}`);
                return null;
            }
            try {
                const bundle = await fetchTeamBundle(espnTeam, boardTeam);
                if (VERBOSE) {
                    console.log(`  ${abbr}: ${bundle.articles.length} headlines, ${bundle.transactions.length} txns`);
                }
                return bundle;
            } catch (err) {
                console.warn(`  ${abbr}: fetch failed — ${err.message}`);
                return { abbr, articles: [], transactions: [] };
            }
        },
        CONCURRENCY,
    );

    const feed = {};
    let headlineCount = 0;
    let txnCount = 0;
    for (const bundle of bundles) {
        if (!bundle) continue;
        feed[bundle.abbr] = {
            news: bundle.articles,
            transactions: bundle.transactions,
        };
        headlineCount += bundle.articles.length;
        txnCount += bundle.transactions.length;
    }

    const fetchedAt = new Date().toISOString();
    const previousMod = loadModule(OUT_FILE);
    const previous = (previousMod && previousMod.offseasonNews) || {};
    const changedTeams = diff(previous, feed);
    const elapsed = ((Date.now() - started) / 1000).toFixed(1);

    console.log(
        `Fetched ${headlineCount} headlines and ${txnCount} transactions across ${Object.keys(feed).length} teams in ${elapsed}s.`
    );

    if (changedTeams.length === 0 && fs.existsSync(OUT_FILE)) {
        console.log('No change since the last run — nothing written.');
        return;
    }

    if (changedTeams.length) {
        console.log(`Updated: ${changedTeams.join(', ')}`);
    } else {
        console.log('Creating offseasonNews.js for the first time.');
    }

    if (DRY_RUN) {
        console.log(`\nDry run — ${OUT_FILE} not written.`);
        return;
    }

    fs.writeFileSync(OUT_FILE, serialize(feed, fetchedAt));
    console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}.`);
}

main().catch((err) => {
    console.error(err.message);
    process.exit(1);
});
