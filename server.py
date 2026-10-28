#!/usr/bin/env python3
"""LaunchCraft local demo server.

The demo intentionally has no third-party dependencies. It exposes a small
JSON API and serves the static frontend from the same origin.
"""

from __future__ import annotations

from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import json
import os
from pathlib import Path
from urllib.parse import urlparse


ROOT = Path(__file__).resolve().parent
STATIC_DIR = ROOT / "static"
MAX_BODY_BYTES = 64 * 1024

THEME_NAMES = {"blue", "orange", "mono"}
TONE_NAMES = {"professional", "friendly", "bold"}


def clean_text(value: object, fallback: str, max_length: int = 80) -> str:
    text = str(value or "").strip()
    if not text:
        text = fallback
    text = " ".join(text.split())
    return text[:max_length]


def build_prompt(product: str, audience: str, tone: str) -> str:
    return (
        "你是一名内容产品设计师。请把下面的产品想法变成一版可上线的中文落地页内容。"
        f"\n产品：{product}\n目标受众：{audience}\n语气：{tone}"
        "\n输出 JSON，字段包括 eyebrow、headline、subheadline、tags、"
        "features（title/body）、cta、faq（question/answer）。"
        "不要编造客户案例、价格、融资或未经证实的数据。"
    )


def generate_content(payload: dict) -> dict:
    product = clean_text(payload.get("product"), "AI 内容小工具")
    audience = clean_text(payload.get("audience"), "独立创作者和小团队")
    tone = clean_text(payload.get("tone"), "professional")
    theme = clean_text(payload.get("theme"), "blue")

    if tone not in TONE_NAMES:
        tone = "professional"
    if theme not in THEME_NAMES:
        theme = "blue"

    if tone == "friendly":
        headline = f"把{product}做成今天就能用的东西"
        subheadline = (
            f"先做一个{audience}能打开、能操作、能分享的版本，"
            "再把想法慢慢做完整。"
        )
        cta = "先做一个可用版本"
    elif tone == "bold":
        headline = f"{product}，现在就该有一个能打开的版本"
        subheadline = (
            f"不等完整团队，不写空泛方案。给{audience}一个"
            "能马上体验、马上反馈的入口。"
        )
        cta = "现在开始验证"
    else:
        headline = f"让{audience}更快用上{product}"
        subheadline = (
            "把想法变成可演示的产品页面：结构清楚、信息直接、"
            "上线前就能拿到真实反馈。"
        )
        cta = "查看产品方案"

    features = [
        {
            "title": "从想法到页面",
            "body": "把产品名、受众和表达重点拆成结构化字段，减少反复沟通。",
        },
        {
            "title": "先验证，再扩展",
            "body": "先交付一个能打开的页面，再根据真实反馈决定下一步功能。",
        },
        {
            "title": "可复制、可迭代",
            "body": "页面内容以 JSON 返回，可继续接入大模型、编辑器和数据统计。",
        },
    ]

    return {
        "product": product,
        "audience": audience,
        "eyebrow": "内容产品实验室 / 快速原型",
        "headline": headline,
        "subheadline": subheadline,
        "tags": ["AI 辅助", "快速原型", "可导出 HTML"],
        "features": features,
        "cta": cta,
        "faq": [
            {
                "question": "这个页面生成器适合谁？",
                "answer": f"适合需要快速验证产品表达和页面结构的{audience}。",
            },
            {
                "question": "生成后可以直接上线吗？",
                "answer": "可以先把导出的 HTML 用作演示页，正式上线前再补充域名、埋点和内容审核。",
            },
            {
                "question": "如何接入真实大模型？",
                "answer": "保留现有 JSON 结构，把本地模板生成替换成模型调用，并对返回结果做校验和二次编辑。",
            },
        ],
        "prompt": build_prompt(product, audience, tone),
        "engine": "local-template",
        "theme": theme,
    }


class AppHandler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def send_json(self, status: int, data: dict) -> None:
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self) -> None:
        if urlparse(self.path).path == "/api/health":
            self.send_json(200, {"ok": True, "engine": "local-template"})
            return
        super().do_GET()

    def do_POST(self) -> None:
        if urlparse(self.path).path != "/api/generate":
            self.send_json(404, {"ok": False, "error": "not_found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_BODY_BYTES:
                raise ValueError("invalid_body_size")
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            if not isinstance(payload, dict):
                raise ValueError("json_object_required")
            content = generate_content(payload)
            self.send_json(200, {"ok": True, "content": content})
        except (ValueError, json.JSONDecodeError) as exc:
            self.send_json(400, {"ok": False, "error": str(exc)})
        except Exception:
            self.send_json(500, {"ok": False, "error": "internal_error"})

    def log_message(self, fmt: str, *args) -> None:
        print(f"[LaunchCraft] {self.address_string()} {fmt % args}")


def main() -> None:
    port = int(os.getenv("PORT", "8000"))
    server = ThreadingHTTPServer(("127.0.0.1", port), AppHandler)
    print(f"LaunchCraft running at http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping LaunchCraft")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
