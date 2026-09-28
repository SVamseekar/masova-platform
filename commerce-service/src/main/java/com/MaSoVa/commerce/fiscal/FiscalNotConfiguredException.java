package com.MaSoVa.commerce.fiscal;

/**
 * Thrown at order creation when a store's country legally requires a certified fiscal
 * signer and none is configured (fiscal.signing.mode=CERTIFIED, the default). Mapped to
 * HTTP 409 by OrderController — the store, not the request, is the problem (#126).
 */
public class FiscalNotConfiguredException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    public static final String ERROR_CODE = "FISCAL_NOT_CONFIGURED";

    public FiscalNotConfiguredException(String message) {
        super(message);
    }
}
