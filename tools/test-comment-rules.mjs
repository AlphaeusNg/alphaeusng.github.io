import assert from "node:assert/strict";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
assert.ok(
  emulatorHost,
  "Run with: npx firebase-tools emulators:exec --only firestore 'node tools/test-comment-rules.mjs'",
);

const projectId = "alparcade-cb87c";
const databasePath = `projects/${projectId}/databases/(default)`;
const apiRoot = `http://${emulatorHost}/v1/${databasePath}`;
const postId = "sg-transit-one-fare";

function commentWrite(post, id, body, extra) {
  return {
    update: {
      name: `${databasePath}/documents/posts/${post}/comments/${id}`,
      fields: {
        name: { stringValue: "Ada" },
        body: { stringValue: body },
        ...extra,
      },
    },
    updateTransforms: [
      {
        fieldPath: "createdAt",
        setToServerValue: "REQUEST_TIME",
      },
    ],
  };
}

async function commit(write) {
  return fetch(`${apiRoot}/documents:commit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ writes: [write] }),
  });
}

const accepted = await commit(
  commentWrite(postId, "accepted-comment", "The 45 minute clock is the part I miss."),
);
assert.equal(accepted.status, 200, await accepted.text());

const publicRead = await fetch(
  `${apiRoot}/documents/posts/${postId}/comments/accepted-comment`,
);
assert.equal(publicRead.status, 200, "allowlisted comments must be publicly readable");

const tooShort = await commit(commentWrite(postId, "short-comment", "No"));
assert.equal(tooShort.status, 403, "a 2-character comment must be rejected");

const otherPost = await commit(
  commentWrite("other-note", "foreign-comment", "This post is not allowlisted."),
);
assert.equal(otherPost.status, 403, "comments on an unknown post must be rejected");

const extraField = await commit(
  commentWrite(postId, "extra-comment", "A comment with an extra field.", {
    website: { stringValue: "https://example.test" },
  }),
);
assert.equal(extraField.status, 403, "unexpected comment fields must be rejected");

const overwrite = await commit(
  commentWrite(postId, "accepted-comment", "Rewriting a public comment is closed."),
);
assert.equal(overwrite.status, 403, "comment updates must be rejected");

const remove = await fetch(
  `${apiRoot}/documents/posts/${postId}/comments/accepted-comment`,
  { method: "DELETE" },
);
assert.equal(remove.status, 403, "anonymous delete must be rejected");

console.log(
  "Comment rules passed: public read and valid create allowed; short, foreign, extra, update, and anonymous delete denied.",
);
