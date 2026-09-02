import {
  LEGAL_VERSION,
  type LegalDocument,
} from './meta'

export const customerTerms: LegalDocument = {
  id: 'terms',
  type: 'customer_terms',
  version: LEGAL_VERSION,
  locales: {
    en: {
      title: 'Customer Terms of Use',
      subtitle: 'GarageFinder',
      effectiveDate: '2 September 2026',
      lastUpdated: '2 September 2026',
      sections: [
        {
          id: '1',
          title: '1. Introduction',
          paragraphs: [
            'These Terms of Use ("Terms") govern your access to and use of GarageFinder, including the GarageFinder website, Progressive Web App ("PWA"), mobile applications, digital services, communications, and related functionality (collectively, the "Platform").',
            'GarageFinder is an automotive-services marketplace and technology platform intended to help customers discover, compare, communicate with, request quotes from, and interact with independent automotive service providers.',
            'GarageFinder is not limited to traditional garages or mechanical workshops.',
            'Depending on availability, the Platform may include automotive service providers offering mechanical repairs and maintenance; auto electrical services; tires, wheels and alignment; batteries; car washing; car detailing; ceramic coating; paint protection film (PPF); window tinting; body repair and painting; dent repair; air-conditioning services; oil changes and routine maintenance; spare parts; automotive accessories; vehicle inspection services; towing and roadside assistance; mobile automotive services; and other automotive-related products and services.',
            'The categories, services and providers available on the Platform may change over time.',
            'By creating an account, accessing the Platform, or using any Platform functionality, you agree to these Terms. If you do not agree to these Terms, you must not use the Platform.',
          ],
        },
        {
          id: '2',
          title: '2. Definitions',
          paragraphs: [
            '"GarageFinder", "we", "us" or "our" means Mustafa Jasem AlAhmed, the operator of the GarageFinder Platform.',
            '"Customer", "you" or "your" means the individual accessing or using the Platform.',
            '"Automotive Service Provider" or "Provider" means an independent business, garage, workshop, retailer, technician, specialist, mobile service provider, towing provider, parts seller, or other business offering automotive-related products or services through the Platform.',
            '"Services" means automotive-related services offered by Providers through the Platform.',
            '"Products" means automotive parts, tires, accessories, batteries, equipment or other physical goods offered by Providers through the Platform.',
            '"Booking" means an appointment or service request submitted through the Platform.',
            '"Quote" means a price or proposed scope of work submitted by a Provider.',
            '"Platform Content" means information, software, interfaces, designs, logos, text, graphics and other content belonging to or controlled by GarageFinder.',
          ],
        },
        {
          id: '3',
          title: "3. GarageFinder's Role",
          paragraphs: [
            'GarageFinder operates as a technology platform and marketplace.',
            "Unless expressly stated otherwise, GarageFinder does not perform automotive repairs; does not wash or detail vehicles; does not sell automotive parts itself; does not provide towing or roadside assistance itself; does not inspect or physically repair vehicles; does not manufacture Products; does not employ every Provider listed on the Platform; and does not act as the customer's mechanic or technical adviser.",
            'Providers are independent businesses responsible for the Products and Services they offer.',
            "A Provider's presence on GarageFinder does not by itself create an employment, partnership, agency, franchise, joint-venture or other relationship between the Provider and GarageFinder.",
          ],
        },
        {
          id: '4',
          title: '4. Provider Verification',
          paragraphs: [
            'GarageFinder may conduct verification procedures for Providers, which may include reviewing business information, commercial registration information, contact information, service categories, identity information, licenses or permits where applicable, supporting documents, location, and other information reasonably required by GarageFinder.',
            'A "Verified" or "Verified Provider" status means only that GarageFinder has completed the verification process applicable to that Provider.',
            'Verification does not constitute a guarantee of quality, workmanship, that a Provider will meet a particular standard, that a Provider will remain compliant after verification, that a Product is suitable for a particular vehicle, or an endorsement of every Service offered by that Provider.',
            'Customers remain responsible for making appropriate decisions regarding the Provider they choose.',
          ],
        },
        {
          id: '5',
          title: '5. Accounts',
          paragraphs: [
            'Certain Platform functionality requires an account.',
            'You agree to provide accurate information; maintain accurate account information; keep your login credentials confidential; not share your account with another person; notify GarageFinder of unauthorized access; and not create accounts for fraudulent purposes.',
            'GarageFinder may suspend or terminate accounts where reasonably necessary for security, fraud prevention, abuse, legal compliance or violation of these Terms.',
          ],
        },
        {
          id: '6',
          title: '6. Vehicle Information',
          paragraphs: [
            'The Platform may allow you to store vehicle information, including make, model, year, trim, registration information, VIN, mileage, photographs, service history, repair information and maintenance information.',
            'Providing a VIN may improve vehicle identification and service accuracy but may not always be mandatory.',
            'You are responsible for ensuring that information you provide is reasonably accurate.',
            'GarageFinder does not guarantee that information supplied by a Customer or Provider is complete or correct.',
          ],
        },
        {
          id: '7',
          title: '7. Service Requests and Quotes',
          paragraphs: [
            'GarageFinder may allow Customers to submit requests for Products or Services.',
            'Providers may respond with quotes containing information such as price, estimated duration, proposed work, parts, service conditions, availability and additional requirements.',
            'A quote is provided by the Provider. GarageFinder does not independently guarantee that a quoted price is accurate, final, reasonable or technically appropriate.',
            'Unless otherwise expressly stated, the Provider is responsible for communicating any changes to the scope, price or requirements of the work.',
          ],
        },
        {
          id: '8',
          title: '8. Bookings and Appointments',
          paragraphs: [
            'Customers may use the Platform to request or schedule appointments.',
            "An appointment displayed through the Platform does not necessarily guarantee that the Provider will perform the Service exactly as originally requested if the vehicle condition differs from the information supplied, additional work is required, parts are unavailable, the Provider identifies safety issues, the Customer requests additional work, or circumstances outside the Provider's reasonable control occur.",
            'Where the scope or price changes materially, the Customer should obtain confirmation from the Provider before authorizing additional work.',
          ],
        },
        {
          id: '9',
          title: '9. Automotive Services and Safety',
          paragraphs: [
            'Automotive Services can involve significant safety and financial risks.',
            'GarageFinder does not provide professional mechanical, electrical, structural, legal or safety advice.',
            'Customers should not rely on Platform content as a substitute for professional inspection.',
            'For safety-critical matters, including braking, steering, tires, suspension, electrical systems, fuel systems or other safety-related components, Customers should obtain appropriate professional advice from a qualified Provider.',
            "GarageFinder is not responsible for a Customer's decision to operate or continue operating a vehicle.",
          ],
        },
        {
          id: '10',
          title: '10. Products and Automotive Parts',
          paragraphs: [
            'Providers may offer Products through the Platform.',
            'The Provider is responsible for product descriptions, compatibility information, authenticity, condition, pricing, warranties, applicable returns, delivery, defects and fulfillment.',
            'Customers should confirm compatibility before purchasing or installing a Product.',
            'GarageFinder does not manufacture Products and does not independently warrant their quality, authenticity, compatibility or suitability unless expressly stated otherwise.',
          ],
        },
        {
          id: '11',
          title: '11. Washing, Detailing and Vehicle Appearance Services',
          paragraphs: [
            'Vehicle washing, detailing, coating, tinting, PPF, polishing and related Services may affect vehicle surfaces, paint, trim, glass, electronics or other components.',
            'The Provider is responsible for performing the Service professionally and in accordance with applicable obligations.',
            'Customers should disclose known vehicle conditions, modifications, existing damage and other relevant information.',
            'GarageFinder does not independently guarantee the outcome of these Services.',
          ],
        },
        {
          id: '12',
          title: '12. Towing and Roadside Assistance',
          paragraphs: [
            'Towing and roadside assistance may involve urgent and safety-sensitive circumstances.',
            'The Provider is responsible for the execution of the towing or roadside Service.',
            'GarageFinder is not an emergency-response organization and does not guarantee immediate availability, response time, vehicle recovery or roadside assistance.',
            'Customers should use appropriate emergency services where an immediate threat to life or safety exists.',
          ],
        },
        {
          id: '13',
          title: '13. Payments and Cash Transactions',
          paragraphs: [
            'The Platform may support recording or communicating payment information, including cash-payment records.',
            'Where a transaction is directly between a Customer and Provider, the Provider is responsible for the transaction and for complying with applicable commercial, consumer-protection and tax requirements.',
            "GarageFinder does not become the owner of a Customer's money merely because a transaction or payment record is displayed through the Platform.",
            'If GarageFinder introduces online payment processing in the future, additional payment terms may apply.',
          ],
        },
        {
          id: '14',
          title: '14. Invoices and Receipts',
          paragraphs: [
            'Providers may issue invoices, receipts or other transaction records through or outside the Platform.',
            'The Provider remains responsible for the accuracy and legal validity of its invoices and records.',
            'GarageFinder may store transaction-related records to operate the Platform, facilitate disputes, maintain service history or comply with legal obligations.',
          ],
        },
        {
          id: '15',
          title: '15. Reviews and Ratings',
          paragraphs: [
            'Customers may be allowed to submit reviews and ratings.',
            'Reviews must reflect genuine experiences; be reasonably accurate; relate to the relevant Provider or transaction; not contain unlawful or abusive material; not contain threats; not contain discriminatory content; not intentionally mislead other users; and not be submitted in exchange for undisclosed compensation.',
            'GarageFinder may remove, restrict or moderate content that violates these Terms or applicable law.',
            'GarageFinder does not guarantee that every review is accurate.',
            'Providers must not manipulate reviews, create fake accounts, threaten Customers for negative reviews, or improperly incentivize reviews.',
          ],
        },
        {
          id: '16',
          title: '16. Disputes Between Customers and Providers',
          paragraphs: [
            'Where a dispute concerns the actual Product or Service, the primary parties to that transaction are the Customer and Provider.',
            'GarageFinder may provide a dispute-reporting or support mechanism and may request evidence, including quotations, invoices, photographs, messages, appointment records, payment records and service records.',
            'GarageFinder may facilitate communication but does not guarantee that it will determine liability or compensate either party.',
            'Nothing in these Terms prevents a Customer from exercising mandatory rights available under applicable law.',
          ],
        },
        {
          id: '17',
          title: '17. Customer Responsibilities',
          paragraphs: [
            'You agree not to provide fraudulent information; impersonate another person; misuse the Platform; interfere with Platform security; attempt unauthorized access; upload malicious software; manipulate reviews; use the Platform for unlawful purposes; harass Providers or other Customers; use Platform information to facilitate fraud; abuse dispute procedures; or submit knowingly false complaints.',
          ],
        },
        {
          id: '18',
          title: '18. User Content and Photographs',
          paragraphs: [
            'The Platform may allow Customers and Providers to upload vehicle photographs, service photographs, invoices, documents, reviews, descriptions and other content.',
            'You remain responsible for content you upload.',
            'You grant GarageFinder a limited, non-exclusive license to store, process, display and use uploaded content as reasonably necessary to operate, secure, improve and provide the Platform.',
            'GarageFinder may remove content that violates these Terms or applicable law.',
          ],
        },
        {
          id: '19',
          title: '19. Privacy',
          paragraphs: [
            'GarageFinder processes personal information in accordance with its Privacy Policy.',
            "The Privacy Policy forms part of the Platform's legal framework.",
            'Personal information may include account information, vehicle information, location information, service history, photographs, communications, reviews, technical information and transaction-related information.',
            'You should review the Privacy Policy before using the Platform.',
          ],
        },
        {
          id: '20',
          title: '20. Beta Status',
          paragraphs: [
            'During the beta phase, GarageFinder is provided for testing, evaluation and product development.',
            'The beta may contain incomplete functionality, errors, service interruptions, changes to features, temporary limitations, inaccurate or incomplete information and experimental features.',
            'GarageFinder may modify, suspend or discontinue beta functionality.',
            'Beta participation does not create a guarantee that any particular feature will remain available.',
          ],
        },
        {
          id: '21',
          title: '21. Platform Availability',
          paragraphs: [
            'GarageFinder will use reasonable efforts to maintain the Platform but does not guarantee uninterrupted availability.',
            "The Platform may be unavailable due to maintenance, infrastructure failures, third-party service failures, network problems, cybersecurity incidents, force majeure, software defects or other circumstances outside GarageFinder's reasonable control.",
          ],
        },
        {
          id: '22',
          title: '22. Third-Party Services',
          paragraphs: [
            'GarageFinder may depend on third-party providers for services such as hosting, databases, authentication, email, maps, location services, storage, analytics, communications, payment processing and security.',
            'Third-party services may have their own terms and privacy practices.',
          ],
        },
        {
          id: '23',
          title: '23. Intellectual Property',
          paragraphs: [
            'The GarageFinder name, branding, software, interface, design, databases, logos and other Platform Content are owned by or licensed to GarageFinder unless otherwise stated.',
            'You may not copy, reproduce, modify, reverse engineer, distribute or commercially exploit Platform Content except where expressly permitted by law or authorized by GarageFinder.',
          ],
        },
        {
          id: '24',
          title: '24. Suspension and Termination',
          paragraphs: [
            'GarageFinder may suspend or terminate access where reasonably necessary because of breach of these Terms, fraud, abuse, security concerns, legal requirements, misuse of the Platform, or conduct that threatens Customers or Providers.',
            'You may stop using the Platform at any time.',
            'Termination does not eliminate obligations that by their nature should survive termination.',
          ],
        },
        {
          id: '25',
          title: '25. Limitation of Liability',
          paragraphs: [
            'To the maximum extent permitted by applicable law, GarageFinder shall not be responsible for indirect, incidental, special, consequential or punitive losses arising from the conduct of a Provider; defective Products; poor workmanship; vehicle damage; vehicle loss; personal injury caused by a Provider; inaccurate Provider information; cancelled appointments; delays; disputes between Customers and Providers; third-party service failures; or Customer misuse of the Platform.',
            'Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under applicable law.',
          ],
        },
        {
          id: '26',
          title: '26. Indemnification',
          paragraphs: [
            "To the maximum extent permitted by applicable law, you agree to indemnify and hold GarageFinder harmless from claims, losses, liabilities, damages and reasonable expenses arising from your violation of these Terms; unlawful use of the Platform; fraudulent activity; misuse of another person's information; infringement of third-party rights; or content uploaded by you.",
          ],
        },
        {
          id: '27',
          title: '27. Changes to These Terms',
          paragraphs: [
            'GarageFinder may update these Terms from time to time.',
            'Where changes materially affect your rights or obligations, GarageFinder may require you to accept the updated Terms before continuing to use relevant functionality.',
            'The applicable version and acceptance date may be recorded electronically.',
          ],
        },
        {
          id: '28',
          title: '28. Electronic Acceptance',
          paragraphs: [
            'You acknowledge that electronic acceptance of these Terms may constitute acceptance of the agreement between you and GarageFinder to the extent permitted by applicable law.',
            'GarageFinder may record account identity, document version, acceptance date and time, and relevant technical records.',
          ],
        },
        {
          id: '29',
          title: '29. Governing Law',
          paragraphs: [
            'These Terms shall be governed by the laws of the Kingdom of Bahrain, unless mandatory applicable law provides otherwise.',
            'Disputes shall be subject to the jurisdiction of the competent courts of Bahrain, subject to any mandatory rights or procedures applicable to the Customer.',
          ],
        },
        {
          id: '30',
          title: '30. Contact',
          paragraphs: [
            'Operator: Mustafa Jasem AlAhmed',
            'Email: garagefinder007@gmail.com',
            'Privacy Contact: garagefinder007@gmail.com',
            'Address: Kingdom of Bahrain',
          ],
        },
        {
          id: '31',
          title: '31. Acceptance',
          paragraphs: [
            'By creating an account or using the Platform, you acknowledge that you have read and accepted these Terms.',
          ],
        },
      ],
    },
    ar: {
      title: 'شروط استخدام العميل',
      subtitle: 'GarageFinder',
      effectiveDate: '2 سبتمبر 2026',
      lastUpdated: '2 سبتمبر 2026',
      sections: [
        {
          id: '1',
          title: '1. المقدمة',
          paragraphs: [
            'تحكم شروط الاستخدام هذه ("الشروط") وصولك إلى GarageFinder واستخدامك له، بما في ذلك موقع GarageFinder وتطبيق الويب التقدمي (PWA) والتطبيقات والخدمات الرقمية والمراسلات والوظائف ذات الصلة (يُشار إليها مجتمعة بـ "المنصة").',
            'GarageFinder هو سوق لخدمات السيارات ومنصة تقنية تهدف إلى مساعدة العملاء على اكتشاف مزودي خدمات السيارات المستقلين ومقارنتهم والتواصل معهم وطلب عروض أسعار منهم والتعامل معهم.',
            'لا تقتصر GarageFinder على الورش أو الكراجات التقليدية فقط.',
            'بحسب التوفر، قد تشمل المنصة مزودي خدمات السيارات الذين يقدمون الإصلاحات والصيانة الميكانيكية، والخدمات الكهربائية للسيارات، والإطارات والعجلات والمحاذاة، والبطاريات، وغسيل السيارات، والتلميع والعناية، والطلاء السيراميك، وأفلام حماية الطلاء (PPF)، وتظليل النوافذ، وإصلاح الهيكل والطلاء، وإصلاح الصدمات، وخدمات التكييف، وتغيير الزيت والصيانة الدورية، وقطع الغيار، وإكسسوارات السيارات، وخدمات الفحص، والسحب والمساعدة على الطريق، والخدمات المتنقلة، وغيرها من المنتجات والخدمات المتعلقة بالسيارات.',
            'قد تتغير الفئات والخدمات والمزودون المتاحون على المنصة مع الوقت.',
            'بإنشاء حساب أو الوصول إلى المنصة أو استخدام أي من وظائفها، فإنك توافق على هذه الشروط. إذا لم توافق عليها، فيجب عليك عدم استخدام المنصة.',
          ],
        },
        {
          id: '2',
          title: '2. التعريفات',
          paragraphs: [
            'يقصد بـ "GarageFinder" أو "نحن" أو "لنا" السيد Mustafa Jasem AlAhmed، مشغّل منصة GarageFinder.',
            'يقصد بـ "العميل" أو "أنت" الفرد الذي يصل إلى المنصة أو يستخدمها.',
            'يقصد بـ "مزود خدمات السيارات" أو "المزود" أي نشاط تجاري مستقل أو ورشة أو متجر أو فني أو متخصص أو مزود خدمة متنقلة أو خدمة سحب أو بائع قطع غيار أو أي نشاط آخر يقدم منتجات أو خدمات متعلقة بالسيارات عبر المنصة.',
            'يقصد بـ "الخدمات" الخدمات المتعلقة بالسيارات التي يقدمها المزودون عبر المنصة.',
            'يقصد بـ "المنتجات" قطع غيار السيارات والإطارات والإكسسوارات والبطاريات والمعدات أو السلع المادية الأخرى التي يقدمها المزودون عبر المنصة.',
            'يقصد بـ "الحجز" موعداً أو طلب خدمة يُقدَّم عبر المنصة.',
            'يقصد بـ "عرض السعر" سعراً أو نطاقاً مقترحاً للعمل يقدّمه المزود.',
            'يقصد بـ "محتوى المنصة" المعلومات والبرمجيات والواجهات والتصاميم والشعارات والنصوص والرسومات والمحتوى الآخر الذي تملكه أو تسيطر عليه GarageFinder.',
          ],
        },
        {
          id: '3',
          title: '3. دور GarageFinder',
          paragraphs: [
            'تعمل GarageFinder كمنصة تقنية وسوق إلكتروني.',
            'ما لم يُنص صراحة على خلاف ذلك، فإن GarageFinder لا تنفّذ إصلاحات السيارات، ولا تغسل المركبات أو تُلمعها، ولا تبيع قطع غيار السيارات بنفسها، ولا تقدّم السحب أو المساعدة على الطريق بنفسها، ولا تفحص المركبات أو تصلحها مادياً، ولا تصنّع المنتجات، ولا توظّف كل مزود مدرج على المنصة، ولا تعمل كميكانيكي أو مستشار فني للعميل.',
            'المزودون أنشطة تجارية مستقلة مسؤولة عن المنتجات والخدمات التي تقدّمها.',
            'وجود مزود على GarageFinder لا ينشئ بحد ذاته علاقة عمل أو شراكة أو وكالة أو امتياز أو مشروع مشترك أو أي علاقة أخرى بين المزود وGarageFinder.',
          ],
        },
        {
          id: '4',
          title: '4. التحقق من المزود',
          paragraphs: [
            'قد تُجري GarageFinder إجراءات تحقق للمزودين، وقد تشمل مراجعة معلومات النشاط والسجل التجاري وبيانات الاتصال وفئات الخدمات وبيانات الهوية والتراخيص أو التصاريح عند الاقتضاء والمستندات الداعمة والموقع وغيرها من المعلومات التي تطلبها GarageFinder بشكل معقول.',
            'حالة "موثّق" أو "مزود موثّق" تعني فقط أن GarageFinder أكملت عملية التحقق المطبقة على ذلك المزود.',
            'التحقق لا يُعد ضماناً للجودة أو جودة التنفيذ أو أن المزود سيلتزم بمعيار معيّن أو سيبقى ملتزماً بعد التحقق أو أن منتجاً مناسب لمركبة معيّنة، ولا يُعد تزكية لكل خدمة يقدّمها ذلك المزود.',
            'يبقى العملاء مسؤولين عن اتخاذ القرارات المناسبة بشأن المزود الذي يختارونه.',
          ],
        },
        {
          id: '5',
          title: '5. الحسابات',
          paragraphs: [
            'تتطلب بعض وظائف المنصة وجود حساب.',
            'توافق على تقديم معلومات دقيقة، والحفاظ على دقة بيانات الحساب، والحفاظ على سرية بيانات الدخول، وعدم مشاركة حسابك مع شخص آخر، وإبلاغ GarageFinder بأي وصول غير مصرح به، وعدم إنشاء حسابات لأغراض احتيالية.',
            'يجوز لـ GarageFinder تعليق الحسابات أو إنهاؤها عند الحاجة المعقولة لأسباب أمنية أو لمنع الاحتيال أو إساءة الاستخدام أو للامتثال القانوني أو بسبب مخالفة هذه الشروط.',
          ],
        },
        {
          id: '6',
          title: '6. معلومات المركبة',
          paragraphs: [
            'قد تتيح لك المنصة تخزين معلومات المركبة، بما في ذلك الشركة والطراز والسنة والفئة وبيانات التسجيل ورقم الهيكل (VIN) والمسافة المقطوعة والصور وسجل الخدمة ومعلومات الإصلاح والصيانة.',
            'قد يحسّن تقديم رقم الهيكل تحديد المركبة ودقة الخدمة، لكنه قد لا يكون إلزامياً دائماً.',
            'أنت مسؤول عن ضمان أن المعلومات التي تقدّمها دقيقة بشكل معقول.',
            'لا تضمن GarageFinder أن المعلومات التي يقدّمها العميل أو المزود كاملة أو صحيحة.',
          ],
        },
        {
          id: '7',
          title: '7. طلبات الخدمة وعروض الأسعار',
          paragraphs: [
            'قد تتيح GarageFinder للعملاء تقديم طلبات للمنتجات أو الخدمات.',
            'قد يرد المزودون بعروض أسعار تتضمن معلومات مثل السعر والمدة المقدّرة والعمل المقترح وقطع الغيار وشروط الخدمة والتوفر والمتطلبات الإضافية.',
            'عرض السعر يقدّمه المزود. ولا تضمن GarageFinder بشكل مستقل أن السعر المعروض دقيق أو نهائي أو معقول أو مناسب فنياً.',
            'ما لم يُنص صراحة على خلاف ذلك، يكون المزود مسؤولاً عن إبلاغ أي تغييرات في نطاق العمل أو السعر أو متطلبات العمل.',
          ],
        },
        {
          id: '8',
          title: '8. الحجوزات والمواعيد',
          paragraphs: [
            'يجوز للعملاء استخدام المنصة لطلب المواعيد أو جدولتها.',
            'الموعد الظاهر عبر المنصة لا يضمن بالضرورة أن المزود سينفّذ الخدمة تماماً كما طُلبت أصلاً إذا اختلفت حالة المركبة عن المعلومات المقدَّمة، أو تطلّب الأمر عملاً إضافياً، أو تعذّر توفر القطع، أو اكتشف المزود مشكلات تتعلق بالسلامة، أو طلب العميل عملاً إضافياً، أو حدثت ظروف خارجة عن السيطرة المعقولة للمزود.',
            'عند تغيّر نطاق العمل أو السعر بشكل جوهري، ينبغي على العميل الحصول على تأكيد من المزود قبل اعتماد أي عمل إضافي.',
          ],
        },
        {
          id: '9',
          title: '9. خدمات السيارات والسلامة',
          paragraphs: [
            'قد تنطوي خدمات السيارات على مخاطر كبيرة تتعلق بالسلامة والجوانب المالية.',
            'لا تقدّم GarageFinder استشارات مهنية ميكانيكية أو كهربائية أو إنشائية أو قانونية أو تتعلق بالسلامة.',
            'ينبغي ألا يعتمد العملاء على محتوى المنصة بديلاً عن الفحص المهني.',
            'بالنسبة للمسائل الحساسة للسلامة، بما في ذلك الفرامل والتوجيه والإطارات والتعليق والأنظمة الكهربائية وأنظمة الوقود أو غيرها من المكوّنات المتعلقة بالسلامة، ينبغي على العملاء الحصول على استشارة مهنية مناسبة من مزود مؤهل.',
            'لا تتحمل GarageFinder المسؤولية عن قرار العميل بتشغيل المركبة أو مواصلة تشغيلها.',
          ],
        },
        {
          id: '10',
          title: '10. المنتجات وقطع غيار السيارات',
          paragraphs: [
            'قد يقدّم المزودون منتجات عبر المنصة.',
            'المزود مسؤول عن أوصاف المنتج ومعلومات التوافق والأصالة والحالة والتسعير والضمانات والإرجاع عند الاقتضاء والتسليم والعيوب والتنفيذ.',
            'ينبغي على العملاء التأكد من التوافق قبل شراء منتج أو تركيبه.',
            'لا تصنّع GarageFinder المنتجات ولا تضمن بشكل مستقل جودتها أو أصالتها أو توافقها أو ملاءمتها ما لم يُنص صراحة على خلاف ذلك.',
          ],
        },
        {
          id: '11',
          title: '11. الغسيل والتلميع وخدمات مظهر المركبة',
          paragraphs: [
            'قد يؤثر غسيل المركبات والتلميع والطلاء والتظليل وأفلام الحماية والصقل والخدمات ذات الصلة على أسطح المركبة والطلاء والزخارف والزجاج والإلكترونيات أو مكوّنات أخرى.',
            'المزود مسؤول عن أداء الخدمة باحتراف ووفقاً للالتزامات السارية.',
            'ينبغي على العملاء الإفصاح عن حالات المركبة المعروفة والتعديلات والأضرار القائمة وأي معلومات ذات صلة.',
            'لا تضمن GarageFinder بشكل مستقل نتيجة هذه الخدمات.',
          ],
        },
        {
          id: '12',
          title: '12. السحب والمساعدة على الطريق',
          paragraphs: [
            'قد ينطوي السحب والمساعدة على الطريق على ظروف عاجلة وحساسة للسلامة.',
            'المزود مسؤول عن تنفيذ خدمة السحب أو المساعدة على الطريق.',
            'GarageFinder ليست جهة استجابة للطوارئ ولا تضمن التوفر الفوري أو زمن الاستجابة أو استعادة المركبة أو المساعدة على الطريق.',
            'ينبغي على العملاء استخدام خدمات الطوارئ المناسبة عند وجود تهديد فوري للحياة أو السلامة.',
          ],
        },
        {
          id: '13',
          title: '13. المدفوعات والمعاملات النقدية',
          paragraphs: [
            'قد تدعم المنصة تسجيل معلومات الدفع أو إبلاغها، بما في ذلك سجلات الدفع النقدي.',
            'عندما تكون المعاملة مباشرة بين العميل والمزود، يكون المزود مسؤولاً عن المعاملة وعن الامتثال للمتطلبات التجارية وحماية المستهلك والضريبية السارية.',
            'لا تصبح GarageFinder مالكة لأموال العميل لمجرد عرض معاملة أو سجل دفع عبر المنصة.',
            'إذا أدخلت GarageFinder معالجة دفع إلكتروني مستقبلاً، فقد تسري شروط دفع إضافية.',
          ],
        },
        {
          id: '14',
          title: '14. الفواتير والإيصالات',
          paragraphs: [
            'قد يُصدر المزودون فواتير أو إيصالات أو سجلات معاملات أخرى عبر المنصة أو خارجها.',
            'يبقى المزود مسؤولاً عن دقة فواتيره وسجلاته وصحتها القانونية.',
            'قد تخزّن GarageFinder السجلات المتعلقة بالمعاملات لتشغيل المنصة أو تسهيل النزاعات أو الحفاظ على سجل الخدمة أو الامتثال للالتزامات القانونية.',
          ],
        },
        {
          id: '15',
          title: '15. التقييمات والمراجعات',
          paragraphs: [
            'قد يُسمح للعملاء بتقديم تقييمات ومراجعات.',
            'يجب أن تعكس المراجعات تجارب حقيقية، وأن تكون دقيقة بشكل معقول، وأن تتعلق بالمزود أو المعاملة ذات الصلة، وألا تتضمن مواد غير قانونية أو مسيئة، وألا تتضمن تهديدات أو محتوى تمييزياً، وألا تضلل المستخدمين الآخرين عمداً، وألا تُقدَّم مقابل تعويض غير مفصح عنه.',
            'يجوز لـ GarageFinder إزالة المحتوى الذي يخالف هذه الشروط أو القانون الساري أو تقييده أو الإشراف عليه.',
            'لا تضمن GarageFinder دقة كل مراجعة.',
            'يجب على المزودين عدم التلاعب بالمراجعات أو إنشاء حسابات وهمية أو تهديد العملاء بسبب مراجعات سلبية أو تحفيز المراجعات بطريقة غير سليمة.',
          ],
        },
        {
          id: '16',
          title: '16. النزاعات بين العملاء والمزودين',
          paragraphs: [
            'عندما يتعلق النزاع بالمنتج أو الخدمة الفعلية، فإن الطرفين الأساسيين في تلك المعاملة هما العميل والمزود.',
            'قد توفّر GarageFinder آلية للإبلاغ عن النزاعات أو الدعم، وقد تطلب أدلة تشمل عروض الأسعار والفواتير والصور والرسائل وسجلات المواعيد والمدفوعات والخدمة.',
            'قد تسهّل GarageFinder التواصل لكنها لا تضمن البت في المسؤولية أو تعويض أي طرف.',
            'لا شيء في هذه الشروط يمنع العميل من ممارسة الحقوق الإلزامية المتاحة بموجب القانون الساري.',
          ],
        },
        {
          id: '17',
          title: '17. مسؤوليات العميل',
          paragraphs: [
            'توافق على عدم تقديم معلومات احتيالية، أو انتحال شخصية الغير، أو إساءة استخدام المنصة، أو التدخل في أمن المنصة، أو محاولة الوصول غير المصرح به، أو رفع برمجيات خبيثة، أو التلاعب بالمراجعات، أو استخدام المنصة لأغراض غير قانونية، أو مضايقة المزودين أو العملاء الآخرين، أو استخدام معلومات المنصة لتسهيل الاحتيال، أو إساءة استخدام إجراءات النزاع، أو تقديم شكاوى كاذبة عن علم.',
          ],
        },
        {
          id: '18',
          title: '18. محتوى المستخدم والصور',
          paragraphs: [
            'قد تتيح المنصة للعملاء والمزودين رفع صور المركبات وصور الخدمة والفواتير والمستندات والمراجعات والأوصاف ومحتوى آخر.',
            'تبقى مسؤولاً عن المحتوى الذي ترفعه.',
            'تمنح GarageFinder ترخيصاً محدوداً وغير حصري لتخزين المحتوى المرفوع ومعالجته وعرضه واستخدامه بالقدر المعقول اللازم لتشغيل المنصة وتأمينها وتحسينها وتقديمها.',
            'يجوز لـ GarageFinder إزالة المحتوى الذي يخالف هذه الشروط أو القانون الساري.',
          ],
        },
        {
          id: '19',
          title: '19. الخصوصية',
          paragraphs: [
            'تعالج GarageFinder المعلومات الشخصية وفقاً لسياسة الخصوصية الخاصة بها.',
            'تشكّل سياسة الخصوصية جزءاً من الإطار القانوني للمنصة.',
            'قد تشمل المعلومات الشخصية بيانات الحساب ومعلومات المركبة ومعلومات الموقع وسجل الخدمة والصور والمراسلات والمراجعات والمعلومات التقنية والمعلومات المتعلقة بالمعاملات.',
            'ينبغي مراجعة سياسة الخصوصية قبل استخدام المنصة.',
          ],
        },
        {
          id: '20',
          title: '20. حالة النسخة التجريبية',
          paragraphs: [
            'خلال مرحلة التجربة، تُقدَّم GarageFinder لأغراض الاختبار والتقييم وتطوير المنتج.',
            'قد تتضمن النسخة التجريبية وظائف غير مكتملة وأخطاء وانقطاعات في الخدمة وتغييرات في الميزات وقيوداً مؤقتة ومعلومات غير دقيقة أو غير مكتملة وميزات تجريبية.',
            'يجوز لـ GarageFinder تعديل وظائف التجربة أو تعليقها أو إيقافها.',
            'المشاركة في التجربة لا تنشئ ضماناً باستمرار توفر أي ميزة معيّنة.',
          ],
        },
        {
          id: '21',
          title: '21. توفر المنصة',
          paragraphs: [
            'ستبذل GarageFinder جهوداً معقولة للحفاظ على المنصة لكنها لا تضمن توفراً دون انقطاع.',
            'قد تكون المنصة غير متاحة بسبب الصيانة أو أعطال البنية التحتية أو أعطال خدمات الطرف الثالث أو مشكلات الشبكة أو حوادث الأمن السيبراني أو القوة القاهرة أو عيوب البرمجيات أو ظروف أخرى خارجة عن السيطرة المعقولة لـ GarageFinder.',
          ],
        },
        {
          id: '22',
          title: '22. خدمات الطرف الثالث',
          paragraphs: [
            'قد تعتمد GarageFinder على مزودي طرف ثالث لخدمات مثل الاستضافة وقواعد البيانات والمصادقة والبريد الإلكتروني والخرائط وخدمات الموقع والتخزين والتحليلات والمراسلات ومعالجة المدفوعات والأمن.',
            'قد تكون لخدمات الطرف الثالث شروطها وممارسات خصوصيتها الخاصة.',
          ],
        },
        {
          id: '23',
          title: '23. الملكية الفكرية',
          paragraphs: [
            'اسم GarageFinder وعلامتها وبرمجياتها وواجهتها وتصميمها وقواعد بياناتها وشعاراتها ومحتوى المنصة الآخر مملوك لـ GarageFinder أو مرخّص لها ما لم يُنص على خلاف ذلك.',
            'لا يجوز لك نسخ محتوى المنصة أو إعادة إنتاجه أو تعديله أو هندسته عكسياً أو توزيعه أو استغلاله تجارياً إلا حيث يسمح القانون صراحة أو تأذن GarageFinder بذلك.',
          ],
        },
        {
          id: '24',
          title: '24. التعليق والإنهاء',
          paragraphs: [
            'يجوز لـ GarageFinder تعليق الوصول أو إنهاؤه عند الحاجة المعقولة بسبب مخالفة هذه الشروط أو الاحتيال أو إساءة الاستخدام أو المخاوف الأمنية أو المتطلبات القانونية أو إساءة استخدام المنصة أو سلوك يهدد العملاء أو المزودين.',
            'يجوز لك التوقف عن استخدام المنصة في أي وقت.',
            'الإنهاء لا يلغي الالتزامات التي تقتضي طبيعتها استمرارها بعد الإنهاء.',
          ],
        },
        {
          id: '25',
          title: '25. تحديد المسؤولية',
          paragraphs: [
            'إلى أقصى حد يسمح به القانون الساري، لا تتحمل GarageFinder المسؤولية عن الخسائر غير المباشرة أو العرضية أو الخاصة أو التبعية أو العقابية الناشئة عن سلوك مزود، أو منتجات معيبة، أو سوء التنفيذ، أو تلف المركبة، أو فقدان المركبة، أو إصابة شخصية يسببها مزود، أو معلومات مزود غير دقيقة، أو مواعيد ملغاة، أو تأخيرات، أو نزاعات بين العملاء والمزودين، أو أعطال خدمات الطرف الثالث، أو إساءة استخدام العميل للمنصة.',
            'لا شيء في هذه الشروط يستبعد أو يحد من مسؤولية لا يجوز استبعادها أو تقييدها قانوناً بموجب القانون الساري.',
          ],
        },
        {
          id: '26',
          title: '26. التعويض',
          paragraphs: [
            'إلى أقصى حد يسمح به القانون الساري، توافق على تعويض GarageFinder وحمايتها من المطالبات والخسائر والالتزامات والأضرار والمصاريف المعقولة الناشئة عن مخالفتك لهذه الشروط، أو الاستخدام غير القانوني للمنصة، أو النشاط الاحتيالي، أو إساءة استخدام معلومات شخص آخر، أو انتهاك حقوق الغير، أو المحتوى الذي ترفعه.',
          ],
        },
        {
          id: '27',
          title: '27. التعديلات على هذه الشروط',
          paragraphs: [
            'يجوز لـ GarageFinder تحديث هذه الشروط من وقت لآخر.',
            'عندما تؤثر التغييرات جوهرياً على حقوقك أو التزاماتك، قد تطلب منك GarageFinder قبول الشروط المحدّثة قبل مواصلة استخدام الوظائف ذات الصلة.',
            'قد يُسجَّل الإصدار الساري وتاريخ القبول إلكترونياً.',
          ],
        },
        {
          id: '28',
          title: '28. القبول الإلكتروني',
          paragraphs: [
            'تقر بأن القبول الإلكتروني لهذه الشروط قد يشكّل قبولاً للاتفاق بينك وبين GarageFinder بالقدر الذي يسمح به القانون الساري.',
            'قد تسجّل GarageFinder هوية الحساب وإصدار المستند وتاريخ ووقت القبول والسجلات التقنية ذات الصلة.',
          ],
        },
        {
          id: '29',
          title: '29. القانون الحاكم',
          paragraphs: [
            'تخضع هذه الشروط لقوانين مملكة البحرين، ما لم ينص القانون الإلزامي الساري على خلاف ذلك.',
            'تخضع النزاعات لاختصاص محاكم البحرين المختصة، مع مراعاة أي حقوق أو إجراءات إلزامية تنطبق على العميل.',
          ],
        },
        {
          id: '30',
          title: '30. التواصل',
          paragraphs: [
            'المشغّل: Mustafa Jasem AlAhmed',
            'البريد الإلكتروني: garagefinder007@gmail.com',
            'جهة اتصال الخصوصية: garagefinder007@gmail.com',
            'العنوان: مملكة البحرين',
          ],
        },
        {
          id: '31',
          title: '31. القبول',
          paragraphs: [
            'بإنشاء حساب أو استخدام المنصة، فإنك تقر بأنك قرأت هذه الشروط وقبلتها.',
          ],
        },
      ],
    },
  },
}
