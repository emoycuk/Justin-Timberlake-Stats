// album.js — Dynamic album detail page

const MY_API = typeof CONFIG !== 'undefined' ? CONFIG.MY_DYNAMIC_API : '';

const ALBUM_META = {
    "Justified": {
        year: 2002, color: "#5dade2",
        cover: "assets/justified.jpg",
        label: "Jive Records"
    },
    "FutureSex/LoveSounds": {
        year: 2006, color: "#e74c3c",
        cover: "assets/fsls.jpg",
        label: "Jive Records"
    },
    "The 20/20 Experience": {
        year: 2013, color: "#d4a853",
        cover: "assets/the20.jpg",
        label: "RCA Records"
    },
    "Man of the Woods": {
        year: 2018, color: "#e67e22",
        cover: "assets/motw.jpg",
        label: "RCA Records"
    },
    "Everything I Thought It Was": {
        year: 2024, color: "#ca510f",
        cover: "assets/eitiw.jpg",
        label: "RCA Records"
    }
};

// Full song → album map (covers standard + deluxe, Kworb title variants)
const SONG_MAP = {
    // JUSTIFIED (2002)
    "Like I Love You": "Justified",
    "Cry Me a River": "Justified",
    "Rock Your Body": "Justified",
    "Señorita": "Justified",
    "Last Night": "Justified",
    "Take It From Here": "Justified",
    "Still On My Brain": "Justified",
    "(And She Said) Take Me Now": "Justified",
    "Right For Me": "Justified",
    "Nothin' Else": "Justified",
    "Never Again": "Justified",
    "Like I Love You - Basement Jaxx": "Justified",
    "Rock Your Body - Paul Oakenfold": "Justified",
    "Señorita - Radio Edit": "Justified",

    // FUTURESEX/LOVESOUNDS (2006) — standard + deluxe
    "SexyBack (feat. Timbaland)": "FutureSex/LoveSounds",
    "My Love (feat. T.I.)": "FutureSex/LoveSounds",
    "What Goes Around.../...Comes Around": "FutureSex/LoveSounds",
    "What Goes Around...Comes Around": "FutureSex/LoveSounds",
    "Summer Love": "FutureSex/LoveSounds",
    "Until The End Of Time": "FutureSex/LoveSounds",
    "LoveStoned": "FutureSex/LoveSounds",
    "Chop Me Up": "FutureSex/LoveSounds",
    "FutureSex / LoveSound": "FutureSex/LoveSounds",
    "FutureSex/LoveSound": "FutureSex/LoveSounds",
    "Losing My Way": "FutureSex/LoveSounds",
    "Sexy Ladies": "FutureSex/LoveSounds",
    "Boutique In Heaven": "FutureSex/LoveSounds",
    "Damn Girl": "FutureSex/LoveSounds",
    "(Another Song) All Over Again": "FutureSex/LoveSounds",
    "SexyBack - Linus Loves": "FutureSex/LoveSounds",

    // THE 20/20 EXPERIENCE (2013) — Part 1 + Part 2
    "Mirrors": "The 20/20 Experience",
    "Suit & Tie": "The 20/20 Experience",
    "Not a Bad Thing": "The 20/20 Experience",
    "TKO": "The 20/20 Experience",
    "Drink You Away": "The 20/20 Experience",
    "Pusher Love Girl": "The 20/20 Experience",
    "Tunnel Vision": "The 20/20 Experience",
    "Take Back the Night": "The 20/20 Experience",
    "Murder": "The 20/20 Experience",
    "Strawberry Bubblegum": "The 20/20 Experience",
    "Don't Hold the Wall": "The 20/20 Experience",
    "Let the Groove Get In": "The 20/20 Experience",
    "Blue Ocean Floor": "The 20/20 Experience",
    "Amnesia": "The 20/20 Experience",
    "True Blood": "The 20/20 Experience",
    "Only When I Walk Away": "The 20/20 Experience",
    "Cabaret": "The 20/20 Experience",
    "You Got It On": "The 20/20 Experience",
    "Gimme What I Don't Know": "The 20/20 Experience",
    "Dress On": "The 20/20 Experience",
    "That Girl": "The 20/20 Experience",
    "Spaceship Coupe": "The 20/20 Experience",
    "Mirrors - Radio Edit": "The 20/20 Experience",
    "TKO (Black Friday Remix)": "The 20/20 Experience",

    // MAN OF THE WOODS (2018)
    "Say Something": "Man of the Woods",
    "Filthy": "Man of the Woods",
    "Man of the Woods": "Man of the Woods",
    "Supplies": "Man of the Woods",
    "Morning Light": "Man of the Woods",
    "Higher Higher": "Man of the Woods",
    "Midnight Summer Jam": "Man of the Woods",
    "Sauce": "Man of the Woods",
    "Wave": "Man of the Woods",
    "Montana": "Man of the Woods",
    "Flannel": "Man of the Woods",
    "Young Man": "Man of the Woods",
    "Breeze Off the Pond": "Man of the Woods",
    "The Hard Stuff": "Man of the Woods",
    "Hers (interlude)": "Man of the Woods",
    "Livin' Off the Land": "Man of the Woods",

    // EVERYTHING I THOUGHT IT WAS (2024)
    "Memphis": "Everything I Thought It Was",
    "Selfish": "Everything I Thought It Was",
    "No Angels": "Everything I Thought It Was",
    "Drown": "Everything I Thought It Was",
    "F**kin' Up The Disco": "Everything I Thought It Was",
    "Play": "Everything I Thought It Was",
    "Technicolor": "Everything I Thought It Was",
    "Sanctified": "Everything I Thought It Was",
    "Liar": "Everything I Thought It Was",
    "Imagination": "Everything I Thought It Was",
    "What Lovers Do": "Everything I Thought It Was",
    "My Favorite Drug": "Everything I Thought It Was",
    "Flame": "Everything I Thought It Was",
    "Infinity Sex": "Everything I Thought It Was",
    "Love & War": "Everything I Thought It Was",
    "Alone": "Everything I Thought It Was",
    "Conditions": "Everything I Thought It Was",
    "Paradise": "Everything I Thought It Was"
};

// ── Kworb HTML Parser ─────────────────────────────────────────
function parseKworb(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const tracks = [];
    const seen = new Set();

    let rows = doc.querySelectorAll('table.addpos tbody tr');
    if (rows.length === 0) rows = doc.querySelectorAll('table tbody tr');

    rows.forEach(row => {
        const cols = row.querySelectorAll('td');
        if (cols.length >= 3) {
            const title = cols[0].textContent.trim();
            const total = parseInt(cols[1].textContent.replace(/,/g, ''), 10) || 0;
            const daily = parseInt(cols[2].textContent.replace(/,/g, ''), 10) || 0;
            if (title && !seen.has(title)) {
                seen.add(title);
                tracks.push({ title, total, daily });
            }
        }
    });
    return tracks;
}

const MIX_FILTER = /remix|radio edit|\bedit\b|mix\b|reprise|instrumental|version\b|vip|dub|extended|acoustic|live |bootleg/i;

// ── Match track → album ───────────────────────────────────────
function getAlbumTracks(allTracks, albumId) {
    const result = [];
    const usedIndices = new Set();

    allTracks.forEach((track, idx) => {
        if (usedIndices.has(idx)) return;
        if (MIX_FILTER.test(track.title)) return; // remix/edit'leri atla
        const lower = track.title.toLowerCase();
        for (const key of Object.keys(SONG_MAP)) {
            if (lower.includes(key.toLowerCase())) {
                if (SONG_MAP[key] === albumId) {
                    usedIndices.add(idx);
                    result.push(track);
                }
                break;
            }
        }
    });

    return result.sort((a, b) => b.total - a.total);
}

// ── Number formatter ─────────────────────────────────────────
function fmt(n) {
    if (!n || isNaN(n)) return '—';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(2) + 'B';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)         return Math.round(n / 1_000) + 'K';
    return n.toLocaleString('en-US');
}

// ── Render ────────────────────────────────────────────────────
function render(albumId, albumData, tracks) {
    const meta  = ALBUM_META[albumId];
    const color = meta.color;
    const ARTIST_RATIO = 1.65;

    // Apply era color CSS var
    document.documentElement.style.setProperty('--era-color', color);
    document.body.style.background =
        `radial-gradient(ellipse at 50% 0%, ${color}18 0%, #0a0a0a 55%)`;

    // Hero
    document.title = `JT | ${albumId}`;
    document.getElementById('hero-bg').style.backgroundImage = `url('${meta.cover}')`;
    document.getElementById('hero-cover').src = meta.cover;
    document.getElementById('hero-title').textContent = albumId;
    document.getElementById('hero-year').textContent =
        `${meta.year}  ·  ${meta.label}  ·  ${tracks.length} tracks on Spotify`;

    // Stats
    const physEAS  = albumData.physicalSinglesEAS || 0;
    const dlEAS    = albumData.digitalSinglesEAS  || 0;
    const physSales = Math.round(physEAS * 10 / 3);
    const dlSales   = Math.round(dlEAS   * 20 / 3);
    const spotifyStreams = tracks.reduce((s, t) => s + t.total, 0);
    const audioEAS = Math.floor((spotifyStreams * ARTIST_RATIO) / 1166);
    const totalEAS = (albumData.pureSales || 0) + physEAS + dlEAS + audioEAS;

    const stats = [
        { label: 'Pure Sales',        value: fmt(albumData.pureSales), sub: 'album units' },
        { label: 'Physical Singles',  value: fmt(physSales),           sub: `≈ ${fmt(physEAS)} EAS` },
        { label: 'Download Singles',  value: fmt(dlSales),             sub: `≈ ${fmt(dlEAS)} EAS` },
        { label: 'Spotify Streams',   value: fmt(spotifyStreams),       sub: 'career total' },
        { label: 'Audio EAS',         value: fmt(audioEAS),            sub: 'from streams' },
        { label: 'Total EAS',         value: fmt(totalEAS),            sub: 'equivalent album sales' }
    ];

    const statsGrid = document.getElementById('stats-grid');
    statsGrid.innerHTML = stats.map(s => `
        <div class="stat-card">
            <div class="stat-label">${s.label}</div>
            <div class="stat-value">${s.value}</div>
            <div class="stat-sub">${s.sub}</div>
        </div>
    `).join('');

    // Tracks
    const tbody = document.getElementById('track-tbody');
    if (tracks.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="color:rgba(255,255,255,0.3);padding:40px;text-align:center;">No track data available</td></tr>`;
    } else {
        const maxTotal = tracks[0].total;
        tbody.innerHTML = tracks.map((t, i) => `
            <tr>
                <td class="track-rank">${i + 1}</td>
                <td class="track-name">${t.title}</td>
                <td class="track-total">${fmt(t.total)}</td>
                <td class="track-daily">${t.daily > 0 ? '+' + t.daily.toLocaleString('en-US') : '—'}</td>
                <td class="track-bar-cell">
                    <div class="track-bar-bg">
                        <div class="track-bar-fill" style="width:${Math.round((t.total / maxTotal) * 100)}%"></div>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    document.getElementById('track-status').textContent =
        tracks.length > 0
            ? `${tracks.length} tracks · Live Kworb data`
            : 'Track data unavailable';

    document.getElementById('loading').style.display = 'none';
    document.getElementById('album-content').style.display = 'block';
}

// ── Init ──────────────────────────────────────────────────────
async function init() {
    const params  = new URLSearchParams(window.location.search);
    const albumId = params.get('id');

    if (!albumId || !ALBUM_META[albumId]) {
        document.getElementById('loading').textContent = 'Album not found.';
        return;
    }

    try {
        const [dataRes, kworbRes] = await Promise.all([
            fetch('data.json'),
            MY_API ? fetch(MY_API) : Promise.resolve(null)
        ]);

        const data      = await dataRes.json();
        const albumData = data.albums[albumId] || {};

        let tracks = [];
        if (kworbRes && kworbRes.ok) {
            const html = await kworbRes.text();
            const all  = parseKworb(html);
            tracks     = getAlbumTracks(all, albumId);
        }

        render(albumId, albumData, tracks);
    } catch (e) {
        console.error(e);
        document.getElementById('loading').textContent = 'Failed to load data.';
    }
}

document.addEventListener('DOMContentLoaded', init);
