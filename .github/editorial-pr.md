The scheduled editorial workflow no longer creates a pull request. It runs the source monitor and automatic pipeline on `main`, verifies the production build, and commits only the validated article and editorial-state files.

The pipeline still checks official-source freshness, registered evidence, fact expiry, topic intent, duplicate content, safe Markdown output and the complete site build. A failed check leaves the candidate in the queue and prevents the commit. This file remains for historical compatibility with older tooling that may look for the former PR body.
