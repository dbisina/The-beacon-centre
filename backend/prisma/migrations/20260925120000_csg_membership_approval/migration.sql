-- CSG membership becomes a request a group leader approves, carrying the
-- member's registration details. Additive only: every existing membership is
-- backfilled to APPROVED by the column default, so current members stay members
-- and the build that is still deployed keeps working until the new one ships.
-- New join requests set status = 'PENDING' explicitly in application code.
--
-- Generated with `prisma migrate diff` from the previous schema.

-- CreateEnum
CREATE TYPE "MembershipStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "csg_memberships" ADD COLUMN     "address_area" VARCHAR(255),
ADD COLUMN     "address_street" VARCHAR(255),
ADD COLUMN     "date_of_birth" DATE,
ADD COLUMN     "full_name" VARCHAR(255),
ADD COLUMN     "reviewed_at" TIMESTAMP(3),
ADD COLUMN     "reviewed_by_admin_id" INTEGER,
ADD COLUMN     "status" "MembershipStatus" NOT NULL DEFAULT 'APPROVED';

-- CreateIndex
CREATE INDEX "csg_memberships_csg_id_status_idx" ON "csg_memberships"("csg_id", "status");

-- AddForeignKey
ALTER TABLE "csg_memberships" ADD CONSTRAINT "csg_memberships_reviewed_by_admin_id_fkey" FOREIGN KEY ("reviewed_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;
