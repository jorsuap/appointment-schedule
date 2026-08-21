-- AlterTable
ALTER TABLE "patients" ADD COLUMN "createdByProfessionalId" TEXT;

-- AddForeignKey
ALTER TABLE "patients" ADD CONSTRAINT "patients_createdByProfessionalId_fkey" FOREIGN KEY ("createdByProfessionalId") REFERENCES "professionals"("id") ON DELETE SET NULL ON UPDATE CASCADE;
