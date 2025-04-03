-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "login" TEXT NOT NULL,
    "name" TEXT,
    "email" TEXT NOT NULL DEFAULT '',
    "password" TEXT NOT NULL,
    "userType" TEXT NOT NULL DEFAULT 'USER',
    "resetToken" TEXT,
    "resetTokenExpiry" DATETIME,
    "mustChangePassword" BOOLEAN NOT NULL DEFAULT true,
    "created" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated" DATETIME NOT NULL
);
INSERT INTO "new_User" ("created", "email", "id", "login", "name", "password", "resetToken", "resetTokenExpiry", "updated", "userType") SELECT "created", "email", "id", "login", "name", "password", "resetToken", "resetTokenExpiry", "updated", "userType" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_login_key" ON "User"("login");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
