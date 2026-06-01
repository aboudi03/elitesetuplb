# 📦 Bulk Upload Product Explanation

## 🎯 What is Bulk Upload?

Bulk upload is a feature for creating many products at once using a CSV file, without manual entry for each product.

---

## 📊 Bulk Upload Data Flow

### 1️⃣ Data Stored in the Database

When you upload a CSV with 5 products and the upload completes successfully, the system stores data in these tables:

#### **Product Table**

```sql
SELECT * FROM Product WHERE id IN (
  SELECT productId FROM bulk_upload_item
  WHERE batchId = 'bbd17cc8-b714-489a-9b54-14c859b19b6e'
);
```

Result: 5 new products are added to the catalog.

- Samsung Galaxy S24 Ultra
- Apple MacBook Pro 16-inch M3
- Sony WH-1000XM5 Wireless Headphones
- LG OLED C3 55-inch 4K Smart TV
- Canon EOS R6 Mark II Mirrorless Camera

#### **bulk_upload_batch Table**

```sql
id: bbd17cc8-b714-489a-9b54-14c859b19b6e
fileName: bulk-upload-example.csv
status: COMPLETED
itemCount: 5
errorCount: 0
createdAt: 2025-10-12 22:38:00
```

#### **bulk_upload_item Table**

```sql
-- 5 records with:
status: CREATED
productId: [UUID of created product]
error: NULL (success)
```

---

## 🔄 Bulk Upload CRUD Overview

### **C - CREATE** ✅

**From the UI Dashboard**

1. Open http://localhost:3000/admin/bulk-upload
2. Upload the CSV file
3. Review the upload results in Upload History

**From the API**

```bash
curl -X POST http://localhost:3001/api/bulk-upload -F "file=@bulk-upload-example.csv"
```

**Response**:

```json
{
  "batchId": "uuid",
  "status": "COMPLETED",
  "total": 5,
  "created": 5,
  "errors": 0
}
```

---

### **R - READ** ✅

#### **1. List Upload Batches**

```bash
GET http://localhost:3001/api/bulk-upload
```

**Sample Response**:

```json
{
  "batches": [
    {
      "id": "uuid",
      "fileName": "bulk-upload-example.csv",
      "totalRecords": 5,
      "successfulRecords": 5,
      "failedRecords": 0,
      "status": "COMPLETED",
      "uploadedBy": "Admin",
      "uploadedAt": "2025-10-12T22:38:00.000Z",
      "errors": []
    }
  ]
}
```

#### **2. Get Batch Details**

```bash
GET http://localhost:3001/api/bulk-upload/{batchId}
```

**Sample Response**:

```json
{
  "batch": {
    "id": "uuid",
    "fileName": "bulk-upload-example.csv",
    "status": "COMPLETED",
    "itemCount": 5,
    "errorCount": 0
  },
  "items": [
    {
      "id": "item-uuid-1",
      "batchId": "batch-uuid",
      "productId": "product-uuid-1",
      "title": "Samsung Galaxy S24 Ultra",
      "slug": "samsung-galaxy-s24-ultra",
      "price": 1299.99,
      "status": "CREATED",
      "error": null,
      "product": {
        /* product detail */
      }
    }
    // ... 4 more items
  ]
}
```

#### **3. Product Visibility**

Successfully created products appear in:

- http://localhost:3000/admin/products
- http://localhost:3000/shop
- http://localhost:3000/product/{slug}

---

### **U - UPDATE** ⚙️

The current bulk upload implementation supports partial update capabilities, but the main flow is still focused on create behavior.

#### **1. Fixing Error Items**

```bash
PUT http://localhost:3001/api/bulk-upload/{batchId}
Content-Type: application/json

{
  "items": [
    {
      "itemId": "item-uuid",
      "categoryId": "correct-category-uuid"
    }
  ]
}
```

This endpoint is intended to fix individual items that failed validation.

#### **2. Updating Individual Products**

After bulk upload completes, individual products can be updated through:

```bash
PUT http://localhost:3001/api/products/{productId}
```

#### **Bulk Update Enhancement**

If you want bulk CSV updates for existing products, add an UPDATE mode using `productId` in the CSV. Example:

```csv
productId,title,price,inStock
uuid-123,Updated Title,999.99,50
```

Then modify the bulk upload service to check for an existing product by slug and update it instead of creating a new one.

---

### **D - DELETE** ✅

#### **1. Delete Batch Only**

```bash
DELETE http://localhost:3001/api/bulk-upload/{batchId}?deleteProducts=false
```

This removes the batch and item records, but keeps the actual products in the catalog.

#### **2. Delete Batch + Products**

```bash
DELETE http://localhost:3001/api/bulk-upload/{batchId}?deleteProducts=true
```

This removes the batch record, item records, and the products created by that batch.

**Protection**: Product deletion is blocked if any product is referenced in an order.

```javascript
async function canDeleteProductsForBatch(tx, batchId) {
  const items = await tx.bulk_upload_item.findMany({
    where: { batchId, productId: { not: null } }
  });

  const productIds = items.map((item) => item.productId);

  const orderedProducts = await tx.customer_order_product.findMany({
    where: { productId: { in: productIds } }
  });

  if (orderedProducts.length > 0) {
    return { canDelete: false, reason: "Some products are in orders" };
  }

  return { canDelete: true };
}
```

---

## 🎨 Existing UI Features

### Bulk Upload Page (`/admin/bulk-upload`)

- ✅ Drag & drop CSV upload
- ✅ File validation
- ✅ Upload progress
- ✅ Success/error result display
- ✅ Template download
- ✅ Upload history list

### Upload History Component

- ✅ Lists all bulk upload batches
- ✅ Status badges for COMPLETED / FAILED / PARTIAL
- ✅ Statistics for total, success, failed, and rate
- ✅ Error message display
- ✅ File name and upload timestamp

---

## 🚀 Suggested Enhancements

### 1. Bulk Update Existing Products
Add an `UPDATE` mode in the CSV with a `productId` column.

### 2. Bulk Delete via CSV
Support uploading a CSV of `productId` values for mass deletion.

### 3. Export Products to CSV
Allow downloading existing products for editing:

```bash
GET /api/products/export?categoryId=xxx&format=csv
```

### 4. Scheduled / Background Upload
For large files (1000+ products):

- Queue system (Bull/BullMQ)
- Progress tracking
- Completion notification

### 5. Image Bulk Upload
Support uploading images in a ZIP archive alongside the CSV.

### 6. Validation Preview
Preview rows before commit with:

- Valid rows (green)
- Invalid rows (red) with error reasons
- Confirm Upload / Cancel buttons

### 7. Rollback / Undo Upload
Add a rollback endpoint that allows undoing a batch within a limited time window.

---

## 📝 Workflow Scenarios

### Scenario 1: New Product Upload

1. Prepare the CSV with product data
2. Upload via the dashboard
3. Verify the batch in Upload History
4. Check the products in the product list
5. Test the products in the shop frontend

### Scenario 2: Fix a Failed Upload

1. Upload a CSV that fails due to an invalid category
2. Review the error in Upload History
3. Fix the CSV
4. Re-upload the corrected file
5. Verify success

### Scenario 3: Mass Delete a Batch

1. Find the batch to delete
2. Check whether any products are already ordered
3. Delete the batch and products if safe
4. Verify the products are removed from the catalog

---

## 🛠️ Testing Commands

```bash
# 1. Test bulk upload
curl -X POST http://localhost:3001/api/bulk-upload -F "file=@bulk-upload-example.csv"

# 2. List batches
curl http://localhost:3001/api/bulk-upload

# 3. Get batch detail
curl http://localhost:3001/api/bulk-upload/{batchId}

# 4. Delete batch (keep products)
curl -X DELETE "http://localhost:3001/api/bulk-upload/{batchId}?deleteProducts=false"

# 5. Delete batch (with products)
curl -X DELETE "http://localhost:3001/api/bulk-upload/{batchId}?deleteProducts=true"

# 6. Check products created
curl http://localhost:3001/api/products?page=1&limit=10
```

---

## ✅ Summary

Bulk upload is working correctly if:

1. 5 products are created in the database
2. Products appear in the product list
3. Products can be purchased in the shop
4. Upload history is stored for tracking
5. Error handling works for failed items

**Available features**:

- ✅ CREATE: Upload CSV to create products
- ✅ READ: List batches, view details, inspect products
- ⚠️ UPDATE: Individual product updates are available, but bulk update by CSV is not fully supported yet
- ✅ DELETE: Delete batch history, with or without products

**Recommended next steps**:

- add bulk update support
- add rollback/undo
- add large-file background processing
