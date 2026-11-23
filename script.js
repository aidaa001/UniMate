// ==========================================
// UNIMATE — STUDENT ASSISTANT
// Главный JavaScript приложения
// ==========================================


// ==========================================
// 1. СОХРАНЕНИЕ ДАННЫХ
// ==========================================

function saveData(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
}

function loadData(key) {
    try {
        return JSON.parse(localStorage.getItem(key)) || [];
    } catch {
        return [];
    }
}

let tasks = loadData("unimate_tasks");
let schedule = loadData("unimate_schedule");

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, character => {
        const symbols = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return symbols[character];
    });
}


// ==========================================
// 2. ДАТА И ВРЕМЯ
// ==========================================

function updateDate() {
    const dateElement = document.getElementById("currentDate");

    if (!dateElement) return;

    dateElement.textContent = new Date().toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric"
    });
}


// ==========================================
// 3. НАВИГАЦИЯ
// ==========================================

function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => {
        page.classList.remove("active");
    });

    const selectedPage = document.getElementById(pageId);

    if (!selectedPage) return;

    selectedPage.classList.add("active");

    document.querySelectorAll(".nav-link").forEach(link => {
        link.classList.toggle(
            "active",
            link.dataset.page === pageId
        );
    });

    const pageNames = {
        dashboard: "Главная",
        schedule: "Расписание",
        tasks: "Мои задания",
        assistant: "AI-помощник",
        focus: "Фокус-таймер",
        progress: "Мой прогресс"
    };

    const breadcrumb = document.querySelector(".breadcrumb span");

    if (breadcrumb) {
        breadcrumb.textContent = pageNames[pageId] || "Главная";
    }

    document.getElementById("sidebar")?.classList.remove("open");
}

document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});

document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.goto);
    });
});

const menuToggle = document.getElementById("menuToggle");

if (menuToggle) {
    menuToggle.addEventListener("click", () => {
        document.getElementById("sidebar")?.classList.toggle("open");
    });
}


// ==========================================
// 4. ЗАДАНИЯ
// ==========================================

const taskForm = document.getElementById("taskForm");

let activeFilter = "all";

function renderTasks() {
    const dashboardTasks = document.getElementById("dashboardTasks");
    const allTasks = document.getElementById("allTasks");

    if (!dashboardTasks || !allTasks) {
        updateStatistics();
        return;
    }

    dashboardTasks.innerHTML = "";
    allTasks.innerHTML = "";

    const filteredTasks = tasks
        .map((task, index) => ({
            ...task,
            originalIndex: index
        }))
        .filter(task => {
            if (activeFilter === "pending") return !task.completed;
            if (activeFilter === "completed") return task.completed;
            return true;
        });

    if (filteredTasks.length === 0) {
        const message = activeFilter === "completed"
            ? "Пока нет выполненных заданий"
            : activeFilter === "pending"
                ? "Все задания выполнены! 🎉"
                : "Пока нет заданий";

        allTasks.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-clipboard-list"></i>
                <p>${message}</p>
                <span>Добавь новое задание или измени фильтр.</span>
            </div>
        `;
    }

    filteredTasks.forEach(task => {
        allTasks.appendChild(createTaskElement(task));
    });

    tasks.slice(-4).reverse().forEach(task => {
        dashboardTasks.appendChild(
            createTaskElement({
                ...task,
                originalIndex: tasks.indexOf(task)
            }, true)
        );
    });

    updateStatistics();
}

function createTaskElement(task, compact = false) {
    const element = document.createElement("div");

    element.className = "task-item";

    if (task.completed) {
        element.classList.add("completed");
    }

    const priorityNames = {
        normal: "Обычный",
        important: "Важный",
        urgent: "Срочный"
    };

    element.innerHTML = `
        <label>
            <input type="checkbox" ${task.completed ? "checked" : ""}>
            <span>${escapeHTML(task.title)}</span>
        </label>

        <div class="task-actions">
            <small>${escapeHTML(task.date || "Без даты")}</small>

            ${compact ? "" : `
                <span class="task-priority">
                    ${priorityNames[task.priority] || "Обычный"}
                </span>

                <button type="button" class="delete-task">
                    Удалить
                </button>
            `}
        </div>
    `;

    const checkbox = element.querySelector('input[type="checkbox"]');

    checkbox.addEventListener("change", () => {
        tasks[task.originalIndex].completed = checkbox.checked;
        saveData("unimate_tasks", tasks);
        renderTasks();
    });

    const deleteButton = element.querySelector(".delete-task");

    if (deleteButton) {
        deleteButton.addEventListener("click", () => {
            tasks.splice(task.originalIndex, 1);
            saveData("unimate_tasks", tasks);
            renderTasks();
        });
    }

    return element;
}

if (taskForm) {
    taskForm.addEventListener("submit", event => {
        event.preventDefault();

        const title = document.getElementById("taskInput")?.value.trim();
        const date = document.getElementById("taskDate")?.value || "";
        const priority = document.getElementById("taskPriority")?.value || "normal";

        if (!title) return;

        tasks.push({
            id: Date.now(),
            title,
            date,
            priority,
            completed: false
        });

        saveData("unimate_tasks", tasks);
        taskForm.reset();

        activeFilter = "all";
        setActiveFilterButton("all");

        renderTasks();
    });
}


// ==========================================
// 5. ФИЛЬТРЫ ЗАДАНИЙ
// ==========================================

function setActiveFilterButton(filter) {
    document.querySelectorAll(".filter-btn").forEach(button => {
        button.classList.toggle(
            "active",
            button.dataset.filter === filter
        );
    });
}

document.querySelectorAll(".filter-btn").forEach(button => {
    button.addEventListener("click", () => {
        activeFilter = button.dataset.filter;
        setActiveFilterButton(activeFilter);
        renderTasks();
    });
});


// ==========================================
// 6. РАСПИСАНИЕ
// ==========================================

const scheduleForm = document.getElementById("scheduleForm");

function renderSchedule() {
    const list = document.getElementById("scheduleList");

    if (!list) return;

    list.innerHTML = "";

    const days = [
        "Понедельник",
        "Вторник",
        "Среда",
        "Четверг",
        "Пятница",
        "Суббота",
        "Воскресенье"
    ];

    const sortedSchedule = [...schedule].sort((a, b) => {
        const dayDifference = days.indexOf(a.day) - days.indexOf(b.day);

        if (dayDifference !== 0) return dayDifference;

        return (a.time || "").localeCompare(b.time || "");
    });

    if (sortedSchedule.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-calendar"></i>
                <p>Расписание пока пустое</p>
                <span>Добавь своё первое занятие.</span>
            </div>
        `;
        return;
    }

    sortedSchedule.forEach(item => {
        const originalIndex = schedule.indexOf(item);
        const element = document.createElement("div");

        element.className = "schedule-item";

        element.innerHTML = `
            <div class="schedule-info">
                <strong>${escapeHTML(item.name)}</strong>
                <span>${escapeHTML(item.day)}</span>
                <small>${escapeHTML(item.time)}</small>
            </div>

            <button type="button" class="delete-schedule">
                Удалить
            </button>
        `;

        element.querySelector(".delete-schedule").addEventListener("click", () => {
            schedule.splice(originalIndex, 1);
            saveData("unimate_schedule", schedule);
            renderSchedule();
        });

        list.appendChild(element);
    });
}

if (scheduleForm) {
    scheduleForm.addEventListener("submit", event => {
        event.preventDefault();

        const name = document.getElementById("subjectName")?.value.trim();
        const day = document.getElementById("subjectDay")?.value;
        const time = document.getElementById("subjectTime")?.value;

        if (!name || !day || !time) return;

        schedule.push({
            id: Date.now(),
            name,
            day,
            time
        });

        saveData("unimate_schedule", schedule);
        scheduleForm.reset();
        renderSchedule();
    });
}


// ==========================================
// 7. AI-ПОМОЩНИК GEMINI
// ==========================================

// Онлайн-сервер Render
const AI_SERVER = "https://unimate-qgcb.onrender.com/api/chat";

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");

function addMessage(text, type) {
    if (!chatMessages) return;

    const message = document.createElement("div");

    message.className = type === "user"
        ? "message user-message"
        : "message assistant-message";

    const content = document.createElement("div");
    content.className = "message-content";

    // textContent защищает от выполнения HTML-кода
    content.textContent = text;

    message.appendChild(content);
    chatMessages.appendChild(message);

    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}

function showTyping() {
    if (!chatMessages) return null;

    const typing = document.createElement("div");

    typing.className = "message assistant-message typing-message";
    typing.textContent = "UniMate печатает...";

    chatMessages.appendChild(typing);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return typing;
}

async function sendToGemini(question) {
    const typingMessage = showTyping();

    try {
        const response = await fetch(AI_SERVER, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                message: question
            })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(
                data.error || `Ошибка сервера: ${response.status}`
            );
        }

        if (!data.reply) {
            throw new Error("ИИ вернул пустой ответ.");
        }

        if (typingMessage) {
            typingMessage.remove();
        }

        addMessage(data.reply, "assistant");

    } catch (error) {
        if (typingMessage) {
            typingMessage.remove();
        }

        console.error("Ошибка UniMate:", error);

        addMessage(
            "Не удалось получить ответ от ИИ.\n\n" +
            "Причина: " + error.message +
            "\n\nПопробуй отправить сообщение ещё раз.",
            "assistant"
        );
    }
}

if (chatForm && chatInput) {
    chatForm.addEventListener("submit", event => {
        event.preventDefault();

        const question = chatInput.value.trim();

        if (!question) return;

        addMessage(question, "user");

        chatInput.value = "";

        sendToGemini(question);
    });
}

// Кнопки с готовыми примерами вопросов
document.querySelectorAll(".suggestion-btn").forEach(button => {
    button.addEventListener("click", () => {
        const question = button.textContent.trim();

        if (!question || !chatInput || !chatForm) return;

        chatInput.value = question;
        chatForm.requestSubmit();
    });
});


// ==========================================
// 8. ФОКУС-ТАЙМЕР POMODORO
// ==========================================

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;

const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const startTimerButton = document.getElementById("startTimer");
const resetTimerButton = document.getElementById("resetTimer");

function updateTimerDisplay() {
    if (!timerDisplay) return;

    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    timerDisplay.textContent =
        String(minutes).padStart(2, "0") + ":" +
        String(seconds).padStart(2, "0");
}

function updateTimerStatus(text) {
    if (timerStatus) {
        timerStatus.textContent = text;
    }
}

function startTimer() {
    if (timerRunning) {
        clearInterval(timerInterval);
        timerRunning = false;

        if (startTimerButton) {
            startTimerButton.textContent = "Продолжить";
        }

        updateTimerStatus("Таймер на паузе");
        return;
    }

    timerRunning = true;

    if (startTimerButton) {
        startTimerButton.textContent = "Пауза";
    }

    updateTimerStatus("Время сосредоточиться!");

    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            clearInterval(timerInterval);
            timerRunning = false;

            if (startTimerButton) {
                startTimerButton.textContent = "Начать заново";
            }

            updateTimerStatus("Отличная работа! Время отдохнуть 🎉");
        }
    }, 1000);
}

function resetTimer() {
    clearInterval(timerInterval);

    timerSeconds = 25 * 60;
    timerRunning = false;

    updateTimerDisplay();
    updateTimerStatus("Готов к новой сессии?");

    if (startTimerButton) {
        startTimerButton.textContent = "Начать";
    }
}

if (startTimerButton) {
    startTimerButton.addEventListener("click", startTimer);
}

if (resetTimerButton) {
    resetTimerButton.addEventListener("click", resetTimer);
}


// ==========================================
// 9. СТАТИСТИКА И ПРОГРЕСС
// ==========================================

function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    const percent = total > 0
        ? Math.round((completed / total) * 100)
        : 0;

    const elements = {
        totalTasks: total,
        completedTasks: completed,
        pendingTasks: pending,
        progressPercent: percent,
        totalCount: total,
        completedCount: completed,
        pendingCount: pending
    };

    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);

        if (element) {
            element.textContent = value;
        }
    });

    const progressBar = document.getElementById("progressBarFill");

    if (progressBar) {
        progressBar.style.width = percent + "%";
    }

    const progressCircle = document.getElementById("progressCircle");

    if (progressCircle) {
        progressCircle.style.setProperty(
            "--progress",
            percent + "%"
        );

        progressCircle.style.background =
            `conic-gradient(#8b5cf6 ${percent}%, #29243b ${percent}%)`;
    }
}


// ==========================================
// 10. ЗАПУСК ПРИЛОЖЕНИЯ
// ==========================================

function initUniMate() {
    updateDate();

    renderTasks();
    renderSchedule();

    updateTimerDisplay();
    updateStatistics();

    console.log("UniMate успешно запущен!");
}

initUniMate();
