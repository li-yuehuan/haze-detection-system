// 应用配置
const AppConfig = {
    // API配置
    API_BASE_URL: window.location.origin,
    API_ENDPOINTS: {
        LOCATION_CURRENT: '/api/location/current',
        LOCATION_SET: '/api/location/set',
        LOCATION_HISTORY: '/api/location/history',
        WEATHER_COMPREHENSIVE: '/api/weather/comprehensive',
        WEATHER_CURRENT: '/api/weather/current',
        AIR_QUALITY: '/api/weather/air-quality',
        FORECAST_24H: '/api/weather/forecast/24h',
        DATA_STATS: '/api/data/stats',
        HEALTH_CHECK: '/health'
    },
    
    // 应用设置
    SETTINGS: {
        AUTO_REFRESH_INTERVAL: 10 * 60 * 1000, // 10分钟
        DATA_CACHE_DURATION: 5 * 60 * 1000, // 5分钟
        NOTIFICATION_TIMEOUT: 5000, // 5秒
        CHART_ANIMATION_DURATION: 1000, // 1秒
        MAX_RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1000 // 1秒
    },
    
    // AQI等级配置
    AQI_LEVELS: {
        GOOD: {
            range: [0, 50],
            name: '优',
            color: '#00e400',
            textColor: '#000000',
            healthEffect: '空气质量令人满意，基本无空气污染',
            advice: '各类人群可正常活动'
        },
        MODERATE: {
            range: [51, 100],
            name: '良',
            color: '#ffff00',
            textColor: '#000000',
            healthEffect: '空气质量可接受，但某些污染物可能对极少数异常敏感人群健康有较弱影响',
            advice: '极少数异常敏感人群应减少户外活动'
        },
        UNHEALTHY_SENSITIVE: {
            range: [101, 150],
            name: '轻度污染',
            color: '#ff7e00',
            textColor: '#000000',
            healthEffect: '易感人群症状有轻度加剧，健康人群出现刺激症状',
            advice: '儿童、老年人及心脏病、呼吸系统疾病患者应减少长时间、高强度的户外锻炼'
        },
        UNHEALTHY: {
            range: [151, 200],
            name: '中度污染',
            color: '#ff0000',
            textColor: '#ffffff',
            healthEffect: '进一步加剧易感人群症状，可能对健康人群心脏、呼吸系统有影响',
            advice: '儿童、老年人及心脏病、呼吸系统疾病患者避免长时间、高强度的户外锻炼，一般人群适量减少户外运动'
        },
        VERY_UNHEALTHY: {
            range: [201, 300],
            name: '重度污染',
            color: '#8f3f97',
            textColor: '#ffffff',
            healthEffect: '心脏病和肺病患者症状显著加剧，运动耐受力降低，健康人群普遍出现症状',
            advice: '儿童、老年人和心脏病、肺病患者应停留在室内，停止户外运动，一般人群减少户外运动'
        },
        HAZARDOUS: {
            range: [301, 500],
            name: '严重污染',
            color: '#7e0023',
            textColor: '#ffffff',
            healthEffect: '健康人群运动耐受力降低，有明显强烈症状，提前出现某些疾病',
            advice: '儿童、老年人和病人应当留在室内，避免体力消耗，一般人群应避免户外活动'
        }
    },
    
    // 天气图标映射
    WEATHER_ICONS: {
        '100': 'fas fa-sun', // 晴
        '101': 'fas fa-cloud-sun', // 多云
        '102': 'fas fa-cloud', // 少云
        '103': 'fas fa-cloud-sun', // 晴间多云
        '104': 'fas fa-cloud', // 阴
        '150': 'fas fa-sun', // 晴（夜）
        '151': 'fas fa-cloud-moon', // 多云（夜）
        '152': 'fas fa-cloud', // 少云（夜）
        '153': 'fas fa-cloud-moon', // 晴间多云（夜）
        '300': 'fas fa-cloud-rain', // 阵雨
        '301': 'fas fa-cloud-showers-heavy', // 强阵雨
        '302': 'fas fa-bolt', // 雷阵雨
        '303': 'fas fa-poo-storm', // 强雷阵雨
        '304': 'fas fa-cloud-meatball', // 雷阵雨伴有冰雹
        '305': 'fas fa-cloud-rain', // 小雨
        '306': 'fas fa-cloud-rain', // 中雨
        '307': 'fas fa-cloud-showers-heavy', // 大雨
        '308': 'fas fa-cloud-showers-heavy', // 极端降雨
        '309': 'fas fa-cloud-rain', // 毛毛雨/细雨
        '310': 'fas fa-cloud-showers-heavy', // 暴雨
        '311': 'fas fa-cloud-showers-heavy', // 大暴雨
        '312': 'fas fa-cloud-showers-heavy', // 特大暴雨
        '313': 'fas fa-icicles', // 冻雨
        '399': 'fas fa-cloud-rain', // 雨
        '400': 'fas fa-snowflake', // 小雪
        '401': 'fas fa-snowflake', // 中雪
        '402': 'fas fa-snowflake', // 大雪
        '403': 'fas fa-snowflake', // 暴雪
        '404': 'fas fa-snowflake', // 雨夹雪
        '405': 'fas fa-snowflake', // 雨雪天气
        '406': 'fas fa-snowflake', // 阵雨夹雪
        '407': 'fas fa-snowflake', // 阵雪
        '499': 'fas fa-snowflake', // 雪
        '500': 'fas fa-smog', // 薄雾
        '501': 'fas fa-smog', // 雾
        '502': 'fas fa-smog', // 霾
        '503': 'fas fa-wind', // 扬沙
        '504': 'fas fa-wind', // 浮尘
        '507': 'fas fa-wind', // 沙尘暴
        '508': 'fas fa-wind', // 强沙尘暴
        '509': 'fas fa-smog', // 浓雾
        '510': 'fas fa-smog', // 强浓雾
        '511': 'fas fa-smog', // 中度霾
        '512': 'fas fa-smog', // 重度霾
        '513': 'fas fa-smog', // 严重霾
        '514': 'fas fa-smog', // 大雾
        '515': 'fas fa-smog', // 特强浓雾
        '900': 'fas fa-thermometer-full', // 热
        '901': 'fas fa-thermometer-empty', // 冷
        '999': 'fas fa-question-circle' // 未知
    },
    
    // 污染物名称映射
    POLLUTANT_NAMES: {
        'pm2p5': 'PM2.5',
        'pm10': 'PM10',
        'no2': '二氧化氮',
        'o3': '臭氧',
        'so2': '二氧化硫',
        'co': '一氧化碳'
    },
    
    // 默认设置
    DEFAULT_SETTINGS: {
        airQualityAlert: true,
        updateFrequency: 10,
        theme: 'light',
        chartAnimation: true
    }
};

// 导出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
