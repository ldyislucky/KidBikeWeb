const BASE_URL = 'http://127.0.0.1:8000';

const request = (url, options = {}) => {
  return new Promise((resolve, reject) => {
    wx.request({
      url: BASE_URL + url,
      method: options.method || 'GET',
      data: options.data || {},
      header: {
        'Content-Type': 'application/json',
        ...options.header
      },
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

/**
 * 查询产品列表
 * @param {Object} params
 * @param {string} params.category    - all / recommended / inStock
 * @param {string} params.search      - 搜索关键词
 * @param {string} params.sortBy      - itemNo / updateTime / price
 * @param {string} params.sortOrder   - asc / desc
 * @param {number} params.priceMin    - 最低价格
 * @param {number} params.priceMax    - 最高价格
 * @param {string} params.timeRange   - 3m / 6m / 1y
 * @param {string} params.stockStatus - inStock / preOrder
 * @param {number} params.page        - 页码，默认 1
 * @param {number} params.pageSize    - 每页数量，默认 20
 */
const getProducts = (params = {}) => {
  console.log('产品列表查询请求发送');
  return request('/api/v1/products', { data: params });
};

/**
 * 查询单个产品详情
 */
const getProduct = (id) => {
  console.log('单个产品请求发送');
  return request(`/api/v1/products/${id}`);
};

module.exports = {
  BASE_URL,
  getProducts,
  getProduct
};
