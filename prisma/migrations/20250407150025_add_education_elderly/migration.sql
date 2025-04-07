/*
  Warnings:

  - Added the required column `education` to the `Elderly` table without a default value. This is not possible if the table is not empty.
  - Added the required column `socialeconomic` to the `Elderly` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Elderly" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL DEFAULT '',
    "dateOfBirth" DATETIME NOT NULL,
    "phone" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "sex" TEXT NOT NULL,
    "weight" REAL NOT NULL,
    "height" REAL NOT NULL,
    "imc" REAL NOT NULL,
    "education" TEXT NOT NULL,
    "socialeconomic" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Elderly_addressId_fkey" FOREIGN KEY ("addressId") REFERENCES "Address" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Elderly_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Elderly" ("addressId", "cpf", "created", "dateOfBirth", "email", "height", "id", "imc", "name", "phone", "sex", "updated", "userId", "weight") SELECT "addressId", "cpf", "created", "dateOfBirth", "email", "height", "id", "imc", "name", "phone", "sex", "updated", "userId", "weight" FROM "Elderly";
DROP TABLE "Elderly";
ALTER TABLE "new_Elderly" RENAME TO "Elderly";
CREATE UNIQUE INDEX "Elderly_cpf_key" ON "Elderly"("cpf");
CREATE UNIQUE INDEX "Elderly_userId_key" ON "Elderly"("userId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
