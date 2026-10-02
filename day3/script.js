// Starting data
let notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// 1. searchNotes - returns notes whose text contains word, case-insensitive
function searchNotes(word) {
  return notes.filter((note) =>
    note.text.toLowerCase().includes(word.toLowerCase())
  );
}

// 2. longestNote - returns the note with the most characters, or null if empty
function longestNote() {
  if (notes.length === 0) {
    return null;
  }

  let longest = notes[0];
  for (let i = 1; i < notes.length; i++) {
    if (notes[i].text.length > longest.text.length) {
      longest = notes[i];
    }
  }
  return longest;
}

// 3. countByCategory - returns an object counting notes per category
function countByCategory() {
  const counts = {};
  for (const note of notes) {
    counts[note.category] = (counts[note.category] || 0) + 1;
  }
  return counts;
}

// 4. getSummary - returns a sentence describing the note counts
function getSummary() {
  const counts = countByCategory();
  const total = notes.length;
  const noteWord = total === 1 ? "note" : "notes";

  const parts = Object.entries(counts).map(
    ([category, count]) => `${count} ${category}`
  );

  return `${total} ${noteWord}: ${parts.join(", ")}.`;
}

// 5. isDuplicate - true if a note with the same text already exists
function isDuplicate(text) {
  const normalized = text.trim().toLowerCase();
  return notes.some((note) => note.text.trim().toLowerCase() === normalized);
}

// 6. addNote - adds a note if valid, returns true/false and logs the reason
function addNote(text, category) {
  const validCategories = ["personal", "work", "study"];

  if (text.length < 1 || text.length > 200) {
    console.log("addNote failed: text must be 1-200 characters.");
    return false;
  }

  if (isDuplicate(text)) {
    console.log("addNote failed: duplicate note.");
    return false;
  }

  if (!validCategories.includes(category)) {
    console.log("addNote failed: invalid category.");
    return false;
  }

  const newNote = {
    id: notes.length + 1,
    text: text,
    category: category,
  };
  notes.push(newNote);
  console.log("addNote succeeded: note added.");
  return true;
}

// ---------- Tests ----------

// searchNotes tests
console.log(searchNotes("javascript"));
// Expected: [{ id: 4, text: "Revise JavaScript arrays", category: "study" }]

console.log(searchNotes("xyz"));
// Expected: [] (no notes contain "xyz")

// longestNote tests
console.log(longestNote());
// Expected: { id: 3, text: "Email the project report to Grace", category: "work" }

notes = [];
console.log(longestNote());
// Expected: null (empty array edge case)

// restore notes for the remaining tests
notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// countByCategory tests
console.log(countByCategory());
// Expected: { personal: 2, study: 2, work: 1 }

notes = [];
console.log(countByCategory());
// Expected: {} (no notes, edge case)

notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// getSummary tests
console.log(getSummary());
// Expected: "5 notes: 2 personal, 2 study, 1 work."

notes = [{ id: 1, text: "Only one note", category: "personal" }];
console.log(getSummary());
// Expected: "1 note: 1 personal." (singular "note" edge case)

notes = [
  { id: 1, text: "Buy milk and bread", category: "personal" },
  { id: 2, text: "Finish the Day 3 assignment", category: "study" },
  { id: 3, text: "Email the project report to Grace", category: "work" },
  { id: 4, text: "Revise JavaScript arrays", category: "study" },
  { id: 5, text: "Call mum", category: "personal" },
];

// isDuplicate tests
console.log(isDuplicate("buy milk and bread"));
// Expected: true (same text, different case)

console.log(isDuplicate("Go for a walk"));
// Expected: false (no matching note)

// addNote tests
console.log(addNote("Plan the weekend trip", "personal"));
// Expected: true (valid new note, logs "addNote succeeded: note added.")

console.log(addNote("Buy milk and bread", "personal"));
// Expected: false (duplicate, logs "addNote failed: duplicate note.")

console.log(addNote("", "personal"));
// Expected: false (empty text, logs "addNote failed: text must be 1-200 characters.")

console.log(addNote("Read a book", "hobby"));
// Expected: false (invalid category, logs "addNote failed: invalid category.")