<div dir="rtl" align="right">

# نظام فواتير كهرباء PWA

> نظام ويب تقدمي (PWA) متكامل لإدارة وإصدار فواتير استهلاك الكهرباء - بالعربية RTL

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)](https://typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-5-purple)](https://prisma.io/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-4-cyan)](https://tailwindcss.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-green)]()

---

## نظرة عامة

نظام فواتير كهرباء PWA هو تطبيق ويب تقدمي كامل الوظائف مصمم خصيصاً لمحطات الكهرباء الصغيرة والمتوسطة. يدعم اللغة العربية بالكامل مع اتجاه RTL، ويوفر:

- إدارة المشتركين (إضافة، بحث، تفعيل/تعطيل)
- إصدار الفواتير مع حسابات تلقائية
- تحويل المبالغ إلى كتابة عربية
- توليد فواتير PDF احترافية
- أرشفة وبحث الفواتير
- دعم PWA (تثبيت، عمل بدون اتصال)
- نظام مصادقة بـ JWT
- سجل تدقيق لجميع العمليات

---

## المتطلبات

| المتطلب | الإصدار المطلوب |
|---------|----------------|
| Node.js | 18+ (يُنصح بـ 20+) |
| npm | 9+ |
| متصفح حديث | Chrome, Edge, Firefox, Safari |

> **ملاحظة:** لا حاجة لخادم قاعدة بيانات منفصل - النظام يستخدم SQLite عبر Prisma.

---

## التشغيل السريع

```bash
# 1. استنساخ المشروع
git clone https://github.com/moain2026/electricity-billing-pwa.git
cd electricity-billing-pwa

# 2. تثبيت الحزم
npm install

# 3. إعداد ملف البيئة
cp .env.example .env

# 4. إنشاء قاعدة البيانات وتطبيق المخططات
npx prisma migrate dev --name init

# 5. إضافة البيانات التجريبية
npx tsx prisma/seed.ts

# 6. بناء المشروع
npm run build

# 7. تشغيل الخادم
npm start
```

ثم افتح المتصفح على: **http://localhost:3000**

---

## بيانات الدخول التجريبية

| الدور | اسم المستخدم | كلمة المرور |
|------|-------------|------------|
| مدير النظام | `admin` | `admin123` |
| موظف الفوترة | `clerk` | `clerk123` |

---

## الصفحات والوظائف

### 1. تسجيل الدخول (`/login`)
- إدخال اسم المستخدم وكلمة المرور
- مصادقة عبر JWT في HTTP-only cookies
- توجيه تلقائي للوحة التحكم

### 2. لوحة التحكم (`/dashboard`)
- إحصائيات سريعة (المشتركون، الفواتير، المسودات)
- آخر الفواتير المصدرة
- اختصارات سريعة (إضافة مشترك، إصدار فاتورة، الأرشيف)

### 3. إدارة المشتركين (`/subscribers`)
- قائمة المشتركين مع بحث
- إضافة مشترك جديد (`/subscribers/new`)
- تفعيل/تعطيل المشتركين
- إصدار فاتورة مباشرة من القائمة

### 4. إصدار فاتورة (`/invoices/new`)
- اختيار المشترك بالبحث
- إدخال القراءات والفترة
- حسابات تلقائية فورية
- تحويل المبلغ المستحق إلى كتابة عربية
- حفظ كمسودة أو إصدار مباشر
- تنزيل PDF فوري بعد الإصدار

### 5. أرشيف الفواتير (`/invoices/archive`)
- قائمة جميع الفواتير مع بحث وتصفية
- تصفية حسب الحالة (صادرة، مسودة، ملغاة)
- تنزيل PDF لأي فاتورة

### 6. الإعدادات (`/settings`)
- اسم الجهة / المحطة
- عنوان الفاتورة
- العملة
- سعر الكيلووات الافتراضي
- ملاحظة الفاتورة

---

## الحسابات التلقائية

| الحقل | الصيغة |
|------|--------|
| فرق الاستهلاك (kWh) | القراءة الحالية - القراءة السابقة |
| القيمة الأساسية | الاستهلاك × سعر الكيلووات |
| المبلغ الإجمالي | القيمة + الخدمات + المتأخرات |
| المبلغ المستحق | الإجمالي - المدفوع خلال الفترة |
| المبلغ كتابةً | تحويل تلقائي للعربية |

**مثال:**
```
القراءة السابقة: 24,149 | القراءة الحالية: 25,254
الاستهلاك: 1,105 kWh | سعر الكيلووات: 220 ريال
القيمة: 243,100 ريال
كتابةً: "مائتان وثلاثة وأربعون ألفاً ومائة ريال فقط لا غير"
```

---

## قواعد العمل (Business Rules)

1. **القراءة الحالية >= السابقة** - لا يُقبل استهلاك سالب
2. **سعر الكيلووات > 0** - يجب أن يكون رقماً موجباً
3. **منع تكرار الفاتورة** - لنفس المشترك ونفس الفترة
4. **منع تكرار رقم المشترك** - فريد في النظام
5. **منع تكرار رقم العداد** - فريد في النظام
6. **الحسابات server-side** - تتم على الخادم لضمان الدقة

---

## البنية التقنية

```
electricity-billing-pwa/
├── prisma/                    # قاعدة البيانات
│   ├── schema.prisma          # مخطط الجداول
│   ├── seed.ts                # بيانات تجريبية
│   └── migrations/            # ملفات الترحيل
├── public/                    # ملفات عامة
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service Worker
│   ├── offline.html           # صفحة بدون اتصال
│   └── icons/                 # أيقونات PWA
├── src/
│   ├── app/                   # صفحات Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── auth/          # مصادقة (login, logout, me)
│   │   │   ├── invoices/      # فواتير (CRUD, PDF, calculate)
│   │   │   ├── subscribers/   # مشتركون (CRUD)
│   │   │   └── settings/      # إعدادات (GET, PUT)
│   │   ├── dashboard/         # لوحة التحكم
│   │   ├── invoices/          # صفحات الفواتير
│   │   ├── subscribers/       # صفحات المشتركين
│   │   ├── settings/          # صفحة الإعدادات
│   │   └── login/             # تسجيل الدخول
│   ├── components/            # مكونات React
│   │   ├── AppShell.tsx       # الهيكل العام + القائمة الجانبية
│   │   ├── InvoiceForm.tsx    # نموذج إصدار فاتورة
│   │   ├── InvoiceArchive.tsx # أرشيف الفواتير
│   │   ├── SubscribersList.tsx # قائمة المشتركين
│   │   ├── NewSubscriberForm.tsx # نموذج مشترك جديد
│   │   └── SettingsForm.tsx   # نموذج الإعدادات
│   ├── lib/                   # مكتبات مساعدة
│   │   ├── auth.ts            # مصادقة JWT + cookies
│   │   ├── prisma.ts          # عميل Prisma
│   │   ├── invoice-utils.ts   # حسابات + تحويل أرقام لعربية
│   │   └── pdf-generator.ts   # توليد PDF بـ Puppeteer
│   └── middleware.ts          # حماية الصفحات
├── .env.example               # نموذج متغيرات البيئة
├── DECISIONS.md               # القرارات الهندسية
├── DOCUMENTATION.md           # التوثيق التفصيلي الكامل
└── package.json               # تبعيات المشروع
```

---

## التقنيات المستخدمة

| التقنية | الاستخدام |
|---------|----------|
| **Next.js 16** | إطار العمل الكامل (SSR + API) |
| **React 19** | واجهة المستخدم |
| **TypeScript 5** | أمان الأنواع |
| **Tailwind CSS 4** | التنسيق + RTL |
| **Prisma 5** | ORM لقاعدة البيانات |
| **SQLite** | قاعدة بيانات مدمجة |
| **Puppeteer** | توليد PDF |
| **bcryptjs** | تشفير كلمات المرور |
| **jsonwebtoken** | مصادقة JWT |
| **PWA** | Service Worker + Manifest |

---

## نقاط API

| المسار | الطريقة | الوصف |
|--------|---------|------|
| `/api/auth/login` | POST | تسجيل الدخول |
| `/api/auth/logout` | POST | تسجيل الخروج |
| `/api/auth/me` | GET | المستخدم الحالي |
| `/api/subscribers` | GET | قائمة المشتركين |
| `/api/subscribers` | POST | إضافة مشترك |
| `/api/subscribers/:id` | GET | تفاصيل مشترك |
| `/api/subscribers/:id` | PUT | تعديل مشترك |
| `/api/invoices` | GET | قائمة الفواتير |
| `/api/invoices` | POST | إنشاء فاتورة |
| `/api/invoices/:id` | GET | تفاصيل فاتورة |
| `/api/invoices/:id/pdf` | GET | تنزيل PDF |
| `/api/invoices/calculate` | POST | حساب فاتورة |
| `/api/settings` | GET | عرض الإعدادات |
| `/api/settings` | PUT | تحديث الإعدادات |

---

## النشر في الإنتاج

### متطلبات الإنتاج
1. تغيير `JWT_SECRET` في `.env` لقيمة آمنة
2. إعداد HTTPS (لدعم PWA الكامل)
3. اختياري: الانتقال لـ PostgreSQL (تغيير provider في `prisma/schema.prisma`)

### النشر على VPS
```bash
# بناء الإنتاج
npm run build

# تشغيل
NODE_ENV=production npm start
```

### النشر على Docker
```bash
# بناء الصورة
docker build -t electricity-billing .

# تشغيل
docker run -p 3000:3000 electricity-billing
```

---

## الرخصة

هذا المشروع للاستخدام الداخلي. جميع الحقوق محفوظة.

---

## للمطورين

راجع ملف **[DOCUMENTATION.md](./DOCUMENTATION.md)** للتوثيق التفصيلي الكامل الذي يشرح كل ملف وكل وظيفة في المشروع.

</div>
