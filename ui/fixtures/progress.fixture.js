/*
 * EXAMPLE DATA ONLY: in-memory progress for the demo page.
 * Nothing has been started yet: no day, block or practice item is marked.
 * Missing entries mean "pending", which the UI labels "Not started".
 * The UI never persists this; the host (Codex's progress.js) owns storage.
 */
window.STUDY_DESK_FIXTURES = window.STUDY_DESK_FIXTURES || {};
window.STUDY_DESK_FIXTURES.progress = {
  currentDay: 1,
  days: {}
};
