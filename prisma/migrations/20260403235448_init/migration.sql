-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fullName" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'clerk',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Subscriber" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "subscriberNumber" TEXT NOT NULL,
    "subscriberName" TEXT NOT NULL,
    "meterNumber" TEXT NOT NULL,
    "routeNumber" TEXT NOT NULL,
    "cabinName" TEXT NOT NULL,
    "locationName" TEXT NOT NULL DEFAULT '',
    "phone" TEXT NOT NULL DEFAULT '',
    "status" TEXT NOT NULL DEFAULT 'active',
    "notes" TEXT NOT NULL DEFAULT '',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "invoiceNumber" TEXT NOT NULL,
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

-- CreateTable
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "oldValues" TEXT,
    "newValues" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Setting" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_subscriberNumber_key" ON "Subscriber"("subscriberNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Subscriber_meterNumber_key" ON "Subscriber"("meterNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_subscriberId_periodFrom_periodTo_key" ON "Invoice"("subscriberId", "periodFrom", "periodTo");

-- CreateIndex
CREATE UNIQUE INDEX "Setting_key_key" ON "Setting"("key");
