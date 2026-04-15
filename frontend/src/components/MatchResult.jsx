import { ArrowLeft, RotateCcw, CheckCircle, XCircle, MessageSquare, BarChart3 } from 'lucide-react'

function ScoreRing({ score, label }) {
  const color = score >= 70 ? '#4ade80' : score >= 40 ? '#facc15' : '#f87171'

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className="score-ring"
        style={{
          '--progress': score,
          background: `conic-gradient(${color} ${score}%, rgba(255,255,255,0.05) ${score}%)`,
        }}
      >
        <div className="score-ring-inner">
          <span className="text-2xl font-bold" style={{ color }}>{Math.round(score)}</span>
          <span className="text-[10px] text-white/30">/ 100</span>
        </div>
      </div>
      <span className="text-xs text-white/40 font-medium">{label}</span>
    </div>
  )
}

function KeywordTag({ word, matched }) {
  return (
    <span className={matched ? 'tag tag-success' : 'tag tag-danger'}>
      {matched ? <CheckCircle size={12} className="mr-1" /> : <XCircle size={12} className="mr-1" />}
      {word}
    </span>
  )
}

export default function MatchResult({ data, onBack, onReset }) {
  const { match_score: s } = data

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 总体情况 */}
      <div className="glass-card p-8">
        <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-1 flex items-center gap-2"><BarChart3 size={20} className="text-cosmos-400" /> 匹配报告</h2>
            <p className="text-white/40 text-sm">
              候选人：{data.resume_data.basic_info.name || '未知'}
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onBack} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 transition-all">
              <ArrowLeft size={14} />
              重新匹配
            </button>
            <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 transition-all">
              <RotateCcw size={14} />
              分析新简历
            </button>
          </div>
        </div>

        {/* 四个得分环 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 justify-items-center">
          <ScoreRing score={s.overall_score} label="综合匹配度" />
          <ScoreRing score={s.skill_match} label="技能匹配" />
          <ScoreRing score={s.experience_match} label="经验相关性" />
          <ScoreRing score={s.education_match} label="学历匹配" />
        </div>
      </div>

      {/* ai的评价 */}
      {s.ai_comment && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-cosmos-300 uppercase tracking-wider mb-3 flex items-center gap-2">
            <MessageSquare size={14} />
            AI 评语
          </h3>
          <p className="text-white/60 text-sm leading-relaxed">{s.ai_comment}</p>
        </div>
      )}

      {/* 匹配的关键词和缺少的 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {s.matched_keywords && s.matched_keywords.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-green-400/80 uppercase tracking-wider mb-3 flex items-center gap-2">
              <CheckCircle size={14} />
              匹配关键词
            </h3>
            <div className="flex flex-wrap gap-2">
              {s.matched_keywords.map((w) => (
                <KeywordTag key={w} word={w} matched />
              ))}
            </div>
          </div>
        )}

        {s.missing_keywords && s.missing_keywords.length > 0 && (
          <div className="glass-card p-6">
            <h3 className="text-sm font-semibold text-red-400/80 uppercase tracking-wider mb-3 flex items-center gap-2">
              <XCircle size={14} />
              缺失关键词
            </h3>
            <div className="flex flex-wrap gap-2">
              {s.missing_keywords.map((w) => (
                <KeywordTag key={w} word={w} matched={false} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
