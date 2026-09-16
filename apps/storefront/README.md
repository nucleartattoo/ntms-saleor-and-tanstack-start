# Saleor NTMS TanStack Storefront

Standalone Saleor storefront built with TanStack Start, React, and TypeScript.
This repository contains the storefront application and its public build checks.
Production infrastructure, Kubernetes manifests, credentials, catalog migration
scripts, and operational runbooks remain outside this repository.

## Development

Requirements: Node.js 22.12+ and npm 10+.

```bash
npm ci
cp .env.example .env
npm run dev
```

Set `SALEOR_API_ENDPOINT` to a Saleor GraphQL endpoint and keep all admin
credentials out of the browser environment. The storefront only needs public
channel/catalog access and customer checkout mutations.

Useful checks:

```bash
npm run check
npm run typecheck
npm run test
npm run build
```

## Container image

The Dockerfile builds a production Node image. Build-time configuration is
provided through Docker build arguments; do not bake admin tokens or private
service credentials into an image.

## Release boundary

The public repository publishes application artifacts. The private deployment
repository owns Kubernetes manifests, runtime secrets, image promotion, and
production rollout decisions.

## License

Application code follows the MIT license included in this repository. Third-party
assets and dependencies retain their respective licenses.
