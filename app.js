const api = require('./utils/api');

App({
  onLaunch() {
    this.autoLogin();
  },

  // 小程序启动时尝试微信静默登录
  // 若服务端返回 token 则更新本地缓存；若失败则保留已有 token 继续使用
  autoLogin() {
    wx.login({
      success: res => {
        if (!res.code) return;
        api.wechatLogin(res.code).then(data => {
          const token = data.token || data.accessToken || data.access_token || '';
          if (token) {
            wx.setStorageSync('token', token);
          }
          const user = data.user || data.userInfo || null;
          if (user) {
            this.globalData.userInfo = user;
            wx.setStorageSync('userInfo', user);
          }
        }).catch(err => {
          // 静默登录失败：可能是后端不可用，保留本地已有 token
          console.warn('自动登录失败，使用本地缓存', err);
          const cachedUser = wx.getStorageSync('userInfo');
          if (cachedUser) {
            this.globalData.userInfo = cachedUser;
          }
        });
      },
      fail: () => {
        // wx.login 调用失败（网络问题等），从本地恢复
        const cachedUser = wx.getStorageSync('userInfo');
        if (cachedUser) {
          this.globalData.userInfo = cachedUser;
        }
      }
    });
  },

  // 登出：清除所有登录态
  logout() {
    wx.removeStorageSync('token');
    wx.removeStorageSync('userInfo');
    this.globalData.userInfo = null;
  },

  globalData: {
    userInfo: null,
    currentProduct: null
  }
});
