const api = require('../../utils/api');

Page({
  data: {
    userInfo: {
      avatar: '',
      nickName: '点击登录',
      isLogin: false,
      isAdmin: false   // 是否是管理员，控制「产品管理」板块显示
    },
    menuList: [
      { id: 1, icon: 'icon-a-024_bianji-37', title: '我的订单', url: '/pages/orders/orders' },
      { id: 2, icon: 'icon-success', title: '我的收藏', url: '/pages/favorites/favorites' },
      { id: 3, icon: 'icon-a-024_qianbao', title: '我的钱包', url: '/pages/wallet/wallet' },
      { id: 4, icon: 'icon-shu1', title: '收货地址', url: '/pages/addresses/addresses' },
      { id: 5, icon: 'icon-shu', title: '联系客服', url: '/pages/support/support' },
      { id: 6, icon: 'icon-shu-copy', title: '关于我们', url: '/pages/about/about' }
    ],
    // ---- 删除产品弹窗 ----
    showDeleteModal: false,
    deleteModalLoading: false,
    productList: []
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
        // 判断管理员：支持 role === 'admin' 或 isAdmin === true 两种字段约定
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
        // isAdmin 保持 false，只有通过接口拉取到 role 才更新
      });

      wx.login({
        success: res => {
          if (res.code) {
            api.wechatLogin(res.code, avatarUrl, nickName).then(data => {
              const token = data.token || data.accessToken || data.access_token || '';
              if (token) wx.setStorageSync('token', token);
              // 微信登录成功后重新拉取用户信息（含 role）
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

  // 点击头像区域（未登录时跳转登录页）
  onAvatarTap() {
    if (!this.data.userInfo.isLogin) {
      wx.navigateTo({ url: '/pages/login/login' });
    }
  },

  // ==================== 产品管理 ====================

  onAddProduct() {
    // 双重保险：点击时再次校验登录态和管理员权限
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

  // 点击「删除产品」入口 → 打开弹窗并拉取产品列表
  onDeleteProductEntry() {
    const { isLogin, isAdmin } = this.data.userInfo;
    if (!isLogin) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能管理产品',
        confirmText: '去登录',
        cancelText: '取消',
        success: res => {
          if (res.confirm) wx.navigateTo({ url: '/pages/login/login' });
        }
      });
      return;
    }
    if (!isAdmin) {
      wx.showToast({ title: '仅管理员可删除产品', icon: 'none' });
      return;
    }

    // 打开弹窗，拉取产品列表
    this.setData({ showDeleteModal: true, deleteModalLoading: true, productList: [] });
    api.getProducts().then(res => {
      // 兼容 { data: [...] } 或直接数组两种格式
      const list = Array.isArray(res) ? res : (res.data || res.items || res.list || []);
      this.setData({ productList: list, deleteModalLoading: false });
    }).catch(() => {
      this.setData({ deleteModalLoading: false });
      wx.showToast({ title: '获取产品列表失败', icon: 'none' });
    });
  },

  // 点击单条产品「删除」按钮 → 二次确认 → 调接口
  onDeleteProduct(e) {
    const { id, name } = e.currentTarget.dataset;
    wx.showModal({
      title: '确认删除',
      content: `确定要删除「${name || '该产品'}」吗？删除后不可恢复。`,
      confirmText: '删除',
      confirmColor: '#FF4444',
      cancelText: '取消',
      success: res => {
        if (!res.confirm) return;
        wx.showLoading({ title: '删除中...' });
        api.deleteProduct(id).then(() => {
          wx.hideLoading();
          wx.showToast({ title: '删除成功', icon: 'success' });
          // 从列表中移除已删除的产品
          const newList = this.data.productList.filter(p => p.id !== id);
          this.setData({ productList: newList });
        }).catch(err => {
          wx.hideLoading();
          const msg = (err.data && (err.data.detail || err.data.message)) || '删除失败，请重试';
          wx.showToast({ title: msg, icon: 'none' });
        });
      }
    });
  },

  // 关闭删除产品弹窗
  onCloseDeleteModal() {
    this.setData({ showDeleteModal: false, productList: [] });
  },

  // 阻止弹窗内容区点击冒泡关闭
  noop() {},

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
          // 调用全局 logout 方法统一清理
          const app = getApp();
          if (app && app.logout) {
            app.logout();
          } else {
            wx.removeStorageSync('token');
            wx.removeStorageSync('userInfo');
          }
          // 更新页面状态（含管理员状态重置）
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
