(function () {
  const TRUNC_LIMIT = 30;
  const TRUNC_TO = 25;

  let overdueOnly = false;

  let tasks = [
    {
      id: 0,
      title: "Throw away the trash",
      dueDate: new Date(2024, 8, 29, 23, 59, 59),
      completed: false,
      completeDate: null,
      createdDate: new Date(2024, 8, 10, 23, 59, 59),
      deleted: false,
      note: "I need to get quarters first at Kroger.",
    },
    {
      id: 1,
      title: "UI Assignment 3",
      dueDate: new Date(2024, 9, 27, 23, 59, 59),
      completed: false,
      completeDate: null,
      createdDate: new Date(2024, 9, 2, 23, 59, 59),
      deleted: false,
      note: "I better start early cuz it looks pretty complicated.\r\nLooks like I have to read w3schools.com a lot.",
    },
    {
      id: 2,
      title: "Getting Milk",
      dueDate: null,
      completed: true,
      completeDate: new Date(2024, 9, 22, 23, 59, 59),
      createdDate: new Date(2024, 9, 10, 23, 59, 59),
      deleted: false,
      note: "I need to get milk for the kids.",
    },
    {
      id: 3,
      title: "Get tickets to Hamilton",
      dueDate: new Date(2024, 9, 12, 23, 59, 59),
      completed: false,
      completeDate: null,
      createdDate: new Date(2024, 9, 12, 23, 59, 59),
      deleted: false,
      note: "I would have to book a flight ticket to ACM UIST conference.\r\nKeep an eye on the cancellation policy. the conference may be cancelled due to the outbreak. :( Although flight tickets are getting cheaper.",
    },
  ];

  function truncate(input, number, numberTo) {
    return input.length > number ? input.substring(0, numberTo) + "..." : input;
  }

  function getFormattedDate(date) {
    const year = date.getFullYear();
    const month = ("0" + (1 + date.getMonth())).slice(-2);
    const day = ("0" + date.getDate()).slice(-2);
    return `${month}/${day}/${year}`;
  }

  function endOfDayFromMDY(mdy) {
    const [m, d, y] = mdy.split("/").map(Number);
    return new Date(y, m - 1, d, 23, 59, 59, 999);
  }

  function isValidMDY(mdy) {
    const mdYRegex = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{4})$/;
    if (!mdYRegex.test(mdy)) return false;
    const [mIn, dIn, yIn] = mdy.split("/").map(Number);
    const date = new Date(yIn, mIn - 1, dIn);
    return (
      date.getFullYear() === yIn &&
      date.getMonth() === mIn - 1 &&
      date.getDate() === dIn
    );
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function isOverdue(task, now = new Date()) {
    if (task.completed) return false;
    if (!task.dueDate) return false;
    return now.getTime() > task.dueDate.getTime();
  }

  let container, overdueLi, overdueLink, deleteCompletedBtn, addTaskBtn;
  let collapseEl, collapseInstance;
  let inputTitle, inputNote, inputDue, submitBtn, cancelBtn;

  function renderOneTask(task) {
    const row = document.createElement("div");
    row.className = "row my-2 py-2";
    row.id = String(task.id);

    if (task.completed) {
      row.classList.add("text-muted", "completed", "not-overdue");
    } else if (isOverdue(task)) {
      row.classList.add("text-danger", "overdue");
    } else {
      row.classList.add("not-overdue");
    }

    if (overdueOnly && !isOverdue(task)) {
      row.classList.add("d-none");
    }

    const colCheck = document.createElement("div");
    colCheck.className = "col-1 text-center";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.className = "form-check-input";
    checkbox.value = String(task.id);
    checkbox.checked = !!task.completed;
    checkbox.addEventListener("change", () => {
      task.completed = checkbox.checked;
      task.completeDate = task.completed ? new Date() : null;
      renderTasks();
    });
    colCheck.appendChild(checkbox);

    const colTitle = document.createElement("div");
    colTitle.className = "col-5 text-center";
    colTitle.setAttribute("role", "button");
    colTitle.setAttribute("data-bs-toggle", "collapse");
    colTitle.setAttribute("data-bs-target", `#note-${task.id}`);

    const displayTitle = truncate(task.title, TRUNC_LIMIT, TRUNC_TO);
    if (task.completed) {
      const del = document.createElement("del");
      del.textContent = displayTitle;
      colTitle.appendChild(del);
    } else {
      colTitle.textContent = displayTitle;
    }

    const colDue = document.createElement("div");
    colDue.className = "col-2 text-center";
    colDue.textContent = task.dueDate ? getFormattedDate(task.dueDate) : "";

    const colComplete = document.createElement("div");
    colComplete.className = "col-2 text-center";
    colComplete.textContent =
      task.completed && task.completeDate
        ? getFormattedDate(task.completeDate)
        : "";

    const colTools = document.createElement("div");
    colTools.className = "col-2 text-center";

    const deleteBtn = document.createElement("button");
    deleteBtn.className = "btn btn-light text-danger btn-xs deletetask mx-1";
    deleteBtn.setAttribute("alt", "Delete the task");
    deleteBtn.value = String(task.id);
    const trashIcon = document.createElement("i");
    trashIcon.className = "bi bi-trash";
    deleteBtn.appendChild(trashIcon);
    deleteBtn.addEventListener("click", () => {
      if (confirm("Delete this task?")) {
        task.deleted = true;
        renderTasks();
      }
    });

    const mailA = document.createElement("a");
    mailA.setAttribute("target", "_blank");
    const mailBtn = document.createElement("button");
    mailBtn.className = "btn btn-light text-primary btn-xs emailtask mx-1";
    mailBtn.setAttribute("alt", "Send an email");
    mailBtn.value = String(task.id);
    const mailIcon = document.createElement("i");
    mailIcon.className = "bi bi-envelope";
    mailBtn.appendChild(mailIcon);
    const subj = encodeURIComponent(task.title);
    const body = encodeURIComponent(task.note || "");
    mailA.href = `mailto:?body=${body}&subject=${subj}`;
    mailA.appendChild(mailBtn);

    colTools.appendChild(deleteBtn);
    colTools.appendChild(mailA);

    row.appendChild(colCheck);
    row.appendChild(colTitle);
    row.appendChild(colDue);
    row.appendChild(colComplete);
    row.appendChild(colTools);

    const detail = document.createElement("div");
    detail.id = `note-${task.id}`;
    detail.className = "collapse";
    if (overdueOnly && !isOverdue(task)) {
      detail.classList.add("d-none");
    }

    const card = document.createElement("div");
    card.className = "card";
    const cardBody = document.createElement("div");
    cardBody.className = "card-body";

    const h3 = document.createElement("h3");
    h3.textContent = task.title;
    const noteDiv = document.createElement("div");
    const safeNote = escapeHtml(task.note || "").replace(/\r?\n/g, "<br>");
    noteDiv.innerHTML = safeNote;

    cardBody.appendChild(h3);
    cardBody.appendChild(noteDiv);
    card.appendChild(cardBody);
    detail.appendChild(card);

    const frag = document.createDocumentFragment();
    frag.appendChild(row);
    frag.appendChild(detail);
    return frag;
  }

  function renderTasks() {
    while (container.firstChild) container.removeChild(container.firstChild);
    const fragment = document.createDocumentFragment();
    tasks.forEach((task) => {
      if (task.deleted) return;
      fragment.appendChild(renderOneTask(task));
    });
    container.appendChild(fragment);
    const hasCompleted = tasks.some((t) => t.completed && !t.deleted);
    deleteCompletedBtn.disabled = !hasCompleted;
  }

  function setupGlobalEvents() {
    overdueLi.addEventListener("click", function () {
      const link = overdueLink;
      link.classList.toggle("text-danger");
      overdueOnly = link.classList.contains("text-danger");
      renderTasks();
    });

    deleteCompletedBtn.addEventListener("click", function () {
      const hasCompleted = tasks.some((t) => t.completed && !t.deleted);
      if (!hasCompleted) return;
      if (confirm("Delete ALL completed tasks?")) {
        tasks.forEach((t) => {
          if (t.completed) t.deleted = true;
        });
        renderTasks();
      }
    });

    collapseEl.addEventListener("show.bs.collapse", function () {
      addTaskBtn.classList.add("d-none");
    });
    collapseEl.addEventListener("hidden.bs.collapse", function () {
      addTaskBtn.classList.remove("d-none");
      clearInputs();
    });

    submitBtn.addEventListener("click", function () {
      const rawTitle = inputTitle.value;
      const rawNote = inputNote.value;
      const rawDue = inputDue.value.trim();
      if (!rawTitle || !rawTitle.trim()) {
        alert("Please enter a task title.");
        return;
      }
      let due = null;
      if (rawDue.length > 0) {
        if (!isValidMDY(rawDue)) {
          alert("Please enter a valid date in mm/dd/yyyy.");
          return;
        }
        due = endOfDayFromMDY(rawDue);
      }
      const newTask = {
        id: tasks.length,
        title: rawTitle.trim(),
        dueDate: due,
        completed: false,
        completeDate: null,
        createdDate: new Date(),
        deleted: false,
        note: rawNote || "",
      };
      tasks.push(newTask);
      if (overdueOnly) {
        overdueOnly = false;
        overdueLink.classList.remove("text-danger");
      }
      renderTasks();
      collapseInstance.hide();
    });
  }

  function clearInputs() {
    inputTitle.value = "";
    inputNote.value = "";
    inputDue.value = "";
  }

  document.addEventListener("DOMContentLoaded", function () {
    container = document.getElementById("task-list-container");
    overdueLi = document.getElementById("overdue");
    overdueLink = overdueLi.querySelector("a");
    deleteCompletedBtn = document.getElementById("deleteCompletedTasks");
    addTaskBtn = document.querySelector(".addtask");
    collapseEl = document.getElementById("task-input-container");
    collapseInstance = new bootstrap.Collapse(collapseEl, { toggle: false });
    inputTitle = document.getElementById("task-title");
    inputNote = document.getElementById("task-description");
    inputDue = document.getElementById("due-date");
    submitBtn = document.getElementById("submit-task");
    cancelBtn = document.getElementById("cancel-task");
    setupGlobalEvents();
    renderTasks();
  });
})();
