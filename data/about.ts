import type { Language } from "@/lib/i18n";

type AboutCopy = {
  heroTitle: string; heroDescription: string; heroAlt: string; portraitAlt: string; detailAlt: string;
  storyTitle: string; storyDescription: string; originDetails: string;
  editorialTitle: string; editorialDescription: string; principlesTitle: string;
  principles: { title: string; description: string }[];
  channelTitle: string; galleryTitle: string; galleryDescription: string; viewPiece: string;
};

export const aboutCopy: Record<Language, AboutCopy> = {
  en: {
    heroTitle: "Wear your curiosity.",
    heroDescription: "Dark graphics, relaxed silhouettes, and stories that stay with you.",
    heroAlt: "Two models wearing black and white BRAKMASRA graphic tees against a light studio background",
    portraitAlt: "Campaign portrait of a model wearing the white Paradise Lost tee beside a grey courtyard wall",
    detailAlt: "Paradise Lost and Caged Freedom graphic tees arranged on a concrete plinth",
    storyTitle: "From the unknown. Into the everyday.",
    storyDescription: "Our world begins with curiosity. Inspired by mysterious journeys and forgotten places, BRAKMASRA brings that same character to the pieces you reach for every day.",
    originDetails: "Explore our origins",
    editorialTitle: "More than a graphic.",
    editorialDescription: "A place, a feeling, a story you cannot quite leave behind. The artwork carries it. You make it your own.",
    principlesTitle: "What makes it BRAKMASRA.",
    principles: [
      { title: "Artwork with a story", description: "Graphics inspired by the mystery, atmosphere, and stories behind our world." },
      { title: "Room to be yourself", description: "Relaxed, oversized silhouettes that leave room for your own way of dressing." },
      { title: "Darkness, your way", description: "Washed black or a clean white canvas. A different expression of the same character." },
    ],
    channelTitle: "The curiosity behind the clothes.",
    galleryTitle: "Find your own expression.",
    galleryDescription: "A closer look at the first collection. Choose the story that speaks to you.",
    viewPiece: "View piece",
  },
  si: {
    heroTitle: "කුතුහලය ඔබේ විලාසිතාව කරගන්න.",
    heroDescription: "අඳුරු රූ රටා, නිදහස් හැඩ සහ ඔබ සමඟ රැඳෙන කතා.",
    heroAlt: "ලා පැහැති පසුබිමක කළු සහ සුදු BRAKMASRA රූ රටා ටී ෂර්ට් ඇඳ සිටින නිරූපණ ශිල්පීන් දෙදෙනෙක්",
    portraitAlt: "අළු පැහැති බිත්තියක් අසල සුදු Paradise Lost ටී ෂර්ට් එක ඇඳ සිටින නිරූපණ ශිල්පිනියකගේ ප්‍රචාරක රූපයක්",
    detailAlt: "කොන්ක්‍රීට් පීඨයක් මත තබා ඇති Paradise Lost සහ Caged Freedom ටී ෂර්ට්",
    storyTitle: "අභිරහසෙන් ඇරඹී, එදිනෙදා ජීවිතයට.",
    storyDescription: "අපේ ලෝකය ඇරඹෙන්නේ කුතුහලයෙනි. අභිරහස් ගමන් සහ අමතක වූ ස්ථානවලින් ආභාසය ලබන BRAKMASRA, එම අනන්‍යතාවය ඔබ දිනපතා තෝරාගන්නා ඇඳුම්වලට ගෙන එයි.",
    originDetails: "අපේ ආරම්භය දැනගන්න",
    editorialTitle: "රූ රටාවකට වඩා යමක්.",
    editorialDescription: "ස්ථානයක්, හැඟීමක්, අමතක කළ නොහැකි කතාවක්. එය රූ රටාව තුළ රැඳෙයි. එයට ඔබේම අරුතක් දෙන්න.",
    principlesTitle: "BRAKMASRA අනන්‍යතාවය.",
    principles: [
      { title: "කතාවක් රැගත් නිර්මාණ", description: "අපේ ලෝකයේ අභිරහස්, වාතාවරණය සහ කතාවලින් ආභාසය ලැබූ රූ රටා." },
      { title: "ඔබ ඔබම වීමට ඉඩක්", description: "ඔබේම ආකාරයට ඇඳීමට ඉඩ දෙන, නිදහස් සහ විශාල හැඩැති ඇඳුම්." },
      { title: "ඔබේම ආකාරයේ අඳුරක්", description: "සේදුණු කළු පැහැය හෝ පිරිසිදු සුදු පසුබිම. එකම අනන්‍යතාවයේ වෙනස් ප්‍රකාශන." },
    ],
    channelTitle: "ඇඳුම් පිටුපස ඇති කුතුහලය.",
    galleryTitle: "ඔබේම ප්‍රකාශනය සොයාගන්න.",
    galleryDescription: "පළමු එකතුව සමීපව බලන්න. ඔබට ගැළපෙන කතාව තෝරාගන්න.",
    viewPiece: "නිර්මාණය බලන්න",
  },
};
