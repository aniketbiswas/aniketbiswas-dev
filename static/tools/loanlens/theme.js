(() => {
  const root = document.documentElement;
  const modes = new Set(["system", "light", "dark"]);
  const isCanvas = root.dataset.storage === "canvas";
  const key = `home-loan-lab:theme:v1:${new URL(".", document.baseURI).pathname}`;
  const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
  let preference = "system";
  let notice = "";

  function renderNotice() {
    const element = document.getElementById("theme-notice");
    if (!element) return;
    element.textContent = notice;
    element.hidden = !notice;
  }

  function apply() {
    root.dataset.themePreference = preference;
    const hostMode = isCanvas ? root.dataset.colorMode : undefined;
    const resolved = preference !== "system" ? preference :
      hostMode === "dark" || hostMode === "light" ? hostMode : systemDark.matches ? "dark" : "light";
    root.dataset.resolvedTheme = resolved;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = resolved === "dark" ? "#111318" : "#f5f7fb";
    const select = document.getElementById("theme-choice");
    if (select) {
      select.value = preference;
      select.title = preference === "system" ? `Auto: following ${isCanvas ? "the app" : "your device"} (${resolved})` : `${preference === "light" ? "Light" : "Dark"} theme`;
    }
    renderNotice();
  }

  if (!isCanvas) {
    try {
      const saved = window.localStorage.getItem(key);
      if (saved && modes.has(saved)) preference = saved;
      else if (saved) notice = "The saved theme was not recognized. Auto is being used.";
    } catch (error) {
      notice = `Theme preferences could not be read (${error.name}). Auto applies for this visit.`;
    }
  }
  apply();

  function connect() {
    document.getElementById("theme-choice").addEventListener("change", (event) => {
      if (!modes.has(event.target.value)) {
        notice = "Choose Auto, Light or Dark.";
        apply();
        return;
      }
      preference = event.target.value;
      notice = "";
      if (!isCanvas) {
        try {
          if (preference === "system") window.localStorage.removeItem(key);
          else window.localStorage.setItem(key, preference);
        } catch (error) {
          notice = `Theme changed for this tab, but could not be remembered (${error.name}).`;
        }
      }
      apply();
    });
    document.addEventListener("home-loan-clear-theme", () => {
      preference = "system";
      notice = "";
      if (!isCanvas) {
        try {
          window.localStorage.removeItem(key);
        } catch (error) {
          notice = `Theme reset for this tab, but its saved preference could not be removed (${error.name}).`;
        }
      }
      apply();
    });
    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", connect, { once: true });
  else connect();
  systemDark.addEventListener("change", apply);
  new MutationObserver(apply).observe(root, { attributes: true, attributeFilter: ["data-color-mode"] });
})();
