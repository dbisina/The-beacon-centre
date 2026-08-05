-- CreateEnum
CREATE TYPE "VideoKind" AS ENUM ('SERMON', 'EXCERPT', 'INSPIRATIONAL');

-- CreateEnum
CREATE TYPE "PrayerRequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'HANDLED');

-- CreateEnum
CREATE TYPE "ContactCategory" AS ENUM ('GENERAL', 'CSG', 'PRAYER', 'TECHNICAL', 'OTHER');

-- CreateEnum
CREATE TYPE "ContactMessageStatus" AS ENUM ('NEW', 'HANDLED');

-- CreateEnum
CREATE TYPE "GivingPurpose" AS ENUM ('TITHE', 'OFFERING', 'SEED', 'PROJECT');

-- CreateEnum
CREATE TYPE "GivingTransactionStatus" AS ENUM ('PENDING', 'SUCCESS', 'FAILED', 'ABANDONED');

-- AlterEnum
ALTER TYPE "AdminRole" ADD VALUE 'CSG_ADMIN';

-- AlterTable
ALTER TABLE "admins" ADD COLUMN     "csg_id" INTEGER;

-- AlterTable
ALTER TABLE "video_sermons" ADD COLUMN     "kind" "VideoKind" NOT NULL DEFAULT 'SERMON';

-- CreateTable
CREATE TABLE "app_users" (
    "id" SERIAL NOT NULL,
    "firebase_uid" VARCHAR(128) NOT NULL,
    "email" VARCHAR(255),
    "display_name" VARCHAR(255),
    "photo_url" VARCHAR(500),
    "is_guest_merged" BOOLEAN NOT NULL DEFAULT false,
    "last_seen_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csgs" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "meets_on" VARCHAR(50),
    "meeting_time" VARCHAR(50),
    "address" VARCHAR(500),
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "cover_image_url" VARCHAR(500),
    "cover_image_cloudinary_public_id" VARCHAR(255),
    "member_count" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "csgs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csg_memberships" (
    "id" SERIAL NOT NULL,
    "csg_id" INTEGER NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "left_at" TIMESTAMP(3),
    "last_rsvp_at" TIMESTAMP(3),

    CONSTRAINT "csg_memberships_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "csg_updates" (
    "id" SERIAL NOT NULL,
    "csg_id" INTEGER NOT NULL,
    "author_admin_id" INTEGER,
    "title" VARCHAR(255),
    "body" TEXT NOT NULL,
    "notify_members" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "csg_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "push_tokens" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "app_user_id" INTEGER,
    "platform" VARCHAR(20),
    "csg_id" INTEGER,
    "topics" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_registered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "push_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prayer_requests" (
    "id" SERIAL NOT NULL,
    "app_user_id" INTEGER,
    "name" VARCHAR(255),
    "body" TEXT NOT NULL,
    "is_private" BOOLEAN NOT NULL DEFAULT true,
    "status" "PrayerRequestStatus" NOT NULL DEFAULT 'NEW',
    "handled_by_admin_id" INTEGER,
    "handled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prayer_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "contact_messages" (
    "id" SERIAL NOT NULL,
    "app_user_id" INTEGER,
    "name" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "category" "ContactCategory" NOT NULL DEFAULT 'GENERAL',
    "csg_id" INTEGER,
    "message" TEXT NOT NULL,
    "status" "ContactMessageStatus" NOT NULL DEFAULT 'NEW',
    "handled_by_admin_id" INTEGER,
    "handled_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "contact_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "church_bank_accounts" (
    "id" SERIAL NOT NULL,
    "bank_name" VARCHAR(255) NOT NULL,
    "account_name" VARCHAR(255) NOT NULL,
    "account_number" VARCHAR(50) NOT NULL,
    "instructions" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "church_bank_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "blurb" TEXT,
    "description" TEXT,
    "image_url" VARCHAR(500),
    "cloudinary_public_id" VARCHAR(255),
    "target_amount" BIGINT NOT NULL,
    "raised_amount" BIGINT NOT NULL DEFAULT 0,
    "donor_count" INTEGER NOT NULL DEFAULT 0,
    "deadline" DATE,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "giving_transactions" (
    "id" SERIAL NOT NULL,
    "reference" VARCHAR(100) NOT NULL,
    "app_user_id" INTEGER,
    "email" VARCHAR(255) NOT NULL,
    "amount" BIGINT NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'NGN',
    "purpose" "GivingPurpose" NOT NULL,
    "project_id" INTEGER,
    "anonymous" BOOLEAN NOT NULL DEFAULT false,
    "status" "GivingTransactionStatus" NOT NULL DEFAULT 'PENDING',
    "channel" VARCHAR(50),
    "metadata" JSONB,
    "paid_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "giving_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "payment_methods" (
    "id" SERIAL NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    "paystack_authorization_code" VARCHAR(255) NOT NULL,
    "card_type" VARCHAR(50),
    "last4" VARCHAR(4),
    "bank" VARCHAR(100),
    "exp_month" VARCHAR(2),
    "exp_year" VARCHAR(4),
    "is_default" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payment_methods_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_saves" (
    "id" SERIAL NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "content_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_saves_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notes" (
    "id" SERIAL NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "content_id" INTEGER NOT NULL,
    "body" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_progress" (
    "id" SERIAL NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "content_id" INTEGER NOT NULL,
    "position_seconds" INTEGER NOT NULL DEFAULT 0,
    "duration_seconds" INTEGER,
    "completed" BOOLEAN NOT NULL DEFAULT false,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "live_schedules" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "day_of_week" INTEGER NOT NULL,
    "time" VARCHAR(20) NOT NULL,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'Africa/Lagos',
    "notes" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "live_schedules_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "app_users_firebase_uid_key" ON "app_users"("firebase_uid");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_email_key" ON "app_users"("email");

-- CreateIndex
CREATE INDEX "csg_memberships_app_user_id_idx" ON "csg_memberships"("app_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "csg_memberships_csg_id_app_user_id_key" ON "csg_memberships"("csg_id", "app_user_id");

-- CreateIndex
CREATE INDEX "csg_updates_csg_id_created_at_idx" ON "csg_updates"("csg_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "push_tokens_token_key" ON "push_tokens"("token");

-- CreateIndex
CREATE INDEX "push_tokens_app_user_id_idx" ON "push_tokens"("app_user_id");

-- CreateIndex
CREATE INDEX "push_tokens_csg_id_idx" ON "push_tokens"("csg_id");

-- CreateIndex
CREATE INDEX "prayer_requests_status_created_at_idx" ON "prayer_requests"("status", "created_at");

-- CreateIndex
CREATE INDEX "contact_messages_status_created_at_idx" ON "contact_messages"("status", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "giving_transactions_reference_key" ON "giving_transactions"("reference");

-- CreateIndex
CREATE INDEX "giving_transactions_app_user_id_idx" ON "giving_transactions"("app_user_id");

-- CreateIndex
CREATE INDEX "giving_transactions_status_idx" ON "giving_transactions"("status");

-- CreateIndex
CREATE INDEX "giving_transactions_project_id_idx" ON "giving_transactions"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "payment_methods_paystack_authorization_code_key" ON "payment_methods"("paystack_authorization_code");

-- CreateIndex
CREATE INDEX "payment_methods_app_user_id_idx" ON "payment_methods"("app_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_saves_app_user_id_content_type_content_id_key" ON "user_saves"("app_user_id", "content_type", "content_id");

-- CreateIndex
CREATE INDEX "user_notes_app_user_id_content_type_content_id_idx" ON "user_notes"("app_user_id", "content_type", "content_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_progress_app_user_id_content_type_content_id_key" ON "user_progress"("app_user_id", "content_type", "content_id");

-- AddForeignKey
ALTER TABLE "admins" ADD CONSTRAINT "admins_csg_id_fkey" FOREIGN KEY ("csg_id") REFERENCES "csgs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csg_memberships" ADD CONSTRAINT "csg_memberships_csg_id_fkey" FOREIGN KEY ("csg_id") REFERENCES "csgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csg_memberships" ADD CONSTRAINT "csg_memberships_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csg_updates" ADD CONSTRAINT "csg_updates_csg_id_fkey" FOREIGN KEY ("csg_id") REFERENCES "csgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "csg_updates" ADD CONSTRAINT "csg_updates_author_admin_id_fkey" FOREIGN KEY ("author_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "push_tokens" ADD CONSTRAINT "push_tokens_csg_id_fkey" FOREIGN KEY ("csg_id") REFERENCES "csgs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "prayer_requests" ADD CONSTRAINT "prayer_requests_handled_by_admin_id_fkey" FOREIGN KEY ("handled_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_csg_id_fkey" FOREIGN KEY ("csg_id") REFERENCES "csgs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "contact_messages" ADD CONSTRAINT "contact_messages_handled_by_admin_id_fkey" FOREIGN KEY ("handled_by_admin_id") REFERENCES "admins"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giving_transactions" ADD CONSTRAINT "giving_transactions_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "giving_transactions" ADD CONSTRAINT "giving_transactions_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payment_methods" ADD CONSTRAINT "payment_methods_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_saves" ADD CONSTRAINT "user_saves_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_notes" ADD CONSTRAINT "user_notes_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_progress" ADD CONSTRAINT "user_progress_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
