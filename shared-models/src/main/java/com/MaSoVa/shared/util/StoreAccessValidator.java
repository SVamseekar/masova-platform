package com.MaSoVa.shared.util;

/**
 * Validates that a client-supplied store selector header is within the caller's
 * JWT-attested store membership (security remediation Task 5).
 *
 * Staff and manager roles carry a single {@code storeId} claim in the JWT.
 * {@code X-Selected-Store-Id} must match that claim — never be trusted alone.
 */
public final class StoreAccessValidator {

    private StoreAccessValidator() {
    }

    /**
     * Roles whose JWT {@code storeId} claim is authoritative for store scoping.
     */
    public static boolean requiresStoreMembershipValidation(String userType) {
        if (userType == null || userType.isBlank()) {
            return false;
        }
        return switch (userType.toUpperCase()) {
            case "MANAGER", "ASSISTANT_MANAGER", "STAFF", "DRIVER", "KITCHEN_STAFF", "KIOSK" -> true;
            default -> false;
        };
    }

    /**
     * Returns true when the caller may use {@code selectedStoreId} as their active store context.
     *
     * @param userType        role from JWT / X-User-Type
     * @param jwtStoreId      store id attested in the JWT (X-User-Store-Id at the gateway boundary)
     * @param selectedStoreId client-supplied X-Selected-Store-Id, may be null
     */
    public static boolean isSelectedStoreAllowed(String userType, String jwtStoreId, String selectedStoreId) {
        if (selectedStoreId == null || selectedStoreId.isBlank()) {
            return true;
        }
        if (!requiresStoreMembershipValidation(userType)) {
            // CUSTOMER / AGENT — store selection is not JWT-bound here (service-level checks apply elsewhere)
            return true;
        }
        if (jwtStoreId == null || jwtStoreId.isBlank()) {
            return false;
        }
        return jwtStoreId.equals(selectedStoreId);
    }

    /**
     * @throws StoreAccessDeniedException when {@link #isSelectedStoreAllowed} would return false
     */
    public static void assertSelectedStoreAllowed(String userType, String jwtStoreId, String selectedStoreId) {
        if (!isSelectedStoreAllowed(userType, jwtStoreId, selectedStoreId)) {
            throw new StoreAccessDeniedException(userType, jwtStoreId, selectedStoreId);
        }
    }

    public static class StoreAccessDeniedException extends RuntimeException {
        private final String userType;
        private final String jwtStoreId;
        private final String requestedStoreId;

        public StoreAccessDeniedException(String userType, String jwtStoreId, String requestedStoreId) {
            super("Access denied to store " + requestedStoreId + " for user type " + userType);
            this.userType = userType;
            this.jwtStoreId = jwtStoreId;
            this.requestedStoreId = requestedStoreId;
        }

        public String getUserType() {
            return userType;
        }

        public String getJwtStoreId() {
            return jwtStoreId;
        }

        public String getRequestedStoreId() {
            return requestedStoreId;
        }
    }
}