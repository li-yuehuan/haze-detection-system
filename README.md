# 雾霾检测系统

基于高德地图和风天气API的雾霾监测与检测系统，提供实时天气、空气质量指数和24小时温湿度预报。

## 功能特性

### 核心功能
- **智能定位**：通过IP地址自动获取用户位置（无需HTTPS）
- **实时天气**：显示当前温度、湿度、风力、气压等天气信息
- **空气质量监测**：实时AQI指数、污染物浓度、健康建议
- **24小时预报**：温湿度折线图，支持三种显示模式
- **数据存储**：自动保存用户位置历史到JSON文件

### 用户体验
- **响应式设计**：完美适配手机、平板和电脑
- **主题切换**：支持浅色/深色/自动主题
- **实时更新**：可配置的自动刷新频率
- **离线支持**：网络异常时显示模拟数据
- **通知系统**：空气质量警报和操作反馈

## 技术架构

### 前端技术栈
- HTML5 + CSS3 + JavaScript (ES6+)
- Chart.js 数据可视化
- Font Awesome 图标库
- 响应式CSS Grid/Flexbox布局

### 后端技术栈
- Node.js + Express.js
- 高德地图IP定位API
- 和风天气JWT认证API
- JSON文件数据存储

### API集成
1. **高德地图API**：IP定位服务
2. **和风天气API**：
   - 实时天气数据
   - 空气质量指数
   - 24小时天气预报

## 项目结构

```
haze-detection-system/
├── frontend/                 # 前端代码
│   ├── index.html           # 主页面
│   ├── css/
│   │   └── style.css       # 样式文件
│   └── js/
│       ├── config.js       # 应用配置
│       ├── api.js          # API客户端
│       ├── ui.js           # UI管理器
│       ├── charts.js       # 图表管理器
│       └── main.js         # 主应用程序
├── backend/                 # 后端代码
│   ├── server.js           # 主服务器
│   ├── api/                # API路由
│   │   ├── location.js     # 定位接口
│   │   ├── weather.js      # 天气接口
│   │   └── data.js         # 数据接口
│   ├── utils/              # 工具函数
│   │   ├── jwtGenerator.js # JWT生成器
│   │   ├── apiClient.js    # API客户端
│   │   └── dataStorage.js  # 数据存储
│   └── data/               # 数据存储目录
├── package.json            # 项目配置
├── .env.example            # 环境变量示例
├── README.md               # 项目说明
└── .gitignore             # Git忽略文件
```

## 快速开始

### 1. 环境准备
```bash
# 确保已安装 Node.js (版本 >= 14.0.0)
node --version

# 克隆GitHub仓库
git clone https://github.com/li-yuehuan/haze-detection-system.git
cd haze-detection-system
```

### 2. 安装依赖
```bash
npm install
```

### 3. 配置环境变量
复制 `.env.example` 为 `.env` 并填写实际值：
```bash
cp .env.example .env
```

编辑 `.env` 文件：
```env
# 高德地图配置
AMAP_API_KEY=你的高德地图API密钥

# 和风天气配置
QWEATHER_API_HOST=你的和风天气API域名
QWEATHER_KEY_ID=你的JWT凭据ID
QWEATHER_PROJECT_ID=你的项目ID

# 服务器配置
PORT=3000
NODE_ENV=development

# 数据存储配置
DATA_FILE_PATH=./backend/data/locations.json
```

### 4. 准备和风天气JWT密钥
确保项目根目录有以下文件：
- `ed25519-private.pem` - 和风天气私钥
- `ed25519-public.pem` - 和风天气公钥

### 5. 启动服务器
```bash
# 开发模式（带热重载）
npm run dev

# 生产模式
npm start
```

### 6. 访问应用
打开浏览器访问：http://localhost:3000

## API接口说明

### 定位接口
- `GET /api/location/current` - 获取当前位置
- `POST /api/location/set` - 手动设置位置
- `GET /api/location/history` - 获取位置历史

### 天气接口
- `GET /api/weather/comprehensive` - 获取综合天气信息
- `GET /api/weather/current` - 获取实时天气
- `GET /api/weather/air-quality` - 获取空气质量
- `GET /api/weather/forecast/24h` - 获取24小时预报

### 数据接口
- `GET /api/data/stats` - 获取统计数据
- `GET /api/data/export` - 导出数据
- `GET /health` - 健康检查

## 本地部署
1. 按照"快速开始"步骤配置和运行
2. 确保防火墙开放3000端口

## GitHub仓库

项目已上传到GitHub：https://github.com/li-yuehuan/haze-detection-system

**注意**：本项目为学术用途，实际部署时请注意API使用限制和数据安全。
