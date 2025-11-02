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
    
    // チームコード生成（ランダム6桁）
    const teamCode = 'TEAM-' + Math.random().toString(36).substring(2, 8).toUpperCase();
    
    // チーム作成
    const teamResult = await DB.prepare(
      'INSERT INTO teams (name, team_code) VALUES (?, ?) RETURNING id'
    ).bind(teamName, teamCode).first();
    
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
    
    return c.json({ teamId, teamCode, message: 'Team created successfully' });
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

// チーム自動形成API - 待機中のユーザーとマッチング
app.post('/api/auto-match', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json();
    const { userId } = body;
    
    // 自分の使徒タイプを取得
    const myReading = await DB.prepare(
      'SELECT apostle_type_id FROM palm_readings WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first();
    
    if (!myReading) {
      return c.json({ error: 'Reading not found' }, 404);
    }
    
    const myTypeId = myReading.apostle_type_id as number;
    
    // 既にチームに所属していないユーザーを取得（自分を除く）
    const availableUsers = await DB.prepare(`
      SELECT DISTINCT pr.user_id, pr.apostle_type_id, u.name as user_name, at.name_en, at.icon
      FROM palm_readings pr
      JOIN users u ON pr.user_id = u.id
      JOIN apostle_types at ON pr.apostle_type_id = at.id
      LEFT JOIN team_members tm ON pr.user_id = tm.user_id
      WHERE pr.user_id != ? 
      AND tm.user_id IS NULL
      AND pr.id IN (
        SELECT MAX(id) FROM palm_readings GROUP BY user_id
      )
      ORDER BY pr.created_at DESC
      LIMIT 50
    `).bind(userId).all();
    
    if (!availableUsers.results || availableUsers.results.length === 0) {
      return c.json({ 
        matched: false, 
        message: 'No available users for matching. Be the first to wait!' 
      });
    }
    
    // バランススコア計算関数
    const calculateTeamBalance = (typeIds: number[]) => {
      const typeCounts = new Map<number, number>();
      typeIds.forEach(id => typeCounts.set(id, (typeCounts.get(id) || 0) + 1));
      
      // 多様性スコア（異なるタイプが多いほど高い）
      const diversityScore = typeCounts.size / 12;
      
      // バランススコア（均等に分散しているほど高い）
      const maxCount = Math.max(...Array.from(typeCounts.values()));
      const balanceScore = 1 - (maxCount / typeIds.length);
      
      return diversityScore * 0.6 + balanceScore * 0.4;
    };
    
    // 最適なチームメンバーを選択（11人まで、合計12人のチーム）
    const teamSize = Math.min(11, availableUsers.results.length);
    const selectedMembers: any[] = [];
    const typeIds = [myTypeId];
    
    // 貪欲法でバランスの良いメンバーを選択
    for (let i = 0; i < teamSize && i < availableUsers.results.length; i++) {
      let bestMember = null;
      let bestScore = -1;
      
      for (const user of availableUsers.results) {
        if (selectedMembers.find(m => m.user_id === user.user_id)) continue;
        
        const testTypeIds = [...typeIds, user.apostle_type_id as number];
        const score = calculateTeamBalance(testTypeIds);
        
        if (score > bestScore) {
          bestScore = score;
          bestMember = user;
        }
      }
      
      if (bestMember) {
        selectedMembers.push(bestMember);
        typeIds.push(bestMember.apostle_type_id as number);
      }
    }
    
    // チームを自動作成
    const teamName = `Team of the Divine ${new Date().toISOString().split('T')[0]}`;
    const teamResult = await DB.prepare(
      'INSERT INTO teams (name) VALUES (?) RETURNING id'
    ).bind(teamName).first();
    
    const teamId = teamResult?.id as number;
    
    // 自分を追加
    await DB.prepare(
      'INSERT INTO team_members (team_id, user_id, apostle_type_id) VALUES (?, ?, ?)'
    ).bind(teamId, userId, myTypeId).run();
    
    // 選ばれたメンバーを追加
    for (const member of selectedMembers) {
      await DB.prepare(
        'INSERT INTO team_members (team_id, user_id, apostle_type_id) VALUES (?, ?, ?)'
      ).bind(teamId, member.user_id, member.apostle_type_id).run();
    }
    
    const finalScore = calculateTeamBalance(typeIds);
    
    return c.json({ 
      matched: true,
      teamId,
      teamName,
      memberCount: selectedMembers.length + 1,
      balanceScore: (finalScore * 100).toFixed(1),
      members: selectedMembers
    });
  } catch (error) {
    console.error('Auto-match error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// チームコードで参加
app.post('/api/join-team', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json();
    const { teamCode, userId } = body;
    
    // チームコードでチームを検索
    const team = await DB.prepare(
      'SELECT id, name FROM teams WHERE team_code = ?'
    ).bind(teamCode).first();
    
    if (!team) {
      return c.json({ error: 'Team not found with this code' }, 404);
    }
    
    const teamId = team.id as number;
    
    // ユーザーの使徒タイプを取得
    const reading = await DB.prepare(
      'SELECT apostle_type_id FROM palm_readings WHERE user_id = ? ORDER BY created_at DESC LIMIT 1'
    ).bind(userId).first();
    
    if (!reading) {
      return c.json({ error: 'User reading not found' }, 404);
    }
    
    // 既にチームメンバーかチェック
    const existingMember = await DB.prepare(
      'SELECT id FROM team_members WHERE team_id = ? AND user_id = ?'
    ).bind(teamId, userId).first();
    
    if (existingMember) {
      return c.json({ error: 'Already a member of this team' }, 400);
    }
    
    // チームに参加
    await DB.prepare(
      'INSERT INTO team_members (team_id, user_id, apostle_type_id) VALUES (?, ?, ?)'
    ).bind(teamId, userId, reading.apostle_type_id).run();
    
    return c.json({ 
      teamId, 
      teamName: team.name,
      message: 'Successfully joined team' 
    });
  } catch (error) {
    console.error('Join team error:', error);
    return c.json({ error: String(error) }, 500);
  }
});

// プレミアムステータス確認
app.get('/api/check-premium/:userId', async (c) => {
  const { DB } = c.env;
  const userId = c.req.param('userId');
  
  try {
    const purchase = await DB.prepare(
      'SELECT id FROM premium_purchases WHERE user_id = ? AND status = ? LIMIT 1'
    ).bind(userId, 'completed').first();
    
    return c.json({ isPremium: !!purchase });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// Stripe Checkout セッション作成（デモ用 - 実際はStripe APIキーが必要）
app.post('/api/create-checkout-session', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json();
    const { userId } = body;
    
    // 注意: 実際の実装ではStripe APIを使用
    // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
    // const session = await stripe.checkout.sessions.create({...});
    
    // デモ用: 決済ページのシミュレーション
    const purchaseId = Date.now();
    
    // 購入レコード作成（pending状態）
    await DB.prepare(
      'INSERT INTO premium_purchases (user_id, payment_method, payment_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, 'stripe', `demo_${purchaseId}`, 500, 'JPY', 'pending').run();
    
    // デモ用: 即座に完了状態にする（本番では webhook で処理）
    await DB.prepare(
      'UPDATE premium_purchases SET status = ? WHERE payment_id = ?'
    ).bind('completed', `demo_${purchaseId}`).run();
    
    return c.json({ 
      checkoutUrl: `/payment-success?session_id=demo_${purchaseId}&user_id=${userId}`,
      message: 'Demo: Payment would be processed via Stripe'
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// PayPal注文作成（デモ用 - 実際はPayPal APIが必要）
app.post('/api/create-paypal-order', async (c) => {
  const { DB } = c.env;
  
  try {
    const body = await c.req.json();
    const { userId } = body;
    
    // 注意: 実際の実装ではPayPal APIを使用
    // const paypal = require('@paypal/checkout-server-sdk');
    
    // デモ用
    const purchaseId = Date.now();
    
    // 購入レコード作成（pending状態）
    await DB.prepare(
      'INSERT INTO premium_purchases (user_id, payment_method, payment_id, amount, currency, status) VALUES (?, ?, ?, ?, ?, ?)'
    ).bind(userId, 'paypal', `demo_pp_${purchaseId}`, 5, 'USD', 'pending').run();
    
    // デモ用: 即座に完了状態にする
    await DB.prepare(
      'UPDATE premium_purchases SET status = ? WHERE payment_id = ?'
    ).bind('completed', `demo_pp_${purchaseId}`).run();
    
    return c.json({ 
      approvalUrl: `/payment-success?order_id=demo_pp_${purchaseId}&user_id=${userId}`,
      message: 'Demo: Payment would be processed via PayPal'
    });
  } catch (error) {
    return c.json({ error: String(error) }, 500);
  }
});

// 仕事の相性データ取得
app.get('/api/work-compatibility/:typeId', async (c) => {
  const typeId = parseInt(c.req.param('typeId'));
  
  // デモ用の仕事相性データ
  const workCompatibilityData: Record<number, any> = {
    1: { // Peter - Leader
      compatibleBoss: 'ビジョンを持ち、自主性を尊重する上司。戦略型（ヤコブ）や分析型（マタイ）との相性が良い。',
      compatibleSubordinate: 'サポート型（アンデレ）や共感型（ヨハネ）など、チームワークを重視するメンバー。',
      companyCulture: '革新的で挑戦を奨励する文化。スタートアップや成長企業に向いている。',
      recommendedIndustries: 'テクノロジー、コンサルティング、プロジェクトマネジメント、起業家'
    },
    2: { // John - Empath
      compatibleBoss: '人間関係を大切にし、メンバーの成長を支援する上司。リーダー型（ペテロ）や調和型（ユダ）。',
      compatibleSubordinate: '多様なタイプと相性が良いが、特に創造型（バルトロマイ）や探求型（フィリポ）。',
      companyCulture: '協調性と共感を重視する文化。人材育成や社会貢献に力を入れる企業。',
      recommendedIndustries: 'カウンセリング、人事、教育、医療、NPO・NGO'
    },
    3: { // Andrew - Supporter
      compatibleBoss: 'チームワークを重視し、サポートを評価する上司。リーダー型（ペテロ）や戦略型（ヤコブ）。',
      compatibleSubordinate: '探求型（フィリポ）や慎重型（トマス）など、細部に注意を払うメンバー。',
      companyCulture: 'チームワークと相互支援を重視する文化。安定した組織や協同組合。',
      recommendedIndustries: 'サポート業務、アシスタント、事務、顧客サービス、チームコーディネーター'
    },
    4: { // James - Strategist
      compatibleBoss: '論理的で目標志向の上司。分析型（マタイ）や慎重型（トマス）との相性が良い。',
      compatibleSubordinate: '共感型（ヨハネ）やバランス型（マティア）など、異なる視点を持つメンバー。',
      companyCulture: '戦略的思考とデータ駆動を重視する文化。コンサルティングファームや金融機関。',
      recommendedIndustries: '戦略コンサルティング、金融、経営企画、ビジネスアナリスト'
    },
    5: { // Philip - Explorer
      compatibleBoss: '学習と成長を奨励する上司。創造型（バルトロマイ）や分析型（マタイ）。',
      compatibleSubordinate: 'サポート型（アンデレ）や情熱型（シモン）など、実行力のあるメンバー。',
      companyCulture: 'イノベーションと学習を重視する文化。研究機関やテクノロジー企業。',
      recommendedIndustries: '研究開発、データサイエンス、マーケティングリサーチ、教育'
    },
    6: { // Bartholomew - Creator
      compatibleBoss: '創造性を尊重し、自由度の高い上司。共感型（ヨハネ）や戦略型（ヤコブ）。',
      compatibleSubordinate: '調和型（ユダ）やバランス型（マティア）など、実現をサポートするメンバー。',
      companyCulture: 'クリエイティビティと革新を重視する文化。広告代理店やデザインスタジオ。',
      recommendedIndustries: 'デザイン、広告、マーケティング、アート、製品開発'
    },
    7: { // Matthew - Analyst
      compatibleBoss: '品質と正確性を重視する上司。リーダー型（ペテロ）や戦略型（ヤコブ）。',
      compatibleSubordinate: '探求型（フィリポ）やバランス型（マティア）など、データを扱うメンバー。',
      companyCulture: '正確性と品質管理を重視する文化。製造業や金融機関。',
      recommendedIndustries: 'データ分析、会計、品質管理、監査、研究'
    },
    8: { // Thomas - Careful
      compatibleBoss: 'リスク管理を重視する上司。サポート型（アンデレ）や調和型（ユダ）。',
      compatibleSubordinate: '情熱型（シモン）や探求型（フィリポ）など、行動力のあるメンバーをバランス。',
      companyCulture: '慎重さと安全性を重視する文化。医療機関や規制産業。',
      recommendedIndustries: 'リスク管理、コンプライアンス、品質保証、セキュリティ'
    },
    9: { // Jude - Harmonizer
      compatibleBoss: 'バランスと調和を重視する上司。戦略型（ヤコブ）や慎重型（トマス）。',
      compatibleSubordinate: '創造型（バルトロマイ）や忠実型（小ヤコブ）など、多様なメンバーを統合。',
      companyCulture: 'ダイバーシティと調和を重視する文化。グローバル企業や多国籍組織。',
      recommendedIndustries: '人事、組織開発、調停、外交、プロジェクト調整'
    },
    10: { // Simon - Passionate
      compatibleBoss: '熱意と行動力を評価する上司。探求型（フィリポ）や慎重型（トマス）がバランスを取る。',
      compatibleSubordinate: 'バランス型（マティア）や忠実型（小ヤコブ）など、安定をもたらすメンバー。',
      companyCulture: 'エネルギッシュで挑戦的な文化。スポーツ産業やベンチャー企業。',
      recommendedIndustries: '営業、マーケティング、起業、イベント企画、スポーツ'
    },
    11: { // James the Less - Faithful
      compatibleBoss: '信頼と継続性を重視する上司。創造型（バルトロマイ）や調和型（ユダ）。',
      compatibleSubordinate: 'バランス型（マティア）や慎重型（トマス）など、安定志向のメンバー。',
      companyCulture: '伝統と信頼を重視する文化。老舗企業や公共機関。',
      recommendedIndustries: '管理業務、公務員、銀行、保険、継続性が求められる職種'
    },
    12: { // Matthias - Balanced
      compatibleBoss: '柔軟性と適応力を評価する上司。分析型（マタイ）や情熱型（シモン）。',
      compatibleSubordinate: 'すべてのタイプと相性が良く、橋渡し役として機能。',
      companyCulture: '多様性と適応性を重視する文化。コンサルティングやプロジェクトベース企業。',
      recommendedIndustries: 'プロジェクトマネジメント、コンサルティング、人材配置、ファシリテーター'
    }
  };
  
  const data = workCompatibilityData[typeId] || {
    compatibleBoss: 'あなたのタイプに合った上司の情報を準備中です。',
    compatibleSubordinate: 'あなたのタイプに合った部下の情報を準備中です。',
    companyCulture: 'あなたのタイプに合った会社文化の情報を準備中です。',
    recommendedIndustries: 'あなたのタイプに合った業種・職種の情報を準備中です。'
  };
  
  return c.json(data);
});

// 決済成功ページ
app.get('/payment-success', (c) => {
  const sessionId = c.req.query('session_id') || c.req.query('order_id');
  const userId = c.req.query('user_id');
  
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Payment Success</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <style>
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            min-height: 100vh;
          }
        </style>
    </head>
    <body class="flex items-center justify-center p-4">
        <div class="bg-white rounded-3xl p-8 md:p-12 max-w-md w-full text-center shadow-2xl">
            <div class="text-6xl mb-6">🎉</div>
            <h1 class="text-3xl font-extrabold mb-4">
                <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    購入完了！
                </span>
            </h1>
            <p class="text-gray-600 mb-6 leading-relaxed">
                プレミアム版へのアップグレードが完了しました。<br>
                詳細な分析とキャリアアドバイスをお楽しみください！
            </p>
            <a href="/?user_id=${userId}" class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 px-8 rounded-xl transition transform hover:scale-105 inline-block">
                <i class="fas fa-home mr-2"></i>
                診断結果に戻る
            </a>
            <p class="text-xs text-gray-400 mt-6">
                Transaction ID: ${sessionId}
            </p>
        </div>
    </body>
    </html>
  `);
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

// チーム詳細ページ
app.get('/team/:teamId', async (c) => {
  const { DB } = c.env;
  const teamId = c.req.param('teamId');
  
  try {
    // チーム情報とメンバーを取得
    const team = await DB.prepare('SELECT * FROM teams WHERE id = ?').bind(teamId).first();
    
    if (!team) {
      return c.html('<h1>Team not found</h1>', 404);
    }
    
    const members = await DB.prepare(`
      SELECT tm.*, u.name as user_name, at.*
      FROM team_members tm
      JOIN users u ON tm.user_id = u.id
      JOIN apostle_types at ON tm.apostle_type_id = at.id
      WHERE tm.team_id = ?
      ORDER BY tm.joined_at
    `).bind(teamId).all();
    
    // タイプごとのカウント
    const typeCounts = new Map<number, number>();
    members.results.forEach((m: any) => {
      const count = typeCounts.get(m.apostle_type_id) || 0;
      typeCounts.set(m.apostle_type_id, count + 1);
    });
    
    const diversityScore = ((typeCounts.size / 12) * 100).toFixed(1);
    
    // メンバーのHTMLを生成
    const membersHTML = members.results.map((member: any) => `
      <div class="apostle-card p-5 rounded-2xl shadow-lg border-2 border-purple-200">
        <div class="text-5xl text-center mb-3 icon-float">${member.icon}</div>
        <h3 class="text-lg font-bold text-center mb-2">
          <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
            ${member.user_name}
          </span>
        </h3>
        <p class="text-sm text-gray-600 text-center font-semibold mb-2">
          ${member.name_en.split(' - ')[0]}
        </p>
        <p class="text-xs text-gray-500 text-center">
          ${member.name_en.split(' - ')[1] || ''}
        </p>
      </div>
    `).join('');
    
    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Team: ${team.name} - The 12 Apostles</title>
          <script src="https://cdn.tailwindcss.com"></script>
          <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
          <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700;800&display=swap" rel="stylesheet">
          <style>
            * { font-family: 'Poppins', sans-serif; }
            body {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
              min-height: 100vh;
            }
            .card {
              backdrop-filter: blur(20px);
              background: rgba(255, 255, 255, 0.98);
              border-radius: 30px;
              box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            }
            .apostle-card {
              transition: all 0.4s ease;
              background: linear-gradient(135deg, #ffffff 0%, #f8f9ff 100%);
            }
            .apostle-card:hover {
              transform: translateY(-5px) scale(1.02);
              box-shadow: 0 12px 24px rgba(102, 126, 234, 0.3);
            }
            @keyframes float {
              0%, 100% { transform: translateY(0px); }
              50% { transform: translateY(-10px); }
            }
            .icon-float { animation: float 3s ease-in-out infinite; }
          </style>
      </head>
      <body>
          <div class="container mx-auto px-4 py-8">
              <div class="card p-8 md:p-12 max-w-6xl mx-auto">
                  <!-- ヘッダー -->
                  <div class="text-center mb-8">
                      <div class="text-6xl mb-4">👥✨</div>
                      <h1 class="text-4xl font-extrabold mb-3">
                          <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                              ${team.name}
                          </span>
                      </h1>
                      <p class="text-gray-600 text-lg">A Divine Team of ${members.results.length} Apostles</p>
                      ${team.team_code ? `
                      <div class="mt-4 inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-lg shadow-lg">
                          <i class="fas fa-key mr-2"></i>
                          Team Code: ${team.team_code}
                      </div>
                      <p class="text-sm text-gray-500 mt-2">Share this code to invite more members!</p>
                      ` : ''}
                  </div>
                  
                  <!-- チーム統計 -->
                  <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                      <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl text-center">
                          <div class="text-3xl font-bold text-purple-600">${members.results.length}</div>
                          <div class="text-gray-600 font-semibold">Total Members</div>
                      </div>
                      <div class="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl text-center">
                          <div class="text-3xl font-bold text-blue-600">${typeCounts.size}</div>
                          <div class="text-gray-600 font-semibold">Unique Types</div>
                      </div>
                      <div class="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-2xl text-center">
                          <div class="text-3xl font-bold text-green-600">${diversityScore}%</div>
                          <div class="text-gray-600 font-semibold">Diversity Score</div>
                      </div>
                  </div>
                  
                  <!-- チームメンバー -->
                  <div class="mb-8">
                      <h2 class="text-2xl font-bold text-center mb-6">
                          <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                              Team Members
                          </span>
                      </h2>
                      <div class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          ${membersHTML}
                      </div>
                  </div>
                  
                  ${typeCounts.size < 12 ? `
                  <!-- 不足タイプのアドバイス -->
                  <div class="bg-gradient-to-br from-yellow-50 to-orange-50 p-6 rounded-2xl mb-6 border-2 border-orange-200">
                      <h3 class="text-xl font-bold mb-4 text-center">
                          <span class="text-2xl mr-2">💡</span>
                          <span class="bg-gradient-to-r from-orange-600 to-red-500 bg-clip-text text-transparent">
                              Team Growth Opportunities
                          </span>
                      </h3>
                      <div class="text-gray-700 leading-relaxed">
                          <p class="mb-3">
                              📊 <strong>Current Diversity:</strong> Your team has ${typeCounts.size} out of 12 personality types (${diversityScore}% coverage).
                          </p>
                          <p class="mb-3">
                              🎯 <strong>Missing Types:</strong> ${12 - typeCounts.size} personality types are not yet represented in your team.
                          </p>
                          <p class="mb-3">
                              ✨ <strong>Recommendation:</strong> Invite members with different personality types to increase team diversity and unlock new perspectives!
                          </p>
                          <p class="text-sm text-gray-600 italic">
                              💬 A more diverse team brings better problem-solving capabilities and balanced decision-making.
                          </p>
                      </div>
                  </div>
                  ` : ''}
                  
                  <!-- チームの強み -->
                  <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl mb-6">
                      <h3 class="text-xl font-bold mb-4 text-center">
                          <span class="text-2xl mr-2">💪</span>
                          <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                              Team Strengths
                          </span>
                      </h3>
                      <div class="text-gray-700 leading-relaxed">
                          <p class="mb-3">
                              🌟 <strong>Diversity:</strong> This team has ${typeCounts.size} different personality types, bringing diverse perspectives and approaches.
                          </p>
                          <p class="mb-3">
                              🤝 <strong>Balance:</strong> With ${members.results.length} members, this team has the perfect size for effective collaboration.
                          </p>
                          <p>
                              ✨ <strong>Synergy:</strong> Each member's unique strengths complement the others, creating a powerful divine team!
                          </p>
                      </div>
                  </div>
                  
                  <!-- アクション -->
                  <div class="flex gap-4 justify-center">
                      <a href="/" class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-xl transition transform hover:scale-105">
                          <i class="fas fa-home mr-2"></i>
                          Back to Home
                      </a>
                      <button onclick="shareTeam()" class="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 px-8 rounded-xl transition transform hover:scale-105">
                          <i class="fas fa-share-alt mr-2"></i>
                          Share Team
                      </button>
                  </div>
              </div>
          </div>
          
          <!-- Footer -->
          <footer class="mt-16 pb-8">
              <div class="container mx-auto px-4">
                  <div class="card p-6 max-w-4xl mx-auto text-center">
                      <div class="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
                          <a href="/terms" class="text-gray-600 hover:text-purple-600 transition font-semibold">
                              <i class="fas fa-file-contract mr-2"></i>Terms of Service
                          </a>
                          <span class="hidden md:inline text-gray-400">|</span>
                          <a href="/contact" class="text-gray-600 hover:text-purple-600 transition font-semibold">
                              <i class="fas fa-envelope mr-2"></i>Contact Us
                          </a>
                      </div>
                      <div class="text-gray-600 text-sm">
                          <p class="mb-2">Produced by</p>
                          <a href="https://www.crossproducers.com" target="_blank" rel="noopener noreferrer" 
                             class="text-purple-600 hover:text-purple-700 font-bold text-lg transition inline-flex items-center gap-2">
                              <span>CROSS Business Producers Inc</span>
                              <i class="fas fa-external-link-alt text-sm"></i>
                          </a>
                          <p class="mt-3 text-gray-500">
                              © 2025 CROSS Business Producers Inc. All rights reserved.
                          </p>
                      </div>
                  </div>
              </div>
          </footer>
          
          <script>
              function shareTeam() {
                  const url = window.location.href;
                  const text = 'Check out our divine team of the 12 Apostles! ✨👥';
                  
                  if (navigator.share) {
                      navigator.share({ title: '${team.name}', text, url });
                  } else {
                      navigator.clipboard.writeText(url).then(() => {
                          alert('✅ Team link copied to clipboard!');
                      });
                  }
              }
          </script>
      </body>
      </html>
    `);
  } catch (error) {
    console.error('Team page error:', error);
    return c.html('<h1>Error loading team</h1>', 500);
  }
});

// サービス約款ページ
app.get('/terms', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Terms of Service - The 12 Apostles Palm Reading</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Poppins', sans-serif; }
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            min-height: 100vh;
          }
          .card {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.98);
            border-radius: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
        </style>
    </head>
    <body>
        <div class="container mx-auto px-4 py-8">
            <div class="card p-8 md:p-12 max-w-4xl mx-auto">
                <h1 class="text-4xl font-extrabold text-center mb-8">
                    <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Terms of Service
                    </span>
                </h1>
                
                <div class="prose prose-lg max-w-none text-gray-700">
                    <p class="text-sm text-gray-500 mb-6">Last Updated: November 2, 2025</p>
                    
                    <section class="mb-8">
                        <h2 class="text-2xl font-bold text-purple-700 mb-4">1. Acceptance of Terms</h2>
                        <p class="mb-4">
                            By accessing and using The 12 Apostles Palm Reading service ("Service"), you accept and agree to be bound by the terms and provision of this agreement.
                        </p>
                    </section>
                    
                    <section class="mb-8">
                        <h2 class="text-2xl font-bold text-purple-700 mb-4">2. Service Description</h2>
                        <p class="mb-4">
                            The 12 Apostles Palm Reading is an entertainment service that analyzes palm images and provides personality type assessments based on the 12 Apostles archetypes. This service is for entertainment purposes only and should not be considered as professional advice.
                        </p>
                    </section>
                    
                    <section class="mb-8">
                        <h2 class="text-2xl font-bold text-purple-700 mb-4">3. User Data and Privacy</h2>
                        <ul class="list-disc pl-6 mb-4 space-y-2">
                            <li>We collect palm images and user names to provide the service</li>
                            <li>Your data is stored securely using Cloudflare D1 database</li>
                            <li>We do not share your personal information with third parties</li>
                            <li>You can request deletion of your data by contacting us</li>
                        </ul>
                    </section>
                    
                    <section class="mb-8">
                        <h2 class="text-2xl font-bold text-purple-700 mb-4">4. User Conduct</h2>
                        <p class="mb-4">You agree not to:</p>
                        <ul class="list-disc pl-6 mb-4 space-y-2">
                            <li>Upload inappropriate or offensive content</li>
                            <li>Attempt to hack or disrupt the service</li>
                            <li>Use the service for any illegal purposes</li>
                            <li>Impersonate others or provide false information</li>
                        </ul>
                    </section>
                    
                    <section class="mb-8">
                        <h2 class="text-2xl font-bold text-purple-700 mb-4">5. Intellectual Property</h2>
                        <p class="mb-4">
                            All content, features, and functionality of the Service are owned by CROSS Business Producers Inc and are protected by international copyright, trademark, and other intellectual property laws.
                        </p>
                    </section>
                    
                    <section class="mb-8">
                        <h2 class="text-2xl font-bold text-purple-700 mb-4">6. Disclaimer of Warranties</h2>
                        <p class="mb-4">
                            The Service is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. The personality analysis is for entertainment purposes only.
                        </p>
                    </section>
                    
                    <section class="mb-8">
                        <h2 class="text-2xl font-bold text-purple-700 mb-4">7. Limitation of Liability</h2>
                        <p class="mb-4">
                            CROSS Business Producers Inc shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.
                        </p>
                    </section>
                    
                    <section class="mb-8">
                        <h2 class="text-2xl font-bold text-purple-700 mb-4">8. Changes to Terms</h2>
                        <p class="mb-4">
                            We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the Service.
                        </p>
                    </section>
                    
                    <section class="mb-8">
                        <h2 class="text-2xl font-bold text-purple-700 mb-4">9. Contact Information</h2>
                        <p class="mb-4">
                            For questions about these Terms of Service, please contact us through our <a href="/contact" class="text-purple-600 hover:text-purple-700 font-semibold">Contact Page</a>.
                        </p>
                    </section>
                </div>
                
                <div class="mt-8 text-center">
                    <a href="/" class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-8 rounded-xl transition transform hover:scale-105 inline-block">
                        <i class="fas fa-home mr-2"></i>
                        Back to Home
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <footer class="mt-8 pb-8">
                <div class="container mx-auto px-4">
                    <div class="card p-6 max-w-4xl mx-auto text-center">
                        <div class="text-gray-600 text-sm">
                            <p class="mb-2">Produced by</p>
                            <a href="https://www.crossproducers.com" target="_blank" rel="noopener noreferrer" 
                               class="text-purple-600 hover:text-purple-700 font-bold text-lg transition inline-flex items-center gap-2">
                                <span>CROSS Business Producers Inc</span>
                                <i class="fas fa-external-link-alt text-sm"></i>
                            </a>
                            <p class="mt-3 text-gray-500">
                                © 2025 CROSS Business Producers Inc. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </body>
    </html>
  `)
});

// お問い合わせページ
app.get('/contact', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Contact Us - The 12 Apostles Palm Reading</title>
        <script src="https://cdn.tailwindcss.com"></script>
        <link href="https://cdn.jsdelivr.net/npm/@fortawesome/fontawesome-free@6.4.0/css/all.min.css" rel="stylesheet">
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap" rel="stylesheet">
        <style>
          * { font-family: 'Poppins', sans-serif; }
          body {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
            min-height: 100vh;
          }
          .card {
            backdrop-filter: blur(20px);
            background: rgba(255, 255, 255, 0.98);
            border-radius: 30px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          }
        </style>
    </head>
    <body>
        <div class="container mx-auto px-4 py-8">
            <div class="card p-8 md:p-12 max-w-3xl mx-auto">
                <div class="text-center mb-8">
                    <div class="text-6xl mb-4">📧</div>
                    <h1 class="text-4xl font-extrabold mb-4">
                        <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                            Contact Us
                        </span>
                    </h1>
                    <p class="text-gray-600 text-lg">
                        We'd love to hear from you!
                    </p>
                </div>
                
                <div class="space-y-6 mb-8">
                    <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-2xl">
                        <h2 class="text-xl font-bold text-purple-700 mb-4 flex items-center">
                            <i class="fas fa-building mr-3 text-2xl"></i>
                            Company Information
                        </h2>
                        <div class="text-gray-700 space-y-2">
                            <p><strong>Company Name:</strong> CROSS Business Producers Inc</p>
                            <p><strong>Website:</strong> 
                                <a href="https://www.crossproducers.com" target="_blank" rel="noopener noreferrer" 
                                   class="text-purple-600 hover:text-purple-700 font-semibold">
                                    www.crossproducers.com
                                    <i class="fas fa-external-link-alt text-sm ml-1"></i>
                                </a>
                            </p>
                        </div>
                    </div>
                    
                    <div class="bg-gradient-to-br from-blue-50 to-purple-50 p-6 rounded-2xl">
                        <h2 class="text-xl font-bold text-blue-700 mb-4 flex items-center">
                            <i class="fas fa-envelope mr-3 text-2xl"></i>
                            Get in Touch
                        </h2>
                        <p class="text-gray-700 mb-4">
                            For inquiries about The 12 Apostles Palm Reading service, please visit our company website or reach out through the contact form available there.
                        </p>
                        <a href="https://www.crossproducers.com" target="_blank" rel="noopener noreferrer"
                           class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-105 inline-flex items-center gap-2">
                            <span>Visit Company Website</span>
                            <i class="fas fa-arrow-right"></i>
                        </a>
                    </div>
                    
                    <div class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl border-2 border-indigo-300">
                        <h2 class="text-xl font-bold text-indigo-700 mb-4 flex items-center">
                            <i class="fas fa-star mr-3 text-2xl"></i>
                            Professional Consultation Services
                        </h2>
                        <p class="text-gray-700 mb-4 leading-relaxed">
                            Interested in deeper personality analysis, specific future predictions, or personalized career guidance? Our expert team offers professional consultation services tailored to your needs.
                        </p>
                        <div class="bg-white p-4 rounded-xl mb-4">
                            <h3 class="font-bold text-purple-700 mb-2 flex items-center">
                                <i class="fas fa-sparkles mr-2"></i>
                                What We Offer:
                            </h3>
                            <ul class="text-gray-700 space-y-2 text-sm">
                                <li><i class="fas fa-chevron-right text-purple-500 mr-2"></i>In-depth personality analysis</li>
                                <li><i class="fas fa-chevron-right text-purple-500 mr-2"></i>Detailed future path predictions (2026-2050)</li>
                                <li><i class="fas fa-chevron-right text-purple-500 mr-2"></i>Career and life strategy consulting</li>
                                <li><i class="fas fa-chevron-right text-purple-500 mr-2"></i>Team building and organizational development</li>
                            </ul>
                        </div>
                        <a href="https://www.crossproducers.com" target="_blank" rel="noopener noreferrer"
                           class="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 inline-flex items-center justify-center gap-2 shadow-lg">
                            <i class="fas fa-calendar-check text-xl"></i>
                            <span>Request Professional Consultation</span>
                        </a>
                    </div>
                    
                    <div class="bg-gradient-to-br from-green-50 to-teal-50 p-6 rounded-2xl">
                        <h2 class="text-xl font-bold text-green-700 mb-4 flex items-center">
                            <i class="fas fa-question-circle mr-3 text-2xl"></i>
                            Common Inquiries
                        </h2>
                        <ul class="text-gray-700 space-y-2">
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Service questions and technical support</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Privacy and data deletion requests</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Partnership and business inquiries</li>
                            <li><i class="fas fa-check text-green-600 mr-2"></i>Feedback and suggestions</li>
                        </ul>
                    </div>
                </div>
                
                <div class="text-center">
                    <a href="/" class="bg-gradient-to-r from-gray-500 to-gray-600 hover:from-gray-600 hover:to-gray-700 text-white font-bold py-3 px-8 rounded-xl transition transform hover:scale-105 inline-block">
                        <i class="fas fa-home mr-2"></i>
                        Back to Home
                    </a>
                </div>
            </div>
            
            <!-- Footer -->
            <footer class="mt-8 pb-8">
                <div class="container mx-auto px-4">
                    <div class="card p-6 max-w-3xl mx-auto text-center">
                        <div class="text-gray-600 text-sm">
                            <p class="mb-2">Produced by</p>
                            <a href="https://www.crossproducers.com" target="_blank" rel="noopener noreferrer" 
                               class="text-purple-600 hover:text-purple-700 font-bold text-lg transition inline-flex items-center gap-2">
                                <span>CROSS Business Producers Inc</span>
                                <i class="fas fa-external-link-alt text-sm"></i>
                            </a>
                            <p class="mt-3 text-gray-500">
                                © 2025 CROSS Business Producers Inc. All rights reserved.
                            </p>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    </body>
    </html>
  `)
});

// メインページ
app.get('/', (c) => {
  return c.html(`
    <!DOCTYPE html>
    <html lang="ja">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>The ForeSight Code - The Algorithm of Purpose</title>
        
        <!-- OGP Meta Tags for Social Sharing -->
        <meta property="og:title" content="The ForeSight Code - The Algorithm of Purpose">
        <meta property="og:description" content="The algorithm that moves your mission. Decode the code of purpose engraved within you. 🔮✨">
        <meta property="og:type" content="website">
        <meta property="og:url" content="https://palm-reading-12apostles.pages.dev">
        <meta property="og:image" content="https://palm-reading-12apostles.pages.dev/og-image.png">
        <meta property="og:site_name" content="The ForeSight Code">
        
        <!-- Twitter Card Meta Tags -->
        <meta name="twitter:card" content="summary_large_image">
        <meta name="twitter:title" content="The ForeSight Code">
        <meta name="twitter:description" content="The algorithm that moves your mission. 🔮✨">
        <meta name="twitter:image" content="https://palm-reading-12apostles.pages.dev/og-image.png">
        
        <!-- Description Meta Tag -->
        <meta name="description" content="The ForeSight Code - Decode the code of purpose engraved within you and design the future.">
        
        <script src="https://cdn.tailwindcss.com"></script>
        <script>
          tailwind.config = {
            theme: {
              extend: {}
            }
          }
        </script>
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
            text-shadow: 0 4px 20px rgba(102, 126, 234, 0.6);
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
            <!-- 言語切り替えボタン -->
            <div class="fixed top-4 right-4 z-50">
                <button id="langSwitch" onclick="switchLanguage()" 
                        class="bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-900 font-bold py-2 px-6 rounded-full transition transform hover:scale-105 shadow-lg">
                    <i class="fas fa-globe mr-2"></i>
                    <span class="lang-text">日本語</span>
                </button>
            </div>
            
            <!-- ヒーローセクション -->
            <div class="card p-8 md:p-12 max-w-4xl mx-auto mb-8">
                <div class="text-center mb-8">
                    <div class="icon-float text-7xl mb-6">🔮✨🤲</div>
                    <h1 class="hero-title hero-title-main text-5xl md:text-6xl font-extrabold mb-4">
                        The ForeSight Code
                    </h1>
                    <h2 class="hero-title hero-subtitle text-3xl md:text-4xl font-bold mb-6">
                        The Algorithm of Purpose
                    </h2>
                    <p class="subtitle hero-description text-xl text-gray-800 mb-4 leading-relaxed font-semibold">
                        The algorithm that moves your mission.
                    </p>
                    
                    <!-- コンセプトテキスト -->
                    <div class="mt-8 bg-white/90 p-6 rounded-2xl border border-purple-200 backdrop-blur-sm shadow-lg">
                        <p class="concept-title text-lg text-purple-900 mb-3 font-bold italic">
                            What drives the era is not technology.
                        </p>
                        <p class="concept-text text-gray-700 leading-relaxed">
                            It is the code of purpose engraved within you. We decode that code and design the future.
                        </p>
                    </div>
                </div>

                <!-- ステップ1: 写真アップロード -->
                <div id="step1" class="mb-8">
                    <h2 class="text-2xl font-bold mb-6 text-center">
                        <span class="step-badge text-white rounded-full w-10 h-10 inline-flex items-center justify-center mr-3 text-lg shadow-lg">1</span>
                        <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent" data-translate="captureStep">
                            Capture Your Palm
                        </span>
                    </h2>
                    <div class="mb-6">
                        <label class="block text-white mb-3 font-semibold text-lg">
                            <i class="fas fa-user mr-2 text-yellow-400"></i><span data-translate="yourName">Your Name</span>
                        </label>
                        <input type="text" id="userName" placeholder="Enter your name" 
                               class="input-field w-full px-6 py-4 rounded-2xl focus:outline-none text-lg bg-white/95 text-gray-800">
                    </div>
                    <div class="mb-6">
                        <label class="block text-white mb-3 font-semibold text-lg">
                            <i class="fas fa-camera mr-2 text-yellow-400"></i><span data-translate="palmPhoto">Palm Photo</span>
                        </label>
                        <div class="space-y-3">
                            <input type="file" id="palmImage" accept="image/*"
                                   class="input-field w-full px-6 py-4 rounded-2xl focus:outline-none bg-white/95 text-gray-800">
                            <p class="text-sm text-gray-200 text-center">
                                <i class="fas fa-info-circle mr-1"></i>
                                Choose from camera or album
                            </p>
                        </div>
                    </div>
                    <div id="previewContainer" class="mb-6 text-center hidden">
                        <img id="preview" alt="Preview">
                    </div>
                    <button id="analyzeBtn" class="btn-primary w-full text-white font-bold py-4 px-8 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed text-lg relative z-10 shadow-xl">
                        <i class="fas fa-sparkles mr-2"></i>
                        <span data-translate="discoverBtn">Discover My Code</span>
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

        <!-- Footer -->
        <footer class="mt-16 pb-8">
            <div class="container mx-auto px-4">
                <div class="card p-6 max-w-4xl mx-auto text-center">
                    <div class="flex flex-col md:flex-row justify-center items-center gap-4 mb-4">
                        <a href="/terms" class="text-gray-600 hover:text-purple-600 transition font-semibold">
                            <i class="fas fa-file-contract mr-2"></i>Terms of Service
                        </a>
                        <span class="hidden md:inline text-gray-400">|</span>
                        <a href="/contact" class="text-gray-600 hover:text-purple-600 transition font-semibold">
                            <i class="fas fa-envelope mr-2"></i>Contact Us
                        </a>
                    </div>
                    <div class="text-gray-600 text-sm">
                        <p class="mb-2">Produced by</p>
                        <a href="https://www.crossproducers.com" target="_blank" rel="noopener noreferrer" 
                           class="text-purple-600 hover:text-purple-700 font-bold text-lg transition inline-flex items-center gap-2">
                            <span>CROSS Business Producers Inc</span>
                            <i class="fas fa-external-link-alt text-sm"></i>
                        </a>
                        <p class="mt-3 text-gray-500">
                            © 2025 CROSS Business Producers Inc. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>

        <script src="https://cdn.jsdelivr.net/npm/axios@1.6.0/dist/axios.min.js"></script>
        <script src="/static/app.js"></script>
    </body>
    </html>
  `)
})

export default app
