const api = require('../../utils/api');

Page({
  data: {
    userInfo: {
      avatar: '',
      nickName: '点击登录',
      isLogin: false,
      isAdmin: false
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
        const isAdmin = user.role === 'admin' || user.isAdmin === true;
        this.setData({
          'userInfo.avatar': user.avatarUrl || '',
          'userInfo.nickName': user.nickName || '童车用户',
          'userInfo.isLogin': true,
          'userInfo.isAdmin': isAdmin
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
      const isAdmin = info.role === 'admin' || info.isAdmin === true;
      this.setData({
        'userInfo.avatar': info.avatarUrl || '',
        'userInfo.nickName': info.nickName || '童车用户',
        'userInfo.isLogin': true,
        'userInfo.isAdmin': isAdmin
      });
    } else {
      this.setData({
        'userInfo.avatar': '',
        'userInfo.nickName': '点击登录',
        'userInfo.isLogin': false,
        'userInfo.isAdmin': false
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
              this.checkLoginStatus();
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

  onAvatarTap() {
    if (!this.data.userInfo.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  // ==================== 产品管理 ====================

  onAddProduct() {
    const { isLogin, isAdmin } = this.data.userInfo;
    if (!isLogin) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能新增产品',
        confirmText: '去登录',
        cancelText: '取消',
        success: res => {
          if (res.confirm) wx.navigateTo({ url: '/pages/login/login' });
        }
      });
      return;
    }
    if (!isAdmin) {
      wx.showToast({ title: '仅管理员可新增产品', icon: 'none' });
      return;
    }
    wx.navigateTo({ url: '/pages/product-form/product-form' });
  },

  // ==================== 登录 / 注销 ====================

  onLogin() {
    wx.navigateTo({ url: '/pages/login/login' });
  },

  onRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
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
          const app = getApp();
          if (app && app.logout) {
            app.logout();
          } else {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
          }
          this.setData({
            'userInfo.avatar': '',
            'userInfo.nickName': '点击登录',
            'userInfo.isLogin': false,
            'userInfo.isAdmin': false
          });
          wx.showToast({ title: '已退出登录', icon: 'success', duration: 1500 });
        }
      }
    });
  }
});
