// グローバル変数
let currentUserId = null;
let currentReading = null;
let currentLang = localStorage.getItem('lang') || 'ja';

// 翻訳データ
const translations = {
    en: {
        title: 'The ForeSight Code',
        subtitle: 'The Algorithm of Purpose',
        description: 'The algorithm that moves your mission.',
        conceptTitle: 'What drives the era is not technology.',
        conceptText: 'It is the code of purpose engraved within you. We decode that code and design the future.',
        yourName: 'Your Name',
        enterName: 'Enter your name',
        palmPhoto: 'Palm Photo',
        captureStep: 'Capture Your Palm',
        discoverBtn: 'Discover My Code',
        analyzing: 'Analyzing your palm...',
        magicProgress: '✨ Decoding in progress ✨',
        stepResult: 'Your Divine Code',
        tryAgain: 'Try Again',
        shareResult: 'Share Your Result',
        teamFormation: 'Team Formation',
        teamDesc: 'Find the perfect team with balanced codes!',
        findTeam: 'Find My Team Now!',
        meetTitle: 'Meet The 12 Codes',
        meetDesc: 'Discover all purpose archetypes 🌟',
        switchLang: '日本語'
    },
    ja: {
        title: 'The ForeSight Code',
        subtitle: '使命のアルゴリズム',
        description: 'あなたの使命を動かすアルゴリズム。',
        conceptTitle: '時代を動かすのは、テクノロジーではない。',
        conceptText: 'それは、あなたの中に刻まれた使命のコードだ。私たちは、そのコードを解読し、未来を設計する。',
        yourName: 'お名前',
        enterName: 'お名前を入力',
        palmPhoto: '手のひら写真',
        captureStep: '手のひらを撮影',
        discoverBtn: 'コードを解読する',
        analyzing: '手相を分析中...',
        magicProgress: '✨ 解読中 ✨',
        stepResult: 'あなたの神聖なコード',
        tryAgain: 'もう一度診断する',
        shareResult: '診断結果をシェア',
        teamFormation: 'チーム形成',
        teamDesc: 'バランスの取れたコードでチームを見つけよう！',
        findTeam: '今すぐチームを見つける！',
        meetTitle: '12のコードを知る',
        meetDesc: '全ての使命のアーキタイプを見る 🌟',
        switchLang: 'English'
    }
};

// 言語切り替え
function switchLanguage() {
    currentLang = currentLang === 'en' ? 'ja' : 'en';
    localStorage.setItem('lang', currentLang);
    location.reload();
}

// 翻訳取得
function t(key) {
    return translations[currentLang][key] || translations.en[key] || key;
}

// ページ読み込み時の初期化
document.addEventListener('DOMContentLoaded', async () => {
    // 言語に応じてテキストを更新
    updateLanguage();
    
    // 使徒タイプ一覧の読み込み
    await loadApostleTypes();
    
    // イベントリスナーの設定
    setupEventListeners();
});

// 言語更新
function updateLanguage() {
    // タイトルと説明を更新
    const titleEl = document.querySelector('.hero-title-main');
    const subtitleEl = document.querySelector('.hero-subtitle');
    const descEl = document.querySelector('.hero-description');
    const conceptTitleEl = document.querySelector('.concept-title');
    const conceptTextEl = document.querySelector('.concept-text');
    
    if (titleEl) titleEl.textContent = t('title');
    if (subtitleEl) subtitleEl.textContent = t('subtitle');
    if (descEl) descEl.textContent = t('description');
    if (conceptTitleEl) conceptTitleEl.textContent = t('conceptTitle');
    if (conceptTextEl) conceptTextEl.textContent = t('conceptText');
    
    // 言語切り替えボタンのテキストを更新
    const langTextEl = document.querySelector('.lang-text');
    if (langTextEl) {
        langTextEl.textContent = currentLang === 'ja' ? 'English' : '日本語';
    }
    
    // フォームラベルを更新
    const labels = document.querySelectorAll('[data-translate]');
    labels.forEach(el => {
        const key = el.getAttribute('data-translate');
        if (key) el.textContent = t(key);
    });
    
    // ボタンテキストを更新
    const langBtn = document.getElementById('langSwitch');
    if (langBtn) langBtn.textContent = t('switchLang');
}

// 使徒タイプ一覧の読み込み
async function loadApostleTypes() {
    try {
        const response = await axios.get('/api/apostle-types');
        const types = response.data;
        
        const container = document.getElementById('apostleTypes');
        container.innerHTML = types.map(type => {
            // 言語に応じて名前と説明を切り替え
            const name = currentLang === 'ja' ? type.name_ja : type.name_en;
            const nameParts = name.split(' - ');
            const description = currentLang === 'ja' ? (type.description_ja || type.description) : (type.description_en || type.description);
            const characteristics = currentLang === 'ja' ? (type.characteristics_ja || type.characteristics) : (type.characteristics_en || type.characteristics);
            const strengths = currentLang === 'ja' ? (type.strengths_ja || type.strengths) : (type.strengths_en || type.strengths);
            
            return `
            <div class="apostle-card p-6 rounded-3xl shadow-lg border-2 border-purple-200">
                <div class="text-5xl text-center mb-4 icon-float">${type.icon}</div>
                <h3 class="text-xl font-bold mb-2 text-center bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    ${nameParts[0]}
                </h3>
                <p class="text-sm text-gray-500 mb-3 text-center font-semibold">
                    ${nameParts[1] || nameParts[0]}
                </p>
                <p class="text-gray-600 mb-4 text-sm leading-relaxed">${description}</p>
                <div class="text-xs space-y-2 bg-purple-50 p-3 rounded-xl">
                    <p class="flex items-start">
                        <span class="text-purple-600 mr-2">✨</span>
                        <span><strong>${currentLang === 'ja' ? '特性' : 'Traits'}:</strong> ${characteristics}</span>
                    </p>
                    <p class="flex items-start">
                        <span class="text-purple-600 mr-2">💪</span>
                        <span><strong>${currentLang === 'ja' ? '強み' : 'Strengths'}:</strong> ${strengths}</span>
                    </p>
                </div>
            </div>
            `;
        }).join('');
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
        let errorMessage = 'An error occurred during analysis. Please try again.';
        
        if (error.response) {
            // サーバーからのエラーレスポンス
            console.error('Server error:', error.response.data);
            errorMessage = `Error: ${error.response.data.error || error.response.statusText}`;
        } else if (error.request) {
            // リクエストが送信されたがレスポンスがない
            console.error('No response:', error.request);
            errorMessage = 'No response from server. Please check your connection.';
        } else {
            // リクエストの設定中にエラー
            console.error('Request error:', error.message);
            errorMessage = `Request error: ${error.message}`;
        }
        
        alert(errorMessage);
        resetForm();
    } finally {
        document.getElementById('loading').classList.remove('active');
    }
}

// 結果表示
function displayResult(data) {
    const { apostleType, confidence, analysisDetails } = data;
    
    // 言語に応じて表示内容を切り替え
    const name = currentLang === 'ja' ? apostleType.name_ja : apostleType.name_en;
    const nameParts = name.split(' - ');
    const description = currentLang === 'ja' ? (apostleType.description_ja || apostleType.description) : (apostleType.description_en || apostleType.description);
    const characteristics = currentLang === 'ja' ? (apostleType.characteristics_ja || apostleType.characteristics) : (apostleType.characteristics_en || apostleType.characteristics);
    const strengths = currentLang === 'ja' ? (apostleType.strengths_ja || apostleType.strengths) : (apostleType.strengths_en || apostleType.strengths);
    const detailedPersonality = currentLang === 'ja' ? (apostleType.detailed_personality_ja || apostleType.detailed_personality || description) : (apostleType.detailed_personality_en || apostleType.detailed_personality || description);
    
    const t = translations[currentLang];
    
    const resultHTML = `
        <div class="bg-gradient-to-br from-purple-50 via-pink-50 to-purple-50 p-4 md:p-8 rounded-3xl mb-6 border-2 border-purple-200">
            <div class="text-6xl md:text-7xl text-center mb-4 md:mb-6 icon-float">${apostleType.icon}</div>
            <h3 class="text-2xl md:text-4xl font-extrabold text-center mb-2 md:mb-3 px-2">
                <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    ${nameParts[0]}
                </span>
            </h3>
            <p class="text-lg md:text-xl text-center mb-2 font-semibold text-gray-600 px-2">
                ${nameParts[1] || nameParts[0]}
            </p>
            <p class="text-base md:text-lg text-gray-600 mb-4 md:mb-6 text-center leading-relaxed px-4 max-w-2xl mx-auto">${description}</p>
            
            <!-- 詳細な性格分析 -->
            <div class="bg-white p-4 md:p-6 rounded-2xl shadow-lg mb-4 border-2 border-purple-100">
                <h4 class="text-xl md:text-2xl font-bold mb-3 md:mb-4 flex items-center justify-center flex-wrap text-center">
                    <span class="text-2xl md:text-3xl mr-2">🌟</span>
                    <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        ${currentLang === 'ja' ? '詳細な性格分析' : 'Detailed Personality Analysis'}
                    </span>
                </h4>
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-4 md:p-5 rounded-xl mb-3 md:mb-4">
                    <p class="text-gray-700 leading-relaxed text-sm md:text-base">
                        ${detailedPersonality}
                    </p>
                </div>
                <div class="space-y-2 md:space-y-3 text-gray-700">
                    <p class="flex items-start bg-purple-50 p-3 rounded-xl text-sm md:text-base">
                        <span class="text-purple-600 mr-2 mt-1 flex-shrink-0">💫</span>
                        <span class="break-words"><strong>${currentLang === 'ja' ? '主な特性' : 'Key Traits'}:</strong> ${characteristics}</span>
                    </p>
                    <p class="flex items-start bg-pink-50 p-3 rounded-xl text-sm md:text-base">
                        <span class="text-pink-600 mr-2 mt-1 flex-shrink-0">💪</span>
                        <span class="break-words"><strong>${currentLang === 'ja' ? 'コアな強み' : 'Core Strengths'}:</strong> ${strengths}</span>
                    </p>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 text-center">
                    <p class="text-sm text-gray-600 font-semibold">
                        <i class="fas fa-chart-line mr-2 text-purple-500"></i>
                        ${currentLang === 'ja' ? '分析精度' : 'Analysis Accuracy'}: ${(confidence * 100).toFixed(1)}%
                    </p>
                </div>
            </div>
            
            <div class="bg-white p-6 rounded-2xl shadow-lg mb-4 border-2 border-purple-100">
                <h4 class="text-xl font-bold mb-4 flex items-center justify-center">
                    <span class="text-2xl mr-2">🤲</span>
                    <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        ${currentLang === 'ja' ? '手相分析' : 'Palm Analysis'}
                    </span>
                </h4>
                <div class="space-y-3 text-gray-700 text-sm">
                    <p class="bg-purple-50 p-3 rounded-xl"><strong>${currentLang === 'ja' ? '感情線' : 'Heart Line'}:</strong> ${analysisDetails.heart_line}</p>
                    <p class="bg-blue-50 p-3 rounded-xl"><strong>${currentLang === 'ja' ? '知能線' : 'Head Line'}:</strong> ${analysisDetails.head_line}</p>
                    <p class="bg-green-50 p-3 rounded-xl"><strong>${currentLang === 'ja' ? '生命線' : 'Life Line'}:</strong> ${analysisDetails.life_line}</p>
                    <p class="bg-pink-50 p-3 rounded-xl"><strong>${currentLang === 'ja' ? '運命線' : 'Fate Line'}:</strong> ${analysisDetails.fate_line}</p>
                </div>
            </div>
            
            <!-- 未来予測: 2026-2050 -->
            <div class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl shadow-lg mb-4 border-2 border-indigo-200">
                <h4 class="text-2xl font-bold mb-6 flex items-center justify-center">
                    <span class="text-3xl mr-2">🔮</span>
                    <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        ${currentLang === 'ja' ? 'あなたの未来予測 (2026-2050)' : 'Your Future Path (2026-2050)'}
                    </span>
                </h4>
                
                <!-- 2026-2028: 近未来 -->
                <div class="mb-5">
                    <div class="flex items-center mb-3">
                        <span class="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-bold mr-3">
                            2026 - 2028
                        </span>
                        <span class="text-gray-600 font-semibold">${currentLang === 'ja' ? '近未来' : 'Near Future'}</span>
                    </div>
                    <div class="bg-white p-4 rounded-xl border-l-4 border-blue-400">
                        <p class="text-gray-700 leading-relaxed text-sm">
                            ${apostleType.future_2026_2028 || '近未来において、あなたの特性は社会変化の中で重要な役割を果たします。テクノロジーの進化と人間性のバランスを取りながら、新しい時代に適応していくでしょう。'}
                        </p>
                    </div>
                </div>
                
                <!-- 2029-2035: 中期未来 -->
                <div class="mb-5">
                    <div class="flex items-center mb-3">
                        <span class="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-2 rounded-full text-sm font-bold mr-3">
                            2029 - 2035
                        </span>
                        <span class="text-gray-600 font-semibold">${currentLang === 'ja' ? '中期未来' : 'Mid-term Future'}</span>
                    </div>
                    <div class="bg-white p-4 rounded-xl border-l-4 border-purple-400">
                        <p class="text-gray-700 leading-relaxed text-sm">
                            ${apostleType.future_2029_2035 || '2030年代には、あなたの能力がさらに重要性を増します。社会システムの変革期において、あなたの特性が新しい価値を創造します。'}
                        </p>
                    </div>
                </div>
                
                <!-- 2036-2050: 長期未来 -->
                <div>
                    <div class="flex items-center mb-3">
                        <span class="bg-gradient-to-r from-pink-500 to-orange-500 text-white px-4 py-2 rounded-full text-sm font-bold mr-3">
                            2036 - 2050
                        </span>
                        <span class="text-gray-600 font-semibold">${currentLang === 'ja' ? '長期未来' : 'Long-term Future'}</span>
                    </div>
                    <div class="bg-white p-4 rounded-xl border-l-4 border-pink-400">
                        <p class="text-gray-700 leading-relaxed text-sm">
                            ${apostleType.future_2036_2050 || '2040年代以降、人類社会は大きな転換点を迎えます。あなたの資質は、新しい時代を築く基盤となり、未来世代への遺産となるでしょう。'}
                        </p>
                    </div>
                </div>
                
                <div class="mt-5 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-xl border border-orange-200">
                    <p class="text-sm text-gray-600 text-center">
                        <i class="fas fa-lightbulb mr-2 text-orange-500"></i>
                        <strong>${currentLang === 'ja' ? '注意' : 'Note'}:</strong> ${currentLang === 'ja' ? 'この予測は、現在のマクロ社会トレンドとあなたの性格分析に基づいています。' : 'This forecast is based on current macro social trends and your personality analysis.'}
                    </p>
                </div>
            </div>
            
            <!-- 仕事の相性診断 (プレミアム機能) -->
            <div class="bg-white p-6 rounded-2xl shadow-lg border-2 border-purple-100 relative">
                <h4 class="text-xl font-bold mb-4 flex items-center justify-center">
                    <span class="text-2xl mr-2">💼</span>
                    <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        ${currentLang === 'ja' ? '仕事の相性診断' : 'Work Compatibility Analysis'}
                    </span>
                </h4>
                
                <!-- プレミアムロック表示 -->
                <div id="workCompatibilityLocked" class="text-center py-8">
                    <div class="text-6xl mb-4">🔒</div>
                    <p class="text-gray-600 mb-4 text-sm md:text-base px-4">
                        ${currentLang === 'ja' 
                            ? '詳細な仕事の相性診断はプレミアム版で確認できます' 
                            : 'Detailed work compatibility analysis is available in Premium'}
                    </p>
                    <div class="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-xl mb-4 mx-4">
                        <p class="text-sm text-gray-700 mb-2 font-semibold">
                            ${currentLang === 'ja' ? 'プレミアム版で分かること：' : 'Premium includes:'}
                        </p>
                        <ul class="text-xs md:text-sm text-gray-600 space-y-1 text-left">
                            <li>✨ ${currentLang === 'ja' ? '相性の良い上司・部下のタイプ' : 'Compatible boss & subordinate types'}</li>
                            <li>✨ ${currentLang === 'ja' ? '最適なチーム構成' : 'Optimal team composition'}</li>
                            <li>✨ ${currentLang === 'ja' ? '向いている会社文化' : 'Suitable company culture'}</li>
                            <li>✨ ${currentLang === 'ja' ? 'おすすめの業種・職種' : 'Recommended industries & roles'}</li>
                            <li>✨ ${currentLang === 'ja' ? 'キャリア戦略アドバイス' : 'Career strategy advice'}</li>
                        </ul>
                    </div>
                    <button onclick="showPremiumModal()" class="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-105 shadow-lg">
                        <i class="fas fa-crown mr-2"></i>
                        ${currentLang === 'ja' ? 'プレミアム版にアップグレード ¥500' : 'Upgrade to Premium $5'}
                    </button>
                </div>
                
                <!-- プレミアムコンテンツ（購入後表示） -->
                <div id="workCompatibilityUnlocked" class="hidden">
                    <div class="space-y-4 text-gray-700">
                        <div class="bg-blue-50 p-4 rounded-xl">
                            <h5 class="font-bold text-blue-700 mb-2 flex items-center">
                                <i class="fas fa-user-tie mr-2"></i>
                                ${currentLang === 'ja' ? '相性の良い上司タイプ' : 'Compatible Boss Types'}
                            </h5>
                            <p class="text-sm" id="compatibleBoss"></p>
                        </div>
                        <div class="bg-green-50 p-4 rounded-xl">
                            <h5 class="font-bold text-green-700 mb-2 flex items-center">
                                <i class="fas fa-users mr-2"></i>
                                ${currentLang === 'ja' ? '相性の良い部下タイプ' : 'Compatible Subordinate Types'}
                            </h5>
                            <p class="text-sm" id="compatibleSubordinate"></p>
                        </div>
                        <div class="bg-purple-50 p-4 rounded-xl">
                            <h5 class="font-bold text-purple-700 mb-2 flex items-center">
                                <i class="fas fa-building mr-2"></i>
                                ${currentLang === 'ja' ? '向いている会社文化' : 'Suitable Company Culture'}
                            </h5>
                            <p class="text-sm" id="companyCulture"></p>
                        </div>
                        <div class="bg-orange-50 p-4 rounded-xl">
                            <h5 class="font-bold text-orange-700 mb-2 flex items-center">
                                <i class="fas fa-briefcase mr-2"></i>
                                ${currentLang === 'ja' ? 'おすすめの業種・職種' : 'Recommended Industries & Roles'}
                            </h5>
                            <p class="text-sm" id="recommendedIndustries"></p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        
        <!-- ソーシャル共有ボタン -->
        <div class="bg-white p-6 rounded-2xl shadow-lg mb-4 border-2 border-purple-100">
            <h4 class="text-xl font-bold mb-4 text-center">
                <span class="text-2xl mr-2">📢</span>
                <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    ${currentLang === 'ja' ? '診断結果をシェア' : 'Share Your Result'}
                </span>
            </h4>
            <div class="flex flex-wrap gap-3 justify-center">
                <button onclick="shareToTwitter()" class="flex items-center gap-2 bg-[#1DA1F2] hover:bg-[#1a8cd8] text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-105">
                    <i class="fab fa-twitter text-xl"></i>
                    <span>Twitter</span>
                </button>
                <button onclick="shareToFacebook()" class="flex items-center gap-2 bg-[#4267B2] hover:bg-[#365899] text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-105">
                    <i class="fab fa-facebook-f text-xl"></i>
                    <span>Facebook</span>
                </button>
                <button onclick="shareToLine()" class="flex items-center gap-2 bg-[#06C755] hover:bg-[#05b04b] text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-105">
                    <i class="fab fa-line text-xl"></i>
                    <span>LINE</span>
                </button>
                <button onclick="copyToClipboard()" class="flex items-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-bold py-3 px-6 rounded-xl transition transform hover:scale-105">
                    <i class="fas fa-link text-xl"></i>
                    <span>${currentLang === 'ja' ? 'リンクをコピー' : 'Copy Link'}</span>
                </button>
            </div>
        </div>
        
        <!-- チーム形成セクション -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 p-4 md:p-6 rounded-2xl">
            <h4 class="text-xl font-bold mb-3 text-center">
                <span class="text-2xl mr-2">👥</span>
                <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    ${currentLang === 'ja' ? 'チーム形成' : 'Team Formation'}
                </span>
            </h4>
            <p class="text-gray-700 text-center mb-4 text-sm md:text-base px-2">
                ${currentLang === 'ja' ? 'チームコードで参加するか、新しいチームを作成しよう！' : 'Join with team code or create a new team!'}
            </p>
            
            <!-- チームコード入力 -->
            <div class="mb-4">
                <label class="block text-gray-700 mb-2 font-semibold text-sm md:text-base">
                    <i class="fas fa-key mr-2"></i>${currentLang === 'ja' ? 'チームコードを入力' : 'Enter Team Code'}
                </label>
                <div class="flex gap-2">
                    <input type="text" id="teamCodeInput" placeholder="${currentLang === 'ja' ? 'チームコード (例: TEAM-123)' : 'Team Code (e.g., TEAM-123)'}" 
                           class="flex-1 px-4 py-3 rounded-xl border-2 border-gray-300 focus:border-purple-500 focus:outline-none text-sm md:text-base">
                    <button onclick="joinTeamByCode()" class="bg-gradient-to-r from-green-500 to-teal-600 hover:from-green-600 hover:to-teal-700 text-white font-bold px-4 md:px-6 py-3 rounded-xl transition transform hover:scale-105 text-sm md:text-base whitespace-nowrap">
                        ${currentLang === 'ja' ? '参加' : 'Join'}
                    </button>
                </div>
            </div>
            
            <div class="text-center text-gray-500 my-3 text-sm">
                ${currentLang === 'ja' ? 'または' : 'or'}
            </div>
            
            <!-- 新しいチーム作成 -->
            <button onclick="createNewTeam()" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-3 md:py-4 px-6 rounded-xl transition transform hover:scale-105 text-sm md:text-base">
                <i class="fas fa-plus-circle mr-2"></i>
                ${currentLang === 'ja' ? '新しいチームを作成' : 'Create New Team'}
            </button>
        </div>
        
        <!-- 詳細分析お問い合わせセクション -->
        <div class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 border-2 border-indigo-300 p-4 md:p-6 rounded-2xl mt-4">
            <h4 class="text-xl font-bold mb-3 text-center">
                <span class="text-2xl mr-2">🔮</span>
                <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                    ${currentLang === 'ja' ? 'さらに詳しい分析をご希望の方へ' : 'Want Deeper Analysis?'}
                </span>
            </h4>
            <p class="text-gray-700 text-center mb-4 text-sm md:text-base px-2 leading-relaxed">
                ${currentLang === 'ja' 
                    ? 'より詳細なパーソナリティ分析や、具体的な未来予測、キャリアアドバイスをご希望の方は、専門チームにご相談ください。' 
                    : 'For detailed personality analysis, specific future predictions, and career advice, consult with our expert team.'}
            </p>
            <div class="flex flex-col md:flex-row gap-3 justify-center">
                <a href="/contact" class="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold py-3 md:py-4 px-6 rounded-xl transition transform hover:scale-105 text-center text-sm md:text-base shadow-lg">
                    <i class="fas fa-envelope mr-2"></i>
                    ${currentLang === 'ja' ? 'お問い合わせ' : 'Contact Us'}
                </a>
                <a href="https://www.crossproducers.com" target="_blank" rel="noopener noreferrer" class="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3 md:py-4 px-6 rounded-xl transition transform hover:scale-105 text-center text-sm md:text-base shadow-lg">
                    <i class="fas fa-external-link-alt mr-2"></i>
                    ${currentLang === 'ja' ? '公式サイトへ' : 'Visit Website'}
                </a>
            </div>
            <p class="text-xs text-gray-500 text-center mt-4">
                <i class="fas fa-info-circle mr-1"></i>
                ${currentLang === 'ja' 
                    ? '専門的なコンサルティングサービスをご提供しています' 
                    : 'Professional consulting services available'}
            </p>
        </div>
    `;
    
    document.getElementById('result').innerHTML = resultHTML;
    document.getElementById('step2').classList.remove('hidden');
    
    // プレミアムステータスをチェックしてコンテンツをアンロック
    unlockPremiumContent();
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

// ソーシャル共有機能
function shareToTwitter() {
    if (!currentReading || !currentReading.apostleType) return;
    
    const apostleType = currentReading.apostleType;
    const text = `I'm ${apostleType.name_en}! ${apostleType.icon}\n\nDiscover your divine personality type through palm reading! ✨🤲`;
    const url = window.location.href;
    const hashtags = '12Apostles,PalmReading,PersonalityTest';
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}&hashtags=${hashtags}`;
    window.open(twitterUrl, '_blank', 'width=550,height=420');
}

function shareToFacebook() {
    const url = window.location.href;
    const facebookUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`;
    window.open(facebookUrl, '_blank', 'width=550,height=420');
}

function shareToLine() {
    if (!currentReading || !currentReading.apostleType) return;
    
    const apostleType = currentReading.apostleType;
    const text = `I'm ${apostleType.name_en}! ${apostleType.icon}\n\nDiscover your divine personality type! ✨`;
    const url = window.location.href;
    
    const lineUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`;
    window.open(lineUrl, '_blank', 'width=550,height=420');
}

function copyToClipboard() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        alert('✅ Link copied to clipboard!');
    }).catch(err => {
        console.error('Failed to copy:', err);
        alert('❌ Failed to copy link');
    });
}

// チーム自動形成機能
async function autoMatchTeam() {
    if (!currentUserId) {
        alert('❌ User ID not found. Please try the palm reading again.');
        return;
    }
    
    const button = event.target;
    button.disabled = true;
    button.innerHTML = '<i class="fas fa-spinner fa-spin mr-2"></i>Matching...';
    
    try {
        const response = await axios.post('/api/auto-match', {
            userId: currentUserId
        });
        
        const data = response.data;
        
        if (data.matched) {
            alert(`🎉 Team matched successfully!\n\nTeam: ${data.teamName}\nMembers: ${data.memberCount}\nBalance Score: ${data.balanceScore}%\n\nRedirecting to team page...`);
            
            // チーム詳細ページへリダイレクト
            window.location.href = `/team/${data.teamId}`;
        } else {
            alert(`⏳ ${data.message}\n\nYou'll be matched when more users join!`);
            button.disabled = false;
            button.innerHTML = '<i class="fas fa-users mr-2"></i>Find My Team Now!';
        }
    } catch (error) {
        console.error('Team matching error:', error);
        alert('❌ Failed to match team. Please try again later.');
        button.disabled = false;
        button.innerHTML = '<i class="fas fa-users mr-2"></i>Find My Team Now!';
    }
}

// 新しいチーム作成
async function createNewTeam() {
    if (!currentUserId) {
        alert(currentLang === 'ja' ? '❌ ユーザーIDが見つかりません。もう一度診断してください。' : '❌ User ID not found. Please try the palm reading again.');
        return;
    }
    
    const teamName = prompt(currentLang === 'ja' ? 'チーム名を入力してください:' : 'Enter team name:');
    if (!teamName) return;
    
    try {
        const response = await axios.post('/api/create-team', {
            teamName: teamName,
            userIds: [currentUserId]
        });
        
        const { teamId, teamCode } = response.data;
        
        alert(currentLang === 'ja' 
            ? `🎉 チームが作成されました！\n\nチーム名: ${teamName}\nチームコード: ${teamCode}\n\nこのコードを共有して、メンバーを招待しましょう！`
            : `🎉 Team created successfully!\n\nTeam Name: ${teamName}\nTeam Code: ${teamCode}\n\nShare this code to invite members!`
        );
        
        window.location.href = `/team/${teamId}`;
    } catch (error) {
        console.error('Team creation error:', error);
        alert(currentLang === 'ja' ? '❌ チーム作成に失敗しました。' : '❌ Failed to create team.');
    }
}

// チームコードで参加
async function joinTeamByCode() {
    if (!currentUserId) {
        alert(currentLang === 'ja' ? '❌ ユーザーIDが見つかりません。もう一度診断してください。' : '❌ User ID not found. Please try the palm reading again.');
        return;
    }
    
    const teamCode = document.getElementById('teamCodeInput').value.trim();
    if (!teamCode) {
        alert(currentLang === 'ja' ? 'チームコードを入力してください。' : 'Please enter a team code.');
        return;
    }
    
    try {
        const response = await axios.post('/api/join-team', {
            teamCode: teamCode,
            userId: currentUserId
        });
        
        const { teamId, teamName } = response.data;
        
        alert(currentLang === 'ja'
            ? `🎉 チームに参加しました！\n\nチーム名: ${teamName}`
            : `🎉 Successfully joined the team!\n\nTeam Name: ${teamName}`
        );
        
        window.location.href = `/team/${teamId}`;
    } catch (error) {
        console.error('Join team error:', error);
        const errorMsg = error.response?.data?.error || (currentLang === 'ja' ? 'チームへの参加に失敗しました。' : 'Failed to join team.');
        alert(`❌ ${errorMsg}`);
    }
}

// プレミアムモーダル表示
function showPremiumModal() {
    const modal = document.createElement('div');
    modal.id = 'premiumModal';
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl relative animate-fadeIn">
            <button onclick="closePremiumModal()" class="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl">
                <i class="fas fa-times"></i>
            </button>
            
            <div class="text-center mb-6">
                <div class="text-6xl mb-4">👑</div>
                <h3 class="text-2xl md:text-3xl font-extrabold mb-2">
                    <span class="bg-gradient-to-r from-yellow-400 to-orange-500 bg-clip-text text-transparent">
                        ${currentLang === 'ja' ? 'プレミアム版' : 'Premium Edition'}
                    </span>
                </h3>
                <p class="text-gray-600 text-sm md:text-base">
                    ${currentLang === 'ja' ? '詳細な分析とキャリアアドバイスをアンロック' : 'Unlock detailed analysis & career advice'}
                </p>
            </div>
            
            <div class="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-2xl mb-6">
                <h4 class="font-bold text-purple-700 mb-3 flex items-center justify-center">
                    <i class="fas fa-star mr-2"></i>
                    ${currentLang === 'ja' ? 'プレミアム特典' : 'Premium Features'}
                </h4>
                <ul class="text-sm text-gray-700 space-y-2">
                    <li class="flex items-start">
                        <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                        <span>${currentLang === 'ja' ? '詳細な仕事の相性診断' : 'Detailed work compatibility analysis'}</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                        <span>${currentLang === 'ja' ? '未来予測の詳細レポート' : 'Detailed future prediction report'}</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                        <span>${currentLang === 'ja' ? 'キャリア戦略アドバイス' : 'Career strategy advice'}</span>
                    </li>
                    <li class="flex items-start">
                        <i class="fas fa-check-circle text-green-500 mr-2 mt-1"></i>
                        <span>${currentLang === 'ja' ? 'PDFレポートダウンロード' : 'PDF report download'}</span>
                    </li>
                </ul>
            </div>
            
            <div class="text-center mb-6">
                <p class="text-3xl font-bold text-purple-600 mb-1">
                    ${currentLang === 'ja' ? '¥500' : '$5'}
                </p>
                <p class="text-xs text-gray-500">
                    ${currentLang === 'ja' ? '買い切り・永久アクセス' : 'One-time payment, lifetime access'}
                </p>
            </div>
            
            <div class="space-y-3">
                <button onclick="purchaseWithStripe()" class="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 shadow-lg flex items-center justify-center">
                    <i class="fab fa-cc-stripe text-2xl mr-3"></i>
                    <span>${currentLang === 'ja' ? 'クレジットカードで購入' : 'Pay with Credit Card'}</span>
                </button>
                
                <button onclick="purchaseWithPayPal()" class="w-full bg-gradient-to-r from-yellow-400 to-yellow-500 hover:from-yellow-500 hover:to-yellow-600 text-gray-800 font-bold py-4 px-6 rounded-xl transition transform hover:scale-105 shadow-lg flex items-center justify-center">
                    <i class="fab fa-paypal text-2xl mr-3"></i>
                    <span>${currentLang === 'ja' ? 'PayPalで購入' : 'Pay with PayPal'}</span>
                </button>
            </div>
            
            <p class="text-xs text-gray-400 text-center mt-4">
                <i class="fas fa-lock mr-1"></i>
                ${currentLang === 'ja' ? '安全な決済処理' : 'Secure payment processing'}
            </p>
        </div>
    `;
    
    document.body.appendChild(modal);
}

function closePremiumModal() {
    const modal = document.getElementById('premiumModal');
    if (modal) {
        modal.remove();
    }
}

// Stripe決済
async function purchaseWithStripe() {
    if (!currentUserId) {
        alert(currentLang === 'ja' ? 'ユーザー情報が見つかりません' : 'User information not found');
        return;
    }
    
    try {
        // Stripe Checkout セッション作成
        const response = await axios.post('/api/create-checkout-session', {
            userId: currentUserId,
            paymentMethod: 'stripe'
        });
        
        // Stripeのチェックアウトページにリダイレクト
        window.location.href = response.data.checkoutUrl;
    } catch (error) {
        console.error('Stripe payment error:', error);
        alert(currentLang === 'ja' ? '決済処理に失敗しました' : 'Payment processing failed');
    }
}

// PayPal決済
async function purchaseWithPayPal() {
    if (!currentUserId) {
        alert(currentLang === 'ja' ? 'ユーザー情報が見つかりません' : 'User information not found');
        return;
    }
    
    try {
        // PayPal注文作成
        const response = await axios.post('/api/create-paypal-order', {
            userId: currentUserId,
            paymentMethod: 'paypal'
        });
        
        // PayPalのチェックアウトページにリダイレクト
        window.location.href = response.data.approvalUrl;
    } catch (error) {
        console.error('PayPal payment error:', error);
        alert(currentLang === 'ja' ? '決済処理に失敗しました' : 'Payment processing failed');
    }
}

// プレミアムステータス確認
async function checkPremiumStatus() {
    if (!currentUserId) return false;
    
    try {
        const response = await axios.get(`/api/check-premium/${currentUserId}`);
        return response.data.isPremium;
    } catch (error) {
        console.error('Premium status check error:', error);
        return false;
    }
}

// プレミアムコンテンツのアンロック
async function unlockPremiumContent() {
    const isPremium = await checkPremiumStatus();
    
    if (isPremium) {
        document.getElementById('workCompatibilityLocked').classList.add('hidden');
        document.getElementById('workCompatibilityUnlocked').classList.remove('hidden');
        
        // プレミアムコンテンツを読み込む
        await loadPremiumWorkCompatibility();
    }
}

// 仕事の相性データを読み込む
async function loadPremiumWorkCompatibility() {
    if (!currentReading || !currentReading.apostleType) return;
    
    const typeId = currentReading.apostleType.id;
    
    try {
        const response = await axios.get(`/api/work-compatibility/${typeId}`);
        const data = response.data;
        
        document.getElementById('compatibleBoss').textContent = data.compatibleBoss || 'Loading...';
        document.getElementById('compatibleSubordinate').textContent = data.compatibleSubordinate || 'Loading...';
        document.getElementById('companyCulture').textContent = data.companyCulture || 'Loading...';
        document.getElementById('recommendedIndustries').textContent = data.recommendedIndustries || 'Loading...';
    } catch (error) {
        console.error('Load work compatibility error:', error);
    }
}
