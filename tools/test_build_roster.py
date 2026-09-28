#!/usr/bin/env python3
"""Regression tests for the generated teaching roster."""

import contextlib
from datetime import date, timedelta
import importlib.util
import io
import re
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("build_roster.py")
SPEC = importlib.util.spec_from_file_location("build_roster", MODULE_PATH)
ROSTER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(ROSTER)


def signup(lecture, slug, github, student_id, email, name):
    return "\n".join(
        [
            "---",
            f"name: {name}",
            f"student_id: {student_id}",
            f"email: {email}",
            f"github: {github}",
            f"lecture: {lecture}",
            "teammates:",
            "---",
            "",
        ]
    ), f"lecture{lecture:02d}-{slug}.md"


class BuildRosterTests(unittest.TestCase):
    def test_singletons_repeats_and_empty_lectures_are_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            signup_dir = Path(directory)
            records = [
                signup(3, "tongli", "tongli-gh", "20261201094", "tong@westlake.edu.cn", "Tong Li"),
                signup(4, "tongli", "tongli-gh", "20261201094", "tong@westlake.edu.cn", "Tong Li"),
                signup(4, "other", "other-gh", "20261201095", "other@westlake.edu.cn", "Other Student"),
            ]
            for text, filename in records:
                (signup_dir / filename).write_text(text, encoding="utf-8")

            original = ROSTER.SIGNUP
            ROSTER.SIGNUP = signup_dir
            try:
                with contextlib.redirect_stdout(io.StringIO()):
                    self.assertEqual(ROSTER.main(), 0)
            finally:
                ROSTER.SIGNUP = original

            rendered = (signup_dir / "ROSTER.md").read_text(encoding="utf-8")
            self.assertIn(
                "**2 students have signed up for 3 teaching assignments.**",
                rendered,
            )
            self.assertIn("A lecture may have 1 to 3 students", rendered)
            self.assertIn("| 3 | 2026-09-08", rendered)
            self.assertIn("Tong Li (@tongli-gh) | 2 open |", rendered)
            self.assertIn("lecturer covers if unclaimed", rendered)
            self.assertIn("## Volunteer extra-credit assignments", rendered)
            self.assertIn(
                "Tong Li (@tongli-gh): lectures 3, 4; 1 additional assignment registered for extra credit.",
                rendered,
            )


class CalendarTests(unittest.TestCase):
    def test_approved_lecture_dates(self):
        expected = [
            "2026-09-08", "2026-09-10", "2026-09-15", "2026-09-17",
            "2026-09-22", "2026-09-24", "2026-10-08", "2026-10-13",
            "2026-10-15", "2026-10-20", "2026-10-22", "2026-10-27",
            "2026-10-29", "2026-11-03",
        ]
        self.assertEqual(
            {n: day for n, (day, _) in ROSTER.LECTURES.items()},
            dict(enumerate(expected, start=3)),
        )
        self.assertEqual(len(set(expected)), 14)
        for day in expected:
            self.assertIn(date.fromisoformat(day).weekday(), (1, 3))

    def test_lecture_readmes_and_generated_roster_agree(self):
        rendered = (ROSTER.ROOT / "signup/ROSTER.md").read_text(encoding="utf-8")
        for n, (day, _) in ROSTER.LECTURES.items():
            readme = ROSTER.ROOT / f"lecture{n:02d}/README.md"
            heading = readme.read_text(encoding="utf-8").splitlines()[0]
            self.assertIn(day, heading)
            self.assertIn(f"| {n} | {day} |", rendered)

    def test_original_eight_pairs_and_revised_deadlines(self):
        expected = [
            "2026-09-07", "2026-09-14", "2026-09-21", "2026-09-28",
            "2026-10-19", "2026-10-26", "2026-11-02", "2026-11-09",
        ]
        root_readme = (ROSTER.ROOT / "README.md").read_text(encoding="utf-8")
        rows = re.findall(
            r"\| ([1-8]) \| (\d+), (\d+) \| Mon (\d{4}-\d{2}-\d{2}) \|",
            root_readme,
        )
        self.assertEqual(len(rows), 8)
        for n, (row, day) in enumerate(zip(rows, expected), start=1):
            self.assertEqual(row, (str(n), str(2*n-1), str(2*n), day))
            readme = (ROSTER.ROOT / f"week{n}/README.md").read_text(encoding="utf-8")
            self.assertIn(f"Covers **lectures {2*n-1} and {2*n}**.", readme)
            self.assertIn(f"Due **{day}, 23:59**.", readme)
            self.assertIn("Your best 6 of 8 count, 5 points each.", readme)
            self.assertEqual(date.fromisoformat(day).weekday(), 0)
            last_lecture = "2026-09-03" if n == 1 else ROSTER.LECTURES[2*n][0]
            self.assertGreater(date.fromisoformat(day), date.fromisoformat(last_lecture))
        self.assertIn("**Your best 6 of 8 count** at 5 points each", root_readme)

    def test_research_deadline_is_one_week_after_final_lecture(self):
        deadline = date.fromisoformat(ROSTER.LECTURES[16][0]) + timedelta(days=7)
        self.assertEqual(deadline, date(2026, 11, 10))
        readme = (ROSTER.ROOT / "research-essay/README.md").read_text(encoding="utf-8")
        root_readme = (ROSTER.ROOT / "README.md").read_text(encoding="utf-8")
        self.assertIn("Tuesday 2026-11-10, 23:59", readme)
        self.assertIn("**Tue 2026-11-10, 23:59**", root_readme)
        self.assertIn("Tuesday 2026-11-10, 23:59", root_readme)


if __name__ == "__main__":
    unittest.main()
