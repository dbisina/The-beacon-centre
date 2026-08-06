-- CreateEnum
CREATE TYPE "AnnouncementKind" AS ENUM ('ANNOUNCEMENT', 'EVENT');

-- CreateEnum
CREATE TYPE "EventRsvpStatus" AS ENUM ('GOING', 'MAYBE', 'NOT_GOING');

-- CreateEnum
CREATE TYPE "EventFormFieldType" AS ENUM ('TEXT', 'TEXTAREA', 'EMAIL', 'PHONE', 'NUMBER', 'DATE', 'TIME', 'SELECT', 'RADIO', 'CHECKBOX', 'YES_NO');

-- AlterTable
ALTER TABLE "announcements" ADD COLUMN     "address" VARCHAR(500),
ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "csg_id" INTEGER,
ADD COLUMN     "ends_at" TIMESTAMP(3),
ADD COLUMN     "kind" "AnnouncementKind" NOT NULL DEFAULT 'ANNOUNCEMENT',
ADD COLUMN     "latitude" DOUBLE PRECISION,
ADD COLUMN     "location_name" VARCHAR(255),
ADD COLUMN     "longitude" DOUBLE PRECISION,
ADD COLUMN     "rsvp_enabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "starts_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "event_forms" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "is_open" BOOLEAN NOT NULL DEFAULT true,
    "closes_at" TIMESTAMP(3),
    "confirmation_message" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_forms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_form_fields" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "label" VARCHAR(255) NOT NULL,
    "type" "EventFormFieldType" NOT NULL DEFAULT 'TEXT',
    "placeholder" VARCHAR(255),
    "help_text" VARCHAR(500),
    "required" BOOLEAN NOT NULL DEFAULT false,
    "options" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_form_fields_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_registrations" (
    "id" SERIAL NOT NULL,
    "form_id" INTEGER NOT NULL,
    "app_user_id" INTEGER,
    "name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "answers" JSONB NOT NULL DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_registrations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_rsvps" (
    "id" SERIAL NOT NULL,
    "announcement_id" INTEGER NOT NULL,
    "app_user_id" INTEGER NOT NULL,
    "status" "EventRsvpStatus" NOT NULL DEFAULT 'GOING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "event_rsvps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_forms_announcement_id_key" ON "event_forms"("announcement_id");

-- CreateIndex
CREATE INDEX "event_form_fields_form_id_sort_order_idx" ON "event_form_fields"("form_id", "sort_order");

-- CreateIndex
CREATE INDEX "event_registrations_form_id_created_at_idx" ON "event_registrations"("form_id", "created_at");

-- CreateIndex
CREATE INDEX "event_rsvps_announcement_id_idx" ON "event_rsvps"("announcement_id");

-- CreateIndex
CREATE UNIQUE INDEX "event_rsvps_announcement_id_app_user_id_key" ON "event_rsvps"("announcement_id", "app_user_id");

-- CreateIndex
CREATE INDEX "announcements_kind_starts_at_idx" ON "announcements"("kind", "starts_at");

-- CreateIndex
CREATE INDEX "announcements_csg_id_start_date_idx" ON "announcements"("csg_id", "start_date");

-- AddForeignKey
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_csg_id_fkey" FOREIGN KEY ("csg_id") REFERENCES "csgs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_forms" ADD CONSTRAINT "event_forms_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_form_fields" ADD CONSTRAINT "event_form_fields_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "event_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_form_id_fkey" FOREIGN KEY ("form_id") REFERENCES "event_forms"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_registrations" ADD CONSTRAINT "event_registrations_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_announcement_id_fkey" FOREIGN KEY ("announcement_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_rsvps" ADD CONSTRAINT "event_rsvps_app_user_id_fkey" FOREIGN KEY ("app_user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

