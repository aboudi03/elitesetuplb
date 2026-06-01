# 🗑️ Bulk Upload Batch Deletion Guide

## From the UI Dashboard

### Steps:

1. Open the Bulk Upload page:
   http://localhost:3000/admin/bulk-upload

2. Scroll to the "Upload History" section.

   - You will see all previously uploaded batches
   - Each batch displays:
     - File name
     - Upload time
     - Status (COMPLETED / FAILED / PARTIAL)
     - Statistics (Total / Success / Failed / Rate)

3. Click the 🗑️ trash icon for the batch you want to delete.

   - The trash icon is red
   - It appears next to the batch status badge

4. Confirm the deletion in the modal with two options:

   **Option A: Delete Batch Only (Default)**

   - The checkbox is unchecked
   - Deletes the batch history only
   - Products remain in the catalog
   - Products can still be purchased

   **Option B: Delete Batch + Products**

   - Check the checkbox "Also delete all products created from this batch"
   - Deletes the batch and all products created by that batch
   - Products are removed from the catalog
   - Products can no longer be purchased

5. Click "Delete Batch Only" or "Delete Batch & Products".

6. A toast notification appears:
   - ✅ Success: "Batch deleted successfully!"
   - ❌ Error: if some products are already ordered

---

## From the API / cURL

### 1. Delete Batch Only (Keep Products)

```bash
curl -X DELETE "http://localhost:3001/api/bulk-upload/{batchId}?deleteProducts=false"
```

**Response**:

```json
{
  "message": "Batch deleted successfully (products kept)",
  "deletedProducts": false
}
```

**Result**:

- ❌ The batch record is removed from `bulk_upload_batch`
- ❌ Batch items are removed from `bulk_upload_item`
- ✅ Products remain in the `Product` table
- ✅ Products can still be purchased

---

### 2. Delete Batch + Products

```bash
curl -X DELETE "http://localhost:3001/api/bulk-upload/{batchId}?deleteProducts=true"
```

**Success Response**:

```json
{
  "message": "Batch and products deleted successfully",
  "deletedProducts": true
}
```

**Error Response** (if products are already ordered):

```json
{
  "error": "Cannot delete products: Some products are in orders. Products in orders: uuid-1, uuid-2",
  "timestamp": "2025-10-12T..."
}
```

**Result**:

- ❌ The batch record is removed from `bulk_upload_batch`
- ❌ Batch items are removed from `bulk_upload_item`
- ❌ Products are removed from the `Product` table
- ❌ Products can no longer be purchased

---

## Delete Protections

### 🛡️ Safety Features:

1. **Order Protection**
   - Products already referenced in `customer_order_product` cannot be deleted
   - An error will be returned with the blocked product list
   - This prevents corrupted order data

2. **Cascade Delete**
   - The deletion process removes item records and optionally product records
   - Batch history is cleaned up when requested

---

## Recommended Workflow

1. Use "Delete Batch Only" to keep product records but remove batch history.
2. Use "Delete Batch + Products" only when the batch data is no longer needed and the products are safe to delete.
3. Always verify orders before deleting product records.

---

## Example Deletion Flow

1. Upload a CSV file
2. Verify product creation
3. Choose delete mode
4. Confirm deletion
5. Verify the batch is removed
6. Confirm the product state in the catalog

---

## Troubleshooting

- If the deletion fails, check if product IDs are referenced in existing orders.
- Use the batch detail endpoint to confirm batch items and product IDs.
- If needed, re-run the delete request after resolving order dependencies.
