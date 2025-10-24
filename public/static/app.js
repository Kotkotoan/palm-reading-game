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
            <div class="apostle-card p-6 rounded-3xl shadow-lg border-2 border-purple-200">
                <div class="text-5xl text-center mb-4 icon-float">${type.icon}</div>
                <h3 class="text-xl font-bold mb-2 text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    ${type.name_en.split(' - ')[0]}
                </h3>
                <p class="text-sm text-gray-500 mb-3 text-center font-semibold">
                    ${type.name_en.split(' - ')[1] || type.name_en}
                </p>
                <p class="text-gray-600 mb-4 text-sm leading-relaxed">${type.description}</p>
                <div class="text-xs space-y-2 bg-purple-50 p-3 rounded-xl">
                    <p class="flex items-start">
                        <span class="text-purple-600 mr-2">✨</span>
                        <span><strong>Traits:</strong> ${type.characteristics}</span>
                    </p>
                    <p class="flex items-start">
                        <span class="text-purple-600 mr-2">💪</span>
                        <span><strong>Strengths:</strong> ${type.strengths}</span>
                    </p>
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
        <div class="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 p-8 md:p-10 rounded-3xl mb-6 border-2 border-purple-200">
            <div class="text-7xl text-center mb-6 icon-float">${apostleType.icon}</div>
            <h3 class="text-4xl font-extrabold text-center mb-3">
                <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    ${apostleType.name_en.split(' - ')[0]}
                </span>
            </h3>
            <p class="text-xl text-center mb-2 font-semibold text-gray-600">
                ${apostleType.name_en.split(' - ')[1] || apostleType.name_en}
            </p>
            <p class="text-lg text-gray-600 mb-6 text-center leading-relaxed">${apostleType.description}</p>
            
            <div class="bg-white p-6 rounded-2xl shadow-lg mb-4 border-2 border-purple-100">
                <h4 class="text-xl font-bold mb-4 flex items-center justify-center">
                    <span class="text-2xl mr-2">✨</span>
                    <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Your Traits
                    </span>
                </h4>
                <div class="space-y-3 text-gray-700">
                    <p class="flex items-start bg-purple-50 p-3 rounded-xl">
                        <span class="text-purple-600 mr-2 mt-1">💫</span>
                        <span><strong>Personality:</strong> ${apostleType.characteristics}</span>
                    </p>
                    <p class="flex items-start bg-pink-50 p-3 rounded-xl">
                        <span class="text-pink-600 mr-2 mt-1">💪</span>
                        <span><strong>Strengths:</strong> ${apostleType.strengths}</span>
                    </p>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 text-center">
                    <p class="text-sm text-gray-600 font-semibold">
                        <i class="fas fa-chart-line mr-2 text-purple-500"></i>
                        Accuracy: ${(confidence * 100).toFixed(1)}%
                    </p>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-lg mb-4 border-2 border-purple-100">
                <h4 class="text-xl font-bold mb-4 flex items-center justify-center">
                    <span class="text-2xl mr-2">🤲</span>
                    <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Palm Analysis
                    </span>
                </h4>
                <div class="space-y-3 text-gray-700 text-sm">
                    <p class="bg-purple-50 p-3 rounded-xl"><strong>Heart Line:</strong> ${analysisDetails.heart_line}</p>
                    <p class="bg-blue-50 p-3 rounded-xl"><strong>Head Line:</strong> ${analysisDetails.head_line}</p>
                    <p class="bg-green-50 p-3 rounded-xl"><strong>Life Line:</strong> ${analysisDetails.life_line}</p>
                    <p class="bg-pink-50 p-3 rounded-xl"><strong>Fate Line:</strong> ${analysisDetails.fate_line}</p>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-100">
                <h4 class="text-xl font-bold mb-4 flex items-center justify-center">
                    <span class="text-2xl mr-2">💕</span>
                    <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Compatible Types
                    </span>
                </h4>
                <p class="text-gray-700 text-center leading-relaxed">
                    ${getCompatibleTypesText(apostleType.compatible_types)}
                </p>
            </div>
        </div>
        
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 border-l-4 border-purple-500 p-5 rounded-xl">
            <p class="text-gray-700 flex items-center">
                <i class="fas fa-info-circle mr-3 text-purple-500 text-xl"></i>
                <span class="font-semibold">You can form teams with others using this result! 🎉</span>
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
