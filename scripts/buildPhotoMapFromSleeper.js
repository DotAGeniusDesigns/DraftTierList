/*
 * Builds scripts/playerPhotoMap.json from Sleeper's NFL player list.
 * Run: node scripts/buildPhotoMapFromSleeper.js
 */
const fs = require('fs');
const https = require('https');
const path = require('path');

const OUT = path.join(__dirname, 'playerPhotoMap.json');

const SUFFIXES = new Set(['jr', 'sr', 'ii', 'iii', 'iv', 'v']);
function normalizeName(name) {
    return name
        .toLowerCase()
        .replace(/[.'`]/g, '')
        .replace(/-/g, ' ')
        .split(/\s+/)
        .filter((token) => token && !SUFFIXES.has(token))
        .join(' ')
        .trim();
}

function fetchJson(url) {
    return new Promise((resolve, reject) => {
        https
            .get(url, (res) => {
                let data = '';
                res.on('data', (chunk) => { data += chunk; });
                res.on('end', () => {
                    try {
                        resolve(JSON.parse(data));
                    } catch (err) {
                        reject(err);
                    }
                });
            })
            .on('error', reject);
    });
}

function photoFromSleeper(player) {
    if (player.espn_id) {
        return `https://a.espncdn.com/i/headshots/nfl/players/full/${player.espn_id}.png`;
    }
    if (player.player_id) {
        return `https://sleepercdn.com/content/nfl/players/thumb/${player.player_id}.jpg`;
    }
    return null;
}

async function main() {
    const sleeperPlayers = await fetchJson('https://api.sleeper.app/v1/players/nfl');
    const map = {};

    for (const player of Object.values(sleeperPlayers)) {
        if (!player || !player.full_name) continue;
        const photo = photoFromSleeper(player);
        if (!photo) continue;

        const key = normalizeName(player.full_name);
        if (!key || map[key]) continue;
        map[key] = photo;
    }

    fs.writeFileSync(OUT, JSON.stringify(map, null, 2));
    console.log('Photo entries written:', Object.keys(map).length);
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
