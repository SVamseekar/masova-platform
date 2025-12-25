#!/bin/bash
cd "$(dirname "$0")"
source ./load-env.sh
cd api-gateway
mvn spring-boot:run
