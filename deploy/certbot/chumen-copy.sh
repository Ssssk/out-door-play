#!/bin/sh
set -eu

certificate_dir=/opt/chumen/certs
install -d -m 755 "$certificate_dir"
install -m 644 /etc/letsencrypt/live/chumenliuliu.cloud/fullchain.pem "$certificate_dir/fullchain.pem"
install -m 600 /etc/letsencrypt/live/chumenliuliu.cloud/privkey.pem "$certificate_dir/privkey.pem"

if docker ps --format '{{.Names}}' | grep -qx chumen-web-prod; then
  docker exec chumen-web-prod nginx -t >/dev/null 2>&1
  docker exec chumen-web-prod nginx -s reload >/dev/null 2>&1
fi
