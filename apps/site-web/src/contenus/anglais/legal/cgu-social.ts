import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionPotesCguAnglais: SectionLegale = {
  id: "potes",
  titre: "Your crew, your followers and your profile",
  blocs: [
    "In the app, the Community tab has two parts. “My crew” is for getting together with your real friends: your **crew**, messaging, get-togethers and lists. “The Miamis” is for meeting new ones (see [The Miamis and open meetups](#communaute)). For this, you need a **username** (see “Your username”, below).",
    {
      liste: [
        "**Your crew** (200 friends at most): your friends join it through your **invitation link or QR code** (you are then added straight away, each to the other's crew), or through a **request** sent via your username, which you accept or decline. Declining a request does not notify anyone, and removing someone from your crew applies both ways, without notifying them.",
        "**Your invitation link** lets anyone who has it into your crew: only give it to people you know. If it has travelled further than intended, “Change my link” ({fr:Changer mon lien}) replaces it; it also changes automatically after 10 arrivals in close succession (less than 24 hours between one and the next).",
        "**“Let people find me by my username”** ({fr:Qu'on me trouve par mon pseudo}), in the app under Profile › ⚙️ Settings › Privacy and security ({fr:Confidentialité et sécurité}) › “Privacy” ({fr:Confidentialité}), “Your crew” section ({fr:Ta bande}): if you turn it off, no one can find you in search, and any request sent to you is declined with this message: “This person isn't taking requests”. Your invitation link, however, still works.",
        "**Following someone** is one-way: their lists and venues show up for you. Your account is **public** by default; if it is **private**, every follow is a request that you accept or decline. Following someone **never** opens up messaging: people can only write to each other if they are friends in the same crew.",
        "**What others see of your profile** depends on this connection (stranger, follower or friend in your crew) and on your settings: everything is set out in the [privacy policy](/confidentialite#potes).",
      ],
    },
  ],
};

export const sectionMessagerieCguAnglais: SectionLegale = {
  id: "messagerie",
  titre: "Messaging, groups and get-togethers",
  blocs: [
    "The app's messaging is for making plans with friends. You can write to each other **one-to-one**, between friends in the same crew, **in a group** (20 people at most) or in the chat of a **get-together**. You can send text (500 characters per message), reactions, venues, photos and voice notes (1 minute at most).",
    {
      liste: [
        "**Groups**: only a friend in your crew can invite you to a group, and you only join it by **accepting** the invitation (declining does not notify anyone). When you join, you do not see the messages written before you arrived. You can leave it whenever you like; you then cannot be invited back for 30 days.",
        "**Get-togethers**: the organiser invites friends from their crew (15 people at most). Everyone answers “You in?” before joining the vote and the chat, which they can then read from the beginning; people vote for one or more of the suggested venues (8 at most), and when voting ends, the venue with the most votes is chosen (in a tie, the first one suggested). A get-together does not book anything at the venue: it is a suggestion among friends. Open meetups have their own rules (see [The Miamis and open meetups](#communaute)).",
        "**Your messages**: you can delete one of your messages for everyone, in which case “Message deleted” ({fr:Message supprimé}) is shown; you can also clear a conversation for yourself only, or mute its notifications. Since version 1.0.2 of the app, “Seen” under your message shows that a friend has read it, and when. It works both ways: if you turn off “Show that I've read” ({fr:Montrer que j'ai lu}) in Profile › ⚙️ Settings › Your account and alerts ({fr:Ton compte et tes alertes}) › “Messages”, no one can see when you read any more, and you no longer see other people's “Seen”. It never appears between two people when one has blocked the other. In a group, a “Where shall we eat?” poll shows the number of votes for each venue, never who voted for what. GIFs come from GIPHY (rated “PG-13”): the community rules also apply to the ones you send.",
        "**Photos and voice notes** can only be opened for **90 days**: after that, “This file has expired” is shown, and they are deleted from our server (except those in a reported message, which are kept for a time for moderation). A conversation with no messages for **1 year** is deleted too. Keep a copy on your side of anything you want to keep.",
      ],
    },
    "The [community rules](#regles-communaute) also apply to private messages and groups. In particular, it is prohibited:",
    {
      liste: [
        "to **harass** someone: persisting after a refusal, after someone has left a group or after a block, or coming back through another group or another account;",
        "to send **sexual or violent** photos, voice notes or links, even between adults, even as a joke;",
        "to pass around what a friend has shared with you (messages, photos, voice notes, screenshots) **to harm them**, or without their consent when it is private;",
        "to post someone's **personal information** (address, phone number, location) without their consent;",
        "to send **spam**, chain messages, **advertising**, **scams** or dubious links, or to use messaging to sell something.",
      ],
    },
    "If something is wrong, you can **report** a message, a group or a get-together, **leave** the conversation or **block** the person (see “Blocking someone” and “Notices and moderation”).",
  ],
};

export const sectionCommentairesCguAnglais: SectionLegale = {
  id: "commentaires",
  titre: "Comments and lists",
  blocs: [
    {
      liste: [
        "**Comments** under posts in the feed are **public**: anyone can read them, even without an account. To write one, you need a username; comments are 500 characters at most (20 per hour). You can reply to a comment, like it, mention someone with “@” (10 people at most), edit your own (“edited” is shown) or delete them; if they already have replies, “Comment deleted” ({fr:Commentaire supprimé}) stays in their place.",
        "**The word filter** rejects the most common insults and hate speech in comments, messages, the titles of groups, get-togethers and lists, usernames and first names. It is a first line of defence, not a judge: whatever gets through the filter must still comply with the rules.",
        "**The venue's reply** is highlighted under its post: it is written in the venue's name, without showing which member of its staff wrote it.",
        "**A venue's manager can hide a comment under the venue's own post** (except the venue's reply): the comment is then only visible to its author, who is notified in the app, and it goes to moderation. If our team finds nothing wrong with it, the venue can never hide it again, and the comment goes back online. Hiding honest criticism is not the point: this is for comments that do not comply with the rules.",
        "**Lists of venues**: you can create 50 at most (100 venues each), you choose who sees them (everyone, or your crew) and you can invite up to 10 friends from your crew to fill them in with you. A co-author can only remove the venues they added.",
      ],
    },
  ],
};

export const sectionPseudosCguAnglais: SectionLegale = {
  id: "pseudos",
  titre: "Your username",
  blocs: [
    "Your username (“@lea.mange”) is 3 to 20 characters long: lower-case letters without accents, digits, full stops and underscores, without starting or ending with a full stop or an underscore, and without two of them in a row. It is unique and is visible wherever you take part.",
    {
      liste: [
        "**No misleading or hurtful usernames**: do not pass yourself off as someone else, as a venue you do not represent, as a brand or as the SOS Miam team, and no insults (the word filter also keeps watch).",
        "**Changing your username**: your old username is **reserved for 30 days**. No one else can take it (so that no one can pass themselves off as you), but you can take it back. During those 30 days, your old invitation link, which carried your old username, shows “**This link has changed**” ({fr:Ce lien a changé}) to anyone who opens it, so that they ask you for your new link; after that, it shows the message for an invalid link.",
        "**Deleting your account**: your username is reserved for 30 days, and no one can take it during that time.",
        "**Mentions follow the person, not the username**: someone who later takes a username that has been released never inherits its old “@” mentions.",
      ],
    },
  ],
};

export const sectionPhotoProfilCguAnglais: SectionLegale = {
  id: "photo-profil",
  titre: "Your profile photo",
  blocs: [
    "You can put a photo on your profile, instead of your emoji or your Miami avatar: you, your favourite dish or your cat dressed up as the Captain – it is up to you. It is **visible to other Miamis** like your avatar, wherever you take part, even if your account is private: choose it with that in mind.",
    {
      liste: [
        "**No photo of someone else without their consent**, and **never the face of a minor**, not even your little sister's or your own as a child.",
        "**Nothing explicit, violent or hateful**: no nudity or sexual content, no violence, no hateful symbols, gestures or text, and no photo that passes you off as someone else, as a venue you do not represent or as the SOS Miam team.",
        "**It can be reported like the rest of your profile**: if it does not comply with these rules, the SOS Miam team can remove it, stating the rule concerned and giving an explanation, and you can challenge that decision (see [Notices and moderation](#moderation)). While your account is restricted, other people can no longer see it.",
        "**Changing or removing it**: whenever you like, in the app. The old one is deleted from our server immediately, unless it is the subject of a notice: a copy is then kept for moderation (see the [privacy policy](/confidentialite#app-comptes)).",
      ],
    },
  ],
};

export const sectionBloquerCguAnglais: SectionLegale = {
  id: "bloquer",
  titre: "Blocking someone",
  blocs: [
    "Blocking someone cuts the connection **both ways**: you are each removed from the other's crew, and your requests, your follows, your pending invitations, your co-authorship of lists and your notifications between the two of you are deleted. They leave the get-togethers you organise. You can no longer find each other by username, the app no longer suggests you to each other, and their messages, lists and activity are hidden from you, just as yours are from them. They are not notified.",
    "Two limits, to be clear: your comments are public, so anyone can read them, including that person (the app hides theirs from you, and you can no longer reply to each other, like each other's comments or mention each other); and in a get-together organised by someone else, you both remain participants. If someone is bothering you, you can also report them.",
    "You can find the people you have blocked (1,000 at most) in the app, under Profile › ⚙️ Settings › Privacy and security ({fr:Confidentialité et sécurité}) › “Blocked people” ({fr:Personnes bloquées}). Unblocking does not restore anything: you will have to add each other again.",
  ],
};
