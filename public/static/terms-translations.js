// 利用規約ページの翻訳データ
const termsTranslations = {
    en: {
        pageTitle: 'Terms of Service - The ForeSight Code',
        title: 'Terms of Service',
        lastUpdated: 'Last Updated: November 2, 2025',
        backHome: 'Back to Home',
        sections: {
            acceptance: {
                title: '1. Acceptance of Terms',
                content: 'By accessing and using The ForeSight Code palm reading service ("Service"), you accept and agree to be bound by the terms and provision of this agreement.'
            },
            serviceDesc: {
                title: '2. Service Description',
                content: 'The ForeSight Code is an entertainment service that analyzes palm images and provides personality type assessments based on the 12 Apostles archetypes. This service is for entertainment purposes only and should not be considered as professional advice.'
            },
            privacy: {
                title: '3. User Data and Privacy',
                items: [
                    'We collect palm images and user names to provide the service',
                    'Your data is stored securely using Cloudflare D1 database',
                    'We do not share your personal information with third parties',
                    'You can request deletion of your data by contacting us'
                ]
            },
            conduct: {
                title: '4. User Conduct',
                intro: 'You agree not to:',
                items: [
                    'Upload inappropriate or offensive content',
                    'Attempt to hack or disrupt the service',
                    'Use the service for any illegal purposes',
                    'Impersonate others or provide false information'
                ]
            },
            intellectual: {
                title: '5. Intellectual Property',
                content: 'All content, features, and functionality of the Service are owned by CROSS Business Producers Inc and are protected by international copyright, trademark, and other intellectual property laws.'
            },
            disclaimer: {
                title: '6. Disclaimer of Warranties',
                content: 'The Service is provided "as is" without warranties of any kind. We do not guarantee that the service will be uninterrupted, secure, or error-free. The personality analysis is for entertainment purposes only.'
            },
            liability: {
                title: '7. Limitation of Liability',
                content: 'CROSS Business Producers Inc shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of the Service.'
            },
            changes: {
                title: '8. Changes to Terms',
                content: 'We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting to the Service.'
            },
            contact: {
                title: '9. Contact Information',
                content: 'For questions about these Terms of Service, please contact us through our ',
                linkText: 'Contact Page'
            }
        }
    },
    ja: {
        pageTitle: '利用規約 - The ForeSight Code',
        title: '利用規約',
        lastUpdated: '最終更新日: 2025年11月2日',
        backHome: 'ホームに戻る',
        sections: {
            acceptance: {
                title: '1. 利用規約の同意',
                content: 'The ForeSight Code手相診断サービス（以下「本サービス」）にアクセスし使用することにより、お客様は本規約の条件に同意したものとみなされます。'
            },
            serviceDesc: {
                title: '2. サービスの説明',
                content: 'The ForeSight Codeは、手相画像を分析し、12使徒のアーキタイプに基づいた性格タイプ診断を提供するエンターテイメントサービスです。本サービスは娯楽目的のみであり、専門的なアドバイスとして考慮すべきではありません。'
            },
            privacy: {
                title: '3. ユーザーデータとプライバシー',
                items: [
                    'サービス提供のため、手相画像とユーザー名を収集します',
                    'お客様のデータはCloudflare D1データベースを使用して安全に保存されます',
                    'お客様の個人情報を第三者と共有することはありません',
                    'お問い合わせいただくことで、データの削除をリクエストできます'
                ]
            },
            conduct: {
                title: '4. ユーザーの行動規範',
                intro: '以下の行為を行わないことに同意していただきます：',
                items: [
                    '不適切または攻撃的なコンテンツのアップロード',
                    'サービスへのハッキングや妨害の試み',
                    '違法な目的でのサービスの使用',
                    '他者のなりすましや虚偽情報の提供'
                ]
            },
            intellectual: {
                title: '5. 知的財産権',
                content: '本サービスのすべてのコンテンツ、機能、および機能性は、CROSS Business Producers Incが所有しており、国際的な著作権、商標、その他の知的財産法によって保護されています。'
            },
            disclaimer: {
                title: '6. 保証の免責',
                content: '本サービスは「現状のまま」提供され、いかなる種類の保証もありません。サービスが中断されず、安全で、エラーがないことを保証するものではありません。性格分析は娯楽目的のみです。'
            },
            liability: {
                title: '7. 責任の制限',
                content: 'CROSS Business Producers Incは、本サービスの使用から生じる間接的、偶発的、特別、結果的、または懲罰的損害について責任を負いません。'
            },
            changes: {
                title: '8. 規約の変更',
                content: '当社は、いつでもこれらの規約を変更する権利を留保します。変更は本サービスに掲載された時点で直ちに有効になります。'
            },
            contact: {
                title: '9. お問い合わせ先',
                content: '本利用規約に関するご質問は、',
                linkText: 'お問い合わせページ',
                content2: 'からお問い合わせください。'
            }
        }
    }
};

// 言語の取得と設定
let currentLang = localStorage.getItem('lang') || 'ja';

function t(key) {
    const keys = key.split('.');
    let value = termsTranslations[currentLang];
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
    document.querySelector('.last-updated').textContent = t('lastUpdated');
    document.querySelector('.back-home-text').textContent = t('backHome');
    
    // セクション
    const sections = t('sections');
    document.querySelector('.section-acceptance-title').textContent = sections.acceptance.title;
    document.querySelector('.section-acceptance-content').textContent = sections.acceptance.content;
    
    document.querySelector('.section-service-title').textContent = sections.serviceDesc.title;
    document.querySelector('.section-service-content').textContent = sections.serviceDesc.content;
    
    document.querySelector('.section-privacy-title').textContent = sections.privacy.title;
    const privacyList = document.querySelector('.section-privacy-list');
    privacyList.innerHTML = sections.privacy.items.map(item => `<li>${item}</li>`).join('');
    
    document.querySelector('.section-conduct-title').textContent = sections.conduct.title;
    document.querySelector('.section-conduct-intro').textContent = sections.conduct.intro;
    const conductList = document.querySelector('.section-conduct-list');
    conductList.innerHTML = sections.conduct.items.map(item => `<li>${item}</li>`).join('');
    
    document.querySelector('.section-intellectual-title').textContent = sections.intellectual.title;
    document.querySelector('.section-intellectual-content').textContent = sections.intellectual.content;
    
    document.querySelector('.section-disclaimer-title').textContent = sections.disclaimer.title;
    document.querySelector('.section-disclaimer-content').textContent = sections.disclaimer.content;
    
    document.querySelector('.section-liability-title').textContent = sections.liability.title;
    document.querySelector('.section-liability-content').textContent = sections.liability.content;
    
    document.querySelector('.section-changes-title').textContent = sections.changes.title;
    document.querySelector('.section-changes-content').textContent = sections.changes.content;
    
    document.querySelector('.section-contact-title').textContent = sections.contact.title;
    document.querySelector('.section-contact-content').textContent = sections.contact.content;
    document.querySelector('.section-contact-link').textContent = sections.contact.linkText;
    if (sections.contact.content2) {
        document.querySelector('.section-contact-content2').textContent = sections.contact.content2;
    }
    
    // 言語切り替えボタン
    document.querySelector('.lang-text').textContent = currentLang === 'ja' ? 'English' : '日本語';
});
