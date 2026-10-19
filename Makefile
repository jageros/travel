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
	@echo "Deploy through the verified Vercel Git integration after preview checks. See README.md."
	@exit 1
