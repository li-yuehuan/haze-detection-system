// 主应用程序
class HazeDetectionApp {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    // 初始化应用程序
    async init() {
        try {
            console.log('雾霾检测系统初始化...');
            
            // 检查服务器状态
            await this.checkServerStatus();
            
            // 初始化组件
            this.initComponents();
            
            // 加载初始数据
            await this.loadInitialData();
            
            // 设置自动刷新
            uiManager.setupAutoRefresh();
            
            // 隐藏加载动画
            setTimeout(() => {
                uiManager.hideLoading();
                this.isInitialized = true;
                console.log('雾霾检测系统初始化完成');
                
                // 显示欢迎通知
                uiManager.showNotification('雾霾检测系统已就绪', 'success');
            }, 500);
            
        } catch (error) {
            console.error('应用程序初始化失败:', error);
            this.handleInitError(error);
        }
    }

    // 检查服务器状态
    async checkServerStatus() {
        try {
            const isHealthy = await apiClient.healthCheck();
            
            if (!isHealthy) {
                throw new Error('服务器连接失败');
            }
            
            document.getElementById('server-status').textContent = '在线';
            document.getElementById('server-status').className = 'status-ok';
            
        } catch (error) {
            console.error('服务器检查失败:', error);
            document.getElementById('server-status').textContent = '离线';
            document.getElementById('server-status').style.color = 'var(--danger-color)';
            
            throw error;
        }
    }

    // 初始化组件
    initComponents() {
        // 初始化时间显示
        this.initTimeDisplay();
        
        // 初始化系统信息
        this.initSystemInfo();
        
        // 添加窗口调整大小监听
        window.addEventListener('resize', this.handleResize.bind(this));
        
        // 添加页面可见性监听
        document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));
    }

    // 初始化时间显示
    initTimeDisplay() {
        // 更新时间显示
        uiManager.updateTimeDisplay();
        
        // 每秒更新时间
        setInterval(() => {
            uiManager.updateTimeDisplay();
        }, 1000);
    }

    // 初始化系统信息
    initSystemInfo() {
        // 显示应用版本
        const version = '1.0.0';
        document.querySelector('.system-info p').textContent = 
            `雾霾检测系统 v${version} | 基于高德地图和风天气API`;
    }

    // 加载初始数据
    async loadInitialData() {
        try {
            // 检查是否有手动设置的城市
            if (uiManager.settings.manualCity && !uiManager.settings.autoLocation) {
                await this.loadManualCityData();
            } else {
                await uiManager.refreshAllData();
            }
            
            // 更新系统状态
            document.getElementById('system-status').textContent = '运行正常';
            
        } catch (error) {
            console.error('加载初始数据失败:', error);
            
            // 显示错误状态
            document.getElementById('system-status').textContent = '数据加载失败';
            document.getElementById('system-status').style.color = 'var(--warning-color)';
            
            // 显示错误通知
            uiManager.showNotification('数据加载失败，请检查网络连接', 'error');
            
            // 使用默认数据作为后备
            this.loadFallbackData();
        }
    }

    // 加载手动设置的城市数据
    async loadManualCityData() {
        const city = uiManager.settings.manualCity;
        const [cityName, province] = city.split(',').map(s => s.trim());
        
        try {
            // 设置手动位置
            await apiClient.setManualLocation(cityName, province || cityName);
            
            // 刷新数据
            await uiManager.refreshAllData();
            
        } catch (error) {
            console.error('加载手动城市数据失败:', error);
            throw error;
        }
    }

    // 加载后备数据（当API失败时）
    loadFallbackData() {
        console.log('加载后备数据...');
        
        // 使用默认的北京数据
        const defaultLocation = {
            city: '北京',
            province: '北京',
            adcode: '110000',
            rectangle: '116.011934,39.661271;116.782983,40.216496'
        };
        
        const defaultWeather = {
            now: {
                temp: '25',
                feelsLike: '26',
                icon: '100',
                text: '晴',
                windScale: '2',
                windDir: '东南风',
                humidity: '65',
                pressure: '1013'
            },
            updateTime: new Date().toISOString()
        };
        
        const defaultAirQuality = {
            indexes: [
                {
                    code: 'us-epa',
                    aqi: 45,
                    category: 'Good',
                    health: {
                        effect: '空气质量令人满意，基本无空气污染',
                        advice: {
                            generalPopulation: '各类人群可正常活动',
                            sensitivePopulation: '各类人群可正常活动'
                        }
                    }
                }
            ],
            pollutants: [
                {
                    code: 'pm2p5',
                    name: 'PM2.5',
                    concentration: { value: 15.0, unit: 'μg/m3' }
                },
                {
                    code: 'pm10',
                    name: 'PM10',
                    concentration: { value: 20.0, unit: 'μg/m3' }
                }
            ]
        };
        
        // 更新UI
        uiManager.updateLocationDisplay(defaultLocation);
        uiManager.updateWeatherDisplay(defaultWeather);
        uiManager.updateAirQualityDisplay(defaultAirQuality);
        uiManager.updateHealthAdvice(defaultAirQuality);
        
        // 显示警告
        uiManager.showNotification('使用模拟数据，请检查网络连接', 'warning');
    }

    // 处理窗口调整大小
    handleResize() {
        // 重新绘制图表（如果需要）
        if (window.chartManager && window.chartManager.chart) {
            window.chartManager.chart.resize();
        }
    }

    // 处理页面可见性变化
    handleVisibilityChange() {
        if (!document.hidden && this.isInitialized) {
            // 页面重新可见时刷新数据
            console.log('页面重新可见，刷新数据...');
            uiManager.refreshAllData();
        }
    }

    // 处理初始化错误
    handleInitError(error) {
        // 更新UI显示错误状态
        document.getElementById('system-status').textContent = '初始化失败';
        document.getElementById('system-status').style.color = 'var(--danger-color)';
        
        // 显示错误信息
        const errorMessage = error.message || '未知错误';
        const errorCard = document.createElement('div');
        errorCard.className = 'error-card';
        errorCard.innerHTML = `
            <h3><i class="fas fa-exclamation-triangle"></i> 系统初始化失败</h3>
            <p>错误信息: ${errorMessage}</p>
            <p>请检查以下问题：</p>
            <ul>
                <li>网络连接是否正常</li>
                <li>服务器是否运行</li>
                <li>API密钥配置是否正确</li>
            </ul>
            <button id="retry-init" class="btn btn-primary">
                <i class="fas fa-redo"></i> 重试初始化
            </button>
        `;
        
        // 替换主内容
        const mainContent = document.querySelector('.main-content');
        mainContent.innerHTML = '';
        mainContent.appendChild(errorCard);
        
        // 添加重试按钮事件
        document.getElementById('retry-init').addEventListener('click', () => {
            location.reload();
        });
        
        // 隐藏加载动画
        uiManager.hideLoading();
    }

    // 导出数据
    async exportData() {
        try {
            const data = {
                location: uiManager.currentLocation,
                weather: uiManager.currentWeather,
                airQuality: uiManager.currentAirQuality,
                forecast: uiManager.currentForecast,
                timestamp: new Date().toISOString(),
                settings: uiManager.settings
            };
            
            const dataStr = JSON.stringify(data, null, 2);
            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
            
            const exportFileDefaultName = `雾霾检测数据_${new Date().toISOString().slice(0, 10)}.json`;
            
            const linkElement = document.createElement('a');
            linkElement.setAttribute('href', dataUri);
            linkElement.setAttribute('download', exportFileDefaultName);
            linkElement.click();
            
            uiManager.showNotification('数据导出成功', 'success');
            
        } catch (error) {
            console.error('导出数据失败:', error);
            uiManager.showNotification('导出数据失败', 'error');
        }
    }

    // 获取应用状态
    getAppStatus() {
        return {
            initialized: this.isInitialized,
            location: uiManager.currentLocation ? '已获取' : '未获取',
            weather: uiManager.currentWeather ? '已获取' : '未获取',
            airQuality: uiManager.currentAirQuality ? '已获取' : '未获取',
            forecast: uiManager.currentForecast ? '已获取' : '未获取',
            server: document.getElementById('server-status').textContent,
            lastUpdate: document.getElementById('last-data-update').textContent
        };
    }
}

// 应用程序启动
document.addEventListener('DOMContentLoaded', () => {
    // 创建全局应用程序实例
    window.app = new HazeDetectionApp();
    
    // 将常用方法暴露给全局
    window.refreshData = () => uiManager.refreshAllData();
    window.exportData = () => window.app.exportData();
    window.getAppStatus = () => window.app.getAppStatus();
    
    // 添加调试模式（开发环境）
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        console.log('开发模式已启用');
        window.debugMode = true;
        
        // 添加调试快捷键
        document.addEventListener('keydown', (event) => {
            if (event.ctrlKey && event.shiftKey && event.key === 'D') {
                event.preventDefault();
                console.log('应用状态:', window.getAppStatus());
                console.log('当前设置:', uiManager.settings);
                console.log('缓存大小:', apiClient.cache.size);
                uiManager.showNotification('调试信息已输出到控制台', 'info');
            }
        });
    }
    
    // 添加服务工作者（如果支持）
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('/service-worker.js').catch(error => {
                console.log('Service Worker 注册失败:', error);
            });
        });
    }
});
