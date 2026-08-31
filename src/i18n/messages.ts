import type { Locale } from './locale'

const en = {
  'nav.home': 'Home',
  'nav.search': 'Search',
  'nav.appointments': 'Appointments',
  'nav.invoices': 'Invoices',
  'nav.profile': 'Profile',

  'lang.chooseTitle': 'Choose your language',
  'lang.chooseSubtitle': 'You can change this anytime in Profile.',
  'lang.english': 'English',
  'lang.arabic': 'العربية',
  'lang.symbolEn': 'A',
  'lang.symbolAr': 'ع',
  'lang.label': 'Language',

  'profile.title': 'Profile',
  'profile.signInPrompt': 'Sign in to manage your profile and vehicles.',
  'profile.signIn': 'Sign in',
  'profile.edit': 'Edit',
  'profile.save': 'Save',
  'profile.cancel': 'Cancel',
  'profile.fullName': 'Full name',
  'profile.phone': 'Phone',
  'profile.signOut': 'Sign out',
  'profile.defaultName': 'GarageFinder user',
  'profile.saveError': 'Could not save profile',
  'profile.vehicles': 'My vehicles',
  'profile.favorites': 'Favorites',
  'profile.appointments': 'Appointments',
  'profile.invoices': 'Invoices',
  'profile.quotations': 'Quotations',
  'profile.reviews': 'Reviews',
  'profile.disputes': 'Disputes',

  'common.back': 'Go back',
  'common.loading': 'Loading…',
} as const

type MessageKey = keyof typeof en

const ar: Record<MessageKey, string> = {
  'nav.home': 'الرئيسية',
  'nav.search': 'بحث',
  'nav.appointments': 'المواعيد',
  'nav.invoices': 'الفواتير',
  'nav.profile': 'الحساب',

  'lang.chooseTitle': 'اختر لغتك',
  'lang.chooseSubtitle': 'يمكنك تغييرها لاحقاً من الحساب.',
  'lang.english': 'English',
  'lang.arabic': 'العربية',
  'lang.symbolEn': 'A',
  'lang.symbolAr': 'ع',
  'lang.label': 'اللغة',

  'profile.title': 'الحساب',
  'profile.signInPrompt': 'سجّل الدخول لإدارة حسابك ومركباتك.',
  'profile.signIn': 'تسجيل الدخول',
  'profile.edit': 'تعديل',
  'profile.save': 'حفظ',
  'profile.cancel': 'إلغاء',
  'profile.fullName': 'الاسم الكامل',
  'profile.phone': 'الهاتف',
  'profile.signOut': 'تسجيل الخروج',
  'profile.defaultName': 'مستخدم GarageFinder',
  'profile.saveError': 'تعذر حفظ الملف الشخصي',
  'profile.vehicles': 'مركباتي',
  'profile.favorites': 'المفضلة',
  'profile.appointments': 'المواعيد',
  'profile.invoices': 'الفواتير',
  'profile.quotations': 'عروض الأسعار',
  'profile.reviews': 'التقييمات',
  'profile.disputes': 'النزاعات',

  'common.back': 'رجوع',
  'common.loading': 'جارٍ التحميل…',
}

const catalogs: Record<Locale, Record<MessageKey, string>> = { en, ar }

export type { MessageKey }

export function translate(locale: Locale, key: MessageKey): string {
  return catalogs[locale][key] ?? catalogs.en[key] ?? key
}
