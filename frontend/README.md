# Geo Land Marketplace frontend

React, OpenLayers and Tailwind CSS provide polygon registration, circular search,
map results and land details. Vite serves development assets and proxies `/api`
to `localhost:8080`. The multi-stage Docker image builds with Node and serves the
result with Nginx, which proxies `/api/` to the Compose backend.

See the [root README](../README.md) for full-stack startup, environment variables,
local development, tests and troubleshooting, and the [verification report](../VERIFICATION.md)
for executed checks and remaining acceptance work.
