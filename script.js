const STORAGE_KEY = "focusflow_tasks_v1";

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const priorityInput = document.getElementById("priorityInput");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const searchInput = document.getElementById("searchInput");
const clearCompletedButton = document.getElementById("clearCompleted");
const filterButtons = [...document.querySelectorAll(".filter-button")];

let tasks = loadTasks();
let activeFilter = "all";

function loadTasks() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    return Array.isArray(saved) ? saved.filter(task => task && typeof task.id === "string" && typeof task.title === "string") : [];
  } catch (error) {
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    document.getElementById("footerMessage").textContent = "Your tasks are saved on this device.";
  } catch (error) {
    document.getElementById("footerMessage").textContent = "Browser storage is unavailable. Keep this page open to retain tasks.";
  }
}

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function formatDate(value) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function updateStats() {
  const total = tasks.length;
  const completed = tasks.filter(task => task.completed).length;
  const remaining = total - completed;
  const percent = total ? Math.round((completed / total) * 100) : 0;

  document.getElementById("totalCount").textContent = total;
  document.getElementById("completedCount").textContent = completed;
  document.getElementById("remainingCount").textContent = remaining;
  document.getElementById("progressPercent").textContent = `${percent}%`;
  document.getElementById("progressFill").style.width = `${percent}%`;
  document.getElementById("progressBar").setAttribute("aria-valuenow", percent);
  document.getElementById("taskCountLabel").textContent = `${total} ${total === 1 ? "task" : "tasks"}`;

  const note = total === 0
    ? "Every task you finish is a win. Start with one."
    : percent === 100
      ? "Amazing work — you completed every task!"
      : `${completed} of ${total} tasks completed. Keep your momentum going!`;
  document.getElementById("progressNote").textContent = note;
}

function getVisibleTasks() {
  const query = searchInput.value.trim().toLowerCase();
  return tasks.filter(task => {
    const matchesFilter = activeFilter === "all" ||
      (activeFilter === "active" && !task.completed) ||
      (activeFilter === "completed" && task.completed);
    return matchesFilter && task.title.toLowerCase().includes(query);
  }).sort((a, b) => {
    if (a.completed !== b.completed) return a.completed ? 1 : -1;
    const rank = { high: 0, medium: 1, low: 2 };
    return rank[a.priority] - rank[b.priority] || b.createdAt - a.createdAt;
  });
}

function renderTasks() {
  taskList.replaceChildren();
  const visibleTasks = getVisibleTasks();
  emptyState.style.display = visibleTasks.length ? "none" : "block";

  if (!visibleTasks.length) {
    const hasAnyTasks = tasks.length > 0;
    emptyState.querySelector("h3").textContent = hasAnyTasks ? "No matching tasks" : "Nothing on your list yet";
    emptyState.querySelector("p").textContent = hasAnyTasks ? "Try another search or filter." : "Add your first task above and make it happen.";
  }

  visibleTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item${task.completed ? " completed" : ""}`;

    const check = document.createElement("button");
    check.className = "check-button";
    check.type = "button";
    check.setAttribute("aria-label", task.completed ? "Mark task as not completed" : "Mark task as completed");
    check.textContent = task.completed ? "✓" : "";
    check.addEventListener("click", () => {
      task.completed = !task.completed;
      saveTasks();
      render();
    });

    const main = document.createElement("div");
    main.className = "task-main";
    const title = document.createElement("span");
    title.className = "task-title";
    title.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    const priority = document.createElement("span");
    priority.className = `priority ${task.priority}`;
    priority.textContent = `${task.priority} priority`;
    const date = document.createElement("span");
    date.className = "task-date";
    date.textContent = `Added ${formatDate(task.createdAt)}`;
    meta.append(priority, date);
    main.append(title, meta);

    const actions = document.createElement("div");
    actions.className = "task-actions";
    const edit = document.createElement("button");
    edit.className = "icon-button";
    edit.type = "button";
    edit.title = "Edit task";
    edit.setAttribute("aria-label", `Edit ${task.title}`);
    edit.textContent = "✎";
    edit.addEventListener("click", () => editTask(task.id));

    const remove = document.createElement("button");
    remove.className = "icon-button delete";
    remove.type = "button";
    remove.title = "Delete task";
    remove.setAttribute("aria-label", `Delete ${task.title}`);
    remove.textContent = "×";
    remove.addEventListener("click", () => {
      tasks = tasks.filter(item => item.id !== task.id);
      saveTasks();
      render();
    });

    actions.append(edit, remove);
    item.append(check, main, actions);
    taskList.append(item);
  });
}

function editTask(id) {
  const task = tasks.find(item => item.id === id);
  if (!task) return;
  const updatedTitle = prompt("Edit your task:", task.title);
  if (updatedTitle === null) return;
  const cleanTitle = updatedTitle.trim();
  if (!cleanTitle) {
    alert("Task name cannot be empty.");
    return;
  }
  task.title = cleanTitle.slice(0, 120);
  const updatedPriority = prompt("Priority: type high, medium, or low", task.priority);
  if (updatedPriority !== null) {
    const normalized = updatedPriority.trim().toLowerCase();
    if (["high", "medium", "low"].includes(normalized)) task.priority = normalized;
  }
  saveTasks();
  render();
}

function render() {
  updateStats();
  renderTasks();
}

taskForm.addEventListener("submit", event => {
  event.preventDefault();
  const title = taskInput.value.trim();
  if (!title) {
    taskInput.focus();
    return;
  }
  tasks.unshift({
    id: createId(),
    title: title.slice(0, 120),
    priority: priorityInput.value,
    completed: false,
    createdAt: Date.now()
  });
  saveTasks();
  taskInput.value = "";
  priorityInput.value = "medium";
  activeFilter = "all";
  filterButtons.forEach(button => button.classList.toggle("active", button.dataset.filter === "all"));
  searchInput.value = "";
  render();
  taskInput.focus();
});

filterButtons.forEach(button => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter;
    filterButtons.forEach(item => item.classList.toggle("active", item === button));
    renderTasks();
  });
});

searchInput.addEventListener("input", renderTasks);

clearCompletedButton.addEventListener("click", () => {
  const completedCount = tasks.filter(task => task.completed).length;
  if (!completedCount) {
    document.getElementById("footerMessage").textContent = "There are no completed tasks to clear yet.";
    return;
  }
  tasks = tasks.filter(task => !task.completed);
  saveTasks();
  render();
});

document.getElementById("todayLabel").textContent = new Date().toLocaleDateString(undefined, {
  weekday: "short", month: "short", day: "numeric"
});

render();
