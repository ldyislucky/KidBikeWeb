const api = require('../../utils/api');

Page({
  data: {
    phone: '',
    nickname: '',
    password: '',
    confirmPassword: '',
    submitting: false
  },

  onPhoneInput(e) {
    this.setData({ phone: e.detail.value });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value });
  },

  onConfirmPasswordInput(e) {
    this.setData({ confirmPassword: e.detail.value });
  },

  onSubmit() {
    const { phone, nickname, password, confirmPassword, submitting } = this.data;

    if (submitting) return;

    if (!phone.trim()) {
      wx.showToast({ title: '请输入手机号', icon: 'none' });
      return;
    }
    if (!/^1[3-9]\d{9}$/.test(phone.trim())) {
      wx.showToast({ title: '请输入有效的手机号', icon: 'none' });
      return;
    }
    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (!password || password.length < 6) {
      wx.showToast({ title: '密码至少6位', icon: 'none' });
      return;
    }
    if (password !== confirmPassword) {
      wx.showToast({ title: '两次输入的密码不一致', icon: 'none' });
      return;
    }

    this.setData({ submitting: true });
    wx.showLoading({ title: '注册中...' });

    api.register({
      phone: phone.trim(),
      nickname: nickname.trim(),
      password
    }).then(res => {
      wx.hideLoading();
      const token = res.token || res.data?.token || '';
      const user = res.user || res.data?.user || null;
      if (token) {
        wx.setStorageSync('token', token);
      }
      if (user) {
        wx.setStorageSync('userInfo', user);
      }
      wx.showToast({ title: '注册成功', icon: 'success', duration: 1500 });
      setTimeout(() => { wx.navigateBack(); }, 1500);
    }).catch(err => {
      wx.hideLoading();
      const msg = err.data?.detail || err.data?.message || '注册失败，请重试';
      wx.showToast({ title: msg, icon: 'none' });
      this.setData({ submitting: false });
    });
  },

  onGoLogin() {
    // 如果有上级页面则返回，否则跳转登录页
    if (getCurrentPages().length > 1) {
      wx.navigateBack();
    } else {
      wx.redirectTo({ url: '/pages/login/login' });
    }
  }
});
