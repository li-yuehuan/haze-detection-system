const axios = require('axios');
const jwtGenerator = require('./jwtGenerator');

class APIClient {
  constructor() {
    this.amapApiKey = process.env.AMAP_API_KEY || '13f11feaf099cf74705caa03d96b7cd7';
    this.qweatherHost = process.env.QWEATHER_API_HOST || 'm27fc36t6w.re.qweatherapi.com';
    
    // 创建axios实例
    this.amapClient = axios.create({
      baseURL: 'https://restapi.amap.com/v3',
      timeout: 10000
    });

    this.qweatherClient = axios.create({
      baseURL: `https://${this.qweatherHost}`,
      timeout: 10000
    });
  }

  /**
   * 通过IP获取位置信息（高德地图API）
   * @param {string} ip - 客户端IP地址
   * @returns {Promise<Object>} 位置信息
   */
  async getLocationByIP(ip) {
    try {
      const response = await this.amapClient.get('/ip', {
        params: {
          key: this.amapApiKey,
          ip: ip || '',
          output: 'JSON'
        }
      });

      if (response.data.status === '1') {
        return {
          success: true,
          data: {
            province: response.data.province,
            city: response.data.city,
            adcode: response.data.adcode,
            rectangle: response.data.rectangle
          }
        };
      } else {
        return {
          success: false,
          error: response.data.info || '获取位置失败'
        };
      }
    } catch (error) {
      console.error('高德地图API调用失败:', error.message);
      return {
        success: false,
        error: '网络请求失败'
      };
    }
  }

  /**
   * 获取和风天气API的认证头
   * @returns {Promise<Object>} 认证头信息
   */
  async getQWeatherAuthHeader() {
    try {
      const token = await jwtGenerator.getCachedToken();
      return {
        'Authorization': `Bearer ${token}`,
        'Accept-Encoding': 'gzip'
      };
    } catch (error) {
      console.error('获取和风天气认证头失败:', error.message);
      throw new Error('和风天气认证失败');
    }
  }

  /**
   * 获取实时天气数据
   * @param {string} location - 位置ID或坐标
   * @returns {Promise<Object>} 天气数据
   */
  async getCurrentWeather(location) {
    try {
      const headers = await this.getQWeatherAuthHeader();
      
      const response = await this.qweatherClient.get('/v7/weather/now', {
        params: { 
          location
          // 注意：根据文档，不需要key参数，只需要JWT认证头
        },
        headers
      });

      if (response.data.code === '200') {
        return {
          success: true,
          data: response.data
        };
      } else {
        console.error('和风天气API响应错误:', response.data);
        return {
          success: false,
          error: `天气API错误: ${response.data.code} - ${response.data.message || '未知错误'}`
        };
      }
    } catch (error) {
      console.error('和风天气API调用失败:', error.message);
      if (error.response) {
        console.error('API响应状态:', error.response.status);
        console.error('API响应数据:', error.response.data);
      }
      return {
        success: false,
        error: '天气数据获取失败'
      };
    }
  }

  /**
   * 获取空气质量数据
   * @param {number} lat - 纬度
   * @param {number} lon - 经度
   * @returns {Promise<Object>} 空气质量数据
   */
  async getAirQuality(lat, lon) {
    try {
      const headers = await this.getQWeatherAuthHeader();
      
      // 根据文档：GET /airquality/v1/current/{latitude}/{longitude}
      const url = `/airquality/v1/current/${lat}/${lon}`;
      console.log(`调用空气质量API: ${url}, 纬度: ${lat}, 经度: ${lon}`);
      
      const response = await this.qweatherClient.get(url, {
        headers
      });

      console.log('空气质量API响应状态:', response.status);
      console.log('空气质量API响应数据:', JSON.stringify(response.data, null, 2));

      if (response.data.metadata && response.data.indexes) {
        return {
          success: true,
          data: response.data
        };
      } else {
        console.error('空气质量API响应格式错误:', response.data);
        return {
          success: false,
          error: '空气质量数据格式错误'
        };
      }
    } catch (error) {
      console.error('空气质量API调用失败:', error.message);
      if (error.response) {
        console.error('API响应状态:', error.response.status);
        console.error('API响应数据:', error.response.data);
      }
      return {
        success: false,
        error: '空气质量数据获取失败'
      };
    }
  }

  /**
   * 获取24小时天气预报
   * @param {string} location - 位置ID或坐标
   * @returns {Promise<Object>} 天气预报数据
   */
  async get24HourForecast(location) {
    try {
      const headers = await this.getQWeatherAuthHeader();
      
      // 根据文档：GET /v7/weather/24h
      const params = { location };
      console.log(`调用24小时预报API, location: ${location}`);
      
      const response = await this.qweatherClient.get('/v7/weather/24h', {
        params,
        headers
      });

      console.log('24小时预报API响应状态:', response.status);
      console.log('24小时预报API响应数据:', JSON.stringify(response.data, null, 2));

      if (response.data.code === '200') {
        return {
          success: true,
          data: response.data
        };
      } else {
        console.error('天气预报API响应错误:', response.data);
        return {
          success: false,
          error: `预报API错误: ${response.data.code} - ${response.data.message || '未知错误'}`
        };
      }
    } catch (error) {
      console.error('天气预报API调用失败:', error.message);
      if (error.response) {
        console.error('API响应状态:', error.response.status);
        console.error('API响应数据:', error.response.data);
      }
      return {
        success: false,
        error: '天气预报数据获取失败'
      };
    }
  }
}

module.exports = new APIClient();
