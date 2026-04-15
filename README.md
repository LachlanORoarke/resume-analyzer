# AI赋能的智能简历分析系统

**在线预览：[http://193.134.209.142](http://193.134.209.142)**

一个简历分析工具，上传PDF简历后，AI会自动提取里面的关键信息（姓名、电话、技能之类的），然后可以输入岗位要求，系统会给出匹配度评分。

## 这个项目能干嘛

- 上传PDF简历，自动提取文字内容（支持多页的）
- 用AI把简历里的姓名、电话、邮箱、技能、工作经历这些信息提取出来
- 输入一段岗位描述，AI会分析简历和岗位的匹配程度，给出评分
- 结果都是JSON格式返回的，前端页面也做了可视化展示
- 支持Redis缓存，同一份简历不会重复解析（这个是可选的，不装Redis也能跑）

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

## 项目架构

整体是前后端分离的架构。前端是纯静态页面，构建完就是一堆HTML/CSS/JS文件，可以直接托管到任何静态服务器上。后端是一个HTTP服务，前端通过API请求和它通信。

请求链路大概是这样的：用户在浏览器里上传PDF → 前端把文件POST到后端的上传接口 → 后端用pdfplumber解析PDF文本 → 把原始文本发给DeepSeek做结构化提取 → AI返回JSON格式的简历信息 → 后端存到内存（或Redis缓存）然后返回给前端 → 前端展示解析结果。岗位匹配是另一条链路：用户输入岗位描述 → 前端POST匹配接口带上简历ID和岗位描述 → 后端把简历内容和岗位描述一起送给AI 做四个维度的评分（技能、经验、学历、综合） → 返回JSON → 前端展示雷达图和详细报告。

缓存这一层是可选的。如果开了Redis，相同的简历（按文件SHA256判断）不会重复调AI，直接返回缓存结果。不开Redis也完全能用，就每次都重新解析。

## 技术选型

后端用Python 3.12 + FastAPI。FastAPI自带Swagger文档、请求参数校验，异步支持也好，适合这种IO密集的场景（主要等AI接口响应）。PDF解析用pdfplumber，相比PyPDF2在处理表格和复杂排版方面更准确。AI调用部分封装了OpenAI SDK，指向DeepSeek的接口地址，这样以后想换模型（GPT-4、Claude之类的）只需要改配置，代码逻辑不用动。数据结构用Pydantic定义，类型安全，反序列化也方便。

前端用React 18 + Vite + Tailwind CSS。Vite的构建速度快，HMR响应也快，开发体验比webpack好不少。Tailwind用了JIT模式，只打包实际用到的样式，最终CSS很小。组件用lucide-react做图标，不引入整个图标库，按需导入。整体视觉是深色宇宙主题，用了glassmorphism风格的卡片，渐变文字和动画用CSS keyframes实现。

部署层面后端用Docker容器化，方便迁移，前端用Nginx直接serve静态文件，Nginx同时做反向代理把/api/请求转发到后端容器。

## 部署方式

服务器部署（后端+前端）需要一台Linux服务器，装好Docker和Nginx。

先构建前端静态文件：

```bash
cd frontend
npm install
npm run build
# 产物在 frontend/dist/ 目录下
```

然后把整个项目传到服务器，在服务器上执行：

```bash
chmod +x /opt/resume-analyzer/deploy/deploy.sh
bash /opt/resume-analyzer/deploy/deploy.sh
```

deploy.sh会自动完成：构建后端Docker镜像、启动容器（映射9000端口）、把Nginx配置软链到sites-enabled、reload Nginx。完成后访问服务器IP就能用了，/api/ 路径自动代理到后端容器。

后端需要先在服务器上创建 backend/.env 文件写好API Key，不然AI功能不可用。

GitHub Pages只能托管前端静态文件，后端需要另起一台服务器。仓库里有 .github/workflows/deploy-pages.yml，push到main分支时会自动构建并把dist部署到gh-pages分支。前端默认连接的API地址可以在 frontend/src/api.js 里改成你的后端地址。

阿里云Serverless部署参考根目录的 s.yaml，按Serverless Devs的文档操作即可。

## License

MIT
