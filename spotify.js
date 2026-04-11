// spotify.js — Frontend Spotify module
// All requests go through /api/spotify (Vercel serverless) to avoid CORS.

const SpotifyAPI = (() => {
    const BASE = '/api/spotify';

    return {
        /** Artist object — followers, popularity, monthly_listeners, images */
        getArtist: () =>
            fetch(`${BASE}?action=artist`).then(r => {
                if (!r.ok) throw new Error(`Spotify artist: ${r.status}`);
                return r.json();
            }),

        /** Top 10 tracks for a given ISO market code (default: US) */
        getTopTracks: (market = 'US') =>
            fetch(`${BASE}?action=top-tracks&market=${market}`).then(r => {
                if (!r.ok) throw new Error(`Spotify top-tracks: ${r.status}`);
                return r.json();
            }),
    };
})();
