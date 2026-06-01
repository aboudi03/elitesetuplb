# 📊 Bulk Upload - Quick Reference Guide

## Available Bulk Upload Features

### ✅ CSV Upload

- **UI**: Drag and drop at http://localhost:3000/admin/bulk-upload
- **API**: POST /api/bulk-upload
- **Supported scale**: 5 to 1000+ products
- **Validation**: Real-time category checking
- **Template**: Download a CSV template

### ✅ Upload History

- **UI**: Upload History section
- **API**: GET /api/bulk-upload
- Shows file name, statistics, errors, and timestamps
- Status values: COMPLETED / FAILED / PARTIAL

### ✅ Delete Batch

- **UI**: Trash icon on each batch
- **API**: DELETE /api/bulk-upload/{batchId}
- Options:
  - Delete batch only (keep products)
  - Delete batch + products
- Protection: Cannot delete if products are in orders

---

## How to Use Delete

### From the UI (Recommended)

1. Open http://localhost:3000/admin/bulk-upload
2. Scroll to the Upload History section
3. Click the trash icon for the batch you want to delete
4. In the confirmation modal, choose:
   - **Keep products**: remove batch history only
   - **Delete products**: remove products and batch history
5. Confirm the deletion
6. A toast notification will appear
7. The list refreshes automatically

---

### From cURL / API

#### Delete Batch Only (Keep Products)

```bash
curl -X DELETE "http://localhost:3001/api/bulk-upload/BATCH_ID?deleteProducts=false"
```

**Response**:

```json
{
  "message": "Batch deleted successfully (products kept)",
  "deletedProducts": false
}
```

#### Delete Batch + Products

```bash
curl -X DELETE "http://localhost:3001/api/bulk-upload/BATCH_ID?deleteProducts=true"
```

**Response**:

```json
{
  "message": "Batch and products deleted successfully",
  "deletedProducts": true
}
```

**Error** (if products are in orders):

```json
{
  "error": "Cannot delete products: Some products are in orders",
  "timestamp": "2025-10-12T..."
}
```

---

## Comparison Table

| Action                      | Batch Record | Items Record | Products       | Use Case                              |
| --------------------------- | ------------ | ------------ | -------------- | ------------------------------------- |
| **Delete Batch Only**       | ❌ Deleted   | ❌ Deleted   | ✅ Kept        | Keep products for sale, clean history |
| **Delete Batch + Products** | ❌ Deleted   | ❌ Deleted   | ❌ Deleted      | Wrong upload, test data, duplicates   |

---

## Order Protection

When products from a batch already exist in orders, deletion of the products is blocked.

**Flow:**

- Check batch items for product IDs
- Verify whether any product IDs appear in `customer_order_product`
- If yes, return `409 Conflict` with a message
- Otherwise, allow deletion

---

## Testing Steps

### Test Delete Batch Only

```bash
# 1. Upload CSV
curl -X POST http://localhost:3001/api/bulk-upload   -F "file=@bulk-upload-example.csv"

# 2. Verify products were created
curl http://localhost:3001/api/products | grep "Samsung Galaxy"

# 3. Delete batch only
curl -X DELETE "http://localhost:3001/api/bulk-upload/abc-123?deleteProducts=false"

# 4. Verify batch is gone
curl http://localhost:3001/api/bulk-upload

# 5. Verify products still exist
curl http://localhost:3001/api/products | grep "Samsung Galaxy"
```

### Test Delete Batch + Products

```bash
# 1. Upload CSV
curl -X POST http://localhost:3001/api/bulk-upload   -F "file=@bulk-upload-example.csv"

# 2. Delete batch and products
curl -X DELETE "http://localhost:3001/api/bulk-upload/xyz-789?deleteProducts=true"

# 3. Verify batch is gone
curl http://localhost:3001/api/bulk-upload

# 4. Verify products are deleted
curl http://localhost:3001/api/products | grep "Samsung Galaxy"
```

---

## Best Practices

- Keep products when you only need to remove batch history
- Delete products only when the batch is test data or invalid
- Always confirm there are no order references before deleting products
- Use the API response to verify whether deletion succeeded
