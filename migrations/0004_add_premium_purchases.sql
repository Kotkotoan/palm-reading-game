-- プレミアム購入履歴テーブル
CREATE TABLE IF NOT EXISTS premium_purchases (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  payment_method TEXT NOT NULL, -- 'stripe' or 'paypal'
  payment_id TEXT NOT NULL, -- Stripe/PayPal transaction ID
  amount INTEGER NOT NULL, -- 金額（セント単位）
  currency TEXT NOT NULL DEFAULT 'JPY',
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'completed', 'failed'
  purchased_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_premium_purchases_user_id ON premium_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_premium_purchases_payment_id ON premium_purchases(payment_id);
