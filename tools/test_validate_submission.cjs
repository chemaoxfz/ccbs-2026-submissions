"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");

const guard = require("./validate_submission.cjs");

function changed(filename, status = "added") {
  return { filename, status };
}

function signupText(overrides = {}) {
  const values = {
    name: "Tong Li",
    name_zh: "李彤",
    student_id: "20261201094",
    email: "litong@westlake.edu.cn",
    github: "tongli-gh",
    lecture: "9",
    teammates: "Name A, Name B",
    ...overrides,
  };
  return [
    "---",
    `name: ${values.name}`,
    `name_zh: ${values.name_zh}`,
    `student_id: ${values.student_id}`,
    `email: ${values.email}`,
    `github: ${values.github}`,
    `lecture: ${values.lecture}`,
    `teammates: ${values.teammates}`,
    "---",
    "I picked this lecture because the topic interests me.",
    "",
  ].join("\n");
}

function baseSignup({
  path = "signup/lecture09-tongli.md",
  github = "tongli-gh",
  studentId = "20261201094",
  email = "litong@westlake.edu.cn",
} = {}) {
  const descriptor = guard.classifyPath(path);
  return {
    path,
    descriptor,
    record: {
      path,
      slug: descriptor.slug,
      lecture: descriptor.lecture,
      name: "Tong Li",
      studentId,
      email,
      github,
    },
    parseProblems: [],
  };
}

test("documented paths classify correctly", () => {
  assert.deepEqual(
    guard.validateFileList([changed("signup/lecture09-tongli.md")]).problems,
    []
  );
  assert.deepEqual(
    guard.validateFileList([changed("week3/week3-tongli-ext.html")]).problems,
    []
  );
  assert.deepEqual(
    guard.validateFileList([
      changed("lecture09/slides.pdf"),
      changed("lecture09/demo.py"),
    ]).problems,
    []
  );
  assert.deepEqual(
    guard.validateFileList([changed("research-essay/tongli.html")]).problems,
    []
  );
});

test("week folder and filename numbers must match", () => {
  const result = guard.validateFileList([
    changed("week1/week8-tongli-ext.html"),
  ]);
  assert.match(result.problems.join("\n"), /two week numbers must match/);
});

test("course files and renames are rejected", () => {
  const result = guard.validateFileList([
    changed("lecture09/README.md", "modified"),
    changed("research-essay/tongli.html", "renamed"),
  ]);
  assert.match(result.problems.join("\n"), /course file/);
  assert.match(result.problems.join("\n"), /Renames and copies are not accepted/);
});

test("one pull request cannot mix submission types or lectures", () => {
  let result = guard.validateFileList([
    changed("week3/week3-tongli-ext.html"),
    changed("research-essay/tongli.html"),
  ]);
  assert.match(result.problems.join("\n"), /mixes submission types/);

  result = guard.validateFileList([
    changed("lecture09/slides.pdf"),
    changed("lecture10/slides.pdf"),
  ]);
  assert.match(result.problems.join("\n"), /only contain files for one lecture/);
});

test("single-file submission categories really contain one file", () => {
  const result = guard.validateFileList([
    changed("week3/week3-tongli-ext.html"),
    changed("week3/week3-tongli-notes-ext.html"),
  ]);
  assert.match(result.problems.join("\n"), /exactly one file/);
});

test("a complete sign-up parses and matches its path", () => {
  const descriptor = guard.classifyPath("signup/lecture09-tongli.md");
  const parsed = guard.signupRecordFromText(signupText(), descriptor);
  assert.deepEqual(parsed.problems, []);
  assert.equal(parsed.record.github, "tongli-gh");
  assert.equal(parsed.record.lecture, 9);
  assert.equal(parsed.record.slug, "tongli");
});

test("malformed, unfilled, and path-mismatched sign-ups are rejected", () => {
  const descriptor = guard.classifyPath("signup/lecture09-tongli.md");
  assert.match(
    guard.signupRecordFromText("not front matter", descriptor).problems.join("\n"),
    /no `---` front matter/
  );

  const placeholder = guard.signupRecordFromText(
    signupText({
      name: "Your Name",
      student_id: "20261234567",
      email: "yourname@westlake.edu.cn",
      github: "your-github-handle",
    }),
    descriptor
  );
  assert.match(placeholder.problems.join("\n"), /Replace the template value/);

  const mismatch = guard.signupRecordFromText(
    signupText({ lecture: "10" }),
    descriptor
  );
  assert.match(mismatch.problems.join("\n"), /front matter says lecture 10/);

  const markup = guard.signupRecordFromText(
    signupText({ name: "Name | injected table cell" }),
    descriptor
  );
  assert.match(markup.problems.join("\n"), /table or HTML markup/);
});

test("sign-up must belong to the pull-request author", () => {
  const descriptor = guard.classifyPath("signup/lecture09-tongli.md");
  const record = guard.signupRecordFromText(signupText(), descriptor).record;
  const problems = guard.validateSignupAgainstRegistry({
    descriptor,
    record,
    author: "someone-else",
    status: "added",
    baseSignups: [],
  });
  assert.match(problems.join("\n"), /account that opened this pull request/);
});

test("a student may volunteer for a different lecture with the same identity", () => {
  const descriptor = guard.classifyPath("signup/lecture10-tongli.md");
  const record = guard.signupRecordFromText(
    signupText({ lecture: "10" }),
    descriptor
  ).record;
  const problems = guard.validateSignupAgainstRegistry({
    descriptor,
    record,
    author: "tongli-gh",
    status: "added",
    baseSignups: [baseSignup()],
  });
  assert.deepEqual(problems, []);
});

test("an additional sign-up must reuse the student's stable identity", () => {
  const descriptor = guard.classifyPath("signup/lecture10-tongli-new.md");
  const record = guard.signupRecordFromText(
    signupText({
      lecture: "10",
      student_id: "20261201999",
      email: "different@westlake.edu.cn",
    }),
    descriptor
  ).record;
  const problems = guard.validateSignupAgainstRegistry({
    descriptor,
    record,
    author: "tongli-gh",
    status: "added",
    baseSignups: [baseSignup()],
  });
  const joined = problems.join("\n");
  assert.match(joined, /same submission name/);
  assert.match(joined, /same student ID/);
  assert.match(joined, /same email/);
});

test("one student cannot occupy two places in the same lecture", () => {
  const descriptor = guard.classifyPath("signup/lecture09-tongli-second.md");
  const record = guard.signupRecordFromText(
    signupText({ lecture: "9" }),
    descriptor
  ).record;
  const problems = guard.validateSignupAgainstRegistry({
    descriptor,
    record,
    author: "tongli-gh",
    status: "added",
    baseSignups: [baseSignup()],
  });
  assert.match(problems.join("\n"), /only one place in a lecture/);
});

test("another account cannot claim a registered identity or submission name", () => {
  const descriptor = guard.classifyPath("signup/lecture10-tongli.md");
  const record = guard.signupRecordFromText(
    signupText({ github: "impostor-gh", lecture: "10" }),
    descriptor
  ).record;
  const problems = guard.validateSignupAgainstRegistry({
    descriptor,
    record,
    author: "impostor-gh",
    status: "added",
    baseSignups: [baseSignup()],
  });
  const joined = problems.join("\n");
  assert.match(joined, /submission name is already registered to another account/);
  assert.match(joined, /student ID is already registered to another account/);
  assert.match(joined, /email is already registered to another account/);
});

test("lecture capacity is enforced", () => {
  const descriptor = guard.classifyPath("signup/lecture09-newstudent.md");
  const record = guard.signupRecordFromText(
    signupText({
      name: "New Student",
      student_id: "20261201999",
      email: "newstudent@westlake.edu.cn",
      github: "newstudent-gh",
    }),
    descriptor
  ).record;
  const baseSignups = [
    baseSignup(),
    baseSignup({
      path: "signup/lecture09-student2.md",
      github: "student2-gh",
      studentId: "20261201095",
      email: "student2@westlake.edu.cn",
    }),
    baseSignup({
      path: "signup/lecture09-student3.md",
      github: "student3-gh",
      studentId: "20261201096",
      email: "student3@westlake.edu.cn",
    }),
  ];
  const problems = guard.validateSignupAgainstRegistry({
    descriptor,
    record,
    author: "newstudent-gh",
    status: "added",
    baseSignups,
  });
  assert.match(problems.join("\n"), /capacity is 3/);
});

test("an existing sign-up can only be updated by its owner", () => {
  const existing = baseSignup();
  const parsed = guard.signupRecordFromText(
    signupText({ github: "attacker" }),
    existing.descriptor
  );
  const problems = guard.validateSignupAgainstRegistry({
    descriptor: existing.descriptor,
    record: parsed.record,
    author: "attacker",
    status: "modified",
    baseSignups: [existing],
  });
  assert.match(problems.join("\n"), /not owned by @attacker/);
});

test("later submissions use the registered name and lecture", () => {
  const registry = [
    baseSignup(),
    baseSignup({ path: "signup/lecture10-tongli.md" }),
  ];
  assert.deepEqual(
    guard.validateSubmissionOwnership({
      descriptors: [guard.classifyPath("week3/week3-tongli-ext.html")],
      author: "tongli-gh",
      baseSignups: registry,
    }),
    []
  );

  let problems = guard.validateSubmissionOwnership({
    descriptors: [guard.classifyPath("research-essay/othername.html")],
    author: "tongli-gh",
    baseSignups: registry,
  });
  assert.match(problems.join("\n"), /Use the same name all term/);

  problems = guard.validateSubmissionOwnership({
    descriptors: [guard.classifyPath("lecture10/slides.pdf")],
    author: "tongli-gh",
    baseSignups: registry,
  });
  assert.deepEqual(problems, []);

  problems = guard.validateSubmissionOwnership({
    descriptors: [guard.classifyPath("lecture11/slides.pdf")],
    author: "tongli-gh",
    baseSignups: registry,
  });
  assert.match(problems.join("\n"), /signed up for lectures 9, 10/);
});

test("unregistered accounts cannot submit later work", () => {
  const problems = guard.validateSubmissionOwnership({
    descriptors: [guard.classifyPath("research-essay/tongli.html")],
    author: "unregistered",
    baseSignups: [],
  });
  assert.match(problems.join("\n"), /No merged sign-up belongs/);
});

test("the base-branch registry loader reads and parses merged sign-ups", async () => {
  const text = signupText();
  const github = {
    async graphql() {
      return {
        repository: {
          object: {
            entries: [
              { name: "TEMPLATE.md", type: "blob", object: { text: "template" } },
              { name: "ROSTER.md", type: "blob", object: { text: "roster" } },
              {
                name: "lecture09-tongli.md",
                type: "blob",
                object: {
                  byteSize: Buffer.byteLength(text),
                  isBinary: false,
                  text,
                },
              },
            ],
          },
        },
      };
    },
  };
  const result = await guard.loadBaseSignups(
    github,
    { repo: { owner: "course-owner", repo: "submissions" } },
    "main"
  );
  assert.equal(result.length, 1);
  assert.equal(result[0].record.github, "tongli-gh");
  assert.equal(result[0].descriptor.lecture, 9);
});

test("file metadata enforces type, non-empty content, and the real 5 MB limit", () => {
  assert.deepEqual(
    guard.validateFileMetadata("good.html", {
      type: "file",
      size: guard.MAX_BYTES,
    }),
    []
  );
  assert.match(
    guard
      .validateFileMetadata("huge.html", {
        type: "file",
        size: guard.MAX_BYTES + 1,
      })
      .join("\n"),
    /per-file limit/
  );
  assert.match(
    guard.validateFileMetadata("empty.html", { type: "file", size: 0 }).join("\n"),
    /is empty/
  );
  assert.match(
    guard.validateFileMetadata("link.html", { type: "symlink", size: 10 }).join("\n"),
    /not a regular file/
  );
  assert.match(
    guard
      .validateFileMetadata("module.html", {
        type: "file",
        size: 10,
        submodule_git_url: "https://github.com/example/repo",
      })
      .join("\n"),
    /not a regular file/
  );
  assert.match(
    guard
      .validateFileMetadata("pointer.html", {
        type: "file",
        size: 120,
        encoding: "base64",
        content: Buffer.from(
          "version https://git-lfs.github.com/spec/v1\noid sha256:abc\nsize 42\n"
        ).toString("base64"),
      })
      .join("\n"),
    /Git LFS pointer/
  );
  assert.match(
    guard.validateFileMetadata("unknown.html", { type: "file" }).join("\n"),
    /no readable size metadata/
  );
});

function mockRun({ fileSize = 500, mergeResult = true } = {}) {
  const files = [changed("signup/lecture09-tongli.md")];
  const signup = signupText();
  const calls = { comments: [], merges: [] };
  const rest = {
    pulls: {
      listFiles() {},
      async merge(args) {
        calls.merges.push(args);
        return { data: { merged: mergeResult, message: mergeResult ? "merged" : "blocked" } };
      },
    },
    issues: {
      listComments() {},
      async createComment(args) {
        calls.comments.push(args.body);
        return { data: {} };
      },
      async updateComment(args) {
        calls.comments.push(args.body);
        return { data: {} };
      },
    },
    repos: {
      async getContent(args) {
        if (args.owner === "course-owner" && args.path === files[0].filename) {
          return {
            data: {
              type: "file",
              size: fileSize,
              encoding: "base64",
              content: Buffer.from(signup, "utf8").toString("base64"),
            },
          };
        }
        throw new Error(`unexpected getContent request: ${JSON.stringify(args)}`);
      },
    },
  };
  const github = {
    rest,
    async graphql() {
      return {
        repository: {
          object: {
            entries: [
              { name: "ROSTER.md", type: "blob", object: { text: "roster" } },
              { name: "TEMPLATE.md", type: "blob", object: { text: "template" } },
            ],
          },
        },
      };
    },
    async paginate(endpoint) {
      if (endpoint === rest.pulls.listFiles) return files;
      if (endpoint === rest.issues.listComments) return [];
      throw new Error("unexpected paginated endpoint");
    },
  };
  const context = {
    repo: { owner: "course-owner", repo: "submissions" },
    payload: {
      repository: { default_branch: "main" },
      pull_request: {
        number: 3,
        title: "Tong Li sign-up",
        draft: false,
        user: { login: "tongli-gh" },
        base: { ref: "main" },
        head: {
          sha: "abc123",
          repo: { owner: { login: "tongli-gh" }, name: "submissions" },
        },
      },
    },
  };
  const core = {
    outputs: {},
    failures: [],
    setOutput(key, value) {
      this.outputs[key] = value;
    },
    setFailed(message) {
      this.failures.push(message);
    },
  };
  return { github, context, core, calls };
}

test("the API-facing gate accepts, comments on, and merges a valid fork sign-up", async () => {
  const fixture = mockRun();
  await guard.run(fixture);
  assert.deepEqual(fixture.core.failures, []);
  assert.equal(fixture.core.outputs.merged, "true");
  assert.equal(fixture.calls.merges.length, 1);
  assert.equal(fixture.calls.merges[0].sha, "abc123");
  assert.match(fixture.calls.comments.at(-1), /Checks passed/);
});

test("the API-facing gate refuses an oversized file before merge", async () => {
  const fixture = mockRun({ fileSize: guard.MAX_BYTES + 1 });
  await guard.run(fixture);
  assert.equal(fixture.core.outputs.merged, "false");
  assert.equal(fixture.calls.merges.length, 0);
  assert.equal(fixture.core.failures.length, 1);
  assert.match(fixture.calls.comments.at(-1), /per-file limit/);
});

test("the API-facing gate refuses a pull request aimed at the wrong base branch", async () => {
  const fixture = mockRun();
  fixture.context.payload.pull_request.base.ref = "course-materials";
  await guard.run(fixture);
  assert.equal(fixture.core.outputs.merged, "false");
  assert.equal(fixture.calls.merges.length, 0);
  assert.match(fixture.calls.comments.at(-1), /must target `main`/);
});

test("the API-facing gate treats merged=false as a merge failure", async () => {
  const fixture = mockRun({ mergeResult: false });
  await guard.run(fixture);
  assert.equal(fixture.core.outputs.merged, "false");
  assert.equal(fixture.calls.merges.length, 1);
  assert.match(fixture.core.failures.at(-1), /Merge failed: blocked/);
  assert.match(fixture.calls.comments.at(-1), /merge failed/);
});
