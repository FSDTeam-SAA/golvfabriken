# syntax=docker/dockerfile:1.7
# Caddy with the Cloudflare DNS provider plugin (needed for DNS-01 challenge,
# since the site is behind Cloudflare's proxy and HTTP-01 won't work).

FROM caddy:2.10-builder AS builder
RUN xcaddy build \
    --with github.com/caddy-dns/cloudflare \
    --with github.com/WeidiDeng/caddy-cloudflare-ip

FROM caddy:2.10-alpine
COPY --from=builder /usr/bin/caddy /usr/bin/caddy
