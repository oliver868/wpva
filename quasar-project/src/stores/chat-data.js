// staršia história #general, aby bolo čo načítavať pri scrolle hore (infinite scroll)
function olderMessages() {
  const texts = [
    ["lucia", "Ahojte, vitajte v kanáli!"],
    ["mara", "Ahoj :)"],
    ["tomas", "Čaute."],
    ["peter", "Postgres alebo MySQL?"],
    ["lucia", "Postgres určite."],
    ["mara", "Nezabudnite si nainštalovať Quasar CLI."],
  ];
  const messages = [];
  for (let i = 0; i < 36; i++) {
    const [from, text] = texts[i % texts.length];
    const minute = String(i).padStart(2, "0");
    messages.push({ from, text, time: "08:" + minute });
  }
  return messages;
}

export const initialChatState = {
  me: "dano",
  profile: { firstName: "Dano", lastName: "", email: "dan@fan.sk" },
  notifications: true,
  onlyMentions: true,
  chatAppearance: { color: "lav", font: "figtree" },
  notificationFeed: [
    {
      id: "closed-stary-projekt",
      icon: "history_toggle_off",
      title: "Kanál #stary-projekt zanikol",
      detail: "30 dní v ňom nepribudla žiadna správa.",
      to: "/c/stary-projekt",
      read: false,
    },
    {
      id: "mention-frontend",
      title: "Zmienka v #frontend",
      detail: "@lucia: @dano pozrieš mi potom farby?",
      to: "/c/frontend",
      read: false,
    },
    {
      id: "message-mara",
      title: "Nová správa od @mara",
      detail: "Nezabudni na link na repo :)",
      to: "/dm/mara/main",
      read: false,
    },
  ],

  closedChannels: [
    {
      name: "stary-projekt",
      reason: "inactive",
      by: "mara",
      date: "2. 10. 2026",
    },
  ],

  users: {
    dano: { name: "Dano", status: "online", color: "lav" },
    mara: { name: "Mária S.", status: "online", color: "pink" },
    tomas: { name: "Tomáš B.", status: "dnd", color: "blue" },
    lucia: { name: "Lucia P.", status: "offline", color: "yellow" },
    peter: { name: "Peter M.", status: "offline", color: "lav" },
    kristian: { name: "Kiko.", status: "offline", color: "lav" },
    fule: { name: "Fule.", status: "offline", color: "lav" },
    jano: { name: "jano.", status: "offline", color: "lav" },
  },

  channels: [
    {
      name: "hackathon",
      private: true,
      admin: "mara",
      invitations: [{ nick: "dano", from: "mara" }],
      members: ["mara", "tomas"],
      banned: [],
      kicks: {},
      notify: "all",
      messages: [
        {
          from: "mara",
          text: "Ideme na FIIT hackathon v novembri?",
          time: "09:12",
        },
      ],
    },
    {
      name: "general",
      private: false,
      admin: "mara",
      members: ["mara", "dano", "tomas", "lucia", "peter"],
      banned: [],
      kicks: {},
      notify: "all",
      typing: {
        nick: "tomas",
        text: "myslím, že infinite scroll spravíme cez q-infinite-scroll a budeme načítavať po 20 sprá",
      },
      messages: [
        ...olderMessages(),
        {
          from: "mara",
          text: "Ráno! Kto ide dnes na cvičenie z VPWA?",
          time: "10:02",
        },
        {
          from: "peter",
          text: "Ja idem, len ešte dorábam UML diagram.",
          time: "10:04",
        },
        {
          from: "tomas",
          text: "Ahojte, ako funguje /invite v súkromnom kanáli?",
          time: "10:11",
        },
        {
          from: "dano",
          text: "Do súkromného kanála pozýva iba správca.",
          time: "10:12",
        },
        {
          from: "mara",
          text: "@dano pošleš mi potom link na repo?",
          time: "10:15",
        },
        {
          from: "lucia",
          text: "Termín prvej fázy je 18. 10. Nezabudnite na UML.",
          time: "10:16",
        },
        { from: "dano", text: "Jasné, večer to pushnem.", time: "10:17" },
      ],
    },
    {
      name: "frontend",
      private: false,
      admin: "lucia",
      members: ["lucia", "dano"],
      banned: [],
      kicks: {},
      notify: "all",
      messages: [
        { from: "lucia", text: "Kto robí layout pre login?", time: "09:40" },
        { from: "lucia", text: "@dano pozrieš mi potom farby?", time: "09:48" },
      ],
    },
    {
      name: "vpwa-tim",
      private: true,
      admin: "dano",
      members: ["dano"],
      banned: [],
      kicks: {},
      notify: "all",
      messages: [
        { from: "dano", text: "UML je hotové, pozri repo.", time: "21:20" },
      ],
    },
    {
      name: "general-dano-a-tomas",
      private: false,
      admin: "dano",
      members: ["dano", "tomas"],
      banned: [],
      kicks: {},
      notify: "all",
      messages: [
        { from: "dano", text: "Vitaj na mojom serveri!", time: "18:02" },
        { from: "tomas", text: "Vďaka, idem skúšať príkazy.", time: "18:05" },
      ],
    },
    {
      name: "tajne-tomas-a-dano",
      private: true,
      admin: "tomas",
      members: ["dano", "tomas"],
      banned: [],
      kicks: {},
      notify: "all",
      messages: [
        { from: "dano", text: "Vitaj na mojom serveri!", time: "18:02" },
        { from: "tomas", text: "Vďaka, idem skúšať príkazy.", time: "18:05" },
      ],
    },
    {
      name: "tajne-dano-a-tomas",
      private: true,
      admin: "dano",
      members: ["dano", "tomas"],
      banned: [],
      kicks: {},
      notify: "all",
      messages: [
        {
          from: "dano",
          text: "Toto je súkromný kanál, sem pozývam iba ja.",
          time: "18:10",
        },
        { from: "tomas", text: "Super, nikto iný to nevidí.", time: "18:12" },
      ],
    },
  ],

  friends: [
    {
      nick: "mara",
      threads: [
        {
          id: "main",
          title: "Hlavný chat",
          notify: "all",
          messages: [
            {
              from: "mara",
              text: "Nezabudni na link na repo :)",
              time: "09:35",
            },
          ],
        },
      ],
    },
    {
      nick: "kristian",
      threads: [
        {
          id: "main",
          title: "Hlavný chat",
          notify: "all",
          messages: [
            {
              from: "kristian",
              text: "Nezabudni na link na repo :)",
              time: "09:35",
            },
          ],
        },
      ],
    },
    {
      nick: "jano",
      threads: [
        {
          id: "main",
          title: "Hlavný chat",
          notify: "all",
          messages: [
            {
              from: "jano",
              text: "Nezabudni na link na repo :)",
              time: "09:35",
            },
          ],
        },
      ],
    },
    {
      nick: "fule",
      threads: [
        {
          id: "main",
          title: "Hlavný chat",
          notify: "all",
          messages: [
            {
              from: "fule",
              text: "Nezabudni na link na repo :)",
              time: "09:35",
            },
          ],
        },
      ],
    },
    {
      nick: "tomas",
      threads: [
        {
          id: "main",
          title: "Hlavný chat",
          notify: "all",
          messages: [
            { from: "tomas", text: "Vďaka za pomoc s /invite!", time: "Včera" },
          ],
        },
      ],
    },

    {
      nick: "lucia",
      threads: [
        {
          id: "main",
          title: "Hlavný chat",
          notify: "all",
          messages: [
            { from: "lucia", text: "Uvidíme sa v utorok.", time: "Po" },
          ],
        },
      ],
    },
  ],

  servers: [
    { name: "FIIT STU", channels: ["general", "frontend"] },
    { name: "Tím VPWA", channels: ["vpwa-tim"] },
    { name: "Hackathon", channels: ["hackathon"] },
    {
      name: "Dano a Tomas",
      admin: "dano",
      channels: ["general-dano-a-tomas", "tajne-dano-a-tomas", "tajne-tomas-a-dano"],
    },
  ],
  activeServer: "FIIT STU",
};
