export type ChannelVideo = {
  id: string;
  title: string;
  views: string;
  published: string;
  duration: string;
};

export const channel = {
  id: "UCJS5mX07b98qeG4Lhqa12XQ",
  name: "BRAKMASRA",
  handle: "@Brakmasra",
  url: "https://www.youtube.com/@Brakmasra",
  avatar: "https://yt3.googleusercontent.com/qM7aOVHFOLU6IKz1sXV0kH54ZxPx0cE7e4EW2_ot2vFpGzHZ6wkdeGmG9YEpyD8OtqFULkdfplk=s900-c-k-c0x00ffffff-no-rj",
  subscribers: "2.89K",
  videoCount: "12",
  totalViews: null as string | null,
  snapshotDate: "2026-08-22",
  description: "On this YouTube channel we go on mysterious road trips, exploration videos, and ghost hunts. From abandoned refugee camps to haunted prisons, see our mysterious encounters as we sleep alone in the most dangerous places in the world. Subscribe to travel with us and explore the unknown!",
};

export const videos: ChannelVideo[] = [
  { id: "cQ_7MOEC8VM", title: "The Room Where Asmodeus Was Summoned | Brakmasra | Investigation | Holman", views: "1.3K views", published: "3 weeks ago", duration: "24:55" },
  { id: "JFiKX0ra8YM", title: "කාමරයේ අත්බූථ දේවල් සිද්දවෙනවා | Investigation | Holman | Brakmasra", views: "1.8K views", published: "1 month ago", duration: "24:38" },
  { id: "_Iqc8fTxTNw", title: "ඇත්තෙන්ම අපිට මොකද උනේ / Real Story Of Brakmasra", views: "1.2K views", published: "1 month ago", duration: "5:04" },
  { id: "aXKcEUgtbhg", title: "අත්බූත ජීවීන් සොයා යන ගමන | Brakmasra | Holman | Investigation", views: "2.3K views", published: "1 year ago", duration: "0:26" },
  { id: "MbzYh8yqlSs", title: "ඒ අත්බූත ජීවියෙක්ගේ පහර දීමක්ද ? | Brakmasra | Horror | Investigation", views: "5.5K views", published: "1 year ago", duration: "29:39" },
  { id: "WEp7fZvy1n0", title: "අධි ආරක්ශිත කලාපයකට හොරෙන් ගියා | Brakmasra | YaYa Palmada | Investigation", views: "3.2K views", published: "1 year ago", duration: "26:48" },
  { id: "ciej_HcenZE", title: "යක්ෂයාගේ වනාන්තරයේ රැයක් | Brakmasra | Satan | Holman", views: "1K views", published: "1 year ago", duration: "15:12" },
  { id: "kodwtJadYwE", title: "පිටසක්වල කැලයේ නොදුටු පැත්ත / Ya Ya 001 Episode 5 / Palmada / Brakmasra", views: "4.4K views", published: "1 year ago", duration: "22:29" },
  { id: "Z-jpPo4ds-M", title: "පිටසක්වල වනාන්තරයේ දැකපු අත්බූත දේ / Episode 4 / Palmada / Brakmasra", views: "1.6K views", published: "1 year ago", duration: "1:03" },
  { id: "-ahR8k6WIMs", title: "පිටසක්වල වනාන්තරයේ රැයක් / Ya Ya 001 Episode 3 / Palmada / Brakmasra", views: "5.1K views", published: "1 year ago", duration: "37:09" },
  { id: "6Vis_-IR1T4", title: "පිටසක්වල වනාන්තරයේ අබිරහස 2 / Ya Ya 001 Episode 2 / Palmada / Brakmasra", views: "9.4K views", published: "1 year ago", duration: "30:11" },
  { id: "AwabCKSHXJk", title: "පිටසක්වල වනාන්තරයේ අබිරහස / Ya Ya 001 Episode 1 / Palmada / Brakmasra", views: "8.6K views", published: "1 year ago", duration: "8:02" },
];

export const shorts = videos.filter((video) => {
  const [minutes] = video.duration.split(":").map(Number);
  return minutes <= 1;
});

export const socialLinks = [
  { label: "TikTok", handle: "@Brakmasraofficial", href: process.env.NEXT_PUBLIC_TIKTOK_URL },
  { label: "Facebook", handle: "@Brakmasra", href: process.env.NEXT_PUBLIC_FACEBOOK_URL },
  { label: "X", handle: "@Brakmasra", href: process.env.NEXT_PUBLIC_X_URL },
].filter((item): item is typeof item & { href: string } => Boolean(item.href));
