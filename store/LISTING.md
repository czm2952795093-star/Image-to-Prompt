# Chrome 应用商店上架文案

> 提交地址：https://chrome.google.com/webstore/devconsole
> 上传文件：`dist/extension.zip`

## 基本信息

- **名称**：Image → GPT Image Prompt
- **简短描述（≤132 字符）**：
  右键任意图片，一键生成可用于 GPT Image 复现该图的高保真提示词。自带 API Key，密钥仅存本地。
- **类别**：Productivity（生产工具）
- **语言**：中文（简体）/ English

## 详细描述

```
右键任意网页图片，自动识别并生成一段结构化、可直接喂给 GPT Image 的「复现提示词」。

【它能做什么】
• 在任意图片上点右键 →「转换为 GPT Image 提示词」
• 自动按 OpenAI 官方 GPT Image 提示词规则输出：场景 → 主体 → 细节 → 画面文字（逐字锁定）→ 构图 → HEX 色板 → 约束 → 长宽比
• 一键复制，丢进 GPT Image 即可尽可能复现原图

【自带 Key，隐私优先】
• 使用你自己的 API Key（AiHubMix 或任意 OpenAI 兼容网关）
• Key 仅保存在你的浏览器本地，不上传任何第三方服务器
• 没有后台、没有埋点、没有数据收集

【适合谁】
• 想还原一张参考图风格 / 构图的创作者
• 研究提示词工程、做图像逆向的人

注意：纯文字提示词无法 100% 复现原图，这是文生图模型的固有限制；本扩展已把单次提示词写到信息密度最大，构图与主体可高度接近。
```

## 单一用途声明（Single Purpose）

```
This extension has a single purpose: convert a user-selected (right-clicked) image
into a descriptive text-to-image prompt that can recreate that image with GPT Image.
```

## 权限用途说明（逐条，审核必填）

| 权限 | 用途说明（填进后台对应框） |
| --- | --- |
| `contextMenus` | 在图片上添加「转换为 GPT Image 提示词」右键菜单项。 |
| `storage` | 在本地保存用户填写的 API Key、模型名与 API 地址。 |
| `scripting` | 把生成结果的浮层注入到当前标签页以展示提示词。 |
| `host_permissions` (`<all_urls>`) | ① 读取用户右键的那张图片的字节，发送给视觉模型识别；② 在用户右键图片的任意网页上注入结果浮层；③ 向用户自己配置的 API 地址发送识别请求。扩展不会主动读取或修改页面其它内容。 |

## 数据处理声明（Data usage，后台勾选 + 文字）

- 不收集任何个人身份信息。
- 不向开发者的服务器发送任何数据（本扩展无后端）。
- 用户右键的图片与 API Key，仅发送至**用户自己配置的 API 地址**（默认 AiHubMix）用于生成提示词。
- 不出售、不转移数据；不用于广告或与扩展功能无关的用途。
- 勾选：「I do not sell or transfer user data to third parties, outside of the approved use cases」等三项合规声明。

## 隐私政策 URL

需公开可访问。用 `store/PRIVACY.md` 的内容部署一个页面（GitHub Pages / Vercel 均可），把 URL 填进后台。

## 需要的图片素材

| 素材 | 尺寸 | 状态 |
| --- | --- | --- |
| 商店图标 | 128×128 | ✅ 已有 `extension/icons/icon128.png` |
| 截图（至少 1 张） | 1280×800 或 640×400 | ⬜ 需补：建议截「右键菜单 + 结果浮层」实拍图 |
| 小宣传图（可选） | 440×280 | ⬜ 可选 |
| 大宣传图（可选） | 1400×560 | ⬜ 可选 |
```
