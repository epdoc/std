# AI Context: @epdoc/text

## Quick Bootstrap

`@epdoc/text` provides standalone string manipulation utilities and a template substitution engine (`msub`). It runs on
Deno and is published to JSR. The package was previously published as `@epdoc/string`.

## Key Workflows

### 1. Text Utilities

```
Import function → Call with string → Get result
```

- Flat, stateless utility functions in `text.ts`
- No classes or instances required
- See README.md for the full function reference

### 2. MSub Singleton (Global Configuration)

```
msub.configure(options) → msub.replace(template, values)
```

- Use when you have one substitution syntax across the application
- `configure()` modifies a shared singleton instance
- Call `replace()` directly for the default `${}` syntax

### 3. MSub Isolated Instances

```
msub.create(options) → instance.replace(template, values)
```

- Use when different parts of the code need different delimiters or formatters
- Each instance is independent; no shared state

## Architecture

```
src/
├── mod.ts    # Re-exports text.ts and msub namespace
├── text.ts   # Standalone string utilities (wrap, pad, pluralize, etc.)
└── msub.ts   # Template substitution engine
```

## Entry Points

| Export                              | Purpose                  | When to Use                                  |
| ----------------------------------- | ------------------------ | -------------------------------------------- |
| `wrap`, `padLeft`, `padRight`, etc. | String manipulation      | Any text formatting task                     |
| `msub.replace()`                    | Singleton substitution   | Simple `${key}` replacement                  |
| `msub.configure()`                  | Configure singleton      | Change delimiters or add formatting globally |
| `msub.create()`                     | Create isolated instance | Different configs in different modules       |

## Critical Distinctions

1. **Singleton vs Instance**: `msub.configure()` affects the shared singleton. Use `msub.create()` for independent
   instances. This is a common source of bugs when multiple modules set different `open`/`close` delimiters.

2. **Number/Date formatting**: If the key contains a colon (e.g., `${a:toFixed:2}`), msub calls the named method on the
   value. A custom `format` callback in `ConfigureOptions` is only used when the method does not exist.

## Configuration

`ConfigureOptions`:

- `open` — opening delimiter (default: `${`)
- `close` — closing delimiter (default: mirrored brace from `open`)
- `uppercase` — convert `SNAKE_CASE` keys to `camelCase`
- `format` — custom `(value, formatString) => string` callback

## Testing

```bash
deno task test
```

## Migration Notes

The `StringEx` factory and `StringUtil` class were removed in favor of standalone functions and the `msub` namespace.
See README.md for the before/after migration table.
