import { User, Phone, Mail, MapPin, Briefcase, GraduationCap, Code, ArrowRight, RotateCcw, FileCheck } from 'lucide-react'

function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null
  return (
    <div className="flex items-start gap-3 py-2">
      <Icon size={16} className="text-cosmos-400 mt-0.5 shrink-0" />
      <div>
        <span className="text-white/40 text-xs">{label}</span>
        <p className="text-white/80 text-sm">{value}</p>
      </div>
    </div>
  )
}

export default function ResumeResult({ data, onNext, onReset }) {
  const { resume_data: r, filename, page_count, text_length } = data

  return (
    <div className="space-y-6 animate-slide-up">
      {/* 文件概况 */}
      <div className="glass-card p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h2 className="text-xl font-bold text-white/90 mb-1 flex items-center gap-2"><FileCheck size={20} className="text-cosmos-400" /> 解析完成</h2>
            <p className="text-white/40 text-sm">
              {filename} · {page_count} 页 · {text_length.toLocaleString()} 字符
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={onReset} className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white/50 hover:text-white/80 bg-white/5 hover:bg-white/10 transition-all">
              <RotateCcw size={14} />
              重新上传
            </button>
            <button onClick={onNext} className="btn-primary flex items-center gap-2 text-sm">
              岗位匹配
              <ArrowRight size={14} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 基本信息卡片 */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-cosmos-300 uppercase tracking-wider mb-4">基本信息</h3>
          <div className="space-y-1">
            <InfoRow icon={User} label="姓名" value={r.basic_info.name} />
            <InfoRow icon={Phone} label="电话" value={r.basic_info.phone} />
            <InfoRow icon={Mail} label="邮箱" value={r.basic_info.email} />
            <InfoRow icon={MapPin} label="地址" value={r.basic_info.address} />
          </div>
        </div>

        {/* 求职相关的信息 */}
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-cosmos-300 uppercase tracking-wider mb-4">职业信息</h3>
          <div className="space-y-1">
            <InfoRow icon={Briefcase} label="求职意向" value={r.job_intent.position} />
            <InfoRow icon={Briefcase} label="期望薪资" value={r.job_intent.expected_salary} />
            <InfoRow icon={GraduationCap} label="学历" value={r.background.education} />
            <InfoRow icon={Briefcase} label="工作年限" value={r.background.work_years} />
          </div>
        </div>
      </div>

      {/* 技能标签们 */}
      {r.skills && r.skills.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-cosmos-300 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Code size={14} />
            技能
          </h3>
          <div className="flex flex-wrap gap-2">
            {r.skills.map((skill) => (
              <span key={skill} className="tag">{skill}</span>
            ))}
          </div>
        </div>
      )}

      {/* 项目经历列表 */}
      {r.background.projects && r.background.projects.length > 0 && (
        <div className="glass-card p-6">
          <h3 className="text-sm font-semibold text-cosmos-300 uppercase tracking-wider mb-4">项目经历</h3>
          <ul className="space-y-3">
            {r.background.projects.map((proj, i) => (
              <li key={i} className="flex items-start gap-3 text-sm text-white/60">
                <span className="text-cosmos-400 mt-1">•</span>
                <span>{proj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
