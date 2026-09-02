import {
  LEGAL_VERSION,
  type LegalDocument,
} from './meta'

export const disputePolicy: LegalDocument = {
  id: 'disputes',
  type: 'dispute_policy',
  version: LEGAL_VERSION,
  locales: {
    en: {
      title: 'Dispute Policy',
      subtitle: 'GarageFinder',
      effectiveDate: '2 September 2026',
      lastUpdated: '2 September 2026',
      sections: [
        {
          id: '1',
          title: 'Disputes between Customers and Providers',
          paragraphs: [
            'Where a dispute concerns the actual Product or Service, the primary parties to that transaction are the Customer and the Automotive Service Provider.',
            'GarageFinder may provide a dispute-reporting or support mechanism and may request evidence such as quotations, invoices, photographs, messages, appointment records, payment records and service records.',
            'GarageFinder may facilitate communication but does not guarantee that it will determine liability or compensate either party.',
            'Nothing in this policy prevents a Customer from exercising mandatory rights available under applicable Bahrain law.',
            'See Customer Terms of Use Section 16 and Provider Agreement Section 16.',
          ],
        },
      ],
    },
    ar: {
      title: 'سياسة النزاعات',
      subtitle: 'GarageFinder',
      effectiveDate: '2 سبتمبر 2026',
      lastUpdated: '2 سبتمبر 2026',
      sections: [
        {
          id: '1',
          title: 'النزاعات بين العملاء والمزودين',
          paragraphs: [
            'عندما يتعلق النزاع بالمنتج أو الخدمة الفعلية، فإن الطرفين الأساسيين في تلك المعاملة هما العميل ومزود خدمات السيارات.',
            'قد توفّر GarageFinder آلية للإبلاغ عن النزاعات أو الدعم، وقد تطلب أدلة مثل عروض الأسعار والفواتير والصور والرسائل وسجلات المواعيد والمدفوعات والخدمة.',
            'قد تسهّل GarageFinder التواصل لكنها لا تضمن البت في المسؤولية أو تعويض أي طرف.',
            'لا شيء في هذه السياسة يمنع العميل من ممارسة الحقوق الإلزامية المتاحة بموجب قانون البحرين الساري.',
            'راجع شروط استخدام العميل القسم 16 واتفاقية المزود القسم 16.',
          ],
        },
      ],
    },
  },
}
