#!/usr/bin/env python3
"""Regression tests for the generated teaching roster."""

import contextlib
import importlib.util
import io
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


if __name__ == "__main__":
    unittest.main()
