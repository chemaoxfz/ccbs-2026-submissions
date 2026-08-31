# CCBS 2026 — submissions

Course: **CST 5034, Control and Computation in Biological Systems, Fall 2026**
(Westlake University). Course site: <https://chemaoxfz.github.io/ccbs/2026fall/>
Read [**How this course works**](https://chemaoxfz.github.io/assets/ccbs/2026fall/intro/) first.

Everything you hand in lands here, and **everything is submitted the same way: a pull
request that merges itself.** You do not need write access and nobody has to approve you.

---

## The four things you submit

| What | Where | When |
|---|---|---|
| **Sign up to teach a lecture** | `signup/lectureNN-yourname.md` | by **Thu 2026-09-03, 23:59** |
| **Extension mini-essay**, one per week | `weekN/weekN-yourname-ext.html` | Sundays 23:59, eight of them |
| **Exposition**, after you teach | `lectureNN/` (any sensible filename) | the week you teach |
| **Research essay** | `research-essay/yourname.html` | **Thu 2026-11-05, 23:59** |

`yourname` means your Latin name in lowercase with no spaces: `tongli`, `haotiandong`,
`alvarobatrez`. Use the same one all term so your files sort together.

## How to submit anything

1. Press **Fork** at the top right of this page. You now have your own copy.
2. Add your file in your fork, on the web or with `git`. Use the right folder and the right
   filename; the rules are in the table above and in each folder's README.
3. Open a **pull request** back to `main` here. Title it with your name and what it is.
4. A bot checks the file paths and **merges within a minute or two**. It comments on your
   pull request either way, so you always know where you stand.

That is the whole workflow. It is also, deliberately, the first assignment: the sign-up
pull request proves you can submit, well before anything is graded on it.

### What the bot checks

It merges when every changed file matches one of the submission paths above, nothing
outside them is touched, there are at most 12 files, and none is over 5 MB. It refuses,
with an explanation, if a filename does not match, if you edit course files
(`README.md`, `tools/`, `TEMPLATE*`, `signup/ROSTER.md`, `.github/`), or if the branch
conflicts with `main`. Push a fix to the same branch and it re-runs by itself.

If you are fighting the bot for more than ten minutes, stop and ask a TA. Email to
Wenqin Zhou (zhouwenqin@westlake.edu.cn) and Xinyu Wang (wangxinyu@westlake.edu.cn),
with the same filename attached, is always an accepted fallback.

---

## 1. Signing up to teach

There are 14 student-taught lectures, lectures 3 to 16, and 35 of you. Each lecture is
owned by a team of **2 or 3 students**, so seven teams of three and seven of two uses
everyone exactly once. First come, first served.

Copy [`signup/TEMPLATE.md`](signup/TEMPLATE.md) to `signup/lectureNN-yourname.md` and fill
in the front matter:

```markdown
---
name: Tong Li
name_zh: 李彤
student_id: 20261201094
email: litong@westlake.edu.cn
github: tongli
lecture: 9
teammates: Name A, Name B
---
One or two sentences on why you picked this lecture. Optional.
```

**One file per student**, even when you sign up as a team. That way nobody's pull request
conflicts with anybody else's, and everything merges cleanly.

Check [**`signup/ROSTER.md`**](signup/ROSTER.md) for which lectures still have room. It is
rebuilt automatically every time a sign-up merges, so it is always current. After the
deadline the lecturer assigns anyone who has not signed up, filling the thin lectures first.

Lectures 3 and 4 are on 09-08 and 09-10, so those two teams should sign up first and start
immediately.

## 2. Extension mini-essays

One per teaching week, eight in total, including the weeks you teach and including week 1.
**Your best 6 of 8 count**, so you have two free skips.

One example, one scenario, one opinion, one perspective or one argument, taken past where
the lecture left it. A few paragraphs, roughly 400 to 800 words. It must contain one thing
you made yourself (a number you computed, a figure you plotted) with the code beside it,
and every claim must be traceable to something a reader can check. It must not be a recap.

Start from [`TEMPLATE_ext.html`](TEMPLATE_ext.html); keep it one self-contained HTML file
with no external assets. The worked example, written by the lecturer, is at
<https://chemaoxfz.github.io/assets/ccbs/2026fall/extension-example/>.

| Week | Lectures | Due |
|---|---|---|
| 1 | 1, 2 | Sun 2026-09-06 |
| 2 | 3, 4 | Sun 2026-09-13 |
| 3 | 5, 6 | Sun 2026-09-20 |
| 4 | 7, 8 | Sun 2026-09-27 |
| 5 | 9, 10 | Sun 2026-10-11 |
| 6 | 11, 12 | Sun 2026-10-18 |
| 7 | 13, 14 | Sun 2026-10-25 |
| 8 | 15, 16 | Sun 2026-11-01 |

Conflicting positions are welcome. Two of you may argue opposite sides of the same question
in the same week; the assembled page keeps the disagreement visible.

## 3. Exposition

After you teach, put whatever you taught from into `lectureNN/`: an HTML page, a notebook,
a slide deck exported to PDF, or all three. Add a short `what-we-added.md` saying what you
put on top of the core page and where it came from. This becomes the lecture's *exposition*
artifact on the course site, with your names on it.

## 4. Research essay

One standalone tutorial-like HTML page on a topic you care about, with the full PCAPS chain.
See [`research-essay/README.md`](research-essay/README.md) for the grading criteria. Due
Thursday 2026-11-05, 23:59.

---

## For the TAs

- **Roster.** `signup/ROSTER.md` rebuilds itself on every merge
  (`.github/workflows/roster.yml` runs `tools/build_roster.py`). Run
  `python3 tools/build_roster.py` locally to preview.
- **Weekly extension page.** Run `python3 tools/assemble_extension.py weekN`. It emits
  `weekN/extension_skeleton.html` with every mini-essay placed in order. Hand the skeleton
  to an agent with the instruction to weave the essays into one coherent themed writeup,
  keeping authors and keeping conflicts visibly in conversation. Review the result
  yourself, then publish it to the main site repo at
  `assets/ccbs/2026fall/lectureNN/extension/index.html` and link it from
  `_pages/ccbs-2026.md`.
- **Exposition.** Copy the team's files to
  `assets/ccbs/2026fall/lectureNN/exposition/` on the main site and link them.
- **The merge bot.** `.github/workflows/automerge.yml`. It runs on `pull_request_target`
  and never checks out or executes pull-request contents; it only reads the file list
  through the API and merges. Do not add a checkout of the pull request head to it.
