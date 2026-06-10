# readJson and writeJson Call Graphs

## readJson — Call Graph

```mermaid
flowchart TB
    ENTRY["file.readJson(options)"] -->|OPTIONS:\nDeepCopyOpts & IDecode\n& IAutoTemporal & IIncludeUrl\n& IStripComments| RAS["text = file.readAsString()"]
    RAS --> HasDeepCopyOpts?{"hasDeepCopyOpts?\n(deepCopy === true OR replace\nOR detectRegExp OR includeUrl)\nOR\nautoTemporal\nOR\ndecode?"}
    HasDeepCopyOpts? -->|yes\n\nOPTIONS:\nDeepCopyOpts\n& IAutoTemporal\n& IIncludeUrl\n& IStripComments| SJC1["if stripComments:\ntext = stripJsonComments(text)\n{ whitespace, trailingCommas }"]

    subgraph jsonDeserialize["jsonDeserialize(text,options)"]
        SJC1 -->|DeepCopyOpts & IAutoTemporal| CreateDeserializerReviver[Create JSON Parse 'Reviver'\nwhich does all of these things:\n\nIf decode:\nRegExp, ASCII85Decoce,\nSet, Map,\nInstant, ZonedDateTime, PlainDateTime\n\nif replace:\nreplacements to all strings\n-- replace, msub --\n\nif autoTemporal:\nISODates -> Temporal]
        CreateDeserializerReviver -->|Reviver| PARSE1["JSON.parse(text,reviver)"]
    end

    PARSE1 -->|JSON| IncludeUrl{"includeUrl\nOR\ndetectRegExp?"}
    IncludeUrl -->|yes\n\nOPTIONS:\nincludeUrl\ndetectRegExp| DeepCopy["deepCopy(JSON)\n(Recursive value analyzer)\n\n#INCLUDE of other JSON files\n\nConverts {pattern|regex,flags}\nto RegEx"]
    IncludeUrl -->|no| Result
    DeepCopy --> Result

    HasDeepCopyOpts? -->|no\nIStripComments| SJC2["if stripComments:\ntext = stripJsonComments(text)\n{ whitespace, trailingCommas }"]
    SJC2 --> JsonParse
    JsonParse --> Result
```

### readJson Options

```
ReadJsonOptions = DeepCopyOpts & IStripComments & IAutoTemporal & IIncludeUrl
```

| Option          | Set            | Type                                | Default | Consumed By                                           |
| --------------- | -------------- | ----------------------------------- | ------- | ----------------------------------------------------- |
| `stripComments` | IStripComments | `boolean \| IStripJsonComments`     | —       | `stripJsonComments` (via `jsonDeserialize` or direct) |
| `autoTemporal`  | IAutoTemporal  | `boolean`                           | —       | `createDeserializerReviver` → `asTemporal()`          |
| `pre` / `post`  | DeepCopyOpts   | `string`                            | —       | `processStringWithReplacements`                       |
| `replace`       | DeepCopyOpts   | `Record<string, string \| unknown>` | —       | `processStringWithReplacements`                       |
| `msubFn`        | DeepCopyOpts   | `MSubFn`                            | —       | `processStringWithReplacements`                       |
| `detectRegExp`  | DeepCopyOpts   | `boolean`                           | —       | `#deepCopy` → `_.asRegExp`                            |
| `includeUrl`    | IIncludeUrl    | `unknown`                           | —       | `#deepCopy` (fs-level recursive read)                 |

**IStripJsonComments** (nested under `stripComments`):

| Sub-option       | Type      | Default | Purpose                                  |
| ---------------- | --------- | ------- | ---------------------------------------- |
| `whitespace`     | `boolean` | `true`  | Preserve whitespace in comment positions |
| `trailingCommas` | `boolean` | `false` | Remove trailing commas before `}` / `]`  |

---

## writeJson — Call Graph

```mermaid
flowchart TB
    WJ["FileSpec.writeJson(data, opts)
    \nWriteJsonOptions = SafeWriteOptions
       & { replacer, space, deepCopy, trailing }"]

    WJ --> DEEP{"opts.deepCopy?"}
    DEEP -->|yes| WD["#writeJsonWithDeepCopy(data, opts)
    \nWriteJsonOptions"]

    WD --> SAFE{"safe or
    backupStrategy?"}
    SAFE -->|yes| WWO["#writeWithOpts(writeFn, opts)
    \nSafeWriteOptions: { safe, backupStrategy }"]
    WWO --> BACKUP["backup(strategy)
    \nFileConflictStrategy"]
    WWO --> ATOMIC["#writeAtomic(writeFn)
    \n(no JSON opts)"]
    ATOMIC --> MT["FileSpec.makeTemp()"]
    ATOMIC --> MOVE["fsTmp.moveTo(this)"]

    SAFE -->|no| JS["_.jsonSerialize(data, deepCopyOpts, space)
    \nDeepCopyOpts + space"]

    JS --> CSR["JSON.stringify(processed,
    createSerializerReplacer(opts), space)
    \nreplacer receives DeepCopyOpts"]
    CSR --> PSR["processStringWithReplacements(val)
    \n{ replace, pre, post, msubFn }"]
    CSR --> A85["encodeAscii85(val)
    \nalways applied to Uint8Array"]
    CSR --> SET_WRAP["wrap Set / Map / RegExp
    \ndetectRegExp controls RegExp wrapping"]

    WD --> FILEIO1["nfs.open → write → sync → close
    \ntrailing appended to output"]

    DEEP -->|no| SAFE2{"safe or
    backupStrategy?"}
    SAFE2 -->|yes| WWO2["#writeWithOpts(writeFn, opts)
    \nSafeWriteOptions"]
    WWO2 --> WJD["#writeJsonDirect(data, opts)
    \n{ replacer, space, trailing }"]

    SAFE2 -->|no| WJD2["#writeJsonDirect(data, opts)
    \n{ replacer, space, trailing }"]

    WJD --> STRINGIFY["JSON.stringify(data, replacer, space)
    \nreplacer, space"]
    WJD2 --> STRINGIFY2["JSON.stringify(data, replacer, space)
    \nreplacer, space"]
    STRINGIFY --> TRAILING["+ opts.trailing"]
    STRINGIFY2 --> TRAILING2["+ opts.trailing"]
    TRAILING --> FILEIO2["nfs.open → write → sync → close"]
    TRAILING2 --> FILEIO2
```

### writeJson Options

```
WriteJsonOptions = SafeWriteOptions & { replacer, space, deepCopy, trailing }
SafeWriteOptions = { safe, backupStrategy }
```

| Option           | Type                      | Default | Consumed By                                |
| ---------------- | ------------------------- | ------- | ------------------------------------------ |
| `replacer`       | `JsonReplacer`            | —       | `JSON.stringify` (direct path)             |
| `space`          | `string \| Integer`       | —       | `_.jsonSerialize` or `JSON.stringify`      |
| `deepCopy`       | `DeepCopyOpts \| boolean` | `false` | Routes to `#writeJsonWithDeepCopy`         |
| `trailing`       | `string`                  | —       | Appended after final `}` before file write |
| `safe`           | `boolean`                 | `false` | `#writeWithOpts` → `#writeAtomic`          |
| `backupStrategy` | `FileConflictStrategy`    | —       | `#writeWithOpts` → `backup()`              |
