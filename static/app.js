const form = document.querySelector("#generator-form");
const productInput = document.querySelector("#product");
const audienceInput = document.querySelector("#audience");
const toneInput = document.querySelector("#tone");
const themeInput = document.querySelector("#theme");
const generateButton = document.querySelector("#generate-button");
const formMessage = document.querySelector("#form-message");
const preview = document.querySelector("#preview");
const jsonOutput = document.querySelector("#json-output");
const copyButton = document.querySelector("#copy-button");
const downloadButton = document.querySelector("#download-button");

let currentContent = null;

function setMessage(message, isError = false) {
  formMessage.textContent = message;
  formMessage.style.color = isError ? "#b23b32" : "#35755b";
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function render(content) {
  currentContent = content;
  preview.dataset.theme = content.theme;
  document.querySelector("#preview-eyebrow").textContent = content.eyebrow;
  document.querySelector("#preview-headline").textContent = content.headline;
  document.querySelector("#preview-subheadline").textContent = content.subheadline;

  const tagRow = document.querySelector("#preview-tags");
  tagRow.replaceChildren(
    ...content.tags.map((tag) => {
      const item = document.createElement("span");
      item.className = "tag";
      item.textContent = tag;
      return item;
    })
  );

  const features = document.querySelector("#preview-features");
  features.replaceChildren(
    ...content.features.map((feature) => {
      const article = document.createElement("article");
      article.className = "feature";
      const title = document.createElement("h3");
      title.textContent = feature.title;
      const body = document.createElement("p");
      body.textContent = feature.body;
      article.append(title, body);
      return article;
    })
  );

  document.querySelector("#preview-cta").textContent = content.cta;

  const faq = document.querySelector("#preview-faq");
  faq.replaceChildren(
    ...content.faq.map((item) => {
      const wrapper = document.createElement("div");
      wrapper.className = "faq-item";
      const question = document.createElement("strong");
      question.textContent = item.question;
      const answer = document.createElement("p");
      answer.textContent = item.answer;
      wrapper.append(question, answer);
      return wrapper;
    })
  );

  jsonOutput.textContent = JSON.stringify(content, null, 2);
}

async function generate() {
  formMessage.textContent = "";
  generateButton.disabled = true;
  generateButton.querySelector("span:first-child").textContent = "生成中";

  const payload = {
    product: productInput.value,
    audience: audienceInput.value,
    tone: toneInput.value,
    theme: themeInput.value,
  };

  try {
    const response = await fetch("./api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    if (!response.ok || !data.ok) {
      throw new Error(data.error || "生成失败");
    }

    render(data.content);
    setMessage("已根据当前 brief 生成一版可预览页面。");
  } catch (error) {
    render(localGenerate(payload));
    setMessage("当前为静态演示模式：未连接后端，已使用浏览器本地生成。");
  } finally {
    generateButton.disabled = false;
    generateButton.querySelector("span:first-child").textContent = "生成页面";
  }
}

function localGenerate(payload) {
  const clean = (value, fallback, maxLength = 80) => {
    const text = String(value || "").trim().replaceAll(/\s+/g, " ");
    return (text || fallback).slice(0, maxLength);
  };
  const product = clean(payload.product, "AI 内容小工具");
  const audience = clean(payload.audience, "独立创作者和小团队");
  const tone = ["professional", "friendly", "bold"].includes(payload.tone)
    ? payload.tone
    : "professional";
  const theme = ["blue", "orange", "mono"].includes(payload.theme)
    ? payload.theme
    : "blue";

  let headline;
  let subheadline;
  let cta;
  if (tone === "friendly") {
    headline = `把${product}做成今天就能用的东西`;
    subheadline = `先做一个${audience}能打开、能操作、能分享的版本，再把想法慢慢做完整。`;
    cta = "先做一个可用版本";
  } else if (tone === "bold") {
    headline = `${product}，现在就该有一个能打开的版本`;
    subheadline = `不等完整团队，不写空泛方案。给${audience}一个能马上体验、马上反馈的入口。`;
    cta = "现在开始验证";
  } else {
    headline = `让${audience}更快用上${product}`;
    subheadline = "把想法变成可演示的产品页面：结构清楚、信息直接、上线前就能拿到真实反馈。";
    cta = "查看产品方案";
  }

  return {
    product,
    audience,
    eyebrow: "内容产品实验室 / 快速原型",
    headline,
    subheadline,
    tags: ["AI 辅助", "快速原型", "可导出 HTML"],
    features: [
      { title: "从想法到页面", body: "把产品名、受众和表达重点拆成结构化字段，减少反复沟通。" },
      { title: "先验证，再扩展", body: "先交付一个能打开的页面，再根据真实反馈决定下一步功能。" },
      { title: "可复制、可迭代", body: "页面内容以 JSON 返回，可继续接入大模型、编辑器和数据统计。" },
    ],
    cta,
    faq: [
      { question: "这个页面生成器适合谁？", answer: `适合需要快速验证产品表达和页面结构的${audience}。` },
      { question: "生成后可以直接上线吗？", answer: "可以先把导出的 HTML 用作演示页，正式上线前再补充域名、埋点和内容审核。" },
      { question: "如何接入真实大模型？", answer: "保留现有 JSON 结构，把本地模板生成替换成模型调用，并对返回结果做校验和二次编辑。" },
    ],
    prompt: `你是一名内容产品设计师。请把下面的产品想法变成一版可上线的中文落地页内容。\n产品：${product}\n目标受众：${audience}\n语气：${tone}\n输出 JSON，字段包括 eyebrow、headline、subheadline、tags、features（title/body）、cta、faq（question/answer）。不要编造客户案例、价格、融资或未经证实的数据。`,
    engine: "local-browser",
    theme,
  };
}

function buildStandaloneHtml(content) {
  const features = content.features
    .map(
      (item) =>
        `<article class="feature"><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(
          item.body
        )}</p></article>`
    )
    .join("");
  const tags = content.tags
    .map((tag) => `<span>${escapeHtml(tag)}</span>`)
    .join("");
  const faqs = content.faq
    .map(
      (item) =>
        `<div class="faq"><strong>${escapeHtml(item.question)}</strong><p>${escapeHtml(
          item.answer
        )}</p></div>`
    )
    .join("");
  const accent = content.theme === "orange" ? "#d65d20" : content.theme === "mono" ? "#20242b" : "#155eef";
  const soft = content.theme === "orange" ? "#fff0e8" : content.theme === "mono" ? "#eef0f3" : "#e9f0ff";

  return `<!doctype html>
<html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(content.product)}</title>
<style>
body{margin:0;background:#f7f9fc;color:#172231;font-family:"Segoe UI","Microsoft YaHei",sans-serif;line-height:1.6}
main{max-width:980px;margin:0 auto;padding:64px 28px}
.eyebrow{color:${accent};font-size:12px;font-weight:700;letter-spacing:.08em}
h1{max-width:760px;margin:28px 0 16px;color:${accent};font-size:54px;line-height:1.08}
.sub{max-width:620px;color:#536274;font-size:18px}
.tags{display:flex;gap:8px;flex-wrap:wrap;margin:26px 0 34px}
.tags span{padding:6px 10px;background:${soft};color:${accent};border-radius:4px;font-size:13px;font-weight:600}
.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
.feature{padding:18px;background:#fff;border:1px solid #dbe2eb;border-top:3px solid ${accent};border-radius:6px}
.feature h3{margin:0 0 8px;color:${accent};font-size:16px}.feature p{margin:0;color:#647184;font-size:14px}
.cta{display:inline-block;margin-top:30px;padding:10px 16px;background:${accent};color:#fff;border-radius:5px;text-decoration:none;font-weight:700}
.faq{margin-top:18px;padding-top:14px;border-top:1px solid #dbe2eb}.faq strong{display:block;color:#29384b}.faq p{margin:4px 0 0;color:#68778a}
@media(max-width:720px){main{padding:36px 20px}.grid{grid-template-columns:1fr}h1{font-size:40px}}
</style></head><body><main>
<div class="eyebrow">${escapeHtml(content.eyebrow)}</div>
<h1>${escapeHtml(content.headline)}</h1>
<p class="sub">${escapeHtml(content.subheadline)}</p>
<div class="tags">${tags}</div>
<div class="grid">${features}</div>
<a class="cta" href="#">${escapeHtml(content.cta)}</a>
<section>${faqs}</section>
</main></body></html>`;
}

copyButton.addEventListener("click", async () => {
  if (!currentContent) return;
  const text = JSON.stringify(currentContent, null, 2);
  try {
    await navigator.clipboard.writeText(text);
    setMessage("JSON 已复制到剪贴板。");
  } catch {
    setMessage("浏览器不允许自动复制，请在 API 返回区域手动选择。", true);
  }
});

downloadButton.addEventListener("click", () => {
  if (!currentContent) return;
  const blob = new Blob([buildStandaloneHtml(currentContent)], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "launchcraft-page.html";
  anchor.click();
  URL.revokeObjectURL(url);
  setMessage("独立 HTML 已下载。");
});

document.querySelectorAll(".idea-chip").forEach((button) => {
  button.addEventListener("click", () => {
    productInput.value = button.dataset.product;
    audienceInput.value = button.dataset.audience;
    generate();
  });
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  generate();
});

generate();
