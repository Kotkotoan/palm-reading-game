# 十二使徒手相診断ゲーム 🤲✨

キリストの十二使徒をモチーフにした、手相写真から性格タイプを診断する楽しいWebアプリケーションです！

## 🎯 プロジェクト概要

**プロジェクト名**: 十二使徒手相診断ゲーム  
**目的**: 手のひら写真から、キリストの12使徒のどのタイプかを診断し、チームワークを形成する  
**コンセプト**: 手相分析とパーソナリティ診断を組み合わせた、エンターテインメント性の高いゲーム

## ✨ 主な機能

### 現在実装済みの機能

1. **手相写真アップロード** 📸
   - スマホカメラで手のひらを撮影
   - 画像プレビュー表示
   - Base64エンコードでサーバーに送信

2. **12使徒タイプ判定** 🎭
   - ペテロ（リーダー型）👑
   - ヨハネ（共感型）❤️
   - アンデレ（サポート型）🤝
   - ヤコブ（戦略型）🎯
   - フィリポ（探求型）🔍
   - バルトロマイ（創造型）🎨
   - マタイ（分析型）📊
   - トマス（慎重型）🛡️
   - ユダ・タダイ（調和型）☮️
   - シモン（情熱型）🔥
   - 小ヤコブ（忠実型）⭐
   - マティア（バランス型）⚖️

3. **診断結果表示** 📋
   - あなたのタイプと特徴
   - 性格・強み・相性の良いタイプ
   - 手相分析詳細（感情線、知能線、生命線、運命線）
   - 診断精度表示

4. **12使徒タイプ一覧** 📚
   - 全タイプの詳細説明
   - 各タイプの特徴と強み
   - 美しいカードUIで表示

5. **データ永続化** 💾
   - Cloudflare D1 SQLiteデータベース
   - ユーザー情報の保存
   - 診断結果の履歴管理
   - チームメンバー管理

### 今後実装予定の機能

- [ ] **AI画像分析の統合** - 実際の手相の特徴から診断（現在はランダム）
- [ ] **チーム自動形成** - バランスの取れたチーム編成アルゴリズム
- [ ] **チーム詳細ページ** - チームメンバーの相性分析
- [ ] **ソーシャル共有機能** - 診断結果をSNSでシェア
- [ ] **多言語対応** - 英語、韓国語などの対応
- [ ] **診断履歴** - 過去の診断結果の閲覧

## 🔗 公開URL

- **開発環境**: https://3000-icn33dzxs3u4bhodzvd6l-82b888ba.sandbox.novita.ai
- **本番環境**: （デプロイ後に追加）
- **GitHub**: （リポジトリ作成後に追加）

## 📊 主要なAPIエンドポイント

| パス | メソッド | 説明 | パラメータ |
|------|---------|------|-----------|
| `/` | GET | メインページ | - |
| `/api/init-db` | POST | データベース初期化 | - |
| `/api/apostle-types` | GET | 12使徒タイプ一覧取得 | - |
| `/api/analyze-palm` | POST | 手相分析・診断実行 | `userName`, `imageData` |
| `/api/user/:userId/reading` | GET | ユーザーの診断結果取得 | `userId` |
| `/api/create-team` | POST | チーム作成 | `teamName`, `userIds[]` |
| `/api/team/:teamId` | GET | チーム情報取得 | `teamId` |

## 🗄️ データアーキテクチャ

### データモデル

**Users（ユーザー）**
```sql
- id: INTEGER (Primary Key)
- name: TEXT
- email: TEXT (Optional)
- created_at: DATETIME
```

**ApostleTypes（使徒タイプマスター）**
```sql
- id: INTEGER (Primary Key)
- name_ja: TEXT (日本語名)
- name_en: TEXT (英語名)
- description: TEXT (説明)
- characteristics: TEXT (特徴)
- strengths: TEXT (強み)
- compatible_types: TEXT (相性の良いタイプ)
- icon: TEXT (絵文字アイコン)
```

**PalmReadings（診断結果）**
```sql
- id: INTEGER (Primary Key)
- user_id: INTEGER (Foreign Key)
- apostle_type_id: INTEGER (Foreign Key)
- palm_image_url: TEXT (手相画像)
- analysis_data: TEXT (JSON形式の分析データ)
- confidence_score: REAL (信頼度)
- created_at: DATETIME
```

**Teams（チーム）**
```sql
- id: INTEGER (Primary Key)
- name: TEXT
- created_at: DATETIME
```

**TeamMembers（チームメンバー）**
```sql
- id: INTEGER (Primary Key)
- team_id: INTEGER (Foreign Key)
- user_id: INTEGER (Foreign Key)
- apostle_type_id: INTEGER (Foreign Key)
- joined_at: DATETIME
```

### ストレージサービス

- **Cloudflare D1**: リレーショナルデータベース（SQLite）
  - ユーザー情報
  - 診断結果
  - チーム情報
  - 使徒タイプマスターデータ

### データフロー

```
1. ユーザーが手相写真をアップロード
   ↓
2. フロントエンドで画像をBase64エンコード
   ↓
3. POST /api/analyze-palm に送信
   ↓
4. バックエンドで画像分析（現在はランダム）
   ↓
5. ユーザーと診断結果をD1データベースに保存
   ↓
6. 使徒タイプ情報と共に結果を返却
   ↓
7. フロントエンドで診断結果を表示
```

## 💻 技術スタック

- **フロントエンド**:
  - HTML5
  - TailwindCSS（CDN）
  - Vanilla JavaScript
  - Axios（HTTP通信）
  - Font Awesome（アイコン）

- **バックエンド**:
  - Hono（軽量Webフレームワーク）
  - TypeScript
  - Cloudflare Workers
  - Cloudflare Pages

- **データベース**:
  - Cloudflare D1（SQLite）

- **開発ツール**:
  - Vite（ビルドツール）
  - Wrangler（Cloudflare CLI）
  - PM2（プロセス管理）
  - Git（バージョン管理）

## 🚀 デプロイ状況

- **プラットフォーム**: Cloudflare Pages
- **ステータス**: ✅ ローカル開発環境で動作中
- **最終更新日**: 2025-10-24

## 📝 使い方

### ユーザー向け

1. **名前を入力**: あなたの名前を入力してください
2. **手のひらを撮影**: スマホのカメラで手のひらを明るい場所で撮影
3. **診断ボタンをクリック**: 「診断する」ボタンを押して分析開始
4. **結果を確認**: あなたがどの使徒タイプか、特徴や強みを確認
5. **相性をチェック**: 相性の良いタイプを確認してチームを作ろう！

### 開発者向け

#### ローカル開発環境のセットアップ

```bash
# プロジェクトディレクトリに移動
cd /home/user/webapp

# 依存関係のインストール（既にインストール済み）
npm install

# データベースマイグレーション
npm run db:migrate:local

# ビルド
npm run build

# 開発サーバー起動（PM2使用）
pm2 start ecosystem.config.cjs

# または直接起動（開発のみ）
npm run dev:sandbox
```

#### 便利なコマンド

```bash
# ビルド
npm run build

# データベースマイグレーション（ローカル）
npm run db:migrate:local

# データベースマイグレーション（本番）
npm run db:migrate:prod

# データベースコンソール（ローカル）
npm run db:console:local

# ポートクリーンアップ
npm run clean-port

# サービステスト
npm run test

# 本番デプロイ
npm run deploy:prod
```

## 🎨 推奨される次のステップ

1. **AI画像分析の統合**
   - OpenAI Vision APIまたはGoogle Cloud Vision APIの統合
   - 手相の線（感情線、知能線など）の実際の検出
   - より精度の高い診断アルゴリズムの実装

2. **チーム機能の強化**
   - チーム自動編成アルゴリズムの実装
   - チーム相性スコアの計算
   - チーム詳細ページの作成

3. **UI/UXの改善**
   - アニメーション効果の追加
   - ローディング画面の改善
   - レスポンシブデザインの最適化

4. **ソーシャル機能**
   - Twitter/Facebook共有機能
   - 診断結果の画像生成
   - OGP設定

5. **本番デプロイ**
   - Cloudflare Pagesへのデプロイ
   - カスタムドメインの設定
   - 本番用D1データベースの作成

## 🎮 楽しみ方のヒント

- **友達と一緒に**: みんなで診断してチームを組もう！
- **相性チェック**: 相性の良いタイプを見つけて協力しよう
- **性格分析**: 自分の強みや特徴を再発見できます
- **チームビルディング**: 職場やサークルでアイスブレイクとして使えます

## 📄 ライセンス

このプロジェクトは個人利用・学習目的で作成されました。

## 🙏 謝辞

このプロジェクトは、キリストの十二使徒の多様な個性と、それぞれが持つ独自の役割からインスピレーションを得ています。

---

**楽しんでください！** 🎉
