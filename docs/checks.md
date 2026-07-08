# Checks

clonecheck ships with practical static checks focused on whether a new contributor can clone, configure, and run a repository quickly.

## package-manager-consistency

Detects the package manager from lockfiles and compares it with package-manager commands in README shell blocks.

- `pnpm-lock.yaml` means `pnpm`
- `yarn.lock` means `yarn`
- `package-lock.json` means `npm`
- `bun.lockb` or `bun.lock` means `bun`

## scripts-availability

For Node projects, checks `package.json` for `dev`, `start`, `test`, and `build` scripts.

- Missing all run scripts is an error.
- Missing `test` is a warning.
- Having `dev` or `start` is enough for a basic local run path.

## env-example

Scans JavaScript, TypeScript, Python, Go, and Rust files for environment variable usage and compares detected variables against `.env.example`, `.env.sample`, `.env.template`, and `example.env`.

## readme-commands

Extracts shell code blocks from README files and checks for setup and run commands. It warns when README commands conflict with the detected package manager.

## port-documentation

Detects likely app ports from source files and common config files, then compares them with README localhost URLs.

## docker-compose-env

Scans Compose files for `${VARIABLE}` references and verifies that each variable is documented in an env example file.

## project-files

Checks for `README.md`, `CONTRIBUTING.md`, `LICENSE`, and `.gitignore`.

## ci-presence

Checks for at least one `.github/workflows/*.yml` or `.github/workflows/*.yaml` file.
