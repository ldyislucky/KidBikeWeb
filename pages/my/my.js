const api = require('../../utils/api');

Page({
  data: {
    userInfo: {
      avatar: '',
      nickName: '点击登录',
      isLogin: false
    },
    menuList: [
      { id: 1, icon: 'icon-a-024_bianji-37', title: '我的订单', url: '/pages/orders/orders' },
      { id: 2, icon: 'icon-success', title: '我的收藏', url: '/pages/favorites/favorites' },
      { id: 3, icon: 'icon-a-024_qianbao', title: '我的钱包', url: '/pages/wallet/wallet' },
      { id: 4, icon: 'icon-shu1', title: '收货地址', url: '/pages/addresses/addresses' },
      { id: 5, icon: 'icon-shu', title: '联系客服', url: '/pages/support/support' },
      { id: 6, icon: 'icon-shu-copy', title: '关于我们', url: '/pages/about/about' }
    ]
  },

  onLoad() {
    this.checkLoginStatus();
  },

  onShow() {
    this.checkLoginStatus();
  },

  checkLoginStatus() {
    const token = wx.getStorageSync('token');
    if (token) {
      api.getUserInfo().then(res => {
        const user = res.data || res;
        this.setData({
          'userInfo.avatar': user.avatarUrl || '',
          'userInfo.nickName': user.nickName || '童车用户',
          'userInfo.isLogin': true
        });
        wx.setStorageSync('userInfo', user);
      }).catch(() => {
        this.loadLocalUserInfo();
      });
    } else {
      this.loadLocalUserInfo();
    }
  },

  loadLocalUserInfo() {
    const info = wx.getStorageSync('userInfo');
    if (info) {
      this.setData({
        'userInfo.avatar': info.avatarUrl || '',
        'userInfo.nickName': info.nickName || '童车用户',
        'userInfo.isLogin': true
      });
    }
  },

  onGetUserInfo(e) {
    if (e.detail.userInfo) {
      const { avatarUrl, nickName } = e.detail.userInfo;
      wx.setStorageSync('userInfo', { avatarUrl, nickName });
      this.setData({
        'userInfo.avatar': avatarUrl,
        'userInfo.nickName': nickName,
        'userInfo.isLogin': true
      });

      wx.login({
        success: res => {
          if (res.code) {
            api.wechatLogin(res.code, avatarUrl, nickName).then(data => {
              const token = data.token || data.accessToken || data.access_token || '';
              if (token) wx.setStorageSync('token', token);
            }).catch(() => {});
          }
        }
      });
    }
  },

  onMenuTap(e) {
    const token = wx.getStorageSync('token');
    const id = e.currentTarget.dataset.id;
    const item = this.data.menuList.find(m => m.id === id);

    if (!token && [1, 2, 3, 4].includes(id)) {
      wx.showToast({ title: '请先登录', icon: 'none' });
      return;
    }

    if (item && item.url) {
      wx.navigateTo({ url: item.url });
    }
  },

  onAddProduct() {
    wx.navigateTo({
      url: '/pages/product-form/product-form'
    });
  }
});
