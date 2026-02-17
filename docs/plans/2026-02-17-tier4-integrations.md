# Tier 4 — Integrations & Advanced Features Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add Google Sign-In across web and mobile, expand Google Maps usage (Places autocomplete, live tracking maps), and build the AI chat agent widget for customer web and mobile.

**Architecture:** Three integration streams: (1) Google Sign-In — backend new endpoint + web/mobile buttons, all using the same JWT flow; (2) Google Maps — extend existing integration, no new libraries for web, add react-native-google-places-autocomplete for mobile; (3) AI Agent — Python backend REST endpoint + React floating chat widget + mobile chat screen.

**Tech Stack:** Spring Boot (user-service), `@react-oauth/google`, `@react-native-google-signin/google-signin`, `@react-google-maps/api` (already installed), `react-native-maps` (already installed v1.20.1), `react-native-google-places-autocomplete`, Python FastAPI (for `/agent/chat`), Google ADK 1.25, RTK Query (new agentApi slice).

**Depends on:** All prior tiers complete. Point 12 schema audit complete (authProviders field documented).

---

## Critical Context

- User entity is at `shared-models/src/main/java/com/MaSoVa/shared/entity/User.java` — add `authProviders` list here
- UserController is at `user-service/src/main/java/com/MaSoVa/user/controller/UserController.java` — add `/auth/google` endpoint here
- UserService is at `user-service/src/main/java/com/MaSoVa/user/service/UserService.java` — add `loginWithGoogle()` here
- `user-service/src/main/resources/application.yml` — add `google.oauth.client-id` property
- Frontend `App.tsx` wraps all routes — add `GoogleOAuthProvider` here
- AI agent `main.py` runs with `adk web` — we add a FastAPI endpoint alongside it
- `masova-support/masova_agent/agent.py` has hardcoded mock data — replace tools with real HTTP calls
- Google Maps API key is already set as `VITE_GOOGLE_MAPS_API_KEY` in the web frontend
- For billing safety: set budget alerts in Google Cloud Console before enabling Places API

---

## Task 1: Backend — Add Google Sign-In Endpoint

**Files:**
- Modify: `shared-models/src/main/java/com/MaSoVa/shared/entity/User.java`
- Modify: `user-service/src/main/java/com/MaSoVa/user/controller/UserController.java`
- Modify: `user-service/src/main/java/com/MaSoVa/user/service/UserService.java`
- Modify: `user-service/src/main/resources/application.yml`

**Step 1: Read all 4 files before editing**

Read them fully. Note the existing `register()` and `login()` method signatures to match the pattern.

**Step 2: Add AuthProvider inner class to User entity**

In `User.java`, find the existing inner classes. Add:

```java
// Inside User.java, as a static inner class or separate file in shared-models
public static class AuthProvider {
    private String provider;   // "GOOGLE", "APPLE"
    private String providerId; // OAuth subject ID (sub field from ID token)
    private String email;

    public AuthProvider() {}
    public AuthProvider(String provider, String providerId, String email) {
        this.provider = provider;
        this.providerId = providerId;
        this.email = email;
    }
    // Getters and setters
    public String getProvider() { return provider; }
    public void setProvider(String provider) { this.provider = provider; }
    public String getProviderId() { return providerId; }
    public void setProviderId(String providerId) { this.providerId = providerId; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
```

Add the field to the User class body:

```java
@Field("authProviders")
private List<AuthProvider> authProviders = new ArrayList<>();

// Getter/setter
public List<AuthProvider> getAuthProviders() { return authProviders; }
public void setAuthProviders(List<AuthProvider> authProviders) { this.authProviders = authProviders; }
```

**Step 3: Add Google client ID to application.yml**

In `user-service/src/main/resources/application.yml`, add:

```yaml
google:
  oauth:
    client-id: ${GOOGLE_OAUTH_CLIENT_ID:your-client-id-here}
```

**Step 4: Create GoogleLoginRequest DTO**

Create `user-service/src/main/java/com/MaSoVa/user/dto/GoogleLoginRequest.java`:

```java
package com.MaSoVa.user.dto;

import jakarta.validation.constraints.NotBlank;

public class GoogleLoginRequest {
    @NotBlank
    private String idToken;

    public String getIdToken() { return idToken; }
    public void setIdToken(String idToken) { this.idToken = idToken; }
}
```

**Step 5: Add loginWithGoogle() to UserService**

In `UserService.java`, add this method. It validates the Google ID token by calling Google's tokeninfo endpoint (no new library needed — uses existing `RestTemplate` or `HttpClient`):

```java
public LoginResponse loginWithGoogle(String idToken) {
    // Step 1: Validate token with Google tokeninfo endpoint
    String tokenInfoUrl = "https://oauth2.googleapis.com/tokeninfo?id_token=" + idToken;

    Map<String, String> tokenInfo;
    try {
        RestTemplate restTemplate = new RestTemplate();
        tokenInfo = restTemplate.getForObject(tokenInfoUrl, Map.class);
    } catch (Exception e) {
        throw new RuntimeException("Invalid Google ID token: " + e.getMessage());
    }

    if (tokenInfo == null || tokenInfo.get("sub") == null) {
        throw new RuntimeException("Invalid Google ID token response");
    }

    // Step 2: Verify audience matches our client ID
    String configuredClientId = googleOAuthClientId; // @Value("${google.oauth.client-id}")
    String tokenAud = tokenInfo.get("aud");
    if (!configuredClientId.equals(tokenAud)) {
        throw new RuntimeException("Token audience mismatch");
    }

    String googleId = tokenInfo.get("sub");
    String email = tokenInfo.get("email");
    String name = tokenInfo.getOrDefault("name", email);
    String firstName = tokenInfo.getOrDefault("given_name", name.split(" ")[0]);
    String lastName = name.contains(" ") ? name.substring(name.indexOf(' ') + 1) : "";

    // Step 3: Find existing user by email or Google provider ID
    User user = userRepository.findByPersonalInfoEmail(email)
        .orElse(null);

    if (user == null) {
        // New user — create with CUSTOMER type
        user = new User();
        user.setType(UserType.CUSTOMER);
        User.PersonalInfo pi = new User.PersonalInfo();
        pi.setFirstName(firstName);
        pi.setLastName(lastName);
        pi.setEmail(email);
        user.setPersonalInfo(pi);
        user.setActive(true);
    }

    // Step 4: Link Google provider if not already linked
    List<User.AuthProvider> providers = user.getAuthProviders();
    if (providers == null) providers = new ArrayList<>();
    boolean alreadyLinked = providers.stream().anyMatch(p -> "GOOGLE".equals(p.getProvider()) && googleId.equals(p.getProviderId()));
    if (!alreadyLinked) {
        providers.add(new User.AuthProvider("GOOGLE", googleId, email));
        user.setAuthProviders(providers);
    }

    user = userRepository.save(user);

    // Step 5: Generate JWT (same as email login)
    String jwt = jwtService.generateToken(user);
    return new LoginResponse(jwt, null, mapToUserDto(user));
}
```

Add `@Value("${google.oauth.client-id}") private String googleOAuthClientId;` to the UserService class fields.

**Step 6: Add /auth/google endpoint to UserController**

```java
@PostMapping("/auth/google")
@Operation(summary = "Sign in or register with Google")
public ResponseEntity<LoginResponse> googleLogin(@Valid @RequestBody GoogleLoginRequest request) {
    try {
        LoginResponse response = userService.loginWithGoogle(request.getIdToken());
        return ResponseEntity.ok(response);
    } catch (Exception e) {
        logger.error("Google login failed: {}", e.getMessage());
        return ResponseEntity.status(401).build();
    }
}
```

**Step 7: Build and verify**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system
./mvnw compile -pl user-service -am
```

Expected: BUILD SUCCESS with no compilation errors.

**Step 8: Commit**

```bash
git add shared-models/src/main/java/com/MaSoVa/shared/entity/User.java
git add user-service/src/main/java/com/MaSoVa/user/
git add user-service/src/main/resources/application.yml
git commit -m "feat: add Google OAuth endpoint /auth/google with tokeninfo validation"
```

---

## Task 2: Web Frontend — Google Sign-In Button

**Files:**
- Modify: `frontend/package.json` (add dependency)
- Modify: `frontend/src/App.tsx`
- Modify: `frontend/src/pages/auth/LoginPage.tsx`
- Modify: `frontend/src/store/api/authApi.ts`

**Step 1: Install @react-oauth/google**

```bash
cd /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend
npm install @react-oauth/google
```

**Step 2: Add googleLogin mutation to authApi**

Read `frontend/src/store/api/authApi.ts`. Add a new mutation endpoint:

```typescript
googleLogin: builder.mutation<LoginResponse, { idToken: string }>({
  query: (body) => ({
    url: '/api/users/auth/google',
    method: 'POST',
    body,
  }),
}),
```

Export the hook: `export const { useLoginMutation, useGoogleLoginMutation } = authApi;`

**Step 3: Wrap App.tsx with GoogleOAuthProvider**

Read `frontend/src/App.tsx`. Find the root JSX return. Wrap with:

```tsx
import { GoogleOAuthProvider } from '@react-oauth/google';

// In the return statement:
<GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID ?? ''}>
  {/* existing app content */}
</GoogleOAuthProvider>
```

Add `VITE_GOOGLE_OAUTH_CLIENT_ID=your-client-id` to `frontend/.env.local` (create if not exists — this file is gitignored).

**Step 4: Add Google Sign-In button to LoginPage**

In `LoginPage.tsx`, import:

```typescript
import { GoogleLogin } from '@react-oauth/google';
import { useGoogleLoginMutation } from '../../store/api/authApi';
```

Add `const [googleLogin, { isLoading: isGoogleLoading }] = useGoogleLoginMutation();`

Add the Google button below the existing login form submit button:

```tsx
{/* Divider */}
<div style={{ display: 'flex', alignItems: 'center', gap: spacing[3], margin: `${spacing[4]} 0` }}>
  <div style={{ flex: 1, height: '1px', background: colors.surface.secondary }} />
  <span style={{ fontSize: typography.fontSize.sm, color: colors.text.tertiary }}>or</span>
  <div style={{ flex: 1, height: '1px', background: colors.surface.secondary }} />
</div>

<GoogleLogin
  onSuccess={async (credentialResponse) => {
    if (!credentialResponse.credential) return;
    try {
      const result = await googleLogin({ idToken: credentialResponse.credential }).unwrap();
      // result has same shape as email login — dispatch handled by RTK Query + authSlice
    } catch (err) {
      setError('Google sign-in failed. Please try again.');
    }
  }}
  onError={() => setError('Google sign-in failed.')}
  useOneTap={false}
  width="100%"
/>
```

**Step 5: Add .env.local entry to .gitignore (if not already)**

```bash
grep "\.env\.local" /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend/.gitignore || echo ".env.local" >> /Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system/frontend/.gitignore
```

**Step 6: Verify in browser**

```bash
cd frontend && npm run dev
```

Navigate to `/login`. Verify:
- Google Sign-In button appears below "or" divider
- Click it → Google consent screen opens (only if `VITE_GOOGLE_OAUTH_CLIENT_ID` is set to a real client ID from Google Cloud Console)

**Step 7: Commit**

```bash
git add frontend/src/App.tsx frontend/src/pages/auth/LoginPage.tsx frontend/src/store/api/authApi.ts frontend/package.json frontend/package-lock.json
git commit -m "feat: add Google Sign-In button to web login page"
```

---

## Task 3: Mobile — Google Sign-In (masova-mobile)

**Files:**
- Modify: `masova-mobile/package.json` (add dependency)
- Modify: `masova-mobile/app.json` (add Expo plugin)
- Modify: `masova-mobile/src/screens/auth/LoginScreen.tsx`
- Modify: `masova-mobile/src/screens/auth/RegisterScreen.tsx`

**Step 1: Install google-signin**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx expo install @react-native-google-signin/google-signin
```

**Step 2: Add to app.json plugins**

Read `masova-mobile/app.json`. Find the `plugins` array and add:

```json
[
  "@react-native-google-signin/google-signin",
  {
    "iosUrlScheme": "com.googleusercontent.apps.YOUR_IOS_CLIENT_ID"
  }
]
```

Replace `YOUR_IOS_CLIENT_ID` with the actual iOS client ID reversed (from Google Cloud Console).

**Step 3: Add Google Sign-In button to LoginScreen**

Read `masova-mobile/src/screens/auth/LoginScreen.tsx` fully. Add:

```typescript
import { GoogleSignin, statusCodes, GoogleSigninButton } from '@react-native-google-signin/google-signin';
import { useEffect } from 'react';

// In component, configure on mount:
useEffect(() => {
  GoogleSignin.configure({
    webClientId: 'YOUR_WEB_CLIENT_ID', // from Google Cloud Console
    offlineAccess: false,
  });
}, []);

const handleGoogleSignIn = async () => {
  try {
    await GoogleSignin.hasPlayServices();
    const userInfo = await GoogleSignin.signIn();
    const idToken = (await GoogleSignin.getTokens()).idToken;
    if (!idToken) throw new Error('No ID token');

    // Call same backend endpoint
    const response = await fetch(`${API_BASE}/api/users/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken }),
    });
    const data = await response.json();
    // Dispatch auth same as email login
    dispatch(loginSuccess({ accessToken: data.token, user: data.user }));
  } catch (error: any) {
    if (error.code !== statusCodes.SIGN_IN_CANCELLED) {
      console.error('Google sign-in error:', error);
      Alert.alert('Sign-in failed', 'Please try again.');
    }
  }
};
```

Add the button in the JSX below the login form:

```tsx
<View style={styles.divider}>
  <View style={styles.dividerLine} />
  <Text style={styles.dividerText}>or</Text>
  <View style={styles.dividerLine} />
</View>

<GoogleSigninButton
  size={GoogleSigninButton.Size.Wide}
  color={GoogleSigninButton.Color.Dark}
  onPress={handleGoogleSignIn}
  style={styles.googleButton}
/>
```

Add to StyleSheet:
```typescript
divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 16 },
dividerLine: { flex: 1, height: 1, backgroundColor: '#e2e8f0' },
dividerText: { marginHorizontal: 12, color: '#94a3b8', fontSize: 13 },
googleButton: { width: '100%', height: 48 },
```

**Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/auth/LoginScreen.tsx app.json package.json
git commit -m "feat: add Google Sign-In to mobile login screen"
```

---

## Task 4: Google Maps Expansion — Web

**Files:**
- Modify: `frontend/src/pages/customer/CartPage.tsx` (delivery address autocomplete)
- Modify: `frontend/src/pages/customer/LiveTrackingPage.tsx`
- Modify: `frontend/src/components/delivery/LiveMap.tsx` (read first, then optimize)

**Step 1: Read all 3 files**

Read them fully before editing.

**Step 2: Add Places autocomplete to CartPage checkout**

`@react-google-maps/api` already includes the Autocomplete component. In `CartPage.tsx`, find the delivery address input field. Replace the plain text input with:

```tsx
import { Autocomplete, LoadScript } from '@react-google-maps/api';

// Add 'places' to the libraries loaded
// (check if LoadScript is already in the component tree from App.tsx or LiveMap.tsx)

const [autocompleteRef, setAutocompleteRef] = useState<google.maps.places.Autocomplete | null>(null);

const onPlaceChanged = () => {
  if (!autocompleteRef) return;
  const place = autocompleteRef.getPlace();
  if (!place.geometry?.location) return;

  const lat = place.geometry.location.lat();
  const lng = place.geometry.location.lng();
  const formatted = place.formatted_address ?? '';

  // Update delivery address in form state
  setDeliveryAddress(prev => ({
    ...prev,
    street: formatted,
    latitude: lat,
    longitude: lng,
  }));
};

// In JSX, replace plain address input:
<Autocomplete
  onLoad={(ac) => setAutocompleteRef(ac)}
  onPlaceChanged={onPlaceChanged}
  options={{ componentRestrictions: { country: 'in' }, types: ['address'] }}
>
  <Input
    type="text"
    placeholder="Enter delivery address"
    value={deliveryAddress.street}
    onChange={(e) => setDeliveryAddress(prev => ({ ...prev, street: e.target.value }))}
  />
</Autocomplete>
```

**Step 3: Optimize LiveMap.tsx to reduce re-renders**

Read `frontend/src/components/delivery/LiveMap.tsx`. Find any markers or components that re-render on every location WebSocket update. Wrap the driver marker in `useMemo` or `React.memo`:

```typescript
const driverMarker = useMemo(() => (
  driverLocation ? (
    <Marker
      key="driver"
      position={{ lat: driverLocation.latitude, lng: driverLocation.longitude }}
      icon={{ url: '/icons/driver-pin.svg', scaledSize: new window.google.maps.Size(32, 32) }}
    />
  ) : null
), [driverLocation?.latitude, driverLocation?.longitude]);
```

Replace `driverLocation.latitude` inline dependency with the memoized marker.

**Step 4: Verify Places autocomplete**

```bash
cd frontend && npm run dev
```

Navigate to cart/checkout flow. Delivery address input should show Google Places autocomplete suggestions as you type. Requires `VITE_GOOGLE_MAPS_API_KEY` to have Places API enabled in Google Cloud Console.

**Step 5: Commit**

```bash
git add frontend/src/pages/customer/CartPage.tsx frontend/src/pages/customer/LiveTrackingPage.tsx frontend/src/components/delivery/LiveMap.tsx
git commit -m "feat: add Google Places autocomplete to cart checkout, optimize LiveMap re-renders"
```

---

## Task 5: Google Maps Expansion — Mobile (masova-mobile)

**Files:**
- Modify: `masova-mobile/src/screens/order/OrderTrackingScreen.tsx`
- Modify: `masova-mobile/app.json` (ensure PROVIDER_GOOGLE is configured)

**Step 1: Read OrderTrackingScreen.tsx**

Read `masova-mobile/src/screens/order/OrderTrackingScreen.tsx` fully. Note the current map implementation (react-native-maps already installed).

**Step 2: Ensure Google Maps provider is set in app.json**

In `masova-mobile/app.json`, find the `android` section and confirm:

```json
"android": {
  "config": {
    "googleMaps": {
      "apiKey": "YOUR_ANDROID_GOOGLE_MAPS_API_KEY"
    }
  }
}
```

For iOS, find the `ios` section and confirm `"googleMapsApiKey"` is set. These keys go in `.env` / Expo secrets — do not hardcode.

**Step 3: Add 3-pin live tracking map to OrderTrackingScreen**

Find the existing MapView in OrderTrackingScreen. Add store pin, customer pin, and driver pin:

```tsx
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from 'react-native-maps';

// In component, assuming these are available from API or WebSocket:
// storeLocation: { latitude, longitude }
// customerLocation: { latitude, longitude }
// driverLocation: { latitude, longitude } (real-time via WebSocket)

<MapView
  provider={PROVIDER_GOOGLE}
  style={styles.map}
  initialRegion={{
    latitude: customerLocation?.latitude ?? 17.385,
    longitude: customerLocation?.longitude ?? 78.4867,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }}
>
  {storeLocation && (
    <Marker
      coordinate={storeLocation}
      title="Restaurant"
      pinColor="#e53e3e"
    />
  )}
  {customerLocation && (
    <Marker
      coordinate={customerLocation}
      title="Your Location"
      pinColor="#3b82f6"
    />
  )}
  {driverLocation && (
    <Marker
      coordinate={driverLocation}
      title="Driver"
      pinColor="#00B14F"
    />
  )}
</MapView>
```

**Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/order/OrderTrackingScreen.tsx app.json
git commit -m "feat: add 3-pin live tracking map with PROVIDER_GOOGLE"
```

---

## Task 6: AI Agent — Add Real API Tools

**Files:**
- Modify: `masova-support/masova_agent/agent.py`
- Modify: `masova-support/masova_agent/main.py`

**Step 1: Read agent.py and main.py fully**

**Step 2: Replace mock data with real API tool functions in agent.py**

Find the `CUSTOMERS_DB` and `ORDERS_DB` mock dictionaries. Replace `get_system_briefing()` mock logic with real HTTP calls:

```python
# Add to agent.py — replace mock DB lookups with real API calls

API_BASE = os.environ.get('MASOVA_API_BASE', 'http://localhost:8080')

async def get_menu_items_tool(store_id: str, category: str = None) -> dict:
    """Get menu items for a store, optionally filtered by category."""
    url = f"{API_BASE}/api/menu/items?storeId={store_id}"
    if category:
        url += f"&category={category}"
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(url)
            resp.raise_for_status()
            items = resp.json()
            # Return simplified list for agent context
            return {"items": [{"name": i["name"], "price": i["price"], "available": i.get("isAvailable", True)} for i in (items.get("content") or items)[:10]]}
    except Exception as e:
        return {"error": f"Could not fetch menu: {str(e)}"}

async def get_order_status_tool(order_id: str) -> dict:
    """Get the current status of an order."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{API_BASE}/api/orders/{order_id}/public")
            resp.raise_for_status()
            order = resp.json()
            return {"orderId": order_id, "status": order.get("status"), "estimatedDelivery": order.get("estimatedDeliveryTime")}
    except Exception as e:
        return {"error": f"Order not found: {str(e)}"}

async def get_store_hours_tool(store_id: str) -> dict:
    """Get the operating hours of a store."""
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{API_BASE}/api/stores/{store_id}")
            resp.raise_for_status()
            store = resp.json()
            return {"storeName": store.get("name"), "operatingHours": store.get("operatingHours"), "isActive": store.get("isActive")}
    except Exception as e:
        return {"error": f"Store not found: {str(e)}"}

def submit_complaint_tool(customer_id: str, order_id: str, description: str) -> dict:
    """Log a customer complaint. Returns a ticket reference."""
    # In production: POST to a support ticket API
    import uuid
    ticket_id = f"TKT-{uuid.uuid4().hex[:8].upper()}"
    return {"ticketId": ticket_id, "message": f"Complaint logged. Reference: {ticket_id}. Our team will contact you within 24 hours."}
```

Register these as ADK tools in the agent definition. Find where `get_system_briefing` is registered and add the new tools to the same tools list.

**Step 3: Add /agent/chat REST endpoint to main.py**

Read `main.py`. Add a FastAPI POST endpoint (ADK's web runner uses FastAPI internally):

```python
# Add to main.py — after existing imports and before the app startup

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import Optional
import uuid

class ChatRequest(BaseModel):
    sessionId: Optional[str] = None
    message: str
    customerId: Optional[str] = None

class ChatResponse(BaseModel):
    reply: str
    sessionId: str

# Add this route to the existing FastAPI app (adk web exposes an 'app' variable)
# If main.py uses 'adk web' CLI, add the endpoint before the server starts:

@app.post("/agent/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    session_id = request.sessionId or str(uuid.uuid4())

    try:
        # Create session if new
        if session_id not in _created_sessions:
            await _session_service.create_session(
                app_name="masova_support",
                user_id=request.customerId or "anonymous",
                session_id=session_id,
            )
            _created_sessions.add(session_id)

        # Run agent
        runner = Runner(agent=root_agent, app_name="masova_support", session_service=_session_service)
        content = genai_types.Content(role="user", parts=[genai_types.Part(text=request.message)])

        reply_text = ""
        async for event in runner.run_async(
            user_id=request.customerId or "anonymous",
            session_id=session_id,
            new_message=content,
        ):
            if hasattr(event, 'content') and event.content:
                for part in event.content.parts:
                    if hasattr(part, 'text') and part.text:
                        reply_text += part.text

        return ChatResponse(reply=reply_text or "I'm here to help!", sessionId=session_id)

    except Exception as e:
        logger.error(f"Chat error: {e}")
        raise HTTPException(status_code=500, detail="Agent error")
```

**Step 4: Verify agent runs with new endpoint**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
pip install -r requirements.txt
adk web masova_agent
```

In another terminal:

```bash
curl -X POST http://localhost:8000/agent/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "What is on the menu?", "sessionId": "test-1"}'
```

Expected: JSON response with `reply` and `sessionId`.

**Step 5: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-support
git add masova_agent/agent.py masova_agent/main.py
git commit -m "feat: replace mock data with real API tools, add /agent/chat REST endpoint"
```

---

## Task 7: Web — ChatWidget Component

**Files:**
- Create: `frontend/src/components/chat/ChatWidget.tsx`
- Create: `frontend/src/store/api/agentApi.ts`
- Modify: `frontend/src/App.tsx`

**Step 1: Create agentApi.ts**

```typescript
// frontend/src/store/api/agentApi.ts
import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface ChatRequest {
  sessionId?: string;
  message: string;
  customerId?: string;
}

interface ChatResponse {
  reply: string;
  sessionId: string;
}

export const agentApi = createApi({
  reducerPath: 'agentApi',
  baseQuery: fetchBaseQuery({
    baseUrl: import.meta.env.VITE_AGENT_BASE_URL ?? 'http://localhost:8000',
  }),
  endpoints: (builder) => ({
    sendMessage: builder.mutation<ChatResponse, ChatRequest>({
      query: (body) => ({
        url: '/agent/chat',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const { useSendMessageMutation } = agentApi;
```

Add `agentApi` to the Redux store in `frontend/src/store/store.ts`:
- Add to `reducers`: `[agentApi.reducerPath]: agentApi.reducer`
- Add to `middleware`: `getDefaultMiddleware().concat(agentApi.middleware)`

**Step 2: Create ChatWidget**

```typescript
// frontend/src/components/chat/ChatWidget.tsx
import React, { useState, useRef, useEffect } from 'react';
import { useSendMessageMutation } from '../../store/api/agentApi';
import { useAppSelector } from '../../store/hooks';
import { selectCurrentUser } from '../../store/slices/authSlice';
import { colors, spacing, typography } from '../../styles/design-tokens';
import { v4 as uuidv4 } from 'uuid';

interface Message {
  role: 'user' | 'agent';
  text: string;
}

const QUICK_REPLIES = ['Track my order', 'View menu', 'Opening hours', 'Contact support'];

const ChatWidget: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { role: 'agent', text: 'Hi! I\'m MaSoVa\'s support assistant. How can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [sessionId] = useState(() => uuidv4());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = useAppSelector(selectCurrentUser);

  const [sendMessage, { isLoading }] = useSendMessageMutation();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async (text: string) => {
    if (!text.trim() || isLoading) return;
    const userMsg = text.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);

    try {
      const result = await sendMessage({
        message: userMsg,
        sessionId,
        customerId: user?.id,
      }).unwrap();
      setMessages(prev => [...prev, { role: 'agent', text: result.reply }]);
    } catch {
      setMessages(prev => [...prev, { role: 'agent', text: 'Sorry, I\'m having trouble connecting. Please try again.' }]);
    }
  };

  return (
    <>
      {/* Floating button */}
      <button
        onClick={() => setIsOpen(o => !o)}
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: colors.semantic.error,
          border: 'none',
          color: '#fff',
          fontSize: '24px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(229,62,62,0.4)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s',
        }}
        aria-label="Open support chat"
      >
        {isOpen ? '✕' : '💬'}
      </button>

      {/* Chat panel */}
      {isOpen && (
        <div style={{
          position: 'fixed',
          bottom: '92px',
          right: '24px',
          width: '340px',
          height: '480px',
          background: colors.surface.primary,
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          zIndex: 9998,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}>
          {/* Header */}
          <div style={{ background: colors.semantic.error, padding: `${spacing[3]} ${spacing[4]}`, color: '#fff' }}>
            <div style={{ fontWeight: '700', fontSize: typography.fontSize.base }}>MaSoVa Support</div>
            <div style={{ fontSize: typography.fontSize.xs, opacity: 0.85 }}>Powered by AI</div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: spacing[3], display: 'flex', flexDirection: 'column', gap: spacing[2] }}>
            {messages.map((msg, i) => (
              <div key={i} style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                padding: `${spacing[2]} ${spacing[3]}`,
                borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                background: msg.role === 'user' ? colors.semantic.error : colors.surface.secondary,
                color: msg.role === 'user' ? '#fff' : colors.text.primary,
                fontSize: typography.fontSize.sm,
                lineHeight: 1.4,
              }}>
                {msg.text}
              </div>
            ))}
            {isLoading && (
              <div style={{ alignSelf: 'flex-start', padding: `${spacing[2]} ${spacing[3]}`, background: colors.surface.secondary, borderRadius: '12px', fontSize: typography.fontSize.sm, color: colors.text.secondary }}>
                Typing...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick replies */}
          <div style={{ padding: `${spacing[2]} ${spacing[3]}`, display: 'flex', gap: spacing[1], overflowX: 'auto', borderTop: `1px solid ${colors.surface.secondary}` }}>
            {QUICK_REPLIES.map(qr => (
              <button
                key={qr}
                onClick={() => send(qr)}
                style={{ background: 'none', border: `1px solid ${colors.surface.secondary}`, borderRadius: '20px', padding: `${spacing[1]} ${spacing[2]}`, fontSize: typography.fontSize.xs, cursor: 'pointer', whiteSpace: 'nowrap', color: colors.text.secondary }}
              >
                {qr}
              </button>
            ))}
          </div>

          {/* Input */}
          <div style={{ display: 'flex', gap: spacing[2], padding: spacing[3], borderTop: `1px solid ${colors.surface.secondary}` }}>
            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send(input)}
              placeholder="Type a message..."
              style={{
                flex: 1,
                padding: `${spacing[2]} ${spacing[3]}`,
                border: `1px solid ${colors.surface.secondary}`,
                borderRadius: '8px',
                fontSize: typography.fontSize.sm,
                outline: 'none',
                background: colors.surface.primary,
                color: colors.text.primary,
              }}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || isLoading}
              style={{
                background: colors.semantic.error,
                border: 'none',
                borderRadius: '8px',
                padding: `${spacing[2]} ${spacing[3]}`,
                color: '#fff',
                cursor: 'pointer',
                fontSize: typography.fontSize.sm,
                fontWeight: '600',
              }}
            >
              Send
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default ChatWidget;
```

**Step 3: Add ChatWidget to App.tsx on customer routes**

Read `frontend/src/App.tsx`. Find the routes that are customer-facing (`/`, `/menu`, `/order/*`, `/track/*`, `/cart`). Add `ChatWidget` rendering inside those routes (or conditionally render it based on the current pathname):

```tsx
import ChatWidget from './components/chat/ChatWidget';
import { useLocation } from 'react-router-dom';

// Inside App.tsx render, after the router:
const CustomerChatWidget = () => {
  const { pathname } = useLocation();
  const customerPaths = ['/', '/menu', '/order', '/track', '/cart', '/checkout'];
  const showChat = customerPaths.some(p => pathname === p || pathname.startsWith(p + '/'));
  return showChat ? <ChatWidget /> : null;
};

// Add <CustomerChatWidget /> inside the Router, alongside the existing Routes
```

**Step 4: Verify ChatWidget**

```bash
cd frontend && npm run dev
```

Navigate to `/`. Floating red button visible in bottom-right. Click it → chat panel opens. Quick reply "Track my order" → agent responds (requires masova-support running at localhost:8000).

**Step 5: Commit**

```bash
git add frontend/src/components/chat/ frontend/src/store/api/agentApi.ts frontend/src/App.tsx frontend/src/store/store.ts
git commit -m "feat: add AI chat widget with floating button, message history, quick replies"
```

---

## Task 8: Mobile — Chat Support Screen (masova-mobile)

**Files:**
- Create: `masova-mobile/src/screens/support/ChatScreen.tsx`
- Modify: `masova-mobile/src/navigation/` (add Support tab)

**Step 1: Create ChatScreen**

```typescript
// masova-mobile/src/screens/support/ChatScreen.tsx
import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ActivityIndicator, Keyboard } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../contexts/ThemeContext'; // adjust import to actual theme hook path
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'http://10.0.2.2:8000'; // Android emulator → localhost

interface Message {
  id: string;
  role: 'user' | 'agent';
  text: string;
}

const QUICK_REPLIES = ['Track my order', 'View menu', 'Opening hours'];

const ChatScreen = () => {
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', role: 'agent', text: "Hi! I'm MaSoVa's support assistant. How can I help you?" }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => Math.random().toString(36).slice(2));
  const listRef = useRef<FlatList>(null);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const msgText = text.trim();
    setInput('');
    Keyboard.dismiss();

    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: msgText };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    try {
      const resp = await fetch(`${API_BASE}/agent/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msgText, sessionId }),
      });
      const data = await resp.json();
      const agentMsg: Message = { id: (Date.now() + 1).toString(), role: 'agent', text: data.reply || "I'm here to help!" };
      setMessages(prev => [...prev, agentMsg]);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'agent', text: "Sorry, I can't connect right now. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 100);
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.agentBubble]}>
      <Text style={[styles.bubbleText, item.role === 'user' ? styles.userText : styles.agentText]}>{item.text}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={renderMessage}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => listRef.current?.scrollToEnd()}
      />

      {loading && (
        <View style={styles.typingIndicator}>
          <ActivityIndicator size="small" color="#e53e3e" />
          <Text style={styles.typingText}>Typing...</Text>
        </View>
      )}

      {/* Quick replies */}
      <View style={styles.quickReplies}>
        {QUICK_REPLIES.map(qr => (
          <TouchableOpacity key={qr} style={styles.quickReply} onPress={() => send(qr)}>
            <Text style={styles.quickReplyText}>{qr}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Input */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#94a3b8"
          onSubmitEditing={() => send(input)}
          returnKeyType="send"
          multiline={false}
        />
        <TouchableOpacity style={styles.sendButton} onPress={() => send(input)} disabled={!input.trim() || loading}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  messageList: { padding: 16, gap: 8 },
  bubble: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 8 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#e53e3e', borderBottomRightRadius: 4 },
  agentBubble: { alignSelf: 'flex-start', backgroundColor: '#fff', borderBottomLeftRadius: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2, elevation: 1 },
  bubbleText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  agentText: { color: '#1e293b' },
  typingIndicator: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, paddingLeft: 20 },
  typingText: { fontSize: 13, color: '#94a3b8' },
  quickReplies: { flexDirection: 'row', paddingHorizontal: 12, paddingBottom: 8, gap: 8 },
  quickReply: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6, backgroundColor: '#fff' },
  quickReplyText: { fontSize: 12, color: '#64748b' },
  inputRow: { flexDirection: 'row', padding: 12, gap: 8, borderTopWidth: 1, borderTopColor: '#e2e8f0', backgroundColor: '#fff' },
  input: { flex: 1, backgroundColor: '#f1f5f9', borderRadius: 24, paddingHorizontal: 16, paddingVertical: 10, fontSize: 15, color: '#1e293b' },
  sendButton: { backgroundColor: '#e53e3e', borderRadius: 24, paddingHorizontal: 16, justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default ChatScreen;
```

**Step 2: Add Support tab to bottom navigation**

Read the bottom tab navigator file in `masova-mobile/src/navigation/`. Find where the bottom tabs are defined. Add a Support tab:

```tsx
import ChatScreen from '../screens/support/ChatScreen';
import ChatIcon from // use existing icon library in the project

// Add to Tab.Navigator:
<Tab.Screen
  name="Support"
  component={ChatScreen}
  options={{
    title: 'Support',
    tabBarIcon: ({ color, size }) => <Icon name="chat" size={size} color={color} />,
  }}
/>
```

**Step 3: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/support/ChatScreen.tsx src/navigation/
git commit -m "feat: add AI support chat screen with haptics, quick replies, and Support tab"
```

---

## Tier 4 Verification

```bash
# Google Sign-In (requires real Google Cloud Console setup)
# → Navigate to /login
# → "Sign in with Google" button visible below form
# → Click → Google consent screen (if client ID is configured)
# → After consent → redirected to correct dashboard based on role

# Google Places Autocomplete
cd frontend && npm run dev
# → Navigate to cart / checkout
# → Delivery address input → type "Banjara" → dropdown suggestions appear

# AI Chat Widget
# Start agent: cd masova-support && adk web masova_agent &
cd frontend && npm run dev
# → Navigate to /
# → Red floating button in bottom-right
# → Click → chat panel opens
# → Type "What's on the menu?" → agent responds within 5s
# → Quick reply "Track my order" → agent responds

# Mobile Chat (masova-mobile)
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx expo start
# → Support tab visible in bottom nav
# → Tap Support → ChatScreen loads
# → Type message → agent responds
# → Haptic feedback on send and receive
```
