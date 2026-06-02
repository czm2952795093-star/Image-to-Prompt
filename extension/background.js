// Image → GPT Image Prompt — background service worker (MV3)
// 无后端版：用户自带 key，扩展直接调 AiHubMix（OpenAI 兼容网关）。
// 流程：右键图片 → 抓图转 base64 → 调视觉模型 → 浮层展示可复现提示词。

const MENU_ID = "img2prompt";
const DEFAULT_BASE_URL = "https://aihubmix.com/v1";
const DEFAULT_MODEL = "gpt-5.5";

// 元提示词：按 OpenAI 官方 GPT Image 提示词规则，产出高保真复现提示词。
const META_PROMPT = `You are an expert prompt engineer for OpenAI's GPT Image 2 text-to-image model.
You will be shown ONE image. Your job: write a SINGLE prompt that, when fed to GPT Image 2,
reproduces the shown image as faithfully as possible (composition, subject, colors, lighting, text).

Follow GPT Image's official prompting rules EXACTLY:
- Order the prompt as: [Use case] -> [Background/Scene] -> [Subject] -> [Key Details] -> [In-image Text] -> [Composition] -> [Color Palette] -> [Constraints].
- Be concrete and dense. Prefer observable facts over interpretation.
- Subject: if a person, use age range + apparent ethnicity + hairstyle + distinctive features + clothing. If an object/scene, describe form, material, count, arrangement.
- Key Details: materials, textures, surface wear, depth of field, lens feel; if photographic, include "photorealistic" and lens/framing.
- In-image Text: transcribe ALL visible text VERBATIM inside double quotes, ALL CAPS or exact case as shown; note font style, color, size, and placement. If no text, write "none".
- Composition: shot type (close-up/medium/wide/top-down), camera angle (eye-level/low/high), and placement of key elements (e.g. "subject centered, logo top-right").
- Color Palette: 4-6 dominant colors as HEX codes with what each applies to.
- Constraints: "preserve layout and geometry; do not add objects, text, or watermarks not described above."
- End with the aspect ratio, expressed both as a ratio and as a GPT Image 2 size whose edges are multiples of 16 and long:short <= 3:1 (choose nearest of 1024x1024, 1536x1024, 1024x1536, or a custom multiple-of-16 size that matches the image's true aspect ratio).

Output ONLY the final prompt text. No preamble, no markdown headings, no explanation.`;

chrome.runtime.onInstalled.addListener((details) => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: "转换为 GPT Image 提示词",
    contexts: ["image"],
  });
  // 首次安装自动打开选项页，引导填 key
  if (details.reason === "install") chrome.runtime.openOptionsPage();
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== MENU_ID || !tab?.id) return;
  const tabId = tab.id;

  await ensureOverlay(tabId);
  send(tabId, { type: "LOADING" });

  try {
    const cfg = await getConfig();
    if (!cfg.apiKey) {
      throw new Error("尚未填写 API Key。点击扩展图标打开「选项」页填入你的 AiHubMix / OpenAI Key。");
    }
    const { dataUrl } = await fetchImageAsDataUrl(info.srcUrl);
    const prompt = await describe(cfg, dataUrl);
    send(tabId, { type: "RESULT", prompt });
  } catch (err) {
    send(tabId, { type: "ERROR", error: String(err && err.message ? err.message : err) });
  }
});

// 浮层「打开设置」按钮 → 打开选项页（用 tabs.create 最稳，openOptionsPage 偶发静默失败）
chrome.runtime.onMessage.addListener((msg) => {
  if (msg && msg.type === "OPEN_OPTIONS") {
    chrome.tabs.create({ url: chrome.runtime.getURL("options.html") });
  }
});

async function getConfig() {
  const { apiKey } = await chrome.storage.local.get("apiKey");
  const { visionModel, apiBaseUrl } = await chrome.storage.sync.get(["visionModel", "apiBaseUrl"]);
  return {
    apiKey: (apiKey || "").trim(),
    model: (visionModel || DEFAULT_MODEL).trim(),
    baseUrl: (apiBaseUrl || DEFAULT_BASE_URL).trim().replace(/\/$/, ""),
  };
}

// service worker 内抓图转 data URL（需要 host_permissions: <all_urls>）
async function fetchImageAsDataUrl(url) {
  if (url && url.startsWith("data:")) return { dataUrl: url };
  const res = await fetch(url);
  if (!res.ok) throw new Error(`抓取图片失败：HTTP ${res.status}`);
  const blob = await res.blob();
  const mimeType = blob.type || "image/png";
  const buf = await blob.arrayBuffer();
  const bytes = new Uint8Array(buf);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return { dataUrl: `data:${mimeType};base64,${btoa(binary)}` };
}

async function describe(cfg, dataUrl) {
  const res = await fetch(`${cfg.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${cfg.apiKey}`,
    },
    body: JSON.stringify({
      model: cfg.model,
      messages: [
        { role: "system", content: META_PROMPT },
        {
          role: "user",
          content: [
            { type: "text", text: "Recreate this image. Output only the GPT Image 2 prompt." },
            { type: "image_url", image_url: { url: dataUrl, detail: "high" } },
          ],
        },
      ],
    }),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error(`接口返回非 JSON（HTTP ${res.status}）：${text.slice(0, 200)}`);
  }
  if (!res.ok) {
    throw new Error(data?.error?.message || `接口错误：HTTP ${res.status}`);
  }
  const prompt = data?.choices?.[0]?.message?.content?.trim();
  if (!prompt) throw new Error("视觉模型未返回内容。");
  return prompt;
}

async function ensureOverlay(tabId) {
  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: ["content/overlay.css"] });
  } catch {}
  await chrome.scripting.executeScript({ target: { tabId }, files: ["content/overlay.js"] });
}

function send(tabId, msg) {
  chrome.tabs.sendMessage(tabId, msg).catch(() => {});
}
