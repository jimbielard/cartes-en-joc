ALTER TABLE "RestaurantSession" ADD COLUMN IF NOT EXISTS "categories" JSONB;
ALTER TABLE "Vote" ADD COLUMN IF NOT EXISTS "categoryScores" JSONB;

-- Keep a single membership per authenticated user; named invitations remain distinct.
DELETE FROM "Participant" a USING "Participant" b
WHERE a."sessionId" = b."sessionId" AND a."userId" = b."userId" AND a."id" > b."id";
CREATE UNIQUE INDEX "Participant_sessionId_userId_key" ON "Participant"("sessionId", "userId");
