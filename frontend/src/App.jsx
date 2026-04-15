import { useState, useCallback } from 'react'
import Header from './components/Header'
import UploadSection from './components/UploadSection'
import ResumeResult from './components/ResumeResult'
import MatchSection from './components/MatchSection'
import MatchResult from './components/MatchResult'

export default function App() {
  const [resumeData, setResumeData] = useState(null)
  const [matchData, setMatchData] = useState(null)
  const [activeStep, setActiveStep] = useState(0) // 当前步骤 0上传 1结果 2匹配 3报告

  const handleUploadSuccess = useCallback((data) => {
    setResumeData(data)
    setMatchData(null)
    setActiveStep(1)
  }, [])

  const handleMatchSuccess = useCallback((data) => {
    setMatchData(data)
    setActiveStep(3)
  }, [])

  const handleReset = useCallback(() => {
    setResumeData(null)
    setMatchData(null)
    setActiveStep(0)
  }, [])

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* 背景装饰粒子 纯装饰的 */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-20 left-10 w-2 h-2 bg-cosmos-400/20 rounded-full animate-float" />
        <div className="absolute top-40 right-20 w-1.5 h-1.5 bg-nebula-400/20 rounded-full animate-float animate-delay-200" />
        <div className="absolute bottom-40 left-1/4 w-1 h-1 bg-stellar-400/30 rounded-full animate-float animate-delay-400" />
        <div className="absolute top-1/3 right-1/3 w-2.5 h-2.5 bg-cosmos-300/10 rounded-full animate-float animate-delay-100" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <Header />

        {/* 步骤条 */}
        <div className="flex items-center justify-center gap-0.5 sm:gap-3 mb-10 px-1">
          {['上传简历', '解析结果', '岗位匹配', '评分报告'].map((label, i) => (
            <div key={label} className="flex items-center gap-0.5 sm:gap-3">
              <button
                onClick={() => {
                  if (i === 0) setActiveStep(0)
                  else if (i === 1 && resumeData) setActiveStep(1)
                  else if (i === 2 && resumeData) setActiveStep(2)
                  else if (i === 3 && matchData) setActiveStep(3)
                }}
                className={`flex items-center gap-1 sm:gap-2 px-1.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeStep === i
                    ? 'bg-cosmos-600/30 text-cosmos-200 border border-cosmos-500/40 shadow-lg shadow-cosmos-500/10'
                    : i <= activeStep || (i === 1 && resumeData) || (i === 3 && matchData)
                      ? 'text-white/50 hover:text-white/70 cursor-pointer'
                      : 'text-white/20 cursor-default'
                }`}
              >
                <span className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center text-[10px] sm:text-xs font-bold shrink-0 ${
                  activeStep === i
                    ? 'bg-cosmos-500 text-white'
                    : i < activeStep || (i === 1 && resumeData) || (i === 3 && matchData)
                      ? 'bg-white/10 text-white/50'
                      : 'bg-white/5 text-white/20'
                }`}>
                  {i + 1}
                </span>
                <span>{label}</span>
              </button>
              {i < 3 && <div className={`hidden sm:block w-8 h-px ${i < activeStep ? 'bg-cosmos-500/40' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>

        {/* 主内容 */}
        <div className="animate-fade-in">
          {activeStep === 0 && (
            <UploadSection onSuccess={handleUploadSuccess} />
          )}
          {activeStep === 1 && resumeData && (
            <ResumeResult
              data={resumeData}
              onNext={() => setActiveStep(2)}
              onReset={handleReset}
            />
          )}
          {activeStep === 2 && resumeData && (
            <MatchSection
              resumeId={resumeData.resume_id}
              onSuccess={handleMatchSuccess}
              onBack={() => setActiveStep(1)}
            />
          )}
          {activeStep === 3 && matchData && (
            <MatchResult
              data={matchData}
              onBack={() => setActiveStep(2)}
              onReset={handleReset}
            />
          )}
        </div>
      </div>
    </div>
  )
}
