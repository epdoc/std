#!/bin/bash

echo "=== deno.json versions ==="
find . -name "deno.json" -type f -exec grep -E '^\s*"version"\s*:' {} +

echo -e "\n=== dep.ts files and their contents ==="
find . -name "dep.ts" -type f | while read -r file; do
    echo -e "\n--- Contents of ${file#./} ---"
    cat "$file"
done
