// รันโดย GitHub Actions ทุก 5 นาที: ส่ง push เมื่อมีงานใหม่ + เตือนงานค้างทุกชั่วโมง (08:00-20:00 เวลาไทย)
const admin = require('firebase-admin');
admin.initializeApp({
  credential: admin.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)),
  databaseURL: 'https://harune-eb66f-default-rtdb.asia-southeast1.firebasedatabase.app'
});
const db = admin.database(), fcm = admin.messaging();
const BASE = 'https://karune21.github.io/Work/';
const val = async p => (await db.ref(p).get()).val();

async function send(items) { // items: [{uid, token, title, body}]
  if (!items.length) return;
  const res = await fcm.sendEach(items.map(i => ({
    token: i.token,
    notification: { title: i.title, body: i.body },
    webpush: { fcmOptions: { link: BASE + 'submit.html' }, notification: { icon: BASE + 'icon.png' } }
  })));
  const dead = {};
  res.responses.forEach((r, k) => {
    if (!r.success) {
      const c = r.error && r.error.code;
      console.log('fail', items[k].uid, c);
      if (c === 'messaging/registration-token-not-registered' || c === 'messaging/invalid-registration-token') dead['fcmTokens/' + items[k].uid] = null;
    }
  });
  if (Object.keys(dead).length) await db.ref().update(dead);
  console.log('sent', res.successCount, 'failed', res.failureCount);
}

(async () => {
  const [as, toks, st, subs] = await Promise.all([val('assignments'), val('fcmTokens'), val('pushState'), val('submissions')]);
  const A = as || {}, T = toks || {}, ST = st || {}, SUB = subs || {};
  const tokens = Object.entries(T).filter(([, v]) => v && v.token).map(([uid, v]) => ({ uid, token: v.token, sid: v.sid }));
  const up = {};

  // 1) งานใหม่
  const notified = ST.notified || {};
  const fresh = Object.keys(A).filter(i => !notified[i]);
  if (!ST.init) {            // รันครั้งแรก: แค่จำงานเดิม ไม่ส่งซ้ำ
    fresh.forEach(i => up['pushState/notified/' + i] = true);
    up['pushState/init'] = true;
  } else if (fresh.length) {
    const titles = fresh.map(i => (A[i].subject ? A[i].subject + ' · ' : '') + A[i].title);
    await send(tokens.map(t => ({ ...t, title: '🆕 มีงานใหม่', body: titles.join('\n') })));
    fresh.forEach(i => up['pushState/notified/' + i] = true);
  }

  // 2) เตือนงานค้างทุกชั่วโมง 08:00-20:00 (เวลาไทย)
  const th = new Date(Date.now() + 7 * 3600e3);
  const h = th.getUTCHours(), key = th.toISOString().slice(0, 10) + 'T' + h;
  if (h >= 8 && h <= 20 && ST.lastHour !== key) {
    up['pushState/lastHour'] = key;
    const items = [];
    for (const t of tokens) {
      const pend = Object.keys(A).filter(i => !(SUB[i] && SUB[i][t.sid] === true));
      if (!pend.length) continue;
      const names = pend.map(i => A[i].title).slice(0, 3).join(', ') + (pend.length > 3 ? ' ...' : '');
      items.push({ ...t, title: `⏰ ${h}:00 น. ยังมีงานค้าง ${pend.length} งาน`, body: names });
    }
    await send(items);
  }
  if (Object.keys(up).length) await db.ref().update(up);
})().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
