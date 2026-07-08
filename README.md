# clonecheck

Know if your repo is actually cloneable.

Most tools tell you whether your code is secure or formatted.
clonecheck tells you whether your repo is actually usable by a new contributor.

clonecheck is a CLI and GitHub Action that checks whether a repository is cloneable, runnable, and contributor-friendly. It answers one concrete question:

> Can a new developer clone this repo and understand how to run it within 10 minutes?

It does not run installs, execute Docker, or call external APIs. The MVP is static analysis for repository usability.

## Example Output

```txt
clonecheck v0.1.0

Repository: my-app
Path: /Users/me/my-app

Score: 72/100
Status: Needs work

Checks:
  ✅ package-manager-consistency
     package manager is consistent: pnpm

  ✅ scripts-availability
     package scripts include an obvious local workflow

  ⚠️ env-example
     Environment variable DATABASE_URL is used but missing from .env.example or another env template.
     Environment variable JWT_SECRET is used but missing from .env.example or another env template.

  ⚠️ readme-commands
     README uses npm commands, but the detected package manager is pnpm.

Suggestions:
  1. Add DATABASE_URL= to .env.example.
  2. Add JWT_SECRET= to .env.example.
  3. Update README commands to use pnpm.
```

## Installation

```bash
pnpm add -D @clonecheck/cli
```

From this repository:

```bash
pnpm install
pnpm build
pnpm --filter clonecheck scan
```

## CLI Usage

```bash
clonecheck scan
clonecheck scan .
clonecheck scan ./some-repo
clonecheck scan --format text
clonecheck scan --format json
clonecheck scan --format markdown
clonecheck scan --output clonecheck-report.md
clonecheck scan --strict
clonecheck generate-env-example
clonecheck generate-env-example --write
clonecheck init
clonecheck --version
clonecheck --help
```

During local development:

```bash
pnpm --filter @clonecheck/cli dev -- scan ./examples/node-missing-env
```

## GitHub Action

```yaml
name: Clonecheck

on:
  pull_request:
  push:
    branches: [main]

jobs:
  clonecheck:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: your-github-username/clonecheck@v1
        with:
          format: markdown
          output: clonecheck-report.md
          strict: false
```

## Checks

| Check | What it finds |
|---|---|
| `package-manager-consistency` | README commands that do not match the detected lockfile. |
| `scripts-availability` | Missing `dev`, `start`, `test`, or `build` scripts in Node projects. |
| `env-example` | Environment variables used in code but missing from env example files. |
| `readme-commands` | Missing setup commands or README commands that conflict with the package manager. |
| `port-documentation` | README localhost ports that do not match likely app ports. |
| `docker-compose-env` | Compose `${VARIABLE}` references missing from env examples. |
| `project-files` | Missing README, `.gitignore`, contributing guide, or license. |
| `ci-presence` | Missing GitHub Actions workflow. |

See [docs/checks.md](docs/checks.md) for details.

## Configuration

Create a config file:

```bash
clonecheck init
```

Example:

```json
{
  "ignore": ["examples/**", "fixtures/**"],
  "ignoreEnvVars": ["NODE_ENV", "CUSTOM_IGNORE"],
  "checks": {
    "ci-presence": false,
    "license": false
  }
}
```

Supported filenames:

- `clonecheck.config.json`
- `.clonecheckrc`
- `.clonecheckrc.json`

See [docs/config.md](docs/config.md).

## Environment Examples

Generate a suggested env example:

```bash
clonecheck generate-env-example
```

Write missing variables to `.env.example`:

```bash
clonecheck generate-env-example --write
```

Existing variables and comments are preserved.

## Roadmap

- More language-specific detectors for Rails, Laravel, Django, and Phoenix.
- Package-manager-aware README command suggestions.
- Optional PR comments for the GitHub Action.
- Repository templates for common project types.
- Future opt-in command execution mode for smoke tests.

## Contributing

Issues and pull requests are welcome. Before opening a PR, run:

```bash
pnpm install
pnpm lint
pnpm test
pnpm build
```

## License

MIT
