const express = require('express');
const router = express.Router();
const dataStorage = require('../utils/dataStorage');

// 获取所有存储的数据
router.get('/all', (req, res) => {
  try {
    const data = dataStorage.readData();
    
    res.json({
      success: true,
      data: data,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取所有数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取数据失败',
      message: error.message
    });
  }
});

// 获取位置统计数据
router.get('/stats', (req, res) => {
  try {
    const stats = dataStorage.getStatistics();
    
    res.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
      message: error.message
    });
  }
});

// 导出数据（JSON格式）
router.get('/export', (req, res) => {
  try {
    const data = dataStorage.readData();
    const format = req.query.format || 'json';
    
    if (format === 'json') {
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', 'attachment; filename="locations-data.json"');
      res.send(JSON.stringify(data, null, 2));
    } else if (format === 'csv') {
      // 简单CSV导出
      const locations = data.locations || [];
      let csv = '城市,省份,访问次数,首次访问,最后访问\n';
      
      locations.forEach(loc => {
        csv += `"${loc.city}","${loc.province}",${loc.accessCount || 1},"${loc.firstAccessed || ''}","${loc.lastAccessed || ''}"\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="locations-data.csv"');
      res.send(csv);
    } else {
      res.status(400).json({
        success: false,
        error: '不支持的导出格式，支持: json, csv'
      });
    }

  } catch (error) {
    console.error('导出数据失败:', error);
    res.status(500).json({
      success: false,
      error: '导出数据失败',
      message: error.message
    });
  }
});

// 清除所有数据（需要管理员权限）
router.delete('/clear', (req, res) => {
  try {
    // 在实际应用中，这里应该添加身份验证
    const { confirm } = req.body;
    
    if (confirm !== 'YES_DELETE_ALL_DATA') {
      return res.status(400).json({
        success: false,
        error: '需要确认操作，请在请求体中包含 confirm: "YES_DELETE_ALL_DATA"'
      });
    }
    
    const success = dataStorage.clearAllData();
    
    if (success) {
      res.json({
        success: true,
        message: '所有数据已清除',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: '清除数据失败'
      });
    }

  } catch (error) {
    console.error('清除数据失败:', error);
    res.status(500).json({
      success: false,
      error: '清除数据失败',
      message: error.message
    });
  }
});

// 备份数据
router.post('/backup', (req, res) => {
  try {
    const data = dataStorage.readData();
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `./backend/data/backup-${timestamp}.json`;
    
    require('fs').writeFileSync(
      backupPath,
      JSON.stringify(data, null, 2),
      'utf8'
    );
    
    res.json({
      success: true,
      message: '数据备份成功',
      backupPath: backupPath,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('备份数据失败:', error);
    res.status(500).json({
      success: false,
      error: '备份数据失败',
      message: error.message
    });
  }
});

// 获取系统信息
router.get('/system-info', (req, res) => {
  try {
    const os = require('os');
    
    const systemInfo = {
      platform: os.platform(),
      arch: os.arch(),
      hostname: os.hostname(),
      nodeVersion: process.version,
      memory: {
        total: os.totalmem(),
        free: os.freemem(),
        used: os.totalmem() - os.freemem()
      },
      uptime: os.uptime(),
      cpus: os.cpus().length,
      loadavg: os.loadavg(),
      timestamp: new Date().toISOString()
    };
    
    res.json({
      success: true,
      data: systemInfo
    });

  } catch (error) {
    console.error('获取系统信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取系统信息失败',
      message: error.message
    });
  }
});

module.exports = router;
