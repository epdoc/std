# AGENTS.md for @epdoc/transform

## Architecture

```
src/
├── mod.ts           # Barrel: Deep, Json, msubLite
├── utils.ts         # standalone msubLite
├── deep/            # Deep namespace (copy, type guards, types)
└── json/            # Json namespace (serialize, deserialize, stripComments, types)
```

## Key decisions

- **`encode`/`decode` are opt-in** (default false). Tests must explicitly pass `{ encode: true }` and `{ decode: true }`
  to round-trip Set/Map/RegExp/Uint8Array.
- **Temporal types** are handled by a pre-processor (`replaceTemporals`) that runs before the JSON.stringify replacer.
  This means `encode: true` is NOT needed for Temporal serialization, but **`decode: true` IS needed** on
  deserialization.
- **`encodeFilter` must return `val` as fallback** for non-matching types, or JSON.stringify will drop the properties of
  already-wrapped objects.
- **`CopyOpts`** is a discriminated union — the `msubFn`-and-`replace` combos are mutually exclusive.

## Maintenance

```bash
deno task ok    # fmt + lint + check + test + docs
```

## Publishing

Edit `deno.json` version, then:

```bash
deno publish
```

Update importers: `deno update @epdoc/transform` in dependent workspaces, then `bump -g "message"`.
