# ⚡ QuickFill — Job Application & Form Snippet Expander (Chrome Extension)

**Stop switching tabs to copy and paste your profile links over and over.**

**QuickFill** is a lightweight, zero-dependency **Chrome Extension (Manifest V3)** built for job seekers, software engineers, freelancers, and professionals who frequently fill out online applications and web forms. Simply type a short trigger like `/li`, `/gh`, or `/port` inside any input field, and QuickFill immediately expands it into your full LinkedIn URL, GitHub profile, portfolio website, or custom text snippet.

## Why QuickFill?

Applying for jobs across multiple platforms means repeatedly pasting the same links—LinkedIn, GitHub, Portfolio, Resume Drive link, Email, and Phone number—dozens of times a day.

* **Without QuickFill**: Open a new tab → visit LinkedIn → copy profile URL → switch back to the job form → paste → repeat for GitHub and Portfolio.

* **With QuickFill**: Click the form input → type `/li` → **Done.** Your full URL is populated in milliseconds.

## Key Features

* **Instant In-Place Text Expansion**: Type your shortcut into any `<input>`, `<textarea>`, or rich-text (`contenteditable`) field and watch it expand in real time.

* **Engineered for Modern Job Portals**: Dispatches native HTML prototype value setters alongside bubbling `input` and `change` events so React, Next.js, Vue, Angular, Workday, Greenhouse, and Lever forms register the updated value without resetting on blur or submit.

* **Smart Prefix Collision Prevention**: Automatically checks if a longer shortcut shares the same prefix (for example, `/port` vs. `/portfolio`) so shorter triggers never fire prematurely.

* **Full Iframe Support**: Runs across all frames (`all_frames: true`), ensuring seamless expansion inside embedded job application forms on company career pages.

* **Right-Click Context Menu**: Forgot a shortcut? Right-click inside any editable field and select your snippet directly from **QuickFill: Insert Snippet**.

* **Clean Popup Dashboard**: Add unlimited custom shortcuts, edit existing links, search through snippets, copy values with a single click, or pause auto-expansion globally.

* **100% Local & Private**: All shortcuts and URLs are stored strictly inside your browser via `chrome.storage.local`. Zero external servers, zero analytics, and zero data tracking.

## Default Shortcuts

QuickFill comes pre-loaded with six essential shortcuts for job applications. Open the extension popup and click **Edit** on any item to replace the placeholder with your actual information:

| Shortcut | Label | Example Expanded Output | 
| ----- | ----- | ----- | 
| `/li` | LinkedIn Profile | `https://www.linkedin.com/in/your-username` | 
| `/gh` | GitHub Profile | `https://github.com/your-username` | 
| `/port` | Portfolio Website | `https://yourportfolio.com` | 
| `/cv` | Resume / CV Link | `https://drive.google.com/file/d/your-resume-id/view` | 
| `/mail` | Email Address | `your.email@example.com` | 
| `/ph` | Phone Number | `+92 300 1234567` | 

## Installation

### Load Unpacked in Chrome, Brave, or Edge (Developer Mode)

1. **Clone or Download the Repository**:

   ```bash
   git clone https://github.com/your-username/quickfill-chrome-extension.git
   ```

   *(Or download and extract the ZIP archive.)*

2. **Open Browser Extensions**:
   Navigate to `chrome://extensions` in Google Chrome (`brave://extensions` in Brave or `edge://extensions` in Microsoft Edge).

3. **Enable Developer Mode**:
   Toggle the **Developer mode** switch in the top-right corner of the extensions page.

4. **Load the Extension**:
   Click **Load unpacked** in the top-left corner and select the root project folder containing `manifest.json`.

5. **Pin & Configure**:
   Click the **Extensions puzzle icon** in your browser toolbar, pin **QuickFill**, and click the **⚡** icon to customize your links.

## Usage Guide

### 1. Expanding Shortcuts in Web Forms

* Click inside any standard input field, URL box, textarea, or rich-text editor on any website.

* Type your shortcut (such as `/li` or `/gh`).

* If no other saved shortcut starts with those same characters, QuickFill expands it immediately and displays a subtle confirmation toast (`⚡ /li → LinkedIn Profile`) in the bottom-right corner.

* If another saved shortcut starts with the same prefix (e.g., `/port` and `/portfolio`), press `Space` after typing `/port` to trigger the shorter shortcut.

### 2. Managing Custom Snippets

* Open the **QuickFill** popup from your browser toolbar.

* Enter a **Shortcut** (e.g., `/cal` or `/bio`), a descriptive **Label** (e.g., `Calendly Link`), and the **URL or Text to Expand**.

* Click **+ Save Shortcut** to make it immediately active across all open tabs.

* Use the **Copy**, **Edit**, or **✕ (Delete)** buttons on any card to manage your saved items.

### 3. Using the Right-Click Menu

* Right-click inside any text field on a webpage.

* Hover over **QuickFill: Insert Snippet** and click any saved item to insert it at your current cursor position.

## Project Structure

| File / Folder | Responsibility | 
| ----- | ----- | 
| `manifest.json` | Chrome Extension Manifest V3 configuration, permissions, and content script declarations. | 
| `background.js` | Service worker that initializes default snippets on install and dynamically syncs the right-click context menu. | 
| `content.js` | Content script injected into web pages to monitor input events, perform smart shortcut replacement, and synchronize framework state. | 
| `popup.html` | Markup for the extension popup dashboard, snippet creation form, and search filter. | 
| `popup.css` | Modern UI styling for the popup window, cards, badges, and toggle switch. | 
| `popup.js` | Popup state management, CRUD operations on `chrome.storage.local`, search filtering, and one-click clipboard copy. | 
| `icons/` | Extension icons in `16x16`, `48x48`, and `128x128` resolutions. | 

## How It Works Under the Hood

Modern single-page applications (such as React and Angular job portals) override standard DOM input value setters to track internal component state. Simply mutating `input.value = newUrl` often fails because the framework overwrites the field on blur or form submission.

QuickFill solves this by invoking the native prototype setter directly before dispatching synthetic bubbling events:

```javascript
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
```

For rich-text editors (`isContentEditable`), QuickFill uses the Selection and Range APIs combined with `document.execCommand("insertText")` to preserve the user's native undo/redo (`Ctrl+Z`) history.

## Privacy Policy

QuickFill operates **100% offline and locally** within your browser:

* No personal data, browsing history, keystrokes, or snippets ever leave your device.

* No third-party scripts, remote code, or analytics SDKs are included.

* Permissions (`storage`, `contextMenus`, `activeTab`, and host access for content script injection) are used solely to store and expand user-defined snippets.

## Contributing

Contributions, issues, and feature requests are welcome!

1. Fork the repository.

2. Create a feature branch (`git checkout -b feature/amazing-feature`).

3. Commit your changes (`git commit -m "Add amazing feature"`).

4. Push to the branch (`git push origin feature/amazing-feature`).

5. Open a Pull Request.

## License

Distributed under the **MIT License**. Free for personal and commercial use.