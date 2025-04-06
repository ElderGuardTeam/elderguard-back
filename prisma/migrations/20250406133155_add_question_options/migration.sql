/*
  Warnings:

  - You are about to drop the column `value` on the `OptionAnswer` table. All the data in the column will be lost.
  - You are about to drop the column `value` on the `QuestionAnswer` table. All the data in the column will be lost.
  - Added the required column `score` to the `OptionAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_OptionAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "score" INTEGER NOT NULL,
    "answerText" TEXT,
    "answerNumber" REAL,
    "answerBoolean" BOOLEAN,
    "optionId" TEXT NOT NULL,
    "questionAnswerId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "OptionAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OptionAnswer_questionAnswerId_fkey" FOREIGN KEY ("questionAnswerId") REFERENCES "QuestionAnswer" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OptionAnswer" ("answerBoolean", "answerNumber", "answerText", "created", "id", "optionId", "questionAnswerId", "updated") SELECT "answerBoolean", "answerNumber", "answerText", "created", "id", "optionId", "questionAnswerId", "updated" FROM "OptionAnswer";
DROP TABLE "OptionAnswer";
ALTER TABLE "new_OptionAnswer" RENAME TO "OptionAnswer";
CREATE TABLE "new_QuestionAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "answerText" TEXT,
    "answerNumber" REAL,
    "answerImage" TEXT,
    "score" INTEGER,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "QuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QuestionAnswer" ("answerImage", "answerNumber", "answerText", "created", "id", "questionId", "updated") SELECT "answerImage", "answerNumber", "answerText", "created", "id", "questionId", "updated" FROM "QuestionAnswer";
DROP TABLE "QuestionAnswer";
ALTER TABLE "new_QuestionAnswer" RENAME TO "QuestionAnswer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
