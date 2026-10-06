// ── Element selection ──
const textarea     = document.querySelector("#note-text");
const charCount    = document.querySelector("#char-count");
const wordCount    = document.querySelector("#word-count");
const clearBtn     = document.querySelector("#clear-btn");
const themeToggle  = document.querySelector("#theme-toggle");

const DRAFT_KEY  = "quicknotes_draft";
const THEME_KEY  = "quicknotes_theme";
const CHAR_LIMIT = 200;
const WARN_AT    = 180;

// ── updateCounts: refreshes both counters and warning classes ──
function updateCounts() {
  const text  = textarea.value;
  const chars = text.length;
  const words = text.trim() === "" ? 0 : text.trim().split(/\s+/).length;

  // Character counter text
  charCount.textContent = `${chars} / ${CHAR_LIMIT} characters`;

  // Warning classes
  charCount.classList.remove("warning", "over");
  if (chars > CHAR_LIMIT) {
    charCount.classList.add("over");
  } else if (chars > WARN_AT) {
    charCount.classList.add("warning");
  }

  // Word counter text
  wordCount.textContent = `${words} word${words !== 1 ? "s" : ""}`;
}

// ── Save draft to localStorage ──
function saveDraft() {
  localStorage.setItem(DRAFT_KEY, textarea.value);
}

// ── Clear everything ──
function clearAll() {
  textarea.value = "";
  localStorage.removeItem(DRAFT_KEY);
  updateCounts();
  textarea.focus();
}

// ── Input event: update counters + save draft ──
textarea.addEventListener("input", () => {
  updateCounts();
  saveDraft();
});

// ── Escape key inside textarea clears everything ──
textarea.addEventListener("keydown", (e) => {
  if (e.key === "Escape") clearAll();
});

// ── Clear button ──
clearBtn.addEventListener("click", clearAll);

// ── Theme toggle ──
themeToggle.addEventListener("click", () => {
  const isDark = document.body.classList.toggle("dark");
  themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  localStorage.setItem(THEME_KEY, isDark ? "dark" : "light");
});

// ── On page load: restore draft and theme, then update counters ──
(function init() {
  const savedDraft = localStorage.getItem(DRAFT_KEY);
  if (savedDraft) textarea.value = savedDraft;

  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "Light mode";
  } else {
    themeToggle.textContent = "Dark mode";
  }

  updateCounts();
})();