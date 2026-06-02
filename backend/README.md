# 后端代理（Vercel）

把图片转成 GPT Image 2 复现提示词。API Key 只存在于服务端，Chrome 扩展不持有密钥。

## 本地运行

```bash
cd backend
npm install
cp .env.example .env.local   # 填入 AIHUBMIX_API_KEY
npx vercel dev               # 默认 http://localhost:3000
```

接口：`POST http://localhost:3000/api/describe`，请求体 `{ "image": "<data URL>" }`，返回 `{ "prompt": "..." }`。

在扩展的「选项」页把后端地址填为 `http://localhost:3000/api/describe`。

## 部署到 Vercel

```bash
cd backend
npx vercel            # 首次链接项目
npx vercel env add AIHUBMIX_API_KEY   # 录入密钥（Production / Preview）
npx vercel deploy --prod
```

部署后把扩展「选项」页的后端地址改为 `https://<你的域名>/api/describe`。

## 环境变量

| 变量 | 必填 | 说明 |
| --- | --- | --- |
| `AIHUBMIX_API_KEY` | 是 | AiHubMix 密钥（OpenAI 兼容网关） |
| `API_BASE_URL` | 否 | 上游地址，默认 `https://aihubmix.com/v1` |
| `VISION_MODEL` | 否 | 视觉模型，默认 `gpt-5.5`（需为 AiHubMix 支持的 ID） |

## 提示词策略

`api/describe.ts` 里的 `META_PROMPT` 强制视觉模型按 OpenAI 官方 GPT Image 提示词规则输出：
字段顺序 `背景/场景 → 主体 → 关键细节 → 画面文字 → 构图 → 色板 → 约束`，
画面文字逐字锁定（引号 + 大小写 + 字体位置），附 HEX 主色板与符合 16 倍数的长宽比尺寸。
这是 prompt-only 路线下复现保真度的上限做法。要调风格，改这段即可。
