#!/bin/bash

USER_ID="693017e24351f75381db6e7b"
EMAIL="vamseesoura56@gmail.com"
PHONE="9121661281"

echo "Checking for existing customer..."
echo ""

# Try to find customer by email
echo "1. Checking by email: $EMAIL"
RESPONSE=$(curl -s "http://localhost:8080/api/customers/email/$EMAIL" 2>&1)
echo "$RESPONSE" | head -5
echo ""

# Try to find customer by phone
echo "2. Checking by phone: $PHONE"
RESPONSE=$(curl -s "http://localhost:8080/api/customers/phone/$PHONE" 2>&1)
echo "$RESPONSE" | head -5
echo ""

# If customer exists, get the ID and offer to delete
echo "If a customer was found above, note the 'id' field."
echo "To delete, run:"
echo "  curl -X DELETE 'http://localhost:8080/api/customers/{CUSTOMER_ID_HERE}'"
