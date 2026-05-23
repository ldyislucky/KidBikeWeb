const api = require('../../utils/api');

Page({
  data: {
    pageReady: false,
    // 图片相关
    productImage: '',        // 本地临时路径
    uploadedImageUrl: '',    // 已上传成功的远端 URL
    imageUploading: false,   // 正在上传图片
    imageUploadFailed: false,// 图片上传失败标记
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

  // ========== 图片选择 ==========
  onChooseImage() {
    if (this.data.imageUploading) return; // 上传中禁止重选
    wx.chooseMedia({
      count: 1,
      mediaType: ['image'],
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempFilePath = res.tempFiles[0].tempFilePath;
        this.setData({
          productImage: tempFilePath,
          uploadedImageUrl: '',
          imageUploadFailed: false
        });
        // 选图后立即上传，不等提交时再传
        this._uploadImage(tempFilePath);
      }
    });
  },

  // ========== 图片上传（预上传策略） ==========
  _uploadImage(filePath) {
    this.setData({ imageUploading: true, imageUploadFailed: false });
    wx.showLoading({ title: '图片上传中...' });

    api.uploadFile(filePath)
      .then(res => {
        wx.hideLoading();
        const url = res.url || res.data || '';
        this.setData({
          uploadedImageUrl: url,
          imageUploading: false,
          imageUploadFailed: false
        });
        wx.showToast({ title: '图片上传成功', icon: 'success', duration: 1200 });
      })
      .catch(err => {
        wx.hideLoading();
        console.error('图片上传失败', err);
        this.setData({
          imageUploading: false,
          imageUploadFailed: true,
          uploadedImageUrl: ''
        });
        // 提示用户可选择重试或跳过
        wx.showModal({
          title: '图片上传失败',
          content: '是否重新上传图片？选择"跳过"将不含图片提交。',
          confirmText: '重新上传',
          cancelText: '跳过',
          success: (modalRes) => {
            if (modalRes.confirm) {
              this._uploadImage(this.data.productImage);
            } else {
              // 跳过：清除失败标记，继续使用无图
              this.setData({ imageUploadFailed: false });
            }
          }
        });
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
    const {
      productImage, uploadedImageUrl, imageUploading, imageUploadFailed,
      title, description, itemNo, price,
      isRecommend, isInStock, submitting
    } = this.data;

    if (submitting) return;

    // 图片正在上传中，等待完成
    if (imageUploading) {
      wx.showToast({ title: '图片上传中，请稍候', icon: 'none' });
      return;
    }

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

    // 选了图片但上传失败，提示确认
    if (productImage && imageUploadFailed) {
      wx.showModal({
        title: '图片未上传成功',
        content: '当前图片未能上传，确认不含图片直接提交吗？',
        confirmText: '直接提交',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) this._doCreate('');
        }
      });
      return;
    }

    this._doCreate(uploadedImageUrl);
  },

  // ========== 实际调接口创建产品 ==========
  _doCreate(imageUrl) {
    const { title, description, itemNo, price, isRecommend, isInStock } = this.data;

    const productData = {
      title: title.trim(),
      item_no: itemNo.trim(),       // 后端 snake_case
      price: parseFloat(price),
      is_recommend: isRecommend,    // 后端 snake_case
      is_in_stock: isInStock        // 后端 snake_case
    };
    if (description.trim()) productData.description = description.trim();
    if (imageUrl) productData.image = imageUrl;

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
        // 422 时打印具体校验错误字段，方便调试
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
        this.setData({ submitting: false });
      });
  }
});
