// Vercel Serverless Function — Spotify proxy
// Handles CORS, token exchange, monthly listeners scraping, and Web API requests.

const CLIENT_ID     = '7b662fc2913a4597905633ea6a350b42';
const CLIENT_SECRET = '4761ac8b9e4d4e159a430075c998410d';
const ARTIST_ID     = '31TPClRtHm23RisEFWsPIA';

let _cachedToken  = null;
let _tokenExpiry  = 0;

async function getToken() {
    if (_cachedToken && Date.now() < _tokenExpiry) return _cachedToken;
    const creds = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${creds}`,
            'Content-Type':  'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    });
    if (!res.ok) throw new Error(`Token fetch failed: ${res.status}`);
    const data = await res.json();
    _cachedToken = data.access_token;
    _tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return _cachedToken;
}

async function getMonthlyListeners() {
    try {
        const res = await fetch(`https://open.spotify.com/artist/${ARTIST_ID}`, {
            headers: {
                'User-Agent':      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept':          'text/html,application/xhtml+xml',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        });
        const html = await res.text();

        // Method 1: initial-state base64 blob (Spotify SSR)
        const initMatch = html.match(/<script id="initial-state"[^>]*>([A-Za-z0-9+/=]+)<\/script>/);
        if (initMatch) {
            try {
                const decoded = Buffer.from(initMatch[1], 'base64').toString('utf-8');
                const json    = JSON.parse(decoded);
                const items   = json?.entities?.items ?? {};
                const key     = `spotify:artist:${ARTIST_ID}`;
                const ml      = items[key]?.stats?.monthlyListeners;
                if (ml) return ml;
            } catch (_) { /* try next method */ }
        }

        // Method 2: direct JSON field in page
        const m1 = html.match(/"monthlyListeners"\s*:\s*(\d+)/);
        if (m1) return parseInt(m1[1]);

        // Method 3: plain-text pattern
        const m2 = html.match(/([\d,]+)\s*monthly\s*listeners/i);
        if (m2) return parseInt(m2[1].replace(/,/g, ''));

        return null;
    } catch (e) {
        console.error('Monthly listeners scrape failed:', e.message);
        return null;
    }
}

module.exports = async function handler(req, res) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    if (req.method === 'OPTIONS') { res.status(200).end(); return; }

    const { action, market } = req.query;

    try {
        if (action === 'artist') {
            // Cache for 5 minutes on Vercel edge
            res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

            const token = await getToken();
            const [artist, monthlyListeners] = await Promise.all([
                fetch(`https://api.spotify.com/v1/artists/${ARTIST_ID}`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                }).then(r => r.json()),
                getMonthlyListeners()
            ]);

            res.status(200).json({ ...artist, monthly_listeners: monthlyListeners });

        } else if (action === 'top-tracks') {
            const m = (market || 'US').toUpperCase().slice(0, 2);
            res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=300');

            const token = await getToken();
            const data  = await fetch(
                `https://api.spotify.com/v1/artists/${ARTIST_ID}/top-tracks?market=${m}`,
                { headers: { 'Authorization': `Bearer ${token}` } }
            ).then(r => r.json());

            res.status(200).json(data);

        } else {
            res.status(400).json({ error: 'Unknown action. Use: artist | top-tracks' });
        }
    } catch (e) {
        console.error('Spotify proxy error:', e);
        res.status(500).json({ error: e.message });
    }
}
