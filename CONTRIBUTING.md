# Contributing

Thanks for helping improve clonecheck.

## Local Setup

```bash
pnpm install
pnpm build
pnpm test
pnpm lint
```

Run the CLI against an example fixture:

```bash
pnpm --filter @clonecheck/cli dev -- scan ./examples/node-missing-env
```

## Pull Requests

Keep changes focused, add or update tests for scanner behavior, and document new checks in `docs/checks.md`.
