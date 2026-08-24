-- CreateTable
CREATE TABLE "Miejscowosc" (
    "id" SERIAL NOT NULL,
    "nazwa" TEXT NOT NULL,
    "kraj" TEXT NOT NULL,

    CONSTRAINT "Miejscowosc_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Miesiace" (
    "id" SERIAL NOT NULL,
    "nazwa" TEXT NOT NULL,
    "pora" TEXT NOT NULL,

    CONSTRAINT "Miesiace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pomiary" (
    "id" SERIAL NOT NULL,
    "temperatura" INTEGER NOT NULL,
    "id_miejscowosc" INTEGER NOT NULL,
    "id_miesiac" INTEGER NOT NULL,

    CONSTRAINT "Pomiary_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pomiary_id_miejscowosc_idx" ON "Pomiary"("id_miejscowosc");

-- CreateIndex
CREATE INDEX "Pomiary_id_miesiac_idx" ON "Pomiary"("id_miesiac");

-- AddForeignKey
ALTER TABLE "Pomiary" ADD CONSTRAINT "Pomiary_id_miejscowosc_fkey" FOREIGN KEY ("id_miejscowosc") REFERENCES "Miejscowosc"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pomiary" ADD CONSTRAINT "Pomiary_id_miesiac_fkey" FOREIGN KEY ("id_miesiac") REFERENCES "Miesiace"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
