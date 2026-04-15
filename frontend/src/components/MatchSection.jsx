import { useState } from 'react'
import { Search, ArrowLeft, AlertCircle } from 'lucide-react'
import { matchResume } from '../api'

export default function MatchSection({ resumeId, onSuccess, onBack }) {
  const [jobDesc, setJobDesc] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (jobDesc.trim().length < 10) {
      setError('岗位描述至少需要 10 个字符')
      return
    }

    setError(null)
    setLoading(true)
    try {
      const data = await matchResume(resumeId, jobDesc.trim())
      onSuccess(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto animate-slide-up">
      <div className="glass-card p-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-sm text-white/40 hover:text-white/70 transition-colors mb-6"
        >
          <ArrowLeft size={14} />
          返回解析结果
        </button>

        <h2 className="text-xl font-bold text-white/90 mb-2 flex items-center gap-2"><Search size={20} className="text-cosmos-400" /> 岗位匹配</h2>
        <p className="text-white/40 text-sm mb-6">输入岗位需求描述，AI 将分析简历与岗位的匹配程度</p>

        <form onSubmit={handleSubmit}>
          <textarea
            value={jobDesc}
            onChange={(e) => setJobDesc(e.target.value)}
            placeholder="请输入岗位需求描述，例如：&#10;&#10;我们正在招聘一名 Python 后端开发工程师，要求：&#10;- 熟悉 Python、FastAPI 或 Django 框架&#10;- 了解数据库设计（MySQL/PostgreSQL）&#10;- 有 Docker、CI/CD 经验优先&#10;- 计算机相关专业本科及以上"
            className="input-field h-48 resize-none font-body text-sm leading-relaxed"
            disabled={loading}
          />

          <div className="flex items-center justify-between mt-6">
            <span className="text-white/20 text-xs">{jobDesc.length} 字</span>
            <button
              type="submit"
              disabled={loading || jobDesc.trim().length < 10}
              className="btn-primary flex items-center gap-2 text-sm"
            >
              {loading ? (
                <>
                  <span className="spinner" />
                  AI 分析中...
                </>
              ) : (
                <>
                  <Search size={14} />
                  开始匹配
                </>
              )}
            </button>
          </div>
        </form>

        {error && (
          <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  )
}
