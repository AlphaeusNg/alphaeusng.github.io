import assert from "node:assert/strict";

const emulatorHost = process.env.FIRESTORE_EMULATOR_HOST;
assert.ok(
  emulatorHost,
  "Run with: npx firebase-tools emulators:exec --only firestore 'node tools/test-feedback-rules.mjs'",
);

const projectId = "alparcade-cb87c";
const databasePath = `projects/${projectId}/databases/(default)`;
const apiRoot = `http://${emulatorHost}/v1/${databasePath}`;

function feedbackWrite(id, message) {
  return {
    update: {
      name: `${databasePath}/documents/feedback/${id}`,
      fields: {
        schema: { integerValue: "1" },
        project: { stringValue: "VerseKeep" },
        type: { stringValue: "Suggestion" },
        rating: { integerValue: "5" },
        message: { stringValue: message },
        contact: { stringValue: "" },
        sourceUrl: { stringValue: "https://alphaeusng.github.io/VerseKeep/" },
      },
    },
    updateTransforms: [
      {
        fieldPath: "submittedAt",
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
  feedbackWrite("accepted-feedback", "This is a valid feedback message."),
);
assert.equal(accepted.status, 200, await accepted.text());

const publicRead = await fetch(
  `${apiRoot}/documents/feedback/accepted-feedback`,
);
assert.equal(publicRead.status, 403, "feedback must not be publicly readable");

const rejected = await commit(feedbackWrite("rejected-feedback", "Too short"));
assert.equal(rejected.status, 403, "short feedback must be rejected");

console.log("Feedback rules passed: valid create allowed; public read and invalid create denied.");
