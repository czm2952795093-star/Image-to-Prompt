const apiKeyEl = document.getElementById("apiKey");
const modelEl = document.getElementById("visionModel");
const baseUrlEl = document.getElementById("apiBaseUrl");
const status = document.getElementById("status");

// key 存 local（不同步），模型/地址存 sync（可跨设备）
Promise.all([
  chrome.storage.local.get("apiKey"),
  chrome.storage.sync.get(["visionModel", "apiBaseUrl"]),
]).then(([local, sync]) => {
  if (local.apiKey) apiKeyEl.value = local.apiKey;
  modelEl.value = sync.visionModel || "gpt-5.5";
  baseUrlEl.value = sync.apiBaseUrl || "https://aihubmix.com/v1";
});

document.getElementById("save").addEventListener("click", async () => {
  await chrome.storage.local.set({ apiKey: apiKeyEl.value.trim() });
  await chrome.storage.sync.set({
    visionModel: modelEl.value.trim() || "gpt-5.5",
    apiBaseUrl: baseUrlEl.value.trim() || "https://aihubmix.com/v1",
  });
  status.textContent = "已保存 ✓";
  setTimeout(() => (status.textContent = ""), 1500);
});
