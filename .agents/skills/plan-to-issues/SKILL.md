---
name: plan-to-issues
description: Split this repo's plan.md into GitHub issues with gh, one per unit of work, after a human has reviewed the split. Use when a plan is ready and has no issues yet.
---

# plan-to-issues

Turns `plan.md` into GitHub issues that workers can pick up cold. Easiest with `gh`, authenticated,
in a shell this agent can run.

## Steps

1. Read `plan.md`, `AGENTS.md` and `docs/adr/`.
2. Draft the split as a table: title · plan section · scope · done when · blocked by.
   One issue per unit of work.
3. **Stop and show the table to the human.** Publish nothing until they approve it.
4. Ask the human what every issue here must carry (fields, labels, wording), unless it is
   already written down in this session or in the repo.
5. Create each issue in dependency order, so blocked-by can cite real numbers:

   ```sh
   gh issue create --title "<title>" --body-file <tmp.md>
   ```

6. Record every issue URL from gh's output (not from memory) and reply with the list.

Closing one, with the closing comment from AGENTS.md:

```sh
gh issue close <n> -c "<closing comment>"
```

## Issue shape here

Agreed with the human for this repo, so step 4 is already answered:

```md
Source: plan.md § <n>

## Scope
<what this issue covers, from the plan section>

## Done when
<the plan's "Done when", verbatim where it has one>

## Blocked by
<#n, #m or "—">
```

Label every issue `plan:<plan name from front matter>` (create it once with `gh label create`).

A step that waits on someone outside the lane (a reviewer, a deploy, a reply) gets its own issue.
It stays open until they confirm and blocks every step after it: sent is not reviewed.

Commits keep the styleguide's `closes #<n>`, but only on the commit that makes "Done when" hold;
earlier ones say `refs #<n>`. Post the closing comment before you push that commit to the default
branch: the push auto-closes the issue, and the comment must already be there.

## No `gh`

Steps 1–4 hold either way. GitHub reachable another way (a connector, the REST API, the web UI):
the same issues, made that way. GitHub issues out of reach altogether: write them as files in
`docs/issues/`, format in ADR 0004, then commit and push.

## Don'ts

- Don't paste the whole plan into one issue, and don't keep issues only in chat.
- Don't invent sections the plan doesn't have. If the plan is unclear, ask.
