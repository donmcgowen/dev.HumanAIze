// Test barcode extraction with SmartLabel URL
async function testBarcodeExtraction() {
  const barcodeUrl = "https://menu.myproduct.info/d0d87cf0-c89d-47db-91bf-d59d5b0013c9/index.html?cname=00660726503270_32655032904_BEV_MuscleMilk_BR&scantime=2026-04-11T22%3A05%3A21Z";
  
  // Extract numeric barcode from URL
  function extractNumericBarcode(barcode) {
    if (barcode.includes("http") || barcode.includes(".")) {
      // Try to find UPC codes in URL parameters (e.g., cname=00660726503270)
      const codeMatch = barcode.match(/cname=([0-9]+)/i);
      if (codeMatch && codeMatch[1]) {
        const code = codeMatch[1];
        // Remove leading zeros if it's too long
        if (code.length > 14) {
          return code.substring(code.length - 13);
        }
        if (code.length >= 8) {
          return code;
        }
      }
      
      // Try to find any numeric sequences of 8-14 digits in the URL
      const matches = barcode.match(/\d{8,14}/g);
      if (matches && matches.length > 0) {
        // Return the longest match (likely the UPC)
        return matches.reduce((a, b) => a.length > b.length ? a : b);
      }
    }
    return null;
  }
  
  const extracted = extractNumericBarcode(barcodeUrl);
  console.log(`Original barcode: ${barcodeUrl.substring(0, 80)}...`);
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
