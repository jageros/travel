.PHONY: dev check build preview push

dev:
	npm run dev
check:
	npm run verify
build:
	npm run build
preview:
	npm run preview
push:
	@echo "Deploy through Cloudflare Workers Builds after preview checks. See README.md."
	@exit 1
