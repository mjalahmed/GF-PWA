import {
  LEGAL_VERSION,
  type LegalDocument,
} from './meta'

export const reviewPolicy: LegalDocument = {
  id: 'reviews',
  type: 'review_policy',
  version: LEGAL_VERSION,
  locales: {
    en: {
      title: 'Review Policy',
      subtitle: 'GarageFinder',
      effectiveDate: '2 September 2026',
      lastUpdated: '2 September 2026',
      sections: [
        {
          id: '1',
          title: 'Reviews and ratings',
          paragraphs: [
            'Reviews must reflect genuine experiences, be reasonably accurate, relate to the relevant Provider or transaction, and must not contain unlawful, abusive, threatening, discriminatory or intentionally misleading material.',
            'Reviews must not be submitted in exchange for undisclosed compensation.',
            'GarageFinder may remove, restrict or moderate content that violates Platform rules or applicable law.',
            'Providers must not manipulate reviews, create fake accounts, threaten Customers for negative reviews, or improperly incentivize reviews.',
            'See Customer Terms of Use Section 15 and Provider Agreement Section 15.',
          ],
        },
      ],
    },
    ar: {
      title: 'سياسة التقييمات',
      subtitle: 'GarageFinder',
      effectiveDate: '2 سبتمبر 2026',
      lastUpdated: '2 سبتمبر 2026',
      sections: [
        {
          id: '1',
          title: 'التقييمات والمراجعات',
          paragraphs: [
            'يجب أن تعكس المراجعات تجارب حقيقية، وأن تكون دقيقة بشكل معقول، وأن تتعلق بالمزود أو المعاملة ذات الصلة، وألا تتضمن مواد غير قانونية أو مسيئة أو تهديدية أو تمييزية أو مضللة عمداً.',
            'يجب ألا تُقدَّم المراجعات مقابل تعويض غير مفصح عنه.',
            'يجوز لـ GarageFinder إزالة المحتوى الذي يخالف قواعد المنصة أو القانون الساري أو تقييده أو الإشراف عليه.',
            'يجب على المزودين عدم التلاعب بالمراجعات أو إنشاء حسابات وهمية أو تهديد العملاء بسبب مراجعات سلبية أو تحفيز المراجعات بطريقة غير سليمة.',
            'راجع شروط استخدام العميل القسم 15 واتفاقية المزود القسم 15.',
          ],
        },
      ],
    },
  },
}
