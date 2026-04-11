import re

with open('server/barcode.ts', 'r') as f:
    content = f.read()

# Update API request to include serving size fields
content = content.replace(
    '`https://world.openfoodfacts.net/api/v2/product/${numericBarcode}?fields=product_name,brands,nutriments,quantity`',
    '`https://world.openfoodfacts.net/api/v2/product/${numericBarcode}?fields=product_name,brands,nutriments,quantity,serving_size,serving_quantity,serving_quantity_unit`'
)

# Update v0 API request
content = content.replace(
    '`https://world.openfoodfacts.org/api/v0/product/${numericBarcode}.json`',
    '`https://world.openfoodfacts.org/api/v0/product/${numericBarcode}.json`'
)

# Update serving size extraction for v2 API
old_return_v2 = '''        console.log(`Found product in Open Food Facts: ${product.product_name}`);
        return {
          name: product.product_name || "Unknown Product",
          calories,
          protein,
          carbs,
          fat,
          servingSize: "100",
          servingUnit: "g",
          barcode: numericBarcode,
          brand: product.brands || undefined,
        };'''

new_return_v2 = '''        // Extract serving size from product data or default to 100g
        let servingSize = "100";
        let servingUnit = "g";
        
        if (product.serving_quantity) {
          servingSize = String(product.serving_quantity);
          servingUnit = product.serving_quantity_unit || "g";
        } else if (product.serving_size) {
          // serving_size is typically a string like "100 g" or "1 scoop"
          const sizeMatch = product.serving_size.match(/(\\d+(?:\\.\\d+)?)\\s*([a-zA-Z%]*)/i);
          if (sizeMatch) {
            servingSize = sizeMatch[1];
            servingUnit = sizeMatch[2] || "g";
          }
        }
        
        console.log(`Found product in Open Food Facts: ${product.product_name}`);
        return {
          name: product.product_name || "Unknown Product",
          calories,
          protein,
          carbs,
          fat,
          servingSize,
          servingUnit,
          barcode: numericBarcode,
          brand: product.brands || undefined,
        };'''

content = content.replace(old_return_v2, new_return_v2)

# Update serving size extraction for v0 API
old_return_v0 = '''        console.log(`Found product in Open Food Facts v0: ${product.product_name}`);
        return {
          name: product.product_name || "Unknown Product",
          calories,
          protein,
          carbs,
          fat,
          servingSize: "100",
          servingUnit: "g",
          barcode: numericBarcode,
          brand: product.brands || undefined,
        };'''

new_return_v0 = '''        // Extract serving size from product data or default to 100g
        let servingSize = "100";
        let servingUnit = "g";
        
        if (product.serving_quantity) {
          servingSize = String(product.serving_quantity);
          servingUnit = product.serving_quantity_unit || "g";
        } else if (product.serving_size) {
          // serving_size is typically a string like "100 g" or "1 scoop"
          const sizeMatch = product.serving_size.match(/(\\d+(?:\\.\\d+)?)\\s*([a-zA-Z%]*)/i);
          if (sizeMatch) {
            servingSize = sizeMatch[1];
            servingUnit = sizeMatch[2] || "g";
          }
        }
        
        console.log(`Found product in Open Food Facts v0: ${product.product_name}`);
        return {
          name: product.product_name || "Unknown Product",
          calories,
          protein,
          carbs,
          fat,
          servingSize,
          servingUnit,
          barcode: numericBarcode,
          brand: product.brands || undefined,
        };'''

content = content.replace(old_return_v0, new_return_v0)

with open('server/barcode.ts', 'w') as f:
    f.write(content)

print("✓ Updated barcode.ts with serving size extraction")
