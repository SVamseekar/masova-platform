#!/bin/bash

for file in *Client.java; do
  echo "Processing $file..."
  
  # Backup
  cp "$file" "${file}.bak"
  
  # Add imports if not present
  if ! grep -q "import org.springframework.lang.NonNull" "$file"; then
    sed -i '' '/^import org.springframework.http.ResponseEntity;/a\
import org.springframework.lang.NonNull;\
import org.springframework.lang.Nullable;
' "$file"
  fi
  
  if ! grep -q "import java.util.Objects" "$file"; then
    sed -i '' '/^import java.util.Map;/a\
import java.util.Objects;\
import java.util.Collections;
' "$file"
  fi
  
  # Add @SuppressWarnings for HttpMethod null safety
  sed -i '' 's/HttpMethod\.GET,/@SuppressWarnings("null") HttpMethod.GET,/g' "$file"
  sed -i '' 's/HttpMethod\.POST,/@SuppressWarnings("null") HttpMethod.POST,/g' "$file"
  sed -i '' 's/HttpMethod\.PUT,/@SuppressWarnings("null") HttpMethod.PUT,/g' "$file"
  sed -i '' 's/HttpMethod\.DELETE,/@SuppressWarnings("null") HttpMethod.DELETE,/g' "$file"
  
  # Fix response.getBody() null safety - replace with safe pattern
  sed -i '' 's/return response\.getBody();/List<Map<String, Object>> body = response.getBody(); return body != null ? body : Collections.emptyList();/g' "$file"
  sed -i '' 's/return response\.getBody();/Map<String, Object> body = response.getBody(); return body != null ? body : Collections.emptyMap();/g' "$file"
  
  echo "Fixed $file"
done

echo "All client files processed"
