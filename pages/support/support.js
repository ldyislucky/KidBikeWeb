const api = require('../../utils/api');

Page({
  data: {
    contact: null,
    loading: true,
    productId: null,
    productTitle: '',
    contactInfo: '',
    content: '',
    submitting: false
  },

  onLoad(options) {
    if (options.productId) {
      this.setData({
        productId: options.productId,
        productTitle: decodeURIComponent(options.productTitle || '')
      });
    }
    this.fetchContact();
  },

  fetchContact() {
    this.setData({ loading: true });
    api.getSupportContact().then(res => {
      const contact = res.data || res;
      this.setData({ contact, loading: false });
    }).catch(() => {
      this.setData({ loading: false });
    });
  },

  // 一键拨打客服电话
  onCallPhone() {
    const { contact } = this.data;
    const phone = contact && (contact.phone || contact.hotline);
    if (!phone) {
      wx.showToast({ title: '暂无客服电话', icon: 'none' });
      return;
    }
    wx.makePhoneCall({
      phoneNumber: String(phone),
      fail: () => {
        // 用户取消或不支持时静默处理
      }
    });
  },

  onContactInput(e) {
    this.setData({ contactInfo: e.detail.value });
  },

  onContentInput(e) {
    this.setData({ content: e.detail.value });
  },

  onSubmit() {
    const { content, contactInfo, productId, submitting } = this.data;
    if (submitting) return;

    if (!contactInfo.trim()) {
      wx.showToast({ title: '请输入您的联系方式', icon: 'none' });
      return;
    }

    if (!content.trim()) {
      wx.showToast({ title: '请输入咨询内容', icon: 'none' });
      return;
    }

    const data = {
      content: content.trim(),
      contact: contactInfo.trim()
    };
    if (productId) data.productId = Number(productId);

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    api.submitInquiry(data).then(() => {
      wx.hideLoading();
      wx.showToast({ title: '提交成功，我们会尽快回复', icon: 'success', duration: 2000 });
      this.setData({ content: '', contactInfo: '', submitting: false });
    }).catch(err => {
      wx.hideLoading();
      console.error('提交咨询失败', err);
      wx.showToast({ title: '提交失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    });
  }
});
