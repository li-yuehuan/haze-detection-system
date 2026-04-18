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
        
        // 更新更新时间
        const updateTime = new Date(weatherData.updateTime || new Date()).toLocaleTimeString('zh-CN');
        document.getElementById('weather-updated').textContent = `更新于: ${updateTime}`;
    }

    // 更新空气质量显示
    updateAirQualityDisplay(airQualityData) {
        if (!airQualityData || !airQualityData.indexes) return;
        
        this.currentAirQuality = airQualityData;
        
        // 获取US AQI数据
        const usAqi = airQualityData.indexes.find(index => index.code === 'us-epa');
        if (!usAqi) return;
        
        const aqiLevel = this.getAqiLevel(usAqi.aqi);
        const airQualityCard = document.getElementById('air-quality-card');
        
        airQualityCard.innerHTML = `
            <div class="aqi-display">
                <div class="aqi-value">${usAqi.aqi}</div>
                <div class="aqi-level ${aqiLevel.className}" style="background-color: ${aqiLevel.color}; color: ${aqiLevel.textColor}">
                    ${aqiLevel.name} (${usAqi.category})
                </div>
            </div>
            <div class="pollutants-grid">
                ${this.generatePollutantsHTML(airQualityData.pollutants)}
            </div>
        `;
        
        // 更新更新时间
        const updateTime = new Date().toLocaleTimeString('zh-CN');
        document.getElementById('air-quality-updated').textContent = `更新于: ${updateTime}`;
        
        // 检查空气质量警报
        if (this.settings.airQualityAlert && usAqi.aqi > 150) {
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
        
        const usAqi = airQualityData.indexes.find(index => index.code === 'us-epa');
        if (!usAqi || !usAqi.health) return;
        
        const healthCard = document.getElementById('health-card');
        const aqiLevel = this.getAqiLevel(usAqi.aqi);
        
        healthCard.innerHTML = `
            <div class="health-advice">
                <div class="advice-title">
                    <i class="fas fa-heartbeat"></i>
                    <span>健康影响</span>
                </div>
                <p>${usAqi.health.effect || aqiLevel.healthEffect}</p>
            </div>
            <div class="health-advice">
                <div class="advice-title">
                    <i class="fas fa-user-friends"></i>
                    <span>一般人群建议</span>
                </div>
                <p>${usAqi.health.advice?.generalPopulation || aqiLevel.advice}</p>
            </div>
            ${usAqi.health.advice?.sensitivePopulation ? `
            <div class="health-advice">
                <div class="advice-title">
                    <i class="fas fa-user-injured"></i>
                    <span>敏感人群建议</span>
                </div>
                <p>${usAqi.health.advice.sensitivePopulation}</p>
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
        
        // 更新图表
        if (window.chartManager && this.currentForecast) {
            window.chartManager.updateChart(this.currentForecast, mode);
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
            
            if (weatherResponse.data.weather) {
                this.updateWeatherDisplay(weatherResponse.data.weather);
            }
            
            if (weatherResponse.data.airQuality) {
                this.updateAirQualityDisplay(weatherResponse.data.airQuality);
                this.updateHealthAdvice(weatherResponse.data.airQuality);
            }
            
            if (weatherResponse.data.forecast) {
                this.currentForecast = weatherResponse.data.forecast;
                if (window.chartManager) {
                    window.chartManager.updateChart(weatherResponse.data.forecast, 'temperature');
                }
                
                // 更新预报更新时间
                const updateTime = new Date(weatherResponse.data.forecast.updateTime || new Date()).toLocaleTimeString('zh-CN');
                document.getElementById('forecast-updated').textContent = `更新于: ${updateTime}`;
            }
            
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
