import type { Language } from "@/lib/i18n";

export type JournalCategory = "style" | "artwork" | "care";
type ArticleCopy = {
  title: string; excerpt: string; imageAlt: string; lead: string;
  sections: { heading: string; paragraphs: string[] }[];
};
export type JournalPost = {
  slug: string; category: JournalCategory; image: string; width: number; height: number;
  productSlug: string; copy: Record<Language, ArticleCopy>;
};

export const journalCopy = {
  en: {
    title: "The journal.", description: "Personal style, graphic stories, and a closer look at our world.",
    all: "All stories", style: "Style", artwork: "Artwork", care: "Care",
    read: "Read story", latest: "More from the journal", back: "Back to the journal",
    collection: "Make it your own.", collectionDescription: "Explore the graphics and find the piece that feels like you.",
    shop: "Explore the collection", piece: "Explore this piece", related: "Keep reading.",
    filterLabel: "Filter stories by topic", empty: "No stories in this category yet.",
    minutes: "min read", byline: "BRAKMASRA Journal", contents: "In this story",
  },
  si: {
    title: "අපේ සටහන්.", description: "ඔබේම විලාසිතාව, රූ රටා පිටුපස කතා සහ අපේ ලෝකය පිළිබඳ සමීප බැල්මක්.",
    all: "සියලු සටහන්", style: "විලාසිතා", artwork: "රූ රටා", care: "රැකවරණය",
    read: "සටහන කියවන්න", latest: "තවත් සටහන්", back: "සටහන් වෙත ආපසු",
    collection: "ඔබේම කරගන්න.", collectionDescription: "රූ රටා ගවේෂණය කර ඔබට ගැළපෙන නිර්මාණය තෝරාගන්න.",
    shop: "එකතුව ගවේෂණය කරන්න", piece: "මෙම නිර්මාණය බලන්න", related: "තවත් කියවන්න.",
    filterLabel: "මාතෘකාව අනුව සටහන් තෝරන්න", empty: "මෙම මාතෘකාව යටතේ තවමත් සටහන් නැත.",
    minutes: "කියවීමට මිනිත්තු", byline: "BRAKMASRA සටහන්", contents: "මෙම සටහනේ",
  },
} satisfies Record<Language, Record<string, string>>;

export const journalPosts: JournalPost[] = [
  {
    slug: "your-guide-to-the-oversized-tee", category: "style",
    image: "/images/journal/courtyard-feature.webp", width: 1374, height: 1145,
    productSlug: "caged-freedom-tee",
    copy: {
      en: {
        title: "The oversized tee, your way.",
        excerpt: "An easy guide to proportion, layering, and finding a fit that feels like you.",
        imageAlt: "Two models wearing black and white BRAKMASRA graphic tees in a concrete courtyard",
        lead: "An oversized tee gives an outfit room to breathe. Start with the shape you like, then let the rest of your clothes work around it.",
        sections: [
          { heading: "Start with proportion", paragraphs: ["Try relaxed trousers for a loose silhouette from shoulder to shoe. If you prefer more contrast, pair the tee with a straighter leg. Neither needs to be a rule. Look at the whole shape in the mirror and choose what feels comfortable when you move."] },
          { heading: "Let the graphic lead", paragraphs: ["A detailed front print can be the focus of the outfit. Simple trousers and a small number of accessories give it space. Keep a jacket open when you want the artwork visible, or let the hem show beneath a shorter outer layer."] },
          { heading: "Find your own fit", paragraphs: ["Oversized describes a silhouette, not a universal size. Compare the measurements on the product page with a tee you already enjoy wearing. Check the body length and width before choosing, and ask us if you need help. The right fit is the one you want to reach for again."] },
        ],
      },
      si: {
        title: "විශාල ටී ෂර්ට් එක, ඔබේම ආකාරයට.",
        excerpt: "හැඩය, ඇඳුම් ස්තර සහ ඔබට ගැළපෙන ප්‍රමාණය තෝරාගැනීමට සරල මඟපෙන්වීමක්.",
        imageAlt: "කොන්ක්‍රීට් මළුවක කළු සහ සුදු BRAKMASRA ටී ෂර්ට් ඇඳ සිටින නිරූපණ ශිල්පීන් දෙදෙනෙක්",
        lead: "විශාල ටී ෂර්ට් එකක් ඔබේ ඇඳුමට නිදහසක් ලබා දෙයි. ඔබ කැමති හැඩයෙන් අරඹා අනෙක් ඇඳුම් එයට ගළපාගන්න.",
        sections: [
          { heading: "සමස්ත හැඩයෙන් අරඹන්න", paragraphs: ["උරහිසේ සිට සපත්තුව දක්වා නිදහස් හැඩයක් සඳහා බුරුල් කලිසමක් අත්හදා බලන්න. වෙනසක් කැමති නම් සෘජු හැඩැති කලිසමක් තෝරන්න. මෙය නීතියක් විය යුතු නැත. කැඩපතෙන් සමස්ත හැඩය බලා, චලනය වන විට පහසු දේ තෝරාගන්න."] },
          { heading: "රූ රටාවට ඉඩ දෙන්න", paragraphs: ["විස්තර සහිත ඉදිරිපස රූ රටාව ඇඳුමේ ප්‍රධාන අංගය විය හැක. සරල කලිසමක් සහ අඩු ආභරණ එයට ඉඩ ලබා දෙයි. රූ රටාව පෙනීමට ජැකට් එක විවෘතව තබන්න. නැතහොත් කෙටි පිටත ඇඳුමකට යටින් ටී ෂර්ට් වාටිය පෙනෙන්නට ඉඩ දෙන්න."] },
          { heading: "ඔබට ගැළපෙන ප්‍රමාණය සොයන්න", paragraphs: ["විශාල හැඩය යනු සෑම ඇඳුමකටම එකම ප්‍රමාණයක් නොවේ. භාණ්ඩ පිටුවේ මිනුම් ඔබ දැනට ඇඳීමට කැමති ටී ෂර්ට් එකක් සමඟ සසඳන්න. දිග සහ පළල බලන්න. උදව් අවශ්‍ය නම් අපෙන් අසන්න. හොඳම හැඩය යනු නැවතත් ඇඳීමට සිතෙන හැඩයයි."] },
        ],
      },
    },
  },
  {
    slug: "black-or-white-find-your-canvas", category: "style",
    image: "/images/about/paradise-courtyard.webp", width: 1086, height: 1448,
    productSlug: "paradise-lost-tee",
    copy: {
      en: {
        title: "Black or white. Find your canvas.",
        excerpt: "Two starting points, plenty of possibilities. Build an outfit around the mood of your graphic.",
        imageAlt: "Model wearing a white Paradise Lost graphic tee beside a grey courtyard wall",
        lead: "The colour behind a graphic changes how you see it. A white tee gives the artwork a clean backdrop. A black tee brings the print into a darker overall look.",
        sections: [
          { heading: "A lighter starting point", paragraphs: ["A white graphic tee works easily with charcoal denim, faded black trousers, or a simple grey layer. Keep the rest of the outfit quiet when the print has strong colour. On warmer days, a lighter trouser can carry that open feeling through the whole look."] },
          { heading: "Build around black", paragraphs: ["Black on black does not have to feel flat. Mix the shape of the tee with the texture of denim or an open overshirt. Let the print create the contrast, and use your footwear to make the outfit feel sharper or more relaxed."] },
          { heading: "Choose for your wardrobe", paragraphs: ["Think about the trousers and layers you already wear most. The piece that works with them is often the one you will enjoy more. There is no need to rebuild an entire wardrobe around one tee. Start with a familiar outfit and change one element."] },
        ],
      },
      si: {
        title: "කළු ද සුදු ද? ඔබේ පසුබිම තෝරාගන්න.",
        excerpt: "ආරම්භ දෙකක්, හැකියාවන් රැසක්. රූ රටාවේ හැඟීමට ගැළපෙන ඇඳුමක් ගොඩනඟන්න.",
        imageAlt: "අළු බිත්තියක් අසල සුදු Paradise Lost ටී ෂර්ට් එක ඇඳ සිටින නිරූපණ ශිල්පිනියක්",
        lead: "රූ රටාව පිටුපස ඇති වර්ණය එය පෙනෙන ආකාරය වෙනස් කරයි. සුදු පැහැය පිරිසිදු පසුබිමක් දෙයි. කළු පැහැය එය අඳුරු සමස්ත පෙනුමකට ගෙන යයි.",
        sections: [
          { heading: "සැහැල්ලු ආරම්භයක්", paragraphs: ["සුදු රූ රටා ටී ෂර්ට් එකක් අඳුරු අළු ඩෙනිමක්, සේදුණු කළු කලිසමක් හෝ සරල අළු ස්තරයක් සමඟ පහසුවෙන් ගැළපේ. රූ රටාවේ තද වර්ණ තිබේ නම් අනෙක් ඇඳුම් සරලව තබන්න. උණුසුම් දිනවල සැහැල්ලු පැහැති කලිසමක් එම නිදහස් හැඟීම පවත්වා ගනියි."] },
          { heading: "කළු පැහැය වටා ගොඩනඟන්න", paragraphs: ["කළු සමඟ කළු ඇඳීම ඒකාකාර විය යුතු නැත. ටී ෂර්ට් හැඩය ඩෙනිම් වයනයක් හෝ විවෘත පිටත කමිසයක් සමඟ ගළපන්න. රූ රටාවට වෙනස ඇති කිරීමට ඉඩ දී, සපත්තුවෙන් පෙනුම තවත් පිළිවෙළට හෝ නිදහස් ආකාරයට වෙනස් කරන්න."] },
          { heading: "ඔබේ ඇඳුම් එකතුවට තෝරන්න", paragraphs: ["ඔබ වැඩිපුරම අඳින කලිසම් සහ පිටත ඇඳුම් ගැන සිතන්න. ඒවාට ගැළපෙන නිර්මාණය බොහෝ විට ඔබ වැඩියෙන් භාවිත කරනු ඇත. එක් ටී ෂර්ට් එකක් වෙනුවෙන් සියලු ඇඳුම් වෙනස් කිරීමට අවශ්‍ය නැත. හුරුපුරුදු ඇඳුමකින් අරඹා එක් අංගයක් වෙනස් කරන්න."] },
        ],
      },
    },
  },
  {
    slug: "the-story-in-the-graphic", category: "artwork",
    image: "/images/models/intoxicated-medusa.webp", width: 900, height: 1200,
    productSlug: "intoxicated-medusa-tee",
    copy: {
      en: {
        title: "There is a story in the graphic.",
        excerpt: "Look closer at the imagery, contrast, and atmosphere that give a graphic tee its character.",
        imageAlt: "Model wearing the black Intoxicated Medusa graphic tee",
        lead: "Before a graphic becomes part of an outfit, it asks you to look. A face, a symbol, a fragment of lettering: the details are what make one piece feel different from another.",
        sections: [
          { heading: "Look beyond the first impression", paragraphs: ["From a distance, you notice the silhouette and the largest shapes. Up close, smaller marks and lettering begin to appear. Take a moment with the product photographs. A graphic you keep finding details in can feel more personal than a print chosen only for its colour."] },
          { heading: "Atmosphere is part of the design", paragraphs: ["BRAKMASRA draws its identity from mystery and curiosity. The collection carries that mood through stark imagery, dark backgrounds, and contrasting accents. You do not need to give every symbol a fixed meaning. The feeling it leaves with you matters too."] },
          { heading: "Wear your interpretation", paragraphs: ["The same tee can feel different on two people. How you layer it, what you pair it with, and where you wear it all become part of the story. Choose a graphic you want to live with, then give it your own context."] },
        ],
      },
      si: {
        title: "රූ රටාව තුළ කතාවක් ඇත.",
        excerpt: "රූ රටා ටී ෂර්ට් එකකට අනන්‍යතාවය දෙන රූප, වෙනස්කම් සහ වාතාවරණය සමීපව බලන්න.",
        imageAlt: "කළු Intoxicated Medusa රූ රටා ටී ෂර්ට් එක ඇඳ සිටින නිරූපණ ශිල්පියෙක්",
        lead: "රූ රටාවක් ඇඳුමක කොටසක් වීමට පෙර ඔබේ බැල්ම ඉල්ලයි. මුහුණක්, සංකේතයක්, අකුරු කිහිපයක්: එක් නිර්මාණයක් අනෙකෙන් වෙනස් කරන්නේ එම විස්තරයි.",
        sections: [
          { heading: "පළමු බැල්මෙන් එහා බලන්න", paragraphs: ["දුරින් බැලූ විට ඇඳුමේ හැඩය සහ විශාල රූප පෙනේ. සමීපව බැලූ විට කුඩා සලකුණු සහ අකුරු මතු වෙයි. භාණ්ඩ ඡායාරූප සමඟ මොහොතක් ගත කරන්න. වර්ණයට පමණක් තෝරාගත් රටාවකට වඩා නැවත නැවත විස්තර සොයාගත හැකි රටාවක් ඔබට පෞද්ගලික විය හැක."] },
          { heading: "වාතාවරණයත් නිර්මාණයේ කොටසකි", paragraphs: ["BRAKMASRA අනන්‍යතාවය අභිරහස සහ කුතුහලයෙන් ආභාසය ලබයි. තද රූප, අඳුරු පසුබිම් සහ වෙනස් වර්ණ එම හැඟීම එකතුව තුළ රඳවයි. සෑම සංකේතයකටම නිශ්චිත අර්ථයක් දීමට අවශ්‍ය නැත. එයින් ඔබට දැනෙන හැඟීමත් වැදගත්ය."] },
          { heading: "ඔබේම අර්ථයෙන් අඳින්න", paragraphs: ["එකම ටී ෂර්ට් එක පුද්ගලයන් දෙදෙනෙකු මත වෙනස් ලෙස පෙනිය හැක. ඔබ එයට එක් කරන ස්තර, අනෙක් ඇඳුම් සහ එය අඳින ස්ථාන කතාවේ කොටසක් වෙයි. ඔබ සමඟ රැඳීමට කැමති රූ රටාවක් තෝරා එයට ඔබේම පසුබිම දෙන්න."] },
        ],
      },
    },
  },
  {
    slug: "a-little-care-for-your-graphic-tee", category: "care",
    image: "/images/journal/graphic-care-portrait.webp", width: 1086, height: 1448,
    productSlug: "paradise-lost-tee",
    copy: {
      en: {
        title: "A little care goes a long way.",
        excerpt: "Simple habits for looking after the tees you reach for most.",
        imageAlt: "Black and white graphic tees laid over a concrete plinth",
        lead: "Your favourite tee gets worn, washed, and worn again. A few thoughtful habits can help you look after it, starting with the care label on the garment itself.",
        sections: [
          { heading: "Read the label first", paragraphs: ["The garment's instructions take priority over any general guide. Check the recommended wash method, temperature, and drying instructions. Keep darker and lighter colours separate, especially when washing a piece for the first time."] },
          { heading: "Be gentle with the artwork", paragraphs: ["Where the care label allows machine washing, turn the tee inside out to reduce friction on the print. Avoid scrubbing the artwork directly. Follow the label's guidance on detergent and heat, and keep an iron away from the printed area unless the instructions specifically allow it."] },
          { heading: "Store it ready for next time", paragraphs: ["Let the tee dry fully before putting it away. Fold it without forcing a sharp crease through the print and give it room in your drawer. If you are unsure about care for a specific piece, send us the product name through the contact page before trying a new cleaning method."] },
        ],
      },
      si: {
        title: "කුඩා රැකවරණයක් බොහෝ දුර යයි.",
        excerpt: "ඔබ වැඩිපුරම අඳින ටී ෂර්ට් රැකගැනීමට සරල පුරුදු කිහිපයක්.",
        imageAlt: "කොන්ක්‍රීට් පීඨයක් මත තබා ඇති කළු සහ සුදු රූ රටා ටී ෂර්ට්",
        lead: "ඔබ කැමති ටී ෂර්ට් එක නැවත නැවත ඇඳෙයි, සේදෙයි. ඇඳුමේ ඇති රැකවරණ ලේබලයෙන් අරඹන සරල පුරුදු කිහිපයක් එය රැකගැනීමට උපකාරී වේ.",
        sections: [
          { heading: "මුලින් ලේබලය කියවන්න", paragraphs: ["ඇඳුමේ උපදෙස් ඕනෑම සාමාන්‍ය මඟපෙන්වීමකට වඩා ප්‍රමුඛ වේ. සේදීමේ ක්‍රමය, උෂ්ණත්වය සහ වියළීමේ උපදෙස් බලන්න. විශේෂයෙන් පළමු වරට සෝදන විට අඳුරු සහ සැහැල්ලු වර්ණ වෙන් කරන්න."] },
          { heading: "රූ රටාව මෘදුව රැකගන්න", paragraphs: ["ලේබලය යන්ත්‍රයෙන් සේදීමට ඉඩ දෙන්නේ නම්, මුද්‍රණය මත ඝර්ෂණය අඩු කිරීමට ටී ෂර්ට් එක කණපිට හරවන්න. රූ රටාව සෘජුව අතුල්ලන්න එපා. සේදුම් ද්‍රව්‍ය සහ තාපය පිළිබඳ ලේබලයේ උපදෙස් පිළිපදින්න. විශේෂ අවසරයක් නැති නම් මුද්‍රණය මත ඉස්ත්‍රික්කය තබන්න එපා."] },
          { heading: "ඊළඟ වතාවට සූදානම්ව තබන්න", paragraphs: ["අසුරා තැබීමට පෙර ටී ෂර්ට් එක සම්පූර්ණයෙන් වියළෙන්නට ඉඩ දෙන්න. මුද්‍රණය හරහා තද නැමීමක් ඇති නොකර නවා ලාච්චුවේ ඉඩක් දෙන්න. නිශ්චිත ඇඳුමක රැකවරණය ගැන සැක නම් නව පිරිසිදු කිරීමේ ක්‍රමයක් අත්හදා බැලීමට පෙර භාණ්ඩයේ නම සමඟ අපට සම්බන්ධ වීමේ පිටුවෙන් ලියන්න."] },
        ],
      },
    },
  },
];

export function getJournalPost(slug: string) {
  return journalPosts.find((post) => post.slug === slug);
}
