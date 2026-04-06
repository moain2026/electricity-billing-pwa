-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
    "cycleNumber" TEXT NOT NULL DEFAULT '',
    "subscriberId" TEXT NOT NULL,
    "periodFrom" TEXT NOT NULL,
    "periodTo" TEXT NOT NULL,
    "previousReading" REAL NOT NULL,
    "currentReading" REAL NOT NULL,
    "consumptionKwh" REAL NOT NULL,
    "unitPrice" REAL NOT NULL,
    "baseValue" REAL NOT NULL,
    "servicesAmount" REAL NOT NULL DEFAULT 0,
    "arrearsAmount" REAL NOT NULL DEFAULT 0,
    "paidDuringPeriod" REAL NOT NULL DEFAULT 0,
    "grossAmount" REAL NOT NULL,
    "netDue" REAL NOT NULL,
    "netDueWords" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'ريال',
    "status" TEXT NOT NULL DEFAULT 'draft',
    "pdfPath" TEXT,
    "notes" TEXT NOT NULL DEFAULT '',
    "issuedById" TEXT,
    "issuedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Invoice_subscriberId_fkey" FOREIGN KEY ("subscriberId") REFERENCES "Subscriber" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Invoice_issuedById_fkey" FOREIGN KEY ("issuedById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Invoice" ("arrearsAmount", "baseValue", "consumptionKwh", "createdAt", "currency", "currentReading", "grossAmount", "id", "invoiceNumber", "issuedAt", "issuedById", "netDue", "netDueWords", "notes", "paidDuringPeriod", "pdfPath", "periodFrom", "periodTo", "previousReading", "servicesAmount", "status", "subscriberId", "unitPrice", "updatedAt") SELECT "arrearsAmount", "baseValue", "consumptionKwh", "createdAt", "currency", "currentReading", "grossAmount", "id", "invoiceNumber", "issuedAt", "issuedById", "netDue", "netDueWords", "notes", "paidDuringPeriod", "pdfPath", "periodFrom", "periodTo", "previousReading", "servicesAmount", "status", "subscriberId", "unitPrice", "updatedAt" FROM "Invoice";
DROP TABLE "Invoice";
ALTER TABLE "new_Invoice" RENAME TO "Invoice";
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");
CREATE UNIQUE INDEX "Invoice_subscriberId_periodFrom_periodTo_key" ON "Invoice"("subscriberId", "periodFrom", "periodTo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
