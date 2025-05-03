/*
  Warnings:

  - You are about to drop the column `formularioAnswareId` on the `Evaluation` table. All the data in the column will be lost.
  - Added the required column `index` to the `Form_has_Question` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL
);
INSERT INTO "new_Evaluation" ("created", "description", "id", "title", "updated") SELECT "created", "description", "id", "title", "updated" FROM "Evaluation";
DROP TABLE "Evaluation";
ALTER TABLE "new_Evaluation" RENAME TO "Evaluation";
CREATE TABLE "new_Form_has_Question" (
    "formId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    PRIMARY KEY ("formId", "questionId"),
    CONSTRAINT "Form_has_Question_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Form_has_Question_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Form_has_Question" ("formId", "questionId") SELECT "formId", "questionId" FROM "Form_has_Question";
DROP TABLE "Form_has_Question";
ALTER TABLE "new_Form_has_Question" RENAME TO "Form_has_Question";
CREATE TABLE "new_QuestionAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "formAnswareId" TEXT NOT NULL,
    "answerText" TEXT,
    "answerNumber" REAL,
    "answerImage" TEXT,
    "answerBoolean" BOOLEAN,
    "selectedOptionId" TEXT,
    "score" INTEGER,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "QuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QuestionAnswer_formAnswareId_fkey" FOREIGN KEY ("formAnswareId") REFERENCES "FormAnsware" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QuestionAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "Option" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuestionAnswer" ("answerImage", "answerNumber", "answerText", "created", "formAnswareId", "id", "questionId", "score", "updated") SELECT "answerImage", "answerNumber", "answerText", "created", "formAnswareId", "id", "questionId", "score", "updated" FROM "QuestionAnswer";
DROP TABLE "QuestionAnswer";
ALTER TABLE "new_QuestionAnswer" RENAME TO "QuestionAnswer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
