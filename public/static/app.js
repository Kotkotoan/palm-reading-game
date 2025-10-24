// グローバル変数
let currentUserId = null;
let currentReading = null;

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    // データベース初期化
    await initDatabase();
    
    // 使徒タイプ一覧の読み込み
    await loadApostleTypes();
    
    // イベントリスナーの設定
    setupEventListeners();
});

// データベース初期化
async function initDatabase() {
    try {
        const response = await axios.post('/api/init-db');
        console.log('Database initialized:', response.data);
    } catch (error) {
        console.error('Database initialization error:', error);
    }
}

// 使徒タイプ一覧の読み込み
async function loadApostleTypes() {
    try {
        const response = await axios.get('/api/apostle-types');
        const types = response.data;
        
        const container = document.getElementById('apostleTypes');
        container.innerHTML = types.map(type => `
            <div class="apostle-card bg-white p-6 rounded-lg shadow-md border-2 border-purple-200">
                <div class="text-4xl text-center mb-3">${type.icon}</div>
                <h3 class="text-xl font-bold text-purple-700 mb-2 text-center">${type.name_ja}</h3>
                <p class="text-sm text-gray-600 mb-3 text-center">${type.name_en}</p>
                <p class="text-gray-700 mb-3">${type.description}</p>
                <div class="text-sm">
                    <p class="mb-1"><strong class="text-purple-600">特徴:</strong> ${type.characteristics}</p>
                    <p><strong class="text-purple-600">強み:</strong> ${type.strengths}</p>
                </div>
            </div>
        `).join('');
    } catch (error) {
        console.error('Error loading apostle types:', error);
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    const palmImage = document.getElementById('palmImage');
    const analyzeBtn = document.getElementById('analyzeBtn');
    const resetBtn = document.getElementById('resetBtn');
    
    // 画像プレビュー
    palmImage.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const preview = document.getElementById('preview');
                preview.src = e.target.result;
                document.getElementById('previewContainer').classList.remove('hidden');
                analyzeBtn.disabled = false;
            };
            reader.readAsDataURL(file);
        }
    });
    
    // 診断ボタン
    analyzeBtn.addEventListener('click', analyzePalm);
    
    // リセットボタン
    resetBtn.addEventListener('click', resetForm);
}

// 手相診断の実行
async function analyzePalm() {
    const userName = document.getElementById('userName').value.trim();
    const palmImage = document.getElementById('palmImage').files[0];
    
    if (!userName) {
        alert('お名前を入力してください');
        return;
    }
    
    if (!palmImage) {
        alert('手のひらの写真を選択してください');
        return;
    }
    
    // ローディング表示
    document.getElementById('step1').classList.add('hidden');
    document.getElementById('loading').classList.add('active');
    
    try {
        // 画像をBase64に変換
        const imageData = await fileToBase64(palmImage);
        
        // API呼び出し
        const response = await axios.post('/api/analyze-palm', {
            userName,
            imageData
        });
        
        currentUserId = response.data.userId;
        currentReading = response.data;
        
        // 結果表示
        displayResult(response.data);
        
    } catch (error) {
        console.error('Analysis error:', error);
        alert('診断中にエラーが発生しました。もう一度お試しください。');
        resetForm();
    } finally {
        document.getElementById('loading').classList.remove('active');
    }
}

// 結果表示
function displayResult(data) {
    const { apostleType, confidence, analysisDetails } = data;
    
    const resultHTML = `
        <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-8 rounded-lg mb-6">
            <div class="text-6xl text-center mb-4">${apostleType.icon}</div>
            <h3 class="text-3xl font-bold text-purple-800 text-center mb-2">${apostleType.name_ja}</h3>
            <p class="text-xl text-gray-600 text-center mb-4">${apostleType.name_en}</p>
            <p class="text-lg text-gray-700 mb-4 text-center">${apostleType.description}</p>
            
            <div class="bg-white p-6 rounded-lg shadow-md mb-4">
                <h4 class="text-xl font-bold text-purple-700 mb-3">
                    <i class="fas fa-star mr-2"></i>あなたの特徴
                </h4>
                <p class="text-gray-700 mb-3"><strong>性格:</strong> ${apostleType.characteristics}</p>
                <p class="text-gray-700 mb-3"><strong>強み:</strong> ${apostleType.strengths}</p>
                <div class="mt-4 pt-4 border-t border-gray-200">
                    <p class="text-sm text-gray-600">
                        <i class="fas fa-chart-line mr-2"></i>
                        診断精度: ${(confidence * 100).toFixed(1)}%
                    </p>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md mb-4">
                <h4 class="text-xl font-bold text-purple-700 mb-3">
                    <i class="fas fa-hand-sparkles mr-2"></i>手相分析詳細
                </h4>
                <div class="space-y-2 text-gray-700">
                    <p><strong>感情線:</strong> ${analysisDetails.heart_line}</p>
                    <p><strong>知能線:</strong> ${analysisDetails.head_line}</p>
                    <p><strong>生命線:</strong> ${analysisDetails.life_line}</p>
                    <p><strong>運命線:</strong> ${analysisDetails.fate_line}</p>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-lg shadow-md">
                <h4 class="text-xl font-bold text-purple-700 mb-3">
                    <i class="fas fa-heart mr-2"></i>相性の良いタイプ
                </h4>
                <p class="text-gray-700">
                    ${getCompatibleTypesText(apostleType.compatible_types)}
                </p>
            </div>
        </div>
        
        <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
            <p class="text-blue-800">
                <i class="fas fa-info-circle mr-2"></i>
                この診断結果を使って、他の人とチームを組むことができます！
            </p>
        </div>
    `;
    
    document.getElementById('result').innerHTML = resultHTML;
    document.getElementById('step2').classList.remove('hidden');
}

// 相性の良いタイプのテキスト取得
function getCompatibleTypesText(compatibleTypes) {
    const typeNames = {
        '1': 'ペテロ（リーダー型）',
        '2': 'ヨハネ（共感型）',
        '3': 'アンデレ（サポート型）',
        '4': 'ヤコブ（戦略型）',
        '5': 'フィリポ（探求型）',
        '6': 'バルトロマイ（創造型）',
        '7': 'マタイ（分析型）',
        '8': 'トマス（慎重型）',
        '9': 'ユダ・タダイ（調和型）',
        '10': 'シモン（情熱型）',
        '11': '小ヤコブ（忠実型）',
        '12': 'マティア（バランス型）'
    };
    
    const types = compatibleTypes.split(',').map(id => typeNames[id]).filter(Boolean);
    return types.join('、');
}

// フォームリセット
function resetForm() {
    document.getElementById('userName').value = '';
    document.getElementById('palmImage').value = '';
    document.getElementById('preview').src = '';
    document.getElementById('previewContainer').classList.add('hidden');
    document.getElementById('analyzeBtn').disabled = true;
    document.getElementById('step1').classList.remove('hidden');
    document.getElementById('step2').classList.add('hidden');
    document.getElementById('loading').classList.remove('active');
    currentUserId = null;
    currentReading = null;
}

// ファイルをBase64に変換
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}
