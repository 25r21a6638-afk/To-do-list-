const taskForm = document.getElementById("task-form");
const taskInput = document.getElementById("task-input");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const emptyMessage = document.getElementById("empty-message");
const clearCompleted = document.getElementById("clear-completed");

let tasks = JSON.parse(localStorage.getItem("myTasks")) || [];

function saveTasks() {
    localStorage.setItem("myTasks", JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = "";

    tasks.forEach(function(task) {
        const li = document.createElement("li");
        li.className = "task-item";

        if (task.completed) {
            li.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = task.completed;
        checkbox.setAttribute("aria-label", "Complete task");

        checkbox.addEventListener("change", function() {
            task.completed = checkbox.checked;
            saveTasks();
            renderTasks();
        });

        const span = document.createElement("span");
        span.className = "task-text";
        span.textContent = task.text;

        const deleteButton = document.createElement("button");
        deleteButton.className = "delete-btn";
        deleteButton.textContent = "Delete";
        deleteButton.type = "button";

        deleteButton.addEventListener("click", function() {
            tasks = tasks.filter(function(item) {
                return item.id !== task.id;
            });
            saveTasks();
            renderTasks();
        });

        li.appendChild(checkbox);
        li.appendChild(span);
        li.appendChild(deleteButton);
        taskList.appendChild(li);
    });

    const remaining = tasks.filter(function(task) {
        return !task.completed;
    }).length;

    taskCount.textContent =
        remaining + (remaining === 1 ? " task remaining" : " tasks remaining");

    emptyMessage.style.display = tasks.length === 0 ? "block" : "none";
}

taskForm.addEventListener("submit", function(event) {
    event.preventDefault();
    const text = taskInput.value.trim();

    if (text === "") return;

    tasks.push({
        id: Date.now() + Math.random(),
        text: text,
        completed: false
    });

    saveTasks();
    renderTasks();
    taskInput.value = "";
    taskInput.focus();
});

clearCompleted.addEventListener("click", function() {
    tasks = tasks.filter(function(task) {
        return !task.completed;
    });
    saveTasks();
    renderTasks();
});

renderTasks();
