// 图表管理器
class ChartManager {
    constructor() {
        this.chart = null;
        this.currentMode = 'temperature';
        this.isInitialized = false;
        // 不在这里调用initChart()，等待显式初始化
    }

    // 初始化图表
    init() {
        if (this.isInitialized) {
            console.log('图表已经初始化');
            return;
        }
        
        if (!uiManager) {
            console.error('uiManager未定义，无法初始化图表');
            return;
        }
        
        this.initChart();
        this.isInitialized = true;
        console.log('图表初始化完成');
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
                                // 修复：使用更安全的方式检查scale上下文
                                try {
                                    // 在Chart.js 3.x中，this上下文可能不是scale
                                    // 使用闭包捕获外部变量作为后备方案
                                    return value + '°C';
                                } catch (error) {
                                    return value.toString();
                                }
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
        console.log('图表更新被调用，数据:', forecastData);
        console.log('数据中hourly属性是否存在?:', 'hourly' in forecastData);
        
        if (!forecastData || !forecastData.hourly) {
            console.warn('没有预报数据可用于图表', forecastData);
            console.warn('forecastData类型:', typeof forecastData);
            console.warn('forecastData.hourly类型:', forecastData ? typeof forecastData.hourly : 'forecastData为空');
            return;
        }

        console.log('hourly数组长度:', forecastData.hourly.length);
        console.log('hourly数组第一个元素:', forecastData.hourly[0]);
        
        this.currentMode = mode;
        
        // 处理数据
        const hourlyData = forecastData.hourly.slice(0, 24); // 只取前24小时
        console.log('处理后的小时数据长度:', hourlyData.length);
        
        const labels = [];
        const temperatures = [];
        const humidities = [];

        hourlyData.forEach((hour, index) => {
            try {
                console.log(`处理第${index}小时数据:`, hour);
                
                // 格式化时间标签 - 处理带时区的时间格式
                let time;
                let label;
                
                if (hour.fxTime) {
                    console.log(`小时${index}的fxTime:`, hour.fxTime);
                    // 尝试解析时间，处理可能的时区格式问题
                    time = new Date(hour.fxTime);
                    console.log(`解析后的时间:`, time, '是否有效:', !isNaN(time.getTime()));
                    
                    // 检查时间是否有效
                    if (isNaN(time.getTime())) {
                        // 如果时间无效，尝试移除时区信息再解析
                        const timeStr = hour.fxTime.replace(/\+08:00$/, '');
                        time = new Date(timeStr + '+08:00'); // 重新添加时区
                        
                        if (isNaN(time.getTime())) {
                            // 如果还是无效，使用索引作为后备
                            label = `${index}:00`;
                            console.log(`时间解析失败，使用后备标签: ${label}`);
                        } else {
                            label = time.toLocaleTimeString('zh-CN', { 
                                hour: '2-digit',
                                minute: '2-digit'
                            });
                            console.log(`时间解析成功，标签: ${label}`);
                        }
                    } else {
                        label = time.toLocaleTimeString('zh-CN', { 
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        console.log(`时间解析成功，标签: ${label}`);
                    }
                } else {
                    // 如果没有时间数据，使用索引作为后备
                    label = `${index}:00`;
                    console.log(`没有fxTime，使用后备标签: ${label}`);
                }
                
                labels.push(label);
                
                // 解析温度值，确保是数字
                const temp = parseFloat(hour.temp);
                console.log(`小时${index}的温度:`, hour.temp, '解析后:', temp, '是否有效:', !isNaN(temp));
                temperatures.push(isNaN(temp) ? 0 : temp);
                
                // 解析湿度值，确保是数字
                const humidity = parseFloat(hour.humidity);
                console.log(`小时${index}的湿度:`, hour.humidity, '解析后:', humidity, '是否有效:', !isNaN(humidity));
                humidities.push(isNaN(humidity) ? 0 : humidity);
                
            } catch (error) {
                console.error('处理小时数据时出错:', error, hour);
                // 提供默认值
                labels.push(`${index}:00`);
                temperatures.push(0);
                humidities.push(0);
            }
        });

        console.log('生成的标签:', labels);
        console.log('生成的温度数据:', temperatures);
        console.log('生成的湿度数据:', humidities);
        
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
        console.log('开始更新图表...');
        this.chart.update();
        console.log('图表更新完成');
    }

    // 更新图表标题
    updateChartTitle(forecastData) {
        if (!forecastData.updateTime) return;

        try {
            let updateTime;
            const timeStr = forecastData.updateTime;
            
            // 尝试解析更新时间
            updateTime = new Date(timeStr);
            
            // 检查时间是否有效
            if (isNaN(updateTime.getTime())) {
                // 如果时间无效，尝试移除时区信息再解析
                const cleanedTimeStr = timeStr.replace(/\+08:00$/, '');
                updateTime = new Date(cleanedTimeStr + '+08:00');
                
                if (isNaN(updateTime.getTime())) {
                    // 如果还是无效，使用当前时间
                    updateTime = new Date();
                }
            }
            
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
        } catch (error) {
            console.error('更新图表标题时出错:', error);
            // 出错时不设置标题
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
