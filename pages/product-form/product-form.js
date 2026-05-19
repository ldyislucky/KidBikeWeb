const api = require('../../utils/api');

Page({
  data: {
    pageReady: false,
    productImage: '',
    title: '',
    itemNo: '',
    price: '',
    isRecommend: false,
    isInStock: true,
    submitting: false
  },

  onReady() {
    this.setData({ pageReady: true });
  },

  onChooseImage() {
    wx.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setData({ productImage: res.tempFilePaths[0] });
      }
    });
  },

  onTitleInput(e) {
    this.setData({ title: e.detail.value });
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

  onSubmit() {
    const { productImage, title, itemNo, price, isRecommend, isInStock, submitting } = this.data;

    if (submitting) return;

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

    const productData = {
      title: title.trim(),
      itemNo: itemNo.trim(),
      price: parseFloat(price),
      isRecommend,
      isInStock
    };

    this.setData({ submitting: true });
    wx.showLoading({ title: '提交中...' });

    const doCreate = (imageUrl) => {
      if (imageUrl) productData.image = imageUrl;
      api.createProduct(productData).then(() => {
        wx.hideLoading();
        wx.showToast({ title: '添加成功', icon: 'success', duration: 1500 });
        setTimeout(() => { wx.navigateBack(); }, 1500);
      }).catch(err => {
        wx.hideLoading();
        console.error('创建产品失败', err);
        wx.showToast({ title: '提交失败，请重试', icon: 'none' });
        this.setData({ submitting: false });
      });
    };

    if (productImage) {
      api.uploadFile(productImage).then(res => {
        const imageUrl = res.url || res.data || '';
        doCreate(imageUrl);
      }).catch(err => {
        console.error('上传图片失败', err);
        doCreate('');
      });
    } else {
      doCreate('');
    }
  }
});
