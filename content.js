let snippets = [];
let isEnabled = true;

// Load initial state
chrome.storage.local.get(["snippets", "enabled"], (res) => {
  if (res.snippets) snippets = res.snippets;
  if (typeof res.enabled === "boolean") isEnabled = res.enabled;
});

// Listen for updates from popup
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local") {
    if (changes.snippets) snippets = changes.snippets.newValue || [];
    if (changes.enabled) isEnabled = changes.enabled.newValue;
  }
});

// React / Vue / Angular compatible input value setter
function setNativeValue(element, value) {
  const proto =
    element instanceof HTMLTextAreaElement
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
  const descriptor = Object.getOwnPropertyDescriptor(proto, "value");
  if (descriptor && descriptor.set) {
    descriptor.set.call(element, value);
  } else {
    element.value = value;
  }
  element.dispatchEvent(new Event("input", { bubbles: true }));
  element.dispatchEvent(new Event("change", { bubbles: true }));
}

// Show subtle floating confirmation toast
function showToast(shortcut, label) {
  const existing = document.getElementById("quickfill-toast-notification");
  if (existing) existing.remove();

  const toast = document.createElement("div");
  toast.id = "quickfill-toast-notification";
  toast.textContent = `⚡ ${shortcut} → ${label}`;
  Object.assign(toast.style, {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#1e1b4b",
    color: "#ffffff",
    padding: "8px 14px",
    borderRadius: "8px",
    fontSize: "13px",
    fontFamily: "system-ui, -apple-system, sans-serif",
    fontWeight: "500",
    boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
    zIndex: "2147483647",
    pointerEvents: "none",
    transition: "opacity 0.25s ease",
    opacity: "1"
  });

  document.body.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = "0";
    setTimeout(() => toast.remove(), 300);
  }, 1600);
}

function isEditableInput(el) {
  if (!el) return false;
  if (el.tagName === "TEXTAREA") return !el.readOnly && !el.disabled;
  if (el.tagName === "INPUT") {
    const validTypes = ["text", "url", "email", "search", "tel", ""];
    const type = (el.type || "text").toLowerCase();
    return validTypes.includes(type) && !el.readOnly && !el.disabled;
  }
  return false;
}

function handleInputExpansion(e) {
  if (!isEnabled || !snippets.length) return;
  const target = e.target;

  // Case 1: Standard Input or Textarea
  if (isEditableInput(target)) {
    const val = target.value;
    if (!val) return;

    const cursorPos =
      typeof target.selectionStart === "number" ? target.selectionStart : val.length;
    const textBeforeCursor = val.slice(0, cursorPos);

    for (const item of snippets) {
      if (!item.shortcut) continue;

      // Check if another longer shortcut starts with this shortcut
      const hasLongerPrefixMatch = snippets.some(
        (other) =>
          other.id !== item.id &&
          other.shortcut.length > item.shortcut.length &&
          other.shortcut.startsWith(item.shortcut)
      );

      // Match either exact shortcut at cursor (if no ambiguity) or shortcut + space
      let matchedString = null;
      if (!hasLongerPrefixMatch && textBeforeCursor.endsWith(item.shortcut)) {
        // Ensure shortcut is at start of input or preceded by whitespace
        const prefixIndex = textBeforeCursor.length - item.shortcut.length;
        if (prefixIndex === 0 || /\s/.test(textBeforeCursor[prefixIndex - 1])) {
          matchedString = item.shortcut;
        }
      } else if (textBeforeCursor.endsWith(item.shortcut + " ")) {
        const prefixIndex = textBeforeCursor.length - (item.shortcut.length + 1);
        if (prefixIndex === 0 || /\s/.test(textBeforeCursor[prefixIndex - 1])) {
          matchedString = item.shortcut + " ";
        }
      }

      if (matchedString) {
        const startPos = cursorPos - matchedString.length;
        const newText =
          val.slice(0, startPos) + item.value + val.slice(cursorPos);

        setNativeValue(target, newText);

        const newCursorPos = startPos + item.value.length;
        try {
          target.setSelectionRange(newCursorPos, newCursorPos);
        } catch (_) {
          // Some input types like email don't support setSelectionRange
        }

        showToast(item.shortcut, item.label);
        return;
      }
    }
    return;
  }

  // Case 2: ContentEditable (Rich Text Editors)
  if (target && target.isContentEditable) {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    const range = sel.getRangeAt(0);
    const node = range.startContainer;
    if (node.nodeType !== Node.TEXT_NODE) return;

    const textBeforeCursor = node.textContent.slice(0, range.startOffset);

    for (const item of snippets) {
      if (!item.shortcut) continue;

      const hasLongerPrefixMatch = snippets.some(
        (other) =>
          other.id !== item.id &&
          other.shortcut.length > item.shortcut.length &&
          other.shortcut.startsWith(item.shortcut)
      );

      let matchedString = null;
      if (!hasLongerPrefixMatch && textBeforeCursor.endsWith(item.shortcut)) {
        const prefixIndex = textBeforeCursor.length - item.shortcut.length;
        if (prefixIndex === 0 || /\s/.test(textBeforeCursor[prefixIndex - 1])) {
          matchedString = item.shortcut;
        }
      } else if (textBeforeCursor.endsWith(item.shortcut + " ")) {
        const prefixIndex = textBeforeCursor.length - (item.shortcut.length + 1);
        if (prefixIndex === 0 || /\s/.test(textBeforeCursor[prefixIndex - 1])) {
          matchedString = item.shortcut + " ";
        }
      }

      if (matchedString) {
        const startOffset = range.startOffset - matchedString.length;
        const replaceRange = document.createRange();
        replaceRange.setStart(node, startOffset);
        replaceRange.setEnd(node, range.startOffset);
        sel.removeAllRanges();
        sel.addRange(replaceRange);

        if (!document.execCommand("insertText", false, item.value)) {
          replaceRange.deleteContents();
          replaceRange.insertNode(document.createTextNode(item.value));
          sel.collapseToEnd();
        }

        showToast(item.shortcut, item.label);
        return;
      }
    }
  }
}

document.addEventListener("input", handleInputExpansion, true);

// Listen for context menu insertion
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.action === "insert_snippet" && msg.value) {
    const active = document.activeElement;
    if (isEditableInput(active)) {
      const val = active.value || "";
      const start =
        typeof active.selectionStart === "number" ? active.selectionStart : val.length;
      const end =
        typeof active.selectionEnd === "number" ? active.selectionEnd : val.length;
      const newText = val.slice(0, start) + msg.value + val.slice(end);
      setNativeValue(active, newText);
      showToast("Menu", msg.label || "Inserted");
    } else if (active && active.isContentEditable) {
      document.execCommand("insertText", false, msg.value);
      showToast("Menu", msg.label || "Inserted");
    }
  }
});
