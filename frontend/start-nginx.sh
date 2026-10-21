#!/bin/sh
set -eu

export ROAST_REQUESTS_PER_MINUTE=${ROAST_REQUESTS_PER_MINUTE:-6}
export ROAST_BURST=${ROAST_BURST:-2}
export MAX_CONCURRENT_ROASTS=${MAX_CONCURRENT_ROASTS:-4}
export MAX_ROASTS_PER_IP=${MAX_ROASTS_PER_IP:-2}
export REQUIRE_HTTPS=${REQUIRE_HTTPS:-0}

for number in "$ROAST_REQUESTS_PER_MINUTE" "$ROAST_BURST" "$MAX_CONCURRENT_ROASTS" "$MAX_ROASTS_PER_IP"; do
    case "$number" in ''|*[!0-9]*) echo "Invalid Nginx limit" >&2; exit 1 ;; esac
    [ "$number" -gt 0 ] || exit 1
done
case "$REQUIRE_HTTPS" in 0|1) ;; *) exit 1 ;; esac

mkdir -p /tmp/nginx
: > /tmp/nginx/trusted-proxies.conf
: > /tmp/nginx/trusted-proxy-geo.conf
for network in ${TRUSTED_PROXY_CIDRS:-}; do
    case "$network" in *[!0-9a-fA-F:./]*) echo "Expected a proxy IP or CIDR" >&2; exit 1 ;; esac
    printf 'set_real_ip_from %s;\n' "$network" >> /tmp/nginx/trusted-proxies.conf
    printf '%s 1;\n' "$network" >> /tmp/nginx/trusted-proxy-geo.conf
done

# Substitute only our settings, leaving Nginx's $variables intact.
envsubst '${ROAST_REQUESTS_PER_MINUTE} ${ROAST_BURST} ${MAX_CONCURRENT_ROASTS} ${MAX_ROASTS_PER_IP} ${REQUIRE_HTTPS}' \
    < /etc/nginx/app.conf.template > /tmp/nginx/default.conf
exec "$@"
