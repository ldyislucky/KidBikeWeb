App({
  onLaunch() {
    wx.login({
      success: res => {}
    });
  },
  globalData: {
    userInfo: null,
    currentProduct: null
  }
});
