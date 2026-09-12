CREATE TABLE "Restaurant" (
  "id" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "area" TEXT NOT NULL,
  "cuisine" TEXT NOT NULL,
  "identityKey" TEXT NOT NULL,
  "searchText" TEXT NOT NULL,
  "createdById" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Restaurant_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "Restaurant_identityKey_key" ON "Restaurant"("identityKey");
ALTER TABLE "Restaurant" ADD CONSTRAINT "Restaurant_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
