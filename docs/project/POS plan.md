POS plan 

# MaSoVa POS Authentication & Active Sessions Overhaul - Implementation Plan

## Executive Summary

This plan addresses three major requirements:
1. **Fix Active Sessions Display** - Currently broken due to field name mismatches
2. **Implement 5-Digit PIN System** - Replace ObjectId-based PINs with random 5-digit PINs (store-unique)
3. **Redesign POS Authentication** - Public POS with PIN-based order tracking

---

## Part 1: Fix Active Sessions Display (Critical Bug Fixes)

### Problem Identified
Active sessions exist in database but don't display correctly due to:
- Frontend looking for `session.name` but backend sends `session.employeeName`
- Frontend looking for `session.breakTime` but backend sends `session.breakDurationMinutes`
- Missing employee data when User lookup fails

### Files to Modify

#### 1.1 Frontend - ActiveSessionsWidget.tsx
**Path:** `frontend/src/apps/POSSystem/components/ActiveSessionsWidget.tsx`

**Changes:**
- Line 113-117: Change `session.name` → `session.employeeName`
- Line 130-135: Change `session.breakTime` → `session.breakDurationMinutes`

**Before:**
```jsx
<div style={styles.avatar}>
  {session.name?.charAt(0).toUpperCase() || 'E'}
</div>
<div style={styles.employeeName}>{session.name || 'Employee'}</div>

{session.breakTime > 0 && (
  <span>{session.breakTime} min</span>
)}
```

**After:**
```jsx
<div style={styles.avatar}>
  {session.employeeName?.charAt(0).toUpperCase() || 'E'}
</div>
<div style={styles.employeeName}>{session.employeeName || 'Employee'}</div>

{session.breakDurationMinutes > 0 && (
  <span>{session.breakDurationMinutes} min</span>
)}
```

#### 1.2 Frontend - StaffManagementPage.tsx (Already Fixed)
**Path:** `frontend/src/pages/manager/StaffManagementPage.tsx`
- Line 674: Already correctly uses `session.breakDurationMinutes || session.breakTime || 0`
- No changes needed

#### 1.3 Add Live HH:MM:SS Timer
**Both ActiveSessionsWidget.tsx and StaffManagementPage.tsx**

Add state for live timer:
```tsx
const [currentTime, setCurrentTime] = useState(new Date());

useEffect(() => {
  const timer = setInterval(() => {
    setCurrentTime(new Date());
  }, 1000); // Update every second

  return () => clearInterval(timer);
}, []);
```

Update duration calculation to use `currentTime` instead of creating new Date() in render.

Format as HH:MM:SS:
```tsx
const formatDuration = (loginTime: string) => {
  const start = new Date(loginTime);
  const diffMs = currentTime.getTime() - start.getTime();
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};
```

---

## Part 2: Implement Grouped Sessions by Employee

### Design
Display active sessions grouped by employee with expandable/collapsible sections:

```
John Doe (2 active sessions)
  └─ Session 1: 02:34:15 | Break: 15 min | Working: 02:19:15
  └─ Session 2: 00:45:30 | Break: 0 min | Working: 00:45:30

Jane Smith (1 active session)
  └─ Session 1: 05:12:43 | Break: 30 min | Working: 04:42:43
```

### Files to Modify

#### 2.1 StaffManagementPage.tsx
**Path:** `frontend/src/pages/manager/StaffManagementPage.tsx`

**Implementation:**
1. Group sessions by employeeId/employeeName
2. Create expandable sections per employee
3. Show aggregate stats per employee:
   - Total sessions count
   - Combined working duration
   - Total break time

**New component structure:**
```tsx
// Group sessions
const sessionsByEmployee = useMemo(() => {
  const grouped = new Map<string, WorkingSession[]>();
  activeSessions.forEach(session => {
    const key = session.employeeId;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(session);
  });
  return grouped;
}, [activeSessions]);

// Render grouped view
{Array.from(sessionsByEmployee.entries()).map(([employeeId, sessions]) => (
  <ExpandableEmployeeRow
    key={employeeId}
    employeeName={sessions[0].employeeName}
    sessions={sessions}
    currentTime={currentTime}
  />
))}
```

#### 2.2 Create New Component: ExpandableEmployeeRow
**Path:** `frontend/src/pages/manager/components/ExpandableEmployeeRow.tsx` (NEW FILE)

**Purpose:** Display employee with their sessions (expandable)

**Props:**
```typescript
interface ExpandableEmployeeRowProps {
  employeeName: string;
  sessions: WorkingSession[];
  currentTime: Date;
}
```

**Features:**
- Click to expand/collapse sessions
- Show total active sessions count
- Display each session with live timer
- Color coding for long sessions (>8 hours warning)

---

## Part 3: Implement 5-Digit PIN System

### Design Overview

**Current System (FLAWED):**
- 4-digit PIN = last 4 chars of ObjectId
- Stored in `User.employeeDetails.employeePINHash`
- High collision risk (only 65,536 combinations for hex)

**New System:**
- 5-digit random PIN (00000-99999) = 100,000 combinations
- Store-unique constraint (prevent duplicates within same store)
- Generated on user creation
- Stored as BCrypt hash in `User.employeeDetails.employeePINHash`
- Plain PIN shown ONCE to manager on creation, then never retrievable

### Database Schema Changes

#### 3.1 Add PIN Field to User Entity
**Path:** `shared-models/src/main/java/com/MaSoVa/shared/entity/User.java`

**In EmployeeDetails class (around line 166):**

**Current:**
```java
@JsonIgnore
@Indexed(unique = true, sparse = true)
private String employeePINHash; // 4-digit from ObjectId
```

**Change to:**
```java
@JsonIgnore
private String employeePINHash; // 5-digit random PIN (BCrypt hashed)

// Remove unique index from here, add compound index at document level
```

**Add compound index at document level (around line 50):**
```java
@Document(collection = "users")
@CompoundIndex(name = "store_pin_unique", def = "{'storeId': 1, 'employeeDetails.employeePINHash': 1}", unique = true, sparse = true)
public class User implements Serializable {
```

**Rationale:**
- Ensures PIN uniqueness per store
- Different stores can have same PIN (isolated)
- Sparse index allows null values (for customers without PINs)

### Backend Implementation

#### 3.2 Update UserService - PIN Generation
**Path:** `user-service/src/main/java/com/MaSoVa/user/service/UserService.java`

**Replace existing method (around line 398):**

**Old:**
```java
public String generateEmployeePIN(String userId) {
    String pin = userId.substring(Math.max(0, userId.length() - 4));
    // ...
}
```

**New:**
```java
private static final SecureRandom RANDOM = new SecureRandom();

/**
 * Generate random 5-digit PIN with store-level uniqueness guarantee
 * @param userId User ID
 * @param storeId Store ID for uniqueness constraint
 * @return Plain PIN string (to be shown once)
 */
public String generateEmployeePIN(String userId, String storeId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found"));

    if (!user.isEmployee()) {
        throw new RuntimeException("Only employees can have PINs");
    }

    String pin = null;
    String hashedPin = null;
    int maxAttempts = 100;
    int attempts = 0;

    // Generate random PIN with collision detection
    while (attempts < maxAttempts) {
        // Generate random 5-digit PIN (00000-99999)
        pin = String.format("%05d", RANDOM.nextInt(100000));
        hashedPin = passwordEncoder.encode(pin);

        // Check if PIN already exists in this store
        boolean exists = userRepository.existsByStoreIdAndEmployeeDetailsPINHash(
            storeId, hashedPin
        );

        if (!exists) {
            break; // Unique PIN found
        }

        attempts++;
    }

    if (attempts >= maxAttempts) {
        throw new RuntimeException("Failed to generate unique PIN after " + maxAttempts + " attempts");
    }

    // Store hashed PIN
    if (user.getEmployeeDetails() == null) {
        user.setEmployeeDetails(new User.EmployeeDetails());
    }
    user.getEmployeeDetails().setEmployeePINHash(hashedPin);
    userRepository.save(user);

    logger.info("Generated 5-digit PIN for employee {} in store {}", userId, storeId);

    return pin; // Return plain PIN only once
}

/**
 * Verify employee PIN
 * @param userId User ID
 * @param plainPin Plain 5-digit PIN
 * @return true if PIN matches
 */
public boolean verifyEmployeePIN(String userId, String plainPin) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new RuntimeException("User not found"));

    if (user.getEmployeeDetails() == null ||
        user.getEmployeeDetails().getEmployeePINHash() == null) {
        return false;
    }

    return passwordEncoder.matches(plainPin, user.getEmployeeDetails().getEmployeePINHash());
}
```

#### 3.3 Update UserRepository - Add PIN Query
**Path:** `user-service/src/main/java/com/MaSoVa/user/repository/UserRepository.java`

**Add method:**
```java
/**
 * Check if PIN hash already exists for given store
 * Used for PIN uniqueness validation
 */
@Query("{'storeId': ?0, 'employeeDetails.employeePINHash': ?1}")
boolean existsByStoreIdAndEmployeeDetailsPINHash(String storeId, String pinHash);
```

#### 3.4 Auto-Generate PIN on User Creation
**Path:** `user-service/src/main/java/com/MaSoVa/user/service/UserService.java`

**In createEmployee() method (around line 150):**

**Add after user is saved:**
```java
// Save user first to get ID
User savedUser = userRepository.save(newUser);

// Auto-generate PIN for employees
if (savedUser.isEmployee()) {
    String plainPin = generateEmployeePIN(savedUser.getId(), savedUser.getStoreId());

    // Log PIN for manager (in production, return in API response)
    logger.info("IMPORTANT: Employee PIN for {} ({}): {}",
        savedUser.getPersonalInfo().getName(),
        savedUser.getId(),
        plainPin
    );

    // TODO: Return PIN in API response to show manager once
}

return savedUser;
```

#### 3.5 Update UserController - Return PIN in Create Response
**Path:** `user-service/src/main/java/com/MaSoVa/user/controller/UserController.java`

**Modify createUser endpoint to return PIN:**

**Change response DTO:**
```java
public class UserCreationResponse {
    private String id;
    private String name;
    private String email;
    private String type;
    private String generatedPIN; // NEW FIELD - only populated on creation

    // Getters/Setters
}
```

**Update endpoint (around line 80):**
```java
@PostMapping
public ResponseEntity<?> createUser(@RequestBody UserCreateRequest request) {
    try {
        User user = userService.createUser(request);

        UserCreationResponse response = new UserCreationResponse();
        response.setId(user.getId());
        response.setName(user.getPersonalInfo().getName());
        response.setEmail(user.getContactInfo().getEmail());
        response.setType(user.getType().toString());

        // If employee, include generated PIN
        if (user.isEmployee() && user.getEmployeeDetails() != null) {
            // PIN was generated during createUser, retrieve it from ThreadLocal or regenerate
            String pin = userService.getLastGeneratedPIN(user.getId());
            response.setGeneratedPIN(pin);
        }

        return ResponseEntity.ok(response);
    } catch (Exception e) {
        return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
    }
}
```

**Alternative (simpler):** Return PIN in temporary field, clear after first fetch.

### Frontend Implementation

#### 3.6 Update Staff Creation to Display PIN
**Path:** `frontend/src/pages/manager/StaffManagementPage.tsx`

**In handleCreateStaff() method (around line 139):**

**After successful creation:**
```typescript
const handleCreateStaff = async () => {
  // ... existing validation ...

  try {
    const result = await createUser(request).unwrap();

    setCreateDialogOpen(false);

    // Show PIN to manager if employee
    if (result.generatedPIN) {
      // Display PIN in a modal/alert
      alert(`Staff member created successfully!\n\n` +
            `IMPORTANT: Save this 5-digit PIN - it will not be shown again:\n\n` +
            `PIN: ${result.generatedPIN}\n\n` +
            `Employee: ${result.name}\n` +
            `This PIN is used for clock-in and order authentication.`);

      // TODO: Better UI - modal with copy button
    } else {
      alert('Staff member created successfully!');
    }

    // Reset form
    setFormData({ /* ... */ });
  } catch (error) {
    // ... error handling ...
  }
};
```

#### 3.7 Create PIN Display Modal Component
**Path:** `frontend/src/components/modals/PINDisplayModal.tsx` (NEW FILE)

**Purpose:** Professional modal to display generated PIN with copy functionality

```tsx
interface PINDisplayModalProps {
  isOpen: boolean;
  onClose: () => void;
  employeeName: string;
  employeeType: string;
  pin: string;
}

export const PINDisplayModal: React.FC<PINDisplayModalProps> = ({
  isOpen, onClose, employeeName, employeeType, pin
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(pin);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={styles.container}>
        <h2>Employee Created Successfully</h2>
        <p>Save this 5-digit PIN - it will not be shown again</p>

        <div style={styles.pinDisplay}>
          <div style={styles.pinDigits}>
            {pin.split('').map((digit, i) => (
              <span key={i} style={styles.digit}>{digit}</span>
            ))}
          </div>
          <button onClick={handleCopy}>
            {copied ? '✓ Copied!' : 'Copy PIN'}
          </button>
        </div>

        <div style={styles.details}>
          <p><strong>Employee:</strong> {employeeName}</p>
          <p><strong>Type:</strong> {employeeType}</p>
          <p><strong>Usage:</strong> Clock-in, Order Creation, Authentication</p>
        </div>

        <button onClick={onClose}>I've Saved the PIN</button>
      </div>
    </Modal>
  );
};
```

---

## Part 4: Redesign POS Authentication Flow

### Current Flow (TO REPLACE)
1. User logs in via `/staff-login` with email/password
2. JWT token stored in Redux
3. POS route protected - requires authentication
4. Orders created with authenticated user ID

### New Flow (PUBLIC POS WITH PIN)

```
POS Opens (Public - No Login Required)
  ↓
User Clicks "New Order" or "Take Order"
  ↓
PIN Entry Modal Opens
  ↓
User Enters 5-Digit PIN
  ↓
Backend Validates PIN & Returns User Info
  ↓
POS Locked to That User for Current Order
  ↓
User Adds Items, Completes Checkout
  ↓
Order Saved with User ID in metadata
  ↓
POS Returns to Public State (Ready for Next Order)
```

### Implementation Steps

#### 4.1 Remove Authentication from POS Route
**Path:** `frontend/src/App.tsx`

**Change POS route from ProtectedRoute to public Route:**

**Before:**
```tsx
<ProtectedRoute
  path="/pos/*"
  element={<POSSystem />}
  requiredRoles={['STAFF', 'MANAGER', 'ASSISTANT_MANAGER']}
/>
```

**After:**
```tsx
<Route path="/pos/*" element={<POSSystem />} />
```

**Rationale:** POS is now public, authentication happens per-order via PIN

#### 4.2 Create PIN Authentication Modal
**Path:** `frontend/src/apps/POSSystem/components/PINAuthModal.tsx` (NEW FILE)

**Purpose:** Modal for entering 5-digit PIN before creating order

```tsx
interface PINAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (userData: { userId: string; name: string; type: string }) => void;
}

export const PINAuthModal: React.FC<PINAuthModalProps> = ({
  isOpen, onClose, onAuthenticated
}) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const pinInputRefs = [useRef(), useRef(), useRef(), useRef(), useRef()];

  const [validatePIN] = useValidatePINMutation();

  const handleSubmit = async () => {
    if (pin.length !== 5) {
      setError('Please enter complete 5-digit PIN');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await validatePIN({ pin }).unwrap();

      // Success - user authenticated
      onAuthenticated({
        userId: result.userId,
        name: result.name,
        type: result.type
      });

      onClose();
    } catch (err: any) {
      setError(err?.data?.error || 'Invalid PIN');
      setPin('');
      pinInputRefs[0].current?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handlePinChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return; // Only digits

    const newPin = pin.split('');
    newPin[index] = value;
    const updatedPin = newPin.join('').slice(0, 5);
    setPin(updatedPin);

    // Auto-focus next input
    if (value && index < 4) {
      pinInputRefs[index + 1].current?.focus();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={styles.container}>
        <h2>Enter Your PIN</h2>
        <p>Enter your 5-digit PIN to start taking orders</p>

        <div style={styles.pinInputs}>
          {[0, 1, 2, 3, 4].map(index => (
            <input
              key={index}
              ref={pinInputRefs[index]}
              type="password"
              inputMode="numeric"
              maxLength={1}
              value={pin[index] || ''}
              onChange={(e) => handlePinChange(index, e.target.value)}
              style={styles.pinInput}
              disabled={loading}
            />
          ))}
        </div>

        {error && <div style={styles.error}>{error}</div>}

        <div style={styles.actions}>
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button onClick={handleSubmit} disabled={loading || pin.length !== 5}>
            {loading ? 'Verifying...' : 'Continue'}
          </button>
        </div>
      </div>
    </Modal>
  );
};
```

#### 4.3 Add PIN Validation Endpoint
**Path:** `user-service/src/main/java/com/MaSoVa/user/controller/UserController.java`

**New endpoint:**
```java
@PostMapping("/validate-pin")
@Operation(summary = "Validate employee PIN for order creation")
public ResponseEntity<?> validatePIN(@RequestBody Map<String, String> request) {
    String pin = request.get("pin");

    if (pin == null || pin.length() != 5) {
        return ResponseEntity.badRequest()
            .body(Map.of("error", "Invalid PIN format"));
    }

    try {
        // Find user by PIN (requires new query method)
        User user = userService.findUserByPIN(pin);

        if (user == null || !user.isEmployee()) {
            return ResponseEntity.status(401)
                .body(Map.of("error", "Invalid PIN"));
        }

        // Return user data (no sensitive info)
        return ResponseEntity.ok(Map.of(
            "userId", user.getId(),
            "name", user.getPersonalInfo().getName(),
            "type", user.getType().toString(),
            "role", user.getEmployeeDetails().getRole(),
            "storeId", user.getStoreId()
        ));
    } catch (Exception e) {
        return ResponseEntity.status(401)
            .body(Map.of("error", "Invalid PIN"));
    }
}
```

#### 4.4 Add UserService Method - Find by PIN
**Path:** `user-service/src/main/java/com/MaSoVa/user/service/UserService.java`

**New method:**
```java
/**
 * Find user by validating their PIN
 * @param plainPin Plain 5-digit PIN
 * @return User if PIN matches, null otherwise
 */
public User findUserByPIN(String plainPin) {
    // Get all employees (or query by store if needed)
    // NOTE: This is inefficient - see optimization note below
    List<User> employees = userRepository.findByTypeIn(
        Arrays.asList(UserType.STAFF, UserType.DRIVER, UserType.MANAGER, UserType.ASSISTANT_MANAGER)
    );

    // Check PIN for each employee
    for (User employee : employees) {
        if (employee.getEmployeeDetails() != null &&
            employee.getEmployeeDetails().getEmployeePINHash() != null) {

            if (passwordEncoder.matches(plainPin, employee.getEmployeeDetails().getEmployeePINHash())) {
                return employee;
            }
        }
    }

    return null;
}
```

**OPTIMIZATION NOTE:**
This is O(n) with BCrypt checks - slow for many employees. Better approach:
- Store last 2 digits of PIN in plaintext as index field
- Query users with matching last 2 digits (reduces candidates from 100 to ~1)
- Then verify full PIN with BCrypt

**Optimized version:**
```java
// In User.EmployeeDetails, add:
private String pinSuffix; // Last 2 digits for indexing

// In findUserByPIN:
String suffix = plainPin.substring(3); // Last 2 digits
List<User> candidates = userRepository.findByEmployeeDetailsPinSuffix(suffix);
// Now only check 1-2 users instead of 100+
```

#### 4.5 Update POSDashboard to Use PIN Auth
**Path:** `frontend/src/apps/POSSystem/POSDashboard.tsx`

**Add state for current order user:**
```tsx
const [orderUser, setOrderUser] = useState<{
  userId: string;
  name: string;
  type: string;
} | null>(null);
const [showPINModal, setShowPINModal] = useState(false);
```

**Update "New Order" button:**
```tsx
const handleNewOrder = () => {
  // Clear any existing order
  dispatch(clearCart());

  // Show PIN modal
  setShowPINModal(true);
};

const handlePINAuthenticated = (userData) => {
  setOrderUser(userData);
  setShowPINModal(false);

  // Show success toast
  toast.success(`Order started by ${userData.name}`);
};
```

**Pass orderUser to OrderPanel and CustomerPanel:**
```tsx
<OrderPanel
  currentOrder={currentOrder}
  onUpdateOrder={handleUpdateOrder}
  orderCreatedBy={orderUser}  // NEW PROP
/>
```

**Clear orderUser after order submission:**
```tsx
const handleOrderComplete = () => {
  setOrderUser(null);
  dispatch(clearCart());
  toast.success('Order completed successfully!');
};
```

#### 4.6 Update Order Creation to Include Staff ID
**Path:** `frontend/src/apps/POSSystem/components/CustomerPanel.tsx`

**In handleSubmitOrder:**
```tsx
const handleSubmitOrder = async () => {
  // ... existing validation ...

  const orderData = {
    storeId: currentUser?.storeId,
    customerId: customer?.id || tempCustomerId,
    items: transformedItems,
    type: orderType === 'PICKUP' ? 'TAKEAWAY' : 'DELIVERY',
    status: 'RECEIVED',
    paymentMethod: selectedPayment,

    // NEW: Add staff member who created order
    createdByStaffId: props.orderCreatedBy?.userId,
    createdByStaffName: props.orderCreatedBy?.name,

    // ... rest of order data ...
  };

  // ... create order ...
};
```

#### 4.7 Update Order Entity to Track Creator
**Path:** `order-service/src/main/java/com/MaSoVa/order/entity/Order.java`

**Add fields:**
```java
@Field("createdByStaffId")
private String createdByStaffId; // Employee who created order

@Field("createdByStaffName")
private String createdByStaffName; // Name for display

// Getters/Setters
```

**Update CreateOrderRequest DTO:**
```java
// In CreateOrderRequest.java
private String createdByStaffId;
private String createdByStaffName;
```

---

## Part 5: Update Clock-In Flow for Manager vs Staff

### Current Flow
- ClockInModal: Select employee + enter PIN → Clock in

### New Flow (Dual Authentication for Staff)

**For Managers/Assistant Managers:**
```
Enter your 5-digit PIN → Clock In
```

**For Staff/Drivers:**
```
Enter your 5-digit PIN → Enter Manager's 5-digit PIN → Clock In
```

### Implementation

#### 5.1 Update ClockInModal to Support Two-Step Auth
**Path:** `frontend/src/apps/POSSystem/components/ClockInModal.tsx`

**Replace entire component logic:**

```tsx
const ClockInModal: React.FC<ClockInModalProps> = ({ isOpen, onClose, storeId }) => {
  const [step, setStep] = useState<'employee' | 'manager'>('employee');
  const [employeePIN, setEmployeePIN] = useState('');
  const [managerPIN, setManagerPIN] = useState('');
  const [employeeData, setEmployeeData] = useState<any>(null);
  const [error, setError] = useState('');

  const [validatePIN] = useValidatePINMutation();
  const [clockIn] = useClockInMutation();

  // Step 1: Validate employee PIN
  const handleEmployeePINSubmit = async () => {
    if (employeePIN.length !== 5) return;

    try {
      const result = await validatePIN({ pin: employeePIN }).unwrap();
      setEmployeeData(result);

      // Check if manager/assistant manager (no second auth needed)
      if (result.type === 'MANAGER' || result.type === 'ASSISTANT_MANAGER') {
        // Direct clock-in
        await handleClockIn(result.userId, employeePIN);
      } else {
        // Staff/Driver - need manager auth
        setStep('manager');
      }
    } catch (err) {
      setError('Invalid PIN');
      setEmployeePIN('');
    }
  };

  // Step 2: Validate manager PIN (for staff)
  const handleManagerPINSubmit = async () => {
    if (managerPIN.length !== 5) return;

    try {
      const managerResult = await validatePIN({ pin: managerPIN }).unwrap();

      // Verify this is actually a manager
      if (managerResult.type !== 'MANAGER' && managerResult.type !== 'ASSISTANT_MANAGER') {
        setError('Only managers can authorize staff clock-in');
        setManagerPIN('');
        return;
      }

      // Verify same store
      if (managerResult.storeId !== employeeData.storeId) {
        setError('Manager must be from same store');
        setManagerPIN('');
        return;
      }

      // Clock in staff
      await handleClockIn(employeeData.userId, employeePIN, managerResult.userId);
    } catch (err) {
      setError('Invalid manager PIN');
      setManagerPIN('');
    }
  };

  const handleClockIn = async (employeeId: string, pin: string, managerId?: string) => {
    try {
      await clockIn({
        employeeId,
        pin,
        authorizedBy: managerId
      }).unwrap();

      toast.success(`${employeeData.name} clocked in successfully`);
      onClose();
      reset();
    } catch (err) {
      setError('Failed to clock in');
    }
  };

  const reset = () => {
    setStep('employee');
    setEmployeePIN('');
    setManagerPIN('');
    setEmployeeData(null);
    setError('');
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div style={styles.container}>
        {step === 'employee' ? (
          <>
            <h2>Clock In</h2>
            <p>Enter your 5-digit PIN</p>
            <PINInput
              value={employeePIN}
              onChange={setEmployeePIN}
              onSubmit={handleEmployeePINSubmit}
            />
          </>
        ) : (
          <>
            <h2>Manager Authorization Required</h2>
            <p>Clocking in: {employeeData.name}</p>
            <p>Manager: Enter your PIN to authorize</p>
            <PINInput
              value={managerPIN}
              onChange={setManagerPIN}
              onSubmit={handleManagerPINSubmit}
            />
            <button onClick={() => setStep('employee')}>Back</button>
          </>
        )}

        {error && <div style={styles.error}>{error}</div>}
      </div>
    </Modal>
  );
};
```

#### 5.2 Update Backend Clock-In to Accept Authorization
**Path:** `user-service/src/main/java/com/MaSoVa/user/controller/WorkingSessionController.java`

**Update clockInWithPin endpoint:**
```java
@PostMapping("/clock-in")
@Operation(summary = "Clock in with PIN (manager auth for staff)")
public ResponseEntity<?> clockIn(
        @RequestBody Map<String, String> request,
        HttpServletRequest httpRequest) {

    String pin = request.get("pin");
    String authorizedBy = request.get("authorizedBy"); // Manager ID (optional)
    String storeId = StoreContextUtil.getStoreIdFromHeaders(httpRequest);

    if (pin == null || pin.length() != 5) {
        return ResponseEntity.badRequest().body(Map.of("error", "Invalid PIN"));
    }

    try {
        // Validate employee PIN
        User employee = userService.findUserByPIN(pin);
        if (employee == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid PIN"));
        }

        // Check if manager authorization required
        boolean needsAuth = employee.getType() == UserType.STAFF ||
                           employee.getType() == UserType.DRIVER;

        if (needsAuth && (authorizedBy == null || authorizedBy.isEmpty())) {
            return ResponseEntity.status(403).body(Map.of(
                "error", "Manager authorization required",
                "employeeId", employee.getId(),
                "employeeName", employee.getPersonalInfo().getName()
            ));
        }

        // Create session
        WorkingSession session = sessionService.startSession(employee.getId(), storeId);

        // Add authorization note if provided
        if (authorizedBy != null) {
            session.setNotes("Authorized by manager: " + authorizedBy);
            sessionRepository.save(session);
        }

        return ResponseEntity.ok(Map.of(
            "message", "Clocked in successfully",
            "session", mapToResponse(session)
        ));
    } catch (Exception e) {
        return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
    }
}
```

---

## Part 6: Testing & Validation

### 6.1 Testing Checklist

**PIN Generation:**
- [ ] Create staff member → Verify 5-digit PIN displayed
- [ ] Create multiple staff in same store → Verify no duplicates
- [ ] Create staff in different stores → Verify can have same PIN
- [ ] Verify PIN stored as BCrypt hash in database

**PIN Authentication:**
- [ ] Enter valid 5-digit PIN → Authenticate successfully
- [ ] Enter invalid PIN → Show error
- [ ] Enter manager PIN → Clock in without manager auth
- [ ] Enter staff PIN → Require manager auth

**Active Sessions Display:**
- [ ] Clock in staff → Session appears immediately
- [ ] Multiple staff clock in → All sessions visible
- [ ] Sessions grouped by employee name
- [ ] Timer ticks every second (HH:MM:SS format)
- [ ] Clock out → Session disappears from active list

**POS Order Creation:**
- [ ] Open POS without login → Access granted
- [ ] Start new order → PIN modal appears
- [ ] Enter PIN → User authenticated, order creation allowed
- [ ] Complete order → Order saved with staff ID
- [ ] New order → PIN required again

### 6.2 Database Migrations

**Run compound index creation:**
```javascript
// MongoDB shell
use masova_db;

// Add compound index for store+PIN uniqueness
db.users.createIndex(
  { "storeId": 1, "employeeDetails.employeePINHash": 1 },
  {
    unique: true,
    sparse: true,
    name: "store_pin_unique"
  }
);

// Verify index created
db.users.getIndexes();
```

### 6.3 Backwards Compatibility

**Handle existing users with old 4-digit PINs:**

**Option A: Force regeneration on next login**
```java
// In login flow, check if PIN is old format
if (user.getEmployeeDetails().getEmployeePINHash().length() < 60) {
    // Old 4-digit PIN, regenerate
    String newPin = generateEmployeePIN(user.getId(), user.getStoreId());
    // Send notification to manager with new PIN
}
```

**Option B: Migration script**
```java
// Run once on all existing employees
List<User> employees = userRepository.findAll()
    .stream()
    .filter(User::isEmployee)
    .collect(Collectors.toList());

for (User emp : employees) {
    String newPin = generateEmployeePIN(emp.getId(), emp.getStoreId());
    // Log new PIN or send to manager
    System.out.println(emp.getPersonalInfo().getName() + " - New PIN: " + newPin);
}
```

---

## Implementation Order

### Phase 1: Fix Active Sessions (Priority: CRITICAL)
1. Fix field name mismatches in ActiveSessionsWidget.tsx ✓ Simple
2. Fix field name mismatch in StaffManagementPage.tsx ✓ Simple
3. Add live HH:MM:SS timer ✓ Medium
4. Test with existing session data

### Phase 2: Grouped Sessions Display
1. Create ExpandableEmployeeRow component ✓ Medium
2. Update StaffManagementPage to group sessions ✓ Medium
3. Add expand/collapse functionality ✓ Easy
4. Test with multiple sessions per employee

### Phase 3: 5-Digit PIN System (Priority: HIGH)
1. Add compound index to User entity ✓ Simple
2. Update UserService PIN generation ✓ Complex
3. Update UserRepository query method ✓ Simple
4. Auto-generate PIN on user creation ✓ Medium
5. Update UserController to return PIN ✓ Medium
6. Update frontend to display PIN modal ✓ Medium
7. Create PINDisplayModal component ✓ Medium
8. Test PIN uniqueness and display

### Phase 4: POS Public Access & PIN Auth
1. Remove authentication from POS route ✓ Simple
2. Create PINAuthModal component ✓ Complex
3. Add PIN validation endpoint ✓ Medium
4. Add findUserByPIN method ✓ Medium
5. Update POSDashboard for PIN flow ✓ Complex
6. Update Order entity with staff fields ✓ Simple
7. Update order creation flow ✓ Medium
8. Test end-to-end order creation

### Phase 5: Dual Authentication Clock-In
1. Update ClockInModal for two-step auth ✓ Complex
2. Update backend clock-in endpoint ✓ Medium
3. Add manager authorization logic ✓ Medium
4. Test manager vs staff clock-in

### Phase 6: Testing & Migration
1. Test all flows end-to-end
2. Create database migration script
3. Handle existing users
4. Deploy and monitor

---

## Critical Files to Modify

### Backend (Java Spring Boot)
1. `shared-models/src/main/java/com/MaSoVa/shared/entity/User.java` - Add compound index, update PIN field
2. `user-service/src/main/java/com/MaSoVa/user/service/UserService.java` - Rewrite PIN generation, add findUserByPIN
3. `user-service/src/main/java/com/MaSoVa/user/repository/UserRepository.java` - Add PIN query methods
4. `user-service/src/main/java/com/MaSoVa/user/controller/UserController.java` - Update endpoints, add PIN validation
5. `user-service/src/main/java/com/MaSoVa/user/controller/WorkingSessionController.java` - Update clock-in logic
6. `order-service/src/main/java/com/MaSoVa/order/entity/Order.java` - Add staff tracking fields
7. `order-service/src/main/java/com/MaSoVa/order/dto/CreateOrderRequest.java` - Add staff fields

### Frontend (React TypeScript)
1. `frontend/src/apps/POSSystem/components/ActiveSessionsWidget.tsx` - Fix field names, add timer
2. `frontend/src/pages/manager/StaffManagementPage.tsx` - Add grouping, fix timer
3. `frontend/src/pages/manager/components/ExpandableEmployeeRow.tsx` - NEW FILE
4. `frontend/src/components/modals/PINDisplayModal.tsx` - NEW FILE
5. `frontend/src/apps/POSSystem/components/PINAuthModal.tsx` - NEW FILE
6. `frontend/src/apps/POSSystem/components/ClockInModal.tsx` - Rewrite for two-step auth
7. `frontend/src/apps/POSSystem/POSDashboard.tsx` - Add PIN auth flow
8. `frontend/src/apps/POSSystem/components/CustomerPanel.tsx` - Add staff tracking
9. `frontend/src/App.tsx` - Remove POS route protection
10. `frontend/src/store/api/userApi.ts` - Add PIN endpoints

---

## Security Considerations

### PIN Security
- ✓ BCrypt hashing with high work factor (10+ rounds)
- ✓ Store-level uniqueness prevents PIN reuse within store
- ✓ 100,000 possible combinations (10x better than 4-digit)
- ✓ Rate limiting on PIN validation endpoint (prevent brute force)
- ✓ PIN displayed only once on creation
- ✓ No PIN retrieval API (security by design)

### POS Public Access
- ✓ No authentication state stored locally
- ✓ Per-order authentication prevents unauthorized access
- ✓ Manager authorization for staff clock-in prevents fraud
- ✓ Order audit trail with staff ID
- ✓ Session expiry after order completion

### Recommendations
1. Add rate limiting: 5 failed PIN attempts = 15-minute lockout
2. Log all PIN validation attempts for audit
3. Implement IP-based rate limiting on public POS
4. Add CAPTCHA after 3 failed attempts (optional)
5. Send alerts to managers for suspicious activity

---

## End of Implementation Plan

Total estimated implementation time: 3-4 days for full system
Priority order: Fix sessions → PIN system → POS public → Dual auth → Testing
