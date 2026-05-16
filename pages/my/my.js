Page({
  data: {
    userInfo: {
      avatar: '',
      nickName: '点击登录',
      isLogin: false
    },
    menuList: [
      { id: 1, icon: 'icon-a-024_bianji-37', title: '我的订单' },
      { id: 2, icon: 'icon-success', title: '我的收藏' },
      { id: 3, icon: 'icon-a-024_qianbao', title: '我的钱包' },
      { id: 4, icon: 'icon-shu1', title: '收货地址' },
      { id: 5, icon: 'icon-shu', title: '联系客服' },
      { id: 6, icon: 'icon-shu-copy', title: '关于我们' }
    ]
  },

  onLoad() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    wx.getStorage({
      key: 'userInfo',
      success: (res) => {
        this.setData({
          'userInfo.avatar': res.data.avatarUrl || '',
          'userInfo.nickName': res.data.nickName || '童车客户',
          'userInfo.isLogin': true
        });
      }
    });
  },

  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      const userInfo = e.detail.userInfo;
      wx.setStorage({
        key: 'userInfo',
        data: userInfo
      });
      this.setData({
        'userInfo.avatar': userInfo.avatarUrl,
        'userInfo.nickName': userInfo.nickName,
        'userInfo.isLogin': true
      });
    }
  },

  onMenuTap(e) {
    const id = e.currentTarget.dataset.id;
    const titles = {
      1: '我的订单',
      2: '我的收藏',
      3: '我的钱包',
      4: '收货地址',
      5: '联系客服',
      6: '关于我们'
    };
    wx.showToast({ title: titles[id] || '功能开发中', icon: 'none' });
  },

  onAddProduct() {
    wx.navigateTo({
      url: '/pages/product-form/product-form'
    });
  }
});
