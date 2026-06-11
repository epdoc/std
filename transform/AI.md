# AI Context: @epdoc/transform

## Quick Bootstrap

Deep-copy, JSON serialization/deserialization with special-type preservation, and string replacement for Deno. Exports
two namespaces (`Deep`, `Json`) and one standalone function (`msubLite`).

```ts
import { Deep, Json, msubLite } from '@epdoc/transform';
```

## Key Distinctions

### Deep.copy vs Json.serialize

| Concern                     | `Deep.copy`                       | `Json.serialize`                              |
| --------------------------- | --------------------------------- | --------------------------------------------- |
| Preserves object references | Yes (circular refs not handled)   | No (stringifies to JSON)                      |
| Set / Map / RegExp          | Preserved in-memory               | Must opt in (`encode: true` + `decode: true`) |
| Temporal                    | Passed through (no serialization) | Automatically wrapped in `__filter`           |
| String replacement          | ✅ call-time                      | ✅ (replacer function)                        |

### encode / decode options

`encode: false` and `decode: false` by default. To round-trip Set, Map, RegExp, or Uint8Array you **must** pass both:

```ts
const json = Json.serialize(data, { encode: true });
const back = Json.deserialize(json, { decode: true });
```

Temporal types are handled automatically — only `decode: true` is needed on deserialization.

### autoRegExp — two paths

1. **Via `encode`/`decode`** — wraps RegExp in `{ __filter: 'RegExp', regex, flags }`
2. **Via `autoRegExp`** — uses compact `{ regex, flags }` shape (no `__filter`)

Both are opt-in. Choose `autoRegExp` when you control the serialization format and prefer a cleaner output.

### String replacement — simple vs advanced

- **Simple** (`replace: Record<string, string>`) — uses built-in `msubLite`, no extra deps
- **Advanced** (`replace: Record<string, unknown>` + `msubFn`) — for non-string values (dates, etc.)

## Architecture

```
src/
├── mod.ts               # Barrel: Deep, Json, msubLite
├── utils.ts             # msubLite
├── deep/
│   ├── mod.ts           # Re-exports: copy, helpers, types
│   ├── deep.ts          # deepCopy
│   ├── deeputils.ts     # processStringWithReplacements, type guards
│   └── types.ts         # CopyOpts, MSubFn
└── json/
    ├── mod.ts           # Re-exports: serialize, deserialize, stripComments, types
    ├── serialize.ts     # Json.serialize
    ├── deserialize.ts   # Json.deserialize, isEncodedValue, createDeserializerReviver
    ├── strip-comments.ts# Json.stripComments
    └── types.ts         # IEncode, IDecode, IAutoTemporal, IAutoRegExp, EncodedValue
```

## Important files to read

- `src/json/serialize.ts` — `replaceTemporals` pre-processor, `encodeFilter`
- `src/json/deserialize.ts` — `decodeFilter`, `createDeserializerReviver`
- `src/deep/deep.ts` — `deepCopy` (core recursion)
- `src/deep/deeputils.ts` — `processStringWithReplacements`

## Testing

```bash
cd transform && deno task ok
```
