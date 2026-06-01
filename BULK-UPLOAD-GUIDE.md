# 📦 Bulk Upload Template Guide

## 📋 Available File Templates

1. **bulk-upload-example.csv** - A template with 5 sample products
2. **bulk-upload-template-blank.csv** - A blank template for manual entry
3. **product-template.csv** - A basic product template

## 📊 CSV Format

### Required Header Columns

```csv
title,price,manufacturer,inStock,mainImage,description,slug,categoryId
```

### Column Descriptions

| Column          | Required | Type   | Description                                      | Example                            |
| --------------- | -------- | ------ | ------------------------------------------------ | ---------------------------------- |
| **title**       | ✅ Yes   | String | Product name                                      | Samsung Galaxy S24 Ultra          |
| **price**       | ✅ Yes   | Number | Product price (use dot for decimals)              | 1299.99                           |
| **manufacturer**| ✅ Yes   | String | Manufacturer or brand name                        | Samsung                           |
| **inStock**     | ❌ No    | Number | Stock quantity (default: 0)                       | 25                                |
| **mainImage**   | ❌ No    | URL    | Product image URL                                 | https://example.com/image.jpg     |
| **description** | ✅ Yes   | String | Product description                               | The latest flagship smartphone... |
| **slug**        | ✅ Yes   | String | URL-friendly identifier (lowercase, dashes only)  | samsung-galaxy-s24-ultra          |
| **categoryId**  | ✅ Yes   | String | Category ID from the database (or category name)  | electronics                       |

## ⚠️ Important Rules

### 1. Data Formatting

- **Price** should use a dot (`.`) for decimals.
  - ✅ Correct: `1299.99`
  - ❌ Incorrect: `1.299,99`

- **Slug** must be URL-friendly and lowercase.
  - ✅ Correct: `samsung-galaxy-s24`
  - ❌ Incorrect: `Samsung Galaxy S24`

- **Text containing commas** should be wrapped in double quotes.
  - ✅ Correct: `"Camera with 200MP, 50MP, and 12MP lenses"`
  - ❌ Incorrect: `Camera with 200MP, 50MP, and 12MP lenses`

### 2. Category ID

You can use:
- A category UUID from the database (recommended)
- A category name that can be resolved by the system

To fetch valid category IDs:

```javascript
// Run from the server directory:
node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); p.category.findMany().then(c => { console.log(c); p.$disconnect(); });"
```

### 3. Image URL

- Use a full URL with `http://` or `https://`
- Recommended: host your images on a CDN or public storage
- If empty, a default placeholder may be used

## 📝 Example CSV Rows

### Basic Row

```csv
title,price,manufacturer,inStock,mainImage,description,slug,categoryId
iPhone 15 Pro,999.99,Apple,50,https://example.com/iphone.jpg,Latest iPhone model,iphone-15-pro,smartphones
```

### Long Description Row

```csv
title,price,manufacturer,inStock,mainImage,description,slug,categoryId
"Sony WH-1000XM5","399.99",Sony,30,https://example.com/sony.jpg,"Premium wireless headphones with industry-leading noise cancellation, 30-hour battery life, and exceptional sound quality.",sony-wh-1000xm5,audio
```

## 🚀 Upload Process

### Via Admin Dashboard

1. Log in to the admin dashboard
2. Open the **Bulk Upload** page
3. Download a CSV template or use an existing one
4. Fill in product data according to the format
5. Drag and drop the CSV file or click "Select CSV File"
6. Click "Upload Products"
7. Wait for the upload to complete and review the results

### Via API (Advanced)

```bash
curl -X POST http://localhost:3001/api/products/bulk-upload   -F "file=@bulk-upload-example.csv"
```

## ✅ Pre-Upload Checklist

- [ ] Required columns are filled: title, price, manufacturer, description, slug, categoryId
- [ ] Price uses a decimal dot format
- [ ] Slug is unique and lowercase with dashes
- [ ] Category ID is valid and exists in the database
- [ ] Image URL is valid (if provided)
- [ ] Text containing commas is wrapped in double quotes
- [ ] File is saved as CSV, not XLSX

## 🔍 Troubleshooting

### Error: "Category not found"
- Verify the categoryId exists in the database
- Or use an existing category name that can be resolved

### Error: "Duplicate slug"
- Make sure each slug is unique
- Use more specific values, such as `macbook-pro-16-2024`

### Error: "Invalid price format"
- Use a numeric value with a decimal dot
- Do not include currency symbols like `$` or `Rp`

### Error: "CSV parsing failed"
- Check that the CSV format is valid
- Use a plain text editor or Excel to edit
- Save as comma-delimited CSV

## 📞 Support

If you encounter problems:
1. Check the upload error message
2. Validate CSV format in Excel or Google Sheets
3. Ensure the file encoding is UTF-8
4. Test with 1-2 products before uploading a large list

## 🎯 Tips

1. **Start small**: test with 2-3 products first
2. **Validate categories**: ensure category records exist
3. **Use unique slugs**: combine name and model
4. **Keep backups**: save a copy of your CSV before upload
5. **Monitor history**: review upload results after each attempt

---

Happy Bulk Uploading! 🚀
