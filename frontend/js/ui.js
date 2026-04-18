// UI管理器
class UIManager {
    constructor() {
        this.currentLocation = null;
        this.currentWeather = null;
        this.currentAirQuality = null;
        this.currentForecast = null;
        this.settings = this.loadSettings();
        this.notificationId = 0;
        this.autoRefreshTimer = null;
        
        this.initEventListeners();
        this.applyTheme();
    }

    // 初始化事件监听器
    initEventListeners() {
        // 刷新按钮
        document.getElementById('refresh-btn').addEventListener('click', () => {
            this.refreshAllData();
        });

        // 设置按钮
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.openSettings();
        });

        // 关闭设置按钮
        document.getElementById('close-settings').addEventListener('click', () => {
            this.closeSettings();
        });

        // 保存设置按钮
        document.getElementById('save-settings').addEventListener('click', () => {
            this.saveSettings();
        });

        // 恢复默认设置按钮
        document.getElementById('reset-settings').addEventListener('click', () => {
            this.resetSettings();
        });

        // 设置城市按钮
        document.getElementById('set-city-btn').addEventListener('click', () => {
            this.setManualCity();
        });

        // 图表控制按钮
        document.getElementById('temp-chart-btn').addEventListener('click', () => {
            this.setChartMode('temperature');
        });

        document.getElementById('humidity-chart-btn').addEventListener('click', () => {
            this.setChartMode('humidity');
        });

        document.getElementById('both-chart-btn').addEventListener('click', () => {
            this.setChartMode('both');
        });

        // 点击设置面板外部关闭
        document.addEventListener('click', (event) => {
            const settingsPanel = document.getElementById('settings-panel');
            const settingsBtn = document.getElementById('settings-btn');
            
            if (settingsPanel.classList.contains('active') && 
                !settingsPanel.contains(event.target) && 
                !settingsBtn.contains(event.target)) {
                this.closeSettings();
            }
        });

        // 键盘快捷键
        document.addEventListener('keydown', (event) => {
            // F5 刷新
            if (event.key === 'F5') {
                event.preventDefault();
                this.refreshAllData();
            }
            
            // ESC 关闭设置
            if (event.key === 'Escape') {
                this.closeSettings();
            }
            
            // Ctrl+S 打开设置
            if (event.ctrlKey && event.key === 's') {
                event.preventDefault();
                this.openSettings();
            }
        });
    }

    // 加载设置
    loadSettings() {
        try {
            const saved = localStorage.getItem('haze-prediction-settings');
            if (saved) {
                return { ...AppConfig.DEFAULT_SETTINGS, ...JSON.parse(saved) };
            }
        } catch (error) {
            console.error('加载设置失败:', error);
        }
        return { ...AppConfig.DEFAULT_SETTINGS };
    }

    // 保存设置
    saveSettings() {
        try {
            this.settings.autoLocation = document.getElementById('auto-location').checked;
            this.settings.airQualityAlert = document.getElementById('air-quality-alert').checked;
            this.settings.updateFrequency = parseInt(document.getElementById('update-frequency').value);
            this.settings.theme = document.getElementById('theme-select').value;
            this.settings.chartAnimation = document.getElementById('chart-animation').checked;
            this.settings.manualCity = document.getElementById('manual-city').value;
            
            localStorage.setItem('haze-prediction-settings', JSON.stringify(this.settings));
            
            this.applyTheme();
            this.setupAutoRefresh();
            this.showNotification('设置已保存', 'success');
            this.closeSettings();
        } catch (error) {
            console.error('保存设置失败:', error);
            this.showNotification('保存设置失败', 'error');
        }
    }

    // 重置设置
    resetSettings() {
        if (confirm('确定要恢复默认设置吗？')) {
            this.settings = { ...AppConfig.DEFAULT_SETTINGS };
            localStorage.removeItem('haze-prediction-settings');
            this.updateSettingsUI();
            this.applyTheme();
            this.showNotification('已恢复默认设置', 'success');
        }
    }

    // 更新设置UI
    updateSettingsUI() {
        document.getElementById('auto-location').checked = this.settings.autoLocation;
        document.getElementById('air-quality-alert').checked = this.settings.airQualityAlert;
        document.getElementById('update-frequency').value = this.settings.updateFrequency;
        document.getElementById('theme-select').value = this.settings.theme;
        document.getElementById('chart-animation').checked = this.settings.chartAnimation;
        document.getElementById('manual-city').value = this.settings.manualCity;
    }

    // 应用主题
    applyTheme() {
        let theme = this.settings.theme;
        
        if (theme === 'auto') {
            theme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        
        document.documentElement.setAttribute('data-theme', theme);
    }

    // 打开设置面板
    openSettings() {
        this.updateSettingsUI();
        document.getElementById('settings-panel').classList.add('active');
    }

    // 关闭设置面板
    closeSettings() {
        document.getElementById('settings-panel').classList.remove('active');
    }

    // 设置手动城市
    async setManualCity() {
        const cityInput = document.getElementById('manual-city');
        const city = cityInput.value.trim();
        
        if (!city) {
            this.showNotification('请输入城市名称', 'warning');
            return;
        }
        
        try {
            // 这里可以添加城市验证逻辑
            // 暂时假设城市格式为"城市,省份"
            const [cityName, province] = city.split(',').map(s => s.trim());
            
            await apiClient.setManualLocation(cityName, province || cityName);
            this.settings.manualCity = city;
            this.saveSettings();
            this.refreshAllData();
            this.showNotification(`已切换到 ${city}`, 'success');
        } catch (error) {
            console.error('设置城市失败:', error);
            this.showNotification('设置城市失败', 'error');
        }
    }

    // 显示通知
    showNotification(message, type = 'info') {
        const container = document.getElementById('notification-container');
        const id = ++this.notificationId;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${this.getNotificationIcon(type)}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        container.appendChild(notification);
        
        // 自动移除
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, AppConfig.SETTINGS.NOTIFICATION_TIMEOUT);
        
        return id;
    }

    // 获取通知图标
    getNotificationIcon(type) {
        switch (type) {
            case 'success': return 'fa-check-circle';
            case 'error': return 'fa-exclamation-circle';
            case 'warning': return 'fa-exclamation-triangle';
            case 'info': return 'fa-info-circle';
            default: return 'fa-info-circle';
        }
    }

    // 更新位置显示
    updateLocationDisplay(locationData) {
        if (!locationData) return;
        
        this.currentLocation = locationData;
        
        document.getElementById('current-city').textContent = locationData.city || '未知';
        document.getElementById('location-province').textContent = locationData.province || '';
        
        // 更新时间显示
        this.updateTimeDisplay();
    }

    // 更新时间显示
    updateTimeDisplay() {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
        });
        
        document.getElementById('location-time').textContent = timeStr;
    }

    // 更新天气显示
    updateWeatherDisplay(weatherData) {
        if (!weatherData || !weatherData.now) return;
        
        this.currentWeather = weatherData;
        const now = weatherData.now;
        
        const weatherCard = document.getElementById('weather-card');
        const iconClass = AppConfig.WEATHER_ICONS[now.icon] || 'fas fa-question-circle';
        
        weatherCard.innerHTML = `
            <div class="weather-content">
                <div class="weather-main">
                    <div class="weather-icon">
                        <i class="${iconClass}"></i>
                    </div>
                    <div class="weather-temp">${now.temp}°C</div>
                    <div class="weather-desc">${now.text}</div>
                </div>
                <div class="weather-details">
                    <div class="weather-detail">
                        <i class="fas fa-temperature-low"></i>
                        <span>体感温度: ${now.feelsLike}°C</span>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-wind"></i>
                        <span>风力: ${now.windScale}级 ${now.windDir}</span>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-tint"></i>
                        <span>湿度: ${now.humidity}%</span>
                    </div>
                    <div class="weather-detail">
                        <i class="fas fa-tachometer-alt"></i>
                        <span>气压: ${now.pressure} hPa</span>
                    </div>
                </div>
            </div>
        `;
        
        // 更新更新时间 - 增强时间解析
        let updateTimeStr;
        try {
            console.log('天气数据更新时间字段:', weatherData.updateTime);
            
            if (weatherData.updateTime) {
                // 尝试解析时间
                let updateTime = new Date(weatherData.updateTime);
                
                // 检查时间是否有效
                if (isNaN(updateTime.getTime())) {
                    console.warn('天气更新时间无效，使用当前时间');
                    updateTime = new Date();
                }
                
                updateTimeStr = updateTime.toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                });
            } else {
                console.warn('天气数据没有updateTime字段，使用当前时间');
                updateTimeStr = new Date().toLocaleTimeString('zh-CN', { 
                    hour: '2-digit', 
                    minute: '2-digit',
                    second: '2-digit'
                });
            }
        } catch (error) {
            console.error('解析天气更新时间失败:', error);
            updateTimeStr = new Date().toLocaleTimeString('zh-CN', { 
                hour: '2-digit', 
                minute: '2-digit'
            });
        }
        
        // 注意：已删除天气独立更新时间显示，只保留底部统一时间
        console.log('天气数据已更新，底部统一时间将显示更新状态');
    }

    // 更新空气质量显示
    updateAirQualityDisplay(airQualityData) {
        if (!airQualityData || !airQualityData.indexes) return;
        
        this.currentAirQuality = airQualityData;
        
        // 获取中国标准AQI数据
        const cnAqi = airQualityData.indexes.find(index => index.code === 'cn-mee');
        if (!cnAqi) {
            console.error('未找到中国标准AQI数据 (cn-mee)', airQualityData.indexes);
            return;
        }
        
        const aqiLevel = this.getAqiLevel(cnAqi.aqi);
        const airQualityCard = document.getElementById('air-quality-card');
        
        airQualityCard.innerHTML = `
            <div class="aqi-display">
                <div class="aqi-display-left">
                    <div class="aqi-value">${cnAqi.aqi}</div>
                    <div class="aqi-level ${aqiLevel.className}" style="background-color: ${aqiLevel.color}; color: ${aqiLevel.textColor}">
                        ${aqiLevel.name} (${cnAqi.category})
                    </div>
                </div>
                <div class="pollutants-right">
                    ${this.generatePollutantsHTML(airQualityData.pollutants)}
                </div>
            </div>
        `;
        
        // 注意：已删除空气质量独立更新时间显示，只保留底部统一时间
        console.log('空气质量数据已更新，底部统一时间将显示更新状态');
        
        // 检查空气质量警报
        if (this.settings.airQualityAlert && cnAqi.aqi > 150) {
            this.showNotification(`空气质量警报: ${aqiLevel.name}，建议减少户外活动`, 'warning');
        }
    }

    // 获取AQI等级
    getAqiLevel(aqi) {
        for (const [key, level] of Object.entries(AppConfig.AQI_LEVELS)) {
            if (aqi >= level.range[0] && aqi <= level.range[1]) {
                return {
                    ...level,
                    className: `aqi-${key.toLowerCase().replace('_', '-')}`
                };
            }
        }
        return AppConfig.AQI_LEVELS.GOOD;
    }

    // 生成污染物HTML
    generatePollutantsHTML(pollutants) {
        if (!pollutants) return '';
        
        return pollutants.map(pollutant => {
            const name = AppConfig.POLLUTANT_NAMES[pollutant.code] || pollutant.name;
            return `
                <div class="pollutant-item">
                    <div class="pollutant-name">${name}</div>
                    <div class="pollutant-value">${pollutant.concentration.value} ${pollutant.concentration.unit}</div>
                </div>
            `;
        }).join('');
    }

    // 更新健康建议
    updateHealthAdvice(airQualityData) {
        if (!airQualityData || !airQualityData.indexes) return;
        
        const cnAqi = airQualityData.indexes.find(index => index.code === 'cn-mee');
        if (!cnAqi || !cnAqi.health) {
            console.error('未找到中国标准AQI健康建议数据 (cn-mee)', airQualityData.indexes);
            return;
        }
        
        const healthCard = document.getElementById('health-card');
        const aqiLevel = this.getAqiLevel(cnAqi.aqi);
        
        healthCard.innerHTML = `
            <div class="health-advice">
                <div class="advice-title">
                    <i class="fas fa-heartbeat"></i>
                    <span>健康影响</span>
                </div>
                <p>${cnAqi.health.effect || aqiLevel.healthEffect}</p>
            </div>
            <div class="health-advice">
                <div class="advice-title">
                    <i class="fas fa-user-friends"></i>
                    <span>一般人群建议</span>
                </div>
                <p>${cnAqi.health.advice?.generalPopulation || aqiLevel.advice}</p>
            </div>
            ${cnAqi.health.advice?.sensitivePopulation ? `
            <div class="health-advice">
                <div class="advice-title">
                    <i class="fas fa-user-injured"></i>
                    <span>敏感人群建议</span>
                </div>
                <p>${cnAqi.health.advice.sensitivePopulation}</p>
            </div>
            ` : ''}
        `;
    }

    // 设置图表模式
    setChartMode(mode) {
        // 更新按钮状态
        document.querySelectorAll('.chart-btn').forEach(btn => btn.classList.remove('active'));
        
        switch (mode) {
            case 'temperature':
                document.getElementById('temp-chart-btn').classList.add('active');
                break;
            case 'humidity':
                document.getElementById('humidity-chart-btn').classList.add('active');
                break;
            case 'both':
                document.getElementById('both-chart-btn').classList.add('active');
                break;
        }
        
        // 检查图表管理器是否存在，如果不存在则尝试初始化
        if (!window.chartManager) {
            console.warn('图表管理器不存在，尝试初始化...');
            if (typeof ChartManager !== 'undefined') {
                window.chartManager = new ChartManager();
                console.log('图表管理器初始化成功');
            } else {
                console.error('ChartManager类未定义，请检查charts.js是否已加载');
                return; // 无法继续
            }
        }
        
        // 更新图表
        if (window.chartManager && this.currentForecast) {
            window.chartManager.updateChart(this.currentForecast, mode);
        } else if (!this.currentForecast) {
            console.warn('没有预报数据可用于图表更新');
        }
    }

    // 设置自动刷新
    setupAutoRefresh() {
        if (this.autoRefreshTimer) {
            clearInterval(this.autoRefreshTimer);
        }
        
        const interval = this.settings.updateFrequency * 60 * 1000;
        if (interval > 0) {
            this.autoRefreshTimer = setInterval(() => {
                this.refreshAllData();
            }, interval);
        }
    }

    // 刷新所有数据
    async refreshAllData() {
        try {
            this.showNotification('正在更新数据...', 'info');
            
            // 获取位置
            const locationResponse = await apiClient.getCurrentLocation();
            this.updateLocationDisplay(locationResponse.data);
            
            // 获取综合天气信息
            const weatherResponse = await apiClient.getComprehensiveWeather(locationResponse.data);
            
            // 添加详细的调试日志
            console.log('=== 开始调试天气响应数据 ===');
            console.log('完整的weatherResponse:', weatherResponse);
            console.log('weatherResponse类型:', typeof weatherResponse);
            console.log('weatherResponse.success:', weatherResponse.success);
            console.log('weatherResponse.data是否存在?:', 'data' in weatherResponse);
            
            if (weatherResponse.data) {
                console.log('weatherResponse.data:', weatherResponse.data);
                console.log('weatherResponse.data类型:', typeof weatherResponse.data);
                console.log('weatherResponse.data.forecast是否存在?:', 'forecast' in weatherResponse.data);
                
                if (weatherResponse.data.weather) {
                    console.log('天气数据存在，开始更新天气显示');
                    this.updateWeatherDisplay(weatherResponse.data.weather);
                } else {
                    console.warn('天气数据不存在于响应中');
                }
                
                if (weatherResponse.data.airQuality) {
                    console.log('空气质量数据存在，开始更新空气质量显示');
                    this.updateAirQualityDisplay(weatherResponse.data.airQuality);
                    this.updateHealthAdvice(weatherResponse.data.airQuality);
                } else {
                    console.warn('空气质量数据不存在于响应中');
                }
                
                if (weatherResponse.data.forecast) {
                    console.log('预报数据接收成功，详细分析:');
                    console.log('forecast对象:', weatherResponse.data.forecast);
                    console.log('forecast类型:', typeof weatherResponse.data.forecast);
                    console.log('forecast.code:', weatherResponse.data.forecast.code);
                    console.log('hourly数组是否存在?:', 'hourly' in weatherResponse.data.forecast);
                    console.log('hourly数组长度:', weatherResponse.data.forecast.hourly ? weatherResponse.data.forecast.hourly.length : 0);
                    console.log('hourly数组前2个元素:', weatherResponse.data.forecast.hourly ? weatherResponse.data.forecast.hourly.slice(0, 2) : '无');
                    
                    this.currentForecast = weatherResponse.data.forecast;
                    
                    // 检查图表管理器是否存在，如果不存在则尝试初始化
                    if (!window.chartManager) {
                        console.warn('图表管理器不存在，尝试初始化...');
                        if (typeof ChartManager !== 'undefined') {
                            window.chartManager = new ChartManager();
                            console.log('图表管理器实例创建成功');
                        } else {
                            console.error('ChartManager类未定义，请检查charts.js是否已加载');
                            // 即使没有图表管理器，也继续处理其他数据
                        }
                    }
                    
                    if (window.chartManager) {
                        // 确保图表已初始化
                        if (typeof window.chartManager.init === 'function' && !window.chartManager.isInitialized) {
                            console.log('图表未初始化，正在初始化...');
                            window.chartManager.init();
                        }
                        
                        console.log('图表管理器存在，开始更新图表');
                        window.chartManager.updateChart(weatherResponse.data.forecast, 'temperature');
                    } else {
                        console.warn('无法初始化图表管理器，跳过图表更新');
                    }
                    
                    // 更新预报更新时间 - 增强时间解析
                    let forecastUpdateTimeStr;
                    try {
                        console.log('预报数据更新时间字段:', weatherResponse.data.forecast.updateTime);
                        
                        if (weatherResponse.data.forecast.updateTime) {
                            // 尝试解析时间
                            let forecastUpdateTime = new Date(weatherResponse.data.forecast.updateTime);
                            
                            // 检查时间是否有效
                            if (isNaN(forecastUpdateTime.getTime())) {
                                console.warn('预报更新时间无效，使用当前时间');
                                forecastUpdateTime = new Date();
                            }
                            
                            forecastUpdateTimeStr = forecastUpdateTime.toLocaleTimeString('zh-CN', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                            });
                        } else {
                            console.warn('预报数据没有updateTime字段，使用当前时间');
                            forecastUpdateTimeStr = new Date().toLocaleTimeString('zh-CN', { 
                                hour: '2-digit', 
                                minute: '2-digit',
                                second: '2-digit'
                            });
                        }
                    } catch (error) {
                        console.error('解析预报更新时间失败:', error);
                        forecastUpdateTimeStr = new Date().toLocaleTimeString('zh-CN', { 
                            hour: '2-digit', 
                            minute: '2-digit'
                        });
                    }
                    
                    // 注意：已删除预报独立更新时间显示，只保留底部统一时间
                    console.log('预报数据已更新，底部统一时间将显示更新状态');
                } else {
                    console.warn('预报数据不存在于响应中，weatherResponse.data:', weatherResponse.data);
                    console.warn('weatherResponse.data的所有属性:', Object.keys(weatherResponse.data));
                }
            } else {
                console.error('weatherResponse.data不存在，weatherResponse:', weatherResponse);
            }
            
            console.log('=== 结束调试天气响应数据 ===');
            
            // 更新最后数据更新时间
            const now = new Date().toLocaleTimeString('zh-CN');
            document.getElementById('last-data-update').textContent = now;
            
            this.showNotification('数据更新完成', 'success');
            
        } catch (error) {
            console.error('刷新数据失败:', error);
            this.showNotification('数据更新失败', 'error');
        }
    }

    // 隐藏加载动画
    hideLoading() {
        const loading = document.getElementById('loading');
        loading.style.opacity = '0';
        setTimeout(() => {
            loading.style.display = 'none';
        }, 300);
    }

    // 显示加载动画
    showLoading() {
        const loading = document.getElementById('loading');
        loading.style.display = 'flex';
        setTimeout(() => {
            loading.style.opacity = '1';
        }, 10);
    }
}

// 创建全局UI管理器实例
const uiManager = new UIManager();
