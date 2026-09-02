import {
  LEGAL_VERSION,
  type LegalDocument,
} from './meta'

export const betaNotice: LegalDocument = {
  id: 'beta',
  type: 'beta_notice',
  version: LEGAL_VERSION,
  locales: {
    en: {
      title: 'Beta Notice',
      subtitle: 'GarageFinder',
      effectiveDate: '2 September 2026',
      lastUpdated: '2 September 2026',
      sections: [
        {
          id: '1',
          title: 'Beta status',
          paragraphs: [
            'During the beta phase, GarageFinder is provided for testing, evaluation and product development.',
            'The beta may contain incomplete functionality, errors, service interruptions, changes to features, temporary limitations, inaccurate or incomplete information and experimental features.',
            'GarageFinder may modify, suspend or discontinue beta functionality. Beta participation does not create a guarantee that any particular feature will remain available.',
            'For the full terms, see the Customer Terms of Use (Section 20) and the Provider Agreement (Section 20).',
          ],
        },
      ],
    },
    ar: {
      title: 'إشعار التجربة',
      subtitle: 'GarageFinder',
      effectiveDate: '2 سبتمبر 2026',
      lastUpdated: '2 سبتمبر 2026',
      sections: [
        {
          id: '1',
          title: 'حالة التجربة',
          paragraphs: [
            'خلال مرحلة التجربة، تُقدَّم GarageFinder لأغراض الاختبار والتقييم وتطوير المنتج.',
            'قد تتضمن النسخة التجريبية وظائف غير مكتملة وأخطاء وانقطاعات في الخدمة وتغييرات في الميزات وقيوداً مؤقتة ومعلومات غير دقيقة أو غير مكتملة وميزات تجريبية.',
            'يجوز لـ GarageFinder تعديل وظائف التجربة أو تعليقها أو إيقافها. المشاركة في التجربة لا تنشئ ضماناً باستمرار توفر أي ميزة معيّنة.',
            'للاطلاع على الشروط الكاملة، راجع شروط استخدام العميل (القسم 20) واتفاقية المزود (القسم 20).',
          ],
        },
      ],
    },
  },
}
