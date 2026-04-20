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

// 获取当前位置信息（支持浏览器定位和IP定位）
router.get('/current', async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    const clientIP = getClientIP(req);
    
    let locationResult;
    let locationSource = 'ip';
    
    // 优先使用浏览器提供的经纬度进行定位
    if (longitude && latitude) {
      console.log(`使用浏览器定位，经纬度: ${longitude}, ${latitude}`);
      locationSource = 'browser';
      
      locationResult = await apiClient.getLocationByCoordinates(
        parseFloat(longitude),
        parseFloat(latitude)
      );
      
      // 如果逆地理编码失败，回退到IP定位
      if (!locationResult.success) {
        console.warn('逆地理编码失败，回退到IP定位:', locationResult.error);
        locationSource = 'ip_fallback';
        locationResult = await apiClient.getLocationByIP(clientIP);
      }
    } else {
      // 使用IP定位
      console.log(`使用IP定位，客户端IP: ${clientIP}`);
      locationResult = await apiClient.getLocationByIP(clientIP);
    }
    
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
      source: locationSource,
      coordinates: locationData.coordinates || null,
      timestamp: new Date().toISOString()
    });

    // 返回位置信息
    res.json({
      success: true,
      data: {
        ...locationData,
        source: locationSource
      },
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

// 逆地理编码接口（将经纬度转换为地址）
router.get('/reverse-geocode', async (req, res) => {
  try {
    const { longitude, latitude } = req.query;
    
    if (!longitude || !latitude) {
      return res.status(400).json({
        success: false,
        error: '请提供经度和纬度参数'
      });
    }

    console.log(`逆地理编码，经纬度: ${longitude}, ${latitude}`);
    
    const locationResult = await apiClient.getLocationByCoordinates(
      parseFloat(longitude),
      parseFloat(latitude)
    );
    
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
      ip: getClientIP(req),
      source: 'reverse_geocode',
      timestamp: new Date().toISOString()
    });

    res.json({
      success: true,
      data: locationData,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('逆地理编码失败:', error);
    res.status(500).json({
      success: false,
      error: '逆地理编码失败',
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
