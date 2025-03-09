#!/bin/bash

set -e # Exit immediately if a command exits with a non-zero status

if [ "$#" -ne 2 ]; then
  echo "Usage: $0 <email> <username>"
  exit 1
fi

USER_EMAIL=$1
USER_NAME=$2

# Now, you can access the variables
echo "User Name: $USER_NAME"
echo "User Email: $USER_EMAIL"

docker compose -f docker-compose-dev.yml exec webserver-dev server create-user "$USER_EMAIL" "$USER_NAME"
docker compose -f docker-compose-dev.yml down webserver-dev
docker compose -f docker-compose-dev.yml up -d webserver-dev
