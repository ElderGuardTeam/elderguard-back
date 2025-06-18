/*
  Warnings:

  - You are about to drop the column `outcome` on the `Rule` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Rule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "maxScore" INTEGER,
    "value1Type" TEXT,
    "value2Type" TEXT,
    "value1" INTEGER,
    "value2" INTEGER,
    "priority" INTEGER,
    "expression" TEXT,
    "condition" TEXT,
    "operation" TEXT,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL
);
INSERT INTO "new_Rule" ("condition", "created", "id", "maxScore", "operation", "priority", "type", "updated", "value1", "value1Type", "value2", "value2Type") SELECT "condition", "created", "id", "maxScore", "operation", "priority", "type", "updated", "value1", "value1Type", "value2", "value2Type" FROM "Rule";
DROP TABLE "Rule";
ALTER TABLE "new_Rule" RENAME TO "Rule";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
