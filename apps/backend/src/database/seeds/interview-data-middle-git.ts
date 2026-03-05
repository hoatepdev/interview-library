/**
 * Middle-Level Git & Version Control Interview Questions
 *
 * 20 production-grade questions targeting developers with 2–5 years experience.
 * Focus: Git internals, branching, rebasing, conflict resolution, workflows, advanced operations.
 *
 * Topics: git (20)
 * Level: MIDDLE
 *
 * NOTE: This batch also creates the "git" topic if it doesn't exist.
 *
 * Usage: pnpm --filter backend seed:middle-git
 */

import { QuestionLevel } from "../entities/question.entity";

export interface QuestionSeed {
  title: string;
  content: string;
  answer: string;
  level: QuestionLevel;
  topicSlug: string;
}

export const newTopic = {
  name: "Git",
  slug: "git",
  description:
    "Version control, branching strategies, rebasing, conflict resolution, advanced Git operations",
  icon: "GitBranch",
  color: "#F97316",
};

// ============================================
// GIT — MIDDLE LEVEL (20 questions)
// ============================================

export const middleGitQuestions: QuestionSeed[] = [
  // 1. Git Internals
  {
    title: "How does Git store data internally? Explain blobs, trees, and commits.",
    content:
      "What are Git objects (blob, tree, commit, tag)? How does Git's content-addressable storage work?",
    answer: `**Git is a content-addressable filesystem**: Everything is stored as objects identified by SHA-1 hashes.

**Four object types**:

**1. Blob** — stores file content (no filename, no metadata):
\`\`\`bash
# Every file version is a blob
echo "hello world" | git hash-object --stdin
# → 95d09f2b10159347eece71399a7e2e907ea3df4f
# Content → SHA-1 hash → stored in .git/objects/95/d09f2b...
\`\`\`

**2. Tree** — directory listing (maps filenames to blobs/subtrees):
\`\`\`
tree a1b2c3
├── 100644 blob f7d3e1  README.md
├── 100644 blob 8e2a9b  package.json
└── 040000 tree 5c1d4f  src/
    ├── 100644 blob 3a7f9c  index.ts
    └── 100644 blob 2b8e1d  app.ts
\`\`\`

**3. Commit** — snapshot pointing to a tree + metadata:
\`\`\`
commit 9f4e2a
├── tree: a1b2c3        (root tree of the snapshot)
├── parent: 7d3c5b      (previous commit — chain of history)
├── author: John <john@...> 1709000000 +0700
├── committer: John <john@...> 1709000000 +0700
└── message: "feat: add authentication"
\`\`\`

**4. Tag** (annotated) — points to a commit with metadata:
\`\`\`
tag v1.0.0
├── object: 9f4e2a (commit)
├── tagger: John <john@...>
└── message: "Release 1.0.0"
\`\`\`

**How Git is efficient**:
- Identical files = same hash → stored once (deduplication)
- Git uses packfiles for compression (\`.git/objects/pack/\`)
- Delta compression: stores differences between similar objects

**Inspecting objects**:
\`\`\`bash
git cat-file -t 9f4e2a     # Type: commit
git cat-file -p 9f4e2a     # Pretty-print content
git log --oneline --graph   # Visualize commit DAG
git count-objects -vH       # Object store stats
\`\`\`

**Key insight**: A branch is just a pointer (file containing a commit hash). Tags are also pointers. HEAD points to current branch. That's why branches are cheap in Git.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 2. Merge vs Rebase
  {
    title: "Explain the difference between git merge and git rebase",
    content:
      "When should you merge vs rebase? What are the trade-offs? What does 'rebase onto' mean?",
    answer: `**Merge** — creates a merge commit combining two branches:
\`\`\`
Before:
main:    A — B — C
feature:      \\ D — E

After merge:
main:    A — B — C ——— M (merge commit)
feature:      \\ D — E /
\`\`\`
\`\`\`bash
git checkout main
git merge feature
# Creates merge commit M with two parents: C and E
\`\`\`

**Rebase** — replays commits on top of another branch:
\`\`\`
Before:
main:    A — B — C
feature:      \\ D — E

After rebase:
main:    A — B — C
feature:              D' — E'  (new commits with same changes)
\`\`\`
\`\`\`bash
git checkout feature
git rebase main
# Replays D, E on top of C → creates D', E' (new SHAs)
\`\`\`

**Then fast-forward merge**:
\`\`\`bash
git checkout main
git merge feature  # Fast-forward: main pointer moves to E'
# Result: A — B — C — D' — E'  (linear history)
\`\`\`

**Comparison**:

| Aspect | Merge | Rebase |
|--------|-------|--------|
| History | Non-linear (preserves branch topology) | Linear (clean, flat) |
| Merge commit | Yes (explicit merge point) | No |
| Rewrites history | No | Yes (new commit SHAs) |
| Safe on shared branches | Yes | ⚠️ No (don't rebase published commits!) |
| Conflict resolution | Once (at merge point) | Per-commit (each replayed commit) |

**When to merge**:
- Merging feature → main (merge commit is meaningful)
- Shared branches that others work on
- When you want to preserve the exact branch history

**When to rebase**:
- Updating your feature branch with latest main (\`git rebase main\`)
- Cleaning up local commits before pushing (\`git rebase -i\`)
- Keeping linear history in a trunk-based workflow

**The golden rule**: Never rebase commits that have been pushed and shared with others. Rebase is safe for your local, unpushed commits.

**Interactive rebase** (squash, reorder, edit commits):
\`\`\`bash
git rebase -i HEAD~3
# pick a1b2c3 feat: add login
# squash d4e5f6 fix: typo in login
# pick g7h8i9 feat: add logout
# → Combines first two commits into one
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 3. Conflict Resolution
  {
    title: "How do you resolve merge conflicts effectively?",
    content:
      "Explain what causes conflicts, how to read conflict markers, strategies for resolving complex conflicts, and how to prevent them.",
    answer: `**What causes conflicts**: Two branches modify the same lines in the same file, and Git can't automatically determine which change to keep.

**Conflict markers**:
\`\`\`
<<<<<<< HEAD (current branch)
const apiUrl = 'https://api.example.com/v2';
=======
const apiUrl = process.env.API_URL;
>>>>>>> feature/config (incoming branch)
\`\`\`

**Resolution steps**:
\`\`\`bash
# 1. Start merge (conflict occurs)
git merge feature/config
# CONFLICT (content): Merge conflict in src/config.ts

# 2. See which files have conflicts
git status
# both modified: src/config.ts

# 3. Open file, resolve conflicts (remove markers, choose correct code)
const apiUrl = process.env.API_URL || 'https://api.example.com/v2';

# 4. Mark as resolved
git add src/config.ts

# 5. Complete merge
git commit  # or git merge --continue
\`\`\`

**Using merge tools**:
\`\`\`bash
# Visual merge tool
git mergetool
# Opens configured tool (VS Code, IntelliJ, vimdiff)

# VS Code: Click "Accept Current", "Accept Incoming", "Accept Both"
# or manually edit the file
\`\`\`

**Resolving during rebase**:
\`\`\`bash
git rebase main
# CONFLICT in src/config.ts
# 1. Resolve the conflict
# 2. git add src/config.ts
# 3. git rebase --continue  (not commit!)
# 4. Repeat for each conflicting commit
# Or: git rebase --abort  (undo entire rebase)
\`\`\`

**Strategies for complex conflicts**:

\`\`\`bash
# Take all changes from one side
git checkout --theirs src/config.ts   # Keep incoming branch version
git checkout --ours src/config.ts     # Keep current branch version

# See diff from common ancestor
git diff :1:src/config.ts :2:src/config.ts  # base vs ours
git diff :1:src/config.ts :3:src/config.ts  # base vs theirs
\`\`\`

**Preventing conflicts**:
- Pull/rebase from main frequently (don't let branches diverge far)
- Small, focused PRs (less chance of touching same lines)
- Communicate with team about shared files
- Use code formatters (Prettier) — no formatting-only conflicts
- Lock files (package-lock.json) — always regenerate, don't merge manually

**Rerere** (reuse recorded resolution):
\`\`\`bash
git config --global rerere.enabled true
# Git remembers how you resolved a conflict
# If same conflict appears again (during rebase), applies previous resolution automatically
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 4. Interactive Rebase
  {
    title: "How do you use interactive rebase to clean up commit history?",
    content:
      "Explain git rebase -i commands: squash, fixup, reword, edit, drop. When and how should you use each?",
    answer: `**Interactive rebase** — edit, reorder, combine, or remove commits before pushing:

\`\`\`bash
git rebase -i HEAD~5    # Edit last 5 commits
# Opens editor with:
pick a1b2c3 feat: add user model
pick d4e5f6 WIP: trying something
pick g7h8i9 fix: typo in user model
pick j1k2l3 feat: add user validation
pick m4n5o6 fix: validation edge case
\`\`\`

**Commands**:

| Command | What It Does |
|---------|-------------|
| \`pick\` | Keep commit as-is |
| \`reword\` | Keep commit, change message |
| \`squash\` | Combine with previous, edit combined message |
| \`fixup\` | Combine with previous, discard this message |
| \`edit\` | Pause rebase at this commit (amend it) |
| \`drop\` | Delete commit entirely |

**Example: Clean up before PR**:
\`\`\`bash
# Before: messy history
pick a1b2c3 feat: add user model
pick d4e5f6 WIP: trying something         # ← drop this
pick g7h8i9 fix: typo in user model        # ← fixup into first commit
pick j1k2l3 feat: add user validation
pick m4n5o6 fix: validation edge case      # ← fixup into validation commit

# Edit to:
pick a1b2c3 feat: add user model
fixup g7h8i9 fix: typo in user model
drop d4e5f6 WIP: trying something
pick j1k2l3 feat: add user validation
fixup m4n5o6 fix: validation edge case

# Result: 2 clean commits
# feat: add user model
# feat: add user validation
\`\`\`

**Using \`edit\`** — pause and modify a commit:
\`\`\`bash
# Change "pick" to "edit" for a commit
edit a1b2c3 feat: add user model

# Rebase pauses at that commit. Now you can:
git reset HEAD~1          # Undo commit, keep changes staged
# Make changes
git add .
git commit -m "feat: add user model (improved)"
git rebase --continue     # Resume rebase
\`\`\`

**Using \`--autosquash\`** with fixup commits:
\`\`\`bash
# When committing a fix for a specific earlier commit:
git commit --fixup=a1b2c3 -m "fix typo"
# Creates: "fixup! feat: add user model"

# Later, rebase auto-arranges fixups:
git rebase -i --autosquash main
# Fixup commits are automatically placed after their targets
\`\`\`

**Reordering commits**:
\`\`\`bash
# Just change the order of lines in the editor:
pick j1k2l3 feat: add user validation   # moved up
pick a1b2c3 feat: add user model        # moved down
# Commits are replayed in new order
\`\`\`

**Safety**: Interactive rebase rewrites history. Only use on unpushed commits. If already pushed, you'll need \`git push --force-with-lease\` (safer than \`--force\`).`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 5. Git Reset vs Revert vs Checkout
  {
    title: "Explain the difference between git reset, git revert, and git checkout",
    content:
      "When do you use each? What's the difference between --soft, --mixed, and --hard reset? Which is safe for shared branches?",
    answer: `**git reset** — move HEAD (and optionally staging/working directory) backward:
\`\`\`bash
# Three modes:
git reset --soft HEAD~1    # Undo commit, keep changes staged
git reset --mixed HEAD~1   # Undo commit, unstage changes (default)
git reset --hard HEAD~1    # Undo commit, discard all changes ⚠️

# Visual:
# --soft:  HEAD moves back. Index (staging) = unchanged. Working dir = unchanged.
# --mixed: HEAD moves back. Index = matches HEAD. Working dir = unchanged.
# --hard:  HEAD moves back. Index = matches HEAD. Working dir = matches HEAD.
\`\`\`

\`\`\`
Before:  A — B — C (HEAD)

--soft HEAD~1:
  HEAD → B
  Staging: has changes from C
  Working dir: has changes from C

--mixed HEAD~1:
  HEAD → B
  Staging: clean (matches B)
  Working dir: has changes from C

--hard HEAD~1:
  HEAD → B
  Staging: clean (matches B)
  Working dir: clean (matches B) ← Changes from C are GONE
\`\`\`

**git revert** — create a NEW commit that undoes a previous commit:
\`\`\`bash
git revert abc123
# Creates a new commit that reverses the changes in abc123
# History: A — B — C — Revert("C")
# Safe for shared branches — doesn't rewrite history
\`\`\`

**git checkout** (or git switch/restore) — switch branches or restore files:
\`\`\`bash
# Switch branch
git switch feature         # modern: git switch
git checkout feature       # legacy: git checkout

# Restore a file to its committed state
git restore src/app.ts              # modern
git checkout -- src/app.ts          # legacy

# Restore file from specific commit
git restore --source=abc123 src/app.ts
\`\`\`

**When to use each**:

| Scenario | Command | Safe for shared? |
|----------|---------|-------------------|
| Undo last commit, keep changes | \`git reset --soft HEAD~1\` | ❌ No |
| Completely discard last commit | \`git reset --hard HEAD~1\` | ❌ No |
| Undo a published commit | \`git revert abc123\` | ✅ Yes |
| Discard uncommitted file changes | \`git restore file.ts\` | ✅ Yes |
| Switch to another branch | \`git switch branch\` | ✅ Yes |

**Key rule**:
- **reset** rewrites history → only use on unpushed commits
- **revert** creates new history → safe for shared branches

**Recovering from mistakes**:
\`\`\`bash
# Accidentally used --hard? Check reflog:
git reflog
# abc1234 HEAD@{0}: reset: moving to HEAD~1
# def5678 HEAD@{1}: commit: feat: important work  ← your lost commit

git reset --hard def5678   # Recover!
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 6. Cherry-Pick
  {
    title: "What is git cherry-pick and when should you use it?",
    content:
      "Explain cherry-pick with practical examples. What are the risks and alternatives?",
    answer: `**Cherry-pick**: Apply a specific commit from one branch to another (copy, not move).

\`\`\`bash
# Scenario: hotfix on release branch needed on main too
main:    A — B — C
release:      \\ D — E — F (F is the hotfix)

git checkout main
git cherry-pick F
# Result:
main:    A — B — C — F'  (F' = copy of F with new SHA)
release:      \\ D — E — F
\`\`\`

**Practical use cases**:

**1. Backport a fix to a release branch**:
\`\`\`bash
# Fix was merged to main, need it on release/1.2
git checkout release/1.2
git cherry-pick abc123     # SHA of the fix commit on main
\`\`\`

**2. Pick a specific commit from a feature branch**:
\`\`\`bash
# Feature branch has 10 commits, you only want one
git cherry-pick def456
\`\`\`

**3. Cherry-pick a range**:
\`\`\`bash
git cherry-pick A..D       # Commits B, C, D (exclusive of A)
git cherry-pick A^..D      # Commits A, B, C, D (inclusive)
\`\`\`

**Cherry-pick without committing** (stage changes only):
\`\`\`bash
git cherry-pick --no-commit abc123
# Changes are staged but not committed
# Useful for combining multiple cherry-picks into one commit
\`\`\`

**Handling conflicts during cherry-pick**:
\`\`\`bash
git cherry-pick abc123
# CONFLICT: resolve manually
git add resolved-file.ts
git cherry-pick --continue

# Or abort:
git cherry-pick --abort
\`\`\`

**Risks**:
- Creates duplicate commits (same changes, different SHAs)
- If both branches are later merged, may cause conflicts
- Hard to track which commits have been cherry-picked

**Alternatives**:
- **Merge**: If you want all commits from a branch, just merge
- **Rebase**: If you want to move commits (not copy)
- **Feature flags**: Instead of cherry-picking fixes, deploy with flags

**When NOT to cherry-pick**:
- Don't cherry-pick entire feature branches — merge instead
- Don't cherry-pick between branches that will be merged later
- Don't cherry-pick frequently — it's a sign of a workflow problem`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 7. Git Stash
  {
    title: "How do you use git stash effectively?",
    content:
      "Explain stash operations: save, pop, apply, list, drop. What are the best practices and common pitfalls?",
    answer: `**git stash** — temporarily save uncommitted changes:

\`\`\`bash
# Save current changes
git stash                        # Stash tracked modified files
git stash -u                     # Also stash untracked files
git stash --include-untracked    # Same as -u
git stash -m "WIP: login form"  # With a descriptive message

# List stashes
git stash list
# stash@{0}: On feature/login: WIP: login form
# stash@{1}: WIP on main: abc1234 fix: typo

# Apply stash
git stash pop                    # Apply latest + remove from stash list
git stash apply                  # Apply latest + keep in stash list
git stash pop stash@{1}          # Apply specific stash

# Delete stashes
git stash drop stash@{0}        # Delete specific stash
git stash clear                  # Delete ALL stashes ⚠️

# View stash contents without applying
git stash show                   # Summary (files changed)
git stash show -p                # Full diff (patch)
git stash show stash@{1} -p     # Specific stash diff
\`\`\`

**Common use cases**:

**1. Quick branch switch**:
\`\`\`bash
# Working on feature, need to check something on main
git stash -m "WIP: feature progress"
git switch main
# ... do stuff ...
git switch feature/login
git stash pop
\`\`\`

**2. Pull with uncommitted changes**:
\`\`\`bash
git stash
git pull --rebase
git stash pop
# If conflict: resolve, then continue
\`\`\`

**3. Move changes to a different branch**:
\`\`\`bash
# Oops, started working on wrong branch
git stash
git switch correct-branch
git stash pop
\`\`\`

**Stash specific files**:
\`\`\`bash
git stash push -m "just config" src/config.ts
# Only stashes src/config.ts, leaves other changes
\`\`\`

**Create branch from stash**:
\`\`\`bash
git stash branch new-feature stash@{0}
# Creates new branch, checks it out, applies stash, drops it
\`\`\`

**Pitfalls**:
- Stashes are local only — not pushed to remote
- Stash list can grow large — clean up regularly
- \`git stash pop\` with conflicts leaves stash in the list (use \`git stash drop\` after resolving)
- Untracked files are NOT stashed by default (use \`-u\`)

**Best practice**: Don't use stash as long-term storage. If changes are important, commit them (even as WIP) on a branch. Stash is for quick context switches.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 8. Git Hooks
  {
    title: "What are Git hooks and how do you use them in a team?",
    content:
      "Explain pre-commit, commit-msg, pre-push hooks. How do you share hooks across a team using Husky and lint-staged?",
    answer: `**Git hooks**: Scripts that run automatically at specific Git lifecycle events.

**Hook locations**: \`.git/hooks/\` (local, not committed) or shared via tools like Husky.

**Common hooks**:

| Hook | When | Use Case |
|------|------|----------|
| \`pre-commit\` | Before commit is created | Lint, format, type-check |
| \`commit-msg\` | After commit message written | Validate commit message format |
| \`pre-push\` | Before push to remote | Run tests |
| \`post-merge\` | After merge completes | Install deps if lockfile changed |

**Husky** (team-shared Git hooks):
\`\`\`bash
# Install
pnpm add -D husky
pnpm exec husky init
# Creates .husky/ directory (committed to git)
\`\`\`

\`\`\`bash
# .husky/pre-commit
pnpm lint-staged
\`\`\`

**lint-staged** (run linters only on staged files):
\`\`\`json
// package.json
{
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{json,md,yml}": ["prettier --write"],
    "*.css": ["stylelint --fix", "prettier --write"]
  }
}
\`\`\`

**commit-msg hook** (enforce conventional commits):
\`\`\`bash
# .husky/commit-msg
pnpm commitlint --edit $1
\`\`\`
\`\`\`javascript
// commitlint.config.js
module.exports = {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [2, 'always', ['feat', 'fix', 'docs', 'refactor', 'test', 'chore']],
    'subject-max-length': [2, 'always', 72],
  },
};
// Rejects: "fixed stuff" → must be "fix: resolve login issue"
\`\`\`

**pre-push hook** (run tests before pushing):
\`\`\`bash
# .husky/pre-push
pnpm test --bail
# --bail: stop on first failure (fast feedback)
\`\`\`

**post-merge hook** (auto-install after pulling):
\`\`\`bash
# .husky/post-merge
# Check if lockfile changed
CHANGED_FILES=$(git diff-tree -r --name-only --no-commit-id ORIG_HEAD HEAD)
if echo "$CHANGED_FILES" | grep -q "pnpm-lock.yaml"; then
  echo "📦 Lock file changed. Running pnpm install..."
  pnpm install
fi
\`\`\`

**Bypassing hooks** (emergency):
\`\`\`bash
git commit --no-verify -m "hotfix: critical prod fix"
git push --no-verify
# Use sparingly — hooks exist for good reason
\`\`\`

**Alternative to Husky**: \`lefthook\` — faster, supports parallel hooks, configuration in YAML.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 9. Git Reflog
  {
    title: "What is git reflog and how can it save you from mistakes?",
    content:
      "Explain the reflog, how to use it to recover lost commits, and when it helps.",
    answer: `**Reflog** (reference log): Records every movement of HEAD and branch tips. It's your safety net.

\`\`\`bash
git reflog
# Output:
abc1234 HEAD@{0}: commit: feat: add auth
def5678 HEAD@{1}: rebase (finish): onto main
ghi9012 HEAD@{2}: rebase (start): checkout main
jkl3456 HEAD@{3}: commit: WIP: broken stuff
mno7890 HEAD@{4}: checkout: moving from main to feature
\`\`\`

**Scenario 1: Recover from accidental hard reset**:
\`\`\`bash
# Accidentally lost commits
git reset --hard HEAD~3    # Oops, deleted 3 commits!

# Find lost commits in reflog
git reflog
# abc1234 HEAD@{0}: reset: moving to HEAD~3
# def5678 HEAD@{1}: commit: important work     ← here!

# Recover
git reset --hard def5678
# All 3 commits are back!
\`\`\`

**Scenario 2: Recover from bad rebase**:
\`\`\`bash
# Rebase went wrong, lots of conflicts, want to undo
git reflog
# ... HEAD@{5}: rebase (start): checkout main   ← before rebase

git reset --hard HEAD@{5}
# Branch is back to pre-rebase state
\`\`\`

**Scenario 3: Find a deleted branch**:
\`\`\`bash
# Deleted a branch by mistake
git branch -D feature/important

# Find where it was
git reflog | grep "feature/important"
# abc1234 HEAD@{12}: checkout: moving from feature/important to main

# Recreate branch at that commit
git branch feature/important abc1234
\`\`\`

**Scenario 4: Recover dropped stash**:
\`\`\`bash
# Accidentally cleared stash
git stash clear

# Stash commits are still in reflog (temporarily)
git fsck --no-reflog | grep "dangling commit"
# dangling commit abc1234

git show abc1234   # View the stash content
git stash apply abc1234  # Recover it
\`\`\`

**Reflog per branch**:
\`\`\`bash
git reflog show main        # Only main branch movements
git reflog show feature/x   # Only feature/x movements
\`\`\`

**Reflog expiry**:
- Reachable entries: 90 days (default)
- Unreachable entries: 30 days
- After expiry, \`git gc\` may delete the objects
- To change: \`git config gc.reflogExpire "180 days"\`

**Key takeaway**: Before panicking about lost work, check \`git reflog\`. Almost everything is recoverable within 30 days.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 10. Git Bisect
  {
    title: "How do you use git bisect to find the commit that introduced a bug?",
    content:
      "Explain the bisect workflow, both manual and automated. When is it most useful?",
    answer: `**git bisect**: Binary search through commit history to find which commit introduced a bug.

**Manual bisect**:
\`\`\`bash
# Start bisect
git bisect start

# Mark current commit as bad (has the bug)
git bisect bad

# Mark a known good commit (before the bug existed)
git bisect good v1.0.0    # or a specific commit SHA

# Git checks out the midpoint commit
# Bisecting: 50 revisions left to test after this (roughly 6 steps)

# Test the code at this commit:
# - Run tests, check the UI, whatever reproduces the bug

# If bug is present:
git bisect bad

# If bug is NOT present:
git bisect good

# Git checks out next midpoint... repeat 5–6 times
# ...

# Git finds the exact commit:
# abc1234 is the first bad commit
# commit abc1234
# Author: John
# Date: Mon Jan 15 2024
# "refactor: change auth middleware"  ← this commit introduced the bug!

# Done — return to original branch
git bisect reset
\`\`\`

**Automated bisect** (with a test script):
\`\`\`bash
# Write a script that exits 0 (good) or 1 (bad)
# test-bug.sh:
#!/bin/bash
npm test -- --testPathPattern="auth" 2>/dev/null
# Exit code 0 = tests pass = good commit
# Exit code 1 = tests fail = bad commit

# Run automated bisect
git bisect start
git bisect bad HEAD
git bisect good v1.0.0
git bisect run ./test-bug.sh

# Git runs the script at each midpoint automatically
# Finds the bad commit without any manual intervention!
\`\`\`

**How binary search works**:
\`\`\`
100 commits between good and bad
Step 1: test commit 50  → bad  → search 1-49
Step 2: test commit 25  → good → search 26-49
Step 3: test commit 37  → bad  → search 26-36
Step 4: test commit 31  → good → search 32-36
Step 5: test commit 34  → bad  → search 32-33
Step 6: test commit 33  → good → commit 34 is the culprit!
# log2(100) ≈ 7 steps to find 1 bad commit among 100
\`\`\`

**Skip untestable commits** (won't compile, irrelevant):
\`\`\`bash
git bisect skip    # Skip current commit, try another
\`\`\`

**When bisect is most useful**:
- Regression in a large codebase (100+ commits since last known good)
- Bug with no obvious cause
- "It worked last week, now it doesn't"
- Combined with automated test scripts for speed

**Tip**: Always write a regression test after finding the bug via bisect — prevents the same bug from returning.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 11. Working with Remotes
  {
    title: "Explain git fetch vs git pull and how remote tracking branches work",
    content:
      "What happens behind the scenes when you fetch, pull, or push? What are remote tracking branches?",
    answer: `**Remote tracking branches**: Local references that track the state of branches on remotes.

\`\`\`bash
git branch -a
# * main                        ← local branch
#   feature/login               ← local branch
#   remotes/origin/main         ← remote tracking branch
#   remotes/origin/feature/x    ← remote tracking branch
\`\`\`

**git fetch** — download changes, don't modify working directory:
\`\`\`bash
git fetch origin
# 1. Contacts remote
# 2. Downloads new commits, branches, tags
# 3. Updates remote tracking branches (origin/main, origin/feature/x)
# 4. Does NOT modify your local branches or working directory
\`\`\`

**git pull** — fetch + merge (or rebase):
\`\`\`bash
git pull origin main
# Equivalent to:
git fetch origin main
git merge origin/main

# With rebase:
git pull --rebase origin main
# Equivalent to:
git fetch origin main
git rebase origin/main
\`\`\`

**Comparison**:

| Operation | Downloads? | Modifies local branch? | Modifies working dir? |
|-----------|-----------|----------------------|---------------------|
| \`git fetch\` | Yes | No | No |
| \`git pull\` | Yes | Yes (merge/rebase) | Yes |
| \`git push\` | No | No | No (updates remote) |

**When to use fetch vs pull**:
\`\`\`bash
# Fetch first, inspect, then decide:
git fetch origin
git log main..origin/main           # See incoming commits
git diff main origin/main           # See incoming changes
git merge origin/main               # Apply when ready

# Or just pull (if you trust the incoming changes):
git pull --rebase origin main
\`\`\`

**Push**:
\`\`\`bash
git push origin main                # Push main to remote
git push -u origin feature/login    # Push + set upstream tracking
git push --force-with-lease         # Force push safely (fails if remote has new commits)
\`\`\`

**Upstream tracking**:
\`\`\`bash
# Set upstream (one-time per branch)
git push -u origin feature/login
# Now you can just: git push, git pull (no need to specify remote/branch)

# Check tracking configuration
git branch -vv
# * feature/login abc1234 [origin/feature/login] feat: login
#   main          def5678 [origin/main] fix: typo
\`\`\`

**Multiple remotes**:
\`\`\`bash
git remote add upstream https://github.com/original/repo.git
git fetch upstream
git merge upstream/main    # Sync fork with original repo

git remote -v              # List all remotes
# origin   https://github.com/you/repo.git (fetch)
# upstream https://github.com/original/repo.git (fetch)
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 12. Git Worktrees
  {
    title: "What are git worktrees and when are they useful?",
    content:
      "Explain git worktree as an alternative to git stash for working on multiple branches simultaneously.",
    answer: `**Git worktree**: Check out multiple branches simultaneously in separate directories — no stashing needed.

**The problem**: You're working on a feature, but need to quickly fix a bug on main. Options:
1. \`git stash\` → switch branch → fix → switch back → \`git stash pop\` (messy)
2. Clone the repo again (wasteful)
3. **\`git worktree\`** (elegant)

**Basic usage**:
\`\`\`bash
# Main repo is working on feature/login
cd ~/projects/myapp        # On feature/login branch

# Create a worktree for a hotfix
git worktree add ../myapp-hotfix main
cd ../myapp-hotfix         # This is a full checkout of main branch
# Fix the bug, commit, push — without touching your feature work

# When done, remove the worktree
cd ~/projects/myapp
git worktree remove ../myapp-hotfix
\`\`\`

**Create worktree with new branch**:
\`\`\`bash
git worktree add ../myapp-fix -b hotfix/critical-bug main
# Creates new branch hotfix/critical-bug from main
# Checks it out in ../myapp-fix
\`\`\`

**List and manage worktrees**:
\`\`\`bash
git worktree list
# /home/user/projects/myapp              abc1234 [feature/login]
# /home/user/projects/myapp-hotfix       def5678 [main]
# /home/user/projects/myapp-review       ghi9012 [feature/search]

git worktree remove ../myapp-hotfix     # Remove worktree
git worktree prune                       # Clean up stale worktrees
\`\`\`

**When worktrees are useful**:
- **Hotfix while working on feature**: No stash/switch needed
- **Code review**: Check out PR branch in separate directory, keep your work untouched
- **Running tests on another branch**: Run tests in worktree while developing in main
- **Comparing branches**: Open two editors side by side
- **Long-running builds**: Build in worktree while coding in main

**How it works internally**:
- All worktrees share the same \`.git\` repository (one set of objects)
- Each worktree has its own working directory, index, and HEAD
- You cannot check out the same branch in two worktrees simultaneously

**Worktree vs clone**:

| Aspect | Worktree | Clone |
|--------|----------|-------|
| Disk space | Minimal (shared objects) | Full copy |
| Git history | Shared (one reflog) | Independent |
| Branches | Cannot overlap | Can overlap |
| Speed | Instant | Depends on repo size |

**Gotcha**: Don't check out the same branch in multiple worktrees — Git prevents this to avoid conflicts.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 13. .gitignore
  {
    title: "How does .gitignore work and what are common patterns?",
    content:
      "Explain gitignore syntax, global gitignore, and how to handle files that were already tracked.",
    answer: `**Gitignore syntax**:
\`\`\`gitignore
# Ignore files by extension
*.log
*.env

# Ignore directories
node_modules/
dist/
.next/
coverage/

# Ignore specific file
config/secrets.json

# Negation — do NOT ignore this
!.env.example

# Wildcard patterns
*.js        # Any .js file
src/**/*.test.ts  # .test.ts files anywhere under src/
temp-*      # Files starting with temp-

# Directory-only (trailing slash)
build/      # Ignore directory named "build"
\`\`\`

**Standard .gitignore for Node.js projects**:
\`\`\`gitignore
# Dependencies
node_modules/

# Build output
dist/
build/
.next/
out/

# Environment
.env
.env.local
.env.*.local
!.env.example

# IDE
.vscode/settings.json
.idea/
*.swp
*.swo

# OS
.DS_Store
Thumbs.db

# Test
coverage/

# Logs
*.log
npm-debug.log*

# Misc
*.tgz
.turbo/
\`\`\`

**Global gitignore** (applies to ALL repos on your machine):
\`\`\`bash
git config --global core.excludesFile ~/.gitignore_global

# ~/.gitignore_global
.DS_Store
Thumbs.db
.idea/
*.swp
.vscode/settings.json
\`\`\`

**Problem: File already tracked** (gitignore doesn't retroactively untrack):
\`\`\`bash
# .env was committed before .gitignore was added
# Adding .env to .gitignore won't remove it from history

# Solution: Untrack but keep local file
git rm --cached .env
echo ".env" >> .gitignore
git commit -m "chore: stop tracking .env"
# .env is now ignored (but still in history!)

# To remove from history entirely (dangerous):
git filter-branch --force --index-filter \\
  "git rm --cached --ignore-unmatch .env" \\
  --prune-empty --tag-name-filter cat -- --all
# Or use BFG Repo-Cleaner (faster)
\`\`\`

**Debugging gitignore**:
\`\`\`bash
# Check why a file is ignored
git check-ignore -v src/config.ts
# .gitignore:5:*.ts    src/config.ts

# List all ignored files
git status --ignored

# Force-add an ignored file (override)
git add -f src/important-ignored-file.ts
\`\`\`

**Per-directory gitignore**: You can have \`.gitignore\` in subdirectories — rules apply relative to that directory.`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 14. Git Tags
  {
    title: "How do you use Git tags for release management?",
    content:
      "Explain lightweight vs annotated tags, semantic versioning, and how tags are used in CI/CD pipelines.",
    answer: `**Tag types**:

**Lightweight tag** — just a pointer to a commit (like a branch that doesn't move):
\`\`\`bash
git tag v1.0.0
git tag v1.0.0 abc1234    # Tag a specific commit
\`\`\`

**Annotated tag** — full object with metadata (recommended for releases):
\`\`\`bash
git tag -a v1.0.0 -m "Release 1.0.0: Initial stable release"
git tag -a v1.0.0 abc1234 -m "Release 1.0.0"   # Tag specific commit
\`\`\`

**Difference**:
\`\`\`bash
git show v1.0.0
# Annotated: shows tag metadata + commit
# Lightweight: shows only the commit
\`\`\`

**Managing tags**:
\`\`\`bash
# List tags
git tag                    # All tags
git tag -l "v1.*"          # Filter by pattern

# Push tags to remote
git push origin v1.0.0     # Push specific tag
git push origin --tags      # Push all tags

# Delete tags
git tag -d v1.0.0           # Delete local
git push origin --delete v1.0.0  # Delete remote
\`\`\`

**Semantic Versioning** (SemVer):
\`\`\`
v MAJOR . MINOR . PATCH
v 1     . 2     . 3

MAJOR: Breaking changes (incompatible API changes)
MINOR: New features (backwards-compatible)
PATCH: Bug fixes (backwards-compatible)

Pre-release: v1.0.0-beta.1, v1.0.0-rc.1
\`\`\`

**CI/CD with tags**:
\`\`\`yaml
# GitHub Actions — trigger deployment on tag push
on:
  push:
    tags:
      - 'v*'  # Triggers on v1.0.0, v2.1.3, etc.

jobs:
  release:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: echo "Deploying \${GITHUB_REF_NAME}"  # v1.0.0
      - run: docker build -t myapp:\${GITHUB_REF_NAME} .
      - run: docker push myapp:\${GITHUB_REF_NAME}
\`\`\`

**Automated versioning** (with conventional commits):
\`\`\`bash
# Using standard-version or semantic-release
npx standard-version
# Reads conventional commits since last tag:
# feat: → bumps MINOR
# fix:  → bumps PATCH
# BREAKING CHANGE: → bumps MAJOR
# Updates CHANGELOG.md, bumps version in package.json, creates tag
\`\`\`

**Release workflow**:
\`\`\`bash
# 1. Ensure main is up to date
git checkout main && git pull

# 2. Create release tag
git tag -a v1.2.0 -m "Release 1.2.0"

# 3. Push tag (triggers CI/CD deployment)
git push origin v1.2.0

# 4. Create GitHub Release (optional — adds release notes)
gh release create v1.2.0 --generate-notes
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 15. Rewriting History
  {
    title: "How and when should you rewrite Git history?",
    content:
      "Explain git commit --amend, filter-branch, rebase -i, and when rewriting history is appropriate vs dangerous.",
    answer: `**Amend** — modify the last commit:
\`\`\`bash
# Fix commit message
git commit --amend -m "feat: add user authentication"

# Add forgotten files to last commit
git add forgotten-file.ts
git commit --amend --no-edit  # Same message, updated content
\`\`\`

**Interactive rebase** — edit any commit in history:
\`\`\`bash
git rebase -i HEAD~5
# pick → edit, squash, fixup, reword, drop
# See question #4 for details
\`\`\`

**filter-branch / filter-repo** — rewrite ALL history:
\`\`\`bash
# Remove a file from entire history (e.g., accidentally committed secret)
# Modern way (git-filter-repo, recommended):
pip install git-filter-repo
git filter-repo --path .env --invert-paths
# Removes .env from every commit in history

# Old way (slow, legacy):
git filter-branch --force --index-filter \\
  "git rm --cached --ignore-unmatch .env" -- --all

# Change author email in all commits:
git filter-repo --email-callback '
  return email.replace(b"old@email.com", b"new@email.com")
'
\`\`\`

**BFG Repo-Cleaner** — fast, simple history rewriting:
\`\`\`bash
# Remove large files from history
java -jar bfg.jar --strip-blobs-bigger-than 10M repo.git

# Remove secrets
java -jar bfg.jar --replace-text passwords.txt repo.git
\`\`\`

**Safe vs dangerous rewriting**:

| Operation | Safe (unpushed) | Dangerous (pushed) |
|-----------|----------------|-------------------|
| \`commit --amend\` | ✅ | ⚠️ Needs force push |
| \`rebase -i\` | ✅ | ⚠️ Needs force push |
| \`filter-repo\` | ✅ | ⚠️⚠️ Breaks everyone's clone |
| \`reset --hard\` | ✅ | ⚠️ Needs force push |

**The golden rules**:
1. **Never rewrite published history** (pushed and shared with others)
2. **Use \`--force-with-lease\`** instead of \`--force\` when force pushing
3. **Communicate with team** before any shared history rewrite
4. **All team members must re-clone or reset** after a \`filter-repo\` rewrite

\`\`\`bash
# Safe force push (fails if someone else pushed in the meantime)
git push --force-with-lease origin feature/my-branch

# DANGEROUS: overwrites remote regardless
git push --force origin main  # ← NEVER do this on shared branches
\`\`\`

**Legitimate reasons to rewrite**:
- Remove accidentally committed secrets (use filter-repo + rotate secrets)
- Remove large binary files from history (use BFG)
- Clean up feature branch before merging (interactive rebase)
- Fix author info before first push`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 16. Git Submodules and Monorepos
  {
    title: "Explain Git submodules and compare them with monorepo tools",
    content:
      "What problems do submodules solve? What are the alternatives (monorepo with pnpm workspaces, Turborepo, Nx)?",
    answer: `**Git submodules**: Embed one Git repository inside another at a specific commit.

\`\`\`bash
# Add a submodule
git submodule add https://github.com/org/shared-lib.git packages/shared-lib
# Creates .gitmodules file + reference to specific commit

# Clone repo with submodules
git clone --recurse-submodules https://github.com/org/main-repo.git
# Or after clone:
git submodule update --init --recursive

# Update submodule to latest
cd packages/shared-lib
git pull origin main
cd ../..
git add packages/shared-lib
git commit -m "chore: update shared-lib"
\`\`\`

**Submodule problems**:
- Easy to forget \`--recurse-submodules\` on clone
- Updating submodule requires two commits (submodule + parent repo)
- Detached HEAD in submodule — confusing for new developers
- CI/CD needs extra steps to check out submodules
- Hard to make cross-repo changes atomically

**Alternative: Monorepo with workspaces**:
\`\`\`json
// package.json (root)
{
  "workspaces": ["apps/*", "packages/*"]
}
\`\`\`
\`\`\`
monorepo/
├── apps/
│   ├── frontend/       (package.json: depends on @org/shared)
│   └── backend/        (package.json: depends on @org/shared)
├── packages/
│   └── shared/         (package.json: name: @org/shared)
├── package.json
└── pnpm-workspace.yaml
\`\`\`

\`\`\`yaml
# pnpm-workspace.yaml
packages:
  - "apps/*"
  - "packages/*"
\`\`\`

**Monorepo tools comparison**:

| Tool | What It Does | Best For |
|------|-------------|----------|
| pnpm workspaces | Dependency management, linking | Package management |
| Turborepo | Build caching, task orchestration | Fast builds, CI caching |
| Nx | Full build system, dep graph, generators | Large teams, enterprise |
| Lerna | Versioning, publishing (legacy) | NPM package publishing |

**Turborepo example**:
\`\`\`json
// turbo.json
{
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],       // Build deps first
      "outputs": ["dist/**"]
    },
    "test": {
      "dependsOn": ["build"]
    },
    "lint": {}
  }
}
\`\`\`
\`\`\`bash
turbo run build    # Builds all packages in dependency order, with caching
turbo run test --filter=frontend  # Only test frontend + its deps
\`\`\`

**When to use each**:

| Scenario | Solution |
|----------|----------|
| Shared code between own apps | Monorepo + workspaces |
| Third-party library integration | npm package (not submodule) |
| Large enterprise, many teams | Monorepo + Nx/Turborepo |
| Separate release cycles per component | Multi-repo + versioned packages |
| Must share Git history | Submodules (last resort) |`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 17. Git Log and History
  {
    title: "How do you effectively search and navigate Git history?",
    content:
      "Explain git log formatting, searching commits, finding who changed a line, and tracking file renames.",
    answer: `**Useful git log commands**:

\`\`\`bash
# Compact history
git log --oneline --graph --all
# * abc1234 (HEAD -> main) feat: add auth
# | * def5678 (feature/search) feat: search API
# |/
# * ghi9012 fix: typo

# Last 10 commits with stats
git log -10 --stat

# Log for specific file (including renames)
git log --follow -- src/auth.ts

# Log with full diff
git log -p -- src/auth.ts

# Pretty format
git log --pretty=format:"%h %an %ar %s" -10
# abc1234 John 2 hours ago feat: add auth
\`\`\`

**Searching commits**:
\`\`\`bash
# Search commit messages
git log --grep="authentication"

# Search for code changes (when was this string added/removed?)
git log -S "apiKey" --oneline
# Shows commits where "apiKey" was added or removed (pickaxe)

# Search for regex in changes
git log -G "function.*auth" --oneline

# Commits by author
git log --author="John" --since="2024-01-01"

# Commits between dates
git log --after="2024-01-01" --before="2024-02-01"

# Commits between two refs
git log main..feature/auth     # Commits in feature/auth but not in main
git log main...feature/auth    # Commits in either but not both
\`\`\`

**git blame** — who changed each line:
\`\`\`bash
git blame src/auth.ts
# abc1234 (John 2024-01-15 10:00) import { jwt } from 'jsonwebtoken';
# def5678 (Jane 2024-01-20 14:00) const SECRET = process.env.JWT_SECRET;

# Ignore whitespace changes
git blame -w src/auth.ts

# Ignore specific commits (e.g., formatting changes)
echo "abc1234" >> .git-blame-ignore-revs
git config blame.ignoreRevsFile .git-blame-ignore-revs
\`\`\`

**git show** — inspect a specific commit:
\`\`\`bash
git show abc1234              # Show commit + diff
git show abc1234:src/auth.ts  # Show file at that commit
git show abc1234 --stat       # Show files changed
\`\`\`

**Finding when a file was deleted**:
\`\`\`bash
git log --all --full-history -- path/to/deleted-file.ts
# Shows the last commit that included this file

# Restore deleted file
git checkout abc1234^ -- path/to/deleted-file.ts
# ^ means "parent of the commit that deleted it"
\`\`\`

**git shortlog** — contribution summary:
\`\`\`bash
git shortlog -sn --since="2024-01-01"
#  45  John
#  32  Jane
#  18  Bob
\`\`\`

**Custom aliases** for common log commands:
\`\`\`bash
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.last "log -1 --stat"
git config --global alias.search "log --all -S"
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 18. Pull Request Best Practices
  {
    title: "What are the best practices for creating and reviewing pull requests?",
    content:
      "How do you write good PR descriptions, keep PRs small, and conduct effective code reviews?",
    answer: `**Creating good PRs**:

**1. Keep PRs small** — aim for < 400 lines changed:
\`\`\`
❌ 2000 lines: "feat: add user management system"
✅ 200 lines:  "feat: add user model and migration"
✅ 150 lines:  "feat: add user service and validation"
✅ 100 lines:  "feat: add user controller and routes"
✅ 50 lines:   "feat: add user tests"
\`\`\`

**2. Write descriptive PR descriptions**:
\`\`\`markdown
## What
Add user authentication with JWT tokens

## Why
Users need to log in to access protected resources (issue #42)

## How
- Added Passport JWT strategy
- Added auth guard for protected routes
- Added /auth/login and /auth/refresh endpoints

## Testing
- Added unit tests for auth service
- Added e2e tests for login flow
- Tested manually with Postman

## Screenshots
[login form screenshot]

## Checklist
- [x] Tests added
- [x] Documentation updated
- [ ] Migration included (no DB changes)
\`\`\`

**3. Self-review before requesting review**:
\`\`\`bash
# Review your own diff before pushing
git diff main..HEAD
# Check for: debug logs, commented code, TODOs, missing tests
\`\`\`

**Reviewing PRs effectively**:

**What to look for**:
- **Correctness**: Does the code do what it claims?
- **Edge cases**: Null checks, error handling, boundary conditions
- **Security**: SQL injection, XSS, auth bypass, secret exposure
- **Performance**: N+1 queries, unnecessary re-renders, missing indexes
- **Maintainability**: Naming, complexity, duplication
- **Tests**: Are the tests meaningful? Do they test the right things?

**Constructive review comments**:
\`\`\`
❌ "This is wrong"
✅ "This might break if userId is null. Consider adding a check: \`if (!userId) throw ...\`"

❌ "Use a different approach"
✅ "Have you considered using a Map here? It would be O(1) lookup instead of O(n) with .find()"

❌ "Why did you do this?"
✅ "I'm curious about this approach — could you explain why you chose X over Y?"
\`\`\`

**Review etiquette**:
- Be kind and constructive
- Prefix with severity: \`nit:\`, \`question:\`, \`suggestion:\`, \`blocker:\`
- Approve with minor suggestions: "LGTM with nits"
- Don't block on style — use automated linters for that

**PR workflow**:
\`\`\`
1. Create feature branch from main
2. Make small, focused commits
3. Push and create PR with description
4. CI runs (lint, test, build)
5. Request review from 1-2 people
6. Address feedback, push updates
7. Get approval
8. Squash and merge (clean history)
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 19. Git Diff and Patch
  {
    title: "How do you use git diff effectively and create/apply patches?",
    content:
      "Explain different diff modes, how to read diffs, and how to create and apply patches for sharing changes.",
    answer: `**git diff modes**:
\`\`\`bash
# Working directory vs staging area (unstaged changes)
git diff

# Staging area vs last commit (staged changes)
git diff --cached          # or --staged

# Working directory vs last commit (all changes)
git diff HEAD

# Between two commits
git diff abc1234 def5678

# Between branches
git diff main..feature/auth
git diff main...feature/auth   # Changes since branches diverged

# Specific file
git diff -- src/auth.ts
git diff main -- src/auth.ts
\`\`\`

**Reading the diff output**:
\`\`\`diff
diff --git a/src/auth.ts b/src/auth.ts
index abc1234..def5678 100644
--- a/src/auth.ts                    ← old file
+++ b/src/auth.ts                    ← new file
@@ -10,7 +10,9 @@ export class AuthService {  ← hunk header (line numbers)
   async login(email: string, password: string) {
     const user = await this.userRepo.findByEmail(email);
-    if (!user) throw new Error('Not found');     ← removed line
+    if (!user) {                                  ← added line
+      throw new NotFoundException('User not found');
+    }
     const valid = await bcrypt.compare(password, user.password);
\`\`\`

**Useful diff options**:
\`\`\`bash
# Statistics only
git diff --stat main
# src/auth.ts | 15 +++++----
# src/user.ts |  3 +-
# 2 files changed, 10 insertions(+), 8 deletions(-)

# Word-level diff (instead of line-level)
git diff --word-diff

# Ignore whitespace changes
git diff -w

# Only show names of changed files
git diff --name-only main

# Filter by change type
git diff --diff-filter=A main   # Only added files
git diff --diff-filter=M main   # Only modified files
git diff --diff-filter=D main   # Only deleted files
\`\`\`

**Creating patches**:
\`\`\`bash
# Create patch file from commits
git format-patch main -o patches/
# Creates one .patch file per commit since main
# patches/0001-feat-add-auth.patch
# patches/0002-fix-auth-typo.patch

# Create single patch from diff
git diff main > my-changes.patch

# Create patch from specific commits
git format-patch -3    # Last 3 commits
\`\`\`

**Applying patches**:
\`\`\`bash
# Apply patch file (preserves commit info)
git am patches/0001-feat-add-auth.patch

# Apply diff-style patch
git apply my-changes.patch

# Check if patch applies cleanly (dry run)
git apply --check my-changes.patch

# Apply with 3-way merge (better conflict handling)
git am --3way patches/0001-feat-add-auth.patch
\`\`\`

**When patches are useful**:
- Sharing changes without push access (email workflow)
- Applying specific fixes to multiple branches
- Transferring changes between unrelated repositories
- Code review in environments without PR tools`,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },

  // 20. Git Configuration and Aliases
  {
    title: "How do you configure Git for productivity?",
    content:
      "Explain Git config levels, useful settings, aliases, and configuration for team consistency.",
    answer: `**Config levels** (lowest to highest priority):
\`\`\`bash
git config --system    # /etc/gitconfig (all users)
git config --global    # ~/.gitconfig (current user)
git config --local     # .git/config (current repo)
\`\`\`

**Essential global config**:
\`\`\`bash
# Identity
git config --global user.name "John Doe"
git config --global user.email "john@company.com"

# Default branch name
git config --global init.defaultBranch main

# Default editor
git config --global core.editor "code --wait"

# Pull strategy
git config --global pull.rebase true          # Rebase on pull (cleaner history)

# Push strategy
git config --global push.default current       # Push current branch
git config --global push.autoSetupRemote true  # Auto set upstream on first push

# Merge conflict style
git config --global merge.conflictstyle diff3  # Show base version in conflicts

# Auto-correct typos
git config --global help.autocorrect 10        # Auto-run after 1 second

# Rerere (reuse recorded resolution)
git config --global rerere.enabled true
\`\`\`

**Useful aliases**:
\`\`\`bash
git config --global alias.s "status -sb"
git config --global alias.lg "log --oneline --graph --all --decorate"
git config --global alias.last "log -1 --stat"
git config --global alias.undo "reset --soft HEAD~1"
git config --global alias.amend "commit --amend --no-edit"
git config --global alias.wip "commit -am 'WIP'"
git config --global alias.branches "branch -a --sort=-committerdate"
git config --global alias.clean-branches "!git branch --merged main | grep -v main | xargs -r git branch -d"
git config --global alias.stash-all "stash push -u"
\`\`\`

**Usage**:
\`\`\`bash
git s          # Short status
git lg         # Pretty log graph
git undo       # Undo last commit (keep changes)
git amend      # Add to last commit
git wip        # Quick WIP commit
git branches   # List branches by recent activity
\`\`\`

**Per-repo config** (team consistency):
\`\`\`ini
# .gitconfig (repo level)
[core]
  autocrlf = input        # LF on commit, native on checkout

[blame]
  ignoreRevsFile = .git-blame-ignore-revs

[diff]
  algorithm = histogram   # Better diff algorithm
\`\`\`

\`\`\`bash
# .gitattributes (committed — enforces settings for team)
* text=auto eol=lf        # Force LF line endings
*.png binary               # Treat as binary
*.lock linguist-generated  # Exclude from GitHub stats
\`\`\`

**Multiple identities** (personal + work):
\`\`\`ini
# ~/.gitconfig
[user]
  name = John Doe
  email = john@personal.com

[includeIf "gitdir:~/work/"]
  path = ~/.gitconfig-work

# ~/.gitconfig-work
[user]
  email = john@company.com
\`\`\`

**View all config**:
\`\`\`bash
git config --list --show-origin    # Show all settings and their source files
\`\`\``,
    level: QuestionLevel.MIDDLE,
    topicSlug: "git",
  },
];
