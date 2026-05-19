const api = require('./utils/api');

App({
  onLaunch() {
    this.autoLogin();
  },

  autoLogin() {
    wx.login({
      success: res => {
        if (res.code) {
          api.wechatLogin(res.code).then(data => {
            const token = data.token || data.accessToken || data.access_token || '';
            if (token) {
              wx.setStorageSync('token', token);
            }
            if (data.user) {
              this.globalData.userInfo = data.user;
              wx.setStorageSync('userInfo', data.user);
            }
          }).catch(err => {
            console.error('登录失败', err);
          });
        }
      }
    });
  },

  globalData: {
    userInfo: null,
    currentProduct: null
  }
});
