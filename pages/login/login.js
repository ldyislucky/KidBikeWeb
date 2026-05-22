const api = require('../../utils/api');

Page({
  data: {
    phone: '',
    password: '',
    submitting: false,
    showPassword: false
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onTogglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  onSubmit() {
    const { phone, password, submitting } = this.data;

    if (submitting) return;

    if (!phone.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      wx.showToast({ title: '请输入有效的手机号', icon: 'none' });
      return;
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' });
      return;
    }
    if (password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '登录中...' });

    api.login({
      phone: phone.trim(),
      password
    }).then(res => {
      wx.hideLoading();
      const token = res.token || res.data?.token || res.accessToken || res.access_token || '';
      const user = res.user || res.data?.user || null;

      if (token) {
        wx.setStorageSync('token', token);
      }
      if (user) {
        wx.setStorageSync('userInfo', user);
      }

      wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });

      // 1.5秒后返回上一页
      setTimeout(() => {
        if (getCurrentPages().length > 1) {
          wx.navigateBack();
        } else {
          wx.switchTab({ url: '/pages/my/my' });
        }
      }, 1500);
    }).catch(err => {
      wx.hideLoading();
      const msg = err.data?.detail || err.data?.message || err.message || '登录失败，请检查账号或密码';
      wx.showToast({ title: msg, icon: 'none', duration: 2000 });
      this.setData({ submitting: false });
    });
  },

  // 微信一键登录
  onWechatLogin() {
    wx.showLoading({ title: '登录中...' });
    wx.login({
      success: res => {
        if (res.code) {
          api.wechatLogin(res.code).then(data => {
            wx.hideLoading();
            const token = data.token || data.accessToken || data.access_token || '';
            const user = data.user || null;
            if (token) wx.setStorageSync('token', token);
            if (user) wx.setStorageSync('userInfo', user);
            wx.showToast({ title: '登录成功', icon: 'success', duration: 1500 });
            setTimeout(() => {
              if (getCurrentPages().length > 1) {
                wx.navigateBack();
              } else {
                wx.switchTab({ url: '/pages/my/my' });
              }
            }, 1500);
          }).catch(() => {
            wx.hideLoading();
            wx.showToast({ title: '微信登录失败，请重试', icon: 'none' });
          });
        } else {
          wx.hideLoading();
          wx.showToast({ title: '获取登录凭证失败', icon: 'none' });
        }
      },
      fail: () => {
        wx.hideLoading();
        wx.showToast({ title: '微信登录失败', icon: 'none' });
      }
    });
  },

  onGoRegister() {
    wx.navigateTo({ url: '/pages/register/register' });
  }
});
