const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// 导入路由
const locationRoutes = require('./api/location');
const weatherRoutes = require('./api/weather');
const dataRoutes = require('./api/data');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件服务 - 前端文件
app.use(express.static(path.join(__dirname, '../frontend')));

// API路由
app.use('/api/location', locationRoutes);
app.use('/api/weather', weatherRoutes);
app.use('/api/data', dataRoutes);

// 默认路由 - 返回前端页面
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 健康检查端点
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 错误处理中间件
app.use((err, req, res, next) => {
  console.error('服务器错误:', err.stack);
  res.status(500).json({
    error: '服务器内部错误',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// 404处理
app.use((req, res) => {
  res.status(404).json({ error: '未找到请求的资源' });
});

// 启动服务器
const HOST = process.env.HOST || '0.0.0.0';
app.listen(PORT, HOST, () => {
  console.log(`雾霾检测系统服务器运行在 http://${HOST}:${PORT}`);
  console.log(`外部访问地址: http://你的服务器IP:${PORT}`);
  console.log(`环境: ${process.env.NODE_ENV || 'development'}`);
  console.log(`前端路径: ${path.join(__dirname, '../frontend')}`);
});
