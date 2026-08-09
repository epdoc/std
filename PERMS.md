# Permission Audit — @epdoc/std

> Generated: 2026-08-09T13:51:27.581Z\
> Source: `.opencode/perm-log.jsonl` (populated by perm-tracker plugin)\
> Sessions covered: 0\
> Total asks: 0 across 0 distinct permission patterns

---

## Summary

_No asks yet._

---

## Strategies to Reduce Permission Stops

1. **Broad-first, narrow-last**: OpenCode evaluates rules top-to-bottom and the **last match wins**. Keeping broad
   patterns (like `"*": "ask"`) early and narrow overrides later is correct — e.g.
   `{ "bash": { "git *": "allow", "deno *": "allow", "*": "ask" } }` works because narrower patterns after `"*"`
   override it.

2. **Pre-allow trusted tool categories**: Flat-rule permissions like `"grep": "allow"`, `"glob": "allow"`,
   `"webfetch": "allow"`, `"question": "allow"`, `"todowrite": "allow"` cover many low-risk stops. These are already set
   in the current config where applicable.

3. **Path-based allows for read/edit/external_directory**: Grant access to parent trees (`~/dev/**`) instead of
   individual files. The current config already allows `~/dev/@epdoc/std/**` and sibling repos under
   `external_directory`, and `"*": "allow"` for `read`.

4. **Per-agent permission overrides**: The `build` agent has its own `permission` block with broader edit and bash
   allows. Other agents inherit the root-level permissions.

5. **Bash command families**: Group common commands (`git *`, `deno *`, `npm *`, `ls *`) as allow rules. The current
   config already covers `grep`, `ls`, `head`, `deno check/lint/test`, and most `git` read-only commands.

6. **Keep deny rules narrow and last**: Denial rules like `"git push*": "deny"` come after broader `"git *": "ask"` so
   the deny takes precedence. This ordering is already correct in the current config.

---

## How to Apply

1. Copy the suggested rules into `./opencode.json` under the `"permission"` key.
2. **Ensure insertion order is correct**: broadest patterns first, narrowest last. OpenCode evaluates rules
   top-to-bottom and the last matching rule wins.
3. Restart opencode (`quit` + reopen) for config changes to take effect.

---

## Pending Review

_No new asks since last run._

<!-- perm-tracker:end -->
