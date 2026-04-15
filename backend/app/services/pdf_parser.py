"""pdf解析相关的 上传、解析、清洗都在这"""

import hashlib
import os
import re
import uuid

import pdfplumber

from app.core.config import get_settings


def generate_resume_id(content: bytes) -> str:
    """用文件内容的sha256生成id，同一份文件会得到同一个id，天然去重"""
    digest = hashlib.sha256(content).hexdigest()[:16]
    return f"resume_{digest}"


def save_upload(file_content: bytes, filename: str) -> str:
    """把上传的文件存到本地"""
    settings = get_settings()
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    safe_name = f"{uuid.uuid4().hex[:8]}_{filename}"
    path = os.path.join(settings.UPLOAD_DIR, safe_name)
    with open(path, "wb") as f:
        f.write(file_content)
    return path


def extract_text_from_pdf(file_path: str) -> tuple[str, int]:
    """从 pdf 里把文字抽出来, 返回 (文本, 页数)"""
    pages_text = []
    with pdfplumber.open(file_path) as pdf:
        page_count = len(pdf.pages)
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                pages_text.append(text)
    raw_text = "\n\n".join(pages_text)
    return raw_text, page_count


def clean_text(text: str) -> str:
    """清洗文本，去掉乱七八糟的字符"""
    # 多余的空行压缩一下
    text = re.sub(r"\n{3,}", "\n\n", text)
    # 每行前后的空格去掉
    lines = [line.strip() for line in text.splitlines()]
    text = "\n".join(lines)
    # 不可见字符去掉
    text = re.sub(r"[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]", "", text)
    # 连续空格合并
    text = re.sub(r" {2,}", " ", text)
    return text.strip()
