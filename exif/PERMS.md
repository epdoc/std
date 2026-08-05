# Permissions needed for @epdoc/exif

## Development (deno task)

| Command          | Permissions needed | Notes                           |
| ---------------- | ------------------ | ------------------------------- |
| `deno fmt`       | none               |                                 |
| `deno lint`      | none               |                                 |
| `deno check`     | none               |                                 |
| `deno test`      | `-A`               | Already configured in deno.json |
| `deno task docs` | none               |                                 |

## Runtime (exiftool binary)

The package shells out to `exiftool`. deno.json already lists `"run": ["exiftool"]` under compile permissions.

## opencode.json

No modifications needed. All Deno subcommands used during development (fmt, lint, check, test, docs) already run without
permission prompts. The test task uses `-A` which the user has pre-approved.
