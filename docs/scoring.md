# Scoring

clonecheck starts every repository at `100` and subtracts points for issues.

| Severity | Default | Strict |
|---|---:|---:|
| `error` | 15 | 15 |
| `warning` | 7 | 10 |
| `info` | 2 | 3 |

Scores never go below `0`.

| Score | Status |
|---:|---|
| 90-100 | Excellent |
| 75-89 | Good |
| 50-74 | Needs work |
| 0-49 | Poor |

`--strict` does not make the scanner run commands. It only makes warnings and info issues cost more and exits with code `1` when the score is below `75`.
