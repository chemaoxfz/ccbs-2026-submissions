"use strict";

const MAX_FILES = 12;
const MAX_BYTES = 5 * 1024 * 1024;
const SIGNUP_CAP = 3;

const PROTECTED = [
  /^\.github\//,
  /^tools\//,
  /^README\.md$/,
  /^TEMPLATE/,
  /^signup\/ROSTER\.md$/,
  /^signup\/TEMPLATE\.md$/,
  /^lecture(?:0[3-9]|1[0-6])\/README\.md$/,
  /^\.gitignore$/,
];

function code(value) {
  return `\`${String(value).replace(/`/g, "\\`")}\``;
}

function normalizeHandle(value) {
  return String(value || "").trim().replace(/^@/, "").toLowerCase();
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function classifyPath(filename) {
  let match = filename.match(
    /^signup\/lecture(0[3-9]|1[0-6])-([a-z0-9][a-z0-9._-]*)\.md$/
  );
  if (match) {
    return {
      category: "signup",
      lecture: Number(match[1]),
      slug: match[2],
      path: filename,
      problems: [],
    };
  }

  match = filename.match(
    /^week([1-8])\/week([1-8])-([a-z0-9][a-z0-9._-]*)-ext\.(html|htm)$/
  );
  if (match) {
    const folderWeek = Number(match[1]);
    const filenameWeek = Number(match[2]);
    return {
      category: "extension",
      week: folderWeek,
      slug: match[3],
      path: filename,
      problems:
        folderWeek === filenameWeek
          ? []
          : [
              `${code(filename)} says week ${folderWeek} in the folder but week ${filenameWeek} in the filename. The two week numbers must match.`,
            ],
    };
  }

  match = filename.match(
    /^lecture(0[3-9]|1[0-6])\/([A-Za-z0-9][A-Za-z0-9._ -]*)\.(html|htm|pdf|pptx|ipynb|md|py|png|jpg|jpeg|svg|css|js)$/
  );
  if (match) {
    return {
      category: "exposition",
      lecture: Number(match[1]),
      path: filename,
      problems: [],
    };
  }

  match = filename.match(
    /^research-essay\/([a-z0-9][a-z0-9._-]*)\.(html|htm)$/
  );
  if (match) {
    return {
      category: "research",
      slug: match[1],
      path: filename,
      problems: [],
    };
  }

  return null;
}

function validateFileList(files) {
  const problems = [];
  const descriptors = [];

  if (files.length === 0) problems.push("The pull request changes no files.");
  if (files.length > MAX_FILES) {
    problems.push(
      `${files.length} files changed; the limit is ${MAX_FILES}. Open one pull request per submission.`
    );
  }

  for (const file of files) {
    const path = file.filename;
    if (PROTECTED.some((pattern) => pattern.test(path))) {
      problems.push(
        `${code(path)} is a course file and cannot be changed by a submission pull request.`
      );
    } else {
      const descriptor = classifyPath(path);
      if (!descriptor) {
        problems.push(
          `${code(path)} does not match any submission path. See the naming rules in the README.`
        );
      } else {
        descriptors.push(descriptor);
        problems.push(...descriptor.problems);
      }
    }

    if (file.status === "removed") {
      problems.push(
        `${code(path)} is being deleted. Submission pull requests cannot delete files.`
      );
    } else if (!new Set(["added", "modified"]).has(file.status)) {
      problems.push(
        `${code(path)} has status ${code(file.status)}. Renames and copies are not accepted; add or update the intended file directly.`
      );
    }
  }

  const categories = new Set(descriptors.map((item) => item.category));
  if (categories.size > 1) {
    problems.push(
      "This pull request mixes submission types. Open one pull request for one sign-up, extension, exposition, or research essay."
    );
  }

  const category = categories.size === 1 ? [...categories][0] : null;
  if (
    ["signup", "extension", "research"].includes(category) &&
    files.length !== 1
  ) {
    problems.push(
      `${category === "signup" ? "A sign-up" : "This submission"} must contain exactly one file.`
    );
  }

  if (category === "exposition") {
    const lectures = new Set(descriptors.map((item) => item.lecture));
    if (lectures.size > 1) {
      problems.push("One exposition pull request may only contain files for one lecture.");
    }
  }

  return { problems, descriptors, category };
}

function parseFrontMatter(text) {
  const match = String(text).match(
    /^\s*---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/
  );
  if (!match) {
    return {
      data: null,
      problems: ["The sign-up has no `---` front matter block."],
    };
  }

  const data = {};
  const problems = [];
  for (const rawLine of match[1].split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const colon = line.indexOf(":");
    if (colon < 1) {
      problems.push(`Front matter line ${code(rawLine)} is not a key-value pair.`);
      continue;
    }
    const key = line.slice(0, colon).trim().toLowerCase();
    let value = line.slice(colon + 1).trim();
    if (
      value.length >= 2 &&
      ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'")))
    ) {
      value = value.slice(1, -1).trim();
    }
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      problems.push(`Front matter field ${code(key)} appears more than once.`);
    } else {
      data[key] = value;
    }
  }
  return { data, problems };
}

function signupRecordFromText(text, descriptor) {
  const parsed = parseFrontMatter(text);
  if (!parsed.data) {
    return { record: null, problems: parsed.problems };
  }

  const data = parsed.data;
  const problems = [...parsed.problems];
  const required = ["name", "student_id", "email", "github", "lecture"];
  for (const field of required) {
    if (!String(data[field] || "").trim()) {
      problems.push(`Required front matter field ${code(field)} is empty or missing.`);
    }
  }

  const placeholders = {
    name: "your name",
    name_zh: "你的姓名",
    student_id: "20261234567",
    email: "yourname@westlake.edu.cn",
    github: "your-github-handle",
  };
  for (const [field, placeholder] of Object.entries(placeholders)) {
    if (String(data[field] || "").trim().toLowerCase() === placeholder) {
      problems.push(`Replace the template value in ${code(field)} with your own.`);
    }
  }

  const studentId = String(data.student_id || "").trim();
  if (studentId && !/^[A-Za-z0-9][A-Za-z0-9_-]{4,31}$/.test(studentId)) {
    problems.push(
      "`student_id` must be 5–32 letters, digits, underscores, or hyphens, with no spaces."
    );
  }

  const email = normalizeEmail(data.email);
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    problems.push("`email` does not look like an email address.");
  }

  const name = String(data.name || "").trim();
  const nameZh = String(data.name_zh || "").trim();
  for (const [field, value] of [
    ["name", name],
    ["name_zh", nameZh],
  ]) {
    if (value.length > 80 || /[|<>\r\n]/.test(value)) {
      problems.push(
        `${code(field)} must be at most 80 characters and cannot contain table or HTML markup characters.`
      );
    }
  }

  const lecture = Number(String(data.lecture || "").trim());
  if (!Number.isInteger(lecture) || lecture < 3 || lecture > 16) {
    problems.push("`lecture` must be a whole number from 3 to 16.");
  } else if (lecture !== descriptor.lecture) {
    problems.push(
      `${code(descriptor.path)} is for lecture ${descriptor.lecture}, but its front matter says lecture ${lecture}.`
    );
  }

  const record = {
    path: descriptor.path,
    slug: descriptor.slug,
    lecture: Number.isInteger(lecture) ? lecture : descriptor.lecture,
    name,
    studentId,
    email,
    github: normalizeHandle(data.github),
  };
  return { record, problems };
}

function validateSignupAgainstRegistry({
  descriptor,
  record,
  author,
  status,
  baseSignups,
}) {
  const problems = [];
  const authorHandle = normalizeHandle(author);
  const current = baseSignups.find((item) => item.path === descriptor.path);
  const others = baseSignups.filter((item) => item.path !== descriptor.path);

  if (record.github !== authorHandle) {
    problems.push(
      `The sign-up's ${code("github")} field must be ${code(authorHandle)}, the account that opened this pull request.`
    );
  }

  if (status === "modified") {
    if (!current) {
      problems.push(
        `${code(descriptor.path)} is marked as an update but does not exist on the current main branch.`
      );
    } else if (!current.record || current.record.github !== authorHandle) {
      problems.push(
        `${code(descriptor.path)} is not owned by @${authorHandle}. Only its original GitHub account may update it.`
      );
    }
  } else if (current) {
    problems.push(
      `${code(descriptor.path)} already exists on main. Update it from its owning account instead of replacing it.`
    );
  }

  const ownedSignups = others.filter(
    (item) => item.record && item.record.github === authorHandle
  );
  const stableIdentityChecks = [
    ["submission name (`yourname`)", record.slug, (item) => item.descriptor?.slug],
    ["student ID", record.studentId.toLowerCase(), (item) => item.record?.studentId],
    ["email", record.email, (item) => item.record?.email],
  ];
  for (const [label, value, readExisting] of stableIdentityChecks) {
    if (!value) continue;
    const mismatch = ownedSignups.find((item) => {
      const candidate = readExisting(item);
      return candidate && String(candidate).toLowerCase() !== value;
    });
    if (mismatch) {
      problems.push(
        `An additional sign-up must reuse the same ${label} as ${code(mismatch.path)}.`
      );
    }
  }

  const sameLecture = ownedSignups.find(
    (item) => item.descriptor?.lecture === descriptor.lecture
  );
  if (sameLecture) {
    problems.push(
      `@${authorHandle} already has a student place in lecture ${descriptor.lecture} through ${code(sameLecture.path)}. One student may occupy only one place in a lecture.`
    );
  }

  const otherStudents = others.filter(
    (item) => item.record && item.record.github !== authorHandle
  );
  const collisionChecks = [
    ["submission name", record.slug, (item) => item.descriptor?.slug],
    ["student ID", record.studentId.toLowerCase(), (item) => item.record?.studentId],
    ["email", record.email, (item) => item.record?.email],
  ];
  for (const [label, value, readExisting] of collisionChecks) {
    if (!value) continue;
    const collision = otherStudents.find((item) => {
      const candidate = readExisting(item);
      return candidate && String(candidate).toLowerCase() === value;
    });
    if (collision) {
      problems.push(
        `This ${label} is already registered to another account in ${code(collision.path)}.`
      );
    }
  }

  const occupancy = baseSignups.filter(
    (item) => item.descriptor && item.descriptor.lecture === descriptor.lecture && item.path !== descriptor.path
  ).length;
  if (occupancy >= SIGNUP_CAP) {
    problems.push(
      `Lecture ${descriptor.lecture} already has ${occupancy} students; the capacity is ${SIGNUP_CAP}. Choose another lecture.`
    );
  }

  return problems;
}

function validateSubmissionOwnership({ descriptors, author, baseSignups }) {
  const problems = [];
  const authorHandle = normalizeHandle(author);
  const matches = baseSignups.filter(
    (item) => item.record && item.record.github === authorHandle
  );

  if (matches.length === 0) {
    return [
      `No merged sign-up belongs to @${authorHandle}. Merge your sign-up first, with its ${code("github")} field set to ${code(authorHandle)}.`,
    ];
  }
  const slugs = new Set(matches.map((item) => item.descriptor.slug));
  const lectures = new Set(matches.map((item) => item.descriptor.lecture));
  for (const descriptor of descriptors) {
    if (["extension", "research"].includes(descriptor.category)) {
      if (!slugs.has(descriptor.slug)) {
        const registered = [...slugs].map(code).join(", ");
        problems.push(
          `${code(descriptor.path)} uses the name ${code(descriptor.slug)}, but @${authorHandle}'s sign-up${slugs.size === 1 ? " uses" : "s use"} ${registered}. Use the same name all term.`
        );
      }
    } else if (
      descriptor.category === "exposition" &&
      !lectures.has(descriptor.lecture)
    ) {
      const registered = [...lectures].sort((a, b) => a - b).join(", ");
      problems.push(
        `@${authorHandle} is signed up for lecture${lectures.size === 1 ? "" : "s"} ${registered}, so this account cannot submit to ${code(`lecture${String(descriptor.lecture).padStart(2, "0")}/`)}.`
      );
    }
  }
  return problems;
}

function validateFileMetadata(filename, metadata) {
  const problems = [];
  if (
    !metadata ||
    metadata.type !== "file" ||
    metadata.submodule_git_url ||
    metadata.target
  ) {
    problems.push(`${code(filename)} is not a regular file.`);
    return problems;
  }
  if (!Number.isFinite(metadata.size)) {
    problems.push(`${code(filename)} has no readable size metadata; it cannot be verified safely.`);
  } else {
    if (metadata.size === 0) problems.push(`${code(filename)} is empty.`);
    if (metadata.size > MAX_BYTES) {
      problems.push(
        `${code(filename)} is ${metadata.size} bytes; the per-file limit is ${MAX_BYTES} bytes (5 MB).`
      );
    }
  }
  if (
    metadata.encoding === "base64" &&
    typeof metadata.content === "string" &&
    Buffer.from(metadata.content.replace(/\n/g, ""), "base64")
      .toString("utf8", 0, 80)
      .startsWith("version https://git-lfs.github.com/spec/")
  ) {
    problems.push(
      `${code(filename)} is a Git LFS pointer, not the submitted file. Add the real file directly.`
    );
  }
  return problems;
}

function decodeFile(metadata) {
  if (!metadata || metadata.type !== "file") {
    throw new Error("not a regular file");
  }
  if (metadata.encoding !== "base64" || typeof metadata.content !== "string") {
    throw new Error("GitHub did not return readable base64 content");
  }
  return Buffer.from(metadata.content.replace(/\n/g, ""), "base64").toString("utf8");
}

async function getContent(github, { owner, repo, path, ref }) {
  const response = await github.rest.repos.getContent({ owner, repo, path, ref });
  return response.data;
}

async function loadBaseSignups(github, context, ref) {
  let result;
  try {
    result = await github.graphql(
      `query($owner: String!, $repo: String!, $expression: String!) {
        repository(owner: $owner, name: $repo) {
          object(expression: $expression) {
            ... on Tree {
              entries {
                name
                type
                object {
                  ... on Blob {
                    byteSize
                    isBinary
                    text
                  }
                }
              }
            }
          }
        }
      }`,
      {
        owner: context.repo.owner,
        repo: context.repo.repo,
        expression: `${ref}:signup`,
      }
    );
  } catch (error) {
    throw new Error(`could not read current sign-ups: ${error.message}`);
  }
  const entries = result?.repository?.object?.entries;
  if (!Array.isArray(entries)) {
    throw new Error("the signup path on the default branch is not a readable directory");
  }

  return entries
    .map((entry) => ({ ...entry, path: `signup/${entry.name}` }))
    .filter((entry) => classifyPath(entry.path)?.category === "signup")
    .map((entry) => {
      const descriptor = classifyPath(entry.path);
      if (
        entry.type !== "blob" ||
        entry.object?.isBinary ||
        typeof entry.object?.text !== "string"
      ) {
        return {
          path: entry.path,
          descriptor,
          record: null,
          parseProblems: ["sign-up is not a readable text file"],
        };
      }
      const parsed = signupRecordFromText(entry.object.text, descriptor);
      return {
        path: entry.path,
        descriptor,
        record: parsed.problems.length === 0 ? parsed.record : null,
        parseProblems: parsed.problems,
      };
    });
}

async function run({ github, context, core }) {
  const pr = context.payload.pull_request;
  const owner = context.repo.owner;
  const repo = context.repo.repo;
  core.setOutput("merged", "false");

  const files = await github.paginate(github.rest.pulls.listFiles, {
    owner,
    repo,
    pull_number: pr.number,
    per_page: 100,
  });
  const validation = validateFileList(files);
  const problems = [...validation.problems];
  const metadataByPath = new Map();
  const defaultBranch = context.payload.repository.default_branch;

  if (pr.base.ref !== defaultBranch) {
    problems.push(
      `This pull request targets ${code(pr.base.ref)}. Submissions must target ${code(defaultBranch)}.`
    );
  }

  // GitHub exposes fork-PR objects through the base repository at the head SHA.
  // Keeping the request on context.repo means the repository-scoped GITHUB_TOKEN
  // never needs access to the student's fork.
  const head = { ...context.repo, ref: pr.head.sha };
  for (const file of files) {
    if (!["added", "modified"].includes(file.status)) continue;
    try {
      const metadata = await getContent(github, {
        ...head,
        path: file.filename,
      });
      metadataByPath.set(file.filename, metadata);
      problems.push(...validateFileMetadata(file.filename, metadata));
    } catch (error) {
      problems.push(
        `Could not inspect ${code(file.filename)} in the pull-request branch: ${error.message}`
      );
    }
  }

  let baseSignups = [];
  if (validation.category) {
    try {
      baseSignups = await loadBaseSignups(
        github,
        context,
        defaultBranch
      );
    } catch (error) {
      problems.push(`Could not verify the current teaching roster: ${error.message}`);
    }
  }

  if (
    validation.category === "signup" &&
    validation.descriptors.length === 1 &&
    files.length === 1
  ) {
    const descriptor = validation.descriptors[0];
    const metadata = metadataByPath.get(descriptor.path);
    if (metadata) {
      try {
        const parsed = signupRecordFromText(decodeFile(metadata), descriptor);
        problems.push(...parsed.problems);
        if (parsed.record) {
          problems.push(
            ...validateSignupAgainstRegistry({
              descriptor,
              record: parsed.record,
              author: pr.user.login,
              status: files[0].status,
              baseSignups,
            })
          );
        }
      } catch (error) {
        problems.push(`Could not read ${code(descriptor.path)}: ${error.message}`);
      }
    }
  } else if (
    ["extension", "exposition", "research"].includes(validation.category) &&
    validation.descriptors.length > 0
  ) {
    problems.push(
      ...validateSubmissionOwnership({
        descriptors: validation.descriptors,
        author: pr.user.login,
        baseSignups,
      })
    );
  }

  const marker = "<!-- ccbs-automerge -->";
  const say = async (body) => {
    const comments = await github.paginate(github.rest.issues.listComments, {
      owner,
      repo,
      issue_number: pr.number,
      per_page: 100,
    });
    const mine = comments.find(
      (comment) => comment.body && comment.body.includes(marker)
    );
    const full = `${marker}\n${body}`;
    if (mine) {
      await github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: mine.id,
        body: full,
      });
    } else {
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: pr.number,
        body: full,
      });
    }
  };

  if (problems.length) {
    await say(
      "**Not merged yet.** The submission guard found the following problem" +
        (problems.length === 1 ? ":\n\n" : "s:\n\n") +
        problems.map((problem) => `- ${problem}`).join("\n") +
        "\n\nFix these and push again to the same branch; the check re-runs automatically. " +
        `The rules are in the [README](https://github.com/${owner}/${repo}#readme). ` +
        "If you are stuck for more than ten minutes, ask a TA rather than fighting the bot."
    );
    core.setFailed("Submission did not pass the guardrails.");
    return;
  }

  if (pr.draft) {
    await say(
      "The submission passes all checks, but the pull request is still a **draft**. Mark it ready for review and it will merge."
    );
    return;
  }

  await say(
    `**Checks passed** (${files.length} file${files.length === 1 ? "" : "s"}). ` +
      "Merging now. Your submission is recorded once this pull request shows as merged; nothing else to do."
  );

  try {
    const result = await github.rest.pulls.merge({
      owner,
      repo,
      pull_number: pr.number,
      merge_method: "squash",
      commit_title: `${pr.title} (#${pr.number})`,
      // Refuse the merge if the student pushed after this exact revision was
      // inspected. The synchronize event will validate the new revision next.
      sha: pr.head.sha,
    });
    if (!result.data.merged) {
      throw new Error(result.data.message || "GitHub returned merged=false");
    }
    core.setOutput("merged", "true");
  } catch (error) {
    await say(
      `**Checks passed, but the merge failed:** ${error.message}\n\n` +
        "Usually this means your branch conflicts with `main`. Update your branch from `main` and push again."
    );
    core.setFailed(`Merge failed: ${error.message}`);
  }
}

module.exports = {
  MAX_BYTES,
  MAX_FILES,
  SIGNUP_CAP,
  classifyPath,
  loadBaseSignups,
  normalizeHandle,
  parseFrontMatter,
  signupRecordFromText,
  validateFileList,
  validateFileMetadata,
  validateSignupAgainstRegistry,
  validateSubmissionOwnership,
  run,
};
