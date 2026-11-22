/*
 * EXAMPLE DATA ONLY: progress saved in the OLD day-based shape (ui/README v1 contract,
 * 4 courses per day). Used by the demo (?migrate=1) and by the engine tests to show that
 * StudyDeskSchedule.migrateProgress() maps it onto stable lesson IDs without losing anything.
 */
window.STUDY_DESK_FIXTURES = window.STUDY_DESK_FIXTURES || {};
window.STUDY_DESK_FIXTURES.legacyProgress = {
  currentDay: 2,
  days: {
    "1": { blocks: { "d1-java": "complete", "d1-dsa": "complete", "d1-hld": "in-progress" }, practice: { "d1-java": "complete", "d1-dsa": "complete" }, notes: "Encapsulation: guard state changes inside the class.\nBig-O: count the nested loops." },
    "2": { blocks: { "d2-java": "in-progress" }, notes: "" }
  }
};
