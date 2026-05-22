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
    if (info && info.nickName) {
      this.setData({
        'userInfo.avatar': info.avatarUrl || '',
        'userInfo.nickName': info.nickName || '童车用户',
        'userInfo.isLogin': true
      });
    } else {
      this.setData({
        'userInfo.avatar': '',
        'userInfo.nickName': '点击登录',
        'userInfo.isLogin': false
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
      wx.showModal({
        title: '请先登录',
        content: '登录后即可查看' + (item ? item.title : '此功能'),
        confirmText: '去登录',
        cancelText: '取消',
        success: res => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          }
        }
      });
      return;
    }

    if (item && item.url) {
      wx.navigateTo({ url: item.url });
    }
  },

  // 点击头像区域（未登录时跳转登录页）
  onAvatarTap() {
    if (!this.data.userInfo.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  onAddProduct() {
    wx.navigateTo({
      url: '/pages/product-form/product-form'
    });
  },

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onRegister() {
    wx.navigateTo({
      url: '/pages/register/register'
    });
  },

  onLogout() {
    wx.showModal({
      title: '退出登录',
      content: '确定要退出登录吗？',
      confirmText: '退出',
      confirmColor: '#FF6B6B',
      cancelText: '取消',
      success: res => {
        if (res.confirm) {
          // 调用全局 logout 方法统一清理
          const app = getApp();
          if (app && app.logout) {
            app.logout();
          } else {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
          }
          // 更新页面状态
          this.setData({
            'userInfo.avatar': '',
            'userInfo.nickName': '点击登录',
            'userInfo.isLogin': false
          });
          wx.showToast({ title: '已退出登录', icon: 'success', duration: 1500 });
        }
      }
    });
  }
});
