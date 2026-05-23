const api = require('../../utils/api');

Page({
  data: {
    productId: '',
    loading: true,
    loadError: false,
    // 表单字段
    title: '',
    itemNo: '',
    price: '',
    description: '',
    isRecommend: false,
    isInStock: true,
    // 服务端已有图片
    serverImages: [],   // 文件名数组
    serverImageUrls: [], // 完整 URL 数组（用于展示）
    // 本地暂存的新图片（仅临时路径，未上传）
    localImages: [],     // 本地临时路径数组
    maxImages: 10,
    // 提交状态
    submitting: false,
    imageOperating: false
  },

  onLoad(options) {
    const id = options.id;
    if (!id) {
      wx.showToast({ title: '缺少产品ID', icon: 'none' });
      return;
    }
    this.setData({ productId: id });
    this.loadProductDetail(id);
  },

  loadProductDetail(id) {
    this.setData({ loading: true, loadError: false });
    api.getProduct(id).then(res => {
      const product = (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) ? res.data : res;
      const title = product.title || '';
      const itemNo = product.item_no || product.itemNo || '';
      const price = product.price != null ? String(product.price) : '';
      const description = product.description || '';
      const isRecommend = !!(product.is_recommend || product.isRecommend);
      const isInStock = product.is_in_stock !== false && product.isInStock !== false;

      const imagesRaw = product.images || '';
      let images = [];
      if (typeof imagesRaw === 'string' && imagesRaw.trim()) {
        images = imagesRaw.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      } else if (Array.isArray(imagesRaw)) {
        images = imagesRaw;
      }
      const imageUrls = images.map(function(fn) { return api.getImageUrl(fn) || api.DEFAULT_PRODUCT_IMAGE; });

      this.setData({
        title: title, itemNo: itemNo, price: price, description: description,
        isRecommend: isRecommend, isInStock: isInStock,
        serverImages: images, serverImageUrls: imageUrls,
        loading: false
      });
    }).catch(function(err) {
      console.error('加载产品详情失败', err);
      this.setData({ loading: false, loadError: true });
    }.bind(this));
  },

  refreshImages: function() {
    return api.getProduct(this.data.productId).then(function(res) {
      const product = (res.data && typeof res.data === 'object' && !Array.isArray(res.data)) ? res.data : res;
      const imagesRaw = product.images || '';
      let images = [];
      if (typeof imagesRaw === 'string' && imagesRaw.trim()) {
        images = imagesRaw.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      } else if (Array.isArray(imagesRaw)) {
        images = imagesRaw;
      }
      const imageUrls = images.map(function(fn) { return api.getImageUrl(fn) || api.DEFAULT_PRODUCT_IMAGE; });
      this.setData({ serverImages: images, serverImageUrls: imageUrls });
    }.bind(this));
  },

  // ========== 表单字段输入 ==========
  onTitleInput(e) { this.setData({ title: e.detail.value }); },
  onItemNoInput(e) { this.setData({ itemNo: e.detail.value }); },
  onPriceInput(e) { this.setData({ price: e.detail.value }); },
  onDescInput(e) { this.setData({ description: e.detail.value }); },
  onRecommendChange(e) { this.setData({ isRecommend: e.detail.value }); },
  onStockChange(e) { this.setData({ isInStock: e.detail.value }); },

  // ========== 图片选择（仅选图，暂存本地，不上传） ==========
  onChooseImage() {
    const totalImages = this.data.serverImages.length + this.data.localImages.length;
    const remain = this.data.maxImages - totalImages;
    if (remain <= 0) {
      wx.showToast({ title: '最多上传' + this.data.maxImages + '张图片', icon: 'none' });
      return;
    }

    wx.chooseMedia({
      count: remain,
      mediaType: ['image'],
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: (res) => {
        const tempFiles = res.tempFiles || [];
        if (tempFiles.length === 0) return;
        const newPaths = tempFiles.map(f => f.tempFilePath);
        this.setData({
          localImages: this.data.localImages.concat(newPaths)
        });
      }
    });
  },

  // ========== 删除本地暂存图片 ==========
  onDeleteLocalImage(e) {
    const index = e.currentTarget.dataset.index;
    const localImages = this.data.localImages.slice();
    localImages.splice(index, 1);
    this.setData({ localImages: localImages });
  },

  // ========== 删除服务端已有图片 ==========
  onDeleteServerImage(e) {
    const index = e.currentTarget.dataset.index;
    const fileName = this.data.serverImages[index];
    if (!fileName) return;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这张图片吗？',
      confirmText: '删除',
      confirmColor: '#FF4444',
      cancelText: '取消',
      success: (res) => {
        if (!res.confirm) return;
        this.setData({ imageOperating: true });
        wx.showLoading({ title: '删除中...' });

        api.deleteProductImages(this.data.productId, [fileName]).then(() => {
          wx.hideLoading();
          this.setData({ imageOperating: false });
          wx.showToast({ title: '删除成功', icon: 'success' });
          this.refreshImages();
        }).catch(err => {
          wx.hideLoading();
          this.setData({ imageOperating: false });
          const msg = (err.data && (err.data.detail || err.data.msg)) || '删除失败';
          wx.showToast({ title: msg, icon: 'none', duration: 2000 });
          console.error('删除图片失败', err);
        });
      }
    });
  },

  // ========== 图片加载失败回退 ==========
  onImageError(e) {
    const idx = e.currentTarget.dataset.idx;
    this.setData({ ['serverImageUrls[' + idx + ']']: '/static/images/default-product.png' });
  },

  // ========== 提交：先保存信息，再上传新图片 ==========
  onSubmit() {
    const d = this.data;
    if (d.submitting) return;
    if (!d.title.trim()) { wx.showToast({ title: '请输入产品名称', icon: 'none' }); return; }
    if (!d.itemNo.trim()) { wx.showToast({ title: '请输入货号', icon: 'none' }); return; }
    const priceNum = parseFloat(d.price);
    if (isNaN(priceNum) || priceNum <= 0) { wx.showToast({ title: '请输入有效价格', icon: 'none' }); return; }

    // 构建产品数据
    const productData = {
      title: d.title.trim(),
      item_no: d.itemNo.trim(),
      price: priceNum,
      is_recommend: d.isRecommend,
      is_in_stock: d.isInStock
    };
    if (d.description.trim()) productData.description = d.description.trim();

    // 根据是否有新图片选择不同的提交方式
    if (d.localImages.length > 0) {
      this._submitWithImages(productData);
    } else {
      this._submitInfoOnly(productData);
    }
  },

  // ========== 有新图片：先保存信息 → 再逐张上传图片 → 提交文件名 ==========
  _submitWithImages(productData) {
    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    // 第一步：保存产品基本信息
    api.updateProduct(this.data.productId, productData).then(() => {
      // 第二步：逐张上传图片
      return this._uploadLocalImages();
    }).then((fileNames) => {
      // 第三步：如果上传了文件名，调用添加图片接口
      if (fileNames && fileNames.length > 0) {
        return api.addProductImages(this.data.productId, fileNames);
      }
    }).then(() => {
      wx.hideLoading();
      this.setData({ submitting: false, localImages: [] });
      wx.showToast({ title: '保存成功', icon: 'success' });
      this.refreshImages();
    }).catch(err => {
      wx.hideLoading();
      this.setData({ submitting: false });
      this._handleError(err);
    });
  },

  // ========== 无新图片：纯 JSON 提交 ==========
  _submitInfoOnly(productData) {
    this.setData({ submitting: true });
    wx.showLoading({ title: '保存中...' });

    api.updateProduct(this.data.productId, productData).then(() => {
      wx.hideLoading();
      this.setData({ submitting: false });
      wx.showToast({ title: '保存成功', icon: 'success' });
    }).catch(err => {
      wx.hideLoading();
      this.setData({ submitting: false });
      this._handleError(err);
    });
  },

  // ========== 逐张上传本地暂存图片 ==========
  _uploadLocalImages() {
    const filePaths = this.data.localImages;
    if (filePaths.length === 0) return Promise.resolve([]);

    return new Promise((resolve, reject) => {
      const fileNames = [];
      let idx = 0;

      const uploadNext = () => {
        if (idx >= filePaths.length) {
          resolve(fileNames);
          return;
        }

        wx.showLoading({ title: '上传图片 ' + (idx + 1) + '/' + filePaths.length });
        api.uploadFile(filePaths[idx]).then(res => {
          const fileName = (res.data && res.data.file_name) || res.file_name || res.fileName || '';
          if (fileName) fileNames.push(fileName);
          idx++;
          uploadNext();
        }).catch(err => {
          console.error('上传图片失败', err);
          reject(err);
        });
      };

      uploadNext();
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
    let msg = '保存失败，请重试';
    if (err.data) {
      if (typeof err.data.detail === 'string') {
        msg = err.data.detail;
      } else if (Array.isArray(err.data.detail) && err.data.detail[0]) {
        const d = err.data.detail[0];
        msg = '字段 ' + ((d.loc || []).slice(-1)[0] || '') + ' 校验失败：' + (d.msg || '');
      } else if (err.data.message) {
        msg = err.data.message;
      } else if (err.data.msg) {
        msg = err.data.msg;
      }
    }
    wx.showToast({ title: msg, icon: 'none', duration: 2500 });
  },

  onRetryLoad() {
    if (this.data.productId) this.loadProductDetail(this.data.productId);
  }
});
