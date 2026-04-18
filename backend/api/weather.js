const express = require('express');
const router = express.Router();
const apiClient = require('../utils/apiClient');

// 从矩形字符串中提取经纬度
function extractCoordinates(rectangle) {
  if (!rectangle) return { lat: 39.9042, lon: 116.4074 }; // 默认北京
  
  try {
    // 矩形格式: "116.123,39.456;116.789,39.012"
    const [point1, point2] = rectangle.split(';');
    const [lon1, lat1] = point1.split(',').map(Number);
    const [lon2, lat2] = point2.split(',').map(Number);
    
    // 计算中心点
    const lat = (lat1 + lat2) / 2;
    const lon = (lon1 + lon2) / 2;
    
    return { lat, lon };
  } catch (error) {
    console.error('解析坐标失败:', error);
    return { lat: 39.9042, lon: 116.4074 }; // 默认北京
  }
}

// 获取位置坐标（从rectangle提取经纬度）
function getLocationCoordinates(rectangle) {
  if (!rectangle) return '116.4074,39.9042'; // 默认北京坐标
  
  try {
    // 矩形格式: "116.123,39.456;116.789,39.012"
    const [point1, point2] = rectangle.split(';');
    const [lon1, lat1] = point1.split(',').map(Number);
    const [lon2, lat2] = point2.split(',').map(Number);
    
    // 计算中心点
    const lat = (lat1 + lat2) / 2;
    const lon = (lon1 + lon2) / 2;
    
    // 返回经纬度字符串，格式：经度,纬度
    return `${lon.toFixed(4)},${lat.toFixed(4)}`;
  } catch (error) {
    console.error('解析坐标失败:', error);
    return '116.4074,39.9042'; // 默认北京坐标
  }
}

// 获取综合天气信息（实时天气 + 空气质量）
router.get('/comprehensive', async (req, res) => {
  try {
    const { city, province, adcode, rectangle } = req.query;
    
    if (!adcode && !rectangle) {
      return res.status(400).json({
        success: false,
        error: '请提供位置信息（adcode或rectangle）'
      });
    }

    const locationCoordinates = rectangle ? getLocationCoordinates(rectangle) : '116.4074,39.9042';
    const coordinates = rectangle ? extractCoordinates(rectangle) : { lat: 39.9042, lon: 116.4074 };

    console.log(`获取综合天气信息，位置: ${city || '未知'}, 坐标: ${JSON.stringify(coordinates)}`);

    // 并行获取所有数据
    const [weatherResult, airQualityResult, forecastResult] = await Promise.allSettled([
      apiClient.getCurrentWeather(locationCoordinates),
      apiClient.getAirQuality(coordinates.lat, coordinates.lon),
      apiClient.get24HourForecast(locationCoordinates)
    ]);

    // 处理实时天气结果
    let weatherData = null;
    if (weatherResult.status === 'fulfilled' && weatherResult.value.success) {
      weatherData = weatherResult.value.data;
    }

    // 处理空气质量结果
    let airQualityData = null;
    if (airQualityResult.status === 'fulfilled' && airQualityResult.value.success) {
      airQualityData = airQualityResult.value.data;
    }

    // 处理天气预报结果
    let forecastData = null;
    if (forecastResult.status === 'fulfilled' && forecastResult.value.success) {
      forecastData = forecastResult.value.data;
    }

    // 构建响应数据
    const responseData = {
      location: {
        city: city || '未知',
        province: province || '未知',
        adcode: adcode || '',
        coordinates
      },
      weather: weatherData,
      airQuality: airQualityData,
      forecast: forecastData,
      timestamp: new Date().toISOString()
    };

    // 检查是否有数据获取失败
    const errors = [];
    if (!weatherData) errors.push('实时天气数据获取失败');
    if (!airQualityData) errors.push('空气质量数据获取失败');
    if (!forecastData) errors.push('天气预报数据获取失败');

    if (errors.length > 0) {
      responseData.warnings = errors;
    }

    res.json({
      success: true,
      data: responseData,
      warnings: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('获取综合天气信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取天气信息失败',
      message: error.message
    });
  }
});

// 获取实时天气
router.get('/current', async (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: '请提供位置参数（location）'
      });
    }

    const result = await apiClient.getCurrentWeather(location);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('获取实时天气失败:', error);
    res.status(500).json({
      success: false,
      error: '获取实时天气失败',
      message: error.message
    });
  }
});

// 获取空气质量
router.get('/air-quality', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({
        success: false,
        error: '请提供纬度和经度参数（lat, lon）'
      });
    }

    const result = await apiClient.getAirQuality(parseFloat(lat), parseFloat(lon));
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('获取空气质量失败:', error);
    res.status(500).json({
      success: false,
      error: '获取空气质量失败',
      message: error.message
    });
  }
});

// 获取24小时天气预报
router.get('/forecast/24h', async (req, res) => {
  try {
    const { location } = req.query;
    
    if (!location) {
      return res.status(400).json({
        success: false,
        error: '请提供位置参数（location）'
      });
    }

    const result = await apiClient.get24HourForecast(location);
    
    if (result.success) {
      res.json({
        success: true,
        data: result.data,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error
      });
    }

  } catch (error) {
    console.error('获取天气预报失败:', error);
    res.status(500).json({
      success: false,
      error: '获取天气预报失败',
      message: error.message
    });
  }
});

// 获取天气图标URL
router.get('/icon/:iconCode', (req, res) => {
  try {
    const { iconCode } = req.params;
    
    // 和风天气图标URL格式
    const iconUrl = `https://qweather.com/icon/${iconCode}.png`;
    
    res.json({
      success: true,
      data: {
        iconCode,
        iconUrl,
        description: getWeatherDescription(iconCode)
      }
    });

  } catch (error) {
    console.error('获取天气图标失败:', error);
    res.status(500).json({
      success: false,
      error: '获取天气图标失败',
      message: error.message
    });
  }
});

// 天气图标描述映射
function getWeatherDescription(iconCode) {
  const descriptions = {
    '100': '晴',
    '101': '多云',
    '102': '少云',
    '103': '晴间多云',
    '104': '阴',
    '150': '晴',
    '151': '多云',
    '152': '少云',
    '153': '晴间多云',
    '300': '阵雨',
    '301': '强阵雨',
    '302': '雷阵雨',
    '303': '强雷阵雨',
    '304': '雷阵雨伴有冰雹',
    '305': '小雨',
    '306': '中雨',
    '307': '大雨',
    '308': '极端降雨',
    '309': '毛毛雨/细雨',
    '310': '暴雨',
    '311': '大暴雨',
    '312': '特大暴雨',
    '313': '冻雨',
    '314': '小到中雨',
    '315': '中到大雨',
    '316': '大到暴雨',
    '317': '暴雨到大暴雨',
    '318': '大暴雨到特大暴雨',
    '399': '雨',
    '400': '小雪',
    '401': '中雪',
    '402': '大雪',
    '403': '暴雪',
    '404': '雨夹雪',
    '405': '雨雪天气',
    '406': '阵雨夹雪',
    '407': '阵雪',
    '408': '小到中雪',
    '409': '中到大雪',
    '410': '大到暴雪',
    '499': '雪',
    '500': '薄雾',
    '501': '雾',
    '502': '霾',
    '503': '扬沙',
    '504': '浮尘',
    '507': '沙尘暴',
    '508': '强沙尘暴',
    '509': '浓雾',
    '510': '强浓雾',
    '511': '中度霾',
    '512': '重度霾',
    '513': '严重霾',
    '514': '大雾',
    '515': '特强浓雾',
    '900': '热',
    '901': '冷',
    '999': '未知'
  };
  
  return descriptions[iconCode] || '未知天气';
}

module.exports = router;
