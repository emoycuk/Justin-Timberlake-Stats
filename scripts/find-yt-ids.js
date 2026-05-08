#!/usr/bin/env node
const KEY = "AIzaSyC_iOX3x46Jik-qHnYqKK5na-cJnvEaoh4";
const REF = { headers: { 'Referer': 'https://justin-timberlake-stats.vercel.app/' } };

const queries = [
    'Justin Timberlake TKO Official Video',
    'Justin Timberlake Take Back the Night Official Video',
    'Justin Timberlake Drink You Away Official Video',
    'Justin Timberlake Not a Bad Thing Official Video',
    'Justin Timberlake My Love Official Video Timbaland',
];

(async () => {
    for (const q of queries) {
        const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&maxResults=3&q=${encodeURIComponent(q)}&key=${KEY}`;
        const res = await fetch(url, REF);
        const data = await res.json();
        if (data.error) { console.error(data.error); continue; }
        console.log(`\n>>> ${q}`);
        for (const item of data.items || []) {
            console.log(`  ${item.id.videoId}  [${item.snippet.channelTitle}]  ${item.snippet.title}`);
        }
    }
})();
