import { useState, useRef, useCallback } from 'react'
import { Upload, FileText, AlertCircle } from 'lucide-react'
import { uploadResume } from '../api'

export default function UploadSection({ onSuccess }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState(null)
  const [fileName, setFileName] = useState(null)
  const fileRef = useRef()

  const handleFile = useCallback(async (file) => {
    if (!file) return
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('仅支持 PDF 格式文件')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('文件大小不能超过 10MB')
      return
    }

    setError(null)
    setFileName(file.name)
    setUploading(true)

    try {
      const data = await uploadResume(file)
      onSuccess(data)
    } catch (e) {
      setError(e.message)
    } finally {
      setUploading(false)
    }
  }, [onSuccess])

  const onDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer?.files?.[0]
    handleFile(file)
  }, [handleFile])

  return (
    <div className="max-w-2xl mx-auto">
      <div
        className={`drop-zone ${dragging ? 'dragging' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => !uploading && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-4">
            <div className="spinner !w-10 !h-10 !border-3" />
            <div>
              <p className="text-white/70 font-medium">正在解析 {fileName}...</p>
              <p className="text-white/30 text-sm mt-1">AI 正在提取简历关键信息，请稍候</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-cosmos-600/10 border border-cosmos-500/20 flex items-center justify-center">
              {fileName ? <FileText size={28} className="text-cosmos-400" /> : <Upload size={28} className="text-cosmos-400" />}
            </div>
            <div>
              <p className="text-white/70 font-medium">
                {fileName ? fileName : '点击或拖拽上传 PDF 简历'}
              </p>
              <p className="text-white/30 text-sm mt-1">支持单个 PDF 文件，最大 10MB</p>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
          <AlertCircle size={16} />
          <span>{error}</span>
        </div>
      )}
    </div>
  )
}
