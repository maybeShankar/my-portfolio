// =====================================

// DATA

// =====================================

let subjects = [];

let tasks = [];

let studyHistory = [];

// Study Planner

let studyPlans = [];

// Study streak tracking

let currentStreak = 0;

let bestStreak = 0;

// Daily goal (read from localStorage, default 2 hours)

let dailyGoalSeconds = 2 * 60 * 60;

const dailyGoalSelect = document.getElementById("daily-goal-select");

if (dailyGoalSelect) {

  dailyGoalSelect.value = String(dailyGoalSeconds);

  dailyGoalSelect.addEventListener("change", function () {

    dailyGoalSeconds = Number(this.value);

    localStorage.setItem("studyflowDailyGoal", dailyGoalSeconds);

    updateDailyGoal();

  });

}

// ── Safe localStorage helpers (guard against quota/corruption) ──

function safeLoad(key, fallback) {

  try {

    const raw = localStorage.getItem(key);

    if (raw === null) return fallback;

    return JSON.parse(raw);

  } catch (e) {

    console.warn("localStorage read failed for", key, e);

    return fallback;

  }

}

function safeSave(key, value) {

  try {

    localStorage.setItem(key, JSON.stringify(value));

  } catch (e) {

    console.warn("localStorage write failed for", key, e);

  }

}

// Reload with guards

subjects = safeLoad("studyflowSubjects", []);

tasks = safeLoad("studyflowTasks", []);

studyHistory = safeLoad("studyflowHistory", []);

studyPlans = safeLoad("studyflowStudyPlans", []);

currentStreak = Number(localStorage.getItem("studyflowCurrentStreak")) || 0;

bestStreak = Number(localStorage.getItem("studyflowBestStreak")) || 0;

// If localStorage was wiped, reset streaks cleanly so the UI starts

// from a known-good state (zero) instead of NaN/undefined.

if (!Number.isFinite(currentStreak)) currentStreak = 0;

if (!Number.isFinite(bestStreak)) bestStreak = 0;

// History display elements (declared early so

// displayStudyHistory() can run at initial load)

const studyHistoryList = document.getElementById("study-history");

const totalStudyTime = document.getElementById("total-study-time");

const averageFocusScore = document.getElementById("average-focus-score");

// =====================================

// ELEMENTS

// =====================================

const subjectForm = document.getElementById("subject-form");

const subjectInput = document.getElementById("subject-input");

const subjectList = document.getElementById("subject-list");

const taskForm = document.getElementById("task-form");

const taskInput = document.getElementById("task-input");

const taskSubject = document.getElementById("task-subject");

const taskPriority = document.getElementById("task-priority");

const taskDeadline = document.getElementById("task-deadline");

const taskList = document.getElementById("task-list");

const subjectCount = document.getElementById("subject-count");

const taskCount = document.getElementById("task-count");

const completedCount = document.getElementById("completed-count");

const progressPercent = document.getElementById("progress-percent");

const progressText = document.getElementById("progress-text");

const progressFill = document.getElementById("progress-fill");

const progressMessage = document.getElementById("progress-message");

const notes = document.getElementById("notes");

const saveStatus = document.getElementById("save-status");

const themeToggle = document.getElementById("theme-toggle");

// Planner elements

const plannerForm = document.getElementById("planner-form");

const plannerTopic = document.getElementById("planner-topic");

const plannerSubject = document.getElementById("planner-subject");

const plannerDate = document.getElementById("planner-date");

const plannerTime = document.getElementById("planner-time");

const plannerDuration = document.getElementById("planner-duration");

const plannerPriority = document.getElementById("planner-priority");

const plannerList = document.getElementById("planner-list");

const plannerUpcomingCount = document.getElementById("planner-upcoming-count");

const plannerTodayCount = document.getElementById("planner-today-count");

// Timer subject selector
const timerSubjectSelect = document.getElementById("timer-subject");

// Calendar elements

const calendarPrev = document.getElementById("calendar-prev");

const calendarToday = document.getElementById("calendar-today");

const calendarNext = document.getElementById("calendar-next");

const calendarTitle = document.getElementById("calendar-title");

const studyCalendar = document.getElementById("study-calendar");

const calendarSelectedTitle = document.getElementById("calendar-selected-title");

const calendarSelectedPlans = document.getElementById("calendar-selected-plans");

let calendarViewDate = new Date();

let calendarSelectedDate = formatLocalDateKey(new Date());

// =====================================

// TASK FILTER

// =====================================

let currentFilter = "all";

const filterButtons = document.querySelectorAll(".filter-btn");

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

// =====================================

// SUBJECTS

// =====================================

subjectForm.addEventListener("submit", function (event) {

  event.preventDefault();

  const name = subjectInput.value.trim();

  if (!name) return;

  subjects.push({

    id: Date.now(),

    name: name,

  });

  subjectInput.value = "";

  saveData();

  updateApp();

});

// =====================================

// TASKS

// =====================================

taskForm.addEventListener("submit", function (event) {

  event.preventDefault();

  const text = taskInput.value.trim();

  const subjectId = taskSubject.value;

  const priority = taskPriority.value;

  const deadline = taskDeadline.value;

  if (!text) return;

  tasks.push({

    id: Date.now(),

    text: text,

    subjectId: subjectId,

    priority: priority,

    deadline: deadline,

    completed: false,

  });

  taskInput.value = "";

  taskSubject.value = "";

  taskPriority.value = "medium";

  taskDeadline.value = "";

  saveData();

  updateApp();

});

// =====================================

// DISPLAY SUBJECTS

// =====================================

function displaySubjects() {

  subjectList.innerHTML = "";

  if (subjects.length === 0) {

    subjectList.innerHTML = `<p class="empty-message">

                No subjects added yet.

            </p>`;

    return;

  }

  subjects.forEach(function (subject) {

    const item = document.createElement("div");

    item.className = "subject-item";

    item.innerHTML = `

            <span class="subject-name">

                📚 ${subject.name}

            </span>

            <button

                class="delete-btn"

                onclick="deleteSubject(${subject.id})"

            >

                ✕

            </button>

        `;

    subjectList.appendChild(item);

  });

}

// =====================================

// POPULATE TASK SUBJECTS

// =====================================

function updateTaskSubjects() {

  taskSubject.innerHTML = `

    <option value="">Select subject</option>

  `;

  subjects.forEach(function (subject) {

    const option = document.createElement("option");

    option.value = subject.id;

    option.textContent = subject.name;

    taskSubject.appendChild(option);

  });

}

// =====================================

// DISPLAY TASKS

// =====================================

function displayTasks() {

  taskList.innerHTML = "";

  if (tasks.length === 0) {

    taskList.innerHTML = `

      <p class="empty-message">

        No tasks yet.

      </p>

    `;

    return;

  }

  const filteredTasks = tasks.filter(function (task) {

    if (currentFilter === "active") {

      return !task.completed;

    }

    if (currentFilter === "completed") {

      return task.completed;

    }

    return true;

  });

  if (filteredTasks.length === 0) {

    taskList.innerHTML = `

      <p class="empty-message">

        No ${currentFilter} tasks.

      </p>

    `;

    return;

  }

  filteredTasks.forEach(function (task) {

    const item = document.createElement("div");

    item.className = "task-item";

    const priorityLabel = {

      low: "🟢 Low",

      medium: "🟡 Medium",

      high: "🔴 High",

    };

    let deadlineText = "";

    if (task.deadline) {

      const deadlineDate = new Date(task.deadline + "T00:00:00");

      deadlineText = `

        <span class="task-deadline">

          📅 ${deadlineDate.toLocaleDateString("en-IN")}

        </span>

      `;

    }

    item.innerHTML = `

      <div class="task-left">

        <input

          type="checkbox"

          ${task.completed ? "checked" : ""}

          onchange="toggleTask(${task.id})"

        >

        <div class="task-content">

          <span

            class="${task.completed ? "task-completed" : ""}"

          >

            ${task.text}

          </span>

          <div class="task-meta">

            <span>📚 ${typeof smartGetSubjectName === "function" ? smartGetSubjectName(task.subjectId) : (subjects.find(function(s) { return String(s.id) === String(task.subjectId); }) || {}).name || "General"}</span>

            <span>•</span>

            <span>${priorityLabel[task.priority] || "🟡 Medium"}</span>

            ${deadlineText}

          </div>

        </div>

      </div>

      <button

        class="delete-btn"

        onclick="deleteTask(${task.id})"

      >

        ✕

      </button>

    `;

    taskList.appendChild(item);

  });

}

// =====================================

// DELETE SUBJECT

// =====================================

function deleteSubject(id) {

  subjects = subjects.filter(function (subject) {

    return subject.id !== id;

  });

  saveData();

  updateApp();

}

// =====================================

// DELETE TASK

// =====================================

function deleteTask(id) {

  tasks = tasks.filter(function (task) {

    return task.id !== id;

  });

  saveData();

  updateApp();

}

// =====================================

// COMPLETE TASK

// =====================================

function toggleTask(id) {

  tasks = tasks.map(function (task) {

    if (task.id === id) {

      task.completed = !task.completed;

    }

    return task;

  });

  saveData();

  updateApp();

}

// =====================================

// UPDATE PROGRESS

// =====================================

function updateProgress() {

  const total = tasks.length;

  const completed = tasks.filter(function (task) {

    return task.completed;

  }).length;

  let percentage = 0;

  if (total > 0) {

    percentage = Math.round((completed / total) * 100);

  }

  subjectCount.textContent = subjects.length;

  taskCount.textContent = total;

  completedCount.textContent = completed;

  progressPercent.textContent = percentage + "%";

  progressText.textContent = percentage + "%";

  progressFill.style.width = percentage + "%";

  if (percentage === 0) {

    progressMessage.textContent =

      "Start completing tasks to track your progress.";

  } else if (percentage < 50) {

    progressMessage.textContent = "Good start. Keep going! 💪";

  } else if (percentage < 100) {

    progressMessage.textContent = "You're making great progress! 🔥";

  } else {

    progressMessage.textContent = "All tasks completed. Excellent work! 🎉";

  }

}

// =====================================

// SAVE DATA

// =====================================

function saveData() {

  safeSave("studyflowSubjects", subjects);

  safeSave("studyflowTasks", tasks);

  safeSave("studyflowStudyPlans", studyPlans);

}

// =====================================

// NOTES

// =====================================

notes.value = localStorage.getItem("studyflowNotes") || "";

notes.addEventListener("input", function () {

  localStorage.setItem("studyflowNotes", notes.value);

  saveStatus.textContent = "Saved ✓";

});

// =====================================

// THEME

// =====================================

themeToggle.addEventListener("click", function () {

  document.body.classList.toggle("light");

  const isLight = document.body.classList.contains("light");

  themeToggle.textContent = isLight ? "☀️" : "🌙";

  localStorage.setItem("studyflowTheme", isLight ? "light" : "dark");

});

if (localStorage.getItem("studyflowTheme") === "light") {

  document.body.classList.add("light");

  themeToggle.textContent = "☀️";

}

// =====================================

// STUDY TIMER

// =====================================

let selectedTimerSeconds = 25 * 60;

let timeLeft = selectedTimerSeconds;

let timerInterval = null;

const timerDisplay = document.getElementById("timer");

const startTimer = document.getElementById("start-timer");

const pauseTimer = document.getElementById("pause-timer");

const resetTimer = document.getElementById("reset-timer");

const timerPreset = document.getElementById("timer-preset");

// =====================================

// TIMER DISPLAY

// =====================================

function updateTimerDisplay() {

  const minutes = Math.floor(timeLeft / 60);

  const seconds = timeLeft % 60;

  timerDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}

// =====================================

// BROWSER NOTIFICATIONS

// =====================================

const studyflowNotifications = {

  enabled: localStorage.getItem("studyflowNotifications") === "true",

};

function browserNotificationsSupported() {

  return "Notification" in window;

}

function showStudyNotification(title, options = {}) {

  if (!studyflowNotifications.enabled || !browserNotificationsSupported()) return;

  if (Notification.permission !== "granted") return;

  try {

    new Notification(title, {

      icon: "",

      badge: "",

      ...options,

    });

  } catch (error) {

    console.warn("StudyFlow notification failed", error);

  }

}

async function requestStudyNotifications() {

  if (!browserNotificationsSupported()) {

    alert("Your browser does not support notifications.");

    return;

  }

  if (Notification.permission === "denied") {

    alert("Notifications are blocked for StudyFlow. Allow them in your browser site settings, then try again.");

    return;

  }

  try {

    const permission = await Notification.requestPermission();

    studyflowNotifications.enabled = permission === "granted";

    localStorage.setItem("studyflowNotifications", String(studyflowNotifications.enabled));

    updateNotificationSettingUI();

    if (permission === "granted") {

      showStudyNotification("StudyFlow notifications enabled", {

        body: "You will be notified when important study events happen.",

      });

    }

  } catch (error) {

    console.warn("Notification permission request failed", error);

  }

}

function updateNotificationSettingUI() {

  const button = document.getElementById("enable-notifications");

  const status = document.getElementById("notification-status");

  if (!button || !status) return;

  if (!browserNotificationsSupported()) {

    button.disabled = true;

    button.textContent = "Not Supported";

    status.textContent = "This browser does not support notifications.";

    return;

  }

  if (Notification.permission === "granted" && studyflowNotifications.enabled) {

    button.textContent = "🔔 Notifications On";

    status.textContent = "Session and daily-goal notifications are enabled.";

  } else if (Notification.permission === "denied") {

    button.textContent = "🔕 Notifications Blocked";

    status.textContent = "Allow notifications in your browser site settings.";

  } else {

    button.textContent = "🔔 Enable Notifications";

    status.textContent = "Get a browser alert when important study events happen.";

  }

}

// =====================================

// BELL SOUND

// =====================================

function playBell() {

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const oscillator = audioContext.createOscillator();

  const gainNode = audioContext.createGain();

  oscillator.type = "sine";

  oscillator.frequency.setValueAtTime(880, audioContext.currentTime);

  oscillator.frequency.exponentialRampToValueAtTime(

    660,

    audioContext.currentTime + 0.5,

  );

  gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);

  gainNode.gain.exponentialRampToValueAtTime(

    0.5,

    audioContext.currentTime + 0.02,

  );

  gainNode.gain.exponentialRampToValueAtTime(

    0.001,

    audioContext.currentTime + 1.2,

  );

  oscillator.connect(gainNode);

  gainNode.connect(audioContext.destination);

  oscillator.start();

  oscillator.stop(audioContext.currentTime + 1.2);

  // Second bell tone

  setTimeout(function () {

    const oscillator2 = audioContext.createOscillator();

    const gainNode2 = audioContext.createGain();

    oscillator2.type = "sine";

    oscillator2.frequency.value = 660;

    gainNode2.gain.setValueAtTime(0.001, audioContext.currentTime);

    gainNode2.gain.exponentialRampToValueAtTime(

      0.4,

      audioContext.currentTime + 0.02,

    );

    gainNode2.gain.exponentialRampToValueAtTime(

      0.001,

      audioContext.currentTime + 1,

    );

    oscillator2.connect(gainNode2);

    gainNode2.connect(audioContext.destination);

    oscillator2.start();

    oscillator2.stop(audioContext.currentTime + 1);

  }, 350);

}

// =====================================

// TIMER PRESETS

// =====================================

timerPreset.addEventListener("change", function () {

  if (timerInterval !== null) {

    return;

  }

  selectedTimerSeconds = Number(this.value);

  timeLeft = selectedTimerSeconds;

  updateTimerDisplay();

});

// =====================================

// START TIMER

// =====================================

startTimer.addEventListener("click", function () {

  if (timerInterval !== null) return;

  // Start the Focus Monitor automatically with the study timer.

  if (focusRunning && focusPaused) {

    focusPaused = false;

    // Pause nulled focusStartTime so updateFocusTime stopped accumulating.

    // Restore it now so the next tick folds in the gap and time resumes.

    focusStartTime = Date.now();

    clearInterval(focusTimerInterval);

    focusTimerInterval = setInterval(updateFocusTime, 1000);

    focusStatus.textContent = "🟢 Face detected • Focus active";

    lastVideoTime = -1;

    detectFace();

    // Show the accumulated focus time immediately instead of waiting

    // for the next 1-second tick.

    updateFocusTime();

  } else if (!focusRunning && studyflowSettings.autoMonitor) {

    // Kick off the Focus Monitor only when Auto-start is enabled.

    startFocus.click();

  }

  timerInterval = setInterval(function () {

    timeLeft--;

    updateTimerDisplay();

    // Timer finished

    if (timeLeft <= 0) {

      timeLeft = 0;

      clearInterval(timerInterval);

      timerInterval = null;

      updateTimerDisplay();

      playBell();

      showStudyNotification("Study session complete 🎉", {

        body: "Great work! Your study session has finished.",

      });

      // Capture Focus Monitor stats BEFORE stopFocus resets them.

      const sessionDuration = focusTimeDisplay

        ? focusTimeDisplay.textContent

        : "00:00";

      const sessionScore = focusScoreDisplay

        ? focusScoreDisplay.textContent

        : "100%";

      const sessionEyeWarnings = eyeWarningsDisplay

        ? eyeWarningsDisplay.textContent

        : "0";

      const sessionFaceLost = faceLostDisplay

        ? faceLostDisplay.textContent

        : "0";

      // Finish the linked Focus Monitor session.

      if (focusRunning && stopFocus) {

        stopFocus.click();

      }

      // Build the session type label from the active preset.

      const presetLabel = (timerPreset && timerPreset.options

        ? timerPreset.options[timerPreset.selectedIndex]

        : null)

        ? timerPreset.options[timerPreset.selectedIndex].textContent

          .replace(/^\d+\s*min\s*—\s*/, "")

        : "Study Session";

      // Pick a message based on focus score.

      const rawScore = parseInt(sessionScore, 10);

      let message =

        "Great work — you completed your study session.";

      if (!isNaN(rawScore)) {

        if (rawScore >= 90) {

          message =

            "Excellent focus! You were fully in the zone. 🔥";

        } else if (rawScore >= 70) {

          message =

            "Good session. Every focused minute counts. 💪";

        } else if (rawScore >= 50) {

          message =

            "Decent session — try resting your eyes a bit more next time.";

        } else {

          message =

            "Session done — aim for more face time next round.";

        }

      }

      // Show the session complete popup.

      setTimeout(function () {

        const modal = document.getElementById("session-modal");

        if (!modal) return;

        const durationEl = document.getElementById("modal-duration");

        const typeEl = document.getElementById("modal-type");

        const scoreEl = document.getElementById("modal-score");

        const eyeEl = document.getElementById("modal-eye-warnings");

        const faceEl = document.getElementById("modal-face-lost");

        const msgEl = document.getElementById("modal-message");

        if (durationEl) durationEl.textContent = sessionDuration;

        if (typeEl) typeEl.textContent = presetLabel;

        if (scoreEl) scoreEl.textContent = sessionScore;

        if (eyeEl) eyeEl.textContent = sessionEyeWarnings;

        if (faceEl) faceEl.textContent = sessionFaceLost;

        if (msgEl) msgEl.textContent = message;

        modal.classList.add("show");

      }, 300);

    }

  }, 1000);

});

// =====================================

// PAUSE TIMER

// =====================================

pauseTimer.addEventListener("click", function () {

  if (timerInterval === null) return;

  clearInterval(timerInterval);

  timerInterval = null;

  // Freeze the focus clock. Capture the pause moment so the

  // next tick can fold in the paused gap without losing anything.

  if (focusRunning && !focusPaused) {

    focusPaused = true;

    clearInterval(focusTimerInterval);

    focusTimerInterval = null;

    focusStatus.textContent = "⏸️ Monitor paused";

    // Pause the display update. Fold in the partial second since the

    // last tick, then clear focusStartTime so saveStudySession doesn't

    // later count the pause gap as active time.

    if (focusStartTime) {

      focusElapsedMs += Date.now() - focusStartTime;

      focusStartTime = null;

    }

  }

});

// =====================================

// RESET TIMER

// =====================================

resetTimer.addEventListener("click", function () {

  clearInterval(timerInterval);

  timerInterval = null;

  timeLeft = selectedTimerSeconds;

  updateTimerDisplay();

  // Reset the linked monitor without saving this unfinished session.

  if (focusRunning) {

    focusRunning = false;

    focusPaused = false;

    clearInterval(focusTimerInterval);

    focusTimerInterval = null;

    if (focusStream) {

      focusStream.getTracks().forEach(function (track) {

        track.stop();

      });

      focusStream = null;

    }

    focusCamera.srcObject = null;

    focusCamera.style.display = "none";

    cameraPlaceholder.style.display = "flex";

    focusStatus.textContent = "⚪ Monitor is off";

    focusTimeDisplay.textContent = "00:00";

    eyeWarningsDisplay.textContent = "0";

    faceLostDisplay.textContent = "0";

    focusScoreDisplay.textContent = "100%";

    eyeWarningCount = 0;

    faceLostCount = 0;

    lastFaceDetected = true;

    lastVideoTime = -1;

    focusElapsedMs = 0;

    focusStartTime = null;

  }

});

// =====================================

// INITIAL TIMER DISPLAY

// =====================================

updateTimerDisplay();

// =====================================

// UPDATE EVERYTHING

function updateApp() {

  displaySubjects();

  updateTaskSubjects();

  displayTasks();

  updateProgress();

  displayStudyPlans();

  populateTimerSubjectSelect();

  populateExamSubjectSelect();

  populatePlannerSubjectSelect();

}

// =====================================
// STUDY PLANNER
// =====================================

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, function (char) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char];
  });
}

function displayStudyPlans() {
  if (!plannerList) return;

  const now = new Date();
  const todayKey = formatLocalDateKey(now);
  const nowKey = `${todayKey}T${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;

  const sorted = [...studyPlans].sort(function (a, b) {
    return `${a.date}T${a.time || "00:00"}`.localeCompare(`${b.date}T${b.time || "00:00"}`);
  });

  const upcoming = sorted.filter(function (plan) {
    return !plan.completed && `${plan.date}T${plan.time || "23:59"}` >= nowKey;
  });

  const today = sorted.filter(function (plan) {
    return plan.date === todayKey && !plan.completed;
  });

  if (plannerUpcomingCount) plannerUpcomingCount.textContent = `${upcoming.length}`;
  if (plannerTodayCount) plannerTodayCount.textContent = `${today.length}`;

  if (sorted.length === 0) {
    plannerList.innerHTML = `<p class="empty-message">No study plans yet.</p>`;
    return;
  }

  const priorityLabel = { low: "\ud83c\udf53 Low", media: "\ud83c\udf52 Medium", high: "\ud83d\udd34 High" };

  plannerList.innerHTML = sorted.map(function (plan) {
    const subject = subjects.find(function (item) {
      return String(item.id) === String(plan.subjectId);
    });
    const subjectName = subject ? subject.name : "General";
    const isToday = plan.date === todayKey;
    const isPast = !plan.completed && `${plan.date}T${plan.time || "23:59"}` < nowKey;

    const priorityEmoji = plan.priority === "low" ? "\ud83c\udf53" : plan.priority === "high" ? "\ud83d\udd34" : "\ud83c\udf52";

    return `
      <div class="planner-item ${plan.completed ? "planner-completed" : ""} ${isPast ? "planner-past" : ""}">
        <div class="planner-item-content">
          <strong>${escapeHtml(plan.topic)}</strong>
          <div class="planner-meta">
            <span>📚 ${escapeHtml(subjectName)}</span>
            <span>⏱️ ${plan.duration} min</span>
            <span>${priorityEmoji} ${plan.priority}</span>
            ${isToday ? "<span>📅 TODAY</span>" : ""}
            ${isPast ? "<span class=\"planner-overdue\">⚠️ OVERDUE</span>" : ""}
          </div>
        </div>
        <div class="planner-actions">
          <button type="button" class="planner-done-btn" onclick="toggleStudyPlan(${plan.id})">${plan.completed ? "↩️ Undo" : "✅ Done"}</button>
          <button type="button" class="delete-btn" onclick="deleteStudyPlan(${plan.id})">🗑️</button>
        </div>
      </div>`;
  }).join("");
}

function toggleStudyPlan(id) {
  studyPlans = studyPlans.map(function (plan) {
    if (plan.id === id) plan.completed = !plan.completed;
    return plan;
  });
  saveData();
  displayStudyPlans();
}

function deleteStudyPlan(id) {
  studyPlans = studyPlans.filter(function (plan) {
    return plan.id !== id;
  });
  saveData();
  displayStudyPlans();
}

if (plannerForm) {
  plannerForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const topic = plannerTopic.value.trim();
    if (!topic || !plannerDate.value || !plannerTime.value) return;

    const selectedSubject = subjects.find(function (subject) {
      return String(subject.id) === String(plannerSubject.value);
    });

    studyPlans.push({
      id: Date.now(),
      topic: topic,
      subjectId: plannerSubject.value || "",
      subjectName: selectedSubject ? selectedSubject.name : "General",
      date: plannerDate.value,
      time: plannerTime.value,
      duration: Number(plannerDuration.value) || 25,
      priority: plannerPriority.value || "medium",
      completed: false,
      createdAt: new Date().toISOString(),
    });

    saveData();
    plannerTopic.value = "";
    plannerSubject.value = "";
    plannerDuration.value = "25";
    plannerPriority.value = "medium";
    displayStudyPlans();
  });
}

plannerDate.value = formatLocalDateKey(new Date());




// Helper: safe wrapper for planner storage (alias so smart features find it)
function plannerItemsSafe() {
  try {
    return JSON.parse(localStorage.getItem("studyflowStudyPlans") || "[]");
  } catch { return []; }
}

// Helper: get subject name by id
function smartGetSubjectName(subjectId) {
  if (!subjectId) return "General";
  const s = subjects.find(function (item) {
    return String(item.id) === String(subjectId);
  });
  return s ? s.name : "General";
}

// Helper: days until a date string (YYYY-MM-DD)
function smartDaysUntil(dateStr) {
  if (!dateStr) return 999;
  const target = new Date(dateStr + "T12:00:00");
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.floor((target - now) / 86400000);
}

// Helper: YYYY-MM-DD from a Date
function smartDateKey(date) {
  return formatLocalDateKey(date);
}

// Storage key for exams
var SMART_EXAM_KEY = "studyflowExams";

// Exams array
var exams = [];

function smartSaveExams() {
  try { localStorage.setItem(SMART_EXAM_KEY, JSON.stringify(exams)); } catch (e) {}
}

function loadExams() {
  try {
    const raw = localStorage.getItem(SMART_EXAM_KEY);
    exams = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(exams)) exams = [];
  } catch (e) { exams = []; }
}

// =====================================
// STUDY CALENDAR VIEW
// =====================================

function calendarMonthLabel(date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function getPlansForDate(dateKey) {
  return studyPlans
    .filter(function (plan) {
      return plan.date === dateKey;
    })
    .sort(function (a, b) {
      return String(a.time || "00:00").localeCompare(String(b.time || "00:00"));
    });
}

function renderStudyCalendar() {
  if (!studyCalendar) return;

  const year = calendarViewDate.getFullYear();
  const month = calendarViewDate.getMonth();
  const todayKey = formatLocalDateKey(new Date());

  if (calendarTitle) {
    calendarTitle.textContent = calendarMonthLabel(calendarViewDate);
  }

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const previousMonthDays = new Date(year, month, 0).getDate();

  let cells = "";

  // Leading days from previous month.
  for (let i = firstDay - 1; i >= 0; i--) {
    const day = previousMonthDays - i;
    cells += `<button type="button" class="calendar-day calendar-other-month" disabled>${day}</button>`;
  }

  for (let day = 1; day <= daysInMonth; day++) {
    const dateKey = formatLocalDateKey(new Date(year, month, day));
    const plans = getPlansForDate(dateKey);
    const completedCount = plans.filter(function (plan) { return plan.completed; }).length;
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === calendarSelectedDate;

    let planDots = "";
    if (plans.length > 0) {
      const visible = plans.slice(0, 3);
      planDots = `<div class="calendar-plan-dots">${
        visible.map(function (plan) {
          return `<span class="calendar-plan-dot ${plan.completed ? "done" : ""}" title="${escapeHtml(plan.topic)}"></span>`;
        }).join("")
      }${plans.length > 3 ? `<span class="calendar-more">+${plans.length - 3}</span>` : ""}</div>`;
    }

    const countLabel = plans.length > 0
      ? `<span class="calendar-plan-count">${completedCount}/${plans.length}</span>`
      : "";

    cells += `
      <button type="button"
        class="calendar-day ${isToday ? "calendar-today" : ""} ${isSelected ? "calendar-selected-day" : ""} ${plans.length ? "has-plans" : ""}"
        data-calendar-date="${dateKey}">
        <span class="calendar-day-number">${day}</span>
        ${countLabel}
        ${planDots}
      </button>`;
  }

  // Trailing days to complete the final week.
  const totalCells = firstDay + daysInMonth;
  const trailing = (7 - (totalCells % 7)) % 7;
  for (let day = 1; day <= trailing; day++) {
    cells += `<button type="button" class="calendar-day calendar-other-month" disabled>${day}</button>`;
  }

  studyCalendar.innerHTML = cells;

  studyCalendar.querySelectorAll("[data-calendar-date]").forEach(function (button) {
    button.addEventListener("click", function () {
      calendarSelectedDate = button.getAttribute("data-calendar-date");
      renderStudyCalendar();
      renderSelectedCalendarPlans();
    });
  });

  renderSelectedCalendarPlans();
}

function renderSelectedCalendarPlans() {
  if (!calendarSelectedTitle || !calendarSelectedPlans) return;

  const selected = new Date(calendarSelectedDate + "T12:00:00");
  const plans = getPlansForDate(calendarSelectedDate);

  calendarSelectedTitle.textContent = selected.toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric"
  });

  if (plans.length === 0) {
    calendarSelectedPlans.innerHTML = `<p class="empty-message">No study plans for this date.</p>`;
    return;
  }

  calendarSelectedPlans.innerHTML = plans.map(function (plan) {
    const subject = subjects.find(function (item) {
      return String(item.id) === String(plan.subjectId);
    });
    const subjectName = subject ? subject.name : "General";
    const priorityEmoji = plan.priority === "low" ? "\ud83c\udf53" : plan.priority === "high" ? "\ud83d\udd34" : "\ud83c\udf52";

    return `
      <div class="calendar-plan-row ${plan.completed ? "calendar-plan-completed" : ""}">
        <div>
          <strong>${escapeHtml(plan.topic)}</strong>
          <div class="calendar-plan-meta">
            <span>🕒 ${escapeHtml(plan.time || "Any time")}</span>
            <span>⏱️ ${plan.duration} min</span>
            <span>📚 ${escapeHtml(subjectName)}</span>
            <span>${priorityEmoji} ${escapeHtml(plan.priority || "medium")}</span>
          </div>
        </div>
        <button type="button" class="planner-done-btn" onclick="toggleStudyPlan(${plan.id})">
          ${plan.completed ? "↩️ Undo" : "✅ Done"}
        </button>
      </div>`;
  }).join("");
}

function shiftCalendarMonth(amount) {
  calendarViewDate = new Date(
    calendarViewDate.getFullYear(),
    calendarViewDate.getMonth() + amount,
    1
  );
  renderStudyCalendar();
}

if (calendarPrev) {
  calendarPrev.addEventListener("click", function () {
    shiftCalendarMonth(-1);
  });
}

if (calendarNext) {
  calendarNext.addEventListener("click", function () {
    shiftCalendarMonth(1);
  });
}

if (calendarToday) {
  calendarToday.addEventListener("click", function () {
    const now = new Date();
    calendarViewDate = new Date(now.getFullYear(), now.getMonth(), 1);
    calendarSelectedDate = formatLocalDateKey(now);
    renderStudyCalendar();
  });
}




// =====================================
// SMART STUDY RECOMMENDATIONS
// =====================================

function renderSmartRecommendations() {
  const box = document.getElementById("study-recommendations");
  if (!box) return;

  const today = formatLocalDateKey(new Date());
  const candidates = [];

  tasks.filter(function (t) { return !t.completed; }).forEach(function (t) {
    const days = t.deadline ? smartDaysUntil(t.deadline) : 999;
    let score = t.priority === "high" ? 30 : t.priority === "medium" ? 20 : 10;
    const matchingExam = exams.find(function (exam) {
      return exam.subjectId && t.subjectId && String(exam.subjectId) === String(t.subjectId);
    });
    if (matchingExam) {
      const examDays = smartDaysUntil(matchingExam.date);
      if (examDays < 0) score += 45;
      else if (examDays === 0) score += 40;
      else if (examDays <= 2) score += 30;
      else if (examDays <= 7) score += 15;
    }
    if (days < 0) score += 50;
    else if (days === 0) score += 40;
    else if (days <= 2) score += 30;
    else if (days <= 7) score += 15;
    candidates.push({
      score: score,
      title: t.text,
      subject: smartGetSubjectName(t.subjectId),
      meta: t.deadline ? "Deadline: " + t.deadline : "No deadline",
      reason: days < 0 ? "Overdue — give this immediate attention." :
              days === 0 ? "Due today — this should be your next priority." :
              days <= 2 ? "Deadline is very close." :
              t.priority === "high" ? "High priority active task." : "Good candidate for your next session.",
      level: t.priority
    });
  });

  plannerItemsSafe().filter(function (p) { return !p.completed; }).forEach(function (p) {
    const days = smartDaysUntil(p.date);
    let score = p.priority === "high" ? 28 : p.priority === "medium" ? 18 : 8;
    if (p.date === today) score += 45;
    else if (days <= 2) score += 25;
    candidates.push({
      score: score,
      title: p.topic,
      subject: smartGetSubjectName(p.subjectId),
      meta: p.date + " at " + (p.time || "Any time") + " • " + p.duration + " min",
      reason: p.date === today ? "Planned for today." : "Upcoming planned study session.",
      level: p.priority
    });
  });

  candidates.sort(function (a, b) { return b.score - a.score; });
  const top = candidates.slice(0, 5);

  if (!top.length) {
    box.innerHTML = '<p class="empty-message">Nothing urgent right now. Add a task or study plan.</p>';
    return;
  }

  box.innerHTML = top.map(function (x, i) {
    return '<div class="recommendation-item priority-' + x.level + '">' +
      '<div>' +
        '<strong>' + (i + 1) + '. ' + escapeHtml(x.title) + '</strong>' +
        '<div class="recommendation-meta">' +
          '<span>📚 ' + escapeHtml(x.subject) + '</span>' +
          '<span>' + escapeHtml(x.meta) + '</span>' +
        '</div>' +
        '<div class="recommendation-reason">💡 ' + escapeHtml(x.reason) + '</div>' +
      '</div>' +
      '<strong>Score ' + x.score + '</strong>' +
    '</div>';
  }).join("");
}

// =====================================
// SUBJECT PERFORMANCE
// =====================================

function getSubjectStats() {
  const stats = [];
  subjects.forEach(function (subj) {
    const completedTasks = tasks.filter(function (t) {
      return t.subjectId && String(t.subjectId) === String(subj.id) && t.completed;
    }).length;
    const totalTasks = tasks.filter(function (t) {
      return t.subjectId && String(t.subjectId) === String(subj.id);
    }).length;
    const sessionSeconds = studyHistory.filter(function (s) {
      return s.subjectId && String(s.subjectId) === String(subj.id);
    }).reduce(function (sum, s) { return sum + Number(s.duration || 0); }, 0);
    stats.push({
      name: subj.name,
      id: subj.id,
      tasks: totalTasks,
      completed: completedTasks,
      minutes: Math.round(sessionSeconds / 60),
      scoreTotal: 0,
      scoreCount: 0
    });
  });
  // Aggregate focus scores from studyHistory
  studyHistory.forEach(function (s) {
    const subj = subjects.find(function (item) {
      return item.id === s.subjectId;
    });
    if (subj && s.focusScore) {
      const entry = stats.find(function (x) { return x.id === subj.id; });
      if (entry) {
        entry.scoreTotal += Number(s.focusScore);
        entry.scoreCount += 1;
      }
    }
  });
  return stats;
}

function renderSubjectPerformance() {
  const box = document.getElementById("subject-performance");
  const highlights = document.getElementById("subject-highlights");
  if (!box || !highlights) return;

  const stats = getSubjectStats();
  if (!stats.length) {
    box.innerHTML = '<p class="empty-message">Add subjects to see subject performance.</p>';
    highlights.innerHTML = "";
    return;
  }

  box.innerHTML = stats.map(function (s) {
    const completion = s.tasks ? Math.round(s.completed / s.tasks * 100) : 0;
    const focus = s.scoreCount ? Math.round(s.scoreTotal / s.scoreCount) : 0;
    return '<div class="performance-item">' +
      '<strong>📚 ' + escapeHtml(s.name) + '</strong>' +
      '<div class="performance-stats">' +
        '<span>Tasks<strong>' + s.completed + '/' + s.tasks + '</strong></span>' +
        '<span>Completion<strong>' + completion + '%</strong></span>' +
        '<span>Focus<strong>' + focus + '%</strong></span>' +
      '</div>' +
    '</div>';
  }).join("");

  const ranked = stats.slice().sort(function (a, b) {
    const ac = a.tasks ? a.completed / a.tasks : 0;
    const bc = b.tasks ? b.completed / b.tasks : 0;
    return bc - ac;
  });
  const strongest = ranked[0];
  const weakest = ranked[ranked.length - 1];
  highlights.innerHTML =
    '<div class="insight-pill">💪 Strongest: <strong>' + escapeHtml(strongest.name) + '</strong></div>' +
    '<div class="insight-pill">🎯 Needs attention: <strong>' + escapeHtml(weakest.name) + '</strong></div>';
}

// =====================================
// SMART STREAK & CONSISTENCY
// =====================================

function renderSmartConsistency() {
  const current = document.getElementById("smart-current-streak");
  const best = document.getElementById("smart-best-streak");
  const consistency = document.getElementById("smart-consistency");
  const missed = document.getElementById("smart-missed-days");
  const message = document.getElementById("consistency-message");
  if (!current || !best || !consistency || !missed) return;

  const dates = new Set(studyHistory.map(function (s) { return formatLocalDateKey(new Date(s.date)); }));
  const today = new Date();
  const first = studyHistory.length
    ? new Date(Math.min.apply(null, studyHistory.map(function (s) { return new Date(s.date).getTime(); })))
    : today;
  const start = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  const todayKey = formatLocalDateKey(today);
  const studiedToday = dates.has(todayKey);
  const end = studiedToday
    ? new Date(today.getFullYear(), today.getMonth(), today.getDate())
    : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const totalDays = end >= start ? Math.max(1, Math.floor((end - start) / 86400000) + 1) : 1;
  const studiedDays = studiedToday ? dates.size : Array.from(dates).filter(function (d) { return d !== todayKey; }).length;
  const missedDays = Math.max(0, totalDays - studiedDays);
  const consistencyPct = Math.round(studiedDays / totalDays * 100);

  if (typeof computeStreaks === "function") computeStreaks();

  function dayLabel(value) { return Number(value) === 1 ? "day" : "days"; }
  current.textContent = (Number(currentStreak || 0)) + " " + dayLabel(currentStreak);
  best.textContent = (Number(bestStreak || 0)) + " " + dayLabel(bestStreak);
  consistency.textContent = consistencyPct + "%";
  missed.textContent = missedDays;

  // Today check
  if (studiedToday) {
    message.textContent = "You studied today — great consistency! 🔥";
  } else if (missedDays === 0 && studiedDays > 0) {
    message.textContent = "Not yet today, but you haven't missed any days. Keep it up!";
  } else if (missedDays <= 2) {
    message.textContent = "Only " + missedDays + " day(s) missed. Easy to get back on track.";
  } else {
    message.textContent = "You've missed " + missedDays + " day(s). Even 10 minutes counts — start again!";
  }
}

// =====================================
// EXAM / DEADLINE MODE
// =====================================

function renderExams() {
  const list = document.getElementById("exam-list");
  const select = document.getElementById("exam-subject");
  if (!list || !select) return;

  // Populate subject dropdown
  const current = select.value;
  select.innerHTML = '<option value="">All subjects</option>' +
    subjects.map(function (s) {
      return '<option value="' + s.id + '">' + escapeHtml(s.name) + '</option>';
    }).join("");
  select.value = current;

  if (!exams.length) {
    list.innerHTML = '<p class="empty-message">No exams or deadlines added.</p>';
    return;
  }

  exams.sort(function (a, b) { return a.date.localeCompare(b.date); });
  list.innerHTML = exams.map(function (exam) {
    const days = smartDaysUntil(exam.date);
    const countdown = days < 0 ? Math.abs(days) + " day(s) overdue" :
                      days === 0 ? "Today" :
                      days + " day(s) left";
    const cls = days < 0 ? "exam-overdue" : days <= 3 ? "exam-soon" : "exam-safe";
    const subject = exam.subjectId ? smartGetSubjectName(exam.subjectId) : "All subjects";
    const related = plannerItemsSafe().filter(function (p) {
      return p.date <= exam.date && (!exam.subjectId || String(p.subjectId) === String(exam.subjectId));
    }).length;
    return '<div class="exam-item ' + cls + '">' +
      '<div>' +
        '<strong>🎯 ' + escapeHtml(exam.title) + '</strong>' +
        '<div class="exam-meta">' +
          '<span>📅 ' + escapeHtml(exam.date) + '</span>' +
          '<span>📚 ' + escapeHtml(subject) + '</span>' +
          '<span>📌 ' + related + ' related plan(s)</span>' +
        '</div>' +
      '</div>' +
      '<div class="exam-countdown">' + escapeHtml(countdown) + '</div>' +
      '<div class="exam-actions"><button type="button" onclick="deleteSmartExam(' + exam.id + ')">🗑️</button></div>' +
    '</div>';
  }).join("");
}

function deleteSmartExam(id) {
  exams = exams.filter(function (e) { return e.id !== id; });
  smartSaveExams();
  renderExams();
  renderSmartRecommendations();
}

// =====================================
// SMART DAILY PLAN
// =====================================

function formatTimePrev(timeStr) {
  // Convert "HH:MM" to "H:MM AM/PM"
  const parts = timeStr.split(":");
  if (parts.length !== 2) return timeStr;
  const h = Number(parts[0]);
  const m = parts[1];
  if (isNaN(h)) return timeStr;
  const ampm = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return h12 + ":" + m + " " + ampm;
}

function generateSmartDailyPlan() {
  const box = document.getElementById("smart-daily-plan");
  if (!box) return;

  const today = formatLocalDateKey(new Date());
  const allPlans = plannerItemsSafe().filter(function (p) {
    return p.date === today && !p.completed;
  });

  const activeTasks = tasks.filter(function (t) { return !t.completed; });
  const stats = typeof getSubjectStats === "function" ? getSubjectStats() : [];
  const statById = {};
  stats.forEach(function (s) { statById[String(s.id)] = s; });

  function priorityWeight(value) {
    return value === "high" ? 45 : value === "medium" ? 28 : 14;
  }

  function taskScore(task) {
    let score = priorityWeight(task.priority);
    const days = task.deadline ? smartDaysUntil(task.deadline) : 999;

    if (days < 0) score += 70;
    else if (days === 0) score += 60;
    else if (days <= 2) score += 45;
    else if (days <= 7) score += 25;
    else if (days <= 14) score += 10;

    // Subjects with unfinished work get a small boost.
    const subjectStat = task.subjectId ? statById[String(task.subjectId)] : null;
    if (subjectStat) {
      const completion = subjectStat.tasks ? subjectStat.completed / subjectStat.tasks : 0;
      score += Math.round((1 - completion) * 20);
    }

    // Exams/deadlines make related subjects more urgent.
    exams.forEach(function (exam) {
      const sameSubject = exam.subjectId && task.subjectId && String(exam.subjectId) === String(task.subjectId);
      if (!sameSubject) return;
      const examDays = smartDaysUntil(exam.date);
      if (examDays < 0) score += 60;
      else if (examDays === 0) score += 55;
      else if (examDays <= 3) score += 45;
      else if (examDays <= 7) score += 25;
      else if (examDays <= 14) score += 10;
    });

    return score;
  }

  const rankedTasks = activeTasks.slice().sort(function (a, b) {
    return taskScore(b) - taskScore(a);
  });

  function timeToMinutes(value) {
    if (!value) return null;
    const parts = String(value).split(":");
    if (parts.length !== 2) return null;
    const h = Number(parts[0]);
    const m = Number(parts[1]);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
    return h * 60 + m;
  }

  function formatTime(minutes) {
    const total = minutes % (24 * 60);
    const h = Math.floor(total / 60);
    const m = total % 60;
    const ampm = h >= 12 ? "PM" : "AM";
    const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
    return h12 + ":" + String(m).padStart(2, "0") + " " + ampm;
  }

  function durationForTask(task) {
    if (task.priority === "high") return 45;
    if (task.priority === "medium") return 35;
    return 25;
  }

  // Keep manually planned items at their requested times.
  const fixed = allPlans.map(function (p) {
    const start = timeToMinutes(p.time) ?? 18 * 60;
    const duration = Math.max(10, Number(p.duration) || 25);
    return {
      timeMinutes: start,
      duration: duration,
      subject: smartGetSubjectName(p.subjectId),
      topic: p.topic,
      fromPlan: true,
      priority: 999,
      subjectId: p.subjectId || null
    };
  });

  const items = fixed.slice();
  const usedTopics = new Set(items.map(function (x) { return String(x.topic).trim().toLowerCase(); }));
  const usedSubjectIds = new Set(fixed.map(function (x) { return x.subjectId ? String(x.subjectId) : ""; }).filter(Boolean));

  // Find the earliest available slot from 6 PM onward without overlapping
  // an existing plan. Generated sessions use 10-minute recovery gaps.
  function findFreeSlot(startAt, duration) {
    let candidate = Math.max(18 * 60, startAt);
    for (let guard = 0; guard < 50; guard++) {
      const conflict = fixed.concat(items.filter(function (x) { return !x.fromPlan; })).find(function (x) {
        return candidate < x.timeMinutes + x.duration + 10 && candidate + duration + 10 > x.timeMinutes;
      });
      if (!conflict) return candidate;
      candidate = conflict.timeMinutes + conflict.duration + 10;
    }
    return candidate;
  }

  // Fill the remaining schedule with the highest-value unfinished work.
  for (let i = 0; i < rankedTasks.length && items.length < 6; i++) {
    const task = rankedTasks[i];
    const topicKey = String(task.text || "").trim().toLowerCase();
    if (!topicKey || usedTopics.has(topicKey)) continue;

    const duration = durationForTask(task);
    const lastEnd = items.reduce(function (max, x) {
      return Math.max(max, x.timeMinutes + x.duration + 10);
    }, 18 * 60);
    const slot = findFreeSlot(lastEnd, duration);

    items.push({
      timeMinutes: slot,
      duration: duration,
      subject: smartGetSubjectName(task.subjectId),
      topic: task.text,
      fromPlan: false,
      priority: taskScore(task),
      deadline: task.deadline || null,
      subjectId: task.subjectId || null
    });
    usedTopics.add(topicKey);
    if (task.subjectId) usedSubjectIds.add(String(task.subjectId));
  }

  if (!items.length) {
    box.innerHTML = '<p class="empty-message">No active work found. Add tasks or today\'s study plans.</p>';
    return;
  }

  items.sort(function (a, b) {
    return a.timeMinutes - b.timeMinutes;
  });

  box.innerHTML = items.slice(0, 6).map(function (x, i) {
    const urgency = x.deadline ? ' • Deadline: ' + escapeHtml(x.deadline) : '';
    const label = x.fromPlan ? 'Planned' : 'Recommended';
    return '<div class="daily-plan-item">' +
      '<div class="daily-plan-time">' + escapeHtml(formatTime(x.timeMinutes)) + '</div>' +
      '<div>' +
        '<strong>' + (i + 1) + '. ' + escapeHtml(x.subject) + ' — ' + escapeHtml(x.topic) + '</strong>' +
        '<div class="daily-plan-meta"><span>⏱️ ' + x.duration + ' min</span><span>• ' + label + '</span>' + urgency + '</div>' +
      '</div>' +
    '</div>';
  }).join("");
}

// =====================================
// ADVANCED DASHBOARD
// =====================================

function renderAdvancedDashboard() {
  const summary = document.getElementById("advanced-summary");
  const weekChart = document.getElementById("advanced-week-chart");
  const subjectChart = document.getElementById("advanced-subject-chart");
  if (!summary || !weekChart || !subjectChart) return;

  const now = new Date();
  var dayData = [];
  for (var i = 6; i >= 0; i--) {
    var d = new Date(now);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - i);
    var key = formatLocalDateKey(d);
    var seconds = studyHistory.filter(function (s) {
      return formatLocalDateKey(new Date(s.date)) === key;
    }).reduce(function (sum, s) { return sum + Number(s.duration || 0); }, 0);
    dayData.push({
      key: key,
      label: d.toLocaleDateString(undefined, { weekday: "short" }),
      minutes: Math.round(seconds / 60)
    });
  }

  var totalWeek = 0;
  dayData.forEach(function (x) { totalWeek += x.minutes; });

  var previousWeek = 0;
  studyHistory.forEach(function (s) {
    var d = new Date(s.date);
    var diff = Math.floor((now - d) / 86400000);
    if (diff >= 7 && diff < 14) {
      previousWeek += Math.round(Number(s.duration || 0) / 60);
    }
  });

  var change = previousWeek ? Math.round((totalWeek - previousWeek) / previousWeek * 100) : 0;

  summary.innerHTML =
    '<div class="advanced-pill">This week: <strong>' + totalWeek + ' min</strong></div>' +
    '<div class="advanced-pill">Previous week: <strong>' + previousWeek + ' min</strong></div>' +
    '<div class="advanced-pill">Change: <strong>' + change + '%</strong></div>';

  var max = 1;
  dayData.forEach(function (x) { if (x.minutes > max) max = x.minutes; });

  weekChart.innerHTML = dayData.map(function (x) {
    var h = Math.max(3, Math.round(x.minutes / max * 130));
    return '<div class="chart-bar-wrap">' +
      '<span class="chart-value">' + x.minutes + 'm</span>' +
      '<div class="chart-bar" style="height:' + h + 'px"></div>' +
      '<span class="chart-label">' + x.label + '</span>' +
    '</div>';
  }).join("");

  var stats = getSubjectStats();
  var maxTasks = 1;
  stats.forEach(function (x) { if (x.tasks > maxTasks) maxTasks = x.tasks; });

  if (stats.length) {
    subjectChart.innerHTML = stats.map(function (x) {
      var pct = x.tasks ? Math.round(x.completed / x.tasks * 100) : 0;
      return '<div class="subject-bar-row">' +
        '<span class="chart-label">' + escapeHtml(x.name) + '</span>' +
        '<div class="subject-bar-track"><div class="subject-bar-fill" style="width:' + pct + '%"></div></div>' +
        '<strong>' + pct + '%</strong>' +
      '</div>';
    }).join("");
  } else {
    subjectChart.innerHTML = '<p class="empty-message">Add subjects and tasks to see progress.</p>';
  }

  // Monthly comparison: this month vs last month
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const thisMonthSec = studyHistory.filter(function (s) {
    const d = new Date(s.date);
    return d >= thisMonthStart && d <= thisMonthEnd;
  }).reduce(function (sum, s) { return sum + Number(s.duration || 0); }, 0);

  const lastMonthSec = studyHistory.filter(function (s) {
    const d = new Date(s.date);
    return d >= lastMonthStart && d < thisMonthStart;
  }).reduce(function (sum, s) { return sum + Number(s.duration || 0); }, 0);

  const thisMonthMin = Math.round(thisMonthSec / 60);
  const lastMonthMin = Math.round(lastMonthSec / 60);
  const monthChange = lastMonthMin > 0 ? Math.round((thisMonthMin - lastMonthMin) / lastMonthMin * 100) : (thisMonthMin > 0 ? 100 : 0);

  const monthlyEl = document.getElementById("advanced-monthly");
  if (monthlyEl) {
    monthlyEl.innerHTML =
      '<div class="monthly-pill">' +
        '<div class="month-label">This Month</div>' +
        '<div class="month-value">' + formatGoalTime(thisMonthMin * 60) + '</div>' +
      '</div>' +
      '<div class="monthly-pill">' +
        '<div class="month-label">Last Month</div>' +
        '<div class="month-value">' + formatGoalTime(lastMonthMin * 60) + '</div>' +
        (monthChange !== 0 ? '<div class="month-change">' + (monthChange > 0 ? "+" : "") + monthChange + '%</div>' : '') +
      '</div>';
  }

  // Productivity trend: focus score + study time over last 7 days
  const trendEl = document.getElementById("advanced-trend-chart");
  const trendScoresEl = document.getElementById("advanced-trend-scores");
  if (trendEl) {
    var trendDays = [];
    for (var td = 6; td >= 0; td--) {
      var tdDate = new Date(now);
      tdDate.setHours(0, 0, 0, 0);
      tdDate.setDate(tdDate.getDate() - td);
      var tdKey = formatLocalDateKey(tdDate);
      var tdSessions = studyHistory.filter(function (s) {
        return formatLocalDateKey(new Date(s.date)) === tdKey;
      });
      var tdMinutes = Math.round(tdSessions.reduce(function (sum, s) { return sum + Number(s.duration || 0); }, 0) / 60);
      var tdScore = tdSessions.length ? Math.round(tdSessions.reduce(function (sum, s) { return sum + Number(s.focusScore || 0); }, 0) / tdSessions.length) : 0;
      trendDays.push({ label: tdDate.toLocaleDateString(undefined, { weekday: "short" }), minutes: tdMinutes, score: tdScore });
    }

    var maxTrendMin = 1;
    trendDays.forEach(function (x) { if (x.minutes > maxTrendMin) maxTrendMin = x.minutes; });

    trendEl.innerHTML = trendDays.map(function (x) {
      var h = Math.max(3, Math.round(x.minutes / maxTrendMin * 110));
      return '<div class="trend-bar-wrap">' +
        '<span class="trend-value">' + x.minutes + 'm</span>' +
        '<div class="trend-bar" style="height:' + h + 'px"></div>' +
        '<span class="trend-label">' + x.label + '</span>' +
      '</div>';
    }).join("");

    if (trendScoresEl) {
      trendScoresEl.innerHTML = trendDays.map(function (x) {
        return '<div class="trend-score-row">' +
          '<span class="trend-score-label">' + x.label + '</span>' +
          '<span class="trend-score-value">' + (x.score || "—") + '%</span>' +
          '<span class="trend-score-meta">' + x.minutes + ' min</span>' +
        '</div>';
      }).join("");
    }
  }
}

// =====================================
// TIMER SUBJECT SELECTOR
// =====================================

function populateTimerSubjectSelect() {
  const select = document.getElementById("timer-subject");
  if (!select) return;
  select.innerHTML = "";
  subjects.forEach(function (subject) {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });
}

function populateExamSubjectSelect() {
  const select = document.getElementById("exam-subject");
  if (!select) return;
  select.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "Select subject";
  select.appendChild(blank);
  subjects.forEach(function (subject) {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });
}

function populatePlannerSubjectSelect() {
  const select = document.getElementById("planner-subject");
  if (!select) return;
  select.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "Select subject";
  select.appendChild(blank);
  subjects.forEach(function (subject) {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });
}

// =====================================
// TIMER SUBJECT SELECTOR
// =====================================

function populateTimerSubjectSelect() {
  const select = document.getElementById("timer-subject");
  if (!select) return;
  select.innerHTML = "";
  subjects.forEach(function (subject) {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });
}

function populateExamSubjectSelect() {
  const select = document.getElementById("exam-subject");
  if (!select) return;
  select.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "Select subject";
  select.appendChild(blank);
  subjects.forEach(function (subject) {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });
}

function populatePlannerSubjectSelect() {
  const select = document.getElementById("planner-subject");
  if (!select) return;
  select.innerHTML = "";
  const blank = document.createElement("option");
  blank.value = "";
  blank.textContent = "Select subject";
  select.appendChild(blank);
  subjects.forEach(function (subject) {
    const option = document.createElement("option");
    option.value = subject.id;
    option.textContent = subject.name;
    select.appendChild(option);
  });
}

function initSmartStudyFeatures() {
  // Load exams from storage
  loadExams();
  populateTimerSubjectSelect();

  // Exam form submit
  const examForm = document.getElementById("exam-form");
  if (examForm) {
    examForm.addEventListener("submit", function (e) {
      e.preventDefault();
      const title = document.getElementById("exam-title").value.trim();
      const date = document.getElementById("exam-date").value;
      const subjectId = document.getElementById("exam-subject").value;
      if (!title || !date) return;
      exams.push({ id: Date.now(), title: title, date: date, subjectId: subjectId || null });
      smartSaveExams();
      renderExams();
      renderSmartRecommendations();
      examForm.reset();
    });
  }

  // Refresh recommendations
  const refresh = document.getElementById("refresh-recommendations");
  if (refresh) refresh.addEventListener("click", renderSmartRecommendations);

  // Generate daily plan
  const generate = document.getElementById("generate-daily-plan");
  if (generate) generate.addEventListener("click", generateSmartDailyPlan);

  // Initial renders
  renderSmartRecommendations();
  renderSubjectPerformance();
  renderSmartConsistency();
  renderExams();
  generateSmartDailyPlan();
  renderAdvancedDashboard();
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initSmartStudyFeatures);
} else {
  initSmartStudyFeatures();
}

// INITIAL LOAD

updateTimerDisplay();

updateApp();

displayStudyHistory();

displayWeeklyAnalytics();

updateDailyGoal();

// =====================================

// STUDY HISTORY

// =====================================

function saveStudySession() {

  // Drain any running timer tick so the last partial second isn't lost.

  if (focusStartTime) {

    focusElapsedMs += Date.now() - focusStartTime;

    focusStartTime = Date.now();

  }

  // Final tick-up so we count the current second.

  focusElapsedMs += 1000;

  const totalMs = focusElapsedMs;

  // Ignore sessions shorter than 10 seconds.

  if (totalMs < 10_000) {

    return;

  }

  const elapsedSeconds = Math.floor(totalMs / 1000);

  const session = {

    id: Date.now(),

    duration: elapsedSeconds,

    focusScore: Math.max(0, 100 - eyeWarningCount * 5 - faceLostCount * 3),

    eyeWarnings: eyeWarningCount,

    faceLost: faceLostCount,

    date: new Date().toISOString(),

    subjectId: timerSubjectSelect ? timerSubjectSelect.value : "",

  };

  studyHistory.unshift(session);

  studyHistory = studyHistory.slice(0, 20);

  // Update study streak counters (after push so today's session counts).

  computeStreaks();

  localStorage.setItem("studyflowHistory", JSON.stringify(studyHistory));

  displayStudyHistory();

  displayWeeklyAnalytics();

  updateDailyGoal();

  updateStudyStreak();

  if (typeof displayAchievements === "function") displayAchievements();

}

function formatStudyTime(seconds) {

  seconds = Math.max(0, Math.floor(seconds));

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {

    return `${hours}h ${minutes}m`;

  }

  if (minutes > 0) {

    return `${minutes} min`;

  }

  return `${seconds} sec`;

}

function displayStudyHistory() {

  studyHistoryList.innerHTML = "";

  if (studyHistory.length === 0) {

    studyHistoryList.innerHTML = `

            <p class="empty-message">

                No study sessions yet.

            </p>

        `;

    totalStudyTime.textContent = "0 min";

    averageFocusScore.textContent = "0%";

    return;

  }

  let totalSeconds = 0;

  let totalScore = 0;

  studyHistory.forEach(function (session) {

    totalSeconds += session.duration;

    totalScore += session.focusScore;

    const item = document.createElement("div");

    item.className = "history-item";

    const date = new Date(session.date);

    item.innerHTML = `

            <div class="history-info">

                <strong>

                    ⏱ ${formatStudyTime(session.duration)}

                </strong>

                <span>

                    ${date.toLocaleDateString("en-IN")}

                    •

                    ${session.eyeWarnings} eye warning(s)

                    •

                    ${session.faceLost} face lost

                </span>

            </div>

            <div class="history-score">

                🎯 ${session.focusScore}%

            </div>

        `;

    studyHistoryList.appendChild(item);

  });

  totalStudyTime.textContent = formatStudyTime(totalSeconds);

  const average = Math.round(totalScore / studyHistory.length);

  averageFocusScore.textContent = average + "%";

}

// =====================================

// WEEKLY STUDY ANALYTICS

// =====================================

function displayWeeklyAnalytics() {

  const chart = document.getElementById("weekly-chart");

  const weeklyTotal = document.getElementById("weekly-total");

  const weeklyFocus = document.getElementById("weekly-focus");

  if (!chart || !weeklyTotal || !weeklyFocus) {

    return;

  }

  chart.innerHTML = "";

  const today = new Date();

  const days = [];

  for (let i = 6; i >= 0; i--) {

    const date = new Date(today);

    date.setHours(0, 0, 0, 0);

    date.setDate(today.getDate() - i);

    days.push(date);

  }

  let totalSeconds = 0;

  let totalScore = 0;

  let sessionCount = 0;

  days.forEach(function (day) {

    const dayData = studyHistory.filter(function (session) {

      const sessionDate = new Date(session.date);

      return (

        sessionDate.getFullYear() === day.getFullYear() &&

        sessionDate.getMonth() === day.getMonth() &&

        sessionDate.getDate() === day.getDate()

      );

    });

    let daySeconds = 0;

    dayData.forEach(function (session) {

      daySeconds += session.duration;

      totalSeconds += session.duration;

      totalScore += session.focusScore;

      sessionCount++;

    });

    const dayElement = document.createElement("div");

    dayElement.className = "week-day";

    const maxSeconds = Math.max(

      ...days.map(function (d) {

        return studyHistory

          .filter(function (session) {

            const sessionDate = new Date(session.date);

            return (

              sessionDate.getFullYear() === d.getFullYear() &&

              sessionDate.getMonth() === d.getMonth() &&

              sessionDate.getDate() === d.getDate()

            );

          })

          .reduce(function (total, session) {

            return total + session.duration;

          }, 0);

      }),

      60,

    );

    const height = Math.max(4, (daySeconds / maxSeconds) * 170);

    dayElement.innerHTML = `

            <strong>

                ${daySeconds > 0 ? Math.floor(daySeconds / 60) + "m" : ""}

            </strong>

            <div

                class="week-bar"

                style="height:${height}px"

                title="${Math.floor(daySeconds / 60)} minutes"

            ></div>

            <span>

                ${day.toLocaleDateString("en-IN", { weekday: "short" })}

            </span>

        `;

    chart.appendChild(dayElement);

  });

  weeklyTotal.textContent = formatStudyTime(totalSeconds);

  weeklyFocus.textContent =

    sessionCount > 0 ? Math.round(totalScore / sessionCount) + "%" : "0%";

}

// =====================================

// DAILY STUDY GOAL

// =====================================

function getTodayStudyTime() {

  const today = new Date();

  today.setHours(0, 0, 0, 0);

  return studyHistory.reduce(function (total, session) {

    const sessionDate = new Date(session.date);

    sessionDate.setHours(0, 0, 0, 0);

    if (sessionDate.getTime() === today.getTime()) {

      return total + session.duration;

    }

    return total;

  }, 0);

}

function formatGoalTime(seconds) {

  const hours = Math.floor(seconds / 3600);

  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {

    return `${hours}h ${minutes}m`;

  }

  return `${minutes} min`;

}

function updateDailyGoal() {

  const goalTime = document.getElementById("daily-goal-time");

  const goalPercent = document.getElementById("daily-goal-percent");

  const goalBar = document.getElementById("daily-goal-bar");

  const goalMessage = document.getElementById("daily-goal-message");

  if (!goalTime || !goalPercent || !goalBar || !goalMessage) {

    return;

  }

  const todaySeconds = getTodayStudyTime();

  const percentage = Math.min(

    100,

    Math.round((todaySeconds / dailyGoalSeconds) * 100),

  );

  goalTime.textContent = `${formatGoalTime(todaySeconds)} / ${formatGoalTime(dailyGoalSeconds)}`;

  goalPercent.textContent = percentage + "%";

  goalBar.style.width = percentage + "%";

  if (todaySeconds >= dailyGoalSeconds) {

    goalMessage.textContent = "🔥 Goal Complete! Great work!";

    goalMessage.classList.add("goal-complete");

    const todayKey = formatLocalDateKey(new Date());

    if (localStorage.getItem("studyflowGoalNotificationDate") !== todayKey) {

      showStudyNotification("Daily study goal complete 🔥", {

        body: "You reached your StudyFlow goal for today. Keep the streak going!",

      });

      if (studyflowNotifications.enabled && browserNotificationsSupported() && Notification.permission === "granted") {

        localStorage.setItem("studyflowGoalNotificationDate", todayKey);

      }

    }

  } else {

    const remaining = dailyGoalSeconds - todaySeconds;

    goalMessage.textContent = `${formatGoalTime(remaining)} remaining`;

    goalMessage.classList.remove("goal-complete");

  }

}

// =====================================

// STUDY STREAK

// =====================================

function computeStreaks() {

  const sessionDates = new Set();

  studyHistory.forEach(function (session) {

    const d = new Date(session.date);

    sessionDates.add(formatLocalDateKey(d));

  });

  const todayKey = formatLocalDateKey(new Date());

  const studiedToday = sessionDates.has(todayKey);

  if (studiedToday) {

    let count = 1;

    const checkDate = new Date();

    checkDate.setDate(checkDate.getDate() - 1);

    while (true) {

      const checkKey = formatLocalDateKey(checkDate);

      if (sessionDates.has(checkKey)) {

        count++;

        checkDate.setDate(checkDate.getDate() - 1);

      } else {

        break;

      }

    }

    currentStreak = count;

  } else {

    currentStreak = 0;

  }

  // Persist both streaks so a page reload (or light-mode switch) keeps

  // today's computed streak, not just whatever was loaded at startup.

  safeSave("studyflowCurrentStreak", currentStreak);

  if (currentStreak > bestStreak) {

    bestStreak = currentStreak;

    safeSave("studyflowBestStreak", bestStreak);

  }

}

// Build a YYYY-MM-DD key from a Date using LOCAL time (not UTC).

// This is what "a study day" means for an India-based user.

function formatLocalDateKey(date) {

  const y = date.getFullYear();

  const m = String(date.getMonth() + 1).padStart(2, "0");

  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;

}


function dayLabel(value) { return Number(value) === 1 ? "day" : "days"; }
function updateStudyStreak() {

  const streakCurrent = document.getElementById("streak-current");

  const streakBest = document.getElementById("streak-best");

  const streakMessage = document.getElementById("streak-message");

  if (!streakCurrent || !streakBest || !streakMessage) {

    return;

  }

  streakCurrent.textContent = currentStreak;

  streakBest.textContent = bestStreak;

  if (currentStreak === 0) {

    if (studyHistory.length === 0) {

      streakMessage.textContent =

        "No study records yet. Start your first session today!";

    } else {

      streakMessage.textContent =

        "You missed a day. Let's get back on track! 🔥";

    }

  } else if (currentStreak === 1) {

    streakMessage.textContent =

      "First study session today! Great start. 💪";

  } else if (currentStreak < 7) {

    streakMessage.textContent =

      `${currentStreak} days in a row. Keep the momentum! 🔥`;

  } else if (currentStreak < 30) {

    streakMessage.textContent =

      `${currentStreak} days in a row. You're building a habit! 🎉`;

  } else {

    streakMessage.textContent =

      `${currentStreak} days in a row. True study master! 👑`;

  }

}

// =====================================

// FOCUS MONITOR - CAMERA + FACE DETECTION

// =====================================

const focusCamera = document.getElementById("focus-camera");

const cameraPlaceholder = document.getElementById("camera-placeholder");

const focusStatus = document.getElementById("focus-status");

const startFocus = document.getElementById("start-focus");

const stopFocus = document.getElementById("stop-focus");

let focusStream = null;

let faceLandmarker = null;

let focusRunning = false;

let focusPaused = false;

let lastVideoTime = -1;

// Focus statistics

let focusStartTime = null;

let focusTimerInterval = null;

let focusElapsedMs = 0;

let eyeWarningCount = 0;

let faceLostCount = 0;

let lastFaceDetected = true;

const focusTimeDisplay = document.getElementById("focus-time");

const eyeWarningsDisplay = document.getElementById("eye-warnings");

const faceLostDisplay = document.getElementById("face-lost");

const focusScoreDisplay = document.getElementById("focus-score");

// =====================================

// LOAD MEDIAPIPE

// =====================================

async function loadFaceLandmarker() {

  if (faceLandmarker) {

    return;

  }

  focusStatus.textContent = "🟡 Loading face detection...";

  try {

    const vision =

      await import("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/vision_bundle.mjs");

    const filesetResolver = await vision.FilesetResolver.forVisionTasks(

      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm",

    );

    faceLandmarker = await vision.FaceLandmarker.createFromOptions(

      filesetResolver,

      {

        baseOptions: {

          modelAssetPath:

            "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",

        },

        runningMode: "VIDEO",

        numFaces: 1,

        minFaceDetectionConfidence: 0.5,

        minFacePresenceConfidence: 0.5,

        minTrackingConfidence: 0.5,

        outputFaceBlendshapes: true,

      },

    );

    console.log("Face Landmarker loaded.");

  } catch (error) {

    console.error("MediaPipe error:", error);

    focusStatus.textContent = "🔴 Face detection could not load.";

    throw error;

  }

}

// =====================================

// DETECT FACE + EYE CLOSURE

// =====================================

let eyesClosedSince = null;

let lastFocusAlert = 0;

let EYES_CLOSED_DELAY = 2000;

let ALERT_COOLDOWN = 5000;

// Distance between two points

function distance(a, b) {

  return Math.hypot(a.x - b.x, a.y - b.y);

}

// Calculate Eye Aspect Ratio

function calculateEAR(landmarks, points) {

  const vertical1 = distance(landmarks[points[1]], landmarks[points[5]]);

  const vertical2 = distance(landmarks[points[2]], landmarks[points[4]]);

  const horizontal = distance(landmarks[points[0]], landmarks[points[3]]);

  return (vertical1 + vertical2) / (2 * horizontal);

}

// =====================================

// UPDATE FOCUS TIME

// =====================================

function updateFocusTime() {

  if (focusStartTime) {

    focusElapsedMs += Date.now() - focusStartTime;

    focusStartTime = Date.now();

  }

  const elapsed = Math.floor(focusElapsedMs / 1000);

  const minutes = Math.floor(elapsed / 60);

  const seconds = elapsed % 60;

  focusTimeDisplay.textContent = `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;

}

// =====================================

// UPDATE FOCUS SCORE

// =====================================

function updateFocusScore() {

  let score = 100;

  // Eye warnings reduce score

  score -= eyeWarningCount * 5;

  // Losing the face reduces score

  score -= faceLostCount * 3;

  score = Math.max(0, score);

  focusScoreDisplay.textContent = score + "%";

}

// =====================================

// FOCUS WARNING SOUND

// =====================================

function playFocusAlert() {

  const audioContext = new (window.AudioContext || window.webkitAudioContext)();

  const oscillator = audioContext.createOscillator();

  const gainNode = audioContext.createGain();

  oscillator.type = "sine";

  oscillator.frequency.setValueAtTime(900, audioContext.currentTime);

  oscillator.frequency.exponentialRampToValueAtTime(

    500,

    audioContext.currentTime + 0.4,

  );

  gainNode.gain.setValueAtTime(0.001, audioContext.currentTime);

  gainNode.gain.exponentialRampToValueAtTime(

    0.45,

    audioContext.currentTime + 0.03,

  );

  gainNode.gain.exponentialRampToValueAtTime(

    0.001,

    audioContext.currentTime + 0.5,

  );

  oscillator.connect(gainNode);

  gainNode.connect(audioContext.destination);

  oscillator.start();

  oscillator.stop(audioContext.currentTime + 0.5);

}

// =====================================

// FACE + EYE DETECTION

// =====================================

function detectFace() {

  if (!focusRunning || focusPaused || !faceLandmarker) {

    return;

  }

  if (focusCamera.readyState >= 2) {

    if (focusCamera.currentTime !== lastVideoTime) {

      const results = faceLandmarker.detectForVideo(

        focusCamera,

        performance.now(),

      );

      lastVideoTime = focusCamera.currentTime;

      // =====================================

      // NO FACE

      // =====================================

      if (!results.faceLandmarks || results.faceLandmarks.length === 0) {

        focusStatus.textContent = "🟠 No face detected";

        eyesClosedSince = null;

        if (lastFaceDetected) {

          faceLostCount++;

          faceLostDisplay.textContent = faceLostCount;

          updateFocusScore();

        }

        lastFaceDetected = false;

      }

      // =====================================

      // FACE FOUND

      // =====================================

      else {

        lastFaceDetected = true;

        const landmarks = results.faceLandmarks[0];

        // MediaPipe eye landmark points

        const leftEye = [33, 160, 158, 133, 153, 144];

        const rightEye = [362, 385, 387, 263, 373, 380];

        const leftEAR = calculateEAR(landmarks, leftEye);

        const rightEAR = calculateEAR(landmarks, rightEye);

        const averageEAR = (leftEAR + rightEAR) / 2;

        // =====================================

        // DEBUG

        // =====================================

        console.log("Eye EAR:", averageEAR.toFixed(3));

        // =====================================

        // EYE STATE

        // =====================================

        const eyesClosed = averageEAR < studyflowSettings.eyeSensitivity;

        if (eyesClosed) {

          if (eyesClosedSince === null) {

            eyesClosedSince = Date.now();

          }

          const closedTime = Date.now() - eyesClosedSince;

          if (closedTime >= EYES_CLOSED_DELAY) {

            focusStatus.textContent = "😴 Eyes closed • Stay focused";

            const now = Date.now();

            if (now - lastFocusAlert >= studyflowSettings.alertCooldown) {

              if (studyflowSettings.warningSound) playFocusAlert();

              eyeWarningCount++;

              eyeWarningsDisplay.textContent = eyeWarningCount;

              updateFocusScore();

              lastFocusAlert = now;

            }

          } else {

            focusStatus.textContent = "👀 Eyes closed...";

          }

        } else {

          eyesClosedSince = null;

          focusStatus.textContent = "🟢 Face detected • Focus active";

        }

      }

    }

  }

  requestAnimationFrame(detectFace);

}

// =====================================

// START MONITOR

// =====================================

startFocus.addEventListener("click", async function () {

  // If the timer paused the monitor, Start resumes it.

  if (focusRunning && focusPaused) {

    focusPaused = false;

    focusStartTime = Date.now();

    clearInterval(focusTimerInterval);

    focusTimerInterval = setInterval(updateFocusTime, 1000);

    focusStatus.textContent = "🟢 Face detected • Focus active";

    lastVideoTime = -1;

    detectFace();

    return;

  }

  if (focusRunning) {

    return;

  }

  focusElapsedMs = 0;

  try {

    // Ask for camera

    focusStream = await navigator.mediaDevices.getUserMedia({

      video: {

        facingMode: "user",

        width: {

          ideal: 1280,

        },

        height: {

          ideal: 720,

        },

      },

      audio: false,

    });

    focusCamera.srcObject = focusStream;

    focusCamera.style.display = "block";

    cameraPlaceholder.style.display = "none";

    await focusCamera.play();

    // Load MediaPipe

    await loadFaceLandmarker();

    focusRunning = true;

    focusPaused = false;

    focusStartTime = Date.now();

    eyeWarningCount = 0;

    faceLostCount = 0;

    lastFaceDetected = true;

    eyeWarningsDisplay.textContent = "0";

    faceLostDisplay.textContent = "0";

    focusScoreDisplay.textContent = "100%";

    clearInterval(focusTimerInterval);

    focusTimerInterval = setInterval(updateFocusTime, 1000);

    updateFocusTime();

    focusStatus.textContent = "🟡 Looking for your face...";

    lastVideoTime = -1;

    detectFace();

  } catch (error) {

    console.error("Focus Monitor error:", error);

    focusStatus.textContent = "🔴 Unable to start Focus Monitor.";

  }

});

// =====================================

// STOP MONITOR

// =====================================

stopFocus.addEventListener("click", function () {

  focusRunning = false;

  focusPaused = false;

  clearInterval(focusTimerInterval);

  focusTimerInterval = null;

  saveStudySession();

  focusElapsedMs = 0;

  focusStartTime = null;

  if (focusStream) {

    focusStream.getTracks().forEach(function (track) {

      track.stop();

    });

    focusStream = null;

  }

  focusCamera.srcObject = null;

  focusCamera.style.display = "none";

  cameraPlaceholder.style.display = "flex";

  focusStatus.textContent = "⚪ Monitor is off";

  focusTimeDisplay.textContent = "00:00";

  eyeWarningsDisplay.textContent = "0";

  faceLostDisplay.textContent = "0";

  focusScoreDisplay.textContent = "100%";

  eyeWarningCount = 0;

  faceLostCount = 0;

  lastVideoTime = -1;

});

// =====================================

// SESSION COMPLETE MODAL

// =====================================

const sessionModal = document.getElementById("session-modal");

const modalCloseBtn = document.getElementById("modal-close-btn");

if (modalCloseBtn) {

  modalCloseBtn.addEventListener("click", function () {

    sessionModal.classList.remove("show");

  });

}

// Close modal on background click.

if (sessionModal) {

  sessionModal.addEventListener("click", function (event) {

    if (event.target === sessionModal) {

      sessionModal.classList.remove("show");

    }

  });

}

// =====================================

// SETTINGS

// =====================================

const studyflowSettings = {

  warningSound: localStorage.getItem("studyflowWarningSound") !== "false",

  eyeSensitivity: [0.18, 0.20, 0.22].includes(Number(localStorage.getItem("studyflowEyeSensitivity"))) ? Number(localStorage.getItem("studyflowEyeSensitivity")) : 0.20,

  warningDelay: Number(localStorage.getItem("studyflowWarningDelay")) || 2000,

  alertCooldown: Number(localStorage.getItem("studyflowAlertCooldown")) || 5000,

  autoMonitor: localStorage.getItem("studyflowAutoMonitor") !== "false",

};

function loadStudyflowSettings() {

  const sound = document.getElementById("setting-warning-sound");

  const sensitivity = document.getElementById("setting-eye-sensitivity");

  const delay = document.getElementById("setting-warning-delay");

  const cooldown = document.getElementById("setting-alert-cooldown");

  const auto = document.getElementById("setting-auto-monitor");

  const goal = document.getElementById("setting-daily-goal");

  if (sound) sound.checked = studyflowSettings.warningSound;

  if (sensitivity) sensitivity.value = String(studyflowSettings.eyeSensitivity);

  if (delay) delay.value = String(studyflowSettings.warningDelay);

  if (cooldown) cooldown.value = String(studyflowSettings.alertCooldown);

  if (auto) auto.checked = studyflowSettings.autoMonitor;

  if (goal) goal.value = String(dailyGoalSeconds);

}

function saveStudyflowSetting(name, value) {

  studyflowSettings[name] = value;

  const keys = {

    warningSound: "studyflowWarningSound",

    eyeSensitivity: "studyflowEyeSensitivity",

    warningDelay: "studyflowWarningDelay",

    alertCooldown: "studyflowAlertCooldown",

    autoMonitor: "studyflowAutoMonitor",

  };

  if (keys[name]) localStorage.setItem(keys[name], String(value));

}

const settingsModal = document.getElementById("settings-modal");

const settingsToggle = document.getElementById("settings-toggle");

const settingsClose = document.getElementById("settings-close");

function openSettings() {

  if (!settingsModal) return;

  // Initial render — paint achievements + streak from whatever is already

  // in memory / localStorage (no session needs to have just been saved).

  updateStudyStreak();

  if (typeof displayAchievements === "function") displayAchievements();

  loadStudyflowSettings();

  settingsModal.classList.add("show");

  settingsModal.setAttribute("aria-hidden", "false");

}

function closeSettings() {

  if (!settingsModal) return;

  settingsModal.classList.remove("show");

  settingsModal.setAttribute("aria-hidden", "true");

}

if (settingsToggle) settingsToggle.addEventListener("click", openSettings);

if (settingsClose) settingsClose.addEventListener("click", closeSettings);

if (settingsModal) {

  settingsModal.addEventListener("click", function(event) {

    if (event.target === settingsModal) closeSettings();

  });

}

document.addEventListener("keydown", function(event) {

  if (event.key === "Escape" && settingsModal?.classList.contains("show")) {

    closeSettings();

  }

});

document.getElementById("setting-warning-sound")?.addEventListener("change", function() {

  saveStudyflowSetting("warningSound", this.checked);

});

document.getElementById("setting-eye-sensitivity")?.addEventListener("change", function() {

  saveStudyflowSetting("eyeSensitivity", Number(this.value));

});

document.getElementById("setting-warning-delay")?.addEventListener("change", function() {

  saveStudyflowSetting("warningDelay", Number(this.value));

});

document.getElementById("setting-alert-cooldown")?.addEventListener("change", function() {

  saveStudyflowSetting("alertCooldown", Number(this.value));

});

document.getElementById("setting-auto-monitor")?.addEventListener("change", function() {

  saveStudyflowSetting("autoMonitor", this.checked);

});

document.getElementById("setting-daily-goal")?.addEventListener("change", function() {

  dailyGoalSeconds = Number(this.value);

  localStorage.setItem("studyflowDailyGoal", String(dailyGoalSeconds));

  if (dailyGoalSelect) dailyGoalSelect.value = String(dailyGoalSeconds);

  updateDailyGoal();

});

document.getElementById("setting-theme")?.addEventListener("click", function() {

  themeToggle?.click();

});

document.getElementById("enable-notifications")?.addEventListener("click", function() {

  requestStudyNotifications();

});

document.getElementById("reset-study-data")?.addEventListener("click", function() {

  const confirmed = confirm(

    "Reset all StudyFlow study data? This deletes subjects, tasks, notes, history, streaks and progress."

  );

  if (!confirmed) return;

  if (typeof timerInterval !== "undefined" && timerInterval !== null) {

    clearInterval(timerInterval);

    timerInterval = null;

  }

  // Stop camera/monitor without saving a fake session.

  if (typeof focusRunning !== "undefined") {

    focusRunning = false;

    focusPaused = false;

    if (typeof focusTimerInterval !== "undefined") {

      clearInterval(focusTimerInterval);

      focusTimerInterval = null;

    }

    if (typeof focusStream !== "undefined" && focusStream) {

      focusStream.getTracks().forEach(track => track.stop());

      focusStream = null;

    }

    if (typeof focusCamera !== "undefined" && focusCamera) {

      focusCamera.srcObject = null;

      focusCamera.style.display = "none";

    }

    if (typeof cameraPlaceholder !== "undefined" && cameraPlaceholder) {

      cameraPlaceholder.style.display = "flex";

    }

    if (typeof focusStatus !== "undefined" && focusStatus) {

      focusStatus.textContent = "⚪ Monitor is off";

    }

    if (typeof focusTimeDisplay !== "undefined" && focusTimeDisplay) {

      focusTimeDisplay.textContent = "00:00";

    }

    if (typeof eyeWarningsDisplay !== "undefined" && eyeWarningsDisplay) {

      eyeWarningsDisplay.textContent = "0";

    }

    if (typeof faceLostDisplay !== "undefined" && faceLostDisplay) {

      faceLostDisplay.textContent = "0";

    }

    if (typeof focusScoreDisplay !== "undefined" && focusScoreDisplay) {

      focusScoreDisplay.textContent = "100%";

    }

    eyeWarningCount = 0;

    faceLostCount = 0;

    focusElapsedMs = 0;

    focusStartTime = null;

  }

  subjects = [];

  tasks = [];

  studyHistory = [];

  currentStreak = 0;

  bestStreak = 0;

  localStorage.removeItem("studyflowSubjects");

  localStorage.removeItem("studyflowTasks");

  localStorage.removeItem("studyflowHistory");

  localStorage.removeItem("studyflowNotes");

  localStorage.removeItem("studyflowCurrentStreak");

  localStorage.removeItem("studyflowBestStreak");

  if (notes) notes.value = "";

  if (saveStatus) saveStatus.textContent = "Notes are saved automatically.";

  timeLeft = selectedTimerSeconds;

  updateTimerDisplay();

  updateApp();

  displayStudyHistory();

  displayWeeklyAnalytics();

  updateDailyGoal();

  updateStudyStreak();

  if (typeof displayAchievements === "function") displayAchievements();

  closeSettings();

});

loadStudyflowSettings();

updateNotificationSettingUI();

// Paint achievements + streak on initial load so the grid/show counts

// appear immediately, even before any session is saved.

if (typeof updateStudyStreak === "function") updateStudyStreak();

if (typeof displayAchievements === "function") displayAchievements();

// =====================================

// ACHIEVEMENTS

// =====================================

function displayAchievements() {

  const list = document.getElementById("achievements-list");

  const count = document.getElementById("achievement-count");

  if (!list || !count) return;

  const sessions = Array.isArray(studyHistory) ? studyHistory : [];

  const totalSeconds = sessions.reduce((sum, session) => sum + Number(session.duration || 0), 0);

  const achievements = [

    ["🌱", "First Step", "Complete your first study session.", sessions.length >= 1],

    ["⏱️", "30 Minute Club", "Accumulate 30 minutes of focused study.", totalSeconds >= 1800],

    ["🔥", "1 Hour Focus", "Accumulate 1 hour of focused study.", totalSeconds >= 3600],

    ["🎯", "Focus Master", "Finish a session with a 90%+ focus score.",

      sessions.some(session => Number(session.focusScore) >= 90)],

    ["📅", "3 Day Streak", "Study for 3 days in a row.", currentStreak >= 3],

    ["👑", "7 Day Streak", "Study for 7 days in a row.", currentStreak >= 7]

  ];

  const unlocked = achievements.filter(item => item[3]).length;

  count.textContent = `${unlocked}/${achievements.length}`;

  list.innerHTML = achievements.map(item => `

    <div class="achievement-item ${item[3] ? "unlocked" : "locked"}">

      <div class="achievement-icon">${item[0]}</div>

      <div class="achievement-info">

        <div class="achievement-title">${item[1]}</div>

        <div class="achievement-description">${item[2]}</div>

      </div>

      <div class="achievement-status">${item[3] ? "✓ Unlocked" : "🔒 Locked"}</div>

    </div>

  `).join("");

}

// =====================================

// DATA BACKUP & EXPORT

// =====================================

const STUDYFLOW_BACKUP_VERSION = 1;

function studyFlowBackup() {

  const keys = [

    "studyflowSubjects",

    "studyflowTasks",

    "studyflowHistory",

    "studyflowNotes",

    "studyflowCurrentStreak",

    "studyflowBestStreak",

    "studyflowDailyGoal",

    "studyflowWarningSound",

    "studyflowEyeSensitivity",

    "studyflowWarningDelay",

    "studyflowAlertCooldown",

    "studyflowAutoMonitor",

  ];

  const data = {};

  keys.forEach(function(k) {

    const v = localStorage.getItem(k);

    if (v !== null) data[k] = v;

  });

  return {

    app: "StudyFlow",

    backupVersion: STUDYFLOW_BACKUP_VERSION,

    exportedAt: new Date().toISOString(),

    data: data,

  };

}

function downloadStudyFlowFile(name, text, type) {

  const blob = new Blob(

    [text],

    { type: type || "text/plain;charset=utf-8" },

  );

  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");

  a.href = url;

  a.download = name;

  document.body.appendChild(a);

  a.click();

  a.remove();

  setTimeout(function() {

    URL.revokeObjectURL(url);

  }, 1000);

}

function backupStatus(msg, ok) {

  const el = document.getElementById("backup-status");

  if (!el) return;

  el.textContent = msg;

  if (ok) {

    el.classList.add("success");

  } else {

    el.classList.remove("success");

  }

}

document

  .getElementById("export-backup")

  ?.addEventListener("click", function() {

    const d = studyFlowBackup();

    const date = new Date().toISOString().slice(0, 10);

    downloadStudyFlowFile(

      "StudyFlow-Backup-" + date + ".json",

      JSON.stringify(d, null, 2),

      "application/json;charset=utf-8",

    );

    localStorage.setItem(

      "studyflowLastBackup",

      new Date().toISOString(),

    );

    backupStatus("Backup exported — saved just now.", true);

  });

function csvCell(v) {

  return (

    '"' + String(v ?? "").replace(/"/g, '""') + '"'

  );

}

document

  .getElementById("export-history-csv")

  ?.addEventListener("click", function() {

    const rows = [

      [

        "Date",

        "Duration",

        "Type",

        "Focus Score",

        "Eye Warnings",

        "Face Lost",

      ],

    ];

    (Array.isArray(studyHistory) ? studyHistory : [])

      .forEach(function(x) {

        rows.push([

          x.date || "",

          x.duration || 0,

          x.type || "",

          x.focusScore ?? "",

          x.eyeWarnings ?? 0,

          x.faceLost ?? 0,

        ]);

      });

    const csv = rows

      .map(function(r) {

        return r.map(csvCell).join(",");

      })

      .join("\r\n");

    const date = new Date().toISOString().slice(0, 10);

    downloadStudyFlowFile(

      "StudyFlow-History-" + date + ".csv",

      csv,

      "text/csv;charset=utf-8",

    );

    backupStatus("Study history CSV exported.", true);

  });

document

  .getElementById("import-backup")

  ?.addEventListener("click", function() {

    document

      .getElementById("backup-file-input")

      ?.click();

  });

document

  .getElementById("backup-file-input")

  ?.addEventListener("change", function(e) {

    const file = e.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = function() {

      try {

        const b = JSON.parse(reader.result);

        if (!b || b.app !== "StudyFlow" || !b.data) {

          throw new Error("Invalid backup");

        }

        if (

          !confirm(

            "Import this StudyFlow backup? Your current data will be replaced by the backup.",

          )

        ) {

          e.target.value = "";

          return;

        }

        const keys = [

          "studyflowSubjects",

          "studyflowTasks",

          "studyflowHistory",

          "studyflowNotes",

          "studyflowCurrentStreak",

          "studyflowBestStreak",

          "studyflowDailyGoal",

          "studyflowWarningSound",

          "studyflowEyeSensitivity",

          "studyflowWarningDelay",

          "studyflowAlertCooldown",

          "studyflowAutoMonitor",

        ];

        keys.forEach(function(k) {

          if (Object.prototype.hasOwnProperty.call(b.data, k)) {

            localStorage.setItem(k, b.data[k]);

          }

        });

        location.reload();

      } catch (err) {

        console.error(err);

        backupStatus("Could not import this backup file.");

      }

      e.target.value = "";

    };

    reader.readAsText(file);

  });

(function() {

  const v = localStorage.getItem("studyflowLastBackup");

  if (v) {

    const d = new Date(v);

    if (!Number.isNaN(d.getTime())) {

      backupStatus("Last backup: " + d.toLocaleString(), true);

    }

  }

})();

(function initStep4SmartUX() {
  function runWhenReady() {
    const box = document.getElementById("study-recommendations");
    if (!box) return;

    // Add a small action button to each recommendation so the user can
    // immediately turn a recommendation into a focused timer session.
    function enhanceRecommendations() {
      const items = box.querySelectorAll(".recommendation-item");
      items.forEach(function (item) {
        if (item.querySelector(".recommendation-action")) return;
        const titleEl = item.querySelector("strong");
        if (!titleEl) return;
        const title = titleEl.textContent.replace(/^\d+\.\s*/, "").trim();
        const meta = item.querySelector(".recommendation-meta");
        let subjectName = "";
        if (meta) {
          const subjectSpan = meta.querySelector("span");
          if (subjectSpan) subjectName = subjectSpan.textContent.replace(/^📚\s*/, "").trim();
        }
        const action = document.createElement("button");
        action.type = "button";
        action.className = "recommendation-action";
        action.textContent = "Start Focus";
        action.title = "Start a study timer for this recommendation";
        action.addEventListener("click", function () {
          const timerSubject = document.getElementById("timer-subject");
          if (timerSubject && subjectName) {
            const option = Array.from(timerSubject.options).find(function (o) {
              return o.textContent.trim().toLowerCase() === subjectName.toLowerCase();
            });
            if (option) timerSubject.value = option.value;
          }
          const timerCard = document.getElementById("timer");
          if (timerCard) timerCard.scrollIntoView({ behavior: "smooth", block: "center" });
          const start = document.getElementById("start-timer");
          if (start) setTimeout(function () { start.click(); }, 350);
        });
        item.appendChild(action);
      });
    }

    enhanceRecommendations();
    const observer = new MutationObserver(enhanceRecommendations);
    observer.observe(box, { childList: true, subtree: true });

    // Refresh smart insights periodically so deadline urgency and today's
    // plan stay current without requiring a page refresh.
    setInterval(function () {
      if (typeof renderSmartRecommendations === "function") renderSmartRecommendations();
      if (typeof renderSmartConsistency === "function") renderSmartConsistency();
      if (typeof renderExams === "function") renderExams();
      if (typeof generateSmartDailyPlan === "function") generateSmartDailyPlan();
    }, 60000);

    // One gentle daily notification when there is something that deserves
    // attention. It respects the existing notification setting and permission.
    function smartDailyCheck() {
      try {
        if (localStorage.getItem("studyflowNotifications") !== "true") return;
        if (!("Notification" in window) || Notification.permission !== "granted") return;
        const key = "studyflowSmartCheck_" + formatLocalDateKey(new Date());
        if (localStorage.getItem(key) === "1") return;

        const urgentTask = tasks.filter(function (t) {
          return !t.completed && t.deadline && smartDaysUntil(t.deadline) <= 1;
        }).sort(function (a, b) {
          return smartDaysUntil(a.deadline) - smartDaysUntil(b.deadline);
        })[0];

        const todayPlan = typeof plannerItemsSafe === "function" ? plannerItemsSafe().some(function (p) {
          return !p.completed && p.date === formatLocalDateKey(new Date());
        }) : false;

        if (urgentTask) {
          showStudyNotification("StudyFlow — priority reminder 🎯", {
            body: "“" + urgentTask.text + "” is due " + (smartDaysUntil(urgentTask.deadline) < 0 ? "overdue." : "soon. Start a focus session.")
          });
          localStorage.setItem(key, "1");
        } else if (todayPlan) {
          showStudyNotification("StudyFlow — today's plan 📚", {
            body: "You have planned study work for today. Stay consistent and start your next session."
          });
          localStorage.setItem(key, "1");
        }
      } catch (err) {
        // Notifications are optional; never let them affect StudyFlow.
      }
    }

    setTimeout(smartDailyCheck, 1500);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", runWhenReady, { once: true });
  } else {
    runWhenReady();
  }
})();


// =====================================
// PWA / OFFLINE SUPPORT
// =====================================
function studyFlowPwaReady() {
  return "serviceWorker" in navigator;
}

var studyFlowInstallDeferredPrompt = null;

function studyFlowShowInstallPrompt() {
  if (!studyFlowInstallDeferredPrompt) return;
  studyFlowInstallDeferredPrompt.prompt();
  studyFlowInstallDeferredPrompt.userChoice.then(function (choice) {
    studyFlowInstallDeferredPrompt = null;
    var installBtn = document.getElementById("install-btn");
    if (installBtn) installBtn.style.display = "none";
    if (choice.outcome === "accepted") {
      console.log("StudyFlow installed successfully");
    } else {
      console.log("StudyFlow install dismissed");
    }
  }).catch(function (err) {
    console.warn("Install prompt error:", err.message);
  });
}

if (studyFlowPwaReady() && "serviceWorker" in window.navigator) {
  window.navigator.serviceWorker.register("./service-worker.js", {
    scope: "./"
  }).then(function (registration) {
    console.log("StudyFlow PWA registered:", registration.scope);

    // Listen for the install prompt event
    window.addEventListener("beforeinstallprompt", function (event) {
      event.preventDefault();
      studyFlowInstallDeferredPrompt = event;
      var installBtn = document.getElementById("install-btn");
      if (installBtn) installBtn.style.display = "";
    });

    // Listen for install success
    window.addEventListener("appinstalled", function () {
      console.log("StudyFlow app installed");
      studyFlowInstallDeferredPrompt = null;
      var installBtn = document.getElementById("install-btn");
      if (installBtn) installBtn.style.display = "none";
    });

  }).catch(function (err) {
    console.warn("StudyFlow PWA registration skipped:", err.message);
  });
}

// Wire the install button
(function initInstallButton() {
  var installBtn = document.getElementById("install-btn");
  if (!installBtn) return;

  // Check if already installed (Chrome on mobile, or standalone mode)
  if (window.matchMedia("(display-mode: standalone)").matches ||
      window.navigator.standalone === true) {
    installBtn.style.display = "none";
    return;
  }

  installBtn.addEventListener("click", function () {
    if (studyFlowInstallDeferredPrompt) {
      studyFlowShowInstallPrompt();
    } else {
      // No deferred prompt yet — show a message
      installBtn.textContent = "⏳";
      setTimeout(function () {
        if (installBtn) installBtn.textContent = "📲";
      }, 1500);
    }
  });
})();
