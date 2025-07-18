#!/bin/bash

# Fix ES Modules Issue in MCP TypeScript Server
echo "🔧 Fixing ES modules issue in src/server.ts..."

# Check if src/server.ts exists
if [ ! -f "src/server.ts" ]; then
    echo "❌ Error: src/server.ts not found!"
    exit 1
fi

# Create backup
cp src/server.ts src/server.ts.backup
echo "📋 Created backup: src/server.ts.backup"

# Replace require.main === module with ES module equivalent
sed -i.tmp 's/if (require\.main === module)/if (import.meta.url === `file:\/\/${process.argv[1]}`)/g' src/server.ts

# Remove temporary file
rm -f src/server.ts.tmp

# Check if replacement was made
if grep -q "import.meta.url" src/server.ts; then
    echo "✅ Successfully replaced CommonJS pattern with ES module equivalent"
else
    echo "⚠️  Pattern replacement may not have worked. Manual edit needed."
fi

# Show the changes
echo "📝 Changes made:"
echo "Before: if (require.main === module)"
echo "After:  if (import.meta.url === \`file://\${process.argv[1]}\`)"

# Clean and rebuild
echo "🔨 Cleaning and rebuilding..."
npm run clean
npm run build

echo "✅ Fix completed! Test with: npm start"
echo "🐳 Then test Docker with: docker compose up --build"
