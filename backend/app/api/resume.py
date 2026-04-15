"""简历相关的api路由都在这"""

import logging

from fastapi import APIRouter, File, UploadFile, HTTPException

from app.models.schemas import ResumeUploadResponse, MatchRequest, MatchResponse
from app.services.pdf_parser import generate_resume_id, save_upload, extract_text_from_pdf, clean_text
from app.services.ai_extractor import extract_resume_info
from app.services.matcher import match_resume_to_job
from app.services.cache import get_cache, set_cache
from app.core.config import get_settings

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/resume", tags=["简历分析"])

# 内存存简历解析结果，重启就没了，生产环境应该换数据库
_resume_store: dict = {}


@router.post("/upload", response_model=ResumeUploadResponse, summary="上传并解析简历")
async def upload_resume(file: UploadFile = File(..., description="PDF 格式简历文件")):
    """
    上传pdf简历，自动完成解析和ai提取
    1. 文件校验
    2. pdf文本提取+清洗
    3. ai提取关键信息
    4. 结果缓存（如果redis可用的话）
    """
    # 检查下文件类型
    if not file.filename or not file.filename.lower().endswith(".pdf"):
        raise HTTPException(status_code=400, detail="只支持pdf格式")

    # 检查大小
    content = await file.read()
    settings = get_settings()
    if len(content) > settings.MAX_FILE_SIZE:
        raise HTTPException(status_code=400, detail=f"文件太大了 (限制{settings.MAX_FILE_SIZE // 1024 // 1024}MB)")

    if len(content) == 0:
        raise HTTPException(status_code=400, detail="文件是空的")

    # 生成id，查缓存
    resume_id = generate_resume_id(content)
    cache_key = f"resume:{resume_id}"
    cached = await get_cache(cache_key)
    if cached:
        logger.info("缓存命中了: %s", resume_id)
        _resume_store[resume_id] = cached["resume_data"]
        return ResumeUploadResponse(**cached)

    # 保存文件
    file_path = save_upload(content, file.filename)

    # 抽取文本
    try:
        raw_text, page_count = extract_text_from_pdf(file_path)
    except Exception as e:
        raise HTTPException(status_code=422, detail=f"pdf解析失败了: {e}")

    if not raw_text.strip():
        raise HTTPException(status_code=422, detail="pdf里没有提取到文字内容")

    # 清洗一下
    cleaned_text = clean_text(raw_text)

    # 让ai提取信息
    resume_data = await extract_resume_info(cleaned_text)

    # 组装响应
    result = ResumeUploadResponse(
        resume_id=resume_id,
        filename=file.filename,
        page_count=page_count,
        text_length=len(cleaned_text),
        resume_data=resume_data,
    )

    # 存到内存和缓存
    _resume_store[resume_id] = resume_data
    await set_cache(cache_key, result.model_dump())

    return result


@router.post("/match", response_model=MatchResponse, summary="简历与岗位匹配评分")
async def match_resume(req: MatchRequest):
    """拿岗位描述去和已解析的简历对比得分"""
    # 找已解析的简历
    resume_data = _resume_store.get(req.resume_id)
    if not resume_data:
        # 缓存里找找看
        cached = await get_cache(f"resume:{req.resume_id}")
        if cached:
            from app.models.schemas import ResumeData
            resume_data = ResumeData(**cached["resume_data"])
            _resume_store[req.resume_id] = resume_data

    if not resume_data:
        raise HTTPException(status_code=404, detail="简历没找到，先上传一份吧")

    # 看看之前有没有匹配过
    match_cache_key = f"match:{req.resume_id}:{hash(req.job_description)}"
    cached_match = await get_cache(match_cache_key)
    if cached_match:
        return MatchResponse(**cached_match)

    # ai匹配评分
    match_score = await match_resume_to_job(resume_data, req.job_description)

    result = MatchResponse(
        resume_id=req.resume_id,
        job_description=req.job_description,
        resume_data=resume_data,
        match_score=match_score,
    )

    # 存下来
    await set_cache(match_cache_key, result.model_dump())

    return result


@router.get("/list", summary="获取已解析的简历列表")
async def list_resumes():
    """返回当前已解析的简历列表，重启会清空"""
    return [
        {
            "resume_id": rid,
            "name": data.basic_info.name,
            "email": data.basic_info.email,
            "skills_count": len(data.skills),
        }
        for rid, data in _resume_store.items()
    ]
