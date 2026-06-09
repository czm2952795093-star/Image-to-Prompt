const apiKeyEl = document.getElementById("apiKey");
const modelEl = document.getElementById("visionModel");
const baseUrlEl = document.getElementById("apiBaseUrl");
const statusEl = document.getElementById("status");
const nextStepEl = document.getElementById("nextStep");
const testBtn = document.getElementById("test");

// key 存 local（不同步），模型/地址存 sync（可跨设备）
Promise.all([
  chrome.storage.local.get("apiKey"),
  chrome.storage.sync.get(["visionModel", "apiBaseUrl"]),
]).then(([local, sync]) => {
  if (local.apiKey) apiKeyEl.value = local.apiKey;
  modelEl.value = sync.visionModel || "gpt-5.5";
  baseUrlEl.value = sync.apiBaseUrl || "https://aihubmix.com/v1";
});

function setStatus(text, kind) {
  statusEl.textContent = text;
  statusEl.className = kind || "";
}

// 读输入框当前值（未保存也能测）
function readForm() {
  return {
    apiKey: apiKeyEl.value.trim(),
    model: modelEl.value.trim() || "gpt-5.5",
    baseUrl: (baseUrlEl.value.trim() || "https://aihubmix.com/v1").replace(/\/$/, ""),
  };
}

document.getElementById("save").addEventListener("click", async () => {
  const cfg = readForm();
  await chrome.storage.local.set({ apiKey: cfg.apiKey });
  await chrome.storage.sync.set({ visionModel: cfg.model, apiBaseUrl: cfg.baseUrl });
  setStatus("已保存 ✓", "ok");
  if (cfg.apiKey) nextStepEl.hidden = false; // 填了 Key 才提示下一步
  setTimeout(() => setStatus("", ""), 2000);
});

// 测试连接：用当前输入值 GET /models 验证 Key 是否有效（最轻量，不消耗推理）
testBtn.addEventListener("click", async () => {
  const cfg = readForm();
  if (!cfg.apiKey) {
    setStatus("请先填 API Key", "err");
    return;
  }
  setStatus("测试中…", "pending");
  testBtn.disabled = true;
  try {
    const res = await fetch(`${cfg.baseUrl}/models`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}` },
    });
    if (res.ok) {
      setStatus("连接成功 ✓ Key 有效", "ok");
    } else if (res.status === 401 || res.status === 403) {
      setStatus("Key 无效或未授权（HTTP " + res.status + "）", "err");
    } else {
      setStatus("连接失败：HTTP " + res.status + "，检查 API 地址", "err");
    }
  } catch {
    setStatus("网络请求失败，检查网络或 API 地址", "err");
  } finally {
    testBtn.disabled = false;
  }
});
