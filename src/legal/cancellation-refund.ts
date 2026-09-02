import {
  LEGAL_VERSION,
  type LegalDocument,
} from './meta'

export const cancellationRefundPolicy: LegalDocument = {
  id: 'cancellation',
  type: 'cancellation_refund',
  version: LEGAL_VERSION,
  locales: {
    en: {
      title: 'Cancellation & Refund Policy',
      subtitle: 'GarageFinder',
      effectiveDate: '2 September 2026',
      lastUpdated: '2 September 2026',
      sections: [
        {
          id: '1',
          title: 'Cancellations and refunds',
          paragraphs: [
            'Appointments, quotes, Products and Services are provided by independent Automotive Service Providers.',
            'Cancellation and refund terms for a specific transaction are primarily between the Customer and the Provider, subject to applicable Bahrain consumer-protection law.',
            'Where the scope or price of work changes materially, Customers should obtain confirmation from the Provider before authorizing additional work.',
            'GarageFinder does not become the seller or service provider merely because a booking, quote or payment record appears on the Platform.',
            'If online payment processing is introduced later, additional payment and refund terms may apply.',
            'See Customer Terms of Use Sections 8, 13 and 14.',
          ],
        },
      ],
    },
    ar: {
      title: 'سياسة الإلغاء والاسترداد',
      subtitle: 'GarageFinder',
      effectiveDate: '2 سبتمبر 2026',
      lastUpdated: '2 سبتمبر 2026',
      sections: [
        {
          id: '1',
          title: 'الإلغاء والاسترداد',
          paragraphs: [
            'تُقدَّم المواعيد وعروض الأسعار والمنتجات والخدمات من مزودي خدمات سيارات مستقلين.',
            'شروط الإلغاء والاسترداد لمعاملة معيّنة تكون أساساً بين العميل والمزود، مع مراعاة قانون حماية المستهلك في البحرين الساري.',
            'عند تغيّر نطاق العمل أو السعر بشكل جوهري، ينبغي على العملاء الحصول على تأكيد من المزود قبل اعتماد أي عمل إضافي.',
            'لا تصبح GarageFinder البائع أو مزود الخدمة لمجرد ظهور حجز أو عرض سعر أو سجل دفع على المنصة.',
            'إذا أُدخلت معالجة دفع إلكتروني لاحقاً، فقد تسري شروط دفع واسترداد إضافية.',
            'راجع شروط استخدام العميل الأقسام 8 و13 و14.',
          ],
        },
      ],
    },
  },
}
