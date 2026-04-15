"""岗位匹配评分，简历和岗位需求对比得分"""

import json
import logging

from openai import AsyncOpenAI

from app.core.config import get_settings
from app.models.schemas import ResumeData, MatchScore

logger = logging.getLogger(__name__)

MATCH_PROMPT = """你是一个专业的招聘匹配评估助手。请根据以下简历信息和岗位需求，进行匹配分析并评分。

**简历信息：**
- 姓名：{name}
- 技能：{skills}
- 工作年限：{work_years}
- 学历：{education}
- 项目经历：{projects}
- 求职意向：{position}

**岗位需求描述：**
{job_description}

**请严格按以下 JSON 格式输出评分结果：**
{{
  "overall_score": <0-100 综合匹配度>,
  "skill_match": <0-100 技能匹配率>,
  "experience_match": <0-100 工作经验相关性>,
  "education_match": <0-100 学历匹配度>,
  "ai_comment": "<100字以内的综合评语>",
  "matched_keywords": ["匹配到的技能/关键词"],
  "missing_keywords": ["岗位要求但简历缺失的关键词"]
}}

**评分规则：**
1. skill_match：简历技能与岗位需求的重合度
2. experience_match：工作年限和项目经历与岗位的匹配程度
3. education_match：学历是否满足岗位要求
4. overall_score：加权综合，技能 50%、经验 30%、学历 20%
5. 仅输出 JSON
"""


async def match_resume_to_job(resume_data: ResumeData, job_description: str) -> MatchScore:
    """让ai来对比简历和岗位的匹配度。打分"""
    settings = get_settings()
    client = AsyncOpenAI(api_key=settings.AI_API_KEY, base_url=settings.AI_BASE_URL)

    bg = resume_data.background
    try:
        response = await client.chat.completions.create(
            model=settings.AI_MODEL,
            messages=[
                {"role": "system", "content": "你是专业的招聘匹配评估助手，只输出合法 JSON。"},
                {
                    "role": "user",
                    "content": MATCH_PROMPT.format(
                        name=resume_data.basic_info.name or "未知",
                        skills=", ".join(resume_data.skills) if resume_data.skills else "未提取到",
                        work_years=bg.work_years or "未知",
                        education=bg.education or "未知",
                        projects="; ".join(bg.projects) if bg.projects else "未提取到",
                        position=resume_data.job_intent.position or "未知",
                        job_description=job_description[:3000],
                    ),
                },
            ],
            temperature=0.2,
        )

        raw = response.choices[0].message.content

        # 和上面一样处理一下markdown代码块
        json_str = raw.strip()
        if json_str.startswith("```"):
            lines = json_str.split("\n")
            json_str = "\n".join(lines[1:-1] if lines[-1].strip() == "```" else lines[1:])

        data = json.loads(json_str)

        return MatchScore(
            overall_score=float(data.get("overall_score", 0)),
            skill_match=float(data.get("skill_match", 0)),
            experience_match=float(data.get("experience_match", 0)),
            education_match=float(data.get("education_match", 0)),
            ai_comment=data.get("ai_comment", ""),
            matched_keywords=data.get("matched_keywords", []),
            missing_keywords=data.get("missing_keywords", []),
        )
    except Exception as e:
        logger.error("匹配评分失败了: %s", e)
        return MatchScore(
            overall_score=0,
            skill_match=0,
            experience_match=0,
            education_match=0,
            ai_comment=f"评分服务挂了: {e}",
        )
