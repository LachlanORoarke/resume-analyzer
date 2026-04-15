/**
 * api层 跟后端交互的都在这
 */

const API_BASE = import.meta.env.VITE_API_BASE || '';

async function request(path, options = {}) {
  const url = `${API_BASE}${path}`;
  const res = await fetch(url, options);

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `请求失败 (${res.status})`);
  }

  return res.json();
}

/** 上传简历pdf */
export async function uploadResume(file) {
  const form = new FormData();
  form.append('file', file);
  return request('/api/resume/upload', { method: 'POST', body: form });
}

/** 简历和岗位匹配 */
export async function matchResume(resumeId, jobDescription) {
  return request('/api/resume/match', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ resume_id: resumeId, job_description: jobDescription }),
  });
}

/** 拿已解析的简历列表 */
export async function listResumes() {
  return request('/api/resume/list');
}
