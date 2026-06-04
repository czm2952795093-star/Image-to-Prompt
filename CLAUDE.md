# Image → GPT Image Prompt

Chrome 扩展（MV3）：右键任意图片 → 调视觉模型识别 → 生成可用于 **GPT Image** 高保真复现的提示词，毛玻璃浮层展示 + 一键复制。

## 架构（双模式）
1. **扩展自带 Key（默认/主推）**：用户自己的 API Key 存 `chrome.storage.local`，扩展直连 AiHubMix / 任意 OpenAI 兼容网关。**无需部署任何后端**。
2. **可选后端代理**（`backend/`，Vercel）：Key 只存服务端，扩展不持密钥。适合不想让用户填 Key 的分发场景。

流程：右键图片 → `contextMenus` → `background.js` 抓图转 base64 → 调视觉模型 → 返回结构化提示词 → content 脚本毛玻璃浮层 + 复制。

GitHub: `realruian/gpt-image-prompt`

## 关键目录
- `extension/` —— **MV3 扩展源**（加载进 Chrome 的就是这个目录）
  - `manifest.json`（perms: `contextMenus`/`storage`/`scripting`，host: `<all_urls>`）
  - `background.js`（service worker：右键菜单 + 抓图 + 调模型）
  - `content/`（注入页面的浮层 UI）、`popup.*`（工具栏弹窗）、`options.*`（设置/填 Key）、`icons/`
- `backend/` —— 可选 Vercel 代理（`api/` + `local-server.cjs`），独立 package.json
- `store/` —— Chrome Web Store 上架资料（LISTING.md / PRIVACY.md / privacy.html）
- `docs/` —— preview.svg 等

## 开发 / 加载
```bash
# 扩展：无构建，直接加载
# Chrome → chrome://extensions → 开发者模式 → 加载已解压 → 选 extension/ 目录
# 改完 background/manifest 在扩展页点「刷新」重新加载

# 后端代理（仅用模式 2 时）
cd backend && npm install && node local-server.cjs   # 本地；或部署到 Vercel
```

## 注意
- 改 `extension/manifest.json` 的权限/host 要重新加载扩展才生效
- Key 安全：模式 1 下 Key 只在 `chrome.storage.local`，不要写进仓库或日志
- 上架前同步更新 `store/LISTING.md` 和隐私政策
