// API客户端
class APIClient {
    constructor() {
        this.baseURL = AppConfig.API_BASE_URL;
        this.cache = new Map();
        this.requestQueue = new Map();
    }

    // 通用请求方法
    async request(endpoint, options = {}) {
        const cacheKey = `${endpoint}:${JSON.stringify(options)}`;
        const now = Date.now();
        
        // 检查缓存
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (now - cached.timestamp < AppConfig.SETTINGS.DATA_CACHE_DURATION) {
                return cached.data;
            }
        }
        
        // 防止重复请求
        if (this.requestQueue.has(cacheKey)) {
            return this.requestQueue.get(cacheKey);
        }
        
        const requestPromise = this._makeRequest(endpoint, options);
        this.requestQueue.set(cacheKey, requestPromise);
        
        try {
            const data = await requestPromise;
            this.cache.set(cacheKey, { data, timestamp: now });
            return data;
        } finally {
            this.requestQueue.delete(cacheKey);
        }
    }

    // 实际发起请求
    async _makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            method: options.method || 'GET',
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        if (options.body) {
            config.body = JSON.stringify(options.body);
        }

        let retryCount = 0;
        
        while (retryCount < AppConfig.SETTINGS.MAX_RETRY_ATTEMPTS) {
            try {
                const response = await fetch(url, config);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                const data = await response.json();
                
                if (!data.success) {
                    throw new Error(data.error || 'API请求失败');
                }
                
                return data;
            } catch (error) {
                retryCount++;
                
                if (retryCount === AppConfig.SETTINGS.MAX_RETRY_ATTEMPTS) {
                    console.error(`API请求失败 (${endpoint}):`, error);
                    throw error;
                }
                
                // 等待重试
                await new Promise(resolve => 
                    setTimeout(resolve, AppConfig.SETTINGS.RETRY_DELAY * retryCount)
                );
            }
        }
    }

    // 获取当前位置（优先使用浏览器定位，失败时回退到IP定位）
    async getCurrentLocation() {
        // 优先尝试浏览器定位
        if ('geolocation' in navigator) {
            try {
                const position = await this.getBrowserPosition(10000);
                const { latitude, longitude, accuracy } = position.coords;
                
                console.log(`浏览器定位成功: 纬度=${latitude}, 经度=${longitude}, 精度=${accuracy}米`);
                
                // 使用经纬度调用后端API
                const endpoint = `${AppConfig.API_ENDPOINTS.LOCATION_CURRENT}?longitude=${longitude}&latitude=${latitude}`;
                const result = await this.request(endpoint);
                
                // 添加浏览器定位信息
                if (result.success && result.data) {
                    result.data.browserLocation = {
                        coordinates: { latitude, longitude },
                        accuracy,
                        timestamp: position.timestamp
                    };
                }
                
                return result;
            } catch (browserError) {
                console.warn('浏览器定位失败，回退到IP定位:', browserError.message);
                // 浏览器定位失败，回退到IP定位
                return this.request(AppConfig.API_ENDPOINTS.LOCATION_CURRENT);
            }
        } else {
            // 浏览器不支持地理位置API，直接使用IP定位
            console.log('浏览器不支持地理位置API，使用IP定位');
            return this.request(AppConfig.API_ENDPOINTS.LOCATION_CURRENT);
        }
    }

    // 获取浏览器地理位置
    getBrowserPosition(timeout = 10000) {
        return new Promise((resolve, reject) => {
            if (!('geolocation' in navigator)) {
                reject(new Error('浏览器不支持地理位置API'));
                return;
            }

            const options = {
                enableHighAccuracy: true,
                timeout: timeout,
                maximumAge: 60000 // 1分钟缓存
            };

            navigator.geolocation.getCurrentPosition(
                resolve,
                (error) => {
                    let errorMessage;
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = '用户拒绝了地理位置权限请求';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = '位置信息不可用';
                            break;
                        case error.TIMEOUT:
                            errorMessage = '获取位置信息超时';
                            break;
                        default:
                            errorMessage = '未知错误';
                    }
                    reject(new Error(errorMessage));
                },
                options
            );
        });
    }

    // 逆地理编码（将经纬度转换为地址）
    async reverseGeocode(longitude, latitude) {
        const endpoint = `${AppConfig.API_ENDPOINTS.LOCATION_CURRENT}?longitude=${longitude}&latitude=${latitude}`;
        return this.request(endpoint);
    }

    // 获取综合天气信息
    async getComprehensiveWeather(locationData) {
        const params = new URLSearchParams();
        
        if (locationData.city) params.append('city', locationData.city);
        if (locationData.province) params.append('province', locationData.province);
        if (locationData.adcode) params.append('adcode', locationData.adcode);
        if (locationData.rectangle) params.append('rectangle', locationData.rectangle);
        
        const endpoint = `${AppConfig.API_ENDPOINTS.WEATHER_COMPREHENSIVE}?${params.toString()}`;
        console.log('调用综合天气API，端点:', endpoint);
        const result = await this.request(endpoint);
        console.log('综合天气API响应结果:', result);
        console.log('响应结果类型:', typeof result);
        console.log('响应结果包含data属性?:', 'data' in result);
        console.log('响应结果包含forecast属性?:', 'forecast' in result);
        return result;
    }

    // 获取实时天气
    async getCurrentWeather(location) {
        const endpoint = `${AppConfig.API_ENDPOINTS.WEATHER_CURRENT}?location=${encodeURIComponent(location)}`;
        return this.request(endpoint);
    }

    // 获取空气质量
    async getAirQuality(lat, lon) {
        const endpoint = `${AppConfig.API_ENDPOINTS.AIR_QUALITY}?lat=${lat}&lon=${lon}`;
        return this.request(endpoint);
    }

    // 获取24小时预报
    async get24HourForecast(location) {
        const endpoint = `${AppConfig.API_ENDPOINTS.FORECAST_24H}?location=${encodeURIComponent(location)}`;
        return this.request(endpoint);
    }

    // 获取数据统计
    async getDataStats() {
        return this.request(AppConfig.API_ENDPOINTS.DATA_STATS);
    }

    // 健康检查
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseURL}${AppConfig.API_ENDPOINTS.HEALTH_CHECK}`);
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // 清除缓存
    clearCache() {
        this.cache.clear();
    }

    // 清除特定缓存
    clearCacheForEndpoint(endpointPattern) {
        for (const [key] of this.cache) {
            if (key.includes(endpointPattern)) {
                this.cache.delete(key);
            }
        }
    }
}

// 创建全局API客户端实例
const apiClient = new APIClient();
window.apiClient = apiClient;
