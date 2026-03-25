import { QuestionLevel } from '../../database/entities/question.entity';

export interface QuestionSeed {
  title: string;
  answer: string;
  topicSlug: string;
  level: QuestionLevel;
  difficultyScore: number;
  displayOrder: number;
}

interface SeniorAnswer {
  short_answer: string;
  detailed_answer: string;
  trade_offs: Array<{
    approach: string;
    pros: string[];
    cons: string[];
  }>;
  real_world_example: string;
  red_flags: string[];
  follow_up_questions: string[];
}

function buildAnswer(answer: SeniorAnswer): string {
  return JSON.stringify(answer);
}

export const seniorGitQuestions: QuestionSeed[] = [
  {
    title:
      'You manage a 500k-line monorepo with 50 developers. Clone times exceed 10 minutes and local storage exceeds 40 GB. How do you use sparse checkout, partial clone, and git worktrees to make developer workflows practical?',
    answer: buildAnswer({
      short_answer:
        'Combine partial clone (--filter=blob:none) to skip blob downloads at clone time, sparse checkout to limit the working tree to only the directories each developer needs, and git worktrees to allow parallel feature branches without re-cloning. Together these can reduce initial clone from 10 minutes to under 60 seconds and working tree disk usage from 40 GB to 2–3 GB per developer.',
      detailed_answer:
        'A 500k-line monorepo with years of history has three distinct size problems: (1) the object database (all blob history), (2) the working tree (checked-out files), and (3) context switching cost when working on multiple features.\n\n**Partial Clone** attacks problem #1. Instead of downloading every blob upfront:\n```bash\ngit clone --filter=blob:none --no-checkout git@github.com:org/monorepo.git\n# Downloads only commits and trees (~200 MB instead of 8 GB)\n# Blobs are fetched on-demand when files are first accessed\n```\nFor CI pipelines that rarely access old blobs, `--filter=tree:0` is even more aggressive — it skips all historical trees too.\n\n**Sparse Checkout** attacks problem #2. After a partial clone, restrict the working tree:\n```bash\ngit sparse-checkout init --cone\ngit sparse-checkout set apps/frontend packages/shared\n# Working tree now contains only those two directories\n# Other directories exist in the index but are absent from disk\n```\nCone mode is critical for performance — it uses prefix matching internally and avoids pattern scanning every path during checkout. Without cone mode, checking out 500k paths can take 2+ minutes.\n\nTo verify what is checked out: `git sparse-checkout list`\nTo add a directory on demand: `git sparse-checkout add apps/backend`\n\n**Git Worktrees** attacks problem #3. Instead of stashing and switching branches:\n```bash\ngit worktree add ../monorepo-feature-auth feature/auth-refactor\ngit worktree add ../monorepo-hotfix-prod hotfix/prod-crash\n# Each worktree is a separate directory with its own working tree\n# but shares the .git object database — no re-clone needed\n```\nThis lets a developer keep `main` clean in one terminal, work on a feature in a second directory, and review a hotfix in a third — all sharing the same 200 MB object store. `git worktree list` shows all active worktrees. Clean up with `git worktree remove ../monorepo-feature-auth`.\n\n**Combined setup script** for onboarding:\n```bash\ngit clone --filter=blob:none --sparse git@github.com:org/monorepo.git\ncd monorepo\ngit sparse-checkout set apps/frontend packages/shared\ngit checkout main\n# Total: ~60 seconds, ~2.5 GB disk\n```\n\nFor teams using GitHub, `gh repo clone` supports `--filter` flags. GitLab and Bitbucket also support partial clone via their Git backends. The key tradeoff: first access to any file not yet downloaded triggers a network fetch — this surprises developers if not documented. Mitigate with a `git fetch --filter=blob:none` in the onboarding script to pre-warm common files.',
      trade_offs: [
        {
          approach: 'Partial clone with blobless filter (--filter=blob:none)',
          pros: [
            'Clone time drops from 10+ minutes to 30–90 seconds for large repos',
            'Full commit and branch history is available for git log, git blame, bisect',
            'Compatible with all standard git operations — blobs fetched transparently on access',
          ],
          cons: [
            'First checkout of files not yet downloaded adds network latency per file',
            'Some CI tools and IDE integrations do not handle missing blobs gracefully',
            'Requires Git 2.22+ — older enterprise Git servers may not support filter protocol',
          ],
        },
        {
          approach: 'Sparse checkout with cone mode',
          pros: [
            'Reduces working tree from 40 GB to 1–5 GB depending on team scope',
            'Checkout and status operations are dramatically faster on large working trees',
            'Each developer can expand their cone incrementally without a full re-checkout',
          ],
          cons: [
            'Developers must explicitly add directories before accessing files in them',
            'Cross-cutting refactors (renaming shared interfaces) require temporarily widening the cone',
            'IDEs that index the full repo by directory scanning may still scan sparse paths',
          ],
        },
        {
          approach: 'Git worktrees for parallel branch development',
          pros: [
            'Zero disk overhead for additional branches — shares the object database',
            'Eliminates context-switching cost: no stash/pop cycle between active work streams',
            'Each worktree has an independent index and HEAD — safe concurrent operations',
          ],
          cons: [
            'A branch can only be checked out in one worktree at a time — causes confusing errors',
            'Absolute paths in worktrees break if the parent directory is moved or renamed',
            'Sparse checkout settings are per-worktree, requiring setup automation for team consistency',
          ],
        },
      ],
      real_world_example:
        'A fintech company with a 12-year-old monorepo (8 GB pack file, 500k files) reduced developer onboarding time from 45 minutes to 4 minutes by combining partial clone and cone-mode sparse checkout. They wrote an internal CLI tool (`mono init --role=frontend`) that ran the clone with the correct filter and set the appropriate sparse checkout paths per role. Worktrees were adopted by the platform team to maintain separate environments for long-running migrations — 3 worktrees per developer (main, feature, hotfix) sharing one 800 MB object database instead of 3 × 8 GB clones.',
      red_flags: [
        'Suggesting shallow clone (--depth=1) as the primary strategy — it breaks git bisect, git log --follow, and merge-base calculations in unpredictable ways',
        'Not knowing that cone mode is required for sparse checkout to be performant — non-cone sparse checkout scans every path against patterns at O(n) cost',
        'Assuming partial clone eliminates all fetch traffic — first access to any undownloaded blob still requires a network round trip',
        'Not accounting for IDE and tooling compatibility — many static analysis tools require the full working tree and will silently skip sparse paths',
        'Using git worktrees without automation — manual worktree setup leads to inconsistent sparse checkout configurations and developer confusion',
      ],
      follow_up_questions: [
        'How would you handle a cross-cutting refactor that touches files in 20 different sparse checkout cones simultaneously?',
        'What is the difference between --filter=blob:none and --filter=tree:0 and when would you choose each for CI pipelines?',
        'How do you configure git worktrees in a team where developers work across both macOS and Linux with different absolute path conventions?',
        'What monitoring would you put in place to detect when a repository is growing too fast and needs intervention before it becomes unmanageable?',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Walk through Git internals: how commits, trees, and blobs are stored as content-addressable objects. How would you use `git cat-file` and `git fsck` to diagnose and recover from a partially corrupted repository?',
    answer: buildAnswer({
      short_answer:
        'Git stores everything as content-addressed objects in .git/objects/. A commit points to a tree; a tree points to blobs (files) and subtrees (directories). Every SHA-1 is the hash of the object\'s content — so corruption is detectable. `git cat-file` lets you inspect any object by SHA; `git fsck` traverses the entire object graph checking for missing or broken links. Recovery uses reflog, ORIG_HEAD, loose objects in .git/objects/, and remotes as sources of truth.',
      detailed_answer:
        'Git\'s object model is a directed acyclic graph (DAG) of four object types stored in `.git/objects/`:\n\n**Blobs** store file content (not filenames):\n```bash\necho "hello" | git hash-object --stdin\n# ce013625030ba8dba906f756967f9e9ca394464a\ngit cat-file -p ce013625030ba8dba906f756967f9e9ca394464a\n# hello\n```\nThe SHA is derived from `"blob 6\\0hello\\n"` — the object type, size, null byte, then content. Two files with identical content share one blob.\n\n**Trees** store directory listings (filename → SHA mapping):\n```bash\ngit cat-file -p HEAD^{tree}\n# 100644 blob a8f... README.md\n# 040000 tree 3c9... src\n# 100755 blob f1e... run.sh\n```\nThe mode prefix encodes the file type (100644 = regular file, 100755 = executable, 120000 = symlink, 040000 = directory/subtree).\n\n**Commits** point to a tree plus parent commit(s):\n```bash\ngit cat-file -p HEAD\n# tree 3c9a...\n# parent 7f2b...\n# author Alice <a@co.com> 1700000000 +0700\n# committer Alice <a@co.com> 1700000000 +0700\n#\n# feat: add login\n```\nA merge commit has two parent lines. The root commit has none.\n\n**Diagnosing corruption** with `git fsck`:\n```bash\ngit fsck --full --strict\n# error: object file .git/objects/3c/9a... is empty\n# missing blob 3c9a...\n# dangling commit 7f2b... (unreachable but intact)\n```\nEmpty object files are the most common corruption symptom — caused by a disk write interrupted mid-operation (power loss, OOM kill during gc).\n\n**Recovery workflow**:\n1. Identify the missing SHA: `git fsck 2>&1 | grep missing`\n2. Check if it exists as a loose object: `ls .git/objects/3c/9a*`\n3. Try to recover from a pack file: `git unpack-objects < .git/objects/pack/pack-*.pack`\n4. Check the reflog for lost commits: `git reflog --all` — the missing commit may be referenced there\n5. Fetch from a remote (most reliable): `git fetch origin` — if the remote has the object, it is downloaded automatically\n6. If a collaborator has the object locally: `git fetch /path/to/colleague/repo`\n\n**Recovering deleted commits** (corruption-free but lost via reset):\n```bash\ngit reflog\n# HEAD@{5}: commit: feat: add login\ngit checkout HEAD@{5}  # Inspect the lost commit\ngit cherry-pick HEAD@{5}  # Or cherry-pick it back\n```\n\n**Preventing corruption**: enable `core.fsyncObjectFiles=true` on systems with aggressive write caching. Run `git gc --auto` periodically to pack loose objects into pack files, which are less vulnerable to partial write corruption.',
      trade_offs: [
        {
          approach: 'Recovery from remote (git fetch from origin)',
          pros: [
            'Most reliable — remote is treated as authoritative source of truth',
            'Automatically resolves all missing objects reachable from remote refs',
            'No manual SHA hunting required — git\'s protocol fetches what is missing',
          ],
          cons: [
            'Requires network access and that the remote has the object (local commits not yet pushed are lost)',
            'Does not recover unreachable/dangling objects that were never pushed',
            'Large repos may fetch significant data if pack negotiation is confused by corruption',
          ],
        },
        {
          approach: 'Recovery using git reflog and ORIG_HEAD',
          pros: [
            'Works offline — reflog is stored locally in .git/logs/',
            'Recovers commits lost to reset --hard, rebase, or branch deletion within the expiry window (90 days default)',
            'Fast — no network required, exact SHA is available in the log',
          ],
          cons: [
            'Reflog is local only — not shared or backed up in a bare remote',
            'Reflog entries expire (default 90 days for reachable, 30 days for unreachable commits)',
            'Does not help if the object file itself is corrupted — SHA is known but content is unreadable',
          ],
        },
        {
          approach: 'Manual object reconstruction from pack files',
          pros: [
            'Can recover objects not present on any remote if they exist in a local pack',
            'git unpack-objects can extract individual objects from a partial pack',
            'Useful in forensic scenarios where the remote has been force-pushed',
          ],
          cons: [
            'Requires understanding of git\'s binary pack format',
            'Pack index (.idx) corruption means objects may exist in the pack but be inaccessible without idx rebuild',
            'Time-consuming and error-prone without tooling — git fast-export/import may be needed',
          ],
        },
      ],
      real_world_example:
        'A startup\'s GitLab server experienced an NFS timeout during a git gc run, leaving 14 pack files in a half-merged state. `git fsck` reported 230 missing blobs. The SRE team ran `git unpack-objects` on each original pack file to extract loose objects, recovering 226 of the 230 blobs. The remaining 4 were found on a developer\'s laptop via `git fetch /home/dev/repo`. The incident took 3 hours to resolve. Afterward they added: daily `git fsck` on the GitLab server via a cron job, weekly repo backups using `git bundle create repo.bundle --all`, and NFS write timeout monitoring.',
      red_flags: [
        'Not knowing the difference between a blob, tree, commit, and tag object — conflating "commit" with "file" or "branch"',
        'Believing SHA-1 collisions are a practical security concern for private repos — misunderstanding the actual attack surface vs the theoretical one',
        'Suggesting `git clone --mirror` as a recovery tool without understanding it copies all refs including the corrupted pack',
        'Not knowing that reflog exists locally and is not shared — assuming a colleague\'s reflog can help recover your lost commits',
        'Attempting to manually edit a .git/objects/ file to fix corruption — object content is zlib-compressed and SHA-verified; manual edits will always produce a hash mismatch',
      ],
      follow_up_questions: [
        'How does git\'s pack protocol negotiate which objects to send during a fetch, and how does partial clone change this negotiation?',
        'What is a "dangling commit" as reported by git fsck, and under what circumstances would you want to recover it versus ignore it?',
        'How would you set up automated repository integrity checks in a GitLab or GitHub Enterprise environment to detect corruption before it affects developers?',
        'Explain how git\'s transition from SHA-1 to SHA-256 (git hash-object -t blob --object-format=sha256) affects repository interoperability during a migration period.',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Explain semantic merge conflicts — cases where the code compiles and tests pass but the merged logic is wrong. How does `git rerere` help with long-lived feature branches, and what are its limitations?',
    answer: buildAnswer({
      short_answer:
        'Semantic conflicts happen when two branches make independently valid changes that produce incorrect behavior when combined — git has no understanding of logic, only text. Classic examples: one branch renames a method, another adds calls to the old name (compiles if both names coexist); one branch changes a constant\'s meaning, another adds code that depends on the old meaning. `git rerere` (reuse recorded resolution) caches conflict resolutions so the same textual conflict is resolved automatically on future rebases, saving hours on long-lived branches — but it cannot detect semantic conflicts at all.',
      detailed_answer:
        'Git\'s merge algorithm operates on text diffs — it has no understanding of types, function contracts, or program semantics. This means it can produce a "clean" merge (no conflict markers) that is logically broken.\n\n**Classic semantic conflict patterns**:\n\n1. **Rename + call-site divergence**: Branch A renames `getUserById(id)` to `findUser(id)`. Branch B adds a new module that calls `getUserById(id)`. Both changes are syntactically clean. The merge compiles (TypeScript will catch this, but JavaScript won\'t) but the call-site in branch B\'s module is now broken.\n\n2. **Constant re-semantics**: Branch A changes `const MAX_RETRY = 3` (meaning: total attempts) to represent retry count (meaning: additional retries after first). Branch B adds a new service that uses `MAX_RETRY` assuming the old semantics. Merged code has the constant but with inconsistent interpretations across callers.\n\n3. **Interface signature change**: Branch A adds a required parameter to a function. Branch B adds a new caller with the old signature. TypeScript will catch this — JavaScript will silently pass `undefined`.\n\n**Detection strategies**:\n- Strong typed languages + strict compiler settings catch many cases\n- Integration tests that exercise cross-module behavior\n- Code review specifically targeting the merge commit diff (`git show MERGE_HEAD`)\n- Semantic diff tools like `difftastic` show structural changes instead of text changes\n\n**git rerere** solves a different but related problem — textual conflict fatigue on long-lived branches:\n```bash\ngit config --global rerere.enabled true\ngit config --global rerere.autoUpdate true\n# rerere stores conflict/resolution pairs in .git/rr-cache/\n```\n\nWorkflow on a 3-month feature branch that is rebased weekly onto main:\n```bash\ngit rebase main\n# Conflict in src/config.ts at line 47\n# Resolve it manually...\ngit add src/config.ts\ngit rebase --continue\n# rerere records: this conflict SHA → this resolution\n\n# Next week, same conflict reappears:\ngit rebase main\n# rerere detects: known conflict — applying saved resolution\n# No manual intervention needed\ngit rebase --continue\n```\n\nTo inspect cached resolutions: `ls .git/rr-cache/` — each subdirectory is a conflict SHA. To forget a bad resolution: `git rerere forget src/config.ts`\n\n**rerere limitations**:\n- Only matches textual conflicts — the exact same conflict markers must appear\n- Does not share resolutions across clones (`.git/rr-cache/` is local only)\n- A "wrong" resolution that was recorded will be applied silently on future conflicts\n- Does not help with semantic conflicts — code that merges cleanly has no rerere entry\n\nFor team-wide rerere, you must commit `.git/rr-cache/` to a shared location and distribute it, or use a wrapper script. Some CI systems export rerere caches as artifacts.',
      trade_offs: [
        {
          approach: 'git rerere for resolving repetitive textual conflicts',
          pros: [
            'Eliminates repeated manual resolution of the same conflict on weekly rebases of long-lived branches',
            'Zero configuration after enabling — resolutions are recorded and replayed automatically',
            'Works with both rebase and merge workflows — any operation that produces conflicts can trigger rerere',
          ],
          cons: [
            'Wrong resolutions are silently replayed — a bad initial resolution corrupts all future rebases until forgotten',
            'rerere cache is local by default; team members each resolve the same conflict independently unless the cache is shared',
            'Provides false confidence that a rebase was clean when a semantic conflict slipped through a textual resolution',
          ],
        },
        {
          approach: 'Typed language compiler as semantic conflict detector',
          pros: [
            'TypeScript strict mode catches entire categories of semantic conflicts at compile time (missing arguments, renamed methods)',
            'Zero additional tooling required — runs in existing build pipeline',
            'Errors are precise and actionable: exact file and line number of the broken call site',
          ],
          cons: [
            'Only catches type-level semantics — does not detect logical errors where types are unchanged but behavior differs',
            'JavaScript codebases have no static protection at all',
            'Developers may suppress TypeScript errors during a merge rather than investigating the semantic root cause',
          ],
        },
        {
          approach: 'Short-lived branches (trunk-based development) to avoid semantic conflicts',
          pros: [
            'Branches merged within 1–2 days have far fewer divergence points and proportionally fewer semantic conflicts',
            'Continuous integration catches semantic regressions within hours of a merge',
            'Eliminates rerere complexity entirely — conflicts are rare and resolved once',
          ],
          cons: [
            'Requires feature flags to ship incomplete features — additional infrastructure and mental overhead',
            'Not always feasible for large architectural changes that require weeks of work',
            'Trunk-based development requires a high level of team discipline and fast CI pipelines',
          ],
        },
      ],
      real_world_example:
        'A team of 12 at a SaaS company maintained a 6-week "billing-overhaul" branch that was rebased onto main every Friday. Without rerere, each rebase took 40–90 minutes of manual conflict resolution across 8 recurring conflict sites. After enabling rerere and committing the `.git/rr-cache/` to a shared S3 bucket (synced via a pre-rebase hook), rebases dropped to 5 minutes of automated resolution plus a 10-minute human review of the diff. They still discovered one semantic conflict — a pricing constant was re-semanticized on main while the billing branch had added new code using the old semantics — caught only because a team member noticed an unexpectedly low invoice in staging.',
      red_flags: [
        'Claiming that "if tests pass after a merge, there are no conflicts" — semantic conflicts can exist in code paths not covered by tests',
        'Not knowing what rerere stands for or that it needs to be explicitly enabled — it is off by default',
        'Believing rerere is a team-wide tool out of the box — the rr-cache is local and requires extra infrastructure to share',
        'Conflating textual conflicts (git detects and marks with <<<<<<) with semantic conflicts (git is unaware)',
        'Recommending always using git merge --strategy=ours to avoid conflicts — this silently discards the other branch\'s changes entirely',
      ],
      follow_up_questions: [
        'How would you set up a CI check that specifically validates merge commits to detect semantic regressions that individually passing branch tests would miss?',
        'In a trunk-based development workflow with feature flags, how do you handle the case where a feature flag\'s code path diverges so significantly from main that merging it back creates a large semantic risk?',
        'What tooling exists beyond rerere for making repeated rebase conflicts manageable — for example, merge drivers or .gitattributes conflict strategies?',
        'How does the octopus merge strategy differ from recursive, and in what scenario would using it increase or decrease the risk of semantic conflicts?',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'A secret API key was committed to a public repository 6 months ago and has been forked 1,000+ times. How do you use `git filter-repo` to rewrite history, and what is the process for GDPR-compliant removal of personal data from git history?',
    answer: buildAnswer({
      short_answer:
        'git filter-repo rewrites the entire commit graph, replacing or removing blobs containing the secret. After rewriting, force-push all branches and tags, contact GitHub/GitLab to trigger a cache purge, and rotate the compromised secret immediately. For GDPR removal, the same filter-repo approach removes PII from history, but all forks must also rewrite (uncontrollable for public repos) — GDPR compliance for public git repos requires legal counsel and a realistic assessment of what "erasure" means in a distributed system.',
      detailed_answer:
        'The critical first step is **rotate the secret immediately** — assume it is already compromised from the moment of the push, regardless of how quickly you act on the history rewrite.\n\n**Using git filter-repo** (the official replacement for the deprecated `git filter-branch`):\n\nInstall: `pip install git-filter-repo` (or via Homebrew: `brew install git-filter-repo`)\n\nRemove a specific string (the API key) from all blobs in all commits:\n```bash\n# Create a replacements file\necho \'AKIAIOSFODNN7EXAMPLE==>***REDACTED***\' > replacements.txt\n\ngit filter-repo --replace-text replacements.txt --force\n```\n\nThis rewrites every commit that contained the string, replacing it with `***REDACTED***`. All downstream SHAs change because each commit\'s hash depends on its tree and parent hashes.\n\nTo remove an entire file from all history:\n```bash\ngit filter-repo --path config/secrets.yml --invert-paths --force\n# --invert-paths means: keep everything EXCEPT this path\n```\n\nTo remove a directory:\n```bash\ngit filter-repo --path-glob \'secrets/**\' --invert-paths --force\n```\n\n**After rewriting locally**:\n```bash\n# Force push all branches\ngit push origin --force --all\n# Force push all tags (tags also reference old SHAs)\ngit push origin --force --tags\n```\n\n**GitHub-specific cache purge**: Even after force push, GitHub caches old objects. Submit a support ticket to trigger a cache purge. GitHub\'s cached views of raw files may serve old content for hours after force push without explicit purge. GitLab has a similar process via admin panel or support.\n\n**All collaborators must re-clone** — their local repos still contain the old objects. Announce via Slack/email: "Do NOT push from existing clones. Delete your local copy and re-clone."\n```bash\n# Collaborators run:\ngit fetch --prune --prune-tags\ngit reset --hard origin/main\n# Or preferably: delete and re-clone\n```\n\n**The 1,000 forks problem**: You cannot rewrite history in forks you do not own. Contact the platform (GitHub) to request that forks be deleted or updated. GitHub can bulk-delete forks of a repo when a verified DMCA or security incident is declared. This is an escalation path, not a guarantee.\n\n**GDPR data removal specifics**: GDPR Article 17 (right to erasure) applies to personal data. For git history containing a user\'s email, name, or uploaded PII:\n```bash\n# Replace a committer\'s email and name across all history\ngit filter-repo --mailmap mailmap.txt\n# mailmap.txt format:\n# New Name <new@email.com> <old@email.com>\n```\nFor binary files (uploaded avatars, documents with PII): use `--path` to remove them entirely. GDPR compliance in a distributed public repo is practically impossible after wide distribution — legal teams typically document "reasonable efforts" rather than claiming complete erasure.',
      trade_offs: [
        {
          approach: 'git filter-repo (recommended tool)',
          pros: [
            'Rewrites history 10–100x faster than git filter-branch — handles repos with 100k commits in minutes rather than hours',
            'Handles replacements, path removal, and committer rewriting in a single pass',
            'Actively maintained and is the official git project recommendation since 2019',
          ],
          cons: [
            'All commit SHAs change — every open PR, issue reference, and CI pipeline referencing old SHAs breaks',
            'Requires all collaborators to discard their local clones and re-fetch',
            'Does not propagate to forks — public forks retain the old history indefinitely',
          ],
        },
        {
          approach: 'BFG Repo Cleaner (Java alternative)',
          pros: [
            'Simpler interface for common tasks: `bfg --replace-text passwords.txt`',
            'Does not modify the most recent commit — safer for active development',
            'Runs as a standalone JAR with no Python dependency',
          ],
          cons: [
            'Does not rewrite the latest commit by default — requires separate step for HEAD',
            'Less flexible than filter-repo for complex rewrites (committer identity, path expressions)',
            'Development is less active than git filter-repo',
          ],
        },
        {
          approach: 'Repository deletion and recreation (nuclear option)',
          pros: [
            'Guarantees the secret is not present in any form in the new repo',
            'Eliminates the need to rewrite history or coordinate collaborator re-clones',
            'GitHub will not cache old objects from a deleted repo after the cache TTL expires',
          ],
          cons: [
            'Destroys all issues, PRs, stars, wiki content, and GitHub Actions history permanently',
            'Forks still exist with full old history — the secret is not erased from the ecosystem',
            'Extreme disruption to active development workflows — CIs, integrations, clones all break simultaneously',
          ],
        },
      ],
      real_world_example:
        'A startup accidentally committed AWS root account credentials to a public GitHub repo. Within 4 minutes of the push, an automated scanner had harvested the key and spun up 47 EC2 instances for crypto mining. The team rotated the credentials (stopping the mining), then used git filter-repo to rewrite 3 years of history (8,000 commits) in 4 minutes. Force-push, GitHub cache purge ticket, and team-wide re-clone took another 2 hours. The 23 existing forks were individually contacted via GitHub\'s fork network — 18 owners deleted their forks upon request. The remaining 5 were reported to GitHub security, who purged the caches. Total cost of the incident: ~$800 in unauthorized AWS charges and 6 hours of engineering time. Root fix: added git-secrets and truffleHog to pre-commit hooks.',
      red_flags: [
        'Suggesting git filter-branch instead of git filter-repo — filter-branch is deprecated, buggy, and orders of magnitude slower on large repos',
        'Believing that force-pushing removes the secret from GitHub immediately — cached raw views and GitHub\'s CDN may serve old content for hours without an explicit cache purge request',
        'Not rotating the compromised credential before starting the history rewrite — every minute of delay is a minute of potential exploitation',
        'Assuming forks can be controlled or purged automatically — in a public repo with hundreds of forks, complete erasure is technically and legally complex',
        'Treating GDPR erasure in a public distributed git repo as technically achievable without legal input — advising "we are compliant" after a filter-repo run without acknowledging the fork distribution problem',
      ],
      follow_up_questions: [
        'How would you set up pre-push hooks and CI secrets scanning (truffleHog, gitleaks) to prevent secrets from ever reaching the remote?',
        'After a filter-repo rewrite, how do you update all GitHub Actions workflow runs, deployment pipelines, and CI systems that reference the now-invalid old commit SHAs?',
        'If GDPR requires erasure of a contributor\'s personal data (name and email in commit history) and the repo has 500 forks, what is the legally defensible approach versus the technically achievable one?',
        'How does git\'s object expiry and `git gc` schedule affect whether an old object containing a secret can be recovered from the repository after a filter-repo rewrite?',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Compare GitFlow, trunk-based development, and the Ship/Show/Ask model for a team of 30 engineers deploying to production multiple times per day. How do you choose a branching strategy based on deployment frequency, team maturity, and release risk?',
    answer: buildAnswer({
      short_answer:
        'GitFlow is optimized for scheduled releases with long QA cycles — it adds process overhead that slows teams deploying daily. Trunk-based development (TBD) is optimized for high-frequency deployments with strong CI gates — it requires feature flags, high test coverage, and team discipline. Ship/Show/Ask is a pragmatic middle ground: Ship (merge directly for trivial changes), Show (merge but notify for review), Ask (create PR, wait for approval) — applied per-change-risk rather than as a team-wide policy. For 30 engineers deploying multiple times daily, TBD or Ship/Show/Ask outperforms GitFlow unless there are regulatory reasons for scheduled releases.',
      detailed_answer:
        'Branching strategy is a sociotechnical decision — the "correct" answer depends on deployment infrastructure, test suite speed, and organizational risk tolerance.\n\n**GitFlow** (Driessen, 2010):\n- Branches: `main`, `develop`, `feature/*`, `release/*`, `hotfix/*`\n- Merge flow: feature → develop → release → main\n- Designed for: quarterly/monthly release cycles, teams with separate QA and release engineering roles\n\nFor a team deploying multiple times daily, GitFlow creates drag:\n```bash\n# GitFlow hotfix on a Friday afternoon:\ngit checkout -b hotfix/critical-bug main  # branch from main\n# fix...\ngit merge hotfix/critical-bug develop  # merge back to develop\ngit merge hotfix/critical-bug main     # and to main\ngit tag -a v2.3.1                      # tag the release\n# 4 merge commits, 2 branch targets, risk of divergence\n```\nThis ceremony is appropriate if `develop` has in-progress features not ready for production. For teams with CI/CD, it is pure overhead.\n\n**Trunk-Based Development**:\n- One long-lived branch: `main` (the trunk)\n- Feature branches exist for hours to 2 days maximum\n- Incomplete features hidden behind feature flags, not separate branches\n\n```bash\n# TBD workflow:\ngit checkout -b feat/new-search-ui  # short-lived branch\n# Work for <2 days\ngit push origin feat/new-search-ui\n# PR reviewed in <4 hours — small, focused diff\ngit merge --squash feat/new-search-ui main\ngit branch -d feat/new-search-ui\n# Feature flag controls rollout:\nif (featureFlags.newSearchUI) { renderNewUI() } else { renderOldUI() }\n```\n\nRequirements for TBD to work: (1) CI pipeline <10 minutes, (2) >70% test coverage, (3) feature flag system, (4) deploy pipeline that can roll back within 5 minutes. Without these, TBD causes production incidents.\n\n**Ship/Show/Ask** (Rouan Wilsenach, 2021):\n- **Ship**: Commit directly to main for trivial, low-risk changes (typo fixes, dependency minor bumps, config changes by senior devs)\n- **Show**: Merge to main, then open PR for retrospective review/discussion (non-critical refactors, test additions)\n- **Ask**: Open PR before merging, require approval (new features, API changes, security-sensitive code)\n\nThe key insight: not all changes carry equal risk. GitFlow applies maximum process to every change; Ship/Show/Ask scales process to risk.\n\n**Decision framework for 30 engineers, multiple deploys/day**:\n| Factor | GitFlow | TBD | Ship/Show/Ask |\n|---|---|---|---|\n| CI speed | <20min OK | Must be <10min | <10min preferred |\n| Feature flags | Not needed | Required | Required for Ship/Show |\n| Regulatory compliance | Well-supported | Harder to audit | Auditable per-PR |\n| Junior/senior mix | Safe for juniors | Requires discipline | Flexible by person |\n\nRecommendation: TBD or Ship/Show/Ask with a CI pipeline under 8 minutes, a feature flag service (LaunchDarkly, Unleash, or a simple Redis-backed system), and clear per-engineer empowerment levels defined.',
      trade_offs: [
        {
          approach: 'GitFlow',
          pros: [
            'Provides clear structure for teams with scheduled releases and separate QA stages',
            'Well-understood by most developers — extensive documentation and tooling (git-flow CLI)',
            'Supports maintaining multiple active release versions simultaneously (v1.x and v2.x branches)',
          ],
          cons: [
            'Long-lived feature branches create merge conflicts and context-switch overhead',
            'The develop branch is perpetually ahead of main — creates a permanent integration gap',
            'Incompatible with continuous deployment philosophy — release branches create artificial deployment gates',
          ],
        },
        {
          approach: 'Trunk-Based Development',
          pros: [
            'Eliminates merge conflicts from long-lived branches — branches live for hours, not weeks',
            'Forces continuous integration discipline — broken builds block the entire team, not just one branch',
            'Directly enables continuous deployment — every green commit on main is a candidate release',
          ],
          cons: [
            'Requires feature flags for every incomplete feature — adds system complexity and flag debt',
            'Requires a fast, reliable CI pipeline — slow or flaky CI makes trunk development painful',
            'Less tolerance for junior developers pushing directly — requires strong code review culture or PR gate',
          ],
        },
        {
          approach: 'Ship/Show/Ask',
          pros: [
            'Scales process overhead to change risk — low-risk changes move fast, high-risk changes get scrutiny',
            'Empowers senior developers to move quickly while protecting critical paths with mandatory review',
            'Flexible adoption — teams can start with Ask for everything and graduate individuals to Show/Ship over time',
          ],
          cons: [
            'Requires clear guidelines on what constitutes Ship vs Show vs Ask — ambiguity leads to inconsistency',
            'Ship and Show changes bypass pre-merge review — post-merge issues require rapid rollback capability',
            'Harder to enforce in organizations with audit requirements that mandate pre-merge approval for all production changes',
          ],
        },
      ],
      real_world_example:
        'A 35-engineer fintech team migrated from GitFlow to trunk-based development over 6 months. Deployment frequency went from 2 releases/week to 15 deployments/day. The migration required: (1) reducing CI from 45 minutes to 7 minutes by parallelizing test suites, (2) adopting LaunchDarkly for feature flags, (3) defining "definition of done" as "merged to main, flag enabled in staging" rather than "in the release branch". The first 3 months were painful — 4 production incidents from incomplete feature isolation. By month 6, production incidents from merges dropped 60% due to smaller, more reviewable PRs (average PR size fell from 800 lines to 120 lines).',
      red_flags: [
        'Recommending GitFlow for a team deploying multiple times daily without acknowledging the overhead cost',
        'Advocating for trunk-based development without acknowledging the prerequisite infrastructure (feature flags, fast CI, rollback capability)',
        'Not knowing what Ship/Show/Ask is — it has gained significant industry adoption since 2021 and is referenced in DORA and Google\'s DevOps research',
        'Treating branching strategy as purely a git question rather than a team process and deployment infrastructure question',
        'Not considering regulatory or compliance requirements — financial, healthcare, and government software often has mandatory pre-merge approval requirements that make pure Ship/Show impractical',
      ],
      follow_up_questions: [
        'How do you manage feature flag debt — the accumulation of old flags for launched or abandoned features — at scale in a trunk-based development environment?',
        'If your team adopts trunk-based development and a critical bug is introduced on main, what is the correct response: revert the commit, hot-fix forward, or roll back the deployment? How does your answer change based on how many commits have landed since the bug?',
        'How would you enforce the Ship/Show/Ask model in GitHub Actions or GitLab CI — for example, requiring CODEOWNERS approval only for specific high-risk paths while allowing direct merge for others?',
        'What DORA (DevOps Research and Assessment) metrics would you track to measure whether a branching strategy migration was successful, and what are the target values for an elite-performing team?',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'A production service has a memory leak that was introduced somewhere in the last 500 commits over 3 months. Walk through using `git bisect` to identify the exact commit, and how you would automate bisect with a test script to run it unattended.',
    answer: buildAnswer({
      short_answer:
        'git bisect performs a binary search through commit history — 500 commits requires at most log₂(500) ≈ 9 steps. Mark a known-good commit and the current HEAD as bad, then git checks out the midpoint. Test, mark good or bad, repeat. Automate with `git bisect run <script>` — the script exits 0 for good, 1 for bad, 125 to skip. For a memory leak, the script should start the service, send representative load, measure heap usage, and exit with the appropriate code.',
      detailed_answer:
        'Manual bisect is a 9-step process. Automated bisect runs the entire search unattended — critical for slow operations like starting a service and running a load test.\n\n**Manual bisect**:\n```bash\ngit bisect start\ngit bisect bad HEAD                    # current commit: leak present\ngit bisect good v3.2.0                 # 3 months ago: no leak\n# git checks out the midpoint: commit ~250\n# Test: does the memory leak exist here?\n# Yes → git bisect bad\n# No  → git bisect good\ngit bisect good  # or bad\n# Repeat 7–8 more times\n# git bisect good\n# <SHA> is the first bad commit\ngit bisect reset  # return to HEAD\n```\n\nBisect uses binary search: log₂(500) = 8.97, so at most 9 rounds.\n\n**Automated bisect script** for a Node.js service memory leak:\n```bash\n#!/bin/bash\n# bisect-memory-check.sh\nset -e\n\n# Build the service at the current commit\nnpm install --silent\nnpm run build --silent\n\n# Start the service in background\nnode dist/main.js &\nSERVER_PID=$!\n\n# Wait for startup\nsleep 3\n\n# Send 500 representative requests\nfor i in $(seq 1 500); do\n  curl -s http://localhost:3000/api/heavy-endpoint > /dev/null\ndone\n\n# Measure heap usage (RSS in KB)\nRSS_KB=$(ps -o rss= -p $SERVER_PID)\nkill $SERVER_PID\n\necho "RSS: ${RSS_KB} KB"\n\n# Threshold: leak causes >150 MB RSS, healthy is <80 MB\nif [ "$RSS_KB" -gt 153600 ]; then\n  exit 1  # bad commit — leak present\nelse\n  exit 0  # good commit — no leak\nfi\n```\n\nRun unattended:\n```bash\ngit bisect start\ngit bisect bad HEAD\ngit bisect good v3.2.0\ngit bisect run ./bisect-memory-check.sh\n# git will run the script at each midpoint, automatically marking good/bad\n# Output after 9 iterations:\n# abc1234... is the first bad commit\n```\n\n**Exit codes for the bisect script**:\n- `0` — this commit is good (no leak)\n- `1-124, 126-127` — this commit is bad (leak present)\n- `125` — skip this commit (cannot test it — e.g., won\'t compile)\n\n**Handling untestable commits** (compilation failures, missing deps):\n```bash\n# In the script, if build fails:\nnpm run build 2>/dev/null || exit 125  # skip instead of marking bad\n```\n\n**For non-deterministic leaks** (only appears after 10k requests):\n```bash\n# Increase load in the script\nfor i in $(seq 1 10000); do ...; done\n# Or use a load testing tool:\nwrk -t4 -c50 -d30s http://localhost:3000/api/endpoint\n```\n\n**After finding the bad commit**:\n```bash\ngit show abc1234  # Review the diff\ngit bisect log    # Export the full bisect session for documentation\n# Typical output: which object/module was changed that introduced the leak\n```\n\nFor a memory leak specifically, the commit diff often points to: (1) a new event listener not being removed, (2) a cache with no eviction policy, (3) a global array that accumulates without clearing, (4) a closure capturing a large object in a callback.\n\n**Important**: Run `git bisect reset` after finishing — it returns you to HEAD and removes the bisect state.',
      trade_offs: [
        {
          approach: 'Automated git bisect run with a scripted test',
          pros: [
            'Fully unattended — 9 iterations of a 2-minute test runs overnight without human attention',
            'Deterministic and reproducible — the same script can be run again if results are questioned',
            'Handles edge cases via exit code 125 (skip) for commits that cannot be tested',
          ],
          cons: [
            'Requires a reliable test that definitively distinguishes good from bad — flaky or slow tests make bisect unreliable',
            'Service startup and teardown overhead multiplies across 9 iterations — a 5-minute test takes 45+ minutes total',
            'May find the wrong commit if the leak is non-deterministic or requires a long warm-up period to manifest',
          ],
        },
        {
          approach: 'Manual bisect with production metrics correlation',
          pros: [
            'Can use real production APM data (Datadog, New Relic) to correlate deployment timestamps with memory growth',
            'No need to reproduce the exact conditions — production traffic is the test',
            'Deployment logs narrow the search to 10–20 commits rather than 500, reducing bisect iterations',
          ],
          cons: [
            'Requires production deployment at each bisect step — risky and slow',
            'Memory leaks may not manifest in the same way in a test environment as production',
            'Requires production access and coordination with on-call engineers during the bisect session',
          ],
        },
        {
          approach: 'Code review of likely suspects (manual triage)',
          pros: [
            'Fastest time-to-resolution if the team has intuition about which recent changes touch memory-sensitive paths',
            'No infrastructure required — just git log and code review',
            'Often finds related issues beyond the primary leak that bisect would miss',
          ],
          cons: [
            'Fails completely when the leak is subtle or in an unexpected location',
            'Biased by developer assumptions — teams often miss the actual cause due to confirmation bias',
            'Scales poorly to 500 commits — meaningful only if you can first narrow to a 20–30 commit range',
          ],
        },
      ],
      real_world_example:
        'A Node.js API service was growing memory by 50 MB/hour in production, causing a restart every 6 hours. The team had 480 commits in 10 weeks with no obvious memory-related changes. A senior engineer wrote a bisect script that: built the service, ran 1,000 simulated requests using k6, measured RSS via `/proc/$PID/status`, and exited 0/1 based on a 100 MB threshold. Running `git bisect run ./check.sh` over 8 iterations (total: 35 minutes) identified a commit that added a Redis pub/sub listener inside a request handler — creating a new listener on every request without removing it. The fix was a one-line change. The bisect script was committed to the repo as `scripts/bisect-memory.sh` for future use.',
      red_flags: [
        'Not knowing that bisect exit code 125 means "skip" — using exit 1 for untestable commits will incorrectly mark them as "bad" and find the wrong culprit',
        'Forgetting `git bisect reset` after finishing — leaving the repo in bisect state confuses developers who pull the branch',
        'Not accounting for test non-determinism — a flaky bisect script will produce random results and waste hours',
        'Suggesting manual binary search through deployments without knowing the git bisect command exists',
        'Not checking the diff of the identified bad commit and immediately pushing a "revert" without understanding what the commit actually changed and why',
      ],
      follow_up_questions: [
        'How would you handle a regression that only appears after 48 hours of continuous load — making a 2-minute bisect test insufficient to detect it?',
        'If git bisect identifies a commit but the diff spans 15 files and 800 lines, how would you narrow down the exact line causing the memory leak?',
        'How do you integrate git bisect results into your post-mortem process to improve detection of similar issues in the future?',
        'What is the difference between `git bisect skip` and exit code 125 in a bisect run script, and when would you use each?',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Your organization has 10 repositories sharing a common utilities library. Compare git submodules, git subtrees, and migrating to a monorepo for managing shared code. What are the maintenance overhead and synchronization strategies for each?',
    answer: buildAnswer({
      short_answer:
        'Submodules pin a specific commit of an external repo inside another — updates require explicit pointer bumps and are a constant source of developer confusion. Subtrees copy a repo\'s history into a subdirectory — simpler for consumers but harder to push changes back upstream. A monorepo eliminates the synchronization problem entirely at the cost of tooling complexity. For 10 repos sharing one library with frequent changes, a monorepo or a proper package registry (private npm/GitHub Packages) beats both submodule and subtree for developer experience.',
      detailed_answer:
        'The core problem with shared code across multiple repos is synchronization: when the library changes, how do all consumers get the update safely?\n\n**Git Submodules**:\n```bash\n# Adding a submodule:\ngit submodule add git@github.com:org/utils.git libs/utils\n# Creates .gitmodules file and records the pinned SHA\n\n# After cloning a repo with submodules:\ngit clone --recurse-submodules git@github.com:org/service-a.git\n# Without --recurse-submodules, libs/utils/ is empty — #1 developer confusion\n\n# Updating the submodule pointer to latest:\ncd libs/utils && git pull origin main\ncd ../.. && git add libs/utils && git commit -m \"chore: bump utils to v2.3\"\n# This commit records the new SHA pointer — explicit, auditable\n\n# Check which submodule SHAs are in use across all repos:\ngrep -r \'path = libs/utils\' */.gitmodules\n```\n\nSubmodule pain points: (1) `git pull` in the parent repo does NOT update the submodule — developers see stale code. (2) After a force-push to the submodule repo, all parent repos pointing to the old SHA get dangling references. (3) Merge conflicts in `.gitmodules` are confusing.\n\n**Git Subtrees**:\n```bash\n# Adding a subtree (copies full history):\ngit subtree add --prefix=libs/utils git@github.com:org/utils.git main --squash\n# --squash creates one commit summarizing the subtree history (cleaner)\n\n# Updating from upstream:\ngit subtree pull --prefix=libs/utils git@github.com:org/utils.git main --squash\n\n# Pushing local changes back to the upstream utils repo:\ngit subtree push --prefix=libs/utils git@github.com:org/utils.git feature/new-helper\n# This isolates only the commits that touched libs/utils/ and pushes them upstream\n```\n\nSubtree advantages: regular `git clone` just works — no `--recurse-submodules`. Subtree pain points: large repos get even larger (full history is merged in). `git subtree push` is slow for large repos — it walks every commit. Contributors often forget to push upstream, causing drift.\n\n**Private Package Registry** (often overlooked as the right answer):\n```bash\n# Publish utils to GitHub Packages:\nnpm publish --registry https://npm.pkg.github.com\n\n# Consume in service-a:\nnpm install @org/utils@2.3.0\n# package.json pins the version explicitly\n\n# Automated updates via Renovate or Dependabot:\n# Renovate opens PRs for @org/utils version bumps automatically\n```\nThis is semantically versioned, independently deployable, and follows the same workflow as any third-party dependency. The downside: cross-cutting changes require publishing a new version and bumping across all 10 repos — coordinated by Renovate bot.\n\n**Monorepo** with Turborepo/Nx:\n```bash\n# All repos combined:\nmonorepo/\n  packages/utils/      # shared library\n  services/service-a/  # imports @org/utils directly\n  services/service-b/\n\n# Local workspace linking (pnpm workspaces):\n# package.json of service-a:\n{ "dependencies": { "@org/utils": "workspace:*" } }\n# Changes to packages/utils are immediately reflected in services/ — no publish step\n```\nMonorepo eliminates synchronization entirely. Cost: CI must be smart (Turborepo\'s affected detection), tooling is more complex, and repo size grows.',
      trade_offs: [
        {
          approach: 'Git Submodules',
          pros: [
            'Strong version pinning — each repo explicitly records which commit of the library it uses',
            'Library changes are isolated — consumers opt-in to updates rather than receiving them automatically',
            'Works with any git host — no additional infrastructure beyond git itself',
          ],
          cons: [
            'Constant source of developer confusion — cloning without --recurse-submodules leaves empty directories',
            'Updating submodule pointers across 10 repos after a library change requires 10 separate commits',
            'Force pushes to the submodule repo break all parent repos pointing to the old SHA',
          ],
        },
        {
          approach: 'Git Subtrees',
          pros: [
            'No special clone command required — subtree content is present in the parent repo immediately',
            'History from the library is visible in the parent repo\'s git log',
            'Easier for infrequent contributors who are unfamiliar with submodule workflows',
          ],
          cons: [
            'git subtree push is slow and error-prone — developers frequently forget to push upstream changes',
            'Each parent repo copies the full library history, inflating repo size',
            'Difficult to manage when the library has frequent commits — pull conflicts are common',
          ],
        },
        {
          approach: 'Monorepo with workspace linking',
          pros: [
            'Eliminates synchronization entirely — shared code changes are immediately visible to all consumers',
            'Atomic cross-cutting changes: a single PR can update the library and all 10 consumers simultaneously',
            'Modern tooling (Turborepo, Nx) provides incremental builds and affected-only CI for fast pipelines',
          ],
          cons: [
            'Significant upfront migration cost — combining 10 repos requires rewriting CI, access controls, and history',
            'Repository size and CI complexity grow substantially — requires investment in build caching infrastructure',
            'Single access control for all code — harder to grant contractors access to one service without visibility into others',
          ],
        },
      ],
      real_world_example:
        'A platform team managing 8 Node.js microservices used git submodules for a shared auth library for 2 years. Developer surveys consistently ranked submodule management as the #1 pain point — roughly 3 hours/week per developer lost to submodule-related issues (stale checkout, detached HEAD confusion, merge conflicts in .gitmodules). They evaluated three options: (1) subtrees — rejected due to slow push-back workflow, (2) private npm package — rejected because the 20-minute publish-and-bump cycle was too slow for the 5–10 daily changes to the auth library, (3) monorepo migration — selected, took 6 weeks with a custom script to rewrite git history using git filter-repo. Post-migration, the 3 hours/week of submodule friction disappeared. CI time went from 8 minutes to 4 minutes per service (Turborepo cache), with full cross-service CI running in 12 minutes.',
      red_flags: [
        'Recommending submodules without acknowledging the developer experience problems — conflating "technically correct" with "team-practical"',
        'Not knowing that `git clone` without `--recurse-submodules` leaves submodule directories empty — this is the #1 submodule complaint',
        'Treating the private npm package registry option as "not a git solution" and refusing to consider it — it is often the right answer for shared libraries with semantic versioning',
        'Proposing a monorepo migration without a realistic assessment of the migration cost and CI tooling investment required',
        'Not knowing that git subtree push rewrites history by cherry-picking only the commits that touched the prefix path — important for understanding its performance characteristics',
      ],
      follow_up_questions: [
        'How would you set up Renovate or Dependabot to automatically open PRs across all 10 repos when a new version of the shared library is published to a private npm registry?',
        'In a monorepo, how does Turborepo\'s "affected" computation work — what does it use to determine which packages need to be rebuilt after a change?',
        'If you choose git submodules, what git hooks and CI checks would you put in place to prevent the most common submodule mistakes (stale pointers, empty directories after clone)?',
        'How would you migrate a repo that currently uses git submodules to a monorepo structure while preserving the full commit history of both the parent and the submodule?',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Design a comprehensive git hook strategy for a team of 30 engineers: pre-commit linting, commit-msg validation, and pre-push test running. Compare Husky, Lefthook, and native git hooks. How do you prevent hooks from becoming a developer experience bottleneck?',
    answer: buildAnswer({
      short_answer:
        'Git hooks enforce standards at the developer\'s workstation before code reaches CI — catching issues in 2 seconds instead of 8 minutes. pre-commit runs linters/formatters on staged files, commit-msg validates message format (conventional commits), pre-push runs fast tests (unit only, no integration). Husky is the Node.js ecosystem default but adds npm/pnpm install friction. Lefthook is faster, cross-language, and runs hooks in parallel. Native hooks are portable but require manual distribution. The critical design principle: hooks must complete in <30 seconds total or developers will bypass them with --no-verify.',
      detailed_answer:
        'Git hooks are shell scripts in `.git/hooks/` that run at specific points in the git workflow. The challenge: they are not committed to the repo by default, so team distribution requires tooling.\n\n**Hook execution points**:\n- `pre-commit`: runs before the commit is created — ideal for linting and formatting staged files\n- `commit-msg`: receives the commit message file path — validate format\n- `pre-push`: runs before push — ideal for running the fast test suite\n- `prepare-commit-msg`: auto-populate commit message template\n\n**Lefthook configuration** (recommended for polyglot teams):\n```yaml\n# lefthook.yml\npre-commit:\n  parallel: true  # run all jobs concurrently\n  jobs:\n    - name: eslint\n      glob: "*.{js,ts,tsx}"\n      run: npx eslint --fix {staged_files}\n      stage_fixed: true  # auto-stage the fixed files\n    - name: prettier\n      glob: "*.{js,ts,tsx,json,md}"\n      run: npx prettier --write {staged_files}\n      stage_fixed: true\n    - name: typecheck\n      run: npx tsc --noEmit\n      skip:\n        - merge\n        - rebase  # skip typecheck during merge/rebase operations\n\ncommit-msg:\n  jobs:\n    - name: conventional-commits\n      run: npx commitlint --edit {1}\n\npre-push:\n  jobs:\n    - name: unit-tests\n      run: npm run test:unit\n      # Do NOT run integration/e2e here — too slow\n```\n\nInstall lefthook: `npm install --save-dev @evilmartians/lefthook`\nThe `prepare` script in package.json: `"prepare": "lefthook install"` — automatically installs hooks after `npm install`.\n\n**Husky configuration** (Node.js ecosystem standard):\n```bash\nnpx husky init\n# Creates .husky/ directory with hook scripts\n```\n```bash\n# .husky/pre-commit\n#!/bin/sh\nnpx lint-staged  # lint only staged files via lint-staged package\n```\n```json\n// package.json - lint-staged config\n"lint-staged": {\n  "*.{ts,tsx}": ["eslint --fix", "prettier --write"],\n  "*.{json,md}": ["prettier --write"]\n}\n```\nHusky requires `prepare` in package.json and relies on Node.js being available. Breaks in non-Node environments.\n\n**commitlint** for conventional commits:\n```bash\n# commitlint.config.js\nmodule.exports = {\n  extends: [\'@commitlint/config-conventional\'],\n  rules: {\n    \'scope-enum\': [2, \'always\', [\'frontend\', \'backend\', \'shared\', \'ci\', \'docs\']],\n    \'subject-max-length\': [2, \'always\', 72],\n  }\n};\n// Valid: "feat(frontend): add dark mode toggle"\n// Invalid: "fixed stuff"\n```\n\n**Performance design principles** to prevent hook fatigue:\n1. **Run only on staged files** — lint 3 changed files, not 500\n2. **Parallelize** — ESLint, Prettier, and type-check run concurrently\n3. **Skip during merge/rebase** — automated operations should not be gated\n4. **Measure hook time** — add `time` prefix to hook commands during tuning; target <15 seconds for pre-commit\n5. **Cache** — ESLint supports `--cache` flag; add `.eslintcache` to `.gitignore`\n\n```bash\n# ESLint with cache:\nnpx eslint --cache --fix {staged_files}\n# First run: 8 seconds. Subsequent runs on unchanged files: 0.3 seconds\n```\n\nFor the pre-push hook, run only unit tests (not integration/e2e):\n```bash\nnpm run test:unit -- --passWithNoTests --bail\n# --bail stops at first failure for fast feedback\n# Integration tests run in CI, not locally\n```',
      trade_offs: [
        {
          approach: 'Lefthook',
          pros: [
            'Parallel job execution — running ESLint, Prettier, and TypeScript concurrently reduces hook time by 60%',
            'Language-agnostic binary — works in Python, Go, and Ruby projects without Node.js dependency',
            'Built-in staged-file filtering and auto-staging of fixed files simplifies lint-staged replacement',
          ],
          cons: [
            'Less ecosystem adoption than Husky — fewer blog posts, Stack Overflow answers, and team familiarity',
            'Requires binary installation in CI if hooks are verified there',
            'YAML configuration is less flexible than Husky\'s shell scripts for complex conditional logic',
          ],
        },
        {
          approach: 'Husky with lint-staged',
          pros: [
            'De facto standard in the Node.js ecosystem — most developers are already familiar with it',
            'Large ecosystem: lint-staged handles staged-file filtering with mature configuration options',
            'Deep integration with npm/pnpm lifecycle scripts — automatic installation via prepare script',
          ],
          cons: [
            'Runs lint-staged tasks sequentially by default — slower than Lefthook\'s parallel execution',
            'Requires both Husky and lint-staged packages — more dependencies to maintain',
            'Hooks are bash scripts in .husky/ — harder to maintain than declarative YAML',
          ],
        },
        {
          approach: 'Native git hooks with a shell script',
          pros: [
            'Zero dependencies — portable across all environments without npm or additional binaries',
            'Full shell scripting power — complex conditional logic, environment detection, custom error messages',
            'No version conflicts or package manager issues — hooks just work anywhere git is installed',
          ],
          cons: [
            'Manual distribution required — developers must copy scripts to .git/hooks/ themselves',
            'No built-in staged-file filtering — must implement manually with git diff --staged --name-only',
            'Harder to maintain consistency across 30 developers — .git/ is not version-controlled',
          ],
        },
      ],
      real_world_example:
        'A frontend team of 25 at an e-commerce company used Husky with a pre-commit hook that ran the full TypeScript type-check (`tsc --noEmit`) on every commit. Type-checking the entire 200k-line codebase took 45 seconds. Developer satisfaction dropped — 60% of the team admitted to using `--no-verify` regularly. After migrating to Lefthook with: (1) ESLint with `--cache` running only on staged files, (2) Prettier on staged files, (3) TypeScript check running only on files in the changed package (using `--project tsconfig.json` per workspace), total hook time dropped from 45 seconds to 6 seconds. The `--no-verify` usage dropped to near zero within two weeks. Pre-push hooks run only unit tests (12 seconds) — integration tests run in CI on every PR.',
      red_flags: [
        'Running the full TypeScript compiler or full test suite in the pre-commit hook — anything over 20 seconds will be bypassed with --no-verify',
        'Not knowing that git hooks in .git/ are not version-controlled — assuming other developers automatically get hook updates when you edit your local hooks',
        'Treating --no-verify as a problem to be solved by stricter CI rather than a signal that the hooks are too slow or too strict',
        'Not using lint-staged or equivalent to scope linting to staged files — running eslint on the entire codebase on every commit is the #1 cause of slow hooks',
        'Using hooks as a replacement for CI checks — hooks can be bypassed and are not run in all git clients; CI is the authoritative gate',
      ],
      follow_up_questions: [
        'How would you handle a developer working offline or on a slow machine where the pre-push test suite takes 3 minutes — should the hook be optional or mandatory?',
        'How do you enforce that all 30 developers have the hooks installed without relying on each individual to run the setup command after cloning?',
        'What is the difference between commit-msg and prepare-commit-msg hooks, and when would you use each for a team adopting conventional commits?',
        'If a pre-commit hook auto-fixes files with prettier --write and stages the changes, what unexpected behavior can occur with partial staging (git add -p) and how do you mitigate it?',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Your repository contains 15 GB of binary assets, ML model weights, and generated files committed directly to git. Explain how Git LFS works, how to migrate existing history, and how to integrate it with CI/CD pipelines.',
    answer: buildAnswer({
      short_answer:
        'Git LFS (Large File Storage) replaces large file content with a text pointer in the git object database — the actual bytes live on an LFS server. Clone and fetch only download LFS objects when checked out, keeping the git history small. Migrating existing history uses `git lfs migrate import --everything` which rewrites all commits to use pointers for matched files. CI/CD requires the `lfs` credential helper and `git lfs pull` after checkout — most hosted CI runners support this natively but need explicit LFS enablement.',
      detailed_answer:
        'A 15 GB repo is painful in three ways: (1) clone takes 20+ minutes, (2) `git status` and checkout are slow, (3) every contributor downloads all 15 GB even if they only work on source code. LFS solves all three.\n\n**How Git LFS works**:\nWhen you add a file tracked by LFS, git stores a 134-byte pointer instead of the file content:\n```\nversion https://git-lfs.github.com/spec/v1\noid sha256:4d7a214614ab2935c943f9e0ff69d22eadbb8f32b1258daaa5e2ca24d17e2393\nsize 12345678\n```\nThe actual file is uploaded to the LFS server (GitHub, GitLab, or self-hosted). On checkout, git-lfs fetches the file using the pointer.\n\n**Initial setup**:\n```bash\nbrew install git-lfs\ngit lfs install  # installs the git smudge/clean filters globally\n\n# In the repo:\ngit lfs track "*.psd" "*.pt" "*.onnx" "models/**"\ngit lfs track "*.png" "*.jpg" "*.mp4"\n# This updates .gitattributes:\n# *.pt filter=lfs diff=lfs merge=lfs -text\ngit add .gitattributes\ngit commit -m "chore: configure git lfs tracking"\n```\n\n**Migrating existing history** (the critical and risky step):\n```bash\n# Install git-lfs-migrate (included in git-lfs 2.5+)\n# Dry run first — see what will change:\ngit lfs migrate info --everything --include="*.pt,*.psd,models/"\n\n# Migrate ALL history for matched extensions:\ngit lfs migrate import \\\n  --everything \\\n  --include="*.pt,*.onnx,*.psd,*.bin" \\\n  --include-ref=refs/heads/main\n\n# This rewrites every commit — all SHAs change\n# --everything processes all branches and tags\n\n# Verify:\ngit lfs ls-files  # shows which files are now in LFS\n\n# Clean up old objects from git history:\ngit reflog expire --expire-unreachable=now --all\ngit gc --prune=now\n\n# Force push all branches and tags:\ngit push origin --force --all\ngit push origin --force --tags\n```\n\nAfter migration, the git object database should be ~200 MB instead of 15 GB. LFS storage quota on GitHub: 1 GB free, then $5/50 GB/month.\n\n**CI/CD integration**:\n\nGitHub Actions (automatic LFS support):\n```yaml\n- uses: actions/checkout@v4\n  with:\n    lfs: true  # enables git lfs pull after checkout\n```\n\nCustom CI (Jenkins, self-hosted runners):\n```bash\ngit clone --no-checkout $REPO_URL\ngit lfs install\ngit checkout main\ngit lfs pull  # explicit pull if not automatic\n# Or pull only specific paths:\ngit lfs pull --include="models/classifier.pt"\n```\n\n**Optimization for CI** — only download needed LFS files:\n```bash\n# If CI only builds frontend (no ML models needed):\nGIT_LFS_SKIP_SMUDGE=1 git clone $REPO_URL\ngit checkout main\ngit lfs pull --include="assets/images/**"\n# Models are not downloaded — saving 12 GB and 8 minutes of CI time\n```\n\n**Self-hosted LFS server** options when GitHub LFS bandwidth costs are prohibitive:\n- Gitea (built-in LFS support)\n- MinIO with a custom LFS server proxy\n- AWS S3 + `git-lfs-s3-proxy`\n\n**Files that should NOT go in git at all** (not even LFS): build artifacts, node_modules, compiled binaries that can be regenerated. These belong in artifact registries (S3, Artifactory, GitHub Releases).',
      trade_offs: [
        {
          approach: 'Git LFS for all binary assets',
          pros: [
            'Git clone remains fast — LFS objects are downloaded on-demand, not on clone',
            'File versioning and history are preserved — you can check out any version of a model or asset',
            'Integrates transparently with normal git workflow — developers use regular git commands',
          ],
          cons: [
            'LFS bandwidth costs can be significant — GitHub charges $5/50 GB downloaded per month, CI can easily exceed 100 GB/month',
            'LFS objects are not replicated to forks by default — forkers get broken pointers without LFS access',
            'Migration rewrites all commit SHAs — same coordination challenge as filter-repo history rewrites',
          ],
        },
        {
          approach: 'External artifact storage (S3, Artifactory) with download scripts',
          pros: [
            'Storage costs are far lower than LFS bandwidth for large teams',
            'Assets can be shared across multiple repos and build systems',
            'No git history rewrite required — existing commits are untouched',
          ],
          cons: [
            'No versioning tied to git commits — must maintain a separate manifest mapping commits to artifact versions',
            'Custom download scripts add complexity to developer onboarding and CI setup',
            'Breaks the "git checkout any commit and have a working build" guarantee',
          ],
        },
        {
          approach: 'Separate repository for large assets (gitsubmodule + LFS)',
          pros: [
            'Main application repo stays small for all developers regardless of LFS configuration',
            'LFS costs are isolated to the assets repo — developers not working on assets never incur LFS bandwidth',
            'Assets repo can have independent access control and retention policies',
          ],
          cons: [
            'Submodule complexity compounds with LFS complexity — two different coordination mechanisms',
            'Atomic changes across code and assets require coordinated commits in two repos',
            'Build reproducibility requires pinning both the code commit and the assets submodule SHA',
          ],
        },
      ],
      real_world_example:
        'An ML team at a startup had a 18 GB repo: 2 GB of code and 16 GB of model weights and training data committed directly. Clone took 22 minutes. CI ran for 35 minutes just downloading the repo. After running `git lfs migrate import --everything --include="*.pt,*.pkl,*.parquet"`, the git object database shrank to 800 MB. Clone time dropped to 45 seconds. CI used `GIT_LFS_SKIP_SMUDGE=1` for frontend and API builds (which do not need models), and explicit `git lfs pull --include="models/"` only for the model-serving and training pipeline jobs. LFS bandwidth costs were $80/month on GitHub — acceptable for the team size. They later moved to self-hosted Gitea with MinIO backend when the team grew to 20 ML engineers and bandwidth hit $400/month.',
      red_flags: [
        'Not knowing that `git lfs migrate` rewrites commit SHAs — treating it as a non-destructive operation when it has the same coordination overhead as git filter-repo',
        'Committing generated files or build artifacts to LFS — LFS is for source assets that cannot be regenerated, not for build outputs',
        'Not accounting for LFS bandwidth costs in CI — a team with 50 engineers running CI 20 times/day downloading 500 MB of LFS objects each run can quickly hit $500+/month',
        'Believing that `git lfs track` retroactively converts existing files to LFS — it only affects future commits; existing committed binaries require migration',
        'Not using GIT_LFS_SKIP_SMUDGE for CI jobs that do not need the LFS objects — every CI job downloading all LFS files is a common and costly mistake',
      ],
      follow_up_questions: [
        'How would you set up a self-hosted LFS server using MinIO on-premises to eliminate GitHub LFS bandwidth charges for a team that processes 500 GB of model weights per month?',
        'After a git lfs migrate import rewrites history, how do you handle the transition period where some developers still have clones pointing to the old commit SHAs?',
        'What is the difference between git lfs fetch, git lfs pull, and git lfs checkout — and in what CI scenario would you use each explicitly?',
        'How would you enforce that no binary files above a certain size are committed to git without LFS tracking — using a pre-receive hook on the server side?',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
  {
    title:
      'Explain how branch-per-feature development causes systematic merge conflicts in shared files like package.json, database migrations, and translation files. What architectural and workflow changes minimize these conflicts for a team of 30?',
    answer: buildAnswer({
      short_answer:
        'Shared files with sequential constraints (migrations must run in order, package.json has a single dependency list, translation files have flat key namespaces) are natural conflict magnets in branch-per-feature workflows. The root cause is temporal divergence: two branches that start from the same commit both modify the same file, and git\'s line-based merge has no semantic understanding of migration order or dependency compatibility. Mitigation: short-lived branches (reduce divergence window), migration numbering strategies, lock-file conflict resolution automation, and namespace ownership in translation files.',
      detailed_answer:
        'Merge conflicts in shared files are predictable given branch longevity and team size. With 30 developers and feature branches lasting 1–2 weeks, the probability of a conflict in any shared file approaches 100%.\n\n**package.json conflicts** — the most frequent:\n```\n<<<<<<< HEAD\n  "dependencies": {\n    "axios": "1.6.2",\n    "react-query": "5.0.0"\n=======\n  "dependencies": {\n    "axios": "1.6.7",\n    "lodash": "4.17.21",\n    "react-query": "4.36.1"\n>>>>>>> feature/user-dashboard\n```\nThis happens because: Branch A updated axios and react-query. Branch B added lodash and has older versions of the others. The merged result needs: axios 1.6.7 (higher), lodash (new addition), react-query 5.0.0 (higher).\n\n**Automated package.json merge strategy** using a custom git merge driver:\n```bash\n# Install npm-merge-driver:\nnpx npm-merge-driver install --global\n# Configures .gitconfig to use jq-based semantic merge for package.json\n# Takes the higher semver for each dependency automatically\n```\n\nFor lock files (package-lock.json, pnpm-lock.yaml):\n```bash\n# .gitattributes:\npackage-lock.json merge=union\npnpm-lock.yaml merge=union\n# \"union\" strategy: accept all additions from both sides\n# Broken lock file will be re-generated by CI, so correctness > conflict-free\n```\nBetter: resolve lock file conflicts by always regenerating:\n```bash\n# On conflict in pnpm-lock.yaml:\ngit checkout HEAD -- pnpm-lock.yaml  # take our version\npnpm install  # regenerate from package.json\ngit add pnpm-lock.yaml\n```\n\n**Database migration conflicts** — the most dangerous:\nMigrations have an implicit ordering: 20240101_create_users must run before 20240102_add_users_email. With timestamp-based naming:\n```\n# Branch A (started Monday):\n20240115_143201_add_payment_table.ts\n# Branch B (started Monday, merged Wednesday):\n20240115_143455_add_payment_gateway_id.ts\n# B assumes payment_table exists — but if A is not merged first, B fails\n```\n\nStrategies:\n1. **Sequential integer migration names** with a central counter (use a GitHub issue or migration registry)\n2. **Dependency declaration** in migration metadata: `dependsOn: [\'20240115_143201\']\n3. **Branch-per-migration**: never merge a feature branch with a migration unless the migration is the only change — separate the schema change from the application code change\n4. **Expand/contract pattern**: migrations are backward-compatible additions; application code changes are separate deploys\n\n**Translation file conflicts** (i18n JSON):\n```json\n// Both branches add keys to the same flat en.json:\n// Branch A:\n{ "user.profile.bio": "Bio" }\n// Branch B:\n{ "user.profile.avatar": "Avatar" }\n// These are actually non-conflicting additions — git should auto-merge\n// But if both also touched an existing key (e.g., typo fix), conflict appears\n```\n\nMitigation: use nested objects with clear module ownership:\n```json\n{ "user": { "profile": { "bio": "Bio" } } }  // owned by user team\n{ "payment": { "form": { "submit": "Pay" } } }  // owned by payment team\n```\n\n**Structural prevention via CODEOWNERS**:\n```\n# .github/CODEOWNERS\npackage.json @platform-team  # require platform team approval for dependency changes\nsrc/database/migrations/ @backend-lead  # serialized through one reviewer\nsrc/messages/ @i18n-team\n```\nThis does not prevent conflicts but ensures a human reviews cross-cutting changes before merge.\n\n**The ultimate prevention**: short-lived branches. A branch merged in <48 hours with <200 lines of changes has a dramatically lower conflict probability than a 2-week branch with 1,500 lines.',
      trade_offs: [
        {
          approach: 'Custom git merge drivers for package.json and lock files',
          pros: [
            'Automatically resolves the majority of dependency conflicts using semantic version comparison',
            'Eliminates the most common cause of "trivial" merge conflicts that block developers',
            'Configuration is committed to .gitattributes — team-wide and automatic after setup',
          ],
          cons: [
            'Requires all developers to install the merge driver binary — setup step can be missed',
            'Semantic merge of package.json can silently choose the wrong version in edge cases (e.g., breaking changes between versions)',
            'Does not help with structural conflicts where both branches modified the same dependency for different reasons',
          ],
        },
        {
          approach: 'Expand/contract pattern for database migrations',
          pros: [
            'Backward-compatible migrations can be deployed independently of application code changes',
            'Multiple branches can have migrations that run in any order without breaking each other',
            'Forces good migration hygiene: each migration is a safe, reversible operation',
          ],
          cons: [
            'Requires two deployment cycles for any schema change — slower feature velocity',
            'Increases the total number of migrations — more files to track and more rollback complexity',
            'Requires developer discipline — teams under deadline pressure skip the pattern and create tight migration/code coupling',
          ],
        },
        {
          approach: 'Namespace-based ownership in shared files',
          pros: [
            'Team ownership of specific JSON namespaces reduces cross-team conflicts to near zero',
            'CODEOWNERS can enforce namespace ownership, requiring sign-off for out-of-namespace changes',
            'Scales linearly with team size — adding a new team adds a new namespace, not more conflicts',
          ],
          cons: [
            'Requires upfront architecture decisions about which team owns which namespace',
            'Cross-cutting changes (global config, shared auth keys) still require coordination',
            'Namespace ownership can become stale as teams reorganize — requires active maintenance',
          ],
        },
      ],
      real_world_example:
        'A 30-engineer product team at a scale-up was spending an estimated 2 hours/week per developer resolving merge conflicts in package.json, migrations, and translation files. Root cause analysis: average branch lifetime was 8 days, with 3–4 branches active per developer at any time. Three interventions reduced this to 15 minutes/week/developer: (1) npm-merge-driver for package.json — eliminated 70% of dependency conflicts automatically, (2) migration file serialization via GitHub Actions: a bot enforced sequential migration numbers by checking CI on every PR that touched the migrations directory, (3) trunk-based development pilot for the frontend team — branch lifetime dropped to 1.5 days average, making conflicts rare by default rather than by tooling. The backend team retained feature branches for complex database changes but adopted the expand/contract pattern.',
      red_flags: [
        'Treating merge conflicts in package.json as developer error rather than a predictable consequence of branch-per-feature development at scale',
        'Not knowing the expand/contract pattern for database migrations — recommending only timestamp-based migration naming without addressing ordering conflicts',
        'Suggesting "just rebase more often" as the solution — rebasing reduces conflict accumulation but does not eliminate the structural causes for shared sequential files',
        'Not knowing that .gitattributes can specify per-file merge strategies — treating git merge as a single strategy applied to all files uniformly',
        'Not connecting conflict frequency to branch lifetime — the single most effective conflict reduction strategy is shorter-lived branches, which is a process change, not a tooling change',
      ],
      follow_up_questions: [
        'How would you implement a GitHub Actions workflow that automatically detects when two open PRs both modify database migrations and alerts the developers before either is merged?',
        'In a team where regulatory compliance requires long-lived release branches (4–6 weeks), what tooling and process would you put in place to make conflict resolution manageable?',
        'How does the "strangler fig" pattern for large refactors interact with merge conflict prevention — can you refactor a shared utility used by 20 files without creating conflicts in every active branch?',
        'If you were starting a new codebase with 30 engineers, what specific decisions in the initial file structure and module organization would you make to minimize future merge conflict surface area?',
      ],
    }),
    topicSlug: 'git',
    level: QuestionLevel.SENIOR,
    difficultyScore: 0,
    displayOrder: 0,
  },
];
