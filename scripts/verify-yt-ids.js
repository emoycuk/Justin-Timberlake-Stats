#!/usr/bin/env node
// Verifies all YouTube video IDs referenced in data.json and data/vault.json.
// Prints: id | viewCount | title | status

const fs = require('fs');
const path = require('path');

const KEY = "AIzaSyC_iOX3x46Jik-qHnYqKK5na-cJnvEaoh4";
const ROOT = path.resolve(__dirname, '..');

const dataJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'data.json'), 'utf8'));
const vaultJson = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/vault.json'), 'utf8'));

const refs = []; // { id, source }

for (const [albumId, album] of Object.entries(dataJson.albums)) {
    const ids = album.streams?.youtubeVideoIds || [];
    ids.forEach(id => refs.push({ id, source: `data.json:albums.${albumId}` }));
}

for (const song of vaultJson.songs || []) {
    const ids = song.youtubeVideoIds || [];
    ids.forEach(id => refs.push({ id, source: `vault.json:songs.${song.id}` }));
}

for (const album of vaultJson.albums || []) {
    const ids = album.streams?.youtubeVideoIds || [];
    ids.forEach(id => refs.push({ id, source: `vault.json:albums.${album.id} (DEAD)` }));
}

const uniqIds = [...new Set(refs.map(r => r.id))];
console.log(`Total references: ${refs.length}, unique IDs: ${uniqIds.length}\n`);

(async () => {
    const results = {};
    for (let i = 0; i < uniqIds.length; i += 50) {
        const batch = uniqIds.slice(i, i + 50);
        const url = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics&id=${batch.join(',')}&key=${KEY}`;
        const res = await fetch(url, { headers: { 'Referer': 'https://justin-timberlake-stats.vercel.app/' } });
        const data = await res.json();
        if (data.error) {
            console.error('API error:', data.error);
            process.exit(1);
        }
        for (const item of data.items) {
            results[item.id] = {
                title: item.snippet.title,
                channel: item.snippet.channelTitle,
                views: parseInt(item.statistics.viewCount || 0),
            };
        }
    }

    const seen = new Set();
    for (const ref of refs) {
        const key = ref.id + '|' + ref.source;
        if (seen.has(key)) continue;
        seen.add(key);
        const r = results[ref.id];
        if (!r) {
            console.log(`❌ ${ref.id}  MISSING/PRIVATE  (${ref.source})`);
        } else {
            const m = (r.views / 1e6).toFixed(0);
            console.log(`${ref.id}  ${m.padStart(5)}M  ${r.title}  [${r.channel}]  (${ref.source})`);
        }
    }

    // Duplicate detection (same ID in multiple sources)
    console.log('\n--- duplicates ---');
    const byId = {};
    for (const r of refs) {
        (byId[r.id] = byId[r.id] || []).push(r.source);
    }
    for (const [id, sources] of Object.entries(byId)) {
        if (sources.length > 1) {
            console.log(`⚠️  ${id}: ${sources.join(' | ')}`);
        }
    }
})();
