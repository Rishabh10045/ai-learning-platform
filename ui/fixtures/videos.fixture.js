/*
 * EXAMPLE DATA ONLY: placeholder video entries for previewing the UI.
 * Links are searches, not real picks; Codex's lesson-videos.js supplies real ones.
 * Keyed by day number. `track` is optional and shows the course name on the card.
 */
window.STUDY_DESK_FIXTURES = window.STUDY_DESK_FIXTURES || {};
window.STUDY_DESK_FIXTURES.videos = {
  "1": [
    { id: "v1-hld", track: "HLD", title: "Example: What happens when you type a URL", source: "YouTube", channel: "Example channel", url: "https://www.youtube.com/results?search_query=what+happens+when+you+type+a+url", durationMin: 18, suggestedWatchMin: 12 },
    { id: "v1-dsa", track: "DSA", title: "Example: Big-O in 10 minutes", source: "YouTube", channel: "Example channel", url: "https://www.youtube.com/results?search_query=big+o+notation", durationMin: 14, suggestedWatchMin: 10 },
    { id: "v1-java", track: "JAVA", title: "Example: Classes and objects", source: "dev.java", channel: "Oracle", url: "https://dev.java/learn/", suggestedWatchMin: 10, kind: "article" },
    { id: "v1-ai", track: "AI", title: "Example: Generative AI for Beginners, lesson 1", source: "GitHub (Microsoft)", channel: "microsoft/generative-ai-for-beginners", url: "https://github.com/microsoft/generative-ai-for-beginners", suggestedWatchMin: 12, kind: "article" }
  ]
};
