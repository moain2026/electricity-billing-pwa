<div dir="rtl" align="right">

# التوثيق التفصيلي الكامل - نظام فواتير كهرباء PWA

> هذا الملف مرجع كامل لأي مطور أو وكيل ذكاء اصطناعي يريد فهم، تعديل، أو توسيع المشروع.
> كل قسم يشرح "لماذا" و"كيف" و"أين" بالتفصيل.

---

## الفهرس

1. [نظرة عامة على البنية](#1-نظرة-عامة-على-البنية)
2. [التقنيات والقرارات الهندسية](#2-التقنيات-والقرارات-الهندسية)
3. [قاعدة البيانات (Prisma + SQLite)](#3-قاعدة-البيانات)
4. [نظام المصادقة (JWT + Cookies)](#4-نظام-المصادقة)
5. [واجهات API بالتفصيل](#5-واجهات-api-بالتفصيل)
6. [الصفحات والمكونات (Frontend)](#6-الصفحات-والمكونات)
7. [نظام الحسابات وتحويل الأرقام](#7-نظام-الحسابات)
8. [توليد PDF](#8-توليد-pdf)
9. [PWA - Service Worker و Manifest](#9-pwa)
10. [Middleware وحماية الصفحات](#10-middleware)
11. [البيانات التجريبية (Seed)](#11-البيانات-التجريبية)
12. [ملفات الإعداد](#12-ملفات-الإعداد)
13. [دليل التعديل والتوسعة](#13-دليل-التعديل)
14. [المشاكل المعروفة والحلول](#14-المشاكل-المعروفة)
15. [ما تم تنفيذه وما تم تأجيله](#15-ما-تم-تنفيذه)

---

## 1. نظرة عامة على البنية

### المشروع عبارة عن تطبيق Next.js 16 واحد يجمع:

- **Frontend**: صفحات React مع Tailwind CSS (RTL)
- **Backend**: API Routes في Next.js
- **Database**: SQLite عبر Prisma ORM
- **PDF Engine**: Puppeteer (HTML → PDF)
- **Auth**: JWT tokens في HTTP-only cookies
- **PWA**: Service Worker + Web App Manifest

### مسار الطلب (Request Flow):

```
المتصفح → Middleware (فحص المصادقة) → صفحة/API Route → Prisma → SQLite
                                         ↓
                                    getCurrentUser() ← Cookie (auth-token)
```

### هيكل الملفات الكامل:

```
/
├── prisma/
│   ├── schema.prisma          ← تعريف جداول قاعدة البيانات (5 جداول)
│   ├── seed.ts                ← بيانات تجريبية (مستخدمين، مشتركين، فاتورة، إعدادات)
│   ├── dev.db                 ← ملف قاعدة بيانات SQLite (يُنشأ تلقائياً)
│   └── migrations/            ← ملفات ترحيل قاعدة البيانات
│       └── YYYYMMDD_init/
│           └── migration.sql  ← SQL لإنشاء الجداول
│
├── public/
│   ├── manifest.json          ← PWA manifest (اسم التطبيق، أيقونات، ألوان)
│   ├── sw.js                  ← Service Worker (تخزين مؤقت، عمل بدون اتصال)
│   ├── offline.html           ← صفحة تظهر عند عدم الاتصال
│   └── icons/
│       ├── icon-192.png       ← أيقونة PWA (192×192)
│       └── icon-512.png       ← أيقونة PWA (512×512)
│
├── src/
│   ├── middleware.ts           ← حماية الصفحات + توجيه المصادقة
│   │
│   ├── app/
│   │   ├── layout.tsx          ← التخطيط الجذري (HTML dir=rtl, lang=ar, PWA meta)
│   │   ├── page.tsx            ← الصفحة الرئيسية (توجيه → login أو dashboard)
│   │   ├── globals.css         ← أنماط عامة (Tailwind import, RTL fixes, print)
│   │   ├── favicon.ico         ← أيقونة المتصفح
│   │   │
│   │   ├── login/
│   │   │   └── page.tsx        ← صفحة تسجيل الدخول (Client Component)
│   │   │
│   │   ├── dashboard/
│   │   │   └── page.tsx        ← لوحة التحكم (Server Component + إحصائيات)
│   │   │
│   │   ├── subscribers/
│   │   │   ├── page.tsx        ← صفحة قائمة المشتركين (Server → Client)
│   │   │   └── new/
│   │   │       └── page.tsx    ← صفحة إضافة مشترك جديد
│   │   │
│   │   ├── invoices/
│   │   │   ├── page.tsx        ← توجيه → /invoices/archive
│   │   │   ├── new/
│   │   │   │   └── page.tsx    ← صفحة إصدار فاتورة جديدة
│   │   │   └── archive/
│   │   │       └── page.tsx    ← صفحة أرشيف الفواتير
│   │   │
│   │   ├── settings/
│   │   │   └── page.tsx        ← صفحة الإعدادات
│   │   │
│   │   └── api/                ← واجهات برمجية (API Routes)
│   │       ├── auth/
│   │       │   ├── login/route.ts   ← POST: تسجيل دخول → JWT cookie
│   │       │   ├── logout/route.ts  ← POST: تسجيل خروج → مسح cookie
│   │       │   └── me/route.ts      ← GET: بيانات المستخدم الحالي
│   │       │
│   │       ├── subscribers/
│   │       │   ├── route.ts         ← GET: قائمة | POST: إضافة
│   │       │   └── [id]/route.ts    ← GET: تفاصيل | PUT: تعديل
│   │       │
│   │       ├── invoices/
│   │       │   ├── route.ts         ← GET: قائمة | POST: إنشاء
│   │       │   ├── calculate/route.ts ← POST: حساب فاتورة
│   │       │   └── [id]/
│   │       │       ├── route.ts     ← GET: تفاصيل
│   │       │       └── pdf/route.ts ← GET: توليد وتنزيل PDF
│   │       │
│   │       └── settings/
│   │           └── route.ts         ← GET: عرض | PUT: تحديث
│   │
│   ├── components/
│   │   ├── AppShell.tsx             ← الهيكل العام (sidebar + topbar + navigation)
│   │   ├── InvoiceForm.tsx          ← نموذج إصدار فاتورة (بحث مشترك + إدخال + حساب)
│   │   ├── InvoiceArchive.tsx       ← أرشيف الفواتير (جدول + بحث + تصفية + PDF)
│   │   ├── SubscribersList.tsx      ← قائمة المشتركين (جدول + بحث + إجراءات)
│   │   ├── NewSubscriberForm.tsx    ← نموذج إضافة مشترك
│   │   ├── SettingsForm.tsx         ← نموذج الإعدادات
│   │   └── ServiceWorkerRegistration.tsx ← تسجيل Service Worker
│   │
│   └── lib/
│       ├── auth.ts                  ← دوال المصادقة (hash, verify, JWT, getCurrentUser)
│       ├── prisma.ts                ← عميل Prisma (singleton pattern)
│       ├── invoice-utils.ts         ← حسابات الفاتورة + تحويل أرقام → عربية
│       └── pdf-generator.ts         ← توليد PDF (HTML template → Puppeteer → Buffer)
│
├── .env                        ← متغيرات البيئة (لا ترفع للمستودع)
├── .env.example                ← نموذج متغيرات البيئة
├── .gitignore                  ← ملفات مستثناة من Git
├── package.json                ← تبعيات المشروع وأوامر التشغيل
├── tsconfig.json               ← إعدادات TypeScript
├── next.config.ts              ← إعدادات Next.js
├── postcss.config.mjs          ← إعدادات PostCSS (Tailwind)
├── eslint.config.mjs           ← إعدادات ESLint
├── DECISIONS.md                ← القرارات الهندسية وأسبابها
├── DOCUMENTATION.md            ← هذا الملف
└── README.md                   ← دليل التشغيل السريع

```

---

## 2. التقنيات والقرارات الهندسية

### لماذا Next.js 16 (App Router)؟
- يجمع Frontend و Backend في مشروع واحد
- App Router يدعم Server Components و Server Actions
- API Routes مدمجة (لا حاجة لخادم منفصل)
- SSR يسرّع تحميل الصفحات

### لماذا SQLite بدلاً من PostgreSQL؟
- **قرار MVP**: لتبسيط التشغيل والنشر (لا حاجة لخادم DB منفصل)
- **سهولة النقل**: ملف واحد `dev.db`
- **الانتقال سهل**: فقط غيّر `provider` في `schema.prisma` من `"sqlite"` إلى `"postgresql"` وحدّث `DATABASE_URL`

### لماذا Puppeteer لـ PDF؟
- أعلى جودة في إخراج HTML/CSS العربي RTL
- دعم كامل للخطوط العربية
- تحكم كامل بتنسيق A4

### لماذا JWT في HTTP-only Cookies؟
- أكثر أماناً من localStorage (حماية من XSS)
- يُرسل تلقائياً مع كل طلب
- `secure: false` للتوافق مع بيئات الـ proxy/sandbox

### لماذا Prisma 5 وليس 7؟
- Prisma 7 يستخدم ESM حصرياً مما يسبب مشاكل توافق مع seed scripts و Node.js 20
- Prisma 5 مستقر وموثق بشكل جيد ومتوافق مع CommonJS

---

## 3. قاعدة البيانات

### الملف: `prisma/schema.prisma`

### الجداول (5 جداول):

#### جدول `User` (المستخدمون)
| العمود | النوع | الوصف |
|--------|------|-------|
| id | String (cuid) | معرّف فريد |
| fullName | String | الاسم الكامل |
| username | String (unique) | اسم المستخدم |
| passwordHash | String | كلمة المرور المشفرة (bcrypt) |
| role | String | الدور: `admin` أو `clerk` أو `accountant` |
| isActive | Boolean | حالة الحساب |
| createdAt | DateTime | تاريخ الإنشاء |
| updatedAt | DateTime | تاريخ آخر تعديل |

**العلاقات:** User ← (1:N) → Invoice (issuedBy), User ← (1:N) → AuditLog

#### جدول `Subscriber` (المشتركون)
| العمود | النوع | الوصف |
|--------|------|-------|
| id | String (cuid) | معرّف فريد |
| subscriberNumber | String (unique) | رقم المشترك (مثل 68201348) |
| subscriberName | String | اسم المشترك |
| meterNumber | String (unique) | رقم العداد |
| routeNumber | String | رقم خط السير |
| cabinName | String | اسم الكبينة |
| locationName | String | الموقع (اختياري) |
| phone | String | رقم الهاتف (اختياري) |
| status | String | الحالة: `active` أو `inactive` |
| notes | String | ملاحظات (اختياري) |

**العلاقات:** Subscriber ← (1:N) → Invoice

#### جدول `Invoice` (الفواتير)
| العمود | النوع | الوصف |
|--------|------|-------|
| id | String (cuid) | معرّف فريد |
| invoiceNumber | String (unique) | رقم الفاتورة (INV-YYYY-MM-NNNN) |
| subscriberId | String (FK) | معرّف المشترك |
| periodFrom | String | بداية الفترة (YYYY/MM/DD) |
| periodTo | String | نهاية الفترة |
| previousReading | Float | القراءة السابقة |
| currentReading | Float | القراءة الحالية |
| consumptionKwh | Float | فرق الاستهلاك (kWh) |
| unitPrice | Float | سعر الكيلووات |
| baseValue | Float | القيمة الأساسية |
| servicesAmount | Float | مبلغ الخدمات |
| arrearsAmount | Float | المتأخرات |
| paidDuringPeriod | Float | المدفوع خلال الفترة |
| grossAmount | Float | المبلغ الإجمالي |
| netDue | Float | المبلغ المستحق |
| netDueWords | String | المبلغ كتابةً بالعربية |
| currency | String | العملة (ريال) |
| status | String | الحالة: `draft`, `issued`, `cancelled` |
| pdfPath | String? | مسار ملف PDF (اختياري) |
| notes | String | ملاحظات |
| issuedById | String? (FK) | معرّف الموظف المُصدر |
| issuedAt | DateTime? | تاريخ الإصدار |

**القيد الفريد:** `@@unique([subscriberId, periodFrom, periodTo])` - يمنع تكرار الفاتورة لنفس المشترك ونفس الفترة

#### جدول `AuditLog` (سجل التدقيق)
| العمود | النوع | الوصف |
|--------|------|-------|
| id | String (cuid) | معرّف فريد |
| userId | String? (FK) | معرّف المستخدم |
| entityType | String | نوع الكيان (subscriber, invoice, setting) |
| entityId | String | معرّف الكيان |
| action | String | الإجراء (create, update, delete) |
| oldValues | String? | القيم القديمة (JSON) |
| newValues | String? | القيم الجديدة (JSON) |
| createdAt | DateTime | التاريخ |

#### جدول `Setting` (الإعدادات)
| العمود | النوع | الوصف |
|--------|------|-------|
| id | String (cuid) | معرّف فريد |
| key | String (unique) | مفتاح الإعداد |
| value | String | قيمة الإعداد |

**المفاتيح المستخدمة:**
- `organization_name` → اسم الجهة (محطة كهرباء الصبالية)
- `currency` → العملة (ريال)
- `default_unit_price` → سعر الكيلووات الافتراضي (220)
- `footer_note` → ملاحظة أسفل الفاتورة
- `invoice_title` → عنوان الفاتورة

### أوامر قاعدة البيانات:
```bash
# إنشاء migration جديد
npx prisma migrate dev --name <اسم_التغيير>

# إعادة إنشاء قاعدة البيانات
rm prisma/dev.db && npx prisma migrate dev --name init

# تشغيل البذر
npx tsx prisma/seed.ts

# فتح واجهة Prisma Studio
npx prisma studio
```

---

## 4. نظام المصادقة

### الملف: `src/lib/auth.ts`

### الآلية:
1. المستخدم يرسل username + password → `/api/auth/login`
2. الخادم يتحقق عبر `bcrypt.compare()`
3. إذا صحيح: يُنشئ JWT token عبر `jwt.sign()`
4. يضع التوكن في HTTP-only cookie باسم `auth-token`
5. أيضاً يُرسل التوكن في body الاستجابة (للتخزين في localStorage كاحتياط)
6. كل طلب لاحق: Middleware + `getCurrentUser()` يقرأ الكوكي ويتحقق

### الدوال:

| الدالة | الوصف |
|--------|------|
| `hashPassword(password)` | تشفير كلمة المرور (bcrypt, 10 rounds) |
| `verifyPassword(password, hash)` | التحقق من كلمة المرور |
| `generateToken(payload)` | إنشاء JWT token (صلاحية 24 ساعة) |
| `verifyToken(token)` | التحقق من JWT token |
| `getCurrentUser()` | استخراج المستخدم الحالي من الكوكي |
| `requireAuth()` | يرمي خطأ إذا لا يوجد مستخدم مسجل |

### إعدادات الكوكي:
```typescript
{
  httpOnly: true,     // لا يمكن الوصول من JavaScript
  secure: false,      // لدعم بيئات proxy/sandbox
  sameSite: 'lax',    // حماية CSRF
  maxAge: 86400,      // 24 ساعة
  path: '/',          // على كل المسارات
}
```

### سر JWT:
```env
JWT_SECRET="electricity-billing-secret-key-2026"
```
> **تحذير:** غيّر هذا السر في الإنتاج!

---

## 5. واجهات API بالتفصيل

### 5.1 المصادقة

#### `POST /api/auth/login`
**المدخلات:**
```json
{ "username": "admin", "password": "admin123" }
```
**الخرج (200):**
```json
{
  "user": { "id": "...", "fullName": "مدير النظام", "username": "admin", "role": "admin" },
  "token": "eyJhbGci..."
}
```
**+ Set-Cookie: auth-token=...**

**الأخطاء:** 400 (حقول ناقصة), 401 (بيانات خاطئة), 500 (خطأ خادم)

#### `POST /api/auth/logout`
**لا مدخلات.** يمسح الكوكي.

#### `GET /api/auth/me`
**يتطلب مصادقة.** يُرجع بيانات المستخدم الحالي.

---

### 5.2 المشتركون

#### `GET /api/subscribers`
**Parameters:** `?search=...&status=active&page=1&limit=50`
**الخرج:**
```json
{
  "subscribers": [...],
  "total": 4,
  "page": 1,
  "limit": 50
}
```

#### `POST /api/subscribers`
**المدخلات:**
```json
{
  "subscriberNumber": "68202000",
  "subscriberName": "مشترك جديد",
  "meterNumber": "87165000",
  "routeNumber": "13483",
  "cabinName": "الصبالية",
  "locationName": "شارع فلان",   // اختياري
  "phone": "0123456789",          // اختياري
  "notes": "ملاحظات"              // اختياري
}
```
**التحقق:**
- subscriberNumber فريد (خطأ: "رقم المشترك موجود مسبقاً")
- meterNumber فريد (خطأ: "رقم العداد موجود مسبقاً")
- جميع الحقول الأساسية مطلوبة

#### `GET /api/subscribers/:id`
**يُرجع تفاصيل المشترك مع قائمة فواتيره.**

#### `PUT /api/subscribers/:id`
**تعديل بيانات المشترك (أي حقل أو أكثر).**

---

### 5.3 الفواتير

#### `POST /api/invoices` (إنشاء فاتورة)
**المدخلات:**
```json
{
  "subscriberId": "cmnjk...",
  "periodFrom": "2026/04/01",
  "periodTo": "2026/04/30",
  "previousReading": 10000,
  "currentReading": 10500,
  "unitPrice": 220,
  "servicesAmount": 500,       // اختياري (افتراضي 0)
  "arrearsAmount": 1000,       // اختياري (افتراضي 0)
  "paidDuringPeriod": 5000,    // اختياري (افتراضي 0)
  "notes": "",                 // اختياري
  "statusAction": "issue"      // "issue" أو "draft"
}
```
**ما يحدث في الخادم:**
1. تحقق من المدخلات (القراءات، السعر، الفترة)
2. تحقق من عدم تكرار الفاتورة لنفس المشترك ونفس الفترة
3. حساب server-side: consumption, baseValue, grossAmount, netDue
4. تحويل المبلغ المستحق لكتابة عربية
5. إنشاء الفاتورة في قاعدة البيانات
6. إنشاء سجل تدقيق (AuditLog)

**التحقق:**
- `currentReading >= previousReading` (خطأ: "القراءة الحالية لا يمكن أن تكون أقل من القراءة السابقة")
- `unitPrice > 0` (خطأ: "سعر الكيلووات يجب أن يكون رقماً موجباً")
- لا يوجد فاتورة مسبقة لنفس المشترك ونفس الفترة (خطأ: "توجد فاتورة مسبقة لنفس المشترك ونفس الفترة")

#### `POST /api/invoices/calculate` (حساب فقط بدون إنشاء)
**المدخلات:**
```json
{
  "previousReading": 10000,
  "currentReading": 10500,
  "unitPrice": 220,
  "servicesAmount": 500,
  "arrearsAmount": 1000,
  "paidDuringPeriod": 5000
}
```
**الخرج:**
```json
{
  "consumptionKwh": 500,
  "baseValue": 110000,
  "grossAmount": 111500,
  "netDue": 106500,
  "netDueWords": "مائة وستة آلاف وخمسمائة ريال فقط لا غير"
}
```

#### `GET /api/invoices/:id/pdf` (توليد وتنزيل PDF)
**يتطلب مصادقة.** يُنشئ PDF من بيانات الفاتورة ويُرجعه كملف.

---

### 5.4 الإعدادات

#### `GET /api/settings`
**الخرج:**
```json
{
  "settings": {
    "organization_name": "محطة كهرباء الصبالية",
    "currency": "ريال",
    "default_unit_price": "220",
    "footer_note": "ملاحظة: المحطة غير مسؤولة عن تسليم أي مبلغ بدون سند رسمي",
    "invoice_title": "فاتورة استهلاك كهرباء"
  }
}
```

#### `PUT /api/settings`
**المدخلات:** كائن key-value لتحديث الإعدادات
**يتطلب دور admin.**

---

## 6. الصفحات والمكونات

### 6.1 التخطيط الجذري (`src/app/layout.tsx`)
- يضبط `<html lang="ar" dir="rtl">`
- يُحمّل PWA manifest و meta tags
- يُسجّل Service Worker عبر `ServiceWorkerRegistration`

### 6.2 صفحة تسجيل الدخول (`src/app/login/page.tsx`)
**نوع:** Client Component (`'use client'`)
- نموذج بـ username + password
- عند النجاح: يحفظ token في localStorage + يوجّه بـ `window.location.href`
- **هام:** يستخدم `window.location.href` بدلاً من `router.push()` لضمان إرسال الكوكي مع الطلب التالي

### 6.3 لوحة التحكم (`src/app/dashboard/page.tsx`)
**نوع:** Server Component مع `dynamic = 'force-dynamic'`
- يحسب الإحصائيات مباشرة من Prisma
- يعرض آخر 5 فواتير
- اختصارات سريعة (إضافة مشترك، إصدار فاتورة، الأرشيف)

### 6.4 الهيكل العام (`src/components/AppShell.tsx`)
**نوع:** Client Component
- القائمة الجانبية (sidebar) مع 5 عناصر تنقل
- شريط علوي مع زر القائمة للموبايل
- زر تسجيل الخروج يمسح cookie + localStorage

### 6.5 نموذج إصدار فاتورة (`src/components/InvoiceForm.tsx`)
**نوع:** Client Component
**الأقسام:**
1. **بحث واختيار المشترك** - dropdown بحث ديناميكي
2. **بيانات الفاتورة** - 8 حقول (فترة، قراءات، سعر، خدمات، متأخرات، مدفوع)
3. **النتائج المحسوبة** - تظهر تلقائياً (حساب فوري عبر API مع debounce 300ms)
4. **أزرار** - إصدار أو حفظ كمسودة أو إلغاء
5. **بعد الإصدار** - تنزيل PDF + فاتورة جديدة + الأرشيف

**السلوك التلقائي:**
- يجلب سعر الكيلووات الافتراضي من الإعدادات
- يحسب تلقائياً كلما تغيرت المدخلات (debounce 300ms)
- يدعم اختيار مشترك مسبقاً عبر `?subscriberId=...`

### 6.6 أرشيف الفواتير (`src/components/InvoiceArchive.tsx`)
**نوع:** Client Component
- بحث بالنص (رقم فاتورة، اسم مشترك، رقم مشترك)
- تصفية حسب الحالة (صادرة، مسودة، ملغاة)
- جدول مع أعمدة (رقم، مشترك، فترة، استهلاك، مستحق، حالة، إجراءات)
- زر تنزيل PDF لكل فاتورة

### 6.7 قائمة المشتركين (`src/components/SubscribersList.tsx`)
**نوع:** Client Component
- بحث بالاسم أو رقم المشترك أو رقم العداد
- جدول مع إجراءات (إصدار فاتورة، تفعيل/تعطيل)

### 6.8 نموذج مشترك جديد (`src/components/NewSubscriberForm.tsx`)
**الحقول:** رقم المشترك، الاسم، رقم العداد، خط السير، الكبينة، الموقع، الهاتف، ملاحظات

### 6.9 نموذج الإعدادات (`src/components/SettingsForm.tsx`)
- 5 حقول قابلة للتعديل
- حفظ عبر `PUT /api/settings`
- يتطلب دور admin

---

## 7. نظام الحسابات

### الملف: `src/lib/invoice-utils.ts`

### دالة `calculateInvoice(data)`
```
consumptionKwh = currentReading - previousReading
baseValue = consumptionKwh * unitPrice
grossAmount = baseValue + servicesAmount + arrearsAmount
netDue = grossAmount - paidDuringPeriod
```

### دالة `numberToArabicWords(num, currency)`
تحوّل أي رقم صحيح إلى كتابة عربية كاملة.

**الخوارزمية:**
1. تقسيم الرقم لمجموعات من 3 أرقام
2. تحويل كل مجموعة باستخدام مصفوفات (ones, tens, hundreds)
3. إضافة اسم المرتبة (ألف، مليون، مليار) مع مراعاة:
   - المفرد: `ألف` (للعدد 1)
   - المثنى: `ألفان` (للعدد 2)
   - الجمع: `آلاف` (للأعداد 3-10)
   - التنوين: `ألفاً` (للأعداد > 10)
4. إضافة العملة + "فقط لا غير"

**أمثلة:**
```
243,100 → "مائتان وثلاثة وأربعون ألفاً ومائة ريال فقط لا غير"
106,500 → "مائة وستة آلاف وخمسمائة ريال فقط لا غير"
0 → "صفر ريال فقط لا غير"
```

### دالة `generateInvoiceNumber()`
```
INV-{YYYY}-{MM}-{NNNN}
مثال: INV-2026-04-0523
```

---

## 8. توليد PDF

### الملف: `src/lib/pdf-generator.ts`

### الآلية:
1. بناء قالب HTML كامل مع CSS مضمّن
2. تشغيل Puppeteer (headless Chrome)
3. `page.setContent(html)` → تحميل HTML
4. `page.pdf({ format: 'A4' })` → توليد PDF
5. إغلاق المتصفح
6. إرجاع Buffer

### قالب الفاتورة يتضمن:
- **رأس:** عنوان الفاتورة + اسم الجهة + رقم الفاتورة
- **جدول بيانات المشترك:** رقم خط السير، رقم المشترك، الاسم، رقم العداد، الفترة، الكبينة
- **جدول القراءات:** القراءة السابقة، الحالية، الاستهلاك، القيمة، الخدمات، المتأخرات، المدفوع، المستحق
- **المبلغ كتابةً:** في صف كامل
- **ملاحظة ذيلية:** من الإعدادات
- **توقيعات:** المشترك + الموظف

### إعدادات PDF:
```typescript
{
  format: 'A4',
  printBackground: true,
  margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
}
```

### لتعديل قالب PDF:
عدّل متغير `html` داخل دالة `generateInvoicePDF()` في `src/lib/pdf-generator.ts`

---

## 9. PWA

### Manifest (`public/manifest.json`)
```json
{
  "name": "نظام فواتير الكهرباء",
  "short_name": "فواتير الكهرباء",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#1e40af",
  "theme_color": "#1e40af",
  "dir": "rtl",
  "lang": "ar",
  "icons": [
    { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker (`public/sw.js`)
**إستراتيجية التخزين:**
- **الأصول الثابتة** (icons, manifest, _next/static): Cache-first
- **صفحات التنقل**: Network-first مع fallback لـ offline.html
- **طلبات API**: لا تُخزّن أبداً (تمر مباشرة للخادم)
- **صفحات المصادقة** (/login, /dashboard, /): لا تُخزّن أبداً

**لماذا هذه الإستراتيجية؟**
- صفحات المصادقة يجب أن تكون طازجة دائماً
- API يجب أن تُرجع بيانات حقيقية
- الأصول الثابتة لا تتغير فيمكن تخزينها

### صفحة Offline (`public/offline.html`)
صفحة بسيطة بالعربية تظهر عند فقدان الاتصال.

### التسجيل (`src/components/ServiceWorkerRegistration.tsx`)
يُسجّل Service Worker عند تحميل التطبيق في المتصفح.

---

## 10. Middleware

### الملف: `src/middleware.ts`

### الوظيفة:
1. **حماية الصفحات:** يمنع الوصول بدون مصادقة لـ `/dashboard`, `/subscribers`, `/invoices`, `/settings`
2. **توجيه المصادقة:** يوجّه المستخدم المسجّل بعيداً عن `/login` إلى `/dashboard`
3. **دعم localStorage:** إذا وُجد token في header (من localStorage) بدون cookie، يُنشئ cookie

### المسارات المحمية:
```typescript
const PROTECTED_PATHS = ['/dashboard', '/subscribers', '/invoices', '/settings'];
const AUTH_PATHS = ['/login'];
```

---

## 11. البيانات التجريبية

### الملف: `prisma/seed.ts`

### ما يُنشئه:

**مستخدمان:**
| الاسم | المستخدم | الدور |
|-------|---------|------|
| مدير النظام | admin | admin |
| موظف الفوترة | clerk | clerk |

**3 مشتركين:**
| الرقم | الاسم | العداد | الكبينة |
|------|-------|--------|---------|
| 68201348 | موقع ام تي ان خط الجامعة | 87164754 | الصبالية |
| 68201500 | مسجد الرحمة | 87164800 | الصبالية |
| 68201601 | مدرسة النور الأساسية | 87164900 | الصبالية |

**فاتورة تجريبية واحدة:**
- INV-2026-03-0001 للمشترك 68201348
- الاستهلاك: 1,105 kWh
- المبلغ: 243,100 ريال (مطابق للنموذج المرجعي)

**5 إعدادات افتراضية:**
- اسم الجهة، العملة، سعر الكيلووات، ملاحظة الفاتورة، عنوان الفاتورة

---

## 12. ملفات الإعداد

### `.env` / `.env.example`
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="electricity-billing-secret-key-2026"
NEXT_PUBLIC_APP_NAME="نظام فواتير الكهرباء"
```

### `next.config.ts`
- يضيف header `Cache-Control: no-store` لجميع مسارات API

### `tsconfig.json`
- target: ES2017
- path alias: `@/*` → `./src/*`

### `package.json` - الأوامر:
```json
{
  "dev": "next dev",        // تشغيل التطوير
  "build": "npx prisma generate && next build",  // بناء الإنتاج
  "start": "next start",   // تشغيل الإنتاج
  "lint": "next lint"       // فحص الكود
}
```

### `.gitignore` يستثني:
```
node_modules/
.next/
.env
*.db
```

---

## 13. دليل التعديل والتوسعة

### إضافة حقل جديد لجدول:
1. عدّل `prisma/schema.prisma`
2. شغّل `npx prisma migrate dev --name add_new_field`
3. عدّل API route المعني
4. عدّل المكون المعني في `src/components/`

### إضافة صفحة جديدة:
1. أنشئ مجلد في `src/app/` باسم المسار
2. أنشئ `page.tsx` فيه
3. أضف `export const dynamic = 'force-dynamic'` إذا يحتاج مصادقة
4. أضف الرابط في `AppShell.tsx` → `navItems`

### إضافة API جديد:
1. أنشئ مجلد في `src/app/api/`
2. أنشئ `route.ts` فيه
3. استخدم `getCurrentUser()` للمصادقة
4. استخدم `prisma` للوصول لقاعدة البيانات

### تغيير قاعدة البيانات إلى PostgreSQL:
1. في `prisma/schema.prisma`: غيّر `provider = "sqlite"` إلى `provider = "postgresql"`
2. في `.env`: غيّر `DATABASE_URL` إلى رابط PostgreSQL
3. شغّل `npx prisma migrate dev --name switch_to_postgres`

### تعديل قالب PDF:
عدّل HTML/CSS في دالة `generateInvoicePDF()` بملف `src/lib/pdf-generator.ts`

### إضافة دور مستخدم جديد:
1. أنشئ المستخدم في seed أو عبر API
2. أضف فحص الدور في API routes: `if (user.role !== 'admin') return 403`

### إضافة حقل إعداد جديد:
1. أضفه في seed: `{ key: 'new_setting', value: 'default' }`
2. أضفه في `SettingsForm.tsx` → مصفوفة `fields`

---

## 14. المشاكل المعروفة والحلول

### 1. الكوكي لا يُحفظ عبر Proxy
**المشكلة:** `secure: true` يمنع الكوكي في بيئات HTTP-behind-HTTPS proxy
**الحل المطبق:** `secure: false` مع `sameSite: 'lax'`

### 2. router.push لا يُرسل الكوكي
**المشكلة:** `router.push()` في Next.js يستخدم client-side navigation بدون إعادة تحميل
**الحل المطبق:** `window.location.href` لإعادة تحميل كاملة

### 3. Prisma 7 لا يعمل مع seed
**المشكلة:** Prisma 7 يولّد ESM client لا يتوافق مع CommonJS seed scripts
**الحل المطبق:** استخدام Prisma 5 المستقر

### 4. Puppeteer يحتاج مكتبات نظام
**المشكلة:** Chromium يحتاج مكتبات مشتركة (libnspr4, etc.)
**الحل:** تثبيت: `apt-get install -y chromium-browser` أو `npx puppeteer browsers install chrome`

### 5. Service Worker يخزّن صفحات مصادقة
**المشكلة:** تخزين `/login` أو `/dashboard` يسبب مشاكل مصادقة
**الحل المطبق:** استثناء هذه الصفحات من التخزين في sw.js

---

## 15. ما تم تنفيذه وما تم تأجيله

### تم تنفيذه (MVP كامل):
- [x] تسجيل دخول/خروج مع JWT
- [x] لوحة تحكم مع إحصائيات
- [x] إدارة المشتركين (إضافة، بحث، تفعيل/تعطيل)
- [x] إصدار فاتورة مع حسابات تلقائية
- [x] تحويل أرقام إلى كتابة عربية
- [x] توليد PDF احترافي (A4, RTL)
- [x] أرشيف فواتير مع بحث وتصفية وتنزيل PDF
- [x] إعدادات النظام قابلة للتعديل
- [x] PWA: Manifest + Service Worker + Offline page
- [x] واجهة عربية RTL كاملة بتصميم حديث
- [x] Middleware لحماية الصفحات
- [x] سجل تدقيق (AuditLog)
- [x] قواعد عمل (منع تكرار، تحقق قراءات، إلخ)
- [x] بيانات تجريبية (seed)
- [x] توثيق كامل

### تم تأجيله (تحسينات مستقبلية):
- [ ] RBAC تفصيلي (صلاحيات حسب الصفحة/الإجراء)
- [ ] تصدير تقارير Excel/CSV
- [ ] مزامنة offline (Background Sync)
- [ ] إشعارات (push notifications)
- [ ] حذف/تعديل فاتورة
- [ ] تاريخ الدفعات لكل مشترك
- [ ] الانتقال لـ PostgreSQL
- [ ] Docker compose للنشر
- [ ] اختبارات وحدة (unit tests)
- [ ] اختبارات تكامل (integration tests)
- [ ] إنتاج فواتير بالجملة
- [ ] تعدد العملات
- [ ] نظام الإصدارات / backup تلقائي

---

## ملاحظات للوكيل (Agent Notes)

1. **كل الصفحات المحمية** تحتوي على `export const dynamic = 'force-dynamic'` لمنع التخزين المؤقت
2. **عند إضافة API جديد:** استخدم `getCurrentUser()` دائماً للتحقق من المصادقة
3. **عند تعديل schema.prisma:** لا تنسَ `npx prisma migrate dev`
4. **عند تعديل seed.ts:** يمكن إعادة التشغيل بـ `rm prisma/dev.db && npx prisma migrate dev && npx tsx prisma/seed.ts`
5. **قاعدة البيانات SQLite:** ملف `prisma/dev.db` - يمكن فحصه بـ `npx prisma studio`
6. **بناء الإنتاج:** `npm run build` يشغّل `prisma generate` تلقائياً ثم `next build`
7. **اللغة:** جميع رسائل الخطأ بالعربية في API responses
8. **الخطوط:** يعتمد على Segoe UI / Tahoma / Arial المتوفرة على معظم الأنظمة

</div>
