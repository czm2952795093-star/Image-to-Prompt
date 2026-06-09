const apiKeyEl = document.getElementById("apiKey");
const status = document.getElementById("status");

chrome.storage.local.get("apiKey").then(({ apiKey }) => {
  if (apiKey) apiKeyEl.value = apiKey;
});

document.getElementById("toggle").addEventListener("click", () => {
  apiKeyEl.type = apiKeyEl.type === "password" ? "text" : "password";
});

document.getElementById("save").addEventListener("click", async () => {
  const key = apiKeyEl.value.trim();
  if (!key) {
    status.textContent = "请先填 API Key";
    status.className = "status err";
    return;
  }
  await chrome.storage.local.set({ apiKey: key });
  status.textContent = "已保存 ✓ 去图片上右键试试";
  status.className = "status ok";
  setTimeout(() => (status.textContent = ""), 2000);
});

document.getElementById("more").addEventListener("click", (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
