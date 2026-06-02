// Image → GPT Image Prompt — 页面浮层。被 background 通过 executeScript 注入（可重复注入，做幂等保护）。
(() => {
  if (window.__img2promptOverlayReady) return;
  window.__img2promptOverlayReady = true;

  let root, body, copyBtn, currentPrompt = "";

  function ensureDom() {
    if (root) return;
    root = document.createElement("div");
    root.id = "img2prompt-overlay";
    root.innerHTML = `
      <div class="i2p-panel" role="dialog" aria-label="GPT Image 提示词">
        <div class="i2p-head">
          <span class="i2p-title">GPT Image 提示词</span>
          <button class="i2p-close" title="关闭" aria-label="关闭">✕</button>
        </div>
        <div class="i2p-body"></div>
        <div class="i2p-foot">
          <button class="i2p-copy" disabled>复制提示词</button>
        </div>
      </div>`;
    document.documentElement.appendChild(root);

    body = root.querySelector(".i2p-body");
    copyBtn = root.querySelector(".i2p-copy");
    root.querySelector(".i2p-close").addEventListener("click", hide);
    copyBtn.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(currentPrompt);
        copyBtn.textContent = "已复制 ✓";
        setTimeout(() => (copyBtn.textContent = "复制提示词"), 1500);
      } catch {
        copyBtn.textContent = "复制失败，请手动选择";
      }
    });
  }

  function show() {
    ensureDom();
    root.classList.add("i2p-visible");
  }
  function hide() {
    if (root) root.classList.remove("i2p-visible");
  }

  function setLoading() {
    show();
    copyBtn.disabled = true;
    body.className = "i2p-body i2p-loading";
    body.textContent = "正在识别图片并生成提示词…";
  }

  function setResult(prompt) {
    show();
    currentPrompt = prompt;
    body.className = "i2p-body";
    const pre = document.createElement("pre");
    pre.className = "i2p-prompt";
    pre.textContent = prompt;
    body.replaceChildren(pre);
    copyBtn.disabled = false;
  }

  function setError(error) {
    show();
    copyBtn.disabled = true;
    body.className = "i2p-body i2p-error";
    body.replaceChildren();
    const msg = document.createElement("div");
    msg.textContent = "出错了：" + error;
    body.appendChild(msg);
    if (/API Key/i.test(error)) {
      const btn = document.createElement("button");
      btn.className = "i2p-settings";
      btn.textContent = "打开设置填 Key";
      btn.addEventListener("click", () => {
        try {
          chrome.runtime.sendMessage({ type: "OPEN_OPTIONS" }, () => {
            if (chrome.runtime.lastError) hintToolbar();
          });
        } catch {
          hintToolbar();
        }
      });
      body.appendChild(btn);
    }
  }

  function hintToolbar() {
    body.replaceChildren();
    const t = document.createElement("div");
    t.textContent =
      "请点击浏览器右上角的扩展图标（🧩 拼图菜单里找到本扩展并固定）来填写 Key，然后重新右键图片。";
    body.appendChild(t);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || !msg.type) return;
    if (msg.type === "LOADING") setLoading();
    else if (msg.type === "RESULT") setResult(msg.prompt);
    else if (msg.type === "ERROR") setError(msg.error);
  });
})();
