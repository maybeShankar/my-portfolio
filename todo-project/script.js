const input = document.getElementById("task-input");
const addButton = document.getElementById("add-btn");
const taskList = document.getElementById("task-list");
const taskCount = document.getElementById("task-count");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const emptyMessage = document.getElementById("empty-message");
const clearCompleted = document.getElementById("clear-completed");

const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];

let currentFilter = "all";


function saveTasks() {

    localStorage.setItem("tasks", JSON.stringify(tasks));

}


function displayTasks() {

    taskList.innerHTML = "";

    let visibleTasks = tasks;

    if (visibleTasks.length === 0) {
    emptyMessage.style.display = "block";
} else {
    emptyMessage.style.display = "none";
}

    if (currentFilter === "active") {

        visibleTasks = tasks.filter(function (task) {
            return !task.completed;
        });

    }

    if (currentFilter === "completed") {

        visibleTasks = tasks.filter(function (task) {
            return task.completed;
        });

    }


    visibleTasks.forEach(function (taskData) {

        const task = document.createElement("li");

        if (taskData.completed) {
            task.classList.add("completed");
        }

        task.innerHTML = `
            <span>${taskData.text}</span>
            <button class="delete-btn">🗑️</button>
        `;

        taskList.appendChild(task);


        task.addEventListener("click", function () {

            taskData.completed = !taskData.completed;

            saveTasks();

            displayTasks();

        });


        const deleteButton = task.querySelector(".delete-btn");

        deleteButton.addEventListener("click", function (event) {

            event.stopPropagation();

            const taskIndex = tasks.indexOf(taskData);

            tasks.splice(taskIndex, 1);

            saveTasks();

            displayTasks();

        });

    });


    const remainingTasks = tasks.filter(function (task) {
        return !task.completed;
    });

    taskCount.textContent = remainingTasks.length + " tasks remaining";

    const completedTasks = tasks.filter(function (task) {
    return task.completed;
});

const totalTasks = tasks.length;

let progress = 0;

if (totalTasks > 0) {
    progress = Math.round((completedTasks.length / totalTasks) * 100);
}

progressBar.style.width = progress + "%";

progressText.textContent = progress + "% completed";

}


function addTask() {

    const taskText = input.value.trim();

    if (taskText === "") {
        return;
    }


    tasks.push({
        text: taskText,
        completed: false
    });


    saveTasks();

    input.value = "";

    displayTasks();

}


addButton.addEventListener("click", addTask);


input.addEventListener("keydown", function (event) {

    if (event.key === "Enter") {
        addTask();
    }

});


filterButtons.forEach(function (button) {

    button.addEventListener("click", function () {

        currentFilter = button.dataset.filter;


        filterButtons.forEach(function (btn) {
            btn.classList.remove("active");
        });


        button.classList.add("active");


        displayTasks();

    });

});


displayTasks();
clearCompleted.addEventListener("click", function () {

    tasks = tasks.filter(function (task) {
        return !task.completed;
    });

    saveTasks();

    displayTasks();

});