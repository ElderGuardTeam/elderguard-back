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
    CONSTRAINT "Elderly_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Elderly" ("addressId", "cpf", "created", "dateOfBirth", "education", "email", "height", "id", "imc", "name", "phone", "sex", "socialeconomic", "updated", "userId", "weight") SELECT "addressId", "cpf", "created", "dateOfBirth", "education", "email", "height", "id", "imc", "name", "phone", "sex", "socialeconomic", "updated", "userId", "weight" FROM "Elderly";
DROP TABLE "Elderly";
ALTER TABLE "new_Elderly" RENAME TO "Elderly";
CREATE UNIQUE INDEX "Elderly_cpf_key" ON "Elderly"("cpf");
CREATE UNIQUE INDEX "Elderly_userId_key" ON "Elderly"("userId");
CREATE TABLE "new_ElderlyContact" (
    "elderlyId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,

    PRIMARY KEY ("elderlyId", "contactId"),
    CONSTRAINT "ElderlyContact_elderlyId_fkey" FOREIGN KEY ("elderlyId") REFERENCES "Elderly" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ElderlyContact_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_ElderlyContact" ("contactId", "elderlyId") SELECT "contactId", "elderlyId" FROM "ElderlyContact";
DROP TABLE "ElderlyContact";
ALTER TABLE "new_ElderlyContact" RENAME TO "ElderlyContact";
CREATE TABLE "new_Evaluation_has_Form" (
    "evaluationId" TEXT NOT NULL,
    "formId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,

    PRIMARY KEY ("evaluationId", "formId"),
    CONSTRAINT "Evaluation_has_Form_evaluationId_fkey" FOREIGN KEY ("evaluationId") REFERENCES "Evaluation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Evaluation_has_Form_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Evaluation_has_Form" ("evaluationId", "formId", "order") SELECT "evaluationId", "formId", "order" FROM "Evaluation_has_Form";
DROP TABLE "Evaluation_has_Form";
ALTER TABLE "new_Evaluation_has_Form" RENAME TO "Evaluation_has_Form";
CREATE TABLE "new_FormAnsware" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "totalScore" REAL,
    "formId" TEXT NOT NULL,
    "elderlyId" TEXT NOT NULL,
    "techProfessionalId" TEXT NOT NULL,
    "evaluationAnswareId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "FormAnsware_evaluationAnswareId_fkey" FOREIGN KEY ("evaluationAnswareId") REFERENCES "EvaluationAnsware" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormAnsware_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "FormAnsware_elderlyId_fkey" FOREIGN KEY ("elderlyId") REFERENCES "Elderly" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "FormAnsware_techProfessionalId_fkey" FOREIGN KEY ("techProfessionalId") REFERENCES "Professional" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_FormAnsware" ("created", "elderlyId", "evaluationAnswareId", "formId", "id", "techProfessionalId", "totalScore", "updated") SELECT "created", "elderlyId", "evaluationAnswareId", "formId", "id", "techProfessionalId", "totalScore", "updated" FROM "FormAnsware";
DROP TABLE "FormAnsware";
ALTER TABLE "new_FormAnsware" RENAME TO "FormAnsware";
CREATE UNIQUE INDEX "FormAnsware_evaluationAnswareId_formId_key" ON "FormAnsware"("evaluationAnswareId", "formId");
CREATE TABLE "new_Form_has_Question" (
    "formId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "index" INTEGER NOT NULL,

    PRIMARY KEY ("formId", "questionId"),
    CONSTRAINT "Form_has_Question_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Form_has_Question_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Form_has_Question" ("formId", "index", "questionId") SELECT "formId", "index", "questionId" FROM "Form_has_Question";
DROP TABLE "Form_has_Question";
ALTER TABLE "new_Form_has_Question" RENAME TO "Form_has_Question";
CREATE TABLE "new_Option" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "score" INTEGER NOT NULL,
    "questionId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Option_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Option" ("created", "description", "id", "questionId", "score", "updated") SELECT "created", "description", "id", "questionId", "score", "updated" FROM "Option";
DROP TABLE "Option";
ALTER TABLE "new_Option" RENAME TO "Option";
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
    CONSTRAINT "OptionAnswer_optionId_fkey" FOREIGN KEY ("optionId") REFERENCES "Option" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OptionAnswer_questionAnswerId_fkey" FOREIGN KEY ("questionAnswerId") REFERENCES "QuestionAnswer" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_OptionAnswer" ("answerBoolean", "answerNumber", "answerText", "created", "id", "optionId", "questionAnswerId", "score", "updated") SELECT "answerBoolean", "answerNumber", "answerText", "created", "id", "optionId", "questionAnswerId", "score", "updated" FROM "OptionAnswer";
DROP TABLE "OptionAnswer";
ALTER TABLE "new_OptionAnswer" RENAME TO "OptionAnswer";
CREATE TABLE "new_Professional" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "cpf" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Professional_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Professional" ("cpf", "created", "email", "id", "name", "phone", "updated", "userId") SELECT "cpf", "created", "email", "id", "name", "phone", "updated", "userId" FROM "Professional";
DROP TABLE "Professional";
ALTER TABLE "new_Professional" RENAME TO "Professional";
CREATE UNIQUE INDEX "Professional_cpf_key" ON "Professional"("cpf");
CREATE UNIQUE INDEX "Professional_userId_key" ON "Professional"("userId");
CREATE TABLE "new_Question" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    "ruleId" TEXT,
    CONSTRAINT "Question_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("created", "description", "id", "ruleId", "title", "type", "updated") SELECT "created", "description", "id", "ruleId", "title", "type", "updated" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
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
    CONSTRAINT "QuestionAnswer_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuestionAnswer_formAnswareId_fkey" FOREIGN KEY ("formAnswareId") REFERENCES "FormAnsware" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "QuestionAnswer_selectedOptionId_fkey" FOREIGN KEY ("selectedOptionId") REFERENCES "Option" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_QuestionAnswer" ("answerBoolean", "answerImage", "answerNumber", "answerText", "created", "formAnswareId", "id", "questionId", "score", "selectedOptionId", "updated") SELECT "answerBoolean", "answerImage", "answerNumber", "answerText", "created", "formAnswareId", "id", "questionId", "score", "selectedOptionId", "updated" FROM "QuestionAnswer";
DROP TABLE "QuestionAnswer";
ALTER TABLE "new_QuestionAnswer" RENAME TO "QuestionAnswer";
CREATE TABLE "new_Seccion" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "ruleId" TEXT,
    "formId" TEXT NOT NULL,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL,
    CONSTRAINT "Seccion_ruleId_fkey" FOREIGN KEY ("ruleId") REFERENCES "Rule" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Seccion_formId_fkey" FOREIGN KEY ("formId") REFERENCES "Form" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Seccion" ("created", "formId", "id", "ruleId", "title", "updated") SELECT "created", "formId", "id", "ruleId", "title", "updated" FROM "Seccion";
DROP TABLE "Seccion";
ALTER TABLE "new_Seccion" RENAME TO "Seccion";
CREATE TABLE "new_Seccion_has_Question" (
    "seccionId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,

    PRIMARY KEY ("seccionId", "questionId"),
    CONSTRAINT "Seccion_has_Question_seccionId_fkey" FOREIGN KEY ("seccionId") REFERENCES "Seccion" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Seccion_has_Question_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Seccion_has_Question" ("questionId", "seccionId") SELECT "questionId", "seccionId" FROM "Seccion_has_Question";
DROP TABLE "Seccion_has_Question";
ALTER TABLE "new_Seccion_has_Question" RENAME TO "Seccion_has_Question";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
