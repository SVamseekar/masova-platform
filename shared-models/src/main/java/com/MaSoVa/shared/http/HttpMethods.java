package com.MaSoVa.shared.http;

import java.util.Objects;

import org.springframework.http.HttpMethod;
import org.springframework.lang.NonNull;

/**
 * Non-null {@link HttpMethod} constants for use with RestTemplate and other
 * Spring HTTP clients where null-analysis requires @NonNull parameters.
 */
public final class HttpMethods {

    @NonNull
    public static final HttpMethod GET = Objects.requireNonNull(HttpMethod.GET);

    @NonNull
    public static final HttpMethod POST = Objects.requireNonNull(HttpMethod.POST);

    @NonNull
    public static final HttpMethod PUT = Objects.requireNonNull(HttpMethod.PUT);

    @NonNull
    public static final HttpMethod PATCH = Objects.requireNonNull(HttpMethod.PATCH);

    @NonNull
    public static final HttpMethod DELETE = Objects.requireNonNull(HttpMethod.DELETE);

    private HttpMethods() {
    }
}