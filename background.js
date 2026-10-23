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

let menuRebuildQueue = Promise.resolve();

function rebuildContextMenus(snippets) {
  menuRebuildQueue = menuRebuildQueue.then(
    () =>
      new Promise((resolve) => {
        chrome.contextMenus.removeAll(() => {
          // Ignore any lastError safely
          void chrome.runtime.lastError;
          chrome.contextMenus.create(
            {
              id: "quickfill-parent",
              title: "QuickFill: Insert Snippet",
              contexts: ["editable"]
            },
            () => {
              void chrome.runtime.lastError;
              const items = snippets || [];
              let remaining = items.length;
              if (remaining === 0) {
                resolve();
                return;
              }
              items.forEach((item) => {
                chrome.contextMenus.create(
                  {
                    id: "qf-item-" + item.id,
                    parentId: "quickfill-parent",
                    title: `${item.label} (${item.shortcut})`,
                    contexts: ["editable"]
                  },
                  () => {
                    void chrome.runtime.lastError;
                    remaining--;
                    if (remaining === 0) resolve();
                  }
                );
              });
            }
          );
        });
      })
  );
}

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get(["snippets", "enabled"], (res) => {
    const snippets =
      res.snippets && res.snippets.length ? res.snippets : DEFAULT_SNIPPETS;
    const enabled = typeof res.enabled === "boolean" ? res.enabled : true;
    chrome.storage.local.set({ snippets, enabled }, () => {
      rebuildContextMenus(snippets);
    });
  });
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.snippets) {
    rebuildContextMenus(changes.snippets.newValue || []);
  }
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId.startsWith("qf-item-") && tab && tab.id) {
    const snippetId = info.menuItemId.replace("qf-item-", "");
    chrome.storage.local.get(["snippets"], (res) => {
      const found = (res.snippets || []).find((s) => s.id === snippetId);
      if (found) {
        chrome.tabs.sendMessage(
          tab.id,
          { action: "insert_snippet", value: found.value, label: found.label },
          { frameId: info.frameId },
          () => {
            void chrome.runtime.lastError;
          }
        );
      }
    });
  }
});
