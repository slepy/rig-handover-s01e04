---
name: preview-upload
description: Put an HTML copy of a rig page on this repo's public GitHub Pages link, with or without the lane marker, and check it from outside. Use for a plan's preview step and its clean-up (ADR 0003).
---

# preview-upload

The preview is built and deployed by `.github/workflows/preview.yml` on a GitHub runner. It is
never committed, so the same link can later be overwritten without the marker (ADR 0003).
Needs `gh`, authenticated, with Pages set to build from GitHub Actions.

## Steps

1. Ask the human first: what goes up (page, night, marker or none), where (the link), who can
   see it (anyone), how to undo it (run again without the marker, or disable Pages).
2. Once per repo, set Pages to deploy from Actions:

   ```sh
   gh api -X POST repos/{owner}/{repo}/pages -f build_type=workflow
   ```

3. Run the workflow and wait for it:

   ```sh
   gh workflow run preview.yml -f night=2026-10-28 -f lane_marker="$LANE_MARKER"   # review
   gh workflow run preview.yml -f night=2026-10-28 -f lane_marker=                  # clean-up
   gh run watch "$(gh run list -w preview.yml -L 1 --json databaseId -q '.[0].databaseId')"
   ```

4. Check the link the way the reviewer opens it, from outside the lane:

   ```sh
   curl -s -o /tmp/p.html -w '%{http_code}\n' https://<owner>.github.io/<repo>/
   grep -c "$LANE_MARKER" /tmp/p.html; grep -c 'no marker set' /tmp/p.html; grep -c '<tr' /tmp/p.html
   ```

   Pages can serve the old copy for a minute; check again before you call it.

5. After the clean-up, delete the run that carried the marker: its inputs show the marker in the
   run's metadata (`gh run delete <id>`).

## Don'ts

- Don't commit the HTML, push it to a `gh-pages` branch or attach it to an issue: ADR 0003.
- Don't take the marker off before the review is in; that waits on its own issue.
