const DEFAULT_SNIPPETS = [
  {
    id: "default-li",
    shortcut: "/li",
    label: "LinkedIn Profile",
    value: "https://www.linkedin.com/in/your-username"
  },
  {
    id: "default-gh",
    shortcut: "/gh",
    label: "GitHub Profile",
    value: "https://github.com/your-username"
  },
  {
    id: "default-port",
    shortcut: "/port",
    label: "Portfolio Website",
    value: "https://yourportfolio.com"
  },
  {
    id: "default-cv",
    shortcut: "/cv",
    label: "Resume / CV Link",
    value: "https://drive.google.com/file/d/your-resume-id/view"
  },
  {
    id: "default-email",
    shortcut: "/mail",
    label: "Email Address",
    value: "your.email@example.com"
  },
  {
    id: "default-phone",
    shortcut: "/ph",
    label: "Phone Number",
    value: "+92 300 1234567"
  }
];

let snippets = [];

const snippetForm = document.getElementById("snippetForm");
const editIdInput = document.getElementById("editId");
const shortcutInput = document.getElementById("shortcutInput");
const labelInput = document.getElementById("labelInput");
const valueInput = document.getElementById("valueInput");
const saveBtn = document.getElementById("saveBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const searchInput = document.getElementById("searchInput");
const snippetsList = document.getElementById("snippetsList");
const enableToggle = document.getElementById("enableToggle");
const toast = document.getElementById("toast");

function showPopupToast(message) {
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => {
    toast.classList.add("hidden");
  }, 1400);
}

function loadSnippets() {
  chrome.storage.local.get(["snippets", "enabled"], (res) => {
    if (!res.snippets || !res.snippets.length) {
      snippets = DEFAULT_SNIPPETS;
      chrome.storage.local.set({ snippets });
    } else {
      snippets = res.snippets;
    }
    enableToggle.checked = typeof res.enabled === "boolean" ? res.enabled : true;
    renderSnippets(searchInput.value);
  });
}

function saveSnippetsToStorage(callback) {
  chrome.storage.local.set({ snippets }, () => {
    renderSnippets(searchInput.value);
    if (callback) callback();
  });
}

function renderSnippets(filterText = "") {
  snippetsList.innerHTML = "";
  const q = filterText.trim().toLowerCase();

  const filtered = snippets.filter(
    (s) =>
      s.shortcut.toLowerCase().includes(q) ||
      s.label.toLowerCase().includes(q) ||
      s.value.toLowerCase().includes(q)
  );

  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "No shortcuts found. Add one above!";
    snippetsList.appendChild(empty);
    return;
  }

  filtered.forEach((item) => {
    const card = document.createElement("div");
    card.className = "snippet-card";

    const info = document.createElement("div");
    info.className = "snippet-info";

    const top = document.createElement("div");
    top.className = "snippet-top";

    const badge = document.createElement("span");
    badge.className = "shortcut-badge";
    badge.textContent = item.shortcut;

    const label = document.createElement("span");
    label.className = "snippet-label";
    label.textContent = item.label;

    top.appendChild(badge);
    top.appendChild(label);

    const val = document.createElement("div");
    val.className = "snippet-value";
    val.textContent = item.value;
    val.title = item.value;

    info.appendChild(top);
    info.appendChild(val);

    const actions = document.createElement("div");
    actions.className = "snippet-actions";

    const copyBtn = document.createElement("button");
    copyBtn.className = "icon-btn";
    copyBtn.textContent = "Copy";
    copyBtn.title = "Copy to clipboard";
    copyBtn.addEventListener("click", () => {
      navigator.clipboard.writeText(item.value).then(() => {
        showPopupToast(`Copied ${item.label}!`);
      });
    });

    const editBtn = document.createElement("button");
    editBtn.className = "icon-btn";
    editBtn.textContent = "Edit";
    editBtn.title = "Edit shortcut";
    editBtn.addEventListener("click", () => {
      editIdInput.value = item.id;
      shortcutInput.value = item.shortcut;
      labelInput.value = item.label;
      valueInput.value = item.value;
      saveBtn.textContent = "Update Shortcut";
      cancelEditBtn.classList.remove("hidden");
      valueInput.focus();
    });

    const delBtn = document.createElement("button");
    delBtn.className = "icon-btn delete";
    delBtn.textContent = "✕";
    delBtn.title = "Delete shortcut";
    delBtn.addEventListener("click", () => {
      snippets = snippets.filter((s) => s.id !== item.id);
      saveSnippetsToStorage(() => showPopupToast("Shortcut deleted"));
    });

    actions.appendChild(copyBtn);
    actions.appendChild(editBtn);
    actions.appendChild(delBtn);

    card.appendChild(info);
    card.appendChild(actions);
    snippetsList.appendChild(card);
  });
}

function resetForm() {
  editIdInput.value = "";
  shortcutInput.value = "";
  labelInput.value = "";
  valueInput.value = "";
  saveBtn.textContent = "+ Save Shortcut";
  cancelEditBtn.classList.add("hidden");
}

snippetForm.addEventListener("submit", (e) => {
  e.preventDefault();
  let shortcut = shortcutInput.value.trim();
  const label = labelInput.value.trim();
  const value = valueInput.value.trim();

  if (!shortcut || !label || !value) return;

  // Ensure shortcut starts with a slash or trigger character if user typed plain letters
  if (/^[a-zA-Z0-9]/.test(shortcut)) {
    shortcut = "/" + shortcut;
  }

  const editId = editIdInput.value;

  if (editId) {
    snippets = snippets.map((s) =>
      s.id === editId ? { ...s, shortcut, label, value } : s
    );
    saveSnippetsToStorage(() => {
      resetForm();
      showPopupToast("Shortcut updated!");
    });
  } else {
    // Check if shortcut already exists
    const existingIndex = snippets.findIndex(
      (s) => s.shortcut.toLowerCase() === shortcut.toLowerCase()
    );
    if (existingIndex !== -1) {
      snippets[existingIndex] = {
        ...snippets[existingIndex],
        shortcut,
        label,
        value
      };
    } else {
      snippets.unshift({
        id: "qf-" + Date.now(),
        shortcut,
        label,
        value
      });
    }
    saveSnippetsToStorage(() => {
      resetForm();
      showPopupToast("Shortcut saved!");
    });
  }
});

cancelEditBtn.addEventListener("click", resetForm);

searchInput.addEventListener("input", () => {
  renderSnippets(searchInput.value);
});

enableToggle.addEventListener("change", () => {
  chrome.storage.local.set({ enabled: enableToggle.checked }, () => {
    showPopupToast(
      enableToggle.checked ? "Auto-expand enabled" : "Auto-expand paused"
    );
  });
});

document.addEventListener("DOMContentLoaded", loadSnippets);
