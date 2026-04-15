# AI赋能的智能简历分析系统

一个简历分析工具，上传PDF简历后，AI会自动提取里面的关键信息（姓名、电话、技能之类的），然后可以输入岗位要求，系统会给出匹配度评分。

## 这个项目能干嘛

- 上传PDF简历，自动提取文字内容（支持多页的）
- 用AI把简历里的姓名、电话、邮箱、技能、工作经历这些信息提取出来
- 输入一段岗位描述，AI会分析简历和岗位的匹配程度，给出评分
- 结果都是JSON格式返回的，前端页面也做了可视化展示
- 支持Redis缓存，同一份简历不会重复解析（这个是可选的，不装Redis也能跑）

## 用了什么技术

后端是Python写的，用的FastAPI框架。PDF解析用的pdfplumber，AI部分调的是DeepSeek的API（兼容OpenAI格式，换别的模型也行，改下配置就好）。前端用React + Vite + Tailwind CSS搭的，深色主题。

## 怎么在本地跑起来

### 环境要求

- Python 3.12以上
- Node.js 18以上
- Redis可装可不装

### 启动后端

```bash
cd backend

# 弄个虚拟环境
python -m venv .venv

# 激活虚拟环境
# Windows:
.venv\Scripts\activate
# Mac/Linux:
source .venv/bin/activate

# 装依赖
pip install -r requirements.txt

# 配置环境变量（复制一份模板然后改里面的API Key）
cp .env.example .env

# 跑起来
uvicorn app.main:app --reload --port 9000
```

跑起来之后打开 http://localhost:9000/docs 能看到接口文档。

### 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端默认跑在 http://localhost:5173 ，开发模式下 /api 的请求会自动转发到后端9000端口。

### 配置说明

后端的配置在 `backend/.env` 文件里（从 `.env.example` 复制过来改的），主要就这几个：

- `AI_API_KEY` - AI模型的API Key，必须填
- `AI_BASE_URL` - AI接口地址，默认是DeepSeek的，换别的模型改这个就行
- `AI_MODEL` - 模型名称，默认 deepseek-chat
- `CACHE_ENABLED` - 要不要开Redis缓存，默认关着
- `REDIS_URL` - Redis地址，开了缓存才需要

## 接口说明

后端一共三个接口：

**POST /api/resume/upload** - 上传简历。发个 multipart/form-data 请求，字段名叫 file，传PDF文件。返回解析结果，包括提取出来的各种信息。

**POST /api/resume/match** - 岗位匹配。传 resume_id 和 job_description（岗位描述），返回匹配度评分，分技能匹配、经验匹配、学历匹配几个维度。

**GET /api/resume/list** - 看当前已经解析过的简历列表。

## 项目结构

后端代码在 backend/ 下面，main.py 是入口，api/ 放路由，services/ 放业务逻辑（pdf解析、ai提取、匹配评分、缓存），models/ 放数据结构定义，core/ 放配置。

前端在 frontend/ 下面，App.jsx 是主组件，components/ 里面按功能分了几个组件：上传、解析结果展示、岗位匹配输入、匹配报告。

## License

MIT
