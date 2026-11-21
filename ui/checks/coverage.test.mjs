// Unit tests for ui/coverage.js reference checks (QA M14). Run: node --test ui/checks/coverage.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
globalThis.window = globalThis.window || {};
window.StudyDeskSchedule = require("../engine/schedule-engine.js");
require("../fixtures/course.fixture.js");
require("../reference/topics.reference.js");
require("../coverage.js");
const C = window.StudyDeskCoverage, REF = window.STUDY_DESK_REFERENCE, course = window.STUDY_DESK_FIXTURES.course;

test("QA M14: the example fixture is NOT reported as fully covered; missing subjects show up", () => {
  const r = C.analyzeReference(course, REF);
  assert.equal(r.ok, false);
  assert.ok(r.covered < r.total);
  const ops = r.subjects.find(s => s.id === "ref-ops");
  assert.equal(ops.status, "missing");
  assert.ok(r.missingSubjects >= 1);
  const msg = r.subjects.find(s => s.id === "ref-messaging");
  assert.ok(msg.topics.find(t => t.id === "msg.kafka").covered === false, "Kafka is not taught in the fixture");
});

test("QA M14: a course that covers every reference topic (covers[]) is green; a course with no lessons is all red", () => {
  const ids = REF.subjects.flatMap(s => s.topics.map(t => t[0]));
  const full = { subjects: [{ id: "x", title: "Everything", modules: [{ id: "m", title: "m", lessons: [{ id: "L1", title: "All", covers: ids, source: { kind: "added" } }] }] }] };
  const r = C.analyzeReference(full, REF);
  assert.equal(r.ok, true); assert.equal(r.covered, r.total);
  const empty = C.analyzeReference({ subjects: [] }, REF);
  assert.equal(empty.covered, 0); assert.equal(empty.missingSubjects, REF.subjects.length);
});

test("QA M14: analyze() reports plan warnings from the validator", () => {
  const a = C.analyze(course);
  assert.equal(a.ok, true); assert.deepEqual(a.warnings, []);
});
