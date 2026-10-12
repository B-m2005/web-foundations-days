const loadBtn = document.querySelector("#load-users");
const filterInput = document.querySelector("#filter-input");
const statusEl = document.querySelector("#status");
const usersList = document.querySelector("#users-list");

let allUsers = [];

function renderUsers(list) {
  usersList.innerHTML = "";

  if (list.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No users match your filter.";
    usersList.appendChild(li);
    return;
  }

  list.forEach((user) => {
    const li = document.createElement("li");

    const name = document.createElement("strong");
    name.textContent = user.name;

    const email = document.createElement("p");
    email.textContent = `Email: ${user.email}`;

    const city = document.createElement("p");
    city.textContent = `City: ${user.address.city}`;

    const company = document.createElement("p");
    company.textContent = `Company: ${user.company.name}`;

    li.appendChild(name);
    li.appendChild(email);
    li.appendChild(city);
    li.appendChild(company);

    usersList.appendChild(li);
  });
}

async function loadUsers() {
  loadBtn.disabled = true;
  statusEl.textContent = "Loading users...";
  usersList.innerHTML = "";

  try {
    const response = await fetch("https://jsonplaceholder.typicode.com/users");

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = await response.json();
    allUsers = data;

    statusEl.textContent = `Successfully loaded ${allUsers.length} users.`;
    renderUsers(allUsers);
  } catch (error) {
    statusEl.textContent = `Error: ${error.message}`;
    allUsers = [];
  } finally {
    loadBtn.disabled = false;
  }
}

filterInput.addEventListener("input", () => {
  const term = filterInput.value.trim().toLowerCase();

  if (!term) {
    renderUsers(allUsers);
    return;
  }

  const filtered = allUsers.filter((user) =>
    user.name.toLowerCase().includes(term)
  );

  renderUsers(filtered);
});

loadBtn.addEventListener("click", loadUsers);