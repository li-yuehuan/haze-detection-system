const express = require('express');
const router = express.Router();
const apiClient = require('../utils/apiClient');
const dataStorage = require('../utils/dataStorage');

// 获取客户端真实IP地址
function getClientIP(req) {
  return req.headers['x-forwarded-for'] || 
         req.headers['x-real-ip'] || 
         req.connection.remoteAddress || 
         req.socket.remoteAddress || 
         req.ip ||
         '127.0.0.1';
}

// 获取当前位置信息
router.get('/current', async (req, res) => {
  try {
    const clientIP = getClientIP(req);
    console.log(`获取位置信息，客户端IP: ${clientIP}`);
    
    // 调用高德地图API获取位置
    const locationResult = await apiClient.getLocationByIP(clientIP);
    
    if (!locationResult.success) {
      return res.status(500).json({
        success: false,
        error: locationResult.error
      });
    }

    const locationData = locationResult.data;
    
    // 保存位置信息到本地存储
    dataStorage.addLocation({
      ...locationData,
      ip: clientIP,
      timestamp: new Date().toISOString()
    });

    // 返回位置信息
    res.json({
      success: true,
      data: locationData,
      ip: clientIP,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('获取位置信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取位置信息失败',
      message: error.message
    });
  }
});

// 手动指定位置（用于测试或用户选择）
router.post('/set', async (req, res) => {
  try {
    const { city, province, adcode } = req.body;
    
    if (!city || !province) {
      return res.status(400).json({
        success: false,
        error: '请提供城市和省份信息'
      });
    }

    const locationData = {
      city,
      province,
      adcode: adcode || '',
      rectangle: ''
    };

    // 保存位置信息到本地存储
    dataStorage.addLocation({
      ...locationData,
      ip: getClientIP(req),
      timestamp: new Date().toISOString(),
      manuallySet: true
    });

    res.json({
      success: true,
      data: locationData,
      message: '位置设置成功'
    });

  } catch (error) {
    console.error('设置位置失败:', error);
    res.status(500).json({
      success: false,
      error: '设置位置失败',
      message: error.message
    });
  }
});

// 获取历史位置记录
router.get('/history', (req, res) => {
  try {
    const locations = dataStorage.getAllLocations();
    
    res.json({
      success: true,
      data: locations,
      count: locations.length
    });

  } catch (error) {
    console.error('获取历史位置失败:', error);
    res.status(500).json({
      success: false,
      error: '获取历史位置失败',
      message: error.message
    });
  }
});

// 获取热门城市
router.get('/popular', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const popularCities = dataStorage.getPopularCities(limit);
    
    res.json({
      success: true,
      data: popularCities,
      count: popularCities.length
    });

  } catch (error) {
    console.error('获取热门城市失败:', error);
    res.status(500).json({
      success: false,
      error: '获取热门城市失败',
      message: error.message
    });
  }
});

// 获取存储统计信息
router.get('/stats', (req, res) => {
  try {
    const stats = dataStorage.getStatistics();
    
    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('获取统计信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计信息失败',
      message: error.message
    });
  }
});

module.exports = router;
