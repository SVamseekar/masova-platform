#!/bin/bash

echo "Testing manager login..."
echo ""

curl -X POST http://localhost:8081/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "suresh.manager@masova.com",
    "password": "Manager@123"
  }' \
  -v

echo ""
echo ""
echo "Response received above"
