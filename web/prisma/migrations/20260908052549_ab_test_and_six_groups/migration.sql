-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "abVariant" VARCHAR(1);

-- CreateTable
CREATE TABLE "ab_stats" (
    "id" SERIAL NOT NULL,
    "variant" VARCHAR(1) NOT NULL,
    "day" DATE NOT NULL,
    "sessions" INTEGER NOT NULL DEFAULT 0,
    "catalog" INTEGER NOT NULL DEFAULT 0,
    "cart" INTEGER NOT NULL DEFAULT 0,
    "search" INTEGER NOT NULL DEFAULT 0,
    "leads" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ab_stats_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ab_stats_variant_day_key" ON "ab_stats"("variant", "day");
