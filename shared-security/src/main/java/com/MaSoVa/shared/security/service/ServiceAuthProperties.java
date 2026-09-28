package com.MaSoVa.shared.security.service;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Service-to-service token settings.
 *
 * <pre>
 * service-auth:
 *   name: core-service                  # this service; defaults to spring.application.name
 *   private-key: base64 PKCS#8 EC P-256  # only services that call others
 *   trusted:
 *     core-service: [base64 X.509 EC public key, ...]   # two entries during key rotation
 * </pre>
 */
@ConfigurationProperties(prefix = "service-auth")
public class ServiceAuthProperties {

    private String name;
    private String privateKey;
    private Map<String, List<String>> trusted = new HashMap<>();

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getPrivateKey() { return privateKey; }
    public void setPrivateKey(String privateKey) { this.privateKey = privateKey; }
    public Map<String, List<String>> getTrusted() { return trusted; }
    public void setTrusted(Map<String, List<String>> trusted) { this.trusted = trusted; }
}
