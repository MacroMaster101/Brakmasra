import type { Language } from "@/lib/i18n";

/*
  Owner-approved legal copy. Describe only what the site actually does: when
  the site starts collecting something new (payments, email delivery, new
  analytics), update both languages and LEGAL_UPDATED together.

  Inline links use [label](/path) for pages on this site, or
  [label](mailto:address) for the support inbox.
*/
export const LEGAL_UPDATED = "2026-09-25";

export type LegalBlock = { type: "p"; text: string } | { type: "list"; items: string[] };
export type LegalSection = { id: string; title: string; blocks: LegalBlock[] };
export type LegalDocument = { title: string; lead: string; sections: LegalSection[] };
export type LegalDocumentId = "privacy" | "terms";

const privacyEn: LegalDocument = {
  title: "Privacy Policy",
  lead: "What BRAKMASRA collects when you use this site, why we collect it, and the choices you have.",
  sections: [
    {
      id: "who-we-are",
      title: "Who we are",
      blocks: [
        { type: "p", text: "BRAKMASRA (\"we\", \"us\", \"our\") is the official store of the BRAKMASRA channel, operated from Sri Lanka. This policy covers the website at brakmasra.com, including member accounts, the contact form, and drop alerts." },
      ],
    },
    {
      id: "information",
      title: "Information we collect",
      blocks: [
        { type: "list", items: [
          "Account details: your name, email address, and password when you create an account, and a mobile number if you choose to add one. Passwords are stored in hashed form by our authentication provider; we never see them in plain text.",
          "Google sign-in: if you choose Continue with Google, we receive your name, email address, and profile picture from your Google account.",
          "Contact messages: the name, email address, topic, and message you send through the contact form.",
          "Drop alerts: your email address and the time you agreed to receive them.",
          "Technical data: your IP address and basic browser information, processed when you use the site to keep it secure and working.",
        ] },
        { type: "p", text: "Ordering is not open yet, so we do not collect payment card details or delivery addresses. This policy will be updated before that changes." },
      ],
    },
    {
      id: "use",
      title: "How we use information",
      blocks: [
        { type: "list", items: [
          "To create and run your account and keep you signed in.",
          "To contact you about your orders and deliveries, using the mobile number you gave us.",
          "To reply to messages you send us.",
          "To send the drop alerts you asked for.",
          "To protect the site against spam, abuse, and repeated sign-in attempts.",
          "To understand overall site performance through privacy-friendly, anonymous statistics.",
        ] },
        { type: "p", text: "We do not sell your personal information, and we do not use it for advertising." },
      ],
    },
    {
      id: "google",
      title: "Google sign-in",
      blocks: [
        { type: "p", text: "When you sign in with Google, we request only your basic profile (name and profile picture) and your email address. We use this information solely to create your BRAKMASRA account and sign you in. We do not request access to your Gmail, contacts, files, or any other Google data." },
        { type: "p", text: "BRAKMASRA's use of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements. We do not transfer this information to others except the service providers listed below that run the site, and we never use it for advertising." },
      ],
    },
    {
      id: "providers",
      title: "Service providers",
      blocks: [
        { type: "p", text: "We use a small number of trusted providers to run the site. They process data on our behalf, under their own security and privacy commitments:" },
        { type: "list", items: [
          "Supabase: database and account sign-in.",
          "Vercel: website hosting, plus anonymous traffic and performance statistics that do not use cookies.",
          "Google: optional sign-in with your Google account.",
        ] },
        { type: "p", text: "These providers may process data on servers outside Sri Lanka." },
      ],
    },
    {
      id: "cookies",
      title: "Cookies and local storage",
      blocks: [
        { type: "list", items: [
          "Sign-in cookies: keep you signed in to your account. The site cannot offer accounts without them.",
          "Language cookie: remembers whether you chose English or Sinhala.",
          "Local storage: keeps the items in your cart on your own device.",
        ] },
        { type: "p", text: "We do not use advertising or cross-site tracking cookies." },
      ],
    },
    {
      id: "retention",
      title: "How long we keep information",
      blocks: [
        { type: "list", items: [
          "Account details: for as long as your account exists.",
          "Contact messages: only as long as needed to handle your request.",
          "Drop alert emails: until you ask us to stop.",
          "Security records containing your IP address: deleted automatically, usually within a day after they expire.",
        ] },
      ],
    },
    {
      id: "rights",
      title: "Your choices and rights",
      blocks: [
        { type: "p", text: "You can ask us to access, correct, or delete your personal information, to delete your account, or to stop sending drop alerts. We aim to handle your data in line with applicable law, including Sri Lanka's Personal Data Protection Act, No. 9 of 2022." },
        { type: "p", text: "To make a request, email [support@brakmasra.com](mailto:support@brakmasra.com) or use the [contact page](/contact). We may ask you to confirm your identity before acting on it." },
      ],
    },
    {
      id: "security",
      title: "Security",
      blocks: [
        { type: "p", text: "The site is served over HTTPS, access to stored data is restricted, and forms are protected against automated abuse. No online service can be perfectly secure, so please use a strong password that you do not use anywhere else." },
      ],
    },
    {
      id: "children",
      title: "Children",
      blocks: [
        { type: "p", text: "This site is not directed at children under 13, and we do not knowingly collect their personal information. If you are under 18, please ask a parent or guardian before creating an account." },
      ],
    },
    {
      id: "changes",
      title: "Changes to this policy",
      blocks: [
        { type: "p", text: "We will update this page when our practices change, for example before ordering opens. The date at the top shows when it last changed." },
      ],
    },
    {
      id: "contact",
      title: "Contact us",
      blocks: [
        { type: "p", text: "For questions about this policy or your data, email [support@brakmasra.com](mailto:support@brakmasra.com) or send a message through the [contact page](/contact)." },
      ],
    },
  ],
};

const privacySi: LegalDocument = {
  title: "රහස්‍යතා ප්‍රතිපත්තිය",
  lead: "ඔබ මෙම වෙබ් අඩවිය භාවිත කරන විට BRAKMASRA එකතු කරන තොරතුරු, ඒවා එකතු කරන්නේ ඇයි, සහ ඔබට ඇති තේරීම් මෙහි දැක්වේ.",
  sections: [
    {
      id: "who-we-are",
      title: "අප කවුද",
      blocks: [
        { type: "p", text: "BRAKMASRA (\"අපි\", \"අපගේ\") යනු ශ්‍රී ලංකාවේ සිට ක්‍රියාත්මක වන BRAKMASRA නාලිකාවේ නිල වෙළඳසැලයි. මෙම ප්‍රතිපත්තිය සාමාජික ගිණුම්, සම්බන්ධ වීමේ පෝරමය සහ නිකුතු දැනුම්දීම් ඇතුළුව brakmasra.com වෙබ් අඩවියට අදාළ වේ." },
      ],
    },
    {
      id: "information",
      title: "අප එකතු කරන තොරතුරු",
      blocks: [
        { type: "list", items: [
          "ගිණුම් විස්තර: ඔබ ගිණුමක් සාදන විට ඔබගේ නම, ඊමේල් ලිපිනය සහ මුරපදය, සහ ඔබ එක් කිරීමට තෝරා ගන්නේ නම් ජංගම දුරකථන අංකය. මුරපද අපගේ සත්‍යාපන සේවාව විසින් ආරක්ෂිත (hash කළ) ආකාරයෙන් ගබඩා කරයි; අපට ඒවා කිසිවිටෙක සාමාන්‍ය පෙළෙන් නොපෙනේ.",
          "Google හරහා පිවිසීම: ඔබ Google සමඟ ඉදිරියට යාම තෝරා ගන්නේ නම්, ඔබගේ Google ගිණුමෙන් නම, ඊමේල් ලිපිනය සහ පැතිකඩ ඡායාරූපය අපට ලැබේ.",
          "සම්බන්ධ වීමේ පණිවිඩ: සම්බන්ධ වීමේ පෝරමය හරහා ඔබ එවන නම, ඊමේල් ලිපිනය, මාතෘකාව සහ පණිවිඩය.",
          "නිකුතු දැනුම්දීම්: ඔබගේ ඊමේල් ලිපිනය සහ ඒවා ලබා ගැනීමට ඔබ එකඟ වූ වේලාව.",
          "තාක්ෂණික දත්ත: වෙබ් අඩවිය ආරක්ෂිතව සහ නිසි ලෙස ක්‍රියාත්මක කිරීම සඳහා ඔබගේ IP ලිපිනය සහ මූලික බ්‍රවුසර තොරතුරු.",
        ] },
        { type: "p", text: "ඇණවුම් තවමත් විවෘත කර නැති නිසා, අපි ගෙවීම් කාඩ්පත් විස්තර හෝ බෙදාහැරීමේ ලිපින එකතු නොකරමු. එය වෙනස් වීමට පෙර මෙම ප්‍රතිපත්තිය යාවත්කාලීන කෙරේ." },
      ],
    },
    {
      id: "use",
      title: "අප තොරතුරු භාවිත කරන ආකාරය",
      blocks: [
        { type: "list", items: [
          "ඔබගේ ගිණුම සාදා පවත්වාගෙන යාමට සහ ඔබව පිවිසී සිටින තත්ත්වයේ තබා ගැනීමට.",
          "ඔබ ලබා දුන් ජංගම දුරකථන අංකය භාවිතයෙන් ඔබගේ ඇණවුම් සහ බෙදාහැරීම් ගැන ඔබව සම්බන්ධ කර ගැනීමට.",
          "ඔබ අපට එවන පණිවිඩවලට පිළිතුරු දීමට.",
          "ඔබ ඉල්ලූ නිකුතු දැනුම්දීම් එවීමට.",
          "ස්පෑම්, අපයෝජන සහ නැවත නැවත පිවිසීමේ උත්සාහයන්ගෙන් වෙබ් අඩවිය ආරක්ෂා කිරීමට.",
          "රහස්‍යතාවයට හිතකර, නිර්නාමික සංඛ්‍යාලේඛන හරහා වෙබ් අඩවියේ සමස්ත ක්‍රියාකාරිත්වය තේරුම් ගැනීමට.",
        ] },
        { type: "p", text: "අපි ඔබගේ පුද්ගලික තොරතුරු විකුණන්නේ නැත, ඒවා වෙළඳ දැන්වීම් සඳහා භාවිත කරන්නේද නැත." },
      ],
    },
    {
      id: "google",
      title: "Google හරහා පිවිසීම",
      blocks: [
        { type: "p", text: "ඔබ Google හරහා පිවිසෙන විට, අපි ඉල්ලන්නේ ඔබගේ මූලික පැතිකඩ (නම සහ පැතිකඩ ඡායාරූපය) සහ ඊමේල් ලිපිනය පමණි. මෙම තොරතුරු භාවිත කරන්නේ ඔබගේ BRAKMASRA ගිණුම සාදා ඔබව පිවිසීමට පමණි. ඔබගේ Gmail, සම්බන්ධතා, ගොනු හෝ වෙනත් කිසිදු Google දත්තයකට අපි ප්‍රවේශය ඉල්ලන්නේ නැත." },
        { type: "p", text: "Google API වෙතින් ලැබෙන තොරතුරු BRAKMASRA භාවිත කරන්නේ Limited Use අවශ්‍යතා ඇතුළුව Google API Services User Data Policy ප්‍රතිපත්තියට අනුකූලවය. පහත දැක්වෙන, වෙබ් අඩවිය ක්‍රියාත්මක කරන සේවා සපයන්නන් හැර අපි මෙම තොරතුරු වෙනත් කිසිවෙකුට ලබා නොදෙන අතර, ඒවා කිසිවිටෙක වෙළඳ දැන්වීම් සඳහා භාවිත නොකරමු." },
      ],
    },
    {
      id: "providers",
      title: "සේවා සපයන්නන්",
      blocks: [
        { type: "p", text: "වෙබ් අඩවිය ක්‍රියාත්මක කිරීමට අපි විශ්වාසදායක සේවා සපයන්නන් කිහිපදෙනෙකු භාවිත කරමු. ඔවුන් තමන්ගේම ආරක්ෂණ සහ රහස්‍යතා ප්‍රතිපත්ති යටතේ අප වෙනුවෙන් දත්ත සකසති:" },
        { type: "list", items: [
          "Supabase: දත්ත ගබඩාව සහ ගිණුම් පිවිසීම.",
          "Vercel: වෙබ් අඩවි සත්කාරය, සහ කුකී භාවිත නොකරන නිර්නාමික ගමනාගමන හා ක්‍රියාකාරිත්ව සංඛ්‍යාලේඛන.",
          "Google: ඔබගේ Google ගිණුම සමඟ විකල්ප පිවිසීම.",
        ] },
        { type: "p", text: "මෙම සේවා සපයන්නන් ශ්‍රී ලංකාවෙන් පිටත පිහිටි සේවාදායකවල දත්ත සැකසිය හැක." },
      ],
    },
    {
      id: "cookies",
      title: "කුකී සහ දේශීය ගබඩාව",
      blocks: [
        { type: "list", items: [
          "පිවිසුම් කුකී: ඔබව ඔබගේ ගිණුමට පිවිසී සිටින තත්ත්වයේ තබයි. මේවා නොමැතිව වෙබ් අඩවියට ගිණුම් ලබා දිය නොහැක.",
          "භාෂා කුකිය: ඔබ ඉංග්‍රීසි හෝ සිංහල තෝරා ගත්තේද යන්න මතක තබා ගනී.",
          "දේශීය ගබඩාව: ඔබගේ කරත්තයේ ඇති භාණ්ඩ ඔබගේම උපාංගයේ තබා ගනී.",
        ] },
        { type: "p", text: "අපි වෙළඳ දැන්වීම් හෝ වෙබ් අඩවි අතර ලුහුබැඳීමේ කුකී භාවිත නොකරමු." },
      ],
    },
    {
      id: "retention",
      title: "අප තොරතුරු තබා ගන්නා කාලය",
      blocks: [
        { type: "list", items: [
          "ගිණුම් විස්තර: ඔබගේ ගිණුම පවතින තාක් කල්.",
          "සම්බන්ධ වීමේ පණිවිඩ: ඔබගේ ඉල්ලීම හැසිරවීමට අවශ්‍ය කාලය පමණි.",
          "නිකුතු දැනුම්දීම් ඊමේල්: නතර කරන ලෙස ඔබ ඉල්ලන තුරු.",
          "ඔබගේ IP ලිපිනය අඩංගු ආරක්ෂණ වාර්තා: කල් ඉකුත් වූ පසු, සාමාන්‍යයෙන් දිනයක් ඇතුළත ස්වයංක්‍රීයව මකා දැමේ.",
        ] },
      ],
    },
    {
      id: "rights",
      title: "ඔබගේ තේරීම් සහ අයිතිවාසිකම්",
      blocks: [
        { type: "p", text: "ඔබගේ පුද්ගලික තොරතුරු වෙත ප්‍රවේශ වීමට, නිවැරදි කිරීමට හෝ මකා දැමීමට, ඔබගේ ගිණුම මකා දැමීමට, හෝ නිකුතු දැනුම්දීම් නතර කිරීමට ඔබට අපෙන් ඉල්ලිය හැක. 2022 අංක 9 දරන ශ්‍රී ලංකා පුද්ගලික දත්ත ආරක්ෂණ පනත ඇතුළු අදාළ නීතිවලට අනුකූලව ඔබගේ දත්ත හැසිරවීමට අපි උත්සාහ කරමු." },
        { type: "p", text: "ඉල්ලීමක් කිරීමට [support@brakmasra.com](mailto:support@brakmasra.com) වෙත ඊමේල් කරන්න, නැතහොත් [සම්බන්ධ වීමේ පිටුව](/contact) භාවිත කරන්න. ඉල්ලීම ක්‍රියාත්මක කිරීමට පෙර ඔබගේ අනන්‍යතාවය තහවුරු කරන ලෙස අපි ඉල්ලා සිටිය හැක." },
      ],
    },
    {
      id: "security",
      title: "ආරක්ෂාව",
      blocks: [
        { type: "p", text: "වෙබ් අඩවිය HTTPS හරහා සපයනු ලබන අතර, ගබඩා කළ දත්ත වෙත ප්‍රවේශය සීමා කර ඇති අතර, පෝරම ස්වයංක්‍රීය අපයෝජනයෙන් ආරක්ෂා කර ඇත. කිසිදු මාර්ගගත සේවාවක් සම්පූර්ණයෙන්ම ආරක්ෂිත විය නොහැකි බැවින්, වෙනත් තැනක භාවිත නොකරන ශක්තිමත් මුරපදයක් භාවිත කරන්න." },
      ],
    },
    {
      id: "children",
      title: "ළමයින්",
      blocks: [
        { type: "p", text: "මෙම වෙබ් අඩවිය වයස අවුරුදු 13ට අඩු ළමයින් සඳහා නොවන අතර, අපි දැනුවත්ව ඔවුන්ගේ පුද්ගලික තොරතුරු එකතු නොකරමු. ඔබ වයස අවුරුදු 18ට අඩු නම්, ගිණුමක් සෑදීමට පෙර දෙමාපියෙකුගෙන් හෝ භාරකරුවෙකුගෙන් විමසන්න." },
      ],
    },
    {
      id: "changes",
      title: "මෙම ප්‍රතිපත්තියේ වෙනස්කම්",
      blocks: [
        { type: "p", text: "අපගේ ක්‍රියාපටිපාටි වෙනස් වන විට, උදාහරණයක් ලෙස ඇණවුම් විවෘත කිරීමට පෙර, අපි මෙම පිටුව යාවත්කාලීන කරන්නෙමු. ඉහළින් ඇති දිනය එය අවසන් වරට වෙනස් කළ දිනය පෙන්වයි." },
      ],
    },
    {
      id: "contact",
      title: "අප අමතන්න",
      blocks: [
        { type: "p", text: "මෙම ප්‍රතිපත්තිය හෝ ඔබගේ දත්ත පිළිබඳ ප්‍රශ්න සඳහා, [support@brakmasra.com](mailto:support@brakmasra.com) වෙත ඊමේල් කරන්න, නැතහොත් [සම්බන්ධ වීමේ පිටුව](/contact) හරහා අපට පණිවිඩයක් එවන්න." },
      ],
    },
  ],
};

const termsEn: LegalDocument = {
  title: "Terms of Service",
  lead: "The rules for using the BRAKMASRA website and member accounts.",
  sections: [
    {
      id: "agreement",
      title: "About these terms",
      blocks: [
        { type: "p", text: "These terms apply to your use of brakmasra.com, operated by BRAKMASRA from Sri Lanka. By using the site or creating an account, you agree to them. If you do not agree, please do not use the site." },
      ],
    },
    {
      id: "store",
      title: "The upcoming store",
      blocks: [
        { type: "p", text: "The store is in a pre-launch stage. Products are shown as previews: their images, descriptions, sizes, and prices may change before release, and ordering is not open yet. Purchase terms covering payment, delivery, and returns will be published here before ordering opens, and will apply to every order." },
      ],
    },
    {
      id: "accounts",
      title: "Your account",
      blocks: [
        { type: "list", items: [
          "Give accurate information and keep it up to date.",
          "Keep your password private. You are responsible for activity on your account.",
          "One account per person. Do not create accounts for others or sign in as someone else.",
          "Tell us at [support@brakmasra.com](mailto:support@brakmasra.com) if you think someone else has accessed your account.",
        ] },
        { type: "p", text: "We may suspend or close accounts that break these terms or put the site or other people at risk." },
      ],
    },
    {
      id: "acceptable-use",
      title: "Acceptable use",
      blocks: [
        { type: "p", text: "When using the site, do not:" },
        { type: "list", items: [
          "Break the law or infringe anyone's rights.",
          "Attempt to bypass security, overload the site, or access data that is not yours.",
          "Use bots or scripts to scrape the site, create accounts, or submit forms.",
          "Send spam, abusive messages, or harmful content through the contact form.",
        ] },
      ],
    },
    {
      id: "content",
      title: "Our content",
      blocks: [
        { type: "p", text: "The BRAKMASRA name, logo, artwork, photography, and videos belong to BRAKMASRA. You may view and share links to them for personal, non-commercial purposes, but you may not copy, sell, or reuse them in products without our written permission." },
      ],
    },
    {
      id: "third-parties",
      title: "Other services",
      blocks: [
        { type: "p", text: "The site links to services we do not control, such as YouTube and TikTok, and lets you sign in with Google. Their own terms and privacy policies apply when you use them." },
      ],
    },
    {
      id: "disclaimer",
      title: "Availability and disclaimer",
      blocks: [
        { type: "p", text: "We work to keep the site available and accurate, but it is provided \"as is\" and may occasionally be unavailable, change, or contain errors. Product previews are for information only until ordering opens." },
      ],
    },
    {
      id: "liability",
      title: "Limitation of liability",
      blocks: [
        { type: "p", text: "To the extent permitted by law, BRAKMASRA is not liable for indirect or consequential loss arising from your use of the site. Nothing in these terms limits rights you have under law that cannot be excluded." },
      ],
    },
    {
      id: "law",
      title: "Governing law",
      blocks: [
        { type: "p", text: "These terms are governed by the laws of Sri Lanka." },
      ],
    },
    {
      id: "changes",
      title: "Changes to these terms",
      blocks: [
        { type: "p", text: "We may update these terms, for example when ordering opens. The date at the top shows when they last changed, and continuing to use the site after a change means you accept the updated terms." },
      ],
    },
    {
      id: "contact",
      title: "Contact us",
      blocks: [
        { type: "p", text: "Questions about these terms? Email [support@brakmasra.com](mailto:support@brakmasra.com) or send a message through the [contact page](/contact)." },
      ],
    },
  ],
};

const termsSi: LegalDocument = {
  title: "සේවා නියම",
  lead: "BRAKMASRA වෙබ් අඩවිය සහ සාමාජික ගිණුම් භාවිත කිරීමේ නීති.",
  sections: [
    {
      id: "agreement",
      title: "මෙම නියම ගැන",
      blocks: [
        { type: "p", text: "මෙම නියම ශ්‍රී ලංකාවේ සිට BRAKMASRA විසින් ක්‍රියාත්මක කරන brakmasra.com භාවිතයට අදාළ වේ. වෙබ් අඩවිය භාවිත කිරීමෙන් හෝ ගිණුමක් සෑදීමෙන් ඔබ මෙම නියමවලට එකඟ වේ. ඔබ එකඟ නොවන්නේ නම්, කරුණාකර වෙබ් අඩවිය භාවිත නොකරන්න." },
      ],
    },
    {
      id: "store",
      title: "ඉදිරි වෙළඳසැල",
      blocks: [
        { type: "p", text: "වෙළඳසැල නිකුත් කිරීමට පෙර අදියරේ පවතී. භාණ්ඩ පෙරදසුන් ලෙස පෙන්වා ඇත: ඒවායේ රූප, විස්තර, ප්‍රමාණ සහ මිල නිකුතුවට පෙර වෙනස් විය හැකි අතර, ඇණවුම් තවමත් විවෘත නැත. ගෙවීම්, බෙදාහැරීම සහ ආපසු ලබා දීම් ආවරණය කරන මිලදී ගැනීමේ නියම ඇණවුම් විවෘත කිරීමට පෙර මෙහි පළ කෙරෙන අතර, ඒවා සෑම ඇණවුමකටම අදාළ වේ." },
      ],
    },
    {
      id: "accounts",
      title: "ඔබගේ ගිණුම",
      blocks: [
        { type: "list", items: [
          "නිවැරදි තොරතුරු ලබා දී ඒවා යාවත්කාලීනව තබා ගන්න.",
          "ඔබගේ මුරපදය රහසිගතව තබා ගන්න. ඔබගේ ගිණුමේ සිදුවන ක්‍රියාකාරකම් සඳහා ඔබ වගකිව යුතුය.",
          "එක් අයෙකුට එක් ගිණුමක් පමණි. වෙනත් අය වෙනුවෙන් ගිණුම් සාදන්න හෝ වෙනත් අයෙකු ලෙස පිවිසෙන්න එපා.",
          "වෙනත් අයෙකු ඔබගේ ගිණුමට පිවිසී ඇතැයි ඔබ සිතන්නේ නම්, [support@brakmasra.com](mailto:support@brakmasra.com) වෙත අපට දන්වන්න.",
        ] },
        { type: "p", text: "මෙම නියම උල්ලංඝනය කරන, හෝ වෙබ් අඩවියට හෝ වෙනත් අයට අවදානමක් ඇති කරන ගිණුම් අපට අත්හිටුවීමට හෝ වසා දැමීමට හැක." },
      ],
    },
    {
      id: "acceptable-use",
      title: "පිළිගත හැකි භාවිතය",
      blocks: [
        { type: "p", text: "වෙබ් අඩවිය භාවිත කරන විට:" },
        { type: "list", items: [
          "නීතිය කඩ කරන්න හෝ කිසිවෙකුගේ අයිතිවාසිකම් උල්ලංඝනය කරන්න එපා.",
          "ආරක්ෂණ පියවර මඟ හැරීමට, වෙබ් අඩවිය අධිභාරයට පත් කිරීමට, හෝ ඔබට අයත් නොවන දත්ත වෙත ප්‍රවේශ වීමට උත්සාහ කරන්න එපා.",
          "වෙබ් අඩවියේ දත්ත උකහා ගැනීමට, ගිණුම් සෑදීමට හෝ පෝරම යැවීමට බොට් හෝ ස්ක්‍රිප්ට් භාවිත කරන්න එපා.",
          "සම්බන්ධ වීමේ පෝරමය හරහා ස්පෑම්, අපහාසාත්මක පණිවිඩ හෝ හානිකර අන්තර්ගත යවන්න එපා.",
        ] },
      ],
    },
    {
      id: "content",
      title: "අපගේ අන්තර්ගතය",
      blocks: [
        { type: "p", text: "BRAKMASRA නාමය, ලාංඡනය, කලා නිර්මාණ, ඡායාරූප සහ වීඩියෝ BRAKMASRA සතු වේ. පුද්ගලික, වාණිජ නොවන අරමුණු සඳහා ඒවා නැරඹීමට සහ ඒවායේ සබැඳි බෙදා ගැනීමට ඔබට හැකි නමුත්, අපගේ ලිඛිත අවසරයකින් තොරව ඒවා පිටපත් කිරීම, විකිණීම හෝ භාණ්ඩවල නැවත භාවිත කිරීම නොකළ යුතුය." },
      ],
    },
    {
      id: "third-parties",
      title: "වෙනත් සේවා",
      blocks: [
        { type: "p", text: "වෙබ් අඩවිය YouTube සහ TikTok වැනි අප පාලනය නොකරන සේවාවලට සබැඳි ලබා දෙන අතර, Google සමඟ පිවිසීමටද ඉඩ දෙයි. ඔබ ඒවා භාවිත කරන විට ඒවායේම නියම සහ රහස්‍යතා ප්‍රතිපත්ති අදාළ වේ." },
      ],
    },
    {
      id: "disclaimer",
      title: "ලබා ගත හැකි බව සහ වියාචනය",
      blocks: [
        { type: "p", text: "වෙබ් අඩවිය ලබා ගත හැකි සහ නිවැරදිව තබා ගැනීමට අපි උත්සාහ කළද, එය \"පවතින ආකාරයෙන්\" සපයනු ලබන අතර, ඉඳහිට ලබා ගත නොහැකි වීමට, වෙනස් වීමට හෝ දෝෂ අඩංගු වීමට හැක. ඇණවුම් විවෘත වන තුරු භාණ්ඩ පෙරදසුන් තොරතුරු සඳහා පමණි." },
      ],
    },
    {
      id: "liability",
      title: "වගකීම් සීමා කිරීම",
      blocks: [
        { type: "p", text: "නීතියෙන් අවසර දී ඇති තරමට, ඔබ වෙබ් අඩවිය භාවිත කිරීමෙන් ඇතිවන වක්‍ර හෝ ප්‍රතිඵලයක් ලෙස ඇතිවන අලාභ සඳහා BRAKMASRA වගකිව යුතු නොවේ. නීතිය යටතේ ඉවත් කළ නොහැකි ඔබගේ අයිතිවාසිකම් මෙම නියම කිසිවකින් සීමා නොවේ." },
      ],
    },
    {
      id: "law",
      title: "පාලක නීතිය",
      blocks: [
        { type: "p", text: "මෙම නියම ශ්‍රී ලංකාවේ නීතිවලට යටත් වේ." },
      ],
    },
    {
      id: "changes",
      title: "මෙම නියමවල වෙනස්කම්",
      blocks: [
        { type: "p", text: "උදාහරණයක් ලෙස ඇණවුම් විවෘත වන විට, අපට මෙම නියම යාවත්කාලීන කළ හැක. ඉහළින් ඇති දිනය ඒවා අවසන් වරට වෙනස් කළ දිනය පෙන්වන අතර, වෙනසකින් පසුව වෙබ් අඩවිය දිගටම භාවිත කිරීමෙන් ඔබ යාවත්කාලීන නියම පිළිගනී." },
      ],
    },
    {
      id: "contact",
      title: "අප අමතන්න",
      blocks: [
        { type: "p", text: "මෙම නියම ගැන ප්‍රශ්න තිබේද? [support@brakmasra.com](mailto:support@brakmasra.com) වෙත ඊමේල් කරන්න, නැතහොත් [සම්බන්ධ වීමේ පිටුව](/contact) හරහා අපට පණිවිඩයක් එවන්න." },
      ],
    },
  ],
};

export const legalDocuments: Record<LegalDocumentId, Record<Language, LegalDocument>> = {
  privacy: { en: privacyEn, si: privacySi },
  terms: { en: termsEn, si: termsSi },
};
