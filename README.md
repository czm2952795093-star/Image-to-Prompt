# Image → GPT Image Prompt

Chrome 扩展（MV3）：右键任意图片 → 自动识别 → 生成可用于 **GPT Image 2** 高保真复现的提示词，一键复制。

```
右键图片 → contextMenus → background 抓图转 base64
   → 自建后端 /api/describe（持有 AiHubMix Key，调 GPT-5.5 vision）
   → 返回结构化复现提示词 → 页面浮层展示 + 复制
```

## 结构

```
extension/              Chrome 扩展（MV3，无需构建，直接加载）
  manifest.json
  background.js         右键菜单 + 抓图 + 调后端
  content/overlay.{js,css}  结果浮层 + 复制
  options.html / options.js 配置后端地址
backend/                Vercel 后端代理
  api/describe.ts       视觉模型调用 + 复现专用元提示词
```

## 快速开始

1. **起后端**（见 `backend/README.md`）：填 `AIHUBMIX_API_KEY`，`npx vercel dev`。
2. **装扩展**：Chrome → `chrome://extensions` → 开启「开发者模式」→「加载已解压的扩展程序」→ 选 `extension/` 目录。
3. **配置**：点扩展图标打开选项页，填后端地址（本地 `http://localhost:3000/api/describe`）。
4. **使用**：任意网页图片上右键 →「转换为 GPT Image 提示词」→ 浮层出结果 → 复制 → 丢进 GPT Image 2。

## 关于「一模一样」的现实预期

纯文字（prompt-only）路线**无法 100% 复现原图**——文生图是有损、非确定过程。
本扩展已按 OpenAI 官方提示词规则把单次提示词写到信息密度最大（字段顺序、画面文字逐字锁定、HEX 色板、精确长宽比），
构图与主体可高度接近；但精确人脸、复杂画面文字、繁多细节仍会有偏差。
若要逼近「几乎一致」，需改用 `images.edit` 参考图重绘模式（当前未启用，按需扩展）。

## 视觉模型

默认 `gpt-5.5`（与 GPT Image 2 同生态，提示词迁移损耗最小）。
通过 AiHubMix 网关调用，后端 `VISION_MODEL` 环境变量可换 Claude / Gemini 等任意 AiHubMix 支持的模型对比效果。
