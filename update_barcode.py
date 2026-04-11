import re

# Read the file
with open('server/barcode.ts', 'r') as f:
    content = f.read()

# Find and replace the extractNumericBarcode function
old_function = r'''/**
 \* Extract numeric barcode from URL-based barcode
 \*/
function extractNumericBarcode\(barcode: string\): string \| null \{
  // If it's a URL, try to extract numeric code
  if \(barcode\.includes\("http"\) \|\| barcode\.includes\("\."\)\) \{
    // Try to find numeric sequences in the URL
    const matches = barcode\.match\(/\\d\{8,14\}/g\);
    if \(matches && matches\.length > 0\) \{
      return matches\[0\];
    \}
  \}
  return null;
\}'''

new_function = '''/**
 * Extract numeric barcode from URL-based barcode
 * Handles SmartLabel URLs and other redirect formats
 */
function extractNumericBarcode(barcode: string): string | null {
  // If it's a URL, try to extract numeric code
  if (barcode.includes("http") || barcode.includes(".")) {
    // Try to find UPC codes in URL parameters (e.g., cname=00660726503270)
    const codeMatch = barcode.match(/cname=([0-9]+)/i);
    if (codeMatch && codeMatch[1]) {
      const code = codeMatch[1];
      // Remove leading zeros if it's too long (e.g., 00660726503270 -> 60726503270)
      if (code.length > 14) {
        return code.substring(code.length - 13);
      }
      if (code.length >= 8) {
        return code;
      }
    }
    
    // Try to find any numeric sequences of 8-14 digits in the URL
    const matches = barcode.match(/\\d{8,14}/g);
    if (matches && matches.length > 0) {
      // Return the longest match (likely the UPC)
      return matches.reduce((a, b) => a.length > b.length ? a : b);
    }
  }
  return null;
}'''

# Simple string replacement approach
start_idx = content.find("/**\n * Extract numeric barcode from URL-based barcode\n */")
if start_idx != -1:
    # Find the end of the function
    end_idx = content.find("}\n\n/**\n * Look up product information", start_idx)
    if end_idx != -1:
        end_idx = content.find("}", end_idx) + 1
        # Replace
        content = content[:start_idx] + new_function + content[end_idx:]
        
        # Write back
        with open('server/barcode.ts', 'w') as f:
            f.write(content)
        print("✓ Updated extractNumericBarcode function")
    else:
        print("✗ Could not find end of function")
else:
    print("✗ Could not find extractNumericBarcode function")
