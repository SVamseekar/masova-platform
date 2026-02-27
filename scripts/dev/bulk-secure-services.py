#!/usr/bin/env python3
"""
Bulk Security Configuration Script
Adds shared-security dependency and JWT config to all services
"""

import os
import re

BASE_DIR = "/Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system"
SERVICES = [
    "customer-service",
    "inventory-service",
    "review-service",
    "delivery-service",
    "analytics-service",
    "notification-service"
]

JWT_SECRET = "MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-512-bits-for-HS512-algorithm-security-requirement"

SECURITY_CONFIG_TEMPLATE = """package com.MaSoVa.{service}.config;

import com.MaSoVa.shared.security.config.SecurityConfigurationBase;
import com.MaSoVa.shared.security.util.JwtTokenProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig extends SecurityConfigurationBase {{

    public SecurityConfig(JwtTokenProvider tokenProvider) {{
        super(tokenProvider);
    }}

    @Override
    protected String[] getPublicEndpoints() {{
        return new String[]{{
            // Health and actuator endpoints
            "/actuator/health",
            "/api/health/**",

            // API documentation
            "/v3/api-docs/**",
            "/swagger-ui/**",
            "/swagger-ui.html"
        }};
    }}
}}
"""

POM_DEPENDENCY = """
        <!-- Shared Security -->
        <dependency>
            <groupId>com.MaSoVa</groupId>
            <artifactId>shared-security</artifactId>
            <version>1.0.0</version>
        </dependency>"""

JWT_CONFIG = """
# JWT Configuration
jwt:
  secret: ${JWT_SECRET:MaSoVa-secret-key-for-jwt-token-generation-very-long-key-must-be-at-least-512-bits-for-HS512-algorithm-security-requirement}
  access-token-expiration: 3600000
  refresh-token-expiration: 604800000"""

def update_pom(service_path, service_name):
    pom_file = os.path.join(service_path, "pom.xml")
    if not os.path.exists(pom_file):
        print(f"  ✗ pom.xml not found for {service_name}")
        return False

    with open(pom_file, 'r') as f:
        content = f.read()

    if 'shared-security' in content:
        print(f"  ✓ pom.xml already has shared-security")
        return True

    # Find shared-models dependency and add shared-security after it
    pattern = r'(<dependency>\s*<groupId>com\.MaSoVa</groupId>\s*<artifactId>shared-models</artifactId>\s*<version>1\.0\.0</version>\s*</dependency>)'
    replacement = r'\1' + POM_DEPENDENCY

    new_content = re.sub(pattern, replacement, content)

    if new_content == content:
        print(f"  ⚠ Could not find shared-models dependency in pom.xml")
        return False

    with open(pom_file, 'w') as f:
        f.write(new_content)

    print(f"  ✓ Updated pom.xml")
    return True

def update_application_yml(service_path, service_name):
    yml_file = os.path.join(service_path, "src/main/resources/application.yml")
    if not os.path.exists(yml_file):
        print(f"  ✗ application.yml not found for {service_name}")
        return False

    with open(yml_file, 'r') as f:
        content = f.read()

    if 'jwt:' in content and JWT_SECRET[:20] in content:
        print(f"  ✓ application.yml already has correct JWT config")
        return True

    # Add after spring: section
    lines = content.split('\n')
    new_lines = []
    spring_section_found = False
    jwt_added = False

    for i, line in enumerate(lines):
        new_lines.append(line)
        if line.startswith('spring:') and not jwt_added:
            spring_section_found = True
        elif spring_section_found and not jwt_added and line and not line.startswith(' ') and not line.startswith('\t'):
            # Found next top-level section after spring
            new_lines.insert(-1, JWT_CONFIG)
            jwt_added = True

    if not jwt_added:
        new_lines.append(JWT_CONFIG)

    with open(yml_file, 'w') as f:
        f.write('\n'.join(new_lines))

    print(f"  ✓ Updated application.yml")
    return True

def create_security_config(service_path, service_name):
    config_dir = os.path.join(service_path, f"src/main/java/com/MaSoVa/{service_name.replace('-service', '')}/config")
    security_config_file = os.path.join(config_dir, "SecurityConfig.java")

    if not os.path.exists(config_dir):
        os.makedirs(config_dir)
        print(f"  ✓ Created config directory")

    service_pkg = service_name.replace('-service', '')
    config_content = SECURITY_CONFIG_TEMPLATE.format(service=service_pkg)

    with open(security_config_file, 'w') as f:
        f.write(config_content)

    print(f"  ✓ Created SecurityConfig.java")
    return True

def process_service(service_name):
    print(f"\n📦 Processing {service_name}...")
    service_path = os.path.join(BASE_DIR, service_name)

    if not os.path.exists(service_path):
        print(f"  ✗ Service directory not found")
        return False

    success = True
    success &= update_pom(service_path, service_name)
    success &= update_application_yml(service_path, service_name)
    success &= create_security_config(service_path, service_name)

    if success:
        print(f"  ✅ {service_name} secured successfully!")
    else:
        print(f"  ⚠ {service_name} partially secured (check logs)")

    return success

def main():
    print("🔒 Bulk Service Security Configuration")
    print("=" * 50)

    total = len(SERVICES)
    success_count = 0

    for service in SERVICES:
        if process_service(service):
            success_count += 1

    print("\n" + "=" * 50)
    print(f"✅ Secured {success_count}/{total} services successfully")

    if success_count == total:
        print("\n🎉 All services secured! Next steps:")
        print("  1. Rebuild all services: mvn clean install -DskipTests")
        print("  2. Update frontend to use API Gateway")
        print("  3. Test authentication flow")
    else:
        print(f"\n⚠ {total - success_count} services need manual review")

if __name__ == "__main__":
    main()
