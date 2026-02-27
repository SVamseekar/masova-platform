# GDPR Compliance Guide - MaSoVa Restaurant Management System

**Version:** 1.0
**Last Updated:** November 25, 2025
**Compliance Standard:** EU General Data Protection Regulation (GDPR)

---

## Table of Contents

1. [Overview](#overview)
2. [GDPR Implementation Architecture](#gdpr-implementation-architecture)
3. [Data Subject Rights](#data-subject-rights)
4. [Consent Management](#consent-management)
5. [Data Retention & Deletion](#data-retention--deletion)
6. [Data Breach Notification](#data-breach-notification)
7. [Data Processing Agreements](#data-processing-agreements)
8. [Audit Logging](#audit-logging)
9. [Privacy by Design](#privacy-by-design)
10. [API Documentation](#api-documentation)
11. [Frontend Components](#frontend-components)
12. [Compliance Checklist](#compliance-checklist)

---

## Overview

MaSoVa Restaurant Management System implements comprehensive GDPR compliance following industry best practices from leading EU-compliant platforms like Shopify and Stripe. Our approach integrates GDPR features directly into the existing microservices architecture rather than creating a separate GDPR service.

### Key Compliance Features

✅ **Consent Management** - Granular user consent tracking
✅ **Data Subject Rights** - Access, Rectification, Erasure, Portability
✅ **Data Retention Policies** - Automated data lifecycle management
✅ **Breach Notification** - 72-hour authority notification system
✅ **Audit Logging** - Complete GDPR action tracking
✅ **Privacy by Design** - Built-in from the ground up
✅ **Cookie Consent** - EU-compliant cookie management
✅ **DPA Management** - Third-party processor agreements

---

## GDPR Implementation Architecture

### Integrated Approach

Following industry standards from Shopify, Stripe, and major SaaS platforms, GDPR features are integrated into the **user-service** microservice rather than as a separate service. This approach provides:

- **Better Performance** - Reduced network overhead
- **Simpler Architecture** - Fewer moving parts
- **Easier Maintenance** - Single service for user data operations
- **GDPR Compliance** - All user data operations in one place

### Database Collections

```
gdpr_consents           - User consent records
gdpr_data_requests      - Data subject rights requests
gdpr_audit_logs         - Complete audit trail
gdpr_data_retention     - Retention policy definitions
gdpr_data_breaches      - Data breach tracking
gdpr_dpa                - Data Processing Agreements
```

### Backend Components

```
user-service/
├── repository/
│   ├── GdprConsentRepository.java
│   ├── GdprDataRequestRepository.java
│   ├── GdprAuditLogRepository.java
│   ├── GdprDataRetentionRepository.java
│   ├── GdprDataBreachRepository.java
│   └── GdprDpaRepository.java
├── service/
│   ├── GdprConsentService.java
│   ├── GdprDataRequestService.java
│   ├── GdprDataRetentionService.java
│   └── GdprBreachService.java
├── controller/
│   └── GdprController.java
└── dto/
    ├── GdprConsentRequest.java
    └── GdprDataRequestDto.java
```

### Frontend Components

```
frontend/
├── components/gdpr/
│   └── CookieConsent.tsx
└── pages/
    ├── PrivacyPolicy.tsx
    └── GdprRequests.tsx
```

---

## Data Subject Rights

### Right to Access (Article 15)

Users can request a copy of all personal data we hold about them.

**Implementation:**
- Endpoint: `POST /api/gdpr/request/{requestId}/access`
- Service: `GdprDataRequestService.processAccessRequest()`
- Response time: Within 30 days
- Format: JSON export of all user data

**Data Included:**
- Personal information (name, email, phone)
- Order history
- Preferences and settings
- Audit logs

### Right to Rectification (Article 16)

Users can request corrections to inaccurate or incomplete personal data.

**Implementation:**
- Endpoint: `POST /api/gdpr/request/{requestId}/rectification`
- Service: `GdprDataRequestService.processRectificationRequest()`
- Allows update of: Name, phone, address, preferences

### Right to Erasure / Right to be Forgotten (Article 17)

Users can request deletion of their personal data.

**Implementation:**
- Endpoint: `POST /api/gdpr/request/{requestId}/erasure`
- Service: `GdprDataRequestService.processErasureRequest()`
- Method: **Data Anonymization** (not hard deletion for legal/audit compliance)

**Anonymization Process:**
```java
- Name → "DELETED_USER_[random_id]"
- Email → "deleted_[uuid]@deleted.local"
- Phone → "0000000000"
- Address → null
- Password → null
- Preferences → null
- Account → isActive = false
```

**Legal Exceptions:**
- Order data retained for 7 years (tax/legal requirements)
- Audit logs retained for 6 years (compliance)
- Anonymized data retained indefinitely

### Right to Data Portability (Article 20)

Users can receive their data in a structured, machine-readable format.

**Implementation:**
- Endpoint: `POST /api/gdpr/request/{requestId}/portability`
- Service: `GdprDataRequestService.processPortabilityRequest()`
- Format: JSON with metadata
- Includes: All personal data in portable format

**Export Format:**
```json
{
  "format": "JSON",
  "version": "1.0",
  "exportedAt": "2025-01-01T12:00:00",
  "standardCompliance": "GDPR Article 20",
  "userId": "...",
  "personalInfo": {...},
  "preferences": {...}
}
```

---

## Consent Management

### Consent Types

```java
public enum ConsentType {
    TERMS_AND_CONDITIONS,       // Required for account creation
    PRIVACY_POLICY,             // Required for account creation
    COOKIE_POLICY,              // Required for cookie usage
    MARKETING_COMMUNICATIONS,   // Optional - email/SMS marketing
    DATA_PROCESSING,            // Required for service delivery
    THIRD_PARTY_SHARING,        // Optional - sharing with partners
    ANALYTICS_TRACKING,         // Optional - usage analytics
    PERSONALIZATION,            // Optional - personalized features
    LOCATION_TRACKING,          // Optional - location-based services
    NOTIFICATIONS,              // Optional - push notifications
    PROFILING                   // Optional - user profiling
}
```

### Granting Consent

**Endpoint:** `POST /api/gdpr/consent/grant`

**Request:**
```json
{
  "userId": "user123",
  "consentType": "MARKETING_COMMUNICATIONS",
  "version": "1.0",
  "consentText": "I consent to receive marketing emails"
}
```

**Automatic Tracking:**
- IP address
- User agent
- Timestamp
- Consent version
- Expiration date (if applicable)

### Revoking Consent

**Endpoint:** `POST /api/gdpr/consent/revoke`

**Requirements:**
- User can revoke consent at any time
- Revocation is immediate
- Audit trail maintained
- No negative consequences for user

### Consent Expiration

Marketing and analytics consents automatically expire after 2 years and require re-consent.

**Automated Job:**
```java
@Scheduled(cron = "0 0 2 * * *")
public void expireOldConsents()
```

---

## Data Retention & Deletion

### Retention Policies

| Data Type | Retention Period | Legal Basis | Auto-Delete |
|-----------|------------------|-------------|-------------|
| Active user accounts | Until account deletion | Contract | No |
| Inactive accounts | Last login + 3 years | Legitimate interest | Yes |
| Order history | 7 years | Legal obligation (tax) | No |
| Audit logs | 6 years | Legal obligation | Yes |
| Session data | 30 days | Legitimate interest | Yes |
| Marketing consents | 2 years from last interaction | Consent | Yes |
| Analytics data | 2 years | Consent | Yes |

### Automated Deletion

**Scheduled Job:** Runs daily at 2:00 AM

```java
@Scheduled(cron = "0 0 2 * * *")
public void applyRetentionPolicies()
```

**Process:**
1. Query retention policies
2. Identify data past retention period
3. Anonymize or delete data
4. Create audit log entry
5. Generate compliance report

### Creating Retention Policies

**Endpoint:** `POST /api/gdpr/retention/policy`

```json
{
  "dataType": "INACTIVE_USER_ACCOUNTS",
  "retentionPeriodDays": 1095,
  "legalBasis": "Legitimate interest",
  "description": "Delete inactive accounts after 3 years",
  "autoDeleteEnabled": true
}
```

---

## Data Breach Notification

### GDPR Requirements

- **Authority Notification:** Within 72 hours of detection
- **User Notification:** Without undue delay if high risk
- **Documentation:** Maintain breach register

### Reporting a Breach

**Service:** `GdprBreachService.reportBreach()`

```java
GdprDataBreach breach = breachService.reportBreach(
    "Unauthorized access to user database",
    "Database credentials were exposed",
    BreachSeverity.HIGH,
    "security-team@masova.com",
    affectedUserIds,
    affectedDataTypes
);
```

### Breach Severity Levels

```java
public enum BreachSeverity {
    LOW,        // Minimal risk to users
    MEDIUM,     // Some risk, monitoring required
    HIGH,       // Significant risk, authority notification required
    CRITICAL    // Severe risk, immediate action required
}
```

### Notification Workflow

1. **Detection** → Breach reported to system
2. **Assessment** → Severity evaluation
3. **Containment** → Immediate security measures
4. **Authority Notification** → Within 72 hours (HIGH/CRITICAL)
5. **User Notification** → If high risk to rights
6. **Resolution** → Fix vulnerability
7. **Documentation** → Breach report generated

### Automated Monitoring

**Scheduled Job:** Checks for overdue notifications every hour

```java
@Scheduled(cron = "0 0 * * * *")
public void checkOverdueNotifications()
```

**Alerts:**
- Logs critical error if breach notification overdue
- Escalates to management
- Compliance dashboard updated

---

## Data Processing Agreements

### DPA Management

Track all third-party processors with Data Processing Agreements.

**Entity:** `GdprDpa`

**Key Fields:**
- Processor name and contact
- Purpose of processing
- Data categories and subjects
- Security measures
- Sub-processors
- Data retention period
- Audit rights
- Effective dates

### Third-Party Processors

| Processor | Purpose | DPA Status | Data Transfer |
|-----------|---------|------------|---------------|
| MongoDB Atlas | Database hosting | Signed | SCCs |
| AWS/Azure | Cloud infrastructure | Signed | SCCs |
| Razorpay | Payment processing | Signed | India (adequate) |
| Stripe | Payment processing | Signed | SCCs |
| SendGrid | Email delivery | Signed | SCCs |

### Creating DPA

```java
GdprDpa dpa = new GdprDpa(
    "MongoDB Atlas",
    "Database hosting and management"
);
dpa.setDataCategories(Arrays.asList("Personal Info", "Orders"));
dpa.setSecurityMeasures(Arrays.asList("Encryption at rest", "TLS"));
dpa.setDataTransferMechanism("Standard Contractual Clauses");
dpa.setStatus(DpaStatus.SIGNED);
```

---

## Audit Logging

### GDPR Action Types

All GDPR-related actions are logged in `gdpr_audit_logs`:

```java
public enum GdprActionType {
    CONSENT_GRANTED,           // User grants consent
    CONSENT_REVOKED,           // User revokes consent
    CONSENT_UPDATED,           // Consent updated
    DATA_ACCESSED,             // Data access request processed
    DATA_EXPORTED,             // Data export request processed
    DATA_RECTIFIED,            // Data correction made
    DATA_DELETED,              // Data deletion performed
    DATA_ANONYMIZED,           // Data anonymized
    PROCESSING_RESTRICTED,     // Processing restriction applied
    PROCESSING_OBJECTED,       // User objects to processing
    REQUEST_SUBMITTED,         // GDPR request submitted
    REQUEST_PROCESSED,         // GDPR request completed
    POLICY_ACCEPTED,           // Policy acceptance
    POLICY_DECLINED,           // Policy declined
    BREACH_DETECTED,           // Data breach detected
    BREACH_NOTIFIED,           // Breach notification sent
    DPA_SIGNED,                // DPA signed with processor
    RETENTION_POLICY_APPLIED,  // Data retention policy executed
    DATA_TRANSFERRED           // Data transferred to third party
}
```

### Audit Log Contents

Each audit log entry contains:
- User ID
- Action type
- Performed by (user ID or "SYSTEM")
- Timestamp
- IP address
- User agent
- Description
- Before/after state
- Metadata
- Legal basis
- Success/failure status

### Querying Audit Logs

**Endpoint:** `GET /api/gdpr/audit/{userId}`

**Use Cases:**
- User requests their activity history
- Compliance audits
- Investigating incidents
- Demonstrating GDPR compliance

---

## Privacy by Design

### Principles Implemented

1. **Proactive not Reactive** - GDPR built-in from the start
2. **Privacy as Default** - Minimal data collection by default
3. **Privacy Embedded in Design** - Not an add-on
4. **Full Functionality** - Positive-sum, not zero-sum
5. **End-to-End Security** - Lifecycle protection
6. **Visibility and Transparency** - Clear privacy policies
7. **Respect for User Privacy** - User-centric

### Technical Measures

**Encryption:**
- Passwords: BCrypt hashing
- Data in transit: TLS 1.3
- Data at rest: AES-256 encryption
- Sensitive fields: Field-level encryption

**Access Control:**
- Role-based access control (RBAC)
- Principle of least privilege
- JWT authentication
- Session management

**Data Minimization:**
- Collect only necessary data
- Purpose limitation
- Storage limitation
- Regular data reviews

---

## API Documentation

### Consent Management Endpoints

#### Grant Consent
```
POST /api/gdpr/consent/grant
Body: {userId, consentType, version, consentText}
Response: GdprConsent object
```

#### Revoke Consent
```
POST /api/gdpr/consent/revoke
Params: userId, consentType
Response: GdprConsent object
```

#### Get User Consents
```
GET /api/gdpr/consent/user/{userId}
Response: List<GdprConsent>
```

#### Check Consent
```
GET /api/gdpr/consent/check?userId={userId}&consentType={type}
Response: {userId, consentType, hasActiveConsent}
```

### Data Request Endpoints

#### Create Request
```
POST /api/gdpr/request
Body: {userId, requestType, reason}
Response: GdprDataRequest object
```

#### Verify Request
```
POST /api/gdpr/request/{requestId}/verify?token={token}
Response: GdprDataRequest object
```

#### Process Access Request
```
POST /api/gdpr/request/{requestId}/access
Response: Complete user data JSON
```

#### Process Erasure Request
```
POST /api/gdpr/request/{requestId}/erasure
Response: {message: "success"}
```

#### Process Portability Request
```
POST /api/gdpr/request/{requestId}/portability
Response: Portable user data JSON
```

#### Process Rectification Request
```
POST /api/gdpr/request/{requestId}/rectification
Body: {updates}
Response: {message: "success"}
```

#### Get User Requests
```
GET /api/gdpr/request/user/{userId}
Response: List<GdprDataRequest>
```

### Audit Endpoints

#### Get User Audit Logs
```
GET /api/gdpr/audit/{userId}
Response: List<GdprAuditLog>
```

---

## Frontend Components

### Cookie Consent Banner

**Component:** `CookieConsent.tsx`

**Features:**
- Appears on first visit
- Accept all / Reject all / Customize options
- Granular cookie preferences
- Consent saved to backend and localStorage
- GDPR-compliant UI

**Cookie Categories:**
- Necessary (always active)
- Functional
- Analytics
- Marketing

### Privacy Policy Page

**Component:** `PrivacyPolicy.tsx`

**Sections:**
- Data controller information
- Data collection practices
- Legal basis for processing
- Data usage
- Third-party sharing
- User rights (GDPR)
- Data retention
- Security measures
- Contact information

### GDPR Requests Page

**Component:** `GdprRequests.tsx`

**Features:**
- Submit data subject rights requests
- View request history
- Track request status
- Download data exports
- 30-day response time indicator

**Request Types:**
- Access My Data
- Update My Data
- Delete My Data
- Export My Data
- Restrict Processing

---

## Compliance Checklist

### ✅ Legal Basis for Processing
- [x] Contract performance
- [x] Legal obligation
- [x] Legitimate interest
- [x] Consent (where required)

### ✅ Data Subject Rights
- [x] Right to access
- [x] Right to rectification
- [x] Right to erasure
- [x] Right to data portability
- [x] Right to restrict processing
- [x] Right to object
- [x] Right to withdraw consent

### ✅ Consent Management
- [x] Granular consent options
- [x] Easy consent revocation
- [x] Consent audit trail
- [x] Consent expiration
- [x] IP & timestamp tracking

### ✅ Data Protection
- [x] Encryption at rest
- [x] Encryption in transit
- [x] Access controls
- [x] Regular security audits
- [x] Data minimization

### ✅ Transparency
- [x] Privacy policy
- [x] Cookie policy
- [x] Clear consent language
- [x] DPO contact information
- [x] Data processing register

### ✅ Data Retention
- [x] Retention policies defined
- [x] Automated deletion
- [x] Legal retention periods
- [x] Regular data reviews

### ✅ Data Breach
- [x] Breach detection system
- [x] 72-hour notification process
- [x] Breach register
- [x] User notification procedures

### ✅ Third Parties
- [x] DPA with all processors
- [x] Data transfer mechanisms
- [x] Sub-processor registry
- [x] Audit rights

### ✅ Documentation
- [x] Processing activities record
- [x] Audit logs
- [x] Compliance documentation
- [x] Policy versions

---

## Contacts

**Data Protection Officer (DPO):** dpo@masova.com
**Privacy Team:** privacy@masova.com
**Security Team:** security@masova.com

**Supervisory Authority:** [Your local data protection authority]

---

## Sources & References

This GDPR implementation follows industry best practices from:

- [Shopify GDPR Compliance](https://help.shopify.com/en/manual/privacy-and-security/privacy/gdpr)
- [Stripe GDPR Implementation](https://stripe.com/legal/privacy-center)
- [GDPR Official Text](https://gdpr.eu/)
- [Restaurant Data Privacy Best Practices](https://www.fishbowl.com/blog/restaurant-data-privacy)
- [GDPR Compliance Framework 2025](https://auditboard.com/blog/gdpr-compliance-framework)

---

**Last Review Date:** November 25, 2025
**Next Review Date:** February 25, 2026
**Version:** 1.0
