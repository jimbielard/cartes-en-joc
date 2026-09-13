// Run against the local production server: node scripts/verify-flows.mjs
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'node:crypto';
import assert from 'node:assert/strict';
nextEnv.loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
const base = 'http://localhost:3000';
const ids = [];
const restaurantIds = [];
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
const cookieFrom = response => response.headers.getSetCookie().filter(value => value.startsWith('cej-guest=')).map(value => value.split(';')[0]).join('; ');
async function vote(cookie, body, expected = 200) {
  const response = await call('/api/votes', cookie, 'POST', body);
  const payload = await response.json();
  assert.equal(response.status, expected, JSON.stringify(payload));
  return { response, payload };
}
try {
  const a = await fixture();
  const b = await fixture();
  assert.equal((await call('/api/profile', null, 'PATCH', {})).status, 401);
  assert.equal((await call('/api/profile', a.cookie, 'PATCH', { name: '', alias: '', bio: '' })).status, 400);
  assert.equal((await call('/api/profile', a.cookie, 'PATCH', { name: 'Nom editat', alias: 'Alias', bio: 'Biografia', id: b.user.id, email: 'changed@example.invalid' })).status, 200);
  assert.equal((await prisma.user.findUnique({ where: { id: a.user.id } })).email, a.user.email);
  assert.equal((await prisma.user.findUnique({ where: { id: b.user.id } })).name, 'Verification');
  const name = `Verification ${randomUUID()}`;
  const response = await call('/api/restaurants', a.cookie, 'POST', { name, area: 'Girona, Major 12', cuisine: 'Catalana' });
  assert.equal(response.status, 200);
  const restaurant = (await response.json()).restaurant;
  restaurantIds.push(restaurant.id.slice(6));
  const duplicate = await (await call('/api/restaurants', null, 'POST', { name: name.toUpperCase(), area: 'Girona, Major 12', cuisine: 'Catalana' })).json();
  assert.equal(duplicate.restaurant.id, restaurant.id);
  assert.equal((await call('/api/sessions', a.cookie, 'POST', { name: 'Missing restaurant' })).status, 400);
  const created = await call('/api/sessions', a.cookie, 'POST', { name: 'Verification session', restaurant, categories: [{ key: 'servei', visible: false }] });
  assert.equal(created.status, 200);
  const { code } = await created.json();
  const session = await (await call(`/api/sessions/${code}`)).json();
  assert.equal(session.restaurant.id, restaurant.id);
  assert.equal(session.categories.length, 9);
  assert.ok(session.categories.some(c => c.key === 'lavabos_wc'));
  const joined = await call(`/api/sessions/${code}`, null, 'POST');
  assert.equal(joined.status, 200);
  const guest = cookieFrom(joined);
  assert.ok(guest);
  const first = await vote(a.cookie, { code, restaurant: { name: 'Different restaurant' }, rating: 10, categoryScores: { espai: 0, menjar: 8, lavabos_wc: 10, servei: 10 } });
  assert.equal(first.payload.vote.rating, 6);
  assert.equal(first.payload.restaurant.id, restaurant.id, 'Session pins its restaurant');
  await vote(b.cookie, { code, categoryScores: { menjar: 8, lavabos_wc: 4 } });
  await vote(guest, { code, categoryScores: { espai: 6 } });
  const directGuest = await vote(null, { restaurant, categoryScores: { menjar: 2 } });
  const directCookie = cookieFrom(directGuest.response);
  assert.ok(directCookie);
  await vote(directCookie, { restaurant, categoryScores: { menjar: 2 } });
  await vote(a.cookie, { restaurant, categoryScores: { menjar: 10 } });
  let general = (await (await call(`/api/restaurants/${restaurant.id}`)).json()).restaurant.summary;
  assert.equal(general.totalVotes, 5, 'Direct resubmission updates instead of duplicating');
  assert.equal(general.average, 6);
  await vote(guest, { code, categoryScores: { espai: 10 } });
  general = (await (await call(`/api/restaurants/${restaurant.id}`)).json()).restaurant.summary;
  assert.equal(general.totalVotes, 5);
  assert.equal(general.average, 6.8);
  assert.equal(general.categories.find(c => c.key === 'menjar').average, 7);
  assert.equal(general.categories.find(c => c.key === 'lavabos_wc').average, 7);
  assert.equal(general.categories.find(c => c.key === 'lavabos_wc').votes, 2);
  assert.equal(general.categories.find(c => c.key === 'servei').average, null);
  await vote(guest, { code, categoryScores: { menjar: 11 } }, 400);
  await vote(guest, { code, categoryScores: {} }, 400);
  const publicHome = await (await call('/')).text();
  assert.ok(publicHome.includes(name));
  assert.ok(publicHome.includes('valoracions totals'));
  assert.ok(publicHome.includes('Veure valoracions per categories'));
  assert.ok(!publicHome.includes('Estil C actiu'));
  const own = await (await call('/profile', a.cookie)).text();
  assert.ok(own.includes(name));
  const found = await (await call(`/api/places?query=${encodeURIComponent(name)}`)).json();
  assert.equal(found.restaurants.find(r => r.id === restaurant.id).summary.totalVotes, 5);
  const voteId = first.payload.vote.id;
  assert.equal((await call(`/api/votes/${voteId}`, b.cookie, 'DELETE')).status, 404);
  assert.equal((await call(`/api/votes/${voteId}`, a.cookie, 'DELETE')).status, 200);
  general = (await (await call(`/api/restaurants/${restaurant.id}`)).json()).restaurant.summary;
  assert.equal(general.totalVotes, 4);
  assert.equal(general.average, 7);
  assert.equal((await (await call(`/api/sessions/${code}`)).json()).votes.length, 2);
  console.log('PASS: fixed session restaurant, guest joining/voting, direct votes, global totals, nine categories, validation, idempotency, profile ownership, public search and deletion.');
} catch (err) { console.error(err.message); process.exitCode = 1; }
finally {
  // Delete only fixtures created by this exact run, in foreign-key-safe order.
  for (const id of ids) await prisma.user.delete({ where: { id } });
  for (const id of restaurantIds) {
    await prisma.vote.deleteMany({ where: { restaurantId: id } });
    await prisma.restaurant.delete({ where: { id } });
  }
  await prisma.$disconnect();
}
