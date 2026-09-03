# Tools

`assemble_extension.py` — builds the skeleton of the week's extension-by-audience page
from the week folder's `*_ext.html` submissions (stdlib only).

```sh
python3 tools/assemble_extension.py week5
# -> week5/extension_skeleton.html
```

Then: hand the skeleton to an AI agent → "weave these into ONE coherent themed
long-form writeup; keep authors; keep conflicts visibly in conversation" → review →
publish to the main course site under `assets/ccbs/2026fall/lectureNN/extension/` and link
from `_pages/ccbs-2026.md` in `chemaoxfz/chemaoxfz.github.io`.

`tools/build_roster.py` is the other script here: it regenerates `signup/ROSTER.md`
from the `signup/lectureNN-*.md` sign-up files. It runs automatically as the second job
of `.github/workflows/automerge.yml`, so you rarely need to invoke it by hand.

`tools/validate_submission.cjs` is the trusted merge gate used by
`.github/workflows/automerge.yml`. It checks paths, real file sizes, sign-up front matter,
lecture capacity, identity consistency across repeat sign-ups and ownership without
executing pull-request content. It permits one student to register for multiple different
lectures, while preventing duplicate places in one lecture and identity claims by another
account.
After changing it, run:

```sh
node --test tools/test_validate_submission.cjs
python3 -m unittest tools/test_build_roster.py
```
