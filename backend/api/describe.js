// POST /api/describe  { image: <dataURL>, mimeType?: string }  ->  { prompt: string }
//
// 接收扩展传来的图片，调用视觉模型（经 AiHubMix，OpenAI 兼容网关），
// 按 GPT Image 官方提示词规则
// (background/scene → subject → key details → constraints + 文字锁定 + 色板 + 长宽比)
// 生成一段「高保真复现」提示词。API Key 只存在于服务端。

const config = { maxDuration: 60 };

// AiHubMix 为 OpenAI 兼容网关。base URL 与 key 均可用环境变量覆盖。
const API_BASE = (process.env.API_BASE_URL || "https://aihubmix.com/v1").replace(/\/$/, "");
const CHAT_URL = `${API_BASE}/chat/completions`;

// 元提示词：强制视觉模型按 OpenAI cookbook 的字段顺序与文字锁定规则输出，
// 目标是让产物在 GPT Image 2 上尽可能复现原图。
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

module.exports = async function handler(req, res) {
  setCors(res);
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const apiKey = process.env.AIHUBMIX_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "服务端未配置 AIHUBMIX_API_KEY" });

  const model = process.env.VISION_MODEL || "gpt-5.5";

  try {
    const body = await readJson(req);
    const image = body && body.image;
    if (!image || typeof image !== "string") {
      return res.status(400).json({ error: "缺少 image 字段（应为 data URL）" });
    }

    const upstream = await fetch(CHAT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: META_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Recreate this image. Output only the GPT Image 2 prompt." },
              { type: "image_url", image_url: { url: image, detail: "high" } },
            ],
          },
        ],
      }),
    });

    const data = await upstream.json();
    if (!upstream.ok) {
      const msg = (data && data.error && data.error.message) || `上游 API HTTP ${upstream.status}`;
      return res.status(502).json({ error: msg });
    }

    const prompt =
      data && data.choices && data.choices[0] && data.choices[0].message
        ? String(data.choices[0].message.content || "").trim()
        : "";
    if (!prompt) return res.status(502).json({ error: "视觉模型未返回内容" });

    return res.status(200).json({ prompt, model });
  } catch (err) {
    return res.status(500).json({ error: String((err && err.message) || err) });
  }
};

module.exports.config = config;

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

async function readJson(req) {
  if (req.body) return typeof req.body === "string" ? JSON.parse(req.body) : req.body;
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
