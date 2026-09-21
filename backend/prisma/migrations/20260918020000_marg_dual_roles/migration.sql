CREATE TYPE "ServiceCategory" AS ENUM ('HOTEL','ARTISAN','FOOD','TRANSPORT','EXPERIENCE','GUIDE');
ALTER TABLE "Booking" ADD COLUMN "serviceId" TEXT;
CREATE TABLE "Service" ("id" TEXT NOT NULL,"providerId" TEXT NOT NULL,"name" TEXT NOT NULL,"category" "ServiceCategory" NOT NULL,"destination" TEXT NOT NULL,"description" TEXT,"priceMinor" INTEGER NOT NULL,"currency" TEXT NOT NULL DEFAULT 'INR',"capacity" INTEGER NOT NULL DEFAULT 1,"contactPhone" TEXT,"published" BOOLEAN NOT NULL DEFAULT false,"createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,"updatedAt" TIMESTAMP(3) NOT NULL,CONSTRAINT "Service_pkey" PRIMARY KEY ("id"));
CREATE INDEX "Service_providerId_idx" ON "Service"("providerId");
CREATE INDEX "Service_published_category_destination_idx" ON "Service"("published","category","destination");
CREATE INDEX "Booking_serviceId_idx" ON "Booking"("serviceId");
ALTER TABLE "Service" ADD CONSTRAINT "Service_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE SET NULL ON UPDATE CASCADE;
