-- CreateEnum
CREATE TYPE "Priority" AS ENUM ('LOW', 'MEDIUM', 'HIGH');

-- CreateEnum
CREATE TYPE "AdminRole" AS ENUM ('SUPER_ADMIN', 'ADMIN', 'EDITOR');

-- CreateEnum
CREATE TYPE "ContentType" AS ENUM ('DEVOTIONAL', 'VIDEO_SERMON', 'AUDIO_SERMON', 'ANNOUNCEMENT');

-- CreateEnum
CREATE TYPE "InteractionType" AS ENUM ('VIEWED', 'PLAYED', 'COMPLETED', 'DOWNLOADED', 'FAVORITED', 'SHARED', 'BOOKMARKED');

-- CreateTable
CREATE TABLE "devotionals" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "verse_text" TEXT NOT NULL,
    "verse_reference" VARCHAR(100) NOT NULL,
    "content" TEXT NOT NULL,
    "prayer" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "devotionals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "video_sermons" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "speaker" VARCHAR(255) NOT NULL,
    "youtube_id" VARCHAR(50) NOT NULL,
    "description" TEXT,
    "duration" VARCHAR(20),
    "category_id" INTEGER,
    "sermon_date" DATE,
    "thumbnail_url" VARCHAR(500),
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "video_sermons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_sermons" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "speaker" VARCHAR(255) NOT NULL,
    "audio_url" VARCHAR(500) NOT NULL,
    "cloudinary_public_id" VARCHAR(255) NOT NULL,
    "duration" VARCHAR(20),
    "file_size" BIGINT,
    "category_id" INTEGER,
    "sermon_date" DATE,
    "description" TEXT,
    "is_featured" BOOLEAN NOT NULL DEFAULT false,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "play_count" INTEGER NOT NULL DEFAULT 0,
    "download_count" INTEGER NOT NULL DEFAULT 0,
    "tags" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "audio_sermons_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "announcements" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "content" TEXT NOT NULL,
    "priority" "Priority" NOT NULL DEFAULT 'MEDIUM',
    "start_date" DATE NOT NULL,
    "expiry_date" DATE,
    "image_url" VARCHAR(500),
    "cloudinary_public_id" VARCHAR(255),
    "action_url" VARCHAR(500),
    "action_text" VARCHAR(100),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "announcements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "categories" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "color" VARCHAR(7),
    "icon" VARCHAR(50),
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "categories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "admins" (
    "id" SERIAL NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "role" "AdminRole" NOT NULL DEFAULT 'ADMIN',
    "permissions" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login" TIMESTAMP(3),
    "login_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "admins_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "device_sessions" (
    "id" SERIAL NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "platform" VARCHAR(20),
    "app_version" VARCHAR(20),
    "country" VARCHAR(3),
    "state" VARCHAR(100),
    "last_active" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "total_sessions" INTEGER NOT NULL DEFAULT 1,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "device_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "content_interactions" (
    "id" SERIAL NOT NULL,
    "device_id" VARCHAR(255) NOT NULL,
    "content_type" "ContentType" NOT NULL,
    "content_id" INTEGER NOT NULL,
    "interaction_type" "InteractionType" NOT NULL,
    "duration_seconds" INTEGER,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "content_interactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "devotionals_date_key" ON "devotionals"("date");

-- CreateIndex
CREATE UNIQUE INDEX "video_sermons_youtube_id_key" ON "video_sermons"("youtube_id");

-- CreateIndex
CREATE UNIQUE INDEX "categories_name_key" ON "categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "admins_email_key" ON "admins"("email");

-- CreateIndex
CREATE UNIQUE INDEX "device_sessions_device_id_key" ON "device_sessions"("device_id");

-- CreateIndex
CREATE INDEX "content_interactions_device_id_idx" ON "content_interactions"("device_id");

-- CreateIndex
CREATE INDEX "content_interactions_content_type_content_id_idx" ON "content_interactions"("content_type", "content_id");

-- CreateIndex
CREATE INDEX "content_interactions_created_at_idx" ON "content_interactions"("created_at");

-- AddForeignKey
ALTER TABLE "video_sermons" ADD CONSTRAINT "video_sermons_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_sermons" ADD CONSTRAINT "audio_sermons_category_id_fkey" FOREIGN KEY ("category_id") REFERENCES "categories"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "devotional_interaction" FOREIGN KEY ("content_id") REFERENCES "devotionals"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "video_sermon_interaction" FOREIGN KEY ("content_id") REFERENCES "video_sermons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "audio_sermon_interaction" FOREIGN KEY ("content_id") REFERENCES "audio_sermons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "content_interactions" ADD CONSTRAINT "announcement_interaction" FOREIGN KEY ("content_id") REFERENCES "announcements"("id") ON DELETE CASCADE ON UPDATE CASCADE;
