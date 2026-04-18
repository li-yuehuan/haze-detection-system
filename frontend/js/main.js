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
                    code: 'cn-mee',
                    aqi: 45,
                    category: '优',
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
    console.log('DOMContentLoaded触发，开始初始化应用...');
    
    // 使用setTimeout延迟执行，确保所有JS文件已加载
    setTimeout(() => {
        console.log('延迟初始化开始，检查全局变量...');
        console.log('window.uiManager:', window.uiManager);
        console.log('window.chartManager:', window.chartManager);
        console.log('window.apiClient:', window.apiClient);
        console.log('AppConfig:', typeof AppConfig);
        
        // 检查apiClient是否已定义
        if (!window.apiClient) {
            console.warn('apiClient未定义，尝试继续初始化...');
            // 尝试手动创建apiClient
            if (typeof APIClient !== 'undefined') {
                console.log('APIClient类已定义，尝试创建实例...');
                window.apiClient = new APIClient();
                console.log('手动创建apiClient成功:', window.apiClient);
            } else {
                console.error('APIClient类未定义，api.js可能未正确加载');
                // 显示警告信息
                const errorMsg = document.createElement('div');
                errorMsg.style.cssText = 'padding: 20px; background: #fff3cd; color: #856404; margin: 10px; border-radius: 5px;';
                errorMsg.innerHTML = '<strong>警告:</strong> API客户端未正确加载。数据获取功能可能受限。';
                document.querySelector('.main-content').prepend(errorMsg);
            }
        }
        
        // 临时注释掉uiManager检查，让页面能够加载
        // 确保uiManager已定义
        if (!window.uiManager) {
            console.warn('uiManager未定义，尝试继续初始化...');
            // 尝试手动创建uiManager
            if (typeof UIManager !== 'undefined') {
                console.log('UIManager类已定义，尝试创建实例...');
                window.uiManager = new UIManager();
                console.log('手动创建uiManager成功:', window.uiManager);
            } else {
                console.error('UIManager类未定义，ui.js可能未正确加载');
                // 显示错误信息，但不阻止页面加载
                const errorMsg = document.createElement('div');
                errorMsg.style.cssText = 'padding: 20px; background: #f8d7da; color: #721c24; margin: 10px; border-radius: 5px;';
                errorMsg.innerHTML = '<strong>警告:</strong> UI管理器未正确加载。请刷新页面或检查控制台错误。';
                document.querySelector('.main-content').prepend(errorMsg);
            }
        }
        
        // 确保chartManager已定义并初始化
        if (window.chartManager && typeof window.chartManager.init === 'function') {
            console.log('初始化图表管理器...');
            window.chartManager.init();
        } else {
            console.warn('图表管理器未定义或没有init方法');
        }
        
        // 创建全局应用程序实例
        try {
            window.app = new HazeDetectionApp();
            console.log('应用程序实例创建成功');
        } catch (error) {
            console.error('创建应用程序实例失败:', error);
            // 显示错误但不阻止页面
            const errorMsg = document.createElement('div');
            errorMsg.style.cssText = 'padding: 20px; background: #f8d7da; color: #721c24; margin: 10px; border-radius: 5px;';
            errorMsg.innerHTML = `<strong>应用程序初始化错误:</strong> ${error.message}`;
            document.querySelector('.main-content').prepend(errorMsg);
        }
        
        // 将常用方法暴露给全局
        window.refreshData = () => {
            if (window.uiManager) {
                window.uiManager.refreshAllData();
            } else {
                console.error('无法刷新数据：uiManager未定义');
                alert('UI管理器未初始化，请刷新页面');
            }
        };
        window.exportData = () => window.app ? window.app.exportData() : console.error('app未定义');
        window.getAppStatus = () => window.app ? window.app.getAppStatus() : { error: 'app未定义' };
        
        // 添加调试模式（开发环境）
        if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
            console.log('开发模式已启用');
            window.debugMode = true;
            
            // 添加调试快捷键
            document.addEventListener('keydown', (event) => {
                if (event.ctrlKey && event.shiftKey && event.key === 'D') {
                    event.preventDefault();
                    console.log('应用状态:', window.getAppStatus());
                    console.log('当前设置:', window.uiManager ? window.uiManager.settings : 'uiManager未定义');
                    console.log('缓存大小:', window.apiClient ? window.apiClient.cache?.size : 'apiClient未定义');
                    if (window.uiManager) {
                        window.uiManager.showNotification('调试信息已输出到控制台', 'info');
                    }
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
        
        console.log('应用程序初始化完成');
    }, 100); // 100ms延迟，确保所有JS文件已加载
});
