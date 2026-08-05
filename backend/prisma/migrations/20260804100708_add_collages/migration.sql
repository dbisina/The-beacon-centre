-- CreateTable
CREATE TABLE "collages" (
    "id" SERIAL NOT NULL,
    "date" DATE NOT NULL,
    "cover_image_url" VARCHAR(500) NOT NULL,
    "cover_image_cloudinary_public_id" VARCHAR(255) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "collages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "collage_photos" (
    "id" SERIAL NOT NULL,
    "collage_id" INTEGER NOT NULL,
    "image_url" VARCHAR(500) NOT NULL,
    "cloudinary_public_id" VARCHAR(255) NOT NULL,
    "sort_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "collage_photos_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "collages_date_key" ON "collages"("date");

-- AddForeignKey
ALTER TABLE "collage_photos" ADD CONSTRAINT "collage_photos_collage_id_fkey" FOREIGN KEY ("collage_id") REFERENCES "collages"("id") ON DELETE CASCADE ON UPDATE CASCADE;
