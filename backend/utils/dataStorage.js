const fs = require('fs');
const path = require('path');

class DataStorage {
  constructor() {
    this.dataFilePath = process.env.DATA_FILE_PATH || './backend/data/locations.json';
    this.ensureDataFile();
  }

  // 确保数据文件存在
  ensureDataFile() {
    const dirPath = path.dirname(this.dataFilePath);
    
    // 创建目录（如果不存在）
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    
    // 创建文件（如果不存在）
    if (!fs.existsSync(this.dataFilePath)) {
      this.saveData({ locations: [], lastUpdated: new Date().toISOString() });
    }
  }

  // 读取数据
  readData() {
    try {
      const data = fs.readFileSync(this.dataFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('读取数据文件失败:', error.message);
      return { locations: [], lastUpdated: new Date().toISOString() };
    }
  }

  // 保存数据
  saveData(data) {
    try {
      const dataWithTimestamp = {
        ...data,
        lastUpdated: new Date().toISOString()
      };
      
      fs.writeFileSync(
        this.dataFilePath, 
        JSON.stringify(dataWithTimestamp, null, 2), 
        'utf8'
      );
      return true;
    } catch (error) {
      console.error('保存数据文件失败:', error.message);
      return false;
    }
  }

  // 添加位置记录
  addLocation(locationData) {
    const data = this.readData();
    
    // 检查是否已存在相同城市
    const existingIndex = data.locations.findIndex(
      loc => loc.city === locationData.city && loc.province === locationData.province
    );
    
    if (existingIndex >= 0) {
      // 更新现有记录
      data.locations[existingIndex] = {
        ...locationData,
        lastAccessed: new Date().toISOString(),
        accessCount: (data.locations[existingIndex].accessCount || 0) + 1
      };
    } else {
      // 添加新记录
      data.locations.push({
        ...locationData,
        firstAccessed: new Date().toISOString(),
        lastAccessed: new Date().toISOString(),
        accessCount: 1
      });
    }
    
    // 限制记录数量，最多保存50条
    if (data.locations.length > 50) {
      data.locations = data.locations.slice(-50);
    }
    
    return this.saveData(data);
  }

  // 获取所有位置记录
  getAllLocations() {
    const data = this.readData();
    return data.locations.sort((a, b) => {
      // 按最后访问时间倒序排列
      return new Date(b.lastAccessed) - new Date(a.lastAccessed);
    });
  }

  // 获取热门城市（按访问次数排序）
  getPopularCities(limit = 10) {
    const data = this.readData();
    return data.locations
      .sort((a, b) => (b.accessCount || 0) - (a.accessCount || 0))
      .slice(0, limit);
  }

  // 清除所有数据
  clearAllData() {
    return this.saveData({ locations: [], lastUpdated: new Date().toISOString() });
  }

  // 获取统计数据
  getStatistics() {
    const data = this.readData();
    return {
      totalLocations: data.locations.length,
      lastUpdated: data.lastUpdated,
      popularCities: this.getPopularCities(5)
    };
  }
}

module.exports = new DataStorage();
