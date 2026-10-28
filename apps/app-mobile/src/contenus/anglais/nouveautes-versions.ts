import type { NouveautesVersion } from "~/contenus/nouveautes-versions";

export const NOUVEAUTES_VERSIONS_ANGLAIS: readonly NouveautesVersion[] = [
  {
    version: "1.0.3",
    libelle: "1.0.3",
    date: null,
    titre: "The Captain's dressed to the nines",
    points: [
      { emoji: "📰", titre: "News from the Miamis", detail: "In “For you” › News, ambassadors tell you about their places: spotlights, neighbourhood tops, deals and days out, reviewed by the Brigade. Likes, comments, and the place's page just a tap away." },
      { emoji: "🎃", titre: "Seasonal themes", detail: "Christmas, galette season, Fête de la musique… the Captain dresses up at the top of “For you”. You can turn it off in Settings › Appearance." },
      { emoji: "🖼️", titre: "Places have their own banner", detail: "A photo at the top of the place's page and a logo next to its name, added by verified places." },
    ],
  },
  {
    version: "1.0.2",
    libelle: "1.0.2",
    date: "23 October 2026",
    titre: "Your messages have had a makeover",
    points: [
      { emoji: "💬", titre: "Messages have their own tab", detail: "First in Community, with a dot for unread messages." },
      { emoji: "↩️", titre: "Reply, edit, copy, and “Seen”", detail: "Swipe a bubble to reply to it, and the time says “5 min ago”. You'll find the “Seen” setting in Settings › Messages." },
      { emoji: "🎞️", titre: "GIFs have landed", detail: "Find the perfect GIF and send it to your crew." },
      { emoji: "🍝", titre: "“Where shall we eat?”", detail: "A poll of places in your groups – the winner kicks off the get-together." },
      { emoji: "🔔", titre: "The message in the notification", detail: "Read it without opening the app (or just see who's messaging you, your choice) and reply right from there. It stays encrypted all the way to your phone." },
      { emoji: "🔴", titre: "A dot on the icon", detail: "Your messages, invitations and notifications at a glance." },
      { emoji: "📸", titre: "Several photos with a note", detail: "Up to 10 at once, and full screen with zoom." },
      { emoji: "🎙️", titre: "A lively mic", detail: "You can see your voice while you record a voice note." },
      { emoji: "📌", titre: "Pin, search, drafts", detail: "Your favourite conversations at the top, and nothing gets lost on the way." },
      { emoji: "😋", titre: "Mentions and double-tap", detail: "@ a friend to give them a heads-up, and double-tap a message to say yum." },
      { emoji: "👥", titre: "Group info", detail: "Its name, photo and members, and everything shared there." },
      { emoji: "⏰", titre: "Get-together reminder", detail: "1 hour before, a note in the conversation and a notification." },
      { emoji: "🎉", titre: "What's new", detail: "This window, and its own page in Settings." },
    ],
  },
  {
    version: "1.0.1",
    libelle: "1.0.1",
    date: "22 October 2026",
    titre: "Say hello to dark mode",
    points: [
      { emoji: "🌙", titre: "Dark mode", detail: "In Settings › Appearance, or just like your phone." },
      { emoji: "📷", titre: "Lighter photos", detail: "Up to 5 MB, slimmed down for you before sending." },
      { emoji: "🐞", titre: "Bug hunt and Get involved", detail: "In Settings › Inside SOS Miam." },
      { emoji: "⚡", titre: "A faster feed", detail: "The next posts load while you watch." },
    ],
  },
  {
    version: "1.0.0",
    libelle: "1.0",
    date: null,
    titre: "Welcome aboard",
    points: [
      { emoji: "🛟", titre: "The very first version", detail: "Evening SOS alerts, rescues, confirmed visits, loyalty cards and your crew." },
    ],
  },
];
