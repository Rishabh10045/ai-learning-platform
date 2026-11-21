/*
 * EXAMPLE DATA ONLY: in-memory progress for the demo page.
 * The UI never persists this; the host (Codex's progress.js) owns storage.
 * status: "pending" | "in-progress" | "complete"
 */
window.STUDY_DESK_FIXTURES = window.STUDY_DESK_FIXTURES || {};
window.STUDY_DESK_FIXTURES.progress = {
  currentDay: 2,
  days: {
    "1": {
      status: "complete",
      blocks: { "d1-b1": "complete", "d1-b2": "complete", "d1-b3": "complete", "d1-b4": "complete" },
      practice: { "lab-1-1": "complete" },
      notes: "Seat owns its state. book(user) only works from AVAILABLE.\nBookingService coordinates, but the rule lives in Seat.\nInvariant: BOOKED always has an owner."
    },
    "2": {
      status: "in-progress",
      blocks: { "d2-b0": "complete", "d2-b1": "in-progress" },
      practice: {},
      notes: ""
    }
  }
};
