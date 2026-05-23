-- ============================================================
-- KidBike 儿童自行车小程序数据库建表脚本
-- 适用 MySQL 5.7+ 或 MySQL 8.0
-- 字符集 utf8mb4，存储引擎 InnoDB
-- ============================================================

CREATE DATABASE IF NOT EXISTS kidbike
  DEFAULT CHARACTER SET utf8mb4
  DEFAULT COLLATE utf8mb4_unicode_ci;

USE kidbike;

-- ============================================================
-- 1. 用户表
-- ============================================================
CREATE TABLE `users` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '用户ID',
  `open_id` VARCHAR(64) NOT NULL COMMENT '微信OpenID',
  `nick_name` VARCHAR(50) NOT NULL COMMENT '昵称',
  `avatar_url` VARCHAR(500) DEFAULT NULL COMMENT '头像URL',
  `is_login` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否已认证',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_open_id` (`open_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表';

-- ============================================================
-- 2. 产品表
-- ============================================================
CREATE TABLE `products` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '产品ID',
  `title` VARCHAR(100) NOT NULL COMMENT '产品名称',
  `item_no` VARCHAR(50) NOT NULL COMMENT '货号',
  `price` DECIMAL(10,2) NOT NULL COMMENT '价格（元）',
  `image` VARCHAR(500) DEFAULT NULL COMMENT '主图URL',
  `images` JSON DEFAULT NULL COMMENT '多图URL数组（JSON格式）',
  `description` TEXT COMMENT '详细描述',
  `is_recommend` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否主推',
  `is_in_stock` TINYINT(1) NOT NULL DEFAULT 1 COMMENT '是否有现货（0=预售）',
  `category_id` BIGINT DEFAULT NULL COMMENT '分类ID（预留）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_item_no` (`item_no`),
  KEY `idx_is_recommend` (`is_recommend`),
  KEY `idx_is_in_stock` (`is_in_stock`),
  KEY `idx_price` (`price`),
  KEY `idx_updated_at` (`updated_at`),
  FULLTEXT KEY `ft_title_itemno` (`title`, `item_no`) /* 全文搜索，如需支持中文需要设置ngram */
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='产品表';

-- ============================================================
-- 3. 收货地址表
-- ============================================================
CREATE TABLE `addresses` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '地址ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `name` VARCHAR(30) NOT NULL COMMENT '收货人姓名',
  `phone` VARCHAR(20) NOT NULL COMMENT '手机号',
  `province` VARCHAR(50) NOT NULL COMMENT '省份',
  `city` VARCHAR(50) NOT NULL COMMENT '城市',
  `district` VARCHAR(50) NOT NULL COMMENT '区/县',
  `detail` VARCHAR(200) NOT NULL COMMENT '详细地址',
  `is_default` TINYINT(1) NOT NULL DEFAULT 0 COMMENT '是否默认地址',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_addresses_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收货地址表';

-- ============================================================
-- 4. 订单表（含地址快照，一个订单只包含一个产品）
-- ============================================================
CREATE TABLE `orders` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '订单ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `product_id` BIGINT NOT NULL COMMENT '产品ID',
  `quantity` INT NOT NULL DEFAULT 1 COMMENT '数量',
  `status` ENUM('pending','confirmed','shipped','delivered','cancelled') NOT NULL DEFAULT 'pending' COMMENT '订单状态',
  `total_amount` DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
  `recipient_name` VARCHAR(30) NOT NULL COMMENT '收货人姓名（快照）',
  `recipient_phone` VARCHAR(20) NOT NULL COMMENT '收货人手机号（快照）',
  `province` VARCHAR(50) NOT NULL COMMENT '省份（快照）',
  `city` VARCHAR(50) NOT NULL COMMENT '城市（快照）',
  `district` VARCHAR(50) NOT NULL COMMENT '区/县（快照）',
  `detail` VARCHAR(200) NOT NULL COMMENT '详细地址（快照）',
  `remark` VARCHAR(500) DEFAULT NULL COMMENT '用户备注',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  KEY `idx_user_id` (`user_id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_status` (`status`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_orders_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_orders_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='订单表';

-- ============================================================
-- 5. 收藏表
-- ============================================================
CREATE TABLE `favorites` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '收藏ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `product_id` BIGINT NOT NULL COMMENT '产品ID',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '收藏时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_product` (`user_id`, `product_id`),
  KEY `idx_product_id` (`product_id`),
  CONSTRAINT `fk_favorites_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_favorites_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='收藏表';

-- ============================================================
-- 6. 钱包表（一个用户一条记录）
-- ============================================================
CREATE TABLE `wallets` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '钱包ID',
  `user_id` BIGINT NOT NULL COMMENT '用户ID',
  `balance` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '当前余额',
  `total_recharged` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计充值金额',
  `total_spent` DECIMAL(12,2) NOT NULL DEFAULT 0.00 COMMENT '累计消费金额',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
  `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_user_id` (`user_id`),
  CONSTRAINT `fk_wallets_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包表';

-- ============================================================
-- 7. 钱包交易流水表
-- ============================================================
CREATE TABLE `wallet_transactions` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '交易ID',
  `wallet_id` BIGINT NOT NULL COMMENT '钱包ID',
  `type` ENUM('recharge','payment','refund') NOT NULL COMMENT '交易类型',
  `amount` DECIMAL(12,2) NOT NULL COMMENT '金额（充值和退款为正，消费为负）',
  `balance_after` DECIMAL(12,2) NOT NULL COMMENT '交易后余额',
  `order_id` BIGINT DEFAULT NULL COMMENT '关联订单ID',
  `description` VARCHAR(255) DEFAULT NULL COMMENT '交易描述',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '交易时间',
  PRIMARY KEY (`id`),
  KEY `idx_wallet_id` (`wallet_id`),
  KEY `idx_order_id` (`order_id`),
  KEY `idx_created_at` (`created_at`),
  CONSTRAINT `fk_transactions_wallet` FOREIGN KEY (`wallet_id`) REFERENCES `wallets` (`id`) ON DELETE CASCADE,
  CONSTRAINT `fk_transactions_order` FOREIGN KEY (`order_id`) REFERENCES `orders` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='钱包交易流水表';

-- ============================================================
-- 8. 咨询/反馈表
-- ============================================================
CREATE TABLE `inquiries` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '咨询ID',
  `contact` VARCHAR(100) DEFAULT NULL COMMENT '联系方式',
  `content` TEXT NOT NULL COMMENT '咨询内容',
  `product_id` BIGINT DEFAULT NULL COMMENT '关联产品ID',
  `user_id` BIGINT DEFAULT NULL COMMENT '关联用户ID（若已登录）',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '提交时间',
  PRIMARY KEY (`id`),
  KEY `idx_product_id` (`product_id`),
  KEY `idx_user_id` (`user_id`),
  CONSTRAINT `fk_inquiries_product` FOREIGN KEY (`product_id`) REFERENCES `products` (`id`) ON DELETE SET NULL,
  CONSTRAINT `fk_inquiries_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='咨询/反馈表';


-- ============================================================
-- 9. 变更记录
-- ============================================================
-- 1. 添加手机号字段（唯一，但可空——微信用户暂不绑定手机）
ALTER TABLE `users`
  ADD COLUMN `phone` VARCHAR(11) NULL COMMENT '手机号' AFTER `open_id`,
  ADD UNIQUE KEY `uk_phone` (`phone`);

-- 2. 添加密码哈希字段（可空——微信用户无密码）
ALTER TABLE `users`
  ADD COLUMN `password_hash` VARCHAR(255) NULL COMMENT '密码哈希' AFTER `phone`;

-- 3. 将 open_id 改为可空（手机号注册用户不通过微信登录）
ALTER TABLE `users`
  MODIFY COLUMN `open_id` VARCHAR(64) NULL COMMENT '微信OpenID';

--4. 添加角色字段（用于管理员权限控制）
  ALTER TABLE `users`
  ADD COLUMN `role` VARCHAR(20) NOT NULL DEFAULT 'user' COMMENT '角色：user=普通用户, admin=管理员' AFTER `password_hash`;

