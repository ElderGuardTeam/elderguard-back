/*
  Warnings:

  - Added the required column `formAnswareId` to the `QuestionAnswer` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Form" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "type" TEXT,
    "description" TEXT,
    "index" INTEGER,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Form_has_Question" (
    "formId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    PRIMARY KEY ("formId", "questionId"),
    CONSTRAINT "Form_has_Question_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Form_has_Question_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Seccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "ruleId" TEXT,
    "formId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Seccion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Seccion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Seccion_has_Question" (
    "seccionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    PRIMARY KEY ("seccionId", "questionId"),
    CONSTRAINT "Seccion_has_Question_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Seccion_has_Question_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Rule" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "type" TEXT NOT NULL,
    "values" TEXT,
    "operation" TEXT,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "FormAnsware" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalScore" REAL,
    "formId" TEXT NOT NULL,
    "elderlyId" TEXT NOT NULL,
    "techProfessionalId" TEXT NOT NULL,
    "evaluationAnswareId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "FormAnsware_evaluationAnswareId_fkey" FOREIGN KEY ("evaluationAnswareId") REFERENCES "EvaluationAnsware" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormAnsware_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormAnsware_elderlyId_fkey" FOREIGN KEY ("elderlyId") REFERENCES "Elderly" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormAnsware_techProfessionalId_fkey" FOREIGN KEY ("techProfessionalId") REFERENCES "Professional" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "formularioAnswareId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Evaluation_formularioAnswareId_fkey" FOREIGN KEY ("formularioAnswareId") REFERENCES "FormAnsware" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Evaluation_has_Form" (
    "evaluationId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    PRIMARY KEY ("evaluationId", "formId"),
    CONSTRAINT "Evaluation_has_Form_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_has_Form_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EvaluationAnsware" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "evaluationId" TEXT NOT NULL,
    "dateAnsware" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "scoreTotal" REAL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "EvaluationAnsware_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    "ruleId" TEXT,
    CONSTRAINT "Question_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("created", "description", "id", "title", "type", "updated") SELECT "created", "description", "id", "title", "type", "updated" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
CREATE TABLE "new_QuestionAnswer" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "questionId" TEXT NOT NULL,
    "formAnswareId" TEXT NOT NULL,
    "answerText" TEXT,
    "answerNumber" REAL,
    "answerImage" TEXT,
    "score" INTEGER,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "QuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "QuestionAnswer_formAnswareId_fkey" FOREIGN KEY ("formAnswareId") REFERENCES "FormAnsware" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_QuestionAnswer" ("answerImage", "answerNumber", "answerText", "created", "id", "questionId", "score", "updated") SELECT "answerImage", "answerNumber", "answerText", "created", "id", "questionId", "score", "updated" FROM "QuestionAnswer";
DROP TABLE "QuestionAnswer";
ALTER TABLE "new_QuestionAnswer" RENAME TO "QuestionAnswer";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
