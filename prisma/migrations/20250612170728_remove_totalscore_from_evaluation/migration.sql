/*
  Warnings:

  - You are about to drop the column `scoreTotal` on the `EvaluationAnsware` table. All the data in the column will be lost.

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
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "EvaluationAnsware_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_EvaluationAnsware" ("completedAt", "created", "evaluationId", "id", "startedAt", "status", "updated") SELECT "completedAt", "created", "evaluationId", "id", "startedAt", "status", "updated" FROM "EvaluationAnsware";
DROP TABLE "EvaluationAnsware";
ALTER TABLE "new_EvaluationAnsware" RENAME TO "EvaluationAnsware";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
