#!/usr/bin/env bash
# Generates the EC P-256 key pair core-service uses to sign service-to-service tokens,
# and appends it to .env (gitignored) for docker compose. Run once per environment.
# Production keys come from the secret store, never from this script.
set -euo pipefail

ENV_FILE="${1:-.env}"
if grep -q '^SERVICE_AUTH_CORE_PRIVATE_KEY=' "$ENV_FILE" 2>/dev/null; then
  echo "Service keys already in $ENV_FILE; delete those lines to rotate." >&2
  exit 0
fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT
openssl ecparam -name prime256v1 -genkey -noout -out "$TMP/ec.pem"
openssl pkcs8 -topk8 -nocrypt -in "$TMP/ec.pem" -outform DER -out "$TMP/private.der"
openssl ec -in "$TMP/ec.pem" -pubout -outform DER -out "$TMP/public.der" 2>/dev/null

{
  echo "SERVICE_AUTH_CORE_PRIVATE_KEY=$(base64 < "$TMP/private.der" | tr -d '\n')"
  echo "SERVICE_AUTH_CORE_PUBLIC_KEY=$(base64 < "$TMP/public.der" | tr -d '\n')"
} >> "$ENV_FILE"
echo "Wrote SERVICE_AUTH_CORE_PRIVATE_KEY and SERVICE_AUTH_CORE_PUBLIC_KEY to $ENV_FILE"
