/*
  Warnings:

  - Added the required column `elderlyId` to the `EvaluationAnsware` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_EvaluationAnsware" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "startedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'IN_PROGRESS',
    "elderlyId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "EvaluationAnsware_elderlyId_fkey" FOREIGN KEY ("elderlyId") REFERENCES "Elderly" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "EvaluationAnsware_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EvaluationAnsware" ("completedAt", "created", "evaluationId", "id", "startedAt", "status", "updated") SELECT "completedAt", "created", "evaluationId", "id", "startedAt", "status", "updated" FROM "EvaluationAnsware";
DROP TABLE "EvaluationAnsware";
ALTER TABLE "new_EvaluationAnsware" RENAME TO "EvaluationAnsware";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
