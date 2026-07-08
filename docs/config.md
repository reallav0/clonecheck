# Configuration

clonecheck looks for config files in this order:

1. `clonecheck.config.json`
2. `.clonecheckrc`
3. `.clonecheckrc.json`

You can also pass a specific file:

```bash
clonecheck scan --config ./clonecheck.config.json
```

## Example

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

## Fields

| Field | Description |
|---|---|
| `ignore` | Additional glob patterns to exclude from file discovery. |
| `ignoreEnvVars` | Environment variable names that should not require documentation. |
| `checks` | Map of check IDs to booleans. `false` disables a check. |

`license` and `contributing` can be disabled as sub-checks of `project-files`.
