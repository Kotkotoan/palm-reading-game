import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serveStatic } from 'hono/cloudflare-workers'
import type { Bindings, ApostleType, PalmReading } from './types'

const app = new Hono<{ Bindings: Bindings }>()

// CORSの有効化
app.use('/api/*', cors())

// 静的ファイルの配信
app.use('/static/*', serveStatic({ root: './public' }))

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
    
    // 診断結果を保存（画像データは保存しない - 大きすぎるため）
    const readingResult = await DB.prepare(
      'INSERT INTO palm_readings (user_id, apostle_type_id, analysis_data, confidence_score) VALUES (?, ?, ?, ?) RETURNING id'
    ).bind(
      userId,
      analysisResult.apostleTypeId,
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
                        <div class="space-y-3">
                            <input type="file" id="palmImage" accept="image/*"
                                   class="input-field w-full px-6 py-4 rounded-2xl focus:outline-none">
                            <p class="text-sm text-gray-500 text-center">
                                <i class="fas fa-info-circle mr-1"></i>
                                Choose from camera or album
                            </p>
                        </div>
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
