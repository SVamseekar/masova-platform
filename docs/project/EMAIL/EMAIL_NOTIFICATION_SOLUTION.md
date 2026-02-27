# Email Notification Solution for Walk-in Customers

## Problem
Walk-in customers created via POS have placeholder emails like `walkin-phone-9988776655@walkin.local` which cannot receive actual emails. This prevents them from receiving:
- Payment confirmation emails
- Order status update emails
- Order tracking links

## Solution Implemented

### 1. Optional Email Collection During Order Creation

**Files Modified:**
- `order-service/src/main/java/com/MaSoVa/order/dto/CreateOrderRequest.java`
- `order-service/src/main/java/com/MaSoVa/order/service/OrderService.java`
- `order-service/src/main/java/com/MaSoVa/order/client/CustomerServiceClient.java`
- `customer-service/src/main/java/com/MaSoVa/customer/controller/CustomerController.java`
- `customer-service/src/main/java/com/MaSoVa/customer/service/CustomerService.java`
- `customer-service/src/main/java/com/MaSoVa/customer/service/CustomerAuditService.java`

### 2. How It Works

#### Step 1: Frontend/POS Collects Email
When creating an order for a walk-in customer, the POS system can now optionally collect the customer's email address. This is sent in the order creation request:

```json
{
  "customerName": "Walk-in Customer",
  "customerPhone": "9988776655",
  "customerEmail": "customer@example.com",  // NEW FIELD
  "customerId": "69483f7ffea3e63a57a154bc",
  "storeId": "DOM-001",
  "items": [...],
  "orderType": "DINE_IN"
}
```

#### Step 2: Order Service Updates Customer Email
When the order is created, if a `customerEmail` is provided, the Order Service automatically calls the Customer Service to update the customer's email:

**OrderService.java (lines 173-177):**
```java
// Update customer email if provided (for walk-in customers)
if (request.getCustomerEmail() != null && !request.getCustomerEmail().trim().isEmpty() &&
    request.getCustomerId() != null && !request.getCustomerId().trim().isEmpty()) {
    customerServiceClient.updateCustomerEmail(request.getCustomerId(), request.getCustomerEmail());
}
```

#### Step 3: Customer Service Updates Email in Database
The Customer Service has a new endpoint `POST /api/customers/{id}/update-email` that:
- Updates the customer's email address
- Validates that the email isn't already in use by another customer
- Logs the email change for audit purposes
- Resets email verification status

**CustomerService.java (lines 312-347):**
```java
public Customer updateEmail(String id, String email) {
    Customer customer = customerRepository.findById(id)
            .orElseThrow(() -> new NoSuchElementException("Customer not found with id: " + id));

    // Only update if the new email is different from the current one
    if (email != null && !email.equals(customer.getEmail())) {
        // Skip validation for placeholder walk-in emails
        if (!email.endsWith("@walkin.local")) {
            // Check if email is already in use by another customer
            Optional<Customer> existingCustomer = customerRepository.findByEmail(email);
            if (existingCustomer.isPresent() && !existingCustomer.get().getId().equals(id)) {
                throw new IllegalArgumentException("Email already in use by another customer");
            }
        }

        String oldEmail = customer.getEmail();
        customer.setEmail(email);
        customer.setEmailVerified(false); // Reset verification for new email

        logger.info("Updated customer {} email from {} to {}", id, oldEmail, email);
        auditService.logEmailChange(customer, oldEmail, email);

        return customerRepository.save(customer);
    }

    logger.debug("Email unchanged for customer {}, skipping update", id);
    return customer;
}
```

#### Step 4: Email Notifications Work
Once the customer has a real email address:
- Payment confirmation emails will be sent automatically
- Order status update emails will be sent when order status changes
- All emails include professional HTML formatting and "Track Your Order" buttons

## Frontend Implementation Required

To enable this feature, the POS system frontend needs to be updated:

### Location to Modify
`frontend/src/apps/POSSystem/components/CustomerPanel.tsx` or wherever the order creation form is located.

### Changes Needed

1. **Add Email Input Field** (for non-cash payment types):
```typescript
const [customerEmail, setCustomerEmail] = useState('');

// In the form, add:
<TextField
  label="Customer Email (Optional)"
  type="email"
  value={customerEmail}
  onChange={(e) => setCustomerEmail(e.target.value)}
  placeholder="customer@example.com"
  helperText="Required for email notifications"
/>
```

2. **Include Email in Order Request**:
```typescript
const orderRequest = {
  customerName: selectedCustomer.name,
  customerPhone: selectedCustomer.phone,
  customerEmail: customerEmail.trim(), // NEW FIELD
  customerId: selectedCustomer.id,
  storeId: currentStore,
  items: orderItems,
  orderType: orderType,
  // ... other fields
};
```

## Testing

### Test Scenario 1: Walk-in Customer with Email
1. Create order for walk-in customer (phone: 9988776655)
2. Provide email: `test@example.com`
3. Complete payment
4. **Expected Result:**
   - Customer email updated in database
   - Payment confirmation email sent to `test@example.com`
   - Order status emails sent to `test@example.com`

### Test Scenario 2: Walk-in Customer without Email
1. Create order for walk-in customer
2. Leave email field empty
3. Complete payment
4. **Expected Result:**
   - Order created successfully
   - No email sent (placeholder email still in database)
   - No errors in logs

### Test Scenario 3: Email Already in Use
1. Try to update customer email to an email already used by another customer
2. **Expected Result:**
   - Error: "Email already in use by another customer"
   - Original email unchanged

## API Endpoints

### New Endpoint: Update Customer Email
```
POST /api/customers/{customerId}/update-email
Content-Type: application/json
Authorization: Bearer <JWT>

Request Body:
{
  "email": "customer@example.com"
}

Response:
200 OK - Customer object with updated email
400 Bad Request - Email validation failed
404 Not Found - Customer not found
```

## Benefits

1. **Seamless Integration**: No breaking changes to existing code
2. **Optional Feature**: Works with or without email collection
3. **Smart Validation**: Prevents duplicate emails across customers
4. **Audit Trail**: Logs all email changes for compliance
5. **User Experience**: Customers get professional email notifications even for walk-in orders

## Notes

- Email collection is **optional** - orders can still be created without providing an email
- The system already collects email for non-cash payment types (as mentioned by user)
- Email verification is reset when email is updated (security best practice)
- Walk-in placeholder emails (`@walkin.local`) skip duplicate validation
- All changes are backward compatible - existing orders continue to work
