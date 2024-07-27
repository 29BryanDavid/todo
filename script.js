// script.js
class ToDoList {
    constructor() {
        this.tasks = [];
        this.pastTaskDurations = {};
    }

    addTask(task, timeToComplete, category) {
        let timeInMinutes = this.convertToMinutes(timeToComplete);
        const taskNumber = this.tasks.length + 1;
        this.tasks.push({
            taskNumber: taskNumber,
            task: task,
            priority: this.getPriority(task),
            time: timeInMinutes,
            category: category
        });
        this.renderTasks();
    }

    updateTask(index, task, timeToComplete) {
        let timeInMinutes = this.convertToMinutes(timeToComplete);
        this.tasks[index] = {
            ...this.tasks[index],
            task: task,
            time: timeInMinutes
        };
        this.renderTasks();
    }

    removeTask(index) {
        this.tasks.splice(index, 1);
        this.reassignTaskNumbers();
        this.renderTasks();
    }

    reassignTaskNumbers() {
        this.tasks.forEach((task, index) => task.taskNumber = index + 1);
    }

    listTasks() {
        return this.tasks;
    }

    getPriority(task) {
        const lowPriorityKeywords = ['low', 'later', 'someday'];
        const highPriorityKeywords = ['urgent', 'important', 'asap'];

        if (highPriorityKeywords.some(keyword => task.toLowerCase().includes(keyword))) {
            return 'High';
        } else if (lowPriorityKeywords.some(keyword => task.toLowerCase().includes(keyword))) {
            return 'Low';
        } else {
            return 'Normal';
        }
    }

    predictDuration(task) {
        if (this.pastTaskDurations[task]) {
            return this.pastTaskDurations[task];
        }
        return 30;
    }

    sortTasks() {
        return this.tasks.slice().sort((a, b) => {
            const priorityOrder = {'High': 1, 'Normal': 2, 'Low': 3};
            return priorityOrder[a.priority] - priorityOrder[b.priority];
        });
    }

    convertToMinutes(timeString) {
        const [hours, minutes, seconds] = timeString.split(':').map(Number);
        return (hours || 0) * 60 + (minutes || 0) + (seconds || 0) / 60;
    }

    allocateTimeForTasks(totalAvailableTime) {
        const sortedTasks = this.sortTasks();
        const allocatedTasks = [];
        let remainingTime = totalAvailableTime;

        for (const task of sortedTasks) {
            if (remainingTime >= task.time) {
                allocatedTasks.push(task);
                remainingTime -= task.time;
            } else {
                break;
            }
        }

        this.renderTasks(allocatedTasks); // Update render to display allocated tasks
    }

    renderTasks(tasks = this.tasks) {
        const taskList = document.getElementById('task-list');
        taskList.innerHTML = '';

        tasks.forEach((taskInfo, index) => {
            const taskItem = document.createElement('li');
            taskItem.className = 'list-group-item d-flex justify-content-between align-items-center';
            taskItem.innerHTML = `
                <span>Task ${taskInfo.taskNumber}: ${taskInfo.task}, Priority: ${taskInfo.priority}, Time: ${taskInfo.time} min, Category: ${taskInfo.category}</span>
                <button class="btn btn-danger btn-sm" onclick="removeTask(${index})">Remove</button>
                <button class="btn btn-success btn-sm" onclick="startTask(${index})">Start</button>
            `;
            taskList.appendChild(taskItem);
        });
    }

    suggestTaskOrder(totalAvailableTime) {
        const sortedTasks = this.sortTasks();
        const taskOrder = [];
        let totalTime = 0;

        for (const task of sortedTasks) {
            if (totalTime + task.time <= totalAvailableTime) {
                taskOrder.push(task);
                totalTime += task.time;
            }
        }

        return taskOrder;
    }
}

const todoList = new ToDoList();

function addTask() {
    const task = document.getElementById('task').value;
    const timeToComplete = document.getElementById('time').value;
    const category = document.getElementById('category').value;
    todoList.addTask(task, timeToComplete, category);
}

function removeTask(index) {
    todoList.removeTask(index);
}

function allocateTime() {
    const totalAvailableTime = parseFloat(document.getElementById('available-time').value);
    todoList.allocateTimeForTasks(totalAvailableTime);
}

function suggestTasks() {
    const totalAvailableTime = parseFloat(document.getElementById('available-time').value);
    const suggestedTasks = todoList.suggestTaskOrder(totalAvailableTime);
    const suggestionsList = document.getElementById('suggestions-list');
    suggestionsList.innerHTML = '';

    suggestedTasks.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'list-group-item';
        taskItem.textContent = `Task ${task.taskNumber}: ${task.task}, Time: ${task.time} min, Priority: ${task.priority}, Category: ${task.category}`;
        suggestionsList.appendChild(taskItem);
    });
}

function downloadSchedule() {
    const tasks = todoList.listTasks();
    const csvContent = "data:text/csv;charset=utf-8," + tasks.map(task => `${task.taskNumber},${task.task},${task.time},${task.priority},${task.category}`).join("\n");
    const jsonContent = JSON.stringify(tasks, null, 2);

    const csvBlob = new Blob([csvContent], { type: 'text/csv' });
    const jsonBlob = new Blob([jsonContent], { type: 'application/json' });

    const csvUrl = URL.createObjectURL(csvBlob);
    const jsonUrl = URL.createObjectURL(jsonBlob);

    const csvLink = document.createElement('a');
    csvLink.href = csvUrl;
    csvLink.download = 'tasks.csv';
    csvLink.click();

    const jsonLink = document.createElement('a');
    jsonLink.href = jsonUrl;
    jsonLink.download = 'tasks.json';
    jsonLink.click();
}

function startListening() {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.lang = 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        document.getElementById('task').value = transcript;
        addTask();
    };

    recognition.start();
}

function startTask(index) {
    const task = todoList.listTasks()[index];
    let timeRemaining = task.time * 60; // Convert minutes to seconds

    const interval = setInterval(() => {
        if (timeRemaining <= 0) {
            clearInterval(interval);
            alert(`Task ${task.taskNumber} completed!`);
            return;
        }
        timeRemaining--;
        updateTimerDisplay(timeRemaining);
    }, 1000);

    function updateTimerDisplay(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        document.getElementById('timer-display').innerText = `${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }
}
