#!/bin/bash
cd "$(dirname "$0")"
source ./load-env.sh
cd review-service
mvn spring-boot:run
