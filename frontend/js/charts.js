// 图表管理器
class ChartManager {
    constructor() {
        this.chart = null;
        this.currentMode = 'temperature';
        this.initChart();
    }

    // 初始化图表
    initChart() {
        const ctx = document.getElementById('forecast-chart').getContext('2d');
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    {
                        label: '温度 (°C)',
                        data: [],
                        borderColor: '#3498db',
                        backgroundColor: 'rgba(52, 152, 219, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#3498db',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6
                    },
                    {
                        label: '湿度 (%)',
                        data: [],
                        borderColor: '#2ecc71',
                        backgroundColor: 'rgba(46, 204, 113, 0.1)',
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointBackgroundColor: '#2ecc71',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        hidden: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                        labels: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                            font: {
                                size: 14
                            },
                            padding: 20
                        }
                    },
                    tooltip: {
                        mode: 'index',
                        intersect: false,
                        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--card-bg'),
                        titleColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                        bodyColor: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                        borderColor: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                        borderWidth: 1,
                        padding: 12,
                        callbacks: {
                            label: function(context) {
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                if (context.parsed.y !== null) {
                                    label += context.parsed.y + (context.datasetIndex === 0 ? '°C' : '%');
                                }
                                return label;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                            drawBorder: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            maxRotation: 45,
                            minRotation: 45
                        }
                    },
                    y: {
                        beginAtZero: false,
                        grid: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--border-color'),
                            drawBorder: false
                        },
                        ticks: {
                            color: getComputedStyle(document.documentElement).getPropertyValue('--text-secondary'),
                            callback: function(value) {
                                return value + (this.scale.id === 'y' ? '°C' : '%');
                            }
                        }
                    }
                },
                interaction: {
                    intersect: false,
                    mode: 'nearest'
                },
                animation: {
                    duration: uiManager.settings.chartAnimation ? 1000 : 0,
                    easing: 'easeOutQuart'
                }
            }
        });

        // 监听主题变化
        this.setupThemeListener();
    }

    // 设置主题监听
    setupThemeListener() {
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'data-theme') {
                    this.updateChartColors();
                }
            });
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ['data-theme']
        });
    }

    // 更新图表颜色
    updateChartColors() {
        if (!this.chart) return;

        const textColor = getComputedStyle(document.documentElement).getPropertyValue('--text-color');
        const textSecondaryColor = getComputedStyle(document.documentElement).getPropertyValue('--text-secondary');
        const borderColor = getComputedStyle(document.documentElement).getPropertyValue('--border-color');
        const cardBg = getComputedStyle(document.documentElement).getPropertyValue('--card-bg');

        // 更新图表选项
        this.chart.options.plugins.legend.labels.color = textColor;
        this.chart.options.plugins.tooltip.backgroundColor = cardBg;
        this.chart.options.plugins.tooltip.titleColor = textColor;
        this.chart.options.plugins.tooltip.bodyColor = textColor;
        this.chart.options.plugins.tooltip.borderColor = borderColor;
        
        this.chart.options.scales.x.grid.color = borderColor;
        this.chart.options.scales.x.ticks.color = textSecondaryColor;
        this.chart.options.scales.y.grid.color = borderColor;
        this.chart.options.scales.y.ticks.color = textSecondaryColor;

        this.chart.update('none');
    }

    // 更新图表数据
    updateChart(forecastData, mode = 'temperature') {
        if (!forecastData || !forecastData.hourly) {
            console.warn('没有预报数据可用于图表');
            return;
        }

        this.currentMode = mode;
        
        // 处理数据
        const hourlyData = forecastData.hourly.slice(0, 24); // 只取前24小时
        const labels = [];
        const temperatures = [];
        const humidities = [];

        hourlyData.forEach(hour => {
            // 格式化时间标签
            const time = new Date(hour.fxTime);
            const label = time.toLocaleTimeString('zh-CN', { 
                hour: '2-digit',
                minute: '2-digit'
            });
            
            labels.push(label);
            temperatures.push(parseFloat(hour.temp));
            humidities.push(parseFloat(hour.humidity));
        });

        // 更新图表数据
        this.chart.data.labels = labels;
        this.chart.data.datasets[0].data = temperatures;
        this.chart.data.datasets[1].data = humidities;

        // 根据模式显示/隐藏数据集
        switch (mode) {
            case 'temperature':
                this.chart.data.datasets[0].hidden = false;
                this.chart.data.datasets[1].hidden = true;
                this.chart.options.scales.y.ticks.callback = function(value) {
                    return value + '°C';
                };
                break;
                
            case 'humidity':
                this.chart.data.datasets[0].hidden = true;
                this.chart.data.datasets[1].hidden = false;
                this.chart.options.scales.y.ticks.callback = function(value) {
                    return value + '%';
                };
                break;
                
            case 'both':
                this.chart.data.datasets[0].hidden = false;
                this.chart.data.datasets[1].hidden = false;
                this.chart.options.scales.y.ticks.callback = function(value) {
                    return value;
                };
                break;
        }

        // 更新图表标题
        this.updateChartTitle(forecastData);

        // 更新图表
        this.chart.update();
    }

    // 更新图表标题
    updateChartTitle(forecastData) {
        if (!forecastData.updateTime) return;

        const updateTime = new Date(forecastData.updateTime);
        const title = `24小时预报 (更新于: ${updateTime.toLocaleTimeString('zh-CN', { 
            hour: '2-digit', 
            minute: '2-digit' 
        })})`;

        if (this.chart.options.plugins.title) {
            this.chart.options.plugins.title.text = title;
        } else {
            this.chart.options.plugins.title = {
                display: true,
                text: title,
                color: getComputedStyle(document.documentElement).getPropertyValue('--text-color'),
                font: {
                    size: 16,
                    weight: 'normal'
                },
                padding: {
                    top: 10,
                    bottom: 20
                }
            };
        }
    }

    // 获取统计数据
    getChartStats() {
        if (!this.chart || !this.chart.data.datasets[0].data.length) {
            return null;
        }

        const tempData = this.chart.data.datasets[0].data;
        const humidityData = this.chart.data.datasets[1].data;

        const stats = {
            temperature: {
                min: Math.min(...tempData),
                max: Math.max(...tempData),
                avg: tempData.reduce((a, b) => a + b, 0) / tempData.length
            },
            humidity: {
                min: Math.min(...humidityData),
                max: Math.max(...humidityData),
                avg: humidityData.reduce((a, b) => a + b, 0) / humidityData.length
            }
        };

        return stats;
    }

    // 导出图表为图片
    exportChart() {
        if (!this.chart) return null;

        const link = document.createElement('a');
        link.download = `雾霾检测图表_${new Date().toISOString().slice(0, 10)}.png`;
        link.href = this.chart.toBase64Image();
        return link;
    }

    // 重置图表
    resetChart() {
        if (!this.chart) return;

        this.chart.data.labels = [];
        this.chart.data.datasets[0].data = [];
        this.chart.data.datasets[1].data = [];
        this.chart.update();
    }

    // 切换动画
    toggleAnimation(enabled) {
        if (!this.chart) return;

        this.chart.options.animation.duration = enabled ? 1000 : 0;
        this.chart.update();
    }
}

// 创建全局图表管理器实例
const chartManager = new ChartManager();
window.chartManager = chartManager;
