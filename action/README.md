# Clonecheck GitHub Action

Run clonecheck in CI to catch repository usability problems before contributors hit them.

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

## Inputs

| Input | Default | Description |
|---|---:|---|
| `path` | `.` | Repository path to scan. |
| `format` | `markdown` | Report format: `text`, `json`, or `markdown`. |
| `output` | empty | Optional file path for the generated report. |
| `strict` | `false` | Exit with code `1` when the score is below `75`. |

The MVP action installs dependencies and builds the local CLI before running it with Node.
