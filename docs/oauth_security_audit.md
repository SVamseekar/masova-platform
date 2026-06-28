# Google OAuth 2.0 Security & Architecture Audit

We have performed a deep-dive audit of the Google OAuth 2.0 implementation in both the frontend (React) and backend (`core-service`). While the frontend integration using `@react-oauth/google` is clean, the backend validation and account provisioning in [UserService.java](file:///Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java) contain several critical vulnerabilities and architectural bugs.

---

## Summary of Findings

| Severity | Issue | Impact | Resolution |
| :--- | :--- | :--- | :--- |
| 🔴 **CRITICAL** | **JWT Audience Bypass (ID Token Spoofing)** | Attackers can log in as *any* user email by presenting a valid Google ID token minted for a different app. | Enforce audience validation strictly; reject token if `googleOAuthClientId` is empty or mismatched. |
| 🔴 **CRITICAL** | **Database Constraint Conflict (Phone Uniqueness)** | The second user trying to register via Google will crash with a unique index violation on phone number `"0000000000"`. | Request phone number during signup, or generate a unique temporary phone suffix. |
| 🟡 **HIGH** | **Validation Mismatch (Indian Phone Pattern)** | The placeholder phone `"0000000000"` fails the regex pattern `^[6-9]\d{9}$` required by the `@Pattern` validator. | Generate a matching temporary phone format (e.g. `9` + random digits) or enforce input during OAuth signup. |
| 🟡 **HIGH** | **Missing `email_verified` Claim Check** | An attacker can create a fake Google account with the victim's email (unverified) and hijack the victim's MaSoVa account. | Explicitly verify that the `email_verified` claim is `true`. |
| 🟢 **MEDIUM** | **Performance & Latency (Online Tokeninfo Lookup)** | Sending a HTTP request to Google's tokeninfo API on every login adds ~200ms latency and relies on external service availability. | Use `GoogleIdTokenVerifier` for local cryptographic verification using cached public keys. |

---

## Detailed Vulnerability Analysis

### 1. Critical: Audience Verification Bypass
In [UserService.java#L358](file:///Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java#L358):
```java
if (googleOAuthClientId != null && !googleOAuthClientId.isEmpty()) {
    String aud = (String) tokenInfo.get("aud");
    if (!googleOAuthClientId.equals(aud)) {
        throw new RuntimeException("Google ID token audience mismatch");
    }
}
```
If `google.oauth.client-id` is empty (default configuration in `application.yml`: `${GOOGLE_OAUTH_CLIENT_ID:}`), the audience check is **completely skipped**. 
* **Exploit Scenario**: An attacker signs up to a Google account under their control, obtains a valid ID Token from a different client application, and sends it to the MaSoVa API. Since the signature is valid, the API parses the email and logs them in as the targeted victim.

### 2. Critical: PostgreSQL & MongoDB Unique Constraint Conflict
During registration in [UserService.java#L440](file:///Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java#L440):
```java
personalInfo.setPhone("0000000000"); // placeholder; user must update in profile
```
However, both databases enforce uniqueness constraints:
- **PostgreSQL**: `uq_users_phone` in [UserEntity.java#L27](file:///Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/core-service/src/main/java/com/MaSoVa/core/user/entity/UserEntity.java#L27)
- **MongoDB**: `@Indexed(unique = true)` on `phone` in [User.java#L126](file:///Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/shared-models/src/main/java/com/MaSoVa/shared/entity/User.java#L126)
* **Impact**: The first user registering via Google succeeds. The second user fails with:
  ```
  Duplicate key exception: uq_users_phone / uq_users_mongo_id
  ```

### 3. High: Phone Validation Regex Mismatch
The MongoDB model [User.java#L125](file:///Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/shared-models/src/main/java/com/MaSoVa/shared/entity/User.java#L125) enforces:
```java
@Pattern(regexp = "^[6-9]\\d{9}$", message = "Invalid Indian phone number")
```
Setting `phone` to `"0000000000"` fails validation at the repository layer, preventing the database from persisting the user during Google registration.

### 4. High: Lack of `email_verified` Check
Google's payload includes a claim indicating whether Google has verified ownership of the email.
* **Exploit Scenario**: If an attacker signs up for Google with `target_user@company.com` but hasn't verified ownership yet, Google will issue an ID Token where `email_verified` is `false`. By accepting this token, the server allows account takeover.

---

## Suggested Remediation

To secure the authentication flow, apply the following fixes.

### Fix A: Secure [UserService.java](file:///Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/core-service/src/main/java/com/MaSoVa/core/user/service/UserService.java)

1. Enforce the audience check strictly (do not bypass if `googleOAuthClientId` is blank).
2. Validate `email_verified`.
3. Generate a temporary, unique, and valid Indian format phone number during registration (or prompt the user for their phone number in a multi-step registration flow before saving).

```diff
     public LoginResponse loginWithGoogle(String idToken) {
         logger.info("Google Sign-In attempt");
 
         Map<String, Object> tokenInfo = verifyGoogleIdToken(idToken);
         String googleSub = (String) tokenInfo.get("sub");
         String email = (String) tokenInfo.get("email");
+        Object emailVerified = tokenInfo.get("email_verified");
 
         if (googleSub == null || email == null) {
             throw new RuntimeException("Invalid Google ID token: missing sub or email");
         }
 
-        if (googleOAuthClientId != null && !googleOAuthClientId.isEmpty()) {
-            String aud = (String) tokenInfo.get("aud");
-            if (!googleOAuthClientId.equals(aud)) {
-                throw new RuntimeException("Google ID token audience mismatch");
-            }
+        if (googleOAuthClientId == null || googleOAuthClientId.isEmpty()) {
+            throw new IllegalStateException("Google OAuth Client ID is not configured on the server");
+        }
+
+        String aud = (String) tokenInfo.get("aud");
+        if (!googleOAuthClientId.equals(aud)) {
+            throw new RuntimeException("Google ID token audience mismatch");
+        }
+
+        if (emailVerified != null && !Boolean.parseBoolean(String.valueOf(emailVerified))) {
+            throw new RuntimeException("Google email address is not verified");
         }
 
         Optional<User> existingByEmail = userRepository.findByPersonalInfoEmail(email);
```

```diff
     public LoginResponse registerWithGoogle(String idToken) {
         logger.info("Google Register attempt");
 
         Map<String, Object> tokenInfo = verifyGoogleIdToken(idToken);
         String googleSub = (String) tokenInfo.get("sub");
         String email = (String) tokenInfo.get("email");
         String name = (String) tokenInfo.get("name");
+        Object emailVerified = tokenInfo.get("email_verified");
 
         if (googleSub == null || email == null) {
             throw new RuntimeException("Invalid Google ID token: missing sub or email");
         }
 
-        if (googleOAuthClientId != null && !googleOAuthClientId.isEmpty()) {
-            String aud = (String) tokenInfo.get("aud");
-            if (!googleOAuthClientId.equals(aud)) {
-                throw new RuntimeException("Google ID token audience mismatch");
-            }
+        if (googleOAuthClientId == null || googleOAuthClientId.isEmpty()) {
+            throw new IllegalStateException("Google OAuth Client ID is not configured on the server");
+        }
+
+        String aud = (String) tokenInfo.get("aud");
+        if (!googleOAuthClientId.equals(aud)) {
+            throw new RuntimeException("Google ID token audience mismatch");
+        }
+
+        if (emailVerified != null && !Boolean.parseBoolean(String.valueOf(emailVerified))) {
+            throw new RuntimeException("Google email address is not verified");
         }
 
         Optional<User> existingByEmail = userRepository.findByPersonalInfoEmail(email);
         if (existingByEmail.isPresent()) {
             throw new RuntimeException("An account already exists for this Google email. Please sign in instead.");
         }
 
         User user = new User();
         user.setType(UserType.CUSTOMER);
 
         User.PersonalInfo personalInfo = new User.PersonalInfo();
         personalInfo.setName(name != null ? name : email.split("@")[0]);
         personalInfo.setEmail(email);
-        personalInfo.setPhone("0000000000"); // placeholder; user must update in profile
+        
+        // Generate unique temporary phone number that matches Indian validation pattern: ^[6-9]\d{9}$
+        // Since sub is unique, we suffix a formatted random seed or portion of sub
+        String tempPhone = "9" + String.format("%09d", Math.abs((googleSub + email).hashCode()) % 1000000000L);
+        personalInfo.setPhone(tempPhone);
+
         personalInfo.setPasswordHash(passwordEncoder.encode(java.util.UUID.randomUUID().toString()));
         user.setPersonalInfo(personalInfo);
```

### Fix B: Optimize Google Token Verification (Local Cryptographic Verification)

Instead of sending an HTTP request to `oauth2.googleapis.com`, verify the token locally.

1. Add the dependency to `pom.xml`:
   ```xml
   <dependency>
       <groupId>com.google.api-client</groupId>
       <artifactId>google-api-client</artifactId>
       <version>2.2.0</version>
   </dependency>
   ```

2. Replace `verifyGoogleIdToken` implementation with offline verification:
   ```java
   import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
   import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
   import com.google.api.client.http.javanet.NetHttpTransport;
   import com.google.api.client.json.gson.GsonFactory;
   import java.util.Collections;

   private Map<String, Object> verifyGoogleIdToken(String idToken) {
       try {
           GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
               .setAudience(Collections.singletonList(googleOAuthClientId))
               .build();

           GoogleIdToken token = verifier.verify(idToken);
           if (token == null) {
               throw new RuntimeException("Google ID token validation failed");
           }
           
           GoogleIdToken.Payload payload = token.getPayload();
           Map<String, Object> claims = new HashMap<>();
           claims.put("sub", payload.getSubject());
           claims.put("email", payload.getEmail());
           claims.put("email_verified", payload.getEmailVerified());
           claims.put("name", payload.get("name"));
           claims.put("aud", payload.getAudience());
           return claims;
       } catch (Exception e) {
           logger.error("Local Google token verification failed: {}", e.getMessage());
           throw new RuntimeException("Google token verification failed: " + e.getMessage());
       }
   }
   ```
