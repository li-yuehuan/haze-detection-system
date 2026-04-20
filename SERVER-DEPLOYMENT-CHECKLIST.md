# 服务器部署检查清单

## 第一步：克隆项目
```bash
git clone https://github.com/li-yuehuan/haze-detection-system.git
cd haze-detection-system
```

## 第二步：安装依赖
```bash
npm install --production
```

## 第三步：添加敏感文件（必须手动添加）

### 3.1 和风天气JWT密钥文件
从本地复制到服务器：
```bash
# 在服务器上创建这两个文件，内容从本地复制
# 1. ed25519-private.pem
# 2. ed25519-public.pem
```

### 3.2 环境变量文件
```bash
# 复制示例文件
cp .env.example .env

# 编辑.env文件，填入实际值
nano .env
```

`.env`文件需要包含：
```env
# 高德地图配置
AMAP_API_KEY=你的高德地图API密钥

# 和风天气配置
