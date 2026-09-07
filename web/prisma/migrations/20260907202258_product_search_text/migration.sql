-- AlterTable
ALTER TABLE "products" ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '';

-- CreateIndex
CREATE INDEX "products_searchText_idx" ON "products"("searchText");
