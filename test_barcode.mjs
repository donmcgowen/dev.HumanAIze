// Test barcode lookup with the Pepsico URL barcode
async function testBarcodeExtraction() {
  const barcodeUrl = "http://pepsico.info/490yu6";
  
  // Extract numeric barcode from URL
  function extractNumericBarcode(barcode) {
    if (barcode.includes("http") || barcode.includes(".")) {
      const matches = barcode.match(/\d{8,14}/g);
      if (matches && matches.length > 0) {
        return matches[0];
      }
    }
    return null;
  }
  
  const extracted = extractNumericBarcode(barcodeUrl);
  console.log(`Original barcode: ${barcodeUrl}`);
  console.log(`Extracted numeric barcode: ${extracted}`);
  
  if (extracted) {
    // Test Open Food Facts lookup
    console.log(`\nTesting Open Food Facts API with barcode: ${extracted}`);
    try {
      const response = await fetch(
        `https://world.openfoodfacts.net/api/v2/product/${extracted}?fields=product_name,brands,nutriments`
      );
      
      if (response.ok) {
        const data = await response.json();
        if (data.product) {
          console.log(`✓ Product found: ${data.product.product_name}`);
          console.log(`  Brand: ${data.product.brands || 'N/A'}`);
          const nutrients = data.product.nutriments || {};
          console.log(`  Calories (per 100g): ${nutrients['energy-kcal'] || nutrients['energy_100g'] || 'N/A'}`);
        } else {
          console.log(`✗ Product not found in Open Food Facts`);
        }
      } else {
        console.log(`✗ API error: ${response.status}`);
      }
    } catch (error) {
      console.error(`✗ Lookup failed: ${error.message}`);
    }
  }
}

testBarcodeExtraction();
