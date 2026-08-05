-- AlterTable
ALTER TABLE "app_users" ADD COLUMN     "passcode_hash" VARCHAR(255),
ALTER COLUMN "firebase_uid" DROP NOT NULL;
