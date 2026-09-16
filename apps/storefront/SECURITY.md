# Security Policy

Please do not open a public issue containing credentials, customer data, private
URLs, or a suspected vulnerability. Report security issues privately to the
repository owner and include only the minimum reproducible detail.

Never commit Saleor admin tokens, passwords, session secrets, payment provider
secrets, Kubernetes credentials, or production data. Use the deployment
environment's secret manager for runtime values.
