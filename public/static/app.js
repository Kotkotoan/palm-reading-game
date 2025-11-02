// グローバル変数
let currentUserId = null;
let currentReading = null;
let currentLang = localStorage.getItem('lang') || 'en';

// 翻訳データ
const translations = {
    en: {
        title: 'The ForeSight Code',
        subtitle: 'The Algorithm of Purpose',
        description: 'The algorithm that moves your mission.',
        conceptTitle: 'What drives CROSS Graph is not technology.',
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
        conceptTitle: 'CROSS Graphを動かすのは、テクノロジーではない。',
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
            
            <!-- 詳細な性格分析 -->
            <div class="bg-white p-6 rounded-2xl shadow-lg mb-4 border-2 border-purple-100">
                <h4 class="text-2xl font-bold mb-4 flex items-center justify-center">
                    <span class="text-3xl mr-2">🌟</span>
                    <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                        Detailed Personality Analysis
                    </span>
                </h4>
                <div class="bg-gradient-to-br from-purple-50 to-pink-50 p-5 rounded-xl mb-4">
                    <p class="text-gray-700 leading-relaxed text-base">
                        ${apostleType.detailed_personality || apostleType.description}
                    </p>
                </div>
                <div class="space-y-3 text-gray-700">
                    <p class="flex items-start bg-purple-50 p-3 rounded-xl">
                        <span class="text-purple-600 mr-2 mt-1">💫</span>
                        <span><strong>Key Traits:</strong> ${apostleType.characteristics}</span>
                    </p>
                    <p class="flex items-start bg-pink-50 p-3 rounded-xl">
                        <span class="text-pink-600 mr-2 mt-1">💪</span>
                        <span><strong>Core Strengths:</strong> ${apostleType.strengths}</span>
                    </p>
                </div>
                <div class="mt-4 pt-4 border-t border-gray-200 text-center">
                    <p class="text-sm text-gray-600 font-semibold">
                        <i class="fas fa-chart-line mr-2 text-purple-500"></i>
                        Analysis Accuracy: ${(confidence * 100).toFixed(1)}%
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
            
            <!-- 未来予測: 2026-2050 -->
            <div class="bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6 rounded-2xl shadow-lg mb-4 border-2 border-indigo-200">
                <h4 class="text-2xl font-bold mb-6 flex items-center justify-center">
                    <span class="text-3xl mr-2">🔮</span>
                    <span class="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                        Your Future Path (2026-2050)
                    </span>
                </h4>
                
                <!-- 2026-2028: 近未来 -->
                <div class="mb-5">
                    <div class="flex items-center mb-3">
                        <span class="bg-gradient-to-r from-blue-500 to-cyan-500 text-white px-4 py-2 rounded-full text-sm font-bold mr-3">
                            2026 - 2028
                        </span>
                        <span class="text-gray-600 font-semibold">Near Future</span>
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
                        <span class="text-gray-600 font-semibold">Mid-term Future</span>
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
                        <span class="text-gray-600 font-semibold">Long-term Future</span>
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
                        <strong>Note:</strong> This forecast is based on current macro social trends and your personality analysis.
                    </p>
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
        
        <!-- ソーシャル共有ボタン -->
        <div class="bg-white p-6 rounded-2xl shadow-lg mb-4 border-2 border-purple-100">
            <h4 class="text-xl font-bold mb-4 text-center">
                <span class="text-2xl mr-2">📢</span>
                <span class="bg-gradient-to-r from-purple-600 to-pink-500 bg-clip-text text-transparent">
                    Share Your Result
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
                    <span>Copy Link</span>
                </button>
            </div>
        </div>
        
        <!-- チーム形成セクション -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 p-6 rounded-2xl">
            <h4 class="text-xl font-bold mb-3 text-center">
                <span class="text-2xl mr-2">👥</span>
                <span class="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Team Formation
                </span>
            </h4>
            <p class="text-gray-700 text-center mb-4">
                Find the perfect team with balanced personality types!
            </p>
            <button onclick="autoMatchTeam()" class="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-6 rounded-xl transition transform hover:scale-105">
                <i class="fas fa-users mr-2"></i>
                Find My Team Now!
            </button>
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
