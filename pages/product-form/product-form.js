Page({
  data: {
    pageReady: false,
    productImage: '',
    title: '',
    itemNo: '',
    price: '',
    isRecommend: false,
    isInStock: true
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
    const { productImage, title, itemNo, price, isRecommend, isInStock } = this.data;

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

    const now = new Date();
    const updateTime = now.getFullYear() + '-' +
      String(now.getMonth() + 1).padStart(2, '0') + '-' +
      String(now.getDate()).padStart(2, '0');

    const newProduct = {
      id: Date.now(),
      title: title.trim(),
      itemNo: itemNo.trim(),
      price: parseFloat(price),
      isRecommend,
      isInStock,
      updateTime,
      image: productImage || '/static/images/default-product.png'
    };

    let products = [];
    try {
      products = wx.getStorageSync('products') || [];
    } catch (e) {
      products = [];
    }
    products.unshift(newProduct);
    wx.setStorageSync('products', products);

    wx.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 1500
    });

    setTimeout(() => {
      wx.navigateBack();
    }, 1500);
  }
});
