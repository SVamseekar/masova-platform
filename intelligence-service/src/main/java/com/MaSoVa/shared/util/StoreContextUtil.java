package com.MaSoVa.shared.util;

import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.lang.Nullable;

/**
 * Utility class for extracting store context from HTTP headers.
 *
 * This utility implements the header-based store filtering strategy where:
 * - MANAGER/ASSISTANT_MANAGER/CUSTOMER users use X-Selected-Store-Id (from store selector)
 * - STAFF/DRIVER/KITCHEN_STAFF users use X-User-Store-Id (their assigned store)
 */
public class StoreContextUtil {

    private static final Logger logger = LoggerFactory.getLogger(StoreContextUtil.class);

    private static final String HEADER_USER_TYPE = "X-User-Type";
    private static final String HEADER_SELECTED_STORE_ID = "X-Selected-Store-Id";
    private static final String HEADER_USER_STORE_ID = "X-User-Store-Id";
    private static final String HEADER_USER_ID = "X-User-Id";

    /**
     * Extract storeId from HTTP request headers based on user type.
     *
     * @param request The HTTP servlet request containing headers
     * @return The storeId extracted from headers, or null if not found
     */
    @Nullable
    public static String getStoreIdFromHeaders(HttpServletRequest request) {
        String userType = request.getHeader(HEADER_USER_TYPE);
        String selectedStoreId = request.getHeader(HEADER_SELECTED_STORE_ID);
        String userStoreId = request.getHeader(HEADER_USER_STORE_ID);
        String userId = request.getHeader(HEADER_USER_ID);

        logger.debug("Extracting storeId for userId={}, userType={}, selectedStoreId={}, userStoreId={}",
                     userId, userType, selectedStoreId, userStoreId);

        String storeId = determineStoreId(userType, selectedStoreId, userStoreId);

        if (storeId == null || storeId.isEmpty()) {
            logger.warn("No storeId found in headers for userId={}, userType={}", userId, userType);
        } else {
            logger.debug("Resolved storeId={} for userId={}, userType={}", storeId, userId, userType);
        }

        return storeId;
    }

    /**
     * Determine which storeId to use based on user type.
     */
    private static String determineStoreId(String userType, String selectedStoreId, String userStoreId) {
        if (userType == null || userType.isEmpty()) {
            // No user type - fall back to selected store or user store
            return selectedStoreId != null && !selectedStoreId.isEmpty() ? selectedStoreId : userStoreId;
        }

        // Managers and customers can select which store to view
        if (isManagerOrCustomer(userType)) {
            // Prefer selected store, fall back to user's assigned store
            return selectedStoreId != null && !selectedStoreId.isEmpty() ? selectedStoreId : userStoreId;
        }

        // Staff, drivers, and kitchen staff: if a selected store is explicitly provided
        // (e.g., from URL-based KDS routing), use it; otherwise fall back to assigned store
        // This allows KDS to display orders for any store specified in the URL
        if (selectedStoreId != null && !selectedStoreId.isEmpty()) {
            logger.debug("Staff user with explicit store selection: using selectedStoreId={} instead of userStoreId={}",
                        selectedStoreId, userStoreId);
            return selectedStoreId;
        }
        return userStoreId;
    }

    /**
     * Check if user type allows store selection.
     */
    private static boolean isManagerOrCustomer(String userType) {
        return "MANAGER".equalsIgnoreCase(userType) ||
               "ASSISTANT_MANAGER".equalsIgnoreCase(userType) ||
               "CUSTOMER".equalsIgnoreCase(userType);
    }

    /**
     * Get user ID from headers.
     */
    @Nullable
    public static String getUserIdFromHeaders(HttpServletRequest request) {
        return request.getHeader(HEADER_USER_ID);
    }

    /**
     * Get user type from headers.
     */
    @Nullable
    public static String getUserTypeFromHeaders(HttpServletRequest request) {
        return request.getHeader(HEADER_USER_TYPE);
    }

    /**
     * Validate that storeId is present in headers.
     *
     * @param request The HTTP servlet request
     * @throws IllegalArgumentException if storeId cannot be determined
     */
    public static void validateStoreIdPresent(HttpServletRequest request) {
        String storeId = getStoreIdFromHeaders(request);
        if (storeId == null || storeId.isEmpty()) {
            throw new IllegalArgumentException("Store ID is required but not found in request headers");
        }
    }
}
