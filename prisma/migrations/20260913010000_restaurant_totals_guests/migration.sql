ALTER TABLE "Restaurant" ADD COLUMN "googlePlaceId" TEXT;
CREATE UNIQUE INDEX "Restaurant_googlePlaceId_key" ON "Restaurant"("googlePlaceId");
ALTER TABLE "RestaurantSession" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "RestaurantSession" ADD CONSTRAINT "RestaurantSession_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Participant" ADD COLUMN "voterKey" TEXT;
UPDATE "Participant" SET "voterKey" = 'user:' || "userId" WHERE "userId" IS NOT NULL;
CREATE UNIQUE INDEX "Participant_sessionId_voterKey_key" ON "Participant"("sessionId", "voterKey");
ALTER TABLE "Vote" ALTER COLUMN "sessionId" DROP NOT NULL;
ALTER TABLE "Vote" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Vote" ADD COLUMN "restaurantId" TEXT;
ALTER TABLE "Vote" ADD COLUMN "voterKey" TEXT;
ALTER TABLE "Vote" ADD COLUMN "contextKey" TEXT NOT NULL DEFAULT 'direct';
UPDATE "Vote" SET "voterKey" = 'user:' || "userId", "contextKey" = COALESCE("sessionId", 'direct');
ALTER TABLE "Vote" ALTER COLUMN "voterKey" SET NOT NULL;
ALTER TABLE "Vote" ADD CONSTRAINT "Vote_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Vote_restaurantId_voterKey_contextKey_key" ON "Vote"("restaurantId", "voterKey", "contextKey");
CREATE INDEX "Vote_restaurantId_idx" ON "Vote"("restaurantId");

-- Keep writes from the previous deployment valid during rollout.
CREATE FUNCTION cej_fill_voter_key() RETURNS trigger AS $$
BEGIN
  IF NEW."voterKey" IS NULL AND NEW."userId" IS NOT NULL THEN
    NEW."voterKey" := 'user:' || NEW."userId";
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER cej_vote_voter BEFORE INSERT ON "Vote" FOR EACH ROW EXECUTE FUNCTION cej_fill_voter_key();
CREATE TRIGGER cej_participant_voter BEFORE INSERT ON "Participant" FOR EACH ROW EXECUTE FUNCTION cej_fill_voter_key();
