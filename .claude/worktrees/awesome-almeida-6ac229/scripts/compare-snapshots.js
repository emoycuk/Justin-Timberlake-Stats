/**
 * compare-snapshots.js
 * April 11 ve April 12 snapshot'larını karşılaştırır, eksik şarkıyı bulur.
 *
 * Kullanım:
 *   FIREBASE_SERVICE_ACCOUNT='...' node compare-snapshots.js
 */

const admin = require('firebase-admin');

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

async function compare() {
    const [snap11, snap12] = await Promise.all([
        db.collection('daily_snapshots').doc('2026-04-11').get(),
        db.collection('daily_snapshots').doc('2026-04-12').get(),
    ]);

    if (!snap11.exists) { console.error('2026-04-11 snapshot bulunamadı!'); process.exit(1); }
    if (!snap12.exists) { console.error('2026-04-12 snapshot bulunamadı!'); process.exit(1); }

    const tracks11 = snap11.data().tracks || {};
    const tracks12 = snap12.data().tracks || {};

    const songs11 = new Set(Object.keys(tracks11));
    const songs12 = new Set(Object.keys(tracks12));

    const missing = [...songs11].filter(s => !songs12.has(s));
    const added   = [...songs12].filter(s => !songs11.has(s));

    console.log(`\n=== 11 Nisan'da VAR, 12 Nisan'da YOK (silinen) ===`);
    if (missing.length === 0) {
        console.log('  (yok)');
    } else {
        missing.forEach(s => {
            const t = tracks11[s];
            console.log(`  - "${s}"  total: ${t.total.toLocaleString('en-US')}  daily: ${t.daily.toLocaleString('en-US')}`);
        });
    }

    console.log(`\n=== 12 Nisan'da VAR, 11 Nisan'da YOK (yeni eklenen) ===`);
    if (added.length === 0) {
        console.log('  (yok)');
    } else {
        added.forEach(s => {
            const t = tracks12[s];
            console.log(`  + "${s}"  total: ${t.total.toLocaleString('en-US')}  daily: ${t.daily.toLocaleString('en-US')}`);
        });
    }

    console.log(`\n11 Nisan track sayısı: ${songs11.size}`);
    console.log(`12 Nisan track sayısı: ${songs12.size}`);
}

compare()
    .then(() => process.exit(0))
    .catch(err => { console.error('HATA:', err.message); process.exit(1); });
