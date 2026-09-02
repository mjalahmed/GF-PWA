import {
  LEGAL_VERSION,
  type LegalDocument,
} from './meta'

export const providerAgreement: LegalDocument = {
  id: 'provider',
  type: 'provider_agreement',
  version: LEGAL_VERSION,
  locales: {
    en: {
      title: 'Automotive Service Provider Beta Participation & Marketplace Agreement',
      subtitle: 'GarageFinder',
      effectiveDate: '2 September 2026',
      lastUpdated: '2 September 2026',
      sections: [
        {
          id: '1',
          title: '1. Purpose',
          paragraphs: [
            'This Agreement governs the participation of an Automotive Service Provider ("Provider") in the GarageFinder Platform.',
            'GarageFinder is an automotive-services marketplace connecting Customers with independent Providers.',
            'Providers may offer automotive-related Products and/or Services including mechanical repair, maintenance, electrical services, tires, wheels, batteries, washing, detailing, ceramic coating, PPF, tinting, body repair, painting, dent repair, AC services, inspection, towing, roadside assistance, mobile services, spare parts, accessories and other automotive-related Products or Services approved by GarageFinder.',
          ],
        },
        {
          id: '2',
          title: '2. Independent Provider',
          paragraphs: [
            'The Provider is an independent business.',
            'Nothing in this Agreement creates employment, partnership, joint venture, franchise, agency or fiduciary relationship.',
            'The Provider is solely responsible for its business, employees, contractors, Products and Services.',
          ],
        },
        {
          id: '3',
          title: '3. Provider Eligibility',
          paragraphs: [
            'The Provider represents that it is legally permitted to provide the relevant Products or Services; that information provided to GarageFinder is accurate; that it possesses applicable licenses, registrations and permits; that it will maintain required authorizations; that it will notify GarageFinder of material changes; and that it will comply with applicable laws and regulations.',
            'GarageFinder may request evidence of eligibility.',
          ],
        },
        {
          id: '4',
          title: '4. Provider Verification',
          paragraphs: [
            'GarageFinder may verify Provider information, including business registration, identity, licenses, location, contact details, supporting documentation and service categories.',
            'Verification is not a warranty or guarantee of Provider performance.',
            "Providers must not represent that GarageFinder's verification means GarageFinder guarantees their quality.",
          ],
        },
        {
          id: '5',
          title: '5. Provider Profile',
          paragraphs: [
            'Providers may create profiles containing business name, service categories, description, location, opening hours, Products, Services, pricing information, photographs, contact information, reviews and verification status.',
            'Providers are responsible for ensuring profile information remains accurate.',
          ],
        },
        {
          id: '6',
          title: '6. Products and Services',
          paragraphs: [
            'The Provider is solely responsible for Products and Services it offers, including quality, safety, legality, descriptions, pricing, availability, workmanship, installation, warranties, returns where applicable, defects, compatibility, delivery and customer communication.',
            'The Provider must not list Products or Services it is not legally permitted to provide.',
          ],
        },
        {
          id: '7',
          title: '7. Automotive Safety',
          paragraphs: [
            'Providers must exercise appropriate professional care when performing automotive work.',
            'Providers must not knowingly perform unsafe work; misrepresent vehicle condition; falsely claim qualifications; install incompatible Products knowingly; provide fraudulent invoices; conceal material defects; or mislead Customers about required repairs.',
            'Safety-critical Services must be performed by appropriately qualified personnel where required.',
          ],
        },
        {
          id: '8',
          title: '8. Quotes',
          paragraphs: [
            'Providers are responsible for quotes submitted through GarageFinder.',
            'A Provider should clearly identify, where applicable, scope of work, Products or parts, labor, price, taxes, estimated duration, assumptions, exclusions, warranty terms and conditions.',
            'Providers must not intentionally submit misleading quotes.',
            'If additional work becomes necessary, the Provider should communicate the change to the Customer before proceeding where reasonably possible.',
          ],
        },
        {
          id: '9',
          title: '9. Appointments',
          paragraphs: [
            'Providers are responsible for managing appointments accepted through the Platform.',
            'Providers should honor confirmed appointments where reasonably possible; communicate cancellations; provide accurate availability; notify Customers of significant delays; and avoid accepting appointments they cannot reasonably fulfill.',
          ],
        },
        {
          id: '10',
          title: '10. Products and Parts',
          paragraphs: [
            'Where a Provider sells Products or parts, the Provider is responsible for authenticity, compatibility, condition, product description, applicable warranty, delivery, return obligations, refund obligations and compliance with applicable law.',
            'GarageFinder does not become the manufacturer, distributor or owner of the Product merely because the Product is listed on the Platform.',
          ],
        },
        {
          id: '11',
          title: '11. Vehicle Damage',
          paragraphs: [
            'Providers are responsible for damage caused by their own acts or omissions, personnel or contractors, subject to applicable law.',
            'Providers should maintain appropriate records and evidence concerning vehicle condition, photographs, work performed, parts installed, customer authorization, invoices and handover condition.',
          ],
        },
        {
          id: '12',
          title: '12. Customer Information',
          paragraphs: [
            'Providers may receive Customer information necessary to perform Platform functions.',
            'Providers agree to use Customer information only for legitimate business purposes; protect Customer information; not sell Customer information; not misuse Customer information; not disclose Customer information improperly; not use Customer information for unrelated marketing where prohibited; and comply with applicable data-protection law.',
            'Providers must notify GarageFinder promptly of suspected unauthorized disclosure or loss of Customer information where appropriate.',
          ],
        },
        {
          id: '13',
          title: '13. Direct Customer Relationship',
          paragraphs: [
            'Where a Customer purchases a Product or Service from a Provider, the Provider remains responsible for its obligations arising from that transaction.',
            'GarageFinder facilitates the marketplace relationship but does not automatically become the seller, manufacturer, repairer, installer, transporter or service provider.',
          ],
        },
        {
          id: '14',
          title: '14. Payments',
          paragraphs: [
            'Providers remain responsible for amounts owed to them by Customers and for applicable accounting, invoicing and tax obligations.',
            'Where GarageFinder introduces online payment functionality, separate payment terms may apply.',
            'Providers must not misrepresent a Platform payment record as proof that GarageFinder guarantees the underlying transaction.',
          ],
        },
        {
          id: '15',
          title: '15. Reviews',
          paragraphs: [
            'Providers agree not to create fake reviews; manipulate ratings; threaten Customers because of reviews; purchase undisclosed positive reviews; submit reviews through fake accounts; or retaliate against Customers for legitimate complaints.',
            'Providers may respond professionally to reviews.',
            'GarageFinder may moderate reviews in accordance with its policies.',
          ],
        },
        {
          id: '16',
          title: '16. Disputes',
          paragraphs: [
            'Providers must cooperate reasonably with legitimate dispute investigations.',
            'GarageFinder may request quotations, invoices, photographs, communications, service records, payment evidence and vehicle-condition evidence.',
            'GarageFinder may facilitate communication between the parties.',
            'GarageFinder does not guarantee that it will determine liability or compensate a Customer or Provider.',
          ],
        },
        {
          id: '17',
          title: '17. Customer Safety and Conduct',
          paragraphs: [
            'Providers must report serious threats, fraud, harassment or other material misconduct through available Platform channels where appropriate.',
            'Providers must not use the Platform to facilitate unlawful activity.',
          ],
        },
        {
          id: '18',
          title: '18. Provider Content',
          paragraphs: [
            'Providers may upload photographs, descriptions, logos, service information, pricing, Product information and documents.',
            'The Provider confirms that it has the right to provide such content.',
            "The Provider grants GarageFinder a non-exclusive license to use the content to operate, market and improve the Provider's presence on the Platform.",
          ],
        },
        {
          id: '19',
          title: '19. Verification Documents',
          paragraphs: [
            'GarageFinder may request documents for verification concerning the Provider, owners, authorized representatives, licenses or commercial registration.',
            'GarageFinder may retain such information as necessary for verification, security, legal compliance and Platform operations, subject to applicable privacy requirements.',
          ],
        },
        {
          id: '20',
          title: '20. Beta Participation',
          paragraphs: [
            'The Provider acknowledges that GarageFinder is currently operating in a beta phase.',
            'The beta may involve experimental features, system changes, temporary downtime, bugs, incomplete functionality, changes to workflows and testing of new marketplace features.',
            'The Provider agrees to provide reasonable feedback where requested.',
            'Beta participation does not guarantee future commercial terms, customer volume or Platform availability.',
          ],
        },
        {
          id: '21',
          title: '21. Platform Fees',
          paragraphs: [
            'Unless expressly agreed otherwise in writing, participation during the beta does not automatically create a commission or subscription obligation.',
            'GarageFinder may introduce future commercial terms.',
            'Any future fees, commissions or subscription arrangements should be communicated through separate commercial terms or an updated agreement.',
          ],
        },
        {
          id: '22',
          title: '22. Provider Suspension',
          paragraphs: [
            'GarageFinder may suspend or remove a Provider where reasonably necessary because of fraudulent activity, serious customer complaints, unsafe conduct, inaccurate business information, expired or invalid authorization, unlawful activity, manipulation of reviews, misuse of Customer information, security concerns or material breach of this Agreement.',
          ],
        },
        {
          id: '23',
          title: '23. Termination',
          paragraphs: [
            'Either party may terminate beta participation subject to any agreed notice requirements.',
            'GarageFinder may terminate immediately where reasonably necessary for security, fraud, legal compliance or serious misconduct.',
            'Termination does not remove obligations that should survive termination.',
          ],
        },
        {
          id: '24',
          title: '24. No Guarantee of Customers',
          paragraphs: [
            'GarageFinder does not guarantee a minimum number of Customers, bookings or revenue; a particular search ranking; continued listing; or continued access to any particular feature.',
          ],
        },
        {
          id: '25',
          title: "25. Limitation of GarageFinder's Responsibility",
          paragraphs: [
            'To the maximum extent permitted by applicable law, GarageFinder is not responsible for losses arising from Provider workmanship; defective Products; inaccurate Provider information; Provider cancellations; Provider employees or contractors; vehicle damage; personal injury resulting from Provider Services; Provider regulatory violations; or disputes between Providers and Customers.',
            'Nothing in this Agreement excludes liability that cannot legally be excluded.',
          ],
        },
        {
          id: '26',
          title: '26. Provider Indemnification',
          paragraphs: [
            'To the maximum extent permitted by applicable law, the Provider agrees to indemnify GarageFinder against claims, losses, liabilities and reasonable expenses arising from Provider Products; Provider Services; Provider negligence or misconduct; violation of applicable law; inaccurate Provider information; infringement of third-party rights; misuse of Customer information; or breach of this Agreement.',
          ],
        },
        {
          id: '27',
          title: '27. Confidentiality',
          paragraphs: [
            'Providers must not disclose confidential Platform information received through their participation unless authorized by GarageFinder, required by law, or already publicly available through no fault of the Provider.',
          ],
        },
        {
          id: '28',
          title: '28. Data Protection',
          paragraphs: [
            'The Provider acknowledges that Customer information received through GarageFinder may constitute personal data.',
            'The Provider must process such information only for legitimate purposes and in compliance with applicable data-protection requirements.',
            'The Provider must implement reasonable security measures to protect Customer information.',
          ],
        },
        {
          id: '29',
          title: '29. Future Commercial Relationship',
          paragraphs: [
            'GarageFinder may transition from beta testing into a commercial marketplace.',
            'Future commercial arrangements may address commissions, subscriptions, advertising, promoted listings, payment processing, transaction fees, lead-generation fees and premium Provider features.',
            'No future commercial arrangement is created solely by this beta Agreement.',
          ],
        },
        {
          id: '30',
          title: '30. Intellectual Property',
          paragraphs: [
            'The GarageFinder name, software, branding, Platform design and underlying technology remain the property of GarageFinder or its licensors.',
            'The Provider receives only the limited rights necessary to participate in the Platform.',
          ],
        },
        {
          id: '31',
          title: '31. Electronic Acceptance',
          paragraphs: [
            'The Provider agrees that electronic acceptance of this Agreement may constitute acceptance of the agreement to the extent permitted by applicable law.',
            'GarageFinder may record Provider identity, authorized representative, Agreement version, acceptance date and time, and relevant technical records.',
          ],
        },
        {
          id: '32',
          title: '32. Governing Law',
          paragraphs: [
            'This Agreement is governed by the laws of the Kingdom of Bahrain, unless mandatory applicable law provides otherwise.',
            'Disputes shall be subject to the competent courts of Bahrain.',
          ],
        },
        {
          id: '33',
          title: '33. Provider Acceptance',
          paragraphs: [
            'The Provider confirms that the information provided to GarageFinder is accurate; that it is authorized to represent the business; that it is legally permitted to provide its listed Products and Services; that it will comply with applicable laws; and that it accepts this Agreement.',
            'Operator: Mustafa Jasem AlAhmed. Contact: garagefinder007@gmail.com. Address: Kingdom of Bahrain.',
          ],
        },
      ],
    },
    ar: {
      title: 'اتفاقية مشاركة مزود خدمات السيارات في النسخة التجريبية والسوق',
      subtitle: 'GarageFinder',
      effectiveDate: '2 سبتمبر 2026',
      lastUpdated: '2 سبتمبر 2026',
      sections: [
        {
          id: '1',
          title: '1. الغرض',
          paragraphs: [
            'تحكم هذه الاتفاقية مشاركة مزود خدمات السيارات ("المزود") في منصة GarageFinder.',
            'GarageFinder سوق لخدمات السيارات يربط العملاء بمزودين مستقلين.',
            'قد يقدّم المزودون منتجات و/أو خدمات متعلقة بالسيارات تشمل الإصلاح الميكانيكي والصيانة والخدمات الكهربائية والإطارات والعجلات والبطاريات والغسيل والتلميع والطلاء السيراميك وأفلام الحماية والتظليل وإصلاح الهيكل والطلاء وإصلاح الصدمات وخدمات التكييف والفحص والسحب والمساعدة على الطريق والخدمات المتنقلة وقطع الغيار والإكسسوارات وغيرها من المنتجات أو الخدمات المتعلقة بالسيارات التي توافق عليها GarageFinder.',
          ],
        },
        {
          id: '2',
          title: '2. مزود مستقل',
          paragraphs: [
            'المزود نشاط تجاري مستقل.',
            'لا شيء في هذه الاتفاقية ينشئ علاقة عمل أو شراكة أو مشروعاً مشتركاً أو امتيازاً أو وكالة أو علاقة أمانة.',
            'المزود وحده مسؤول عن نشاطه وموظفيه ومتعاقديه ومنتجاته وخدماته.',
          ],
        },
        {
          id: '3',
          title: '3. أهلية المزود',
          paragraphs: [
            'يقر المزود بأنه مسموح له قانوناً بتقديم المنتجات أو الخدمات ذات الصلة؛ وأن المعلومات المقدَّمة إلى GarageFinder دقيقة؛ وأنه يمتلك التراخيص والتسجيلات والتصاريح السارية؛ وأنه سيحافظ على التفويضات المطلوبة؛ وأنه سيُبلغ GarageFinder بأي تغييرات جوهرية؛ وأنه سيلتزم بالقوانين والأنظمة السارية.',
            'يجوز لـ GarageFinder طلب إثبات الأهلية.',
          ],
        },
        {
          id: '4',
          title: '4. التحقق من المزود',
          paragraphs: [
            'قد تتحقق GarageFinder من معلومات المزود، بما في ذلك تسجيل النشاط والهوية والتراخيص والموقع وبيانات الاتصال والمستندات الداعمة وفئات الخدمات.',
            'التحقق ليس ضماناً أو كفالة لأداء المزود.',
            'يجب على المزودين عدم الادعاء بأن تحقق GarageFinder يعني أنها تضمن جودتهم.',
          ],
        },
        {
          id: '5',
          title: '5. ملف المزود',
          paragraphs: [
            'قد ينشئ المزودون ملفات تتضمن اسم النشاط وفئات الخدمات والوصف والموقع وساعات العمل والمنتجات والخدمات ومعلومات التسعير والصور وبيانات الاتصال والمراجعات وحالة التحقق.',
            'المزودون مسؤولون عن ضمان بقاء معلومات الملف دقيقة.',
          ],
        },
        {
          id: '6',
          title: '6. المنتجات والخدمات',
          paragraphs: [
            'المزود وحده مسؤول عن المنتجات والخدمات التي يقدّمها، بما في ذلك الجودة والسلامة والمشروعية والأوصاف والتسعير والتوفر وجودة التنفيذ والتركيب والضمانات والإرجاع عند الاقتضاء والعيوب والتوافق والتسليم والتواصل مع العملاء.',
            'يجب على المزود عدم إدراج منتجات أو خدمات غير مسموح له قانوناً بتقديمها.',
          ],
        },
        {
          id: '7',
          title: '7. سلامة السيارات',
          paragraphs: [
            'يجب على المزودين ممارسة العناية المهنية المناسبة عند أداء أعمال السيارات.',
            'يجب على المزودين عدم أداء عمل غير آمن عن علم، أو تحريف حالة المركبة، أو الادعاء زوراً بمؤهلات، أو تركيب منتجات غير متوافقة عن علم، أو تقديم فواتير احتيالية، أو إخفاء عيوب جوهرية، أو تضليل العملاء بشأن الإصلاحات المطلوبة.',
            'يجب أداء الخدمات الحساسة للسلامة بواسطة أشخاص مؤهلين بشكل مناسب حيث يُطلب ذلك.',
          ],
        },
        {
          id: '8',
          title: '8. عروض الأسعار',
          paragraphs: [
            'المزودون مسؤولون عن عروض الأسعار المقدَّمة عبر GarageFinder.',
            'ينبغي على المزود أن يحدد بوضوح، عند الاقتضاء، نطاق العمل والمنتجات أو القطع والعمالة والسعر والضرائب والمدة المقدّرة والافتراضات والاستثناءات وشروط الضمان.',
            'يجب على المزودين عدم تقديم عروض أسعار مضللة عمداً.',
            'إذا أصبح العمل الإضافي ضرورياً، ينبغي على المزود إبلاغ العميل بالتغيير قبل المتابعة حيثما أمكن بشكل معقول.',
          ],
        },
        {
          id: '9',
          title: '9. المواعيد',
          paragraphs: [
            'المزودون مسؤولون عن إدارة المواعيد المقبولة عبر المنصة.',
            'ينبغي على المزودين الالتزام بالمواعيد المؤكدة حيثما أمكن بشكل معقول؛ وإبلاغ الإلغاءات؛ وتقديم توفر دقيق؛ وإخطار العملاء بالتأخيرات الكبيرة؛ وتجنب قبول مواعيد لا يمكنهم الوفاء بها بشكل معقول.',
          ],
        },
        {
          id: '10',
          title: '10. المنتجات وقطع الغيار',
          paragraphs: [
            'عندما يبيع المزود منتجات أو قطعاً، يكون مسؤولاً عن الأصالة والتوافق والحالة ووصف المنتج والضمان الساري والتسليم والتزامات الإرجاع والاسترداد والامتثال للقانون الساري.',
            'لا تصبح GarageFinder الشركة المصنّعة أو الموزّع أو مالك المنتج لمجرد إدراج المنتج على المنصة.',
          ],
        },
        {
          id: '11',
          title: '11. تلف المركبة',
          paragraphs: [
            'المزودون مسؤولون عن الضرر الناتج عن أفعالهم أو إهمالهم أو موظفيهم أو متعاقديهم، مع مراعاة القانون الساري.',
            'ينبغي على المزودين الاحتفاظ بسجلات وأدلة مناسبة بشأن حالة المركبة والصور والعمل المنفَّذ والقطع المركَّبة وتفويض العميل والفواتير وحالة التسليم.',
          ],
        },
        {
          id: '12',
          title: '12. معلومات العميل',
          paragraphs: [
            'قد يتلقى المزودون معلومات العميل اللازمة لأداء وظائف المنصة.',
            'يوافق المزودون على استخدام معلومات العميل فقط لأغراض تجارية مشروعة؛ وحمايتها؛ وعدم بيعها؛ وعدم إساءة استخدامها؛ وعدم الإفصاح عنها بشكل غير سليم؛ وعدم استخدامها للتسويق غير ذي الصلة حيث يُحظر ذلك؛ والامتثال لقانون حماية البيانات الساري.',
            'يجب على المزودين إبلاغ GarageFinder فوراً بأي إفصاح غير مصرح به أو فقدان مشتبه به لمعلومات العميل عند الاقتضاء.',
          ],
        },
        {
          id: '13',
          title: '13. العلاقة المباشرة مع العميل',
          paragraphs: [
            'عندما يشتري العميل منتجاً أو خدمة من مزود، يبقى المزود مسؤولاً عن التزاماته الناشئة عن تلك المعاملة.',
            'تسهّل GarageFinder علاقة السوق لكنها لا تصبح تلقائياً البائع أو المصنّع أو المصلح أو المركّب أو الناقل أو مزود الخدمة.',
          ],
        },
        {
          id: '14',
          title: '14. المدفوعات',
          paragraphs: [
            'يبقى المزودون مسؤولين عن المبالغ المستحقة لهم من العملاء وعن الالتزامات المحاسبية والفوترة والضريبية السارية.',
            'عند إدخال وظائف الدفع الإلكتروني، قد تسري شروط دفع منفصلة.',
            'يجب على المزودين عدم تصوير سجل دفع على المنصة على أنه إثبات أن GarageFinder تضمن المعاملة الأساسية.',
          ],
        },
        {
          id: '15',
          title: '15. المراجعات',
          paragraphs: [
            'يوافق المزودون على عدم إنشاء مراجعات وهمية؛ أو التلاعب بالتقييمات؛ أو تهديد العملاء بسبب المراجعات؛ أو شراء مراجعات إيجابية غير مفصح عنها؛ أو تقديم مراجعات عبر حسابات وهمية؛ أو الانتقام من العملاء بسبب شكاوى مشروعة.',
            'يجوز للمزودين الرد على المراجعات باحتراف.',
            'يجوز لـ GarageFinder الإشراف على المراجعات وفقاً لسياساتها.',
          ],
        },
        {
          id: '16',
          title: '16. النزاعات',
          paragraphs: [
            'يجب على المزودين التعاون بشكل معقول مع تحقيقات النزاعات المشروعة.',
            'قد تطلب GarageFinder عروض أسعار وفواتير وصوراً ومراسلات وسجلات خدمة وأدلة دفع وأدلة على حالة المركبة.',
            'قد تسهّل GarageFinder التواصل بين الطرفين.',
            'لا تضمن GarageFinder البت في المسؤولية أو تعويض العميل أو المزود.',
          ],
        },
        {
          id: '17',
          title: '17. سلامة العملاء والسلوك',
          paragraphs: [
            'يجب على المزودين الإبلاغ عن التهديدات الجسيمة أو الاحتيال أو المضايقة أو سوء السلوك الجوهري عبر قنوات المنصة المتاحة عند الاقتضاء.',
            'يجب على المزودين عدم استخدام المنصة لتسهيل نشاط غير قانوني.',
          ],
        },
        {
          id: '18',
          title: '18. محتوى المزود',
          paragraphs: [
            'قد يرفع المزودون صوراً وأوصافاً وشعارات ومعلومات خدمة وتسعير ومعلومات منتجات ومستندات.',
            'يؤكد المزود أن لديه الحق في تقديم هذا المحتوى.',
            'يمنح المزود GarageFinder ترخيصاً غير حصري لاستخدام المحتوى لتشغيل حضوره على المنصة وتسويقه وتحسينه.',
          ],
        },
        {
          id: '19',
          title: '19. مستندات التحقق',
          paragraphs: [
            'قد تطلب GarageFinder مستندات للتحقق تتعلق بالمزود أو المالكين أو الممثلين المفوّضين أو التراخيص أو السجل التجاري.',
            'قد تحتفظ GarageFinder بهذه المعلومات حسب الحاجة للتحقق والأمن والامتثال القانوني وتشغيل المنصة، مع مراعاة متطلبات الخصوصية السارية.',
          ],
        },
        {
          id: '20',
          title: '20. المشاركة في التجربة',
          paragraphs: [
            'يقر المزود بأن GarageFinder تعمل حالياً في مرحلة تجريبية.',
            'قد تتضمن التجربة ميزات تجريبية وتغييرات في النظام وتوقفاً مؤقتاً وأخطاء ووظائف غير مكتملة وتغييرات في سير العمل واختبار ميزات سوق جديدة.',
            'يوافق المزود على تقديم ملاحظات معقولة عند الطلب.',
            'المشاركة في التجربة لا تضمن شروطاً تجارية مستقبلية أو حجماً معيّناً من العملاء أو استمرار توفر المنصة.',
          ],
        },
        {
          id: '21',
          title: '21. رسوم المنصة',
          paragraphs: [
            'ما لم يُتفق صراحة كتابةً على خلاف ذلك، فإن المشاركة خلال التجربة لا تنشئ تلقائياً التزام عمولة أو اشتراك.',
            'قد تقدّم GarageFinder شروطاً تجارية مستقبلية.',
            'ينبغي إبلاغ أي رسوم أو عمولات أو ترتيبات اشتراك مستقبلية عبر شروط تجارية منفصلة أو اتفاقية محدّثة.',
          ],
        },
        {
          id: '22',
          title: '22. تعليق المزود',
          paragraphs: [
            'يجوز لـ GarageFinder تعليق مزود أو إزالته عند الحاجة المعقولة بسبب نشاط احتيالي أو شكاوى عملاء جسيمة أو سلوك غير آمن أو معلومات نشاط غير دقيقة أو تفويض منتهٍ أو غير صالح أو نشاط غير قانوني أو التلاعب بالمراجعات أو إساءة استخدام معلومات العميل أو مخاوف أمنية أو مخالفة جوهرية لهذه الاتفاقية.',
          ],
        },
        {
          id: '23',
          title: '23. الإنهاء',
          paragraphs: [
            'يجوز لأي طرف إنهاء المشاركة في التجربة مع مراعاة أي متطلبات إخطار متفق عليها.',
            'يجوز لـ GarageFinder الإنهاء فوراً عند الحاجة المعقولة للأمن أو الاحتيال أو الامتثال القانوني أو سوء السلوك الجسيم.',
            'الإنهاء لا يزيل الالتزامات التي ينبغي أن تستمر بعد الإنهاء.',
          ],
        },
        {
          id: '24',
          title: '24. عدم ضمان العملاء',
          paragraphs: [
            'لا تضمن GarageFinder حداً أدنى من العملاء أو الحجوزات أو الإيرادات؛ أو ترتيباً معيّناً في البحث؛ أو استمرار الإدراج؛ أو استمرار الوصول إلى أي ميزة معيّنة.',
          ],
        },
        {
          id: '25',
          title: '25. تحديد مسؤولية GarageFinder',
          paragraphs: [
            'إلى أقصى حد يسمح به القانون الساري، لا تتحمل GarageFinder المسؤولية عن الخسائر الناشئة عن جودة تنفيذ المزود؛ أو المنتجات المعيبة؛ أو معلومات المزود غير الدقيقة؛ أو إلغاءات المزود؛ أو موظفي المزود أو متعاقديه؛ أو تلف المركبة؛ أو الإصابة الشخصية الناتجة عن خدمات المزود؛ أو مخالفات المزود التنظيمية؛ أو النزاعات بين المزودين والعملاء.',
            'لا شيء في هذه الاتفاقية يستبعد مسؤولية لا يجوز استبعادها قانوناً.',
          ],
        },
        {
          id: '26',
          title: '26. تعويض المزود',
          paragraphs: [
            'إلى أقصى حد يسمح به القانون الساري، يوافق المزود على تعويض GarageFinder عن المطالبات والخسائر والالتزامات والمصاريف المعقولة الناشئة عن منتجات المزود؛ أو خدماته؛ أو إهماله أو سوء سلوكه؛ أو مخالفة القانون الساري؛ أو معلوماته غير الدقيقة؛ أو انتهاك حقوق الغير؛ أو إساءة استخدام معلومات العميل؛ أو مخالفة هذه الاتفاقية.',
          ],
        },
        {
          id: '27',
          title: '27. السرية',
          paragraphs: [
            'يجب على المزودين عدم الإفصاح عن معلومات المنصة السرية التي يتلقونها من خلال مشاركتهم إلا إذا أذنت GarageFinder بذلك أو اقتضى القانون ذلك أو كانت متاحة علناً دون خطأ من المزود.',
          ],
        },
        {
          id: '28',
          title: '28. حماية البيانات',
          paragraphs: [
            'يقر المزود بأن معلومات العميل المستلمة عبر GarageFinder قد تشكّل بيانات شخصية.',
            'يجب على المزود معالجة هذه المعلومات فقط لأغراض مشروعة ووفقاً لمتطلبات حماية البيانات السارية.',
            'يجب على المزود تنفيذ تدابير أمنية معقولة لحماية معلومات العميل.',
          ],
        },
        {
          id: '29',
          title: '29. العلاقة التجارية المستقبلية',
          paragraphs: [
            'قد تنتقل GarageFinder من الاختبار التجريبي إلى سوق تجاري.',
            'قد تتناول الترتيبات التجارية المستقبلية العمولات والاشتراكات والإعلان والقوائم المروَّجة ومعالجة المدفوعات ورسوم المعاملات ورسوم توليد العملاء المحتملين وميزات المزود المميزة.',
            'لا ينشئ قبول هذه الاتفاقية التجريبية وحدها أي ترتيب تجاري مستقبلي.',
          ],
        },
        {
          id: '30',
          title: '30. الملكية الفكرية',
          paragraphs: [
            'يبقى اسم GarageFinder وبرمجياتها وعلامتها وتصميم المنصة والتقنية الأساسية ملكاً لـ GarageFinder أو مرخّصيها.',
            'يحصل المزود فقط على الحقوق المحدودة اللازمة للمشاركة في المنصة.',
          ],
        },
        {
          id: '31',
          title: '31. القبول الإلكتروني',
          paragraphs: [
            'يوافق المزود على أن القبول الإلكتروني لهذه الاتفاقية قد يشكّل قبولاً للاتفاق بالقدر الذي يسمح به القانون الساري.',
            'قد تسجّل GarageFinder هوية المزود والممثل المفوّض وإصدار الاتفاقية وتاريخ ووقت القبول والسجلات التقنية ذات الصلة.',
          ],
        },
        {
          id: '32',
          title: '32. القانون الحاكم',
          paragraphs: [
            'تخضع هذه الاتفاقية لقوانين مملكة البحرين، ما لم ينص القانون الإلزامي الساري على خلاف ذلك.',
            'تخضع النزاعات لمحاكم البحرين المختصة.',
          ],
        },
        {
          id: '33',
          title: '33. قبول المزود',
          paragraphs: [
            'يؤكد المزود أن المعلومات المقدَّمة إلى GarageFinder دقيقة؛ وأنه مفوّض بتمثيل النشاط؛ وأنه مسموح له قانوناً بتقديم منتجاته وخدماته المدرجة؛ وأنه سيلتزم بالقوانين السارية؛ وأنه يقبل هذه الاتفاقية.',
            'المشغّل: Mustafa Jasem AlAhmed. للتواصل: garagefinder007@gmail.com. العنوان: مملكة البحرين.',
          ],
        },
      ],
    },
  },
}
