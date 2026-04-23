/**
 * backfill-extra-track.js
 * ─────────────────────────────────────────────────────────────
 * 12-22 Nisan arası snapshotlara "4 Minutes (feat. Justin Timberlake and Timbaland)"
 * track'ini ekler (Kworb 12 Nisan'da JT credit'ini kaldırdığı için eksikti).
 *
 * Değerler lineer interpolasyon ile üretilir:
 *   April 11 total  = 93,612,028 (son bilinen, JT sayfasında)
 *   April 23 total  = 95,658,988 (Madonna sayfasından)
 *   Günlük ortalama = ~170,580
 *
 * Bu script bir kere çalıştırılır, sonra silinebilir.
 * ─────────────────────────────────────────────────────────────
 */

const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

const TRACK_TITLE = '4 Minutes (feat. Justin Timberlake and Timbaland)';

const BASELINE_TOTAL = 93_612_028;   // 11 Nisan'daki son bilinen total
const FINAL_TOTAL    = 95_658_988;   // 23 Nisan Madonna sayfası
const START_DATE     = '2026-04-12';
const END_DATE       = '2026-04-22'; // 23 Nisan'ı dahil etmiyoruz — onu canlı snapshot yazacak

function dateRange(start, end) {
    const dates = [];
    const cur = new Date(start + 'T00:00:00Z');
    const stop = new Date(end + 'T00:00:00Z');
    while (cur <= stop) {
        dates.push(cur.toISOString().split('T')[0]);
        cur.setUTCDate(cur.getUTCDate() + 1);
    }
    return dates;
}

async function backfill() {
    const dates = dateRange(START_DATE, END_DATE);
    const totalDays = 12; // 11 Nisan → 23 Nisan arası 12 gün
    const totalGrowth = FINAL_TOTAL - BASELINE_TOTAL;
    const avgDaily = Math.round(totalGrowth / totalDays);

    console.log(`Backfill başlıyor: ${dates.length} gün`);
    console.log(`Baseline: ${BASELINE_TOTAL.toLocaleString('en-US')} → Final: ${FINAL_TOTAL.toLocaleString('en-US')}`);
    console.log(`Ortalama daily: ${avgDaily.toLocaleString('en-US')}\n`);

    for (const date of dates) {
        const docRef = db.collection('daily_snapshots').doc(date);
        const snap = await docRef.get();
        if (!snap.exists) {
            console.log(`[${date}] snapshot yok, atlandı`);
            continue;
        }

        const data = snap.data();
        const tracks = data.tracks || {};
        if (tracks[TRACK_TITLE]) {
            console.log(`[${date}] track zaten var, atlandı`);
            continue;
        }

        // daysAfter11: 12 Nisan = 1, 13 Nisan = 2, ..., 22 Nisan = 11
        const daysAfter11 = Math.round((new Date(date + 'T00:00:00Z') - new Date('2026-04-11T00:00:00Z')) / 86400000);
        const interpTotal = BASELINE_TOTAL + (avgDaily * daysAfter11);

        const newTracks = { ...tracks, [TRACK_TITLE]: { total: interpTotal, daily: avgDaily } };

        const albums = data.albums || {};
        const orphan = albums.Orphan || { total: 0, daily: 0 };
        const newOrphan = {
            total: (orphan.total || 0) + interpTotal,
            daily: (orphan.daily || 0) + avgDaily
        };

        const updates = {
            tracks: newTracks,
            [`albums.Orphan`]: newOrphan,
            career_total: (data.career_total || 0) + interpTotal,
            career_daily: (data.career_daily || 0) + avgDaily
        };

        await docRef.update(updates);
        console.log(`[${date}] ✓ eklendi: total=${interpTotal.toLocaleString('en-US')}, daily=${avgDaily.toLocaleString('en-US')}`);
    }

    console.log('\nBackfill tamamlandı.');
}

backfill()
    .then(() => process.exit(0))
    .catch(err => { console.error('HATA:', err.message, err.stack); process.exit(1); });
