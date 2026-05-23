App({
  onLaunch() {
    this.autoLogin();
  },

  // 小程序启动时尝试从本地缓存恢复登录态
  autoLogin() {
    const cachedUser = wx.getStorageSync('userInfo');
    if (cachedUser) {
      this.globalData.userInfo = cachedUser;
    }
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
