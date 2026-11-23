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


// Защита текста от HTML-вставок
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
// 3. ПЕРЕКЛЮЧЕНИЕ СТРАНИЦ
// ==========================================

function showPage(pageId) {
    const pages = document.querySelectorAll(".page");

    pages.forEach(page => {
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


// Боковое меню
document.querySelectorAll(".nav-link").forEach(link => {
    link.addEventListener("click", event => {
        event.preventDefault();
        showPage(link.dataset.page);
    });
});


// Кнопки перехода
document.querySelectorAll("[data-goto]").forEach(button => {
    button.addEventListener("click", () => {
        showPage(button.dataset.goto);
    });
});


// Мобильное меню
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

    if (!dashboardTasks || !allTasks) return;

    dashboardTasks.innerHTML = "";
    allTasks.innerHTML = "";

    // Фильтрация
    const filteredTasks = tasks
        .map((task, index) => ({
            ...task,
            originalIndex: index
        }))
        .filter(task => {
            if (activeFilter === "pending") {
                return !task.completed;
            }

            if (activeFilter === "completed") {
                return task.completed;
            }

            return true;
        });

    // Пустое состояние
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

    // Все задания
    filteredTasks.forEach(task => {
        allTasks.appendChild(createTaskElement(task));
    });

    // Последние 4 задания на главной
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


// Создание карточки задания
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

    // Выполнение задания
    const checkbox = element.querySelector('input[type="checkbox"]');

    checkbox.addEventListener("change", () => {
        tasks[task.originalIndex].completed = checkbox.checked;

        saveData("unimate_tasks", tasks);
        renderTasks();
    });

    // Удаление задания
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


// Добавление задания
if (taskForm) {
    taskForm.addEventListener("submit", event => {
        event.preventDefault();

        const title = document.getElementById("taskInput").value.trim();
        const date = document.getElementById("taskDate").value;
        const priority = document.getElementById("taskPriority").value;

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
        "Суббота"
    ];

    days.forEach(day => {
        const dayItems = schedule
            .map((item, index) => ({
                ...item,
                originalIndex: index
            }))
            .filter(item => item.day === day)
            .sort((a, b) => a.time.localeCompare(b.time));

        if (dayItems.length === 0) return;

        const dayBlock = document.createElement("div");
        dayBlock.className = "schedule-day";

        dayBlock.innerHTML = `<h3>${escapeHTML(day)}</h3>`;

        dayItems.forEach(item => {
            const lesson = document.createElement("div");

            lesson.className = "schedule-item";

            lesson.innerHTML = `
                <div>
                    <strong>${escapeHTML(item.subject)}</strong>
                    <p>${escapeHTML(item.time)}</p>
                </div>

                <button type="button" class="delete-schedule">
                    Удалить
                </button>
            `;

            lesson.querySelector(".delete-schedule").addEventListener("click", () => {
                schedule.splice(item.originalIndex, 1);

                saveData("unimate_schedule", schedule);
                renderSchedule();
            });

            dayBlock.appendChild(lesson);
        });

        list.appendChild(dayBlock);
    });

    if (schedule.length === 0) {
        list.innerHTML = `
            <div class="empty-state">
                <i class="fa-regular fa-calendar"></i>
                <p>Расписание пока пустое</p>
                <span>Добавь своё первое занятие.</span>
            </div>
        `;
    }
}


// Добавление занятия
if (scheduleForm) {
    scheduleForm.addEventListener("submit", event => {
        event.preventDefault();

        const subject = document.getElementById("subjectName").value.trim();
        const day = document.getElementById("subjectDay").value;
        const time = document.getElementById("subjectTime").value;

        if (!subject || !day || !time) return;

        schedule.push({
            subject,
            day,
            time
        });

        saveData("unimate_schedule", schedule);

        scheduleForm.reset();
        renderSchedule();
    });
}


// ==========================================
// 7. AI-ПОМОЩНИК UNIMATE
// ==========================================

const chatForm = document.getElementById("chatForm");
const chatInput = document.getElementById("chatInput");
const chatMessages = document.getElementById("chatMessages");


// Добавление сообщения
function addMessage(text, type) {
    if (!chatMessages) return null;

    const message = document.createElement("div");

    message.className = type === "user"
        ? "message user-message"
        : "message assistant-message";

    if (type === "assistant") {
        message.innerHTML = `
            <div class="message-avatar">
                <i class="fa-solid fa-robot"></i>
            </div>

            <div class="message-content">
                <strong>UniMate</strong>
                <p></p>
            </div>
        `;

        message.querySelector("p").textContent = text;
    } else {
        message.textContent = text;
    }

    chatMessages.appendChild(message);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    return message;
}


// Индикатор ожидания
function showTyping() {
    const message = addMessage("UniMate думает...", "assistant");

    if (message) {
        message.classList.add("typing-message");
    }

    return message;
}


// Настоящий запрос Gemini
async function sendToGemini(question) {
    const typingMessage = showTyping();

    try {
        const response = await fetch("http://localhost:3000/api/chat", {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify({
                message: question
            })
        });

        // Проверяем, получен ли ответ
        if (!response.ok) {
            const errorData = await response.json();

            throw new Error(
                errorData.error || `Ошибка сервера: ${response.status}`
            );
        }

        const data = await response.json();

        if (typingMessage) {
            typingMessage.remove();
        }

        if (!data.reply) {
            addMessage(
                "ИИ не вернул ответ. Попробуй задать вопрос ещё раз.",
                "assistant"
            );

            return;
        }

        addMessage(data.reply, "assistant");

    } catch (error) {
        console.error("Ошибка UniMate AI:", error);

        if (typingMessage) {
            typingMessage.remove();
        }

        addMessage(
            "Не удалось получить ответ от ИИ.\n\nПричина: " +
            error.message +
            "\n\nПроверь, запущен ли сервер UniMate.",
            "assistant"
        );
    }
}


// Отправка сообщения
if (chatForm && chatInput) {
    chatForm.addEventListener("submit", async event => {
        event.preventDefault();

        const question = chatInput.value.trim();

        if (!question) return;

        addMessage(question, "user");

        chatInput.value = "";

        await sendToGemini(question);
    });
}


// Быстрые вопросы
document.querySelectorAll(".suggestion-btn").forEach(button => {
    button.addEventListener("click", () => {
        if (!chatInput || !chatForm) return;

        chatInput.value = button.textContent.trim();

        chatForm.requestSubmit();
    });
});


// ==========================================
// 8. ТАЙМЕР POMODORO
// ==========================================

let timerSeconds = 25 * 60;
let timerInterval = null;
let timerRunning = false;

const timerDisplay = document.getElementById("timerDisplay");
const timerStatus = document.getElementById("timerStatus");
const startTimer = document.getElementById("startTimer");
const resetTimer = document.getElementById("resetTimer");

function updateTimerDisplay() {
    if (!timerDisplay) return;

    const minutes = Math.floor(timerSeconds / 60);
    const seconds = timerSeconds % 60;

    timerDisplay.textContent =
        `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

function stopTimer() {
    clearInterval(timerInterval);

    timerInterval = null;
    timerRunning = false;

    if (startTimer) {
        startTimer.innerHTML = '<i class="fa-solid fa-play"></i> Продолжить';
    }
}

function startCountdown() {
    if (timerRunning) return;

    timerRunning = true;

    if (startTimer) {
        startTimer.innerHTML = '<i class="fa-solid fa-pause"></i> Пауза';
    }

    if (timerStatus) {
        timerStatus.textContent = "Время продуктивности";
    }

    timerInterval = setInterval(() => {
        if (timerSeconds > 0) {
            timerSeconds--;
            updateTimerDisplay();
        } else {
            stopTimer();

            if (timerStatus) {
                timerStatus.textContent = "Время вышло! Сделай перерыв 🎉";
            }

            alert("Время вышло! Отличная работа!");
        }
    }, 1000);
}


// Старт и пауза
if (startTimer) {
    startTimer.addEventListener("click", () => {
        if (timerRunning) {
            stopTimer();
        } else {
            startCountdown();
        }
    });
}


// Сброс
if (resetTimer) {
    resetTimer.addEventListener("click", () => {
        stopTimer();

        const activeTab = document.querySelector(".timer-tab.active");

        timerSeconds = Number(activeTab?.dataset.minutes || 25) * 60;

        updateTimerDisplay();

        if (startTimer) {
            startTimer.innerHTML = '<i class="fa-solid fa-play"></i> Начать';
        }

        if (timerStatus) {
            timerStatus.textContent = "Время продуктивности";
        }
    });
}


// Переключение режимов
document.querySelectorAll(".timer-tab").forEach(button => {
    button.addEventListener("click", () => {
        stopTimer();

        document.querySelectorAll(".timer-tab").forEach(tab => {
            tab.classList.remove("active");
        });

        button.classList.add("active");

        timerSeconds = Number(button.dataset.minutes) * 60;

        updateTimerDisplay();

        if (startTimer) {
            startTimer.innerHTML = '<i class="fa-solid fa-play"></i> Начать';
        }

        if (timerStatus) {
            timerStatus.textContent =
                button.dataset.minutes === "25"
                    ? "Время продуктивности"
                    : "Время отдыха";
        }
    });
});


// ==========================================
// 9. СТАТИСТИКА И ПРОГРЕСС
// ==========================================

function updateStatistics() {
    const total = tasks.length;
    const completed = tasks.filter(task => task.completed).length;
    const pending = total - completed;

    const productivity = total === 0
        ? 0
        : Math.round((completed / total) * 100);

    // Главная страница
    setText("totalTasks", total);
    setText("completedTasks", completed);
    setText("pendingTasks", pending);
    setText("productivity", productivity + "%");

    // Раздел прогресса
    setText("progressTotal", total);
    setText("progressCompleted", completed);
    setText("progressPending", pending);
    setText("progressResult", productivity + "%");

    setText("progressPercent", productivity + "%");
    setText("progressBarText", productivity + "% выполнено");

    // Круговой прогресс
    const circle = document.getElementById("progressCircle");

    if (circle) {
        circle.style.background =
            `conic-gradient(#8b5cf6 ${productivity * 3.6}deg, #29263b 0deg)`;
    }

    // Полоса прогресса
    const bar = document.getElementById("progressBarFill");

    if (bar) {
        bar.style.width = productivity + "%";
    }
}

function setText(id, value) {
    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}


// ==========================================
// 10. ЗАПУСК UNIMATE
// ==========================================

updateDate();
renderTasks();
renderSchedule();
updateTimerDisplay();
updateStatistics();

console.log("UniMate успешно запущен! 💜");