#!/usr/bin/env bash

# cause we do not want to expose the repo token in version control
coverallsyml="service_name: travis-pro
repo_token: ${COVERALLS_TOKEN}"

echo "${coverallsyml}" > ".coveralls.yml"
cat coverage/lcov.info | npx coveralls
