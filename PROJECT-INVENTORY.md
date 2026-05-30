# GearForge Project Inventory

This document explains what this project contains, what features already exist, what pages are available, and what parts are worth keeping or changing while converting it into your own gaming peripherals ecommerce store.

## 1. High-Level Summary

This is a full-stack ecommerce project with:

- Next.js App Router frontend
- Separate Express backend API
- MySQL database through Prisma
- Customer storefront
- Admin dashboard
- Product/category/merchant/order management
- CSV bulk product upload
- User login/register with NextAuth credentials
- Cart and checkout flow
- Notifications system
- Theme system with white and dark modes

The project is a good base for a custom ecommerce MVP, especially if you want to learn and own the code. It is not yet a complete production platform like Shopify/OpenCart/Vendure because it lacks mature payments, shipping rules, coupons, product variants, returns, advanced inventory, and polished admin permissions.

## 2. How The App Runs

Main command:

```powershell
npm run dev
```

This runs:

- Prisma client generation
- Express backend on `http://localhost:3001`
- Next.js frontend on `http://localhost:3000`

The combined launcher is:

```text
index.js
```

Important scripts in `package.json`:

- `dev`: runs frontend and backend together
- `dev:frontend`: runs only Next.js frontend
- `dev:backend`: runs only Express backend
- `build`: Prisma generate + Next build
- `db:push`: pushes Prisma schema to MySQL
- `db:studio`: opens Prisma Studio

## 3. Environment And Database

The project expects a root `.env` file.

Example:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001
NODE_ENV=development
DATABASE_URL="mysql://root:password@localhost:3306/gaming_peripherals?sslmode=disabled"
NEXTAUTH_SECRET=change-this-secret-before-production
NEXTAUTH_URL=http://localhost:3000
FRONTEND_URL=http://localhost:3000
```

The database provider is MySQL:

```text
prisma/schema.prisma
server/prisma/schema.prisma
```

Important note: there are two Prisma schema copies, one in root and one in `server`. They currently match. Long term, it would be cleaner to keep one schema source.

## 4. Frontend Structure

Main frontend folder:

```text
app/
components/
lib/
utils/
hooks/
types/
```

The project uses Next.js App Router. Pages are file-system routes under `app`.

## 5. Public Customer Pages

### Home Page

File:

```text
app/page.tsx
```

Current sections:

- `Hero`
- `CategoryMenu`
- `ProductsSection`

The home page has been converted toward GearForge/gaming peripherals:

- slideshow-style hero
- quick category blocks
- featured products section
- white/dark theme support

Main components:

- `components/Hero.tsx`
- `components/CategoryMenu.tsx`
- `components/CategoryItem.tsx`
- `components/ProductsSection.tsx`
- `components/ProductItem.tsx`

### Shop Page

File:

```text
app/shop/[[...slug]]/page.tsx
```

Supports:

- all products view
- category slug page, for example `/shop/mouses`
- filters sidebar
- sort dropdown
- pagination
- product grid

Main components:

- `components/Filters.tsx`
- `components/Products.tsx`
- `components/SortBy.tsx`
- `components/Pagination.tsx`
- `components/Breadcrumb.tsx`

Current filters:

- price max
- rating minimum
- in stock / out of stock
- category through URL slug

Current sorts:

- default
- title A-Z
- title Z-A
- low price
- high price

### Product Detail Page

File:

```text
app/product/[productSlug]/page.tsx
```

Features:

- fetch product by slug
- display main product image
- display additional images if available
- show product title and price
- stock availability
- quantity / dynamic fields
- add to cart
- buy now
- product tabs
- payment logos
- social share icons

Main components:

- `StockAvailabillity`
- `UrgencyText`
- `ProductTabs`
- `SingleProductDynamicFields`
- `AddToCartSingleProductBtn`
- `BuyNowSingleProductBtn`

### Search Page

File:

```text
app/search/page.tsx
```

Search is triggered by the header search bar. It calls backend search APIs and displays product results.

Main component:

```text
components/SearchInput.tsx
```

### Cart Page

File:

```text
app/cart/page.tsx
```

Features:

- cart items from Zustand store
- quantity adjustment
- remove item
- subtotal
- shipping estimate
- tax estimate
- order total
- checkout link

Main component:

```text
components/modules/cart/index.tsx
```

State store:

```text
app/_zustand/store.ts
```

### Checkout Page

File:

```text
app/checkout/page.tsx
```

Features:

- contact info form
- shipping address form
- order summary
- client-side validation
- creates customer order through backend
- creates order-product records
- clears cart after success
- redirects home after order
- creates user notification if user account exists

No real payment gateway is integrated. Payment is manual: the page says the customer will be contacted for payment.

### Login Page

File:

```text
app/login/page.tsx
```

Features:

- credentials login with email/password
- NextAuth sign-in
- session expired message support
- Google/GitHub buttons exist in UI, but OAuth providers are commented out in auth config

Actual working provider:

- Credentials provider

### Register Page

File:

```text
app/register/page.tsx
```

Features:

- registration form
- email/password validation
- calls `/api/register`
- redirects to login on success

Important limitation:

- Name/lastname fields exist in UI but the database `User` model only stores email/password/role.

### Notifications Page

File:

```text
app/notifications/page.tsx
```

Features:

- list notifications for user
- filter/search notifications
- unread counts
- mark read / bulk actions
- delete notifications

Related components:

- `NotificationBell`
- `NotificationCard`

### Error Pages

Files:

```text
app/not-found.tsx
app/product/not-found.tsx
app/error.tsx
```

These handle generic 404, product 404, and runtime errors.

## 6. Layout, Header, Footer, Theme

### Root Layout

File:

```text
app/layout.tsx
```

Includes:

- global CSS
- session provider
- session timeout wrapper
- header
- footer
- toast provider

### Header

Files:

```text
components/Header.tsx
components/HeaderTop.tsx
```

Header includes:

- brand/logo text
- search bar
- notification bell
- wishlist icon
- cart icon
- login/register or logout
- theme selector

### Theme System

Files:

```text
components/ThemeSelector.tsx
app/globals.css
```

Themes:

- White theme: default customer theme
- Dark theme: alternate mode

Theme selector:

- icon button in top bar
- sun icon for white
- moon icon for dark
- saves choice in `localStorage`

Global CSS also includes compatibility overrides for old Tailwind classes like:

- `bg-white`
- `bg-blue-500`
- `text-gray-900`
- `border-gray-300`
- inputs/selects/textareas

This helps old pages and admin screens follow the selected theme without editing every page.

## 7. Admin Dashboard Pages

Admin routes are under:

```text
app/(dashboard)/admin/
```

Admin access is protected by:

```text
app/(dashboard)/layout.tsx
utils/adminAuth.ts
middleware.ts
```

Admin users need:

```text
User.role = "admin"
```

### Admin Home

File:

```text
app/(dashboard)/admin/page.tsx
```

Dashboard overview page. Uses stats/card-style components.

### Admin Products

Files:

```text
app/(dashboard)/admin/products/page.tsx
app/(dashboard)/admin/products/new/page.tsx
app/(dashboard)/admin/products/[id]/page.tsx
```

Features:

- list products
- create product
- edit product
- delete product
- choose category
- choose merchant/supplier
- upload/select main image
- set price, manufacturer, stock, slug, description

Important limitation:

- No product variants/SKUs.
- No flexible specs table.
- No brand table yet.
- Images are basic.

### Admin Categories

Files:

```text
app/(dashboard)/admin/categories/page.tsx
app/(dashboard)/admin/categories/new/page.tsx
app/(dashboard)/admin/categories/[id]/page.tsx
```

Features:

- list categories
- create category
- edit category
- delete category

Important limitation:

- categories are flat only
- no parent/child hierarchy
- no slug/image/SEO fields in database

### Admin Orders

Files:

```text
app/(dashboard)/admin/orders/page.tsx
app/(dashboard)/admin/orders/[id]/page.tsx
```

Features:

- list customer orders
- view order detail
- edit/update order
- delete order
- order status support

Related backend:

```text
server/controllers/customer_orders.js
server/controllers/customer_order_product.js
```

### Admin Users

Files:

```text
app/(dashboard)/admin/users/page.tsx
app/(dashboard)/admin/users/new/page.tsx
app/(dashboard)/admin/users/[id]/page.tsx
```

Features:

- list users
- create user
- edit user
- delete user
- role support through user `role`

Known issue:

- `app/(dashboard)/admin/users/new/page.tsx` has a TypeScript typo/error from the original project: `ap` is referenced.

### Admin Merchants

Files:

```text
app/(dashboard)/admin/merchant/page.tsx
app/(dashboard)/admin/merchant/new/page.tsx
app/(dashboard)/admin/merchant/[id]/page.tsx
```

This is basically supplier/vendor management.

Features:

- list merchants
- create merchant
- edit merchant
- delete merchant if no products are attached
- view merchant products

For your gaming peripherals store, rename this concept to:

- Suppliers
- Vendors
- Distributors

### Admin Bulk Upload

File:

```text
app/(dashboard)/admin/bulk-upload/page.tsx
```

Features:

- upload CSV
- validate rows
- create products from CSV
- store upload batches
- view upload history
- delete batch
- optionally delete uploaded products with batch

Related docs:

```text
BULK-UPLOAD-GUIDE.md
BULK-UPLOAD-QUICK-REFERENCE.md
BULK-UPLOAD-EXPLANATION.md
DELETE-BULK-UPLOAD-GUIDE.md
TROUBLESHOOTING-DELETE-BATCH.md
```

CSV files:

```text
product-template.csv
product-template-ready.csv
product-template-blank.csv
bulk-upload-example.csv
bulk-upload-template-blank.csv
```

## 8. Backend API

Backend entry:

```text
server/app.js
```

Backend runs on:

```text
http://localhost:3001
```

Health check:

```text
GET /health
```

### API Route Groups

Mounted routes:

```text
/api/products
/api/categories
/api/images
/api/main-image
/api/users
/api/search
/api/orders
/api/order-product
/api/slugs
/api/notifications
/api/merchants
/api/bulk-upload
```

### Product API

Files:

```text
server/routes/products.js
server/controllers/products.js
```

Features:

- get products
- admin product list mode
- filter by price, rating, stock, category
- sort by title or price
- pagination
- create product
- update product
- delete product
- search products
- get product by ID

### Category API

Files:

```text
server/routes/category.js
server/controllers/category.js
```

Features:

- create category
- update category
- delete category
- get category
- get all categories

### Merchant API

Files:

```text
server/routes/merchant.js
server/controllers/merchant.js
```

Features:

- CRUD merchants
- include products for merchant
- block delete when merchant has products

### Orders API

Files:

```text
server/routes/customer_orders.js
server/controllers/customer_orders.js
server/routes/customer_order_product.js
server/controllers/customer_order_product.js
```

Features:

- create customer order
- validate order data
- duplicate order protection
- get orders with pagination
- update order
- delete order
- create order-product records
- create notifications for logged-in users

### Notifications API

Files:

```text
server/routes/notifications.js
server/controllers/notificationController.js
```

Features:

- get user notifications
- filter by type/read/search
- pagination
- create notification
- mark read/unread
- bulk mark read
- delete single
- bulk delete
- unread count

### Bulk Upload API

Files:

```text
server/routes/bulkUpload.js
server/controllers/bulkUpload.js
server/services/bulkUploadService.js
```

Features:

- CSV upload
- row validation
- product creation
- upload batch records
- batch item records
- batch detail
- update batch items
- delete batch
- delete products created by batch if safe

### Image Upload API

Files:

```text
server/routes/mainImages.js
server/controllers/mainImages.js
server/routes/productImages.js
server/controllers/productImages.js
```

Features:

- upload main product image
- upload/manage product images

Important limitation:

- File/image handling is basic and should be reviewed before production.

### Users API

Files:

```text
server/routes/users.js
server/controllers/users.js
```

Features:

- user lookup
- create/update/delete users
- user lookup by email
- role field support

## 9. Authentication And Authorization

Main auth file:

```text
app/api/auth/[...nextauth]/route.ts
```

Auth system:

- NextAuth
- Credentials provider
- bcrypt password comparison
- JWT sessions
- 15-minute session lifetime
- role stored in token/session

OAuth:

- Google/GitHub imports exist
- provider configs are commented out
- UI buttons exist, but OAuth is not active unless configured

Admin protection:

- `utils/adminAuth.ts` checks server session
- `middleware.ts` checks `/admin/:path*`
- user must have role `admin`

Admin helper scripts:

```text
server/createAdminUser.js
server/makeUserAdmin.js
server/listUsers.js
```

## 10. Database Models

Main schema:

```text
prisma/schema.prisma
```

### Product

Fields:

- id
- slug
- title
- mainImage
- price
- rating
- description
- manufacturer
- inStock
- categoryId
- merchantId

Relationships:

- belongs to Category
- belongs to Merchant
- has order items
- has wishlist items
- has bulk upload items

### Category

Fields:

- id
- name

Relationships:

- has products

Limitation:

- no hierarchy
- no slug
- no image
- no sort order

### Merchant

Fields:

- id
- name
- description
- email
- phone
- address
- status
- createdAt
- updatedAt

Relationships:

- has products

### User

Fields:

- id
- email
- password
- role

Relationships:

- wishlist
- notifications
- bulk upload batches

### Customer_order

Fields:

- id
- name
- lastname
- phone
- email
- company
- adress
- apartment
- postalCode
- dateTime
- status
- city
- country
- orderNotice
- total

Relationships:

- has order products

### customer_order_product

Join table between:

- Customer_order
- Product

Fields:

- id
- customerOrderId
- productId
- quantity

### Wishlist

Fields:

- id
- productId
- userId

Important note:

- Backend wishlist route is commented out in `server/app.js`, so wishlist may not fully work.

### Notification

Fields:

- id
- userId
- title
- message
- type
- isRead
- priority
- metadata
- createdAt
- updatedAt

Indexes:

- userId
- userId + isRead
- userId + type
- createdAt

### Bulk Upload

Models:

- `bulk_upload_batch`
- `bulk_upload_item`

Purpose:

- store CSV upload history
- store success/error status for each uploaded row
- link uploaded rows to created products

## 11. State Management

Zustand stores:

```text
app/_zustand/store.ts
app/_zustand/wishlistStore.ts
app/_zustand/sortStore.ts
app/_zustand/paginationStore.ts
app/_zustand/notificationStore.ts
```

Used for:

- cart products
- wishlist count/items
- shop sort selection
- shop pagination
- notification state

## 12. Security / Reliability Features

Backend includes:

- CORS allowlist
- request IDs
- request logging
- error logging
- security logging
- general rate limiter
- auth limiter
- upload limiter
- search limiter
- order limiter
- centralized error handler
- input validation for filters/orders/bulk upload

Files:

```text
server/middleware/requestLogger.js
server/middleware/rateLimiter.js
server/middleware/advancedRateLimiter.js
server/utills/errorHandler.js
server/utills/validation.js
```

## 13. Theme / Branding Work Already Done

Current brand direction:

- GearForge
- gaming peripherals
- white theme as main customer theme
- dark theme as alternate
- red accent color

Theme files/components:

```text
app/globals.css
components/ThemeSelector.tsx
components/Header.tsx
components/HeaderTop.tsx
components/Footer.tsx
components/Hero.tsx
```

Categories were changed toward:

- Gaming Mice
- Keyboards
- Headsets
- Controllers
- Microphones
- Gaming Laptops
- Gaming PCs
- Mousepads
- Earbuds
- Monitors

Stored in:

```text
lib/utils.ts
```

## 14. Product Assets

Product and category assets live in:

```text
public/
```

Current assets are mixed:

- electronics sample products
- mice/headphones/PC/laptop images
- old logos
- payment logos
- placeholders

For a real gaming peripherals shop, replace or clean:

- old Singitronic logos
- unrelated electronics assets
- old apartment/service images
- printer/tablet/camera assets if not needed

## 15. Known Issues And Technical Debt

### TypeScript Build Issues

`npx tsc --noEmit` currently fails due to existing issues:

- NextAuth imports/types mismatch
- `authOptions` exported from route file conflicts with Next route type checks
- `app/(dashboard)/admin/users/new/page.tsx` references `ap`
- missing components:
  - `WishItem`
  - `RatingPercentElement`
  - `SingleReview`
- Prisma client typing issue in some TS files

### Wishlist Not Fully Wired

The backend wishlist route is commented out:

```text
server/app.js
```

So wishlist UI exists, Zustand state exists, but full backend wishlist persistence may not work.

### Product Catalog Too Simple

For gaming peripherals, current Product model is too basic.

Missing:

- brand table
- product variants/SKUs
- product specs/attributes
- product gallery relation with Prisma
- stock movement/history
- sale price/discounts
- warranty info
- product tags
- SEO fields

### Category Model Too Simple

Current category only has:

- id
- name

Better ecommerce category should have:

- parentId
- slug
- image
- sortOrder
- status
- metaTitle
- metaDescription

### Payments Are Not Real

Checkout creates an order but does not charge the customer.

Need later:

- Stripe
- PayPal
- cash on delivery
- manual bank transfer
- payment status tracking

### Admin UI Is Functional But Not Polished

Admin pages exist but need design/UX cleanup:

- forms are basic
- tables are basic
- permissions are simple
- no activity log
- no dashboard analytics beyond basic UI

### Duplicated Backend/Frontend Concepts

There are root utils and server utils. Some overlap exists:

```text
utils/
server/utills/
```

The word `utills` is misspelled in server folder but used by imports, so do not rename casually unless you update all imports.

## 16. What To Keep

Good things to keep:

- Next.js frontend structure
- Express API separation
- Prisma/MySQL setup
- Admin dashboard route structure
- Product/category/order/user CRUD foundations
- Bulk upload system
- Merchant/supplier system
- Cart/checkout basic flow
- Notification model/API
- Theme system
- Rate limiting/logging middleware

## 17. What To Convert For Gaming Peripherals

Recommended database additions:

```text
Brand
ProductVariant
ProductSpec
ProductImage relation
Category parent hierarchy
InventoryMovement
Coupon
Payment
ShippingMethod
```

Recommended product fields/specs:

Mice:

- DPI
- sensor
- weight
- connection type
- polling rate
- buttons

Keyboards:

- layout
- switch type
- hot-swappable
- connection type
- RGB
- keycap material

Headsets:

- driver size
- surround support
- microphone type
- connection type
- compatibility

Monitors:

- size
- refresh rate
- resolution
- panel type
- response time

Controllers:

- platform compatibility
- wired/wireless
- battery life

## 18. Suggested Next Steps

Best next order:

1. Fix TypeScript/build errors.
2. Decide final database schema for gaming peripherals.
3. Add brands and product specs.
4. Add product variants/SKUs.
5. Clean old assets and logos.
6. Rename Merchant to Supplier if that better matches your business.
7. Fix wishlist backend route.
8. Improve admin product forms around gaming specs.
9. Add real payment/payment status.
10. Add shipping rules.
11. Add seed data for gaming categories/products.

## 19. Important URLs

Frontend:

```text
http://localhost:3000
```

Backend:

```text
http://localhost:3001
```

Backend health:

```text
http://localhost:3001/health
```

Admin:

```text
http://localhost:3000/admin
```

Login:

```text
http://localhost:3000/login
```

Shop:

```text
http://localhost:3000/shop
```

Prisma Studio:

```powershell
npm run db:studio
```

## 20. Quick Verdict

This project has enough to become your own gaming peripherals ecommerce site, especially as a custom MVP with admin. The best parts are the admin structure, MySQL/Prisma backend, product/order/category foundations, and bulk upload system.

The biggest conversion work is catalog depth: gaming products need brands, variants, and specs. If you add those carefully, this can become a solid custom store.
