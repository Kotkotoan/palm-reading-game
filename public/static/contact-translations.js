// お問い合わせページの翻訳データ
const contactTranslations = {
    en: {
        pageTitle: 'Contact Us - The ForeSight Code',
        title: 'Contact Us',
        subtitle: "We'd love to hear from you!",
        backHome: 'Back to Home',
        companyInfo: {
            title: 'Company Information',
            companyName: 'Company Name:',
            website: 'Website:'
        },
        getInTouch: {
            title: 'Get in Touch',
            content: 'For inquiries about The ForeSight Code palm reading service, please visit our company website or reach out through the contact form available there.',
            button: 'Visit Company Website'
        },
        consultation: {
            title: 'Professional Consultation Services',
            intro: 'Interested in deeper personality analysis, specific future predictions, or personalized career guidance? Our expert team offers professional consultation services tailored to your needs.',
            whatWeOffer: 'What We Offer:',
            items: [
                'In-depth personality analysis',
                'Detailed future path predictions (2026-2050)',
                'Career and life strategy consulting',
                'Team building and organizational development'
            ],
            button: 'Request Professional Consultation'
        },
        commonInquiries: {
            title: 'Common Inquiries',
            items: [
                'Service questions and technical support',
                'Privacy and data deletion requests',
                'Partnership and business inquiries',
                'Feedback and suggestions'
            ]
        }
    },
    ja: {
        pageTitle: 'お問い合わせ - The ForeSight Code',
        title: 'お問い合わせ',
        subtitle: 'お気軽にお問い合わせください！',
        backHome: 'ホームに戻る',
        companyInfo: {
            title: '会社情報',
            companyName: '会社名:',
            website: 'ウェブサイト:'
        },
        getInTouch: {
            title: 'お問い合わせ',
            content: 'The ForeSight Code手相診断サービスに関するお問い合わせは、当社ウェブサイトをご覧いただくか、そちらのお問い合わせフォームからお問い合わせください。',
            button: '会社ウェブサイトを訪問'
        },
        consultation: {
            title: 'プロフェッショナルコンサルテーションサービス',
            intro: 'より深い性格分析、具体的な未来予測、パーソナライズされたキャリアガイダンスにご興味はありませんか？当社の専門チームが、お客様のニーズに合わせたプロフェッショナルなコンサルテーションサービスを提供しています。',
            whatWeOffer: '提供サービス:',
            items: [
                '詳細な性格分析',
                '将来のキャリアパス予測（2026年〜2050年）',
                'キャリアと人生戦略コンサルティング',
                'チームビルディングと組織開発'
            ],
            button: 'プロフェッショナルコンサルテーションを依頼'
        },
        commonInquiries: {
            title: 'よくあるお問い合わせ',
            items: [
                'サービスに関するご質問と技術サポート',
                'プライバシーとデータ削除リクエスト',
                'パートナーシップとビジネスに関するお問い合わせ',
                'フィードバックとご提案'
            ]
        }
    }
};

// 言語の取得と設定
let currentLang = localStorage.getItem('lang') || 'ja';

function t(key) {
    const keys = key.split('.');
    let value = contactTranslations[currentLang];
    for (const k of keys) {
        value = value[k];
        if (!value) break;
    }
    return value || key;
}

function switchLanguage() {
    currentLang = currentLang === 'en' ? 'ja' : 'en';
    localStorage.setItem('lang', currentLang);
    location.reload();
}

// ページロード時に翻訳を適用
document.addEventListener('DOMContentLoaded', () => {
    document.title = t('pageTitle');
    
    // タイトル
    document.querySelector('.page-title').textContent = t('title');
    document.querySelector('.page-subtitle').textContent = t('subtitle');
    document.querySelector('.back-home-text').textContent = t('backHome');
    
    // 会社情報
    document.querySelector('.company-info-title').textContent = t('companyInfo.title');
    document.querySelector('.company-name-label').textContent = t('companyInfo.companyName');
    document.querySelector('.website-label').textContent = t('companyInfo.website');
    
    // お問い合わせ
    document.querySelector('.get-in-touch-title').textContent = t('getInTouch.title');
    document.querySelector('.get-in-touch-content').textContent = t('getInTouch.content');
    document.querySelector('.get-in-touch-button').textContent = t('getInTouch.button');
    
    // コンサルテーション
    document.querySelector('.consultation-title').textContent = t('consultation.title');
    document.querySelector('.consultation-intro').textContent = t('consultation.intro');
    document.querySelector('.consultation-what-we-offer').textContent = t('consultation.whatWeOffer');
    const consultationList = document.querySelector('.consultation-list');
    consultationList.innerHTML = t('consultation.items').map(item => 
        `<li><i class="fas fa-chevron-right text-purple-500 mr-2"></i>${item}</li>`
    ).join('');
    document.querySelector('.consultation-button').textContent = t('consultation.button');
    
    // よくあるお問い合わせ
    document.querySelector('.common-inquiries-title').textContent = t('commonInquiries.title');
    const inquiriesList = document.querySelector('.common-inquiries-list');
    inquiriesList.innerHTML = t('commonInquiries.items').map(item => 
        `<li><i class="fas fa-check text-green-600 mr-2"></i>${item}</li>`
    ).join('');
    
    // 言語切り替えボタン
    document.querySelector('.lang-text').textContent = currentLang === 'ja' ? 'English' : '日本語';
});
