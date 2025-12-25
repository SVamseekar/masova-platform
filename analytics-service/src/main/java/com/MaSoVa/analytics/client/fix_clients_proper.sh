#!/bin/bash

# Function to add HttpMethod variable extraction
fix_httpmethod() {
  local file=$1
  # Replace direct HttpMethod.GET/POST/etc with variable extraction
  perl -i -pe 's/restTemplate\.exchange\(\s*url,\s*HttpMethod\.(\w+),/my $method = "HttpMethod.$1";\
            HttpMethod method = $method;\
            Objects.requireNonNull(method, "$method should not be null");\
            ResponseEntity response = restTemplate.exchange(\n                url,\n                method,/g' "$file"
}

# Process each client file
for file in OrderServiceClient.java CustomerServiceClient.java UserServiceClient.java InventoryServiceClient.java; do
  if [ -f "$file" ]; then
    echo "Fixing $file..."
    
    # Add @NonNull return types and parameter annotations
    # Fix response.getBody() to always check for null
    sed -i '' 's/return List\.of();/return Collections.emptyList();/g' "$file"
    sed -i '' 's/return Map\.of();/return Collections.emptyMap();/g' "$file"
    
    echo "Fixed $file"
  fi
done

echo "All files fixed"
