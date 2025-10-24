import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings, ApostleType, PalmReading } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORSの有効化
app.use('/api/*', cors())

// 静的ファイルの配信
app.use('/static/*', serveStatic({ root: './public' }))

// データベース初期化（開発用）
app.post('/api/init-db', async (c) => {
  const { DB } = c.env;
  
  try {
    // マイグレーションを実行（本番ではwrangler d1 migrationsを使用）
    const migration = `
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS apostle_types (
        id INTEGER PRIMARY KEY,
        name_ja TEXT NOT NULL,
        name_en TEXT NOT NULL,
        description TEXT NOT NULL,
        characteristics TEXT NOT NULL,
        strengths TEXT NOT NULL,
        compatible_types TEXT NOT NULL,
        icon TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS palm_readings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        apostle_type_id INTEGER NOT NULL,
        palm_image_url TEXT,
        analysis_data TEXT,
        confidence_score REAL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (apostle_type_id) REFERENCES apostle_types(id)
      );

      CREATE TABLE IF NOT EXISTS teams (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        team_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        apostle_type_id INTEGER NOT NULL,
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (team_id) REFERENCES teams(id),
        FOREIGN KEY (user_id) REFERENCES users(id),
        FOREIGN KEY (apostle_type_id) REFERENCES apostle_types(id)
      );
    `;
    
    await DB.exec(migration);
    
    // 12使徒のマスターデータを挿入
    const apostles = [
      [1, 'ペテロ（リーダー型）', 'Peter - The Leader', '情熱的で決断力のあるリーダー。チームを引っ張る存在', '情熱的、決断力、行動力', 'リーダーシップ、即断即決、チームをまとめる力', '2,3,7', '👑'],
      [2, 'ヨハネ（共感型）', 'John - The Empath', '優しく思いやりのある愛の使徒。人の心を理解する', '優しい、思いやり、共感力', '感情理解、癒し、人間関係構築', '1,4,6', '❤️'],
      [3, 'アンデレ（サポート型）', 'Andrew - The Supporter', '献身的な縁の下の力持ち。他者を支える', '献身的、協力的、謙虚', 'サポート力、チームワーク、気配り', '1,5,8', '🤝'],
      [4, 'ヤコブ（戦略型）', 'James - The Strategist', '計画的で論理的な戦略家。物事を俯瞰する', '計画的、論理的、冷静', '戦略立案、分析力、問題解決', '2,6,9', '🎯'],
      [5, 'フィリポ（探求型）', 'Philip - The Explorer', '好奇心旺盛で学習欲の強い探求者', '好奇心、探究心、学習意欲', '情報収集、新発見、知識共有', '3,7,10', '🔍'],
      [6, 'バルトロマイ（創造型）', 'Bartholomew - The Creator', '芸術的で独創的なクリエイター', '創造的、芸術的、独創的', 'アイデア創出、デザイン、革新', '2,4,11', '🎨'],
      [7, 'マタイ（分析型）', 'Matthew - The Analyst', '細かく正確な分析者。詳細を見逃さない', '几帳面、正確、分析的', 'データ分析、正確性、品質管理', '1,5,12', '📊'],
      [8, 'トマス（慎重型）', 'Thomas - The Careful', '疑問を持ち確認する慎重派。リスク管理', '慎重、疑問、確認', 'リスク管理、検証、品質保証', '3,9,10', '🛡️'],
      [9, 'ユダ・タダイ（調和型）', 'Jude - The Harmonizer', '平和を愛する調和の使徒。仲裁役', '平和的、調和、仲裁', '調整力、バランス、紛争解決', '4,8,11', '☮️'],
      [10, 'シモン（情熱型）', 'Simon - The Passionate', '熱心でエネルギッシュな情熱家', '熱心、エネルギッシュ、熱意', '行動力、モチベーション、推進力', '5,8,12', '🔥'],
      [11, '小ヤコブ（忠実型）', 'James the Less - The Faithful', '誠実で真面目な忠実な使徒', '誠実、真面目、忠実', '信頼性、責任感、継続力', '6,9,12', '⭐'],
      [12, 'マティア（バランス型）', 'Matthias - The Balanced', '柔軟で適応力のあるバランサー', '柔軟、適応力、バランス', '調整力、多様性理解、統合', '7,10,11', '⚖️']
    ];
    
    for (const apostle of apostles) {
      await DB.prepare(
        'INSERT OR IGNORE INTO apostle_types (id, name_ja, name_en, description, characteristics, strengths, compatible_types, icon) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
      ).bind(...apostle).run();
    }
    
    return c.json({ success: true, message: 'Database initialized successfully' });
  } catch (error) {
    console.error('Database initialization error:', error);
    return c.json({ success: false, error: String(error) }, 500);
  }
});

// 12使徒タイプ一覧取得
app.get('/api/apostle-types', async (c) => {
  const { DB } = c.env;
  
  try {
    const { results } = await DB.prepare('SELECT * FROM apostle_types ORDER BY id').all();
    return c.json(results);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// 手相写真アップロード & 分析
app.post('/api/analyze-palm', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json();
    const { userName, imageData } = body;
    
    // ユーザー作成
    const userResult = await DB.prepare(
      'INSERT INTO users (name) VALUES (?) RETURNING id'
    ).bind(userName).first();
    
    const userId = userResult?.id as number;
    
    // 画像分析（簡易版 - 実際にはAI画像分析APIを使用）
    const analysisResult = await analyzePalmImage(imageData);
    
    // 診断結果を保存
    const readingResult = await DB.prepare(
      'INSERT INTO palm_readings (user_id, apostle_type_id, palm_image_url, analysis_data, confidence_score) VALUES (?, ?, ?, ?, ?) RETURNING id'
    ).bind(
      userId,
      analysisResult.apostleTypeId,
      imageData,
      JSON.stringify(analysisResult.details),
      analysisResult.confidence
    ).first();
    
    // 使徒タイプ情報を取得
    const apostleType = await DB.prepare(
      'SELECT * FROM apostle_types WHERE id = ?'
    ).bind(analysisResult.apostleTypeId).first();
    
    return c.json({
      userId,
      readingId: readingResult?.id,
      apostleType,
      confidence: analysisResult.confidence,
      analysisDetails: analysisResult.details
    });
  } catch (error) {
    console.error('Palm analysis error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// ユーザーの診断結果取得
app.get('/api/user/:userId/reading', async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('userId');
  
  try {
    const reading = await DB.prepare(`
      SELECT pr.*, at.* 
      FROM palm_readings pr
      JOIN apostle_types at ON pr.apostle_type_id = at.id
      WHERE pr.user_id = ?
      ORDER BY pr.created_at DESC
      LIMIT 1
    `).bind(userId).first();
    
    if (!reading) {
      return c.json({ error: 'Reading not found' }, 404);
    }
    
    return c.json(reading);
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// チーム形成API
app.post('/api/create-team', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json();
    const { teamName, userIds } = body;
    
    // チーム作成
    const teamResult = await DB.prepare(
      'INSERT INTO teams (name) VALUES (?) RETURNING id'
    ).bind(teamName).first();
    
    const teamId = teamResult?.id as number;
    
    // メンバー追加
    for (const userId of userIds) {
      const reading = await DB.prepare(
        'SELECT apostle_type_id FROM palm_readings WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
      ).bind(userId).first();
      
      if (reading) {
        await DB.prepare(
          'INSERT INTO team_members (team_id, user_id, apostle_type_id) VALUES (?, ?, ?)'
        ).bind(teamId, userId, reading.apostle_type_id).run();
      }
    }
    
    return c.json({ teamId, message: 'Team created successfully' });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// チーム情報取得
app.get('/api/team/:teamId', async (c) => {
  const { DB } = c.env;
  const teamId = c.req.param('teamId');
  
  try {
    const team = await DB.prepare('SELECT * FROM teams WHERE id = ?').bind(teamId).first();
    
    const members = await DB.prepare(`
      SELECT tm.*, u.name as user_name, at.*
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      JOIN apostle_types at ON tm.apostle_type_id = at.id
      WHERE tm.team_id = ?
    `).bind(teamId).all();
    
    return c.json({ team, members: members.results });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// 簡易的な手相分析ロジック（実際にはAI画像分析を使用）
async function analyzePalmImage(imageData: string) {
  // Base64画像データから特徴を抽出（簡易版）
  // 実際にはAI画像分析APIを使用してより正確な分析を行う
  
  // ランダムに使徒タイプを選択（デモ用）
  const apostleTypeId = Math.floor(Math.random() * 12) + 1;
  const confidence = 0.75 + Math.random() * 0.2; // 0.75-0.95の信頼度
  
  const details = {
    heart_line: '感情線が長く、感情豊か',
    head_line: '知能線が深く、思考力が高い',
    life_line: '生命線がしっかりしており、活力がある',
    fate_line: '運命線が明確で、目標に向かって進む力がある'
  };
  
  return {
    apostleTypeId,
    confidence,
    details
  };
}

// メインページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>The 12 Apostles Palm Reading ✨ - Discover Your Type!</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet">
        <style>
          * {
            font-family: 'Poppins', sans-serif;
          }
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            min-height: 100vh;
            position: relative;
            overflow-x: hidden;
          }
          
          /* アニメーション背景 */
          body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: 
              radial-gradient(circle at 20% 50%, rgba(255, 255, 255, 0.1) 0%, transparent 50%),
              radial-gradient(circle at 80% 80%, rgba(255, 255, 255, 0.1) 0%, transparent 50%);
            animation: pulse 8s ease-in-out infinite;
            pointer-events: none;
          }
          
          @keyframes pulse {
            0%, 100% { opacity: 0.5; }
            50% { opacity: 1; }
          }
          
          @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
          }
          
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(30px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .card {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.98);
            border-radius: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            border: 2px solid rgba(255, 255, 255, 0.5);
            animation: fadeInUp 0.8s ease-out;
          }
          
          .hero-title {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
            animation: fadeInUp 1s ease-out;
            text-shadow: 0 4px 20px rgba(102, 126, 234, 0.3);
          }
          
          .subtitle {
            animation: fadeInUp 1.2s ease-out;
          }
          
          .apostle-card {
            transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
            cursor: pointer;
            background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
            border: 2px solid transparent;
          }
          
          .apostle-card:hover {
            transform: translateY(-10px) scale(1.02);
            box-shadow: 0 20px 40px rgba(102, 126, 234, 0.3);
            border-color: #667eea;
          }
          
          .icon-float {
            animation: float 3s ease-in-out infinite;
          }
          
          #preview {
            max-width: 100%;
            max-height: 300px;
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
          }
          
          .loading {
            display: none;
          }
          
          .loading.active {
            display: flex;
          }
          
          .btn-primary {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
          }
          
          .btn-primary:hover {
            transform: translateY(-2px);
            box-shadow: 0 10px 30px rgba(102, 126, 234, 0.4);
          }
          
          .btn-primary::before {
            content: '';
            position: absolute;
            top: 50%;
            left: 50%;
            width: 0;
            height: 0;
            border-radius: 50%;
            background: rgba(255, 255, 255, 0.3);
            transform: translate(-50%, -50%);
            transition: width 0.6s, height 0.6s;
          }
          
          .btn-primary:hover::before {
            width: 300px;
            height: 300px;
          }
          
          .step-badge {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
          }
          
          .input-field {
            transition: all 0.3s ease;
            border: 2px solid #e5e7eb;
          }
          
          .input-field:focus {
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }
          
          .section-title {
            position: relative;
            display: inline-block;
          }
          
          .section-title::after {
            content: '';
            position: absolute;
            bottom: -8px;
            left: 50%;
            transform: translateX(-50%);
            width: 60%;
            height: 4px;
            background: linear-gradient(90deg, transparent, #667eea, transparent);
            border-radius: 2px;
          }
        </style>
    </head>
    <body>
        <div class="container mx-auto px-4 py-8">
            <!-- ヒーローセクション -->
            <div class="card p-8 md:p-12 max-w-4xl mx-auto mb-8">
                <div class="text-center mb-8">
                    <div class="icon-float text-7xl mb-6">✨🤲✨</div>
                    <h1 class="hero-title text-5xl md:text-6xl font-extrabold mb-4">
                        The 12 Apostles
                    </h1>
                    <h2 class="hero-title text-3xl md:text-4xl font-bold mb-6">
                        Palm Reading
                    </h2>
                    <p class="subtitle text-xl text-gray-600 mb-4 leading-relaxed">
                        Discover Your Divine Personality Type 🌟
                    </p>
                    <p class="text-gray-500 text-sm">
                        Upload your palm photo and find out which of the 12 Apostles you are!
                    </p>
                </div>

                <!-- ステップ1: 写真アップロード -->
                <div id="step1" class="mb-8">
                    <h2 class="text-2xl font-bold mb-6 text-center">
                        <span class="step-badge text-white rounded-full w-10 h-10 inline-flex items-center justify-center mr-3 text-lg">1</span>
                        <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                            Capture Your Palm
                        </span>
                    </h2>
                    <div class="mb-6">
                        <label class="block text-gray-700 mb-3 font-semibold text-lg">
                            <i class="fas fa-user mr-2 text-purple-500"></i>Your Name
                        </label>
                        <input type="text" id="userName" placeholder="Enter your name" 
                               class="input-field w-full px-6 py-4 rounded-2xl focus:outline-none text-lg">
                    </div>
                    <div class="mb-6">
                        <label class="block text-gray-700 mb-3 font-semibold text-lg">
                            <i class="fas fa-camera mr-2 text-purple-500"></i>Palm Photo
                        </label>
                        <input type="file" id="palmImage" accept="image/*" capture="environment"
                               class="input-field w-full px-6 py-4 rounded-2xl focus:outline-none">
                    </div>
                    <div id="previewContainer" class="mb-6 text-center hidden">
                        <img id="preview" alt="Preview">
                    </div>
                    <button id="analyzeBtn" class="btn-primary w-full text-white font-bold py-4 px-8 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed text-lg relative z-10">
                        <i class="fas fa-sparkles mr-2"></i>
                        Discover My Type
                    </button>
                </div>

                <!-- ローディング -->
                <div id="loading" class="loading flex-col items-center justify-center py-12">
                    <div class="animate-spin rounded-full h-20 w-20 border-b-4 border-purple-600 mb-6"></div>
                    <p class="text-purple-700 font-bold text-xl">Analyzing your palm...</p>
                    <p class="text-gray-500 text-sm mt-2">✨ Magic in progress ✨</p>
                </div>

                <!-- ステップ2: 診断結果 -->
                <div id="step2" class="hidden">
                    <h2 class="text-2xl font-bold mb-6 text-center">
                        <span class="step-badge text-white rounded-full w-10 h-10 inline-flex items-center justify-center mr-3 text-lg">2</span>
                        <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                            Your Divine Type
                        </span>
                    </h2>
                    <div id="result" class="text-center">
                        <!-- 結果がここに表示されます -->
                    </div>
                    <button id="resetBtn" class="w-full bg-gradient-to-r from-gray-600 to-gray-700 hover:from-gray-700 hover:to-gray-800 text-white font-bold py-4 px-8 rounded-2xl transition mt-8 text-lg">
                        <i class="fas fa-redo mr-2"></i>
                        Try Again
                    </button>
                </div>
            </div>

            <!-- 十二使徒タイプ一覧 -->
            <div class="card p-8 md:p-12 max-w-4xl mx-auto">
                <h2 class="section-title text-4xl font-extrabold text-center mb-4">
                    <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Meet The 12 Apostles
                    </span>
                </h2>
                <p class="text-center text-gray-500 mb-8 text-lg">
                    Discover all personality types 🌟
                </p>
                <div id="apostleTypes" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <!-- 使徒タイプがここに表示されます -->
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
