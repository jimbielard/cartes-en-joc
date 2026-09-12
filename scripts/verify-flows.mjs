// Run against the local production server: node scripts/verify-flows.mjs
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
nextEnv.loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
const base = 'http://localhost:3000';
const ids = [];
async function fixture() {
  const tag = randomUUID();
  const user = await prisma.user.create({ data: { name: 'Verification', email: `verify-${tag}@example.invalid` } });
  ids.push(user.id);
  await prisma.session.create({ data: { sessionToken: tag, userId: user.id, expires: new Date(Date.now() + 600000) } });
  return { user, cookie: `authjs.session-token=${tag}` };
}
async function call(path, cookie, method = 'GET', body) {
  return fetch(base + path, { method, headers: { cookie: cookie ?? '', 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) });
}
(async () => {
  const a = await fixture();
  const b = await fixture();
  assert.equal((await call('/api/profile', null, 'PATCH', {})).status, 401);
  assert.equal((await call('/api/profile', a.cookie, 'PATCH', { name: '', alias: '', bio: '' })).status, 400);
  assert.equal((await call('/api/profile', a.cookie, 'PATCH', { name: 'Nom editat', alias: 'Alias', bio: 'Biografia', id: b.user.id, email: 'changed@example.invalid' })).status, 200);
  const updated = await prisma.user.findUnique({ where: { id: a.user.id } });
  assert.equal(updated.name, 'Nom editat');
  assert.equal(updated.email, a.user.email);
  assert.equal((await prisma.user.findUnique({ where: { id: b.user.id } })).name, 'Verification');
  const created = await call('/api/sessions', a.cookie, 'POST', { name: 'Verification session', categories: [{ key: 'servei', visible: false }] });
  assert.equal(created.status, 200);
  const { code } = await created.json();
  const restaurantName = `Verification restaurant ${randomUUID()}`;
  const voted = await call('/api/votes', a.cookie, 'POST', { code, restaurantName, rating: 10, categoryScores: { espai: 0, menjar: 8, servei: 10 } });
  assert.equal(voted.status, 200);
  assert.equal((await voted.json()).vote.rating, 4);
  assert.equal((await call('/api/votes', a.cookie, 'POST', { code, restaurantName, rating: 10, categoryScores: {} })).status, 400);
  const results = await (await call(`/api/sessions/${code}`, a.cookie)).json();
  assert.equal(results.votes[0].rating, 4);
  const home = await (await call('/', b.cookie)).text();
  assert.ok(home.includes(restaurantName), 'Community vote is visible to another user');
  assert.ok(!home.includes('Estil C actiu'));
  assert.ok(!home.includes('JDC-ABCD'));
  assert.ok(home.includes('name="q"'));
  const own = await (await call('/profile', a.cookie)).text();
  const other = await (await call('/profile', b.cookie)).text();
  assert.ok(own.includes(restaurantName));
  assert.ok(!other.includes(restaurantName), 'Personal history stays private');
  const search = await (await call('/restaurants?q=Barcelona', a.cookie)).text();
  assert.ok(search.includes('Barcelona'));
  assert.ok(search.includes('Crear sessió'));
  console.log('PASS: profile validation, ownership, persistence, community feed, personal history, search and category averages.');
})().catch(err => { console.error(err.message); process.exitCode = 1; }).finally(async () => {
  // Only delete the disposable accounts created by this exact test run.
  for (const id of ids) await prisma.user.delete({ where: { id } });
  await prisma.$disconnect();
});
