const api = require('../../utils/api');

Page({
  data: {
    pageReady: false,
    // 图片相关（仅本地临时路径，不再预上传）
    productImage: '',        // 本地临时路径
    // 表单字段
    title: '',
    description: '',
    itemNo: '',
    price: '',
    isRecommend: false,
    isInStock: true,
    // 提交状态
    submitting: false
  },

  onReady() {
    this.setData({ pageReady: true });
  },

  // ========== 图片选择（仅选图，不上传） ==========
  onChooseImage() {
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({ productImage: tempFilePath });
      }
    });
  },

  // ========== 表单字段输入 ==========
  onTitleInput(e) {
    this.setData({ title: e.detail.value });
  },

  onDescriptionInput(e) {
    this.setData({ description: e.detail.value });
  },

  onItemNoInput(e) {
    this.setData({ itemNo: e.detail.value });
  },

  onPriceInput(e) {
    this.setData({ price: e.detail.value });
  },

  onRecommendChange(e) {
    this.setData({ isRecommend: e.detail.value });
  },

  onInStockChange(e) {
    this.setData({ isInStock: e.detail.value });
  },

  // ========== 提交 ==========
  onSubmit() {
    const { productImage, title, description, itemNo, price, isRecommend, isInStock, submitting } = this.data;

    if (submitting) return;

    // 表单校验
    if (!title.trim()) {
      wx.showToast({ title: '请输入产品名称', icon: 'none' });
      return;
    }
    if (!itemNo.trim()) {
      wx.showToast({ title: '请输入货号', icon: 'none' });
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      wx.showToast({ title: '请输入有效价格', icon: 'none' });
      return;
    }

    // 构建产品数据
    const productData = {
      title: title.trim(),
      item_no: itemNo.trim(),
      price: parseFloat(price),
      is_recommend: isRecommend,
      is_in_stock: isInStock
    };
    if (description.trim()) productData.description = description.trim();

    // 根据是否有图片选择不同的提交方式
    if (productImage) {
      // 有图片：一次性上传图片 + 产品数据
      this._submitWithFile(productImage, productData);
    } else {
      // 无图片：纯 JSON 提交
      this._submitWithoutFile(productData);
    }
  },

  // ========== 有图片：一次性上传 ==========
  _submitWithFile(filePath, productData) {
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    api.createProductWithFile(filePath, productData)
      .then(() => {
        wx.hideLoading();
        wx.showToast({ title: '添加成功', icon: 'success', duration: 1500 });
        setTimeout(() => { wx.navigateBack(); }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('创建产品失败', err);
        this._handleError(err);
        this.setData({ submitting: false });
      });
  },

  // ========== 无图片：纯 JSON 提交 ==========
  _submitWithoutFile(productData) {
    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    api.createProduct(productData)
      .then(() => {
        wx.hideLoading();
        wx.showToast({ title: '添加成功', icon: 'success', duration: 1500 });
        setTimeout(() => { wx.navigateBack(); }, 1500);
      })
      .catch(err => {
        wx.hideLoading();
        console.error('创建产品失败', err);
        this._handleError(err);
        this.setData({ submitting: false });
      });
  },

  // ========== 统一错误处理 ==========
  _handleError(err) {
    if (err.statusCode === 422 && err.data && err.data.detail) {
      const details = Array.isArray(err.data.detail) ? err.data.detail : [err.data.detail];
      details.forEach(d => {
        console.error('[422字段错误]', 'loc:', JSON.stringify(d.loc), 'msg:', d.msg, 'input:', JSON.stringify(d.input));
      });
    }
    let msg = '提交失败，请重试';
    if (err.data) {
      if (typeof err.data.detail === 'string') {
        msg = err.data.detail;
      } else if (Array.isArray(err.data.detail) && err.data.detail[0]) {
        const d = err.data.detail[0];
        msg = `字段 ${(d.loc || []).slice(-1)[0] || ''} 校验失败：${d.msg || ''}`;
      } else if (err.data.message) {
        msg = err.data.message;
      }
    }
    wx.showToast({ title: msg, icon: 'none', duration: 2500 });
  }
});
