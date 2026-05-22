const api = require('../../utils/api');

Page({
  data: {
    addresses: [],
    loading: false,
    loadError: false,
    selectMode: false,
    selectedProductId: null,
    showForm: false,
    editingAddress: null,
    formData: {
      name: '',
      phone: '',
      province: '',
      city: '',
      district: '',
      detail: '',
      isDefault: false
    },
    submitting: false
  },

  onLoad(options) {
    if (options.action === 'select') {
      this.setData({
        selectMode: true,
        selectedProductId: options.productId
      });
    }
  },

  onShow() {
    if (!this._checkLogin()) return;
    this.fetchAddresses();
  },

  // 登录守卫
  _checkLogin() {
    const token = wx.getStorageSync('token');
    if (!token) {
      wx.showModal({
        title: '请先登录',
        content: '登录后才能管理收货地址',
        confirmText: '去登录',
        cancelText: '返回',
        success: res => {
          if (res.confirm) {
            wx.navigateTo({ url: '/pages/login/login' });
          } else {
            wx.navigateBack();
          }
        }
      });
      return false;
    }
    return true;
  },

  fetchAddresses() {
    this.setData({ loading: true, loadError: false });
    return api.getAddresses().then(res => {
      const items = this.extractItems(res);
      this.setData({ addresses: items, loading: false });
    }).catch(err => {
      console.error('获取地址列表失败', err);
      this.setData({ loading: false, loadError: true });
    });
  },

  extractItems(res) {
    if (Array.isArray(res)) return res;
    if (res && Array.isArray(res.data)) return res.data;
    if (res && res.data && Array.isArray(res.data.items)) return res.data.items;
    return [];
  },

  onAddAddress() {
    this.setData({
      showForm: true,
      editingAddress: null,
      formData: { name: '', phone: '', province: '', city: '', district: '', detail: '', isDefault: false }
    });
  },

  onEditAddress(e) {
    const addr = e.currentTarget.dataset.address;
    this.setData({
      showForm: true,
      editingAddress: addr,
      formData: {
        name: addr.name || '',
        phone: addr.phone || '',
        province: addr.province || '',
        city: addr.city || '',
        district: addr.district || '',
        detail: addr.detail || '',
        isDefault: addr.isDefault || false
      }
    });
  },

  onDeleteAddress(e) {
    const id = e.currentTarget.dataset.id;
    wx.showModal({
      title: '删除地址',
      content: '确定要删除该地址吗？',
      confirmText: '删除',
      confirmColor: '#FF6B6B',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          api.deleteAddress(id).then(() => {
            wx.showToast({ title: '已删除', icon: 'success' });
            this.fetchAddresses();
          }).catch(() => {
            wx.showToast({ title: '删除失败', icon: 'none' });
          });
        }
      }
    });
  },

  onSelectAddress(e) {
    if (!this.data.selectMode) return;
    const addr = e.currentTarget.dataset.address;
    const productId = this.data.selectedProductId;

    wx.showModal({
      title: '确认下单',
      content: `收货地址：${addr.name} ${addr.phone}\n${addr.province} ${addr.city} ${addr.district} ${addr.detail}`,
      confirmText: '确认下单',
      success: (res) => {
        if (res.confirm) {
          wx.showLoading({ title: '提交中...' });
          api.createOrder({ productId: Number(productId), addressId: addr.id }).then(() => {
            wx.hideLoading();
            wx.showToast({ title: '下单成功', icon: 'success', duration: 1500 });
            setTimeout(() => { wx.navigateBack(); }, 1500);
          }).catch(err => {
            wx.hideLoading();
            console.error('下单失败', err);
            wx.showToast({ title: '下单失败，请重试', icon: 'none' });
          });
        }
      }
    });
  },

  onFormFieldInput(e) {
    const { field } = e.currentTarget.dataset;
    const update = {};
    update[`formData.${field}`] = e.detail.value;
    this.setData(update);
  },

  onFormDefaultChange(e) {
    this.setData({ 'formData.isDefault': e.detail.value });
  },

  onFormCancel() {
    this.setData({ showForm: false, editingAddress: null });
  },

  onFormSubmit() {
    const { formData, editingAddress, submitting } = this.data;
    if (submitting) return;

    if (!formData.name.trim()) { wx.showToast({ title: '请输入收货人姓名', icon: 'none' }); return; }
    if (!formData.phone.trim()) { wx.showToast({ title: '请输入手机号', icon: 'none' }); return; }
    if (!/^1[3-9]\d{9}$/.test(formData.phone.trim())) {
      wx.showToast({ title: '请输入正确的手机号', icon: 'none' }); return;
    }
    if (!formData.province.trim()) { wx.showToast({ title: '请输入省份', icon: 'none' }); return; }
    if (!formData.city.trim()) { wx.showToast({ title: '请输入城市', icon: 'none' }); return; }
    if (!formData.detail.trim()) { wx.showToast({ title: '请输入详细地址', icon: 'none' }); return; }

    const data = {
      name: formData.name.trim(),
      phone: formData.phone.trim(),
      province: formData.province.trim(),
      city: formData.city.trim(),
      district: formData.district.trim(),
      detail: formData.detail.trim(),
      isDefault: formData.isDefault
    };

    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    const request = editingAddress
      ? api.updateAddress(editingAddress.id, data)
      : api.createAddress(data);

    request.then(() => {
      wx.hideLoading();
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.setData({ showForm: false, editingAddress: null, submitting: false });
      this.fetchAddresses();
    }).catch(err => {
      wx.hideLoading();
      console.error('保存地址失败', err);
      wx.showToast({ title: '保存失败，请重试', icon: 'none' });
      this.setData({ submitting: false });
    });
  },

  onPullDownRefresh() {
    this.fetchAddresses()
      .then(() => wx.stopPullDownRefresh())
      .catch(() => wx.stopPullDownRefresh());
  }
});
