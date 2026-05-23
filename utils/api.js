const BASE_URL = 'http://127.0.0.1:8000';

// 图片基础路径（后端 image 字段只存文件名，前端拼接完整 URL）
const IMAGE_BASE_URL = BASE_URL + '/static/uploads';

/**
 * 将后端返回的文件名拼接为完整图片 URL
 * @param {string} filename - 图片文件名，如 "abc123.jpg"
 * @returns {string} 完整 URL 或空字符串（无文件名时返回默认占位图路径）
 */
const getImageUrl = (filename) => {
  if (!filename || typeof filename !== 'string') return '';
  // 已经是完整 URL 则直接返回
  if (filename.startsWith('http://') || filename.startsWith('https://')) return filename;
  // 拼接基础路径 + URL 编码文件名（处理中文、空格等特殊字符）
  return IMAGE_BASE_URL + '/' + encodeURIComponent(filename);
};

// 默认占位图路径
const DEFAULT_PRODUCT_IMAGE = '/static/images/default-product.png';

const getToken = () => wx.getStorageSync('token') || '';

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const header = { 'Content-Type': 'application/json', ...options.header };
    if (token) header['Authorization'] = `Bearer ${token}`;

    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data || {},
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          resolve(res.data);
        } else {
          reject(res);
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
};

// ==================== Products ====================

const getProducts = (params = {}) => {
  return request('/api/v1/products', { data: params });
};

const getProduct = (id) => {
  return request(`/api/v1/products/${id}`);
};

const createProduct = (data) => {
  return request('/api/v1/products', { method: 'POST', data });
};

/**
 * 新增产品（含图片上传）
 * 使用 wx.uploadFile 一次性上传图片文件 + 产品 JSON 数据
 * 后端通过 multipart/form-data 同时接收文件和产品信息
 */
const createProductWithFile = (filePath, productData) => {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const header = {};
    if (token) header['Authorization'] = `Bearer ${token}`;

    wx.uploadFile({
      url: BASE_URL + '/api/v1/products',
      filePath,
      name: 'file',
      header,
      formData: {
        title: productData.title,
        item_no: productData.item_no,
        price: String(productData.price),
        is_recommend: String(productData.is_recommend),
        is_in_stock: String(productData.is_in_stock),
        ...(productData.description ? { description: productData.description } : {})
      },
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(res.data));
          } catch (e) {
            resolve(res.data);
          }
        } else {
          // 保留原始数据便于调试
          let parsed = res.data;
          try { parsed = JSON.parse(res.data); } catch (e) { /* ignore */ }
          reject({ ...res, data: parsed });
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
};

const updateProduct = (id, data) => {
  return request(`/api/v1/products/${id}`, { method: 'PUT', data });
};

const deleteProduct = (id) => {
  return request(`/api/v1/products/${id}`, { method: 'DELETE' });
};

// POST /api/v1/products/{id}/images — 添加图片到产品
const addProductImages = (id, fileNames) => {
  return request(`/api/v1/products/${id}/images`, { method: 'POST', data: { fileNames } });
};

// DELETE /api/v1/products/{id}/images — 删除产品图片
const deleteProductImages = (id, fileNames) => {
  return request(`/api/v1/products/${id}/images`, { method: 'DELETE', data: { fileNames } });
};

// ==================== Auth ====================

const wechatLogin = (code, avatarUrl, nickName) => {
  const data = { code };
  if (avatarUrl) data.avatarUrl = avatarUrl;
  if (nickName) data.nickName = nickName;
  return request('/api/v1/auth/login/wechat', { method: 'POST', data });
};

const register = (data) => {
  return request('/api/v1/auth/register', { method: 'POST', data });
};

const login = (data) => {
  return request('/api/v1/auth/login', { method: 'POST', data });
};

// ==================== Users ====================

const getUserInfo = () => {
  return request('/api/v1/users/me');
};

const updateUserInfo = (data) => {
  return request('/api/v1/users/me', { method: 'PUT', data });
};

// ==================== Orders ====================

const getOrders = (params = {}) => {
  return request('/api/v1/orders', { data: params });
};

const createOrder = (data) => {
  return request('/api/v1/orders', { method: 'POST', data });
};

const getOrder = (id) => {
  return request(`/api/v1/orders/${id}`);
};

// ==================== Favorites ====================

const getFavorites = (params = {}) => {
  return request('/api/v1/favorites', { data: params });
};

// 检查指定产品是否已收藏（GET /api/v1/favorites/check?product_id=xxx）
const checkFavorite = (productId) => {
  return request(`/api/v1/favorites/check?product_id=${productId}`);
};

const addFavorite = (productId) => {
  return request('/api/v1/favorites', { method: 'POST', data: { productId } });
};

const removeFavorite = (productId) => {
  return request(`/api/v1/favorites/${productId}`, { method: 'DELETE' });
};

// ==================== Wallet ====================

const getWallet = () => {
  return request('/api/v1/wallet');
};

const getTransactions = (params = {}) => {
  return request('/api/v1/wallet/transactions', { data: params });
};

// ==================== Addresses ====================

const getAddresses = () => {
  return request('/api/v1/addresses');
};

const createAddress = (data) => {
  return request('/api/v1/addresses', { method: 'POST', data });
};

const updateAddress = (id, data) => {
  return request(`/api/v1/addresses/${id}`, { method: 'PUT', data });
};

const deleteAddress = (id) => {
  return request(`/api/v1/addresses/${id}`, { method: 'DELETE' });
};

// ==================== Support ====================

const getSupportContact = () => {
  return request('/api/v1/support/contact');
};

const submitInquiry = (data) => {
  return request('/api/v1/support/inquiries', { method: 'POST', data });
};

const getAboutInfo = () => {
  return request('/api/v1/support/about');
};

// ==================== Files ====================

const uploadFile = (filePath) => {
  return new Promise((resolve, reject) => {
    const token = getToken();
    const header = {};
    if (token) header['Authorization'] = `Bearer ${token}`;

    wx.uploadFile({
      url: BASE_URL + '/api/v1/files/upload',
      filePath,
      name: 'file',
      header,
      success(res) {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            resolve(JSON.parse(res.data));
          } catch (e) {
            resolve(res.data);
          }
        } else {
          reject(res);
        }
      },
      fail(err) {
        reject(err);
      }
    });
  });
};

// ==================== Health ====================

const healthCheck = () => {
  return request('/api/v1/health');
};

module.exports = {
  BASE_URL,
  IMAGE_BASE_URL,
  getImageUrl,
  DEFAULT_PRODUCT_IMAGE,
  getProducts,
  getProduct,
  createProduct,
  createProductWithFile,
  updateProduct,
  deleteProduct,
  addProductImages,
  deleteProductImages,
  wechatLogin,
  register,
  login,
  getUserInfo,
  updateUserInfo,
  getOrders,
  createOrder,
  getOrder,
  getFavorites,
  checkFavorite,
  addFavorite,
  removeFavorite,
  getWallet,
  getTransactions,
  getAddresses,
  createAddress,
  updateAddress,
  deleteAddress,
  getSupportContact,
  submitInquiry,
  getAboutInfo,
  uploadFile,
  healthCheck
};
