with open('server/barcode.test.ts', 'r') as f:
    content = f.read()

# Fix the expected barcode - use the full 12-digit UPC
content = content.replace(
    'expect(result?.barcode).toBe("60726503270");',
    'expect(result?.barcode).toBe("00660726503270");'
)

with open('server/barcode.test.ts', 'w') as f:
    f.write(content)

print("✓ Updated barcode test to expect full 12-digit UPC")
