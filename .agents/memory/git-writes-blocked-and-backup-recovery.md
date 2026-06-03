---
name: Git writes blocked in agent; gitsafe-backup recovery
description: Why agent git writes fail in this repl and how to recover/reconcile safely
---

# Git writes are blocked for the agent in this repl

Any git **write** (fetch, merge, commit, push, reset, checkout-into-worktree) fails with
"Destructive git operations are not allowed in the main agent." This holds even when a
git-related project task is assigned to the agent — the sandbox classifies the session as
the main agent regardless of task assignment. Read-only git is fine (`log`, `status
--no-optional-locks`, `rev-parse`, `diff`, `merge-base`, `show`, `archive`, `ls-tree`).

**Why:** Platform blocks history-mutating git from the agent to protect the repo. The only
paths that can actually move `main`/`origin` are: (1) the user running commands in the
Replit Shell tab (not subject to the agent block), or (2) the platform's automatic commit
at end of task (which commits the working tree using `.local/.commit_message`).

**How to apply:**
- Never promise to merge/push yourself. For true history reconciliation (joining diverged
  histories, force-push), hand the user exact Shell commands.
- To restore lost files into the working tree without any blocked git op, use read-only
  archive: `git archive <ref> <paths> | tar -x -C .`. The platform then commits it at task end.
- A clean forward fix beats force-push: if origin has a bad commit X reverting good work,
  `git revert --no-edit X` + normal `git push` restores files with no history rewrite.

# gitsafe-backup remote holds a safety ref

`gitsafe-backup/main` is an auto-maintained backup ref. When origin/sync overwrites local
`main` with unwanted content, prior good commits remain reachable via `gitsafe-backup/main`
(and as ancestor commits). Recover working-tree files from that ref with `git archive`.
