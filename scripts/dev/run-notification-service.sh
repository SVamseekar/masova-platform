#!/bin/bash
cd "$(dirname "$0")"
source ./load-env.sh
cd notification-service
mvn spring-boot:run
