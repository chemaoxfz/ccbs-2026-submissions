# CCBS 2026 — submissions

Course: **EST 5053, Control and Computation in Biological Systems, Fall 2026**
(Westlake University). Course site: <https://chemaoxfz.github.io/ccbs/2026fall/>
Read [**How this course works**](https://chemaoxfz.github.io/assets/ccbs/2026fall/intro/) first.

Everything you hand in lands here, and **everything is submitted the same way: a pull
request that merges itself.** You do not need write access. For most accounts no human
approval is needed; GitHub may ask the course staff to approve the first workflow run from
a brand-new GitHub account. That is GitHub's anti-abuse safeguard, not a problem with your
submission, and the bot takes over as soon as the run is released.

---

## The four things you submit

| What | Where | When |
|---|---|---|
| **Sign up to teach; optionally volunteer again** | `signup/lectureNN-yourname.md` | required sign-up by **Thu 2026-09-03, 23:59** |
| **Extension mini-essay**, one per week | `weekN/weekN-yourname-ext.html` | Mondays 23:59, eight of them |
| **Exposition**, after you teach | `lectureNN/` (any sensible filename) | the week you teach |
| **Research essay** | `research-essay/yourname.html` | **Thu 2026-11-05, 23:59** |

`yourname` means your Latin name in lowercase with no spaces: `tongli`, `haotiandong`,
`alvarobatrez`. Use the same one all term so your files sort together.

## How to submit anything

1. Press **Fork** at the top right of this page. You now have your own copy.
2. Add your file in your fork, on the web or with `git`. Use the right folder and the right
   filename; the rules are in the table above and in each folder's README.
3. Open a **pull request** back to `main` here. Title it with your name and what it is.
4. A bot checks the file name, size, sign-up details and ownership, then **merges within a
   minute or two**. It comments on your pull request either way, so you always know where
   you stand. If GitHub says the workflow is waiting for approval because your account is
   new, tell a TA; you do not need to open another pull request.

That is the whole workflow. It is also, deliberately, the first assignment: the sign-up
pull request proves you can submit, well before anything is graded on it.

### What the bot checks

- One pull request contains one submission type. Sign-ups, extensions and research essays
  are one file each; an exposition may contain up to 12 files for one lecture.
- Every file follows the path and naming rule, is non-empty, is a regular file, and is at
  most 5 MB. The week number in an extension's folder and filename must match.
- A sign-up has all required front matter, names the same lecture as its filename, and has
  a `github` field matching the account that opened the pull request. A student may sign
  up for more than one lecture, but must reuse the same GitHub account, student ID, email
  and submission name, may occupy only one place in any lecture, and cannot take a lecture
  past three students.
- Later work must come from the GitHub account in a merged sign-up. Extensions and research
  essays must reuse that sign-up's `yourname`; expositions must go to one of that student's
  registered lecture folders. This also prevents one student from replacing another
  student's work.
- Course files (`README.md`, `.github/`, `tools/`, templates and the generated roster),
  deletions, renames and mixed submissions are refused.

The bot explains every problem in one comment. Push a fix to the same branch and it re-runs
by itself. If a clean branch cannot merge because `main` moved, update the branch from
`main` and push again.

If you are fighting the bot for more than ten minutes, stop and ask a TA. Email to
Wenqin Zhou (zhouwenqin@westlake.edu.cn) and Xinyu Wang (wangxinyu@westlake.edu.cn),
with the same filename attached, is always an accepted fallback.

---

## 1. Signing up to teach

There are 14 scheduled student-taught lectures, lectures 3 to 16. **Every student must
teach at least one lecture.** A lecture may be taught by **1, 2 or 3 students**, first
come, first served. If no student claims a lecture, Fangzhou Xiao teaches it.

After your required sign-up has merged, you may volunteer for another lecture that still
has room. **Completing each additional lecture earns extra credit.** Use a separate sign-up
file and pull request for each lecture, but keep the same `yourname`, student ID, email and
GitHub account in every one.

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

**One file per student per lecture**, even when you sign up as a team. That way nobody's
pull request conflicts with anybody else's, and everything merges cleanly.

Check [**`signup/ROSTER.md`**](signup/ROSTER.md) for which lectures still have room. It is
rebuilt automatically every time a sign-up merges, so it is always current. After the
deadline the lecturer assigns a first lecture to anyone who has not signed up. Lectures
still empty after that are taught by the lecturer and remain open to student volunteers.

Lectures 3 and 4 are on 09-08 and 09-10, so those two teams should sign up first and start
immediately.

## 2. Extension mini-essays

One per teaching week, eight in total, including the weeks you teach and including week 1.
**Your best 6 of 8 count** at 5 points each, so you have two free skips.

One thing from the week, taken past where the lecture left it. Either bring something in
from outside (one example, scenario, opinion, perspective or argument) or push on what was
taught (go deeper into a step the lecture compressed, examine an assumption, go one level
more advanced, attack the same problem another way, take up the complementary idea). The
`research-essay` skill pointed at the week's topic will surface most of these.

Five requirements: **short** (a few paragraphs, long enough to make one point properly);
**clearly told**, one chain of logic from start to finish, almost tutorial-like, so anyone
in the class can read it quickly and understand it; **well illustrated** wherever a diagram,
picture or graph is possible at all; **one thing you made yourself** (a number you computed,
a figure you plotted) with the code beside it; and every claim **traceable**. Not a recap.

Start from [`TEMPLATE_ext.html`](TEMPLATE_ext.html); keep it one self-contained HTML file
with no external assets. The worked example, written by the lecturer, is at
<https://chemaoxfz.github.io/assets/ccbs/2026fall/extension-example/>.

| Week | Lectures | Due |
|---|---|---|
| 1 | 1, 2 | Mon 2026-09-07 |
| 2 | 3, 4 | Mon 2026-09-14 |
| 3 | 5, 6 | Mon 2026-09-21 |
| 4 | 7, 8 | Mon 2026-09-28 |
| 5 | 9, 10 | Mon 2026-10-12 |
| 6 | 11, 12 | Mon 2026-10-19 |
| 7 | 13, 14 | Mon 2026-10-26 |
| 8 | 15, 16 | Mon 2026-11-02 |

Conflicting positions are welcome. Two of you may argue opposite sides of the same question
in the same week.

## 3. Exposition

After you teach, put whatever you taught from into `lectureNN/`: an HTML page, a notebook,
a slide deck exported to PDF, or all three. This becomes the lecture's *exposition* artifact
on the course site, with your names on it.

## 4. Research essay

One standalone tutorial-like HTML page on a topic you care about, with the full PCAPS chain.
See [`research-essay/README.md`](research-essay/README.md) for the grading criteria. Due
Thursday 2026-11-05, 23:59.

---

## For the TAs

- **Roster.** `signup/ROSTER.md` rebuilds itself on every merge: the second job of
  `.github/workflows/automerge.yml` runs `tools/build_roster.py` and pushes the result.
  (It lives there rather than in `roster.yml` because a merge made with `GITHUB_TOKEN`
  does not trigger a `push` workflow.) `roster.yml` still covers direct pushes and manual
  reruns. Run `python3 tools/build_roster.py` locally to preview.
- **Weekly extension page.** Run `python3 tools/assemble_extension.py weekN`. It emits
  `weekN/extension_skeleton.html` with every mini-essay placed in order. Hand the skeleton
  to an agent with the instruction to weave the essays into one coherent themed writeup,
  keeping the authors' names. Review the result
  yourself, then publish it to the main site repo at
  `assets/ccbs/2026fall/lectureNN/extension/index.html` and link it from
  `_pages/ccbs-2026.md`.
- **Exposition.** Copy the team's files to
  `assets/ccbs/2026fall/lectureNN/exposition/` on the main site and link them.
- **The merge bot.** `.github/workflows/automerge.yml`. It runs on `pull_request_target`
  and checks out only the trusted base-branch validator in
  `tools/validate_submission.cjs`. It reads pull-request files as data through the API and
  never checks out or executes them. Do not add a checkout of the pull request head to it.
  Run `node --test tools/test_validate_submission.cjs` after changing the guardrails.
- **Brand-new GitHub accounts.** GitHub may hold their first workflow run for approval.
  Release it from the pull request's workflow banner; after that, the normal bot comment
  and merge happen automatically.
