const apiKeyEl = document.getElementById("apiKey");
const status = document.getElementById("status");

chrome.storage.local.get("apiKey").then(({ apiKey }) => {
  if (apiKey) apiKeyEl.value = apiKey;
});

document.getElementById("toggle").addEventListener("click", () => {
  apiKeyEl.type = apiKeyEl.type === "password" ? "text" : "password";
});

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.local.set({ apiKey: apiKeyEl.value.trim() });
  status.textContent = "已保存 ✓";
  status.className = "status ok";
  setTimeout(() => (status.textContent = ""), 1500);
});

document.getElementById("more").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
