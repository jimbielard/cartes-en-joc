// Link historical votes without changing their scores or deleting any records.
import nextEnv from '@next/env';
import { PrismaClient } from '@prisma/client';
import { createHash } from 'node:crypto';
nextEnv.loadEnvConfig(process.cwd());
const prisma = new PrismaClient();
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/\s+/g, ' ');
try {
  let linked = 0;
  for (;;) {
    const votes = await prisma.vote.findMany({ where: { restaurantId: null }, take: 100 });
    if (!votes.length) break;
    for (const vote of votes) {
      const name = vote.restaurantName;
      const area = vote.restaurantArea ?? 'Ubicació no indicada';
      const cuisine = vote.restaurantType ?? 'Restaurant';
      const identityKey = createHash('sha256').update(JSON.stringify([normalize(name), normalize(area)])).digest('hex');
      await prisma.$transaction(async tx => {
        const restaurant = await tx.restaurant.upsert({ where: { identityKey }, update: {}, create: { name, area, cuisine, identityKey, searchText: normalize(`${name} ${area} ${cuisine}`), createdById: vote.userId } });
        await tx.vote.update({ where: { id: vote.id }, data: { restaurantId: restaurant.id, contextKey: vote.sessionId ?? 'direct' } });
      });
      linked++;
    }
  }
  let sessionsLinked = 0;
  for (const session of await prisma.restaurantSession.findMany({ where: { restaurantId: null }, include: { votes: { select: { restaurantId: true } } } })) {
    const ids = [...new Set(session.votes.map(v => v.restaurantId).filter(Boolean))];
    if (ids.length === 1) { await prisma.restaurantSession.update({ where: { id: session.id }, data: { restaurantId: ids[0] } }); sessionsLinked++; }
  }
  console.log(`Linked ${linked} historical votes and ${sessionsLinked} single-restaurant sessions. No scores changed.`);
} finally { await prisma.$disconnect(); }
