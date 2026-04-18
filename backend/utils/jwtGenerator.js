const { SignJWT, importPKCS8 } = require('jose');
const fs = require('fs');
const path = require('path');

class JWTGenerator {
  constructor() {
    this.privateKey = null;
    this.keyId = process.env.QWEATHER_KEY_ID || 'KCPQ6YKPYE';
    this.projectId = process.env.QWEATHER_PROJECT_ID || '3DTKTH2MC5';
    this.privateKeyPath = path.join(__dirname, '../../ed25519-private.pem');
  }

  async init() {
    try {
      // 读取私钥文件
      const privateKeyPem = fs.readFileSync(this.privateKeyPath, 'utf8');
      
      // 导入私钥
      this.privateKey = await importPKCS8(privateKeyPem, 'EdDSA');
      
      console.log('JWT生成器初始化成功');
      return true;
    } catch (error) {
      console.error('JWT生成器初始化失败:', error.message);
      throw error;
    }
  }

  async generateToken() {
    if (!this.privateKey) {
      await this.init();
    }

    try {
      const iat = Math.floor(Date.now() / 1000) - 30; // 当前时间减去30秒
      const exp = iat + 900; // 15分钟有效期

      const customHeader = {
        alg: 'EdDSA',
        kid: this.keyId
      };

      const customPayload = {
        sub: this.projectId,
        iat: iat,
        exp: exp
      };

      const token = await new SignJWT(customPayload)
        .setProtectedHeader(customHeader)
        .sign(this.privateKey);

      return token;
    } catch (error) {
      console.error('生成JWT Token失败:', error.message);
      throw error;
    }
  }

  // 获取缓存的token（在实际应用中应该缓存token）
  async getCachedToken() {
    // 这里可以添加缓存逻辑，避免频繁生成token
    return await this.generateToken();
  }
}

module.exports = new JWTGenerator();
