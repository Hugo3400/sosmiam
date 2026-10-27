import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionCommunauteAnglais: SectionLegale = {
  id: "communaute",
  titre: "The Miamis: your gender, “Who's around?” and the feed",
  blocs: [
    "In the Community tab of the app, the Miamis section lets you cross paths with other Miamis: open meetups with people you don't know yet (see [Open meetups](#sorties-miamis)), “Who's around?” and the “What the Miamis are up to” feed. The [Suggestion box](#boite-a-idees) (Profile › ⚙️ Settings › Inside SOS Miam) follows the same rules. As with all the social features, you need an account (18+) and, to take part, a username. None of this can be seen without an account, or on the site. Here, “the Brigade” means the SOS Miam team.",
    "**Your gender**, if you choose to give it:",
    {
      liste: [
        "**What we keep**: your choice in “My gender” (Profile › Edit my profile): “Woman”, “Man”, “Other” ({fr:Femme}, {fr:Homme}, {fr:Autres}) or “I'd rather not say”. It's **encrypted** (AES-256-GCM, with a key reserved for gender, derived from the data key, which is kept outside the database). We also keep, unencrypted, the date of your last choice of “Woman”, “Man” or “Other”, for the rule of one change per month (“I'd rather not say” and clearing it remain possible at any time). We **never ask for your orientation**: “LGBT+ friendly” is a meetup tag, not a box on your profile.",
        "**Why**: for one reason only – to show you the meetups restricted to your gender (“Women only”, “Men only”, “Other genders”) and let you organise them. It isn't used to sort your feed, for statistics or for advertising.",
        "**On what legal basis**: your **consent** (Article 6(1)(a) GDPR). You give it by choosing your gender, and nothing obliges you to (without it, you see all the meetups open to everyone). You withdraw it whenever you like by clearing it; what was done before remains valid. Gender isn't one of the “sensitive” categories of data in Article 9 GDPR (such as health, religion or sexual orientation), but it touches on your identity: that's why we encrypt it and don't show it to anyone.",
        "**Who sees it**: **no one**. Not other Miamis, not venues, and no screen in our management software displays it: our server only decrypts it to know which meetups to show you. One limit, to be honest: Miamis who see the same restricted meetup as you, or who go to it with you, know that you're part of its audience.",
        "**How long**: until you clear it (“Clear my gender”, in French {fr:Effacer mon genre}) or delete your account. The date of your last choice, though, stays after you clear it, so that the one-change-per-month rule can't be bypassed; it's deleted along with your account.",
        "**Your age**, for meetups restricted to an age group (18–25, 25–35, 30+, 40+): our server works it out when it needs it, from your date of birth, which is kept encrypted (see [The SOS Miam app: your account](#app-comptes)). Your age is **never recorded or shown** to anyone, with the same limit as for gender. For meetups reserved for newcomers, what counts is the date your account was created (less than 30 days ago); for ambassadors' meetups, your approved ambassador role.",
      ],
    },
    "**“Who's around?”** shows the Miamis in your city who've chosen to appear there:",
    {
      liste: [
        "**Only if you choose to**: until you tap “Show me here” ({fr:Me montrer ici}), you're not there. When you do, our server keeps that choice, **your profile's city** (its name, **never a location**) and the time your presence ends, **3 hours** later (you can extend it by 3 hours).",
        "**What others see**: Miamis in your city who open “Who's around?” see your **@username and your avatar**, and that's all the screen shows of you, along with, depending on the case, “In your crew” ({fr:Dans ta bande}) or the title of an open meetup that you're organising and that they can see. Someone you've blocked, or who has blocked you, doesn't see you, and you don't see them.",
        "**Waves**: to wave, you have to show yourself too. We keep who waved at whom, and when; the person sees “Waved at you” next to your username. If it's mutual, you both see it, and the app suggests adding each other to your crews (through a request, as usual).",
        "**Why, and on what basis**: to let you cross paths with other Miamis in your city when you feel like it, that is, the performance of the [Terms of Use](/cgu#qui-est-la) (Article 6(1)(b) GDPR).",
        "**How long**: you disappear as soon as you hide (your presence and your waves, sent and received, are then erased straight away) or when the 3 hours are up (the record is then erased by the following night's clean-up). A wave counts for **24 hours**, then it's erased by the nightly clean-up; it also disappears as soon as either of you hides.",
      ],
    },
    "**And around all this**:",
    {
      liste: [
        "**“What I'm into”** (Profile › Edit my profile › “What I'm into”: the tags that appeal to you, to highlight the meetups that suit you) stays **on your phone** and is **never sent** to our server. “Log out” and “Clear my data and start again” clear it.",
        "**The “What the Miamis are up to” feed** shows logged-in Miamis what has happened over the **last 7 days** (30 updates at most): a published suggestion, with its author, a reply from the Brigade, who has voted for suggestions and for how many and, in their city, who is organising or joining an open meetup, only for those who can see that meetup. It isn't stored separately: our server rebuilds it each time from the meetups and the suggestions. Blocked people don't appear in it.",
        "**The bell and notifications**: a request for your meetup, an accepted arrival, the waiting list, a spot freed up, the reminder the day before, a cancelled meetup, the invitation for regulars, a mutual wave, your published suggestion, the Brigade's reply and the suggestion of the month arrive in the app's bell, with its rules (see [Your crew, your followers and your profile](#potes)). Some also pop up on your phone: **Apple** or **Google** then receive their title and text, that is, the person's first name, the meetup's title and, for the reminder, the venue's name. “My crew notifications” ({fr:Notifications de ma bande}, in Profile › ⚙️ Settings › Privacy and security › “Privacy”, in French {fr:Profil › ⚙️ Paramètres › Confidentialité et sécurité › Confidentialité}) turns them off. Comments on a suggestion never trigger a notification on anyone's phone.",
      ],
    },
  ],
};

export const sectionSortiesMiamisAnglais: SectionLegale = {
  id: "sorties-miamis",
  titre: "Open meetups (Meet the Miamis)",
  blocs: [
    "An open meetup is open to Miamis you don't know yet, always in a venue published on SOS Miam, with **6 people at most**, organiser included, and the organiser approves each new arrival. Get-togethers between friends are described in [Your messages](#messagerie).",
    {
      liste: [
        "**What we keep about the meetup** (unencrypted, since it's made to be seen by its audience): its title, its description, the venue and its city, the date and time, its audience (open to everyone, or restricted), its tags (5 at most, from the official list or free-form), the number of spots, the spot kept for a newcomer, whether it repeats every week, and what happens to it (reminder sent, cancellation, removal by moderation).",
        "**What we keep about your spot**: where you stand (you're organising, you've asked to come, you've been accepted, you're on the waiting list, you've been invited as a regular, your request wasn't accepted, or you pulled out at the last minute), the date of your request and of the reply, and the time your attendance was confirmed.",
        "**Who sees the meetup**: only the Miamis in **its audience**. If it's open to everyone, all Miamis can see it (the “Meet the Miamis” list shows those in your city); if it's restricted (women only, men only, other genders, an age group, newcomers or ambassadors), it's **invisible to everyone else**. If you and the organiser, or someone who has been accepted or is on the waiting list, have blocked each other, it doesn't exist for you.",
        "**What's shown with it**: the organiser (their @username and avatar), their “Meetups kept” ({fr:Sorties tenues}) record and, if they've left “Show my activity to my crew” ({fr:Montrer mon activité à ma bande}) on, their number of rescues; the people accepted (@username, avatar and, depending on the case, “new” ({fr:nouveau}) for an account less than 30 days old, “regular”, “in your crew” ({fr:dans ta bande}) and “present” ({fr:présent})); the number of people on the waiting list. The organiser also sees the requests (each person's @username, avatar, date, “new” and “Meetups kept” record) and their waiting list.",
        "**Declining doesn't notify anyone**: the person still sees their request as sent. The organiser can also remove someone, without telling them.",
        "**“Meetups kept”**: a record that our server works out from your past open meetups (they're kept for 1 year). A meetup counts as **kept** if you'd been accepted, or if you organised it with at least one person accepted; as **not kept** if you pulled out less than 24 hours before, or if you cancelled it less than 24 hours before when Miamis had been accepted. It doesn't depend on attendance being confirmed at the counter. It helps the organiser choose, and everyone know who they're meeting up with; it's the organiser who decides, never the record on its own.",
        "**Your attendance**: at the venue, the counter QR code confirms your visit (see [The SOS Miam app: your account](#app-comptes)), then “I'm here” confirms your attendance at the meetup, from an hour before to 4 hours after the start. We only keep the time, and the other participants see “present”. As only Verified ✓ venues confirm visits, attendance can only be confirmed at those venues.",
        "**The meetup's chat**: the organiser and the people accepted write to each other in a chat in your messages, with its rules (encrypted text, photos and voice notes for 90 days, erased after 1 year without a message: see [Your messages](#messagerie)). When you leave the meetup, you leave the chat; if the meetup is cancelled or removed by moderation, the chat is erased straight away.",
        "**Meetups that repeat every week**: 4 hours after the start, our server creates the following week's meetup and invites the people who were accepted to it as **regulars**: their spot is held for **48 hours**. It doesn't do so if the meetup was cancelled, if the venue is no longer published or if the organiser's account is restricted.",
        "**The venue knows nothing about it**: an open meetup doesn't book anything, and the venue doesn't see it.",
        "**Why, and on what basis**: to organise meetups between Miamis, manage spots, requests and the waiting list, send a reminder the day before and help everyone trust each other, that is, the performance of the [Terms of Use](/cgu#communaute) (Article 6(1)(b) GDPR).",
        "**How long**: every night, an automatic clean-up runs. The meetup, with the accepted spots, last-minute pull-outs and its tags, is erased **1 year after its date**; so is a meetup that has been cancelled or removed by moderation (its chat, though, is erased straight away), which simply keeps the “Meetups kept” record. Requests left unanswered or not accepted, the waiting list and invitations to regulars are erased **the night after the date** of the meetup, and an invitation to a regular no longer counts after **48 hours**. A request you cancel, a waiting list you leave or a spot you free up more than 24 hours before are erased straight away.",
        "**If you delete your account**: the open meetups you organise and your spot in other people's are erased with it; your messages in their chat follow the rule for messages (“Deleted account”, in French {fr:Compte supprimé}).",
      ],
    },
  ],
};

export const sectionBoiteAIdeesAnglais: SectionLegale = {
  id: "boite-a-idees",
  titre: "The Suggestion box",
  blocs: [
    "In the Suggestion box (Profile › ⚙️ Settings › Inside SOS Miam), you post suggestions for the app, vote for other people's and comment on them. The Brigade reviews them, gives them a stage and replies to them, from our management software.",
    {
      liste: [
        "**What we keep** (unencrypted, since it's made to be read): the title and details of your suggestion, a simplified version of the title (to spot duplicates), its date, its stage (under review, proposed, being considered, planned, done), the Brigade's reply and, where applicable, the month it was suggestion of the month; who voted for which suggestion, and when; comments (text, the comment they reply to, date) and who liked them.",
        "**Who sees what**: while it's **under review**, your suggestion can only be seen by you and the Brigade. Once it's published, **all logged-in Miamis**, wherever they live, can see its title, its details, your @username and avatar, its stage, the Brigade's reply, the number of votes and the first name (with avatar) of **3 voters at most**, their friends first. They can also see the comments, with the @username and avatar of their author and the number of likes (never who liked them). A comment hidden by the Brigade can then only be seen by its author. The “What the Miamis are up to” feed also shows, for 7 days, who voted and for how many suggestions.",
        "**Why, and on what basis**: to collect the Miamis' suggestions, put them to the vote, reply to them and avoid duplicates, that is, the performance of the [Terms of Use](/cgu#boite-a-idees) (Article 6(1)(b) GDPR).",
        "**How long**: your suggestion stays as long as you don't withdraw it (it then goes, with its votes and comments) and the Brigade doesn't delete it. A comment you delete is erased straight away (other people's replies stay). A suggestion or comment removed or hidden by moderation is erased **1 year** after the decision, by the nightly clean-up (later only if your complaint (appeal) is still awaiting review).",
        "**If you delete your account**: your suggestions stay, but **with no author** (“a discreet fellow Miami”, in French {fr:un Miami discret}). Your votes, comments and likes are deleted along with your account; other people's replies to your comments stay.",
      ],
    },
  ],
};
