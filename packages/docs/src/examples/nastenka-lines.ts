export const nastenkaLines = [
  {
    key: "root",
    component: "FlexCol",
    props: { literal: { gap: "4", align: "center" } },
    seed: [
      { set: "scopes.root.hearts", literal: [] },
      { set: "scopes.root.nextId", literal: 1 },
      { set: "scopes.root.mood", literal: "happy" },
      { set: "scopes.root.sparkleCount", literal: 0 },
      {
        set: "scopes.root.compliment",
        literal: "Настенька, ты самая лучшая! 💖",
      },
      {
        set: "scopes.root.compliments",
        literal: [
          "Настенька, ты самая лучшая! 💖",
          "Настенька — солнышко! ☀️",
          "Настенька, ты умничка! 🌟",
          "Настенька, ты прекрасна! 🦋",
          "Настенька, улыбайся — тебе идёт! 😊",
          "Настенька — звёздочка! ⭐",
          "Настенька, ты супер! 🎀",
          "Настенька, мир ярче с тобой! 🌈",
        ],
      },
      { set: "scopes.root.bgColor", literal: "pink" },
      { set: "scopes.root.catMood", literal: "😺" },
      { set: "scopes.root.petCount", literal: 0 },
      { set: "scopes.root.flowerCount", literal: 0 },
      { set: "scopes.root.flowers", literal: [] },
    ],
    children: [
      "header-card",
      "compliment-card",
      "cat-card",
      "flower-card",
      "hearts-card",
      "mood-card",
      "stats-row",
    ],
  },
  {
    key: "header-card",
    component: "Card",
    props: {
      literal: {
        title: "🌸 Настенькин уголок 🌸",
        description: "Самая милая страничка для самой лучшей Настеньки!",
      },
    },
    children: ["header-content"],
  },
  {
    key: "header-content",
    component: "FlexCol",
    props: { literal: { gap: "2", align: "center" } },
    children: ["welcome-heading", "welcome-text", "sparkle-row"],
  },
  {
    key: "welcome-heading",
    component: "Heading",
    props: { literal: { level: "2", children: "Привет, Настенька! 🎀✨" } },
  },
  {
    key: "welcome-text",
    component: "Text",
    props: {
      literal: {
        children:
          "Эта страничка создана специально для тебя, чтобы поднять настроение 💕",
        variant: "lead",
      },
    },
  },
  {
    key: "sparkle-row",
    component: "FlexRow",
    props: { literal: { gap: "2", justify: "center", align: "center" } },
    children: ["sparkle-btn", "sparkle-count-badge"],
  },
  {
    key: "sparkle-btn",
    component: "Button",
    props: {
      literal: {
        children: "✨ Добавить блеска! ✨",
        variant: "default",
        size: "lg",
      },
    },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.sparkleCount",
          expr: "currentValue + 1",
        },
      ],
    },
  },
  {
    key: "sparkle-count-badge",
    component: "Badge",
    props: {
      expr: "({ children: '✨ × ' + scopes.root.sparkleCount, variant: scopes.root.sparkleCount > 10 ? 'default' : 'secondary' })",
    },
  },
  {
    key: "compliment-card",
    component: "Card",
    props: {
      literal: {
        title: "💌 Комплименты для Настеньки",
        description: "Нажми на кнопку и получи комплимент!",
      },
    },
    children: ["compliment-content"],
  },
  {
    key: "compliment-content",
    component: "FlexCol",
    props: { literal: { gap: "3", align: "center" } },
    children: ["compliment-alert", "compliment-btn"],
  },
  {
    key: "compliment-alert",
    component: "Alert",
    props: { expr: "({ title: scopes.root.compliment, status: 'success' })" },
  },
  {
    key: "compliment-btn",
    component: "Button",
    props: {
      literal: {
        children: "🎁 Новый комплимент!",
        variant: "outline",
        size: "lg",
      },
    },
    callbacks: {
      onClick: [
        {
          set: "scopes.root.compliment",
          expr: "scopes.root.compliments[Math.floor(Math.random() * scopes.root.compliments.length)]",
        },
      ],
    },
  },
  {
    key: "cat-card",
    component: "Card",
    props: {
      literal: {
        title: "🐱 Котик Настеньки",
        description: "Погладь котика — он будет счастлив!",
      },
    },
    children: ["cat-content"],
  },
  {
    key: "cat-content",
    component: "FlexCol",
    props: { literal: { gap: "3", align: "center" } },
    children: ["cat-display", "cat-pet-row", "cat-status"],
  },
  {
    key: "cat-display",
    component: "Heading",
    props: { expr: "({ level: '1', children: scopes.root.catMood })" },
  },
  {
    key: "cat-pet-row",
    component: "FlexRow",
    props: { literal: { gap: "2", justify: "center" } },
    children: ["pet-btn", "feed-btn"],
  },
  {
    key: "pet-btn",
    component: "Button",
    props: { literal: { children: "🤗 Погладить котика", variant: "default" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.petCount", expr: "currentValue + 1" },
        {
          set: "scopes.root.catMood",
          expr: "scopes.root.petCount + 1 >= 10 ? '😻' : scopes.root.petCount + 1 >= 5 ? '😸' : '😺'",
        },
      ],
    },
  },
  {
    key: "feed-btn",
    component: "Button",
    props: {
      literal: { children: "🐟 Покормить котика", variant: "secondary" },
    },
    callbacks: {
      onClick: [
        { set: "scopes.root.catMood", expr: "'😋'" },
        { set: "scopes.root.petCount", expr: "scopes.root.petCount + 2" },
      ],
    },
  },
  {
    key: "cat-status",
    component: "Text",
    props: {
      expr: "({ children: scopes.root.petCount === 0 ? 'Котик ждёт внимания...' : scopes.root.petCount < 5 ? 'Котик доволен! Мур~' : scopes.root.petCount < 10 ? 'Котик очень счастлив! Мур-мур-мур! 💕' : 'Котик в полном восторге от Настеньки!!! 😻💖✨', variant: 'muted' })",
    },
  },
  {
    key: "flower-card",
    component: "Card",
    props: {
      literal: {
        title: "🌷 Цветочный сад",
        description: "Собери букет для Настеньки!",
      },
    },
    children: ["flower-content"],
  },
  {
    key: "flower-content",
    component: "FlexCol",
    props: { literal: { gap: "3", align: "center" } },
    children: [
      "flower-buttons",
      "flower-bouquet",
      "flower-count-text",
      "clear-flowers-btn",
    ],
  },
  {
    key: "flower-buttons",
    component: "FlexRow",
    props: { literal: { gap: "2", justify: "center", wrap: true } },
    children: [
      "rose-btn",
      "tulip-btn",
      "sunflower-btn",
      "cherry-btn",
      "daisy-btn",
      "lily-btn",
    ],
  },
  {
    key: "rose-btn",
    component: "Button",
    props: { literal: { children: "🌹 Роза", variant: "outline", size: "sm" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.flowers", expr: "[...currentValue, '🌹']" },
        { set: "scopes.root.flowerCount", expr: "currentValue + 1" },
      ],
    },
  },
  {
    key: "tulip-btn",
    component: "Button",
    props: {
      literal: { children: "🌷 Тюльпан", variant: "outline", size: "sm" },
    },
    callbacks: {
      onClick: [
        { set: "scopes.root.flowers", expr: "[...currentValue, '🌷']" },
        { set: "scopes.root.flowerCount", expr: "currentValue + 1" },
      ],
    },
  },
  {
    key: "sunflower-btn",
    component: "Button",
    props: {
      literal: { children: "🌻 Подсолнух", variant: "outline", size: "sm" },
    },
    callbacks: {
      onClick: [
        { set: "scopes.root.flowers", expr: "[...currentValue, '🌻']" },
        { set: "scopes.root.flowerCount", expr: "currentValue + 1" },
      ],
    },
  },
  {
    key: "cherry-btn",
    component: "Button",
    props: {
      literal: { children: "🌸 Сакура", variant: "outline", size: "sm" },
    },
    callbacks: {
      onClick: [
        { set: "scopes.root.flowers", expr: "[...currentValue, '🌸']" },
        { set: "scopes.root.flowerCount", expr: "currentValue + 1" },
      ],
    },
  },
  {
    key: "daisy-btn",
    component: "Button",
    props: {
      literal: { children: "🌼 Ромашка", variant: "outline", size: "sm" },
    },
    callbacks: {
      onClick: [
        { set: "scopes.root.flowers", expr: "[...currentValue, '🌼']" },
        { set: "scopes.root.flowerCount", expr: "currentValue + 1" },
      ],
    },
  },
  {
    key: "lily-btn",
    component: "Button",
    props: {
      literal: { children: "💐 Букетик", variant: "outline", size: "sm" },
    },
    callbacks: {
      onClick: [
        { set: "scopes.root.flowers", expr: "[...currentValue, '💐']" },
        { set: "scopes.root.flowerCount", expr: "currentValue + 1" },
      ],
    },
  },
  {
    key: "flower-bouquet",
    component: "Heading",
    props: {
      expr: "({ level: '3', children: scopes.root.flowers.length === 0 ? '🌱 Сад пока пуст...' : scopes.root.flowers.join(' ') })",
    },
  },
  {
    key: "flower-count-text",
    component: "Text",
    props: {
      expr: "({ children: scopes.root.flowerCount === 0 ? 'Добавь цветочков!' : 'В букете: ' + scopes.root.flowerCount + ' ' + (scopes.root.flowerCount === 1 ? 'цветок' : scopes.root.flowerCount < 5 ? 'цветка' : 'цветков') + ' 💕', variant: 'muted' })",
    },
  },
  {
    key: "clear-flowers-btn",
    component: "Button",
    props: {
      literal: {
        children: "🗑️ Начать новый букет",
        variant: "ghost",
        size: "sm",
      },
    },
    callbacks: {
      onClick: [
        { set: "scopes.root.flowers", literal: [] },
        { set: "scopes.root.flowerCount", literal: 0 },
      ],
    },
  },
  {
    key: "hearts-card",
    component: "Card",
    props: {
      literal: {
        title: "💖 Коллекция сердечек",
        description: "Собирай сердечки! Каждое — частичка любви 💕",
      },
    },
    children: ["hearts-content"],
  },
  {
    key: "hearts-content",
    component: "FlexCol",
    props: { literal: { gap: "3", align: "center" } },
    children: ["hearts-display", "hearts-buttons"],
  },
  {
    key: "hearts-display",
    component: "Heading",
    props: {
      expr: "({ level: '3', children: scopes.root.hearts.length === 0 ? 'Нажми кнопку, чтобы собрать сердечки!' : scopes.root.hearts.join(' ') })",
    },
  },
  {
    key: "hearts-buttons",
    component: "FlexRow",
    props: { literal: { gap: "2", justify: "center", wrap: true } },
    children: [
      "pink-heart-btn",
      "red-heart-btn",
      "purple-heart-btn",
      "sparkling-heart-btn",
      "clear-hearts-btn",
    ],
  },
  {
    key: "pink-heart-btn",
    component: "Button",
    props: { literal: { children: "💗", size: "lg" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.hearts", expr: "[...currentValue, '💗']" },
      ],
    },
  },
  {
    key: "red-heart-btn",
    component: "Button",
    props: { literal: { children: "❤️", size: "lg", variant: "destructive" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.hearts", expr: "[...currentValue, '❤️']" },
      ],
    },
  },
  {
    key: "purple-heart-btn",
    component: "Button",
    props: { literal: { children: "💜", size: "lg", variant: "secondary" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.hearts", expr: "[...currentValue, '💜']" },
      ],
    },
  },
  {
    key: "sparkling-heart-btn",
    component: "Button",
    props: { literal: { children: "💖", size: "lg", variant: "outline" } },
    callbacks: {
      onClick: [
        { set: "scopes.root.hearts", expr: "[...currentValue, '💖']" },
      ],
    },
  },
  {
    key: "clear-hearts-btn",
    component: "Button",
    props: {
      literal: { children: "Начать заново", variant: "ghost", size: "sm" },
    },
    callbacks: { onClick: [{ set: "scopes.root.hearts", literal: [] }] },
  },
  {
    key: "mood-card",
    component: "Card",
    props: {
      literal: {
        title: "🎭 Настроение Настеньки",
        description: "Выбери, какое у тебя сейчас настроение!",
      },
    },
    children: ["mood-content"],
  },
  {
    key: "mood-content",
    component: "FlexCol",
    props: { literal: { gap: "3", align: "center" } },
    children: ["mood-select", "mood-result"],
  },
  {
    key: "mood-select",
    component: "FlexRow",
    props: { literal: { gap: "2", justify: "center", wrap: true } },
    children: [
      "mood-happy",
      "mood-love",
      "mood-star",
      "mood-chill",
      "mood-sleepy",
      "mood-party",
    ],
  },
  {
    key: "mood-happy",
    component: "Button",
    props: {
      expr: "({ children: '😊 Счастье', variant: scopes.root.mood === 'happy' ? 'default' : 'outline' })",
    },
    callbacks: { onClick: [{ set: "scopes.root.mood", literal: "happy" }] },
  },
  {
    key: "mood-love",
    component: "Button",
    props: {
      expr: "({ children: '🥰 Любовь', variant: scopes.root.mood === 'love' ? 'default' : 'outline' })",
    },
    callbacks: { onClick: [{ set: "scopes.root.mood", literal: "love" }] },
  },
  {
    key: "mood-star",
    component: "Button",
    props: {
      expr: "({ children: '🤩 Восторг', variant: scopes.root.mood === 'star' ? 'default' : 'outline' })",
    },
    callbacks: { onClick: [{ set: "scopes.root.mood", literal: "star" }] },
  },
  {
    key: "mood-chill",
    component: "Button",
    props: {
      expr: "({ children: '😌 Спокойствие', variant: scopes.root.mood === 'chill' ? 'default' : 'outline' })",
    },
    callbacks: { onClick: [{ set: "scopes.root.mood", literal: "chill" }] },
  },
  {
    key: "mood-sleepy",
    component: "Button",
    props: {
      expr: "({ children: '😴 Сонливость', variant: scopes.root.mood === 'sleepy' ? 'default' : 'outline' })",
    },
    callbacks: { onClick: [{ set: "scopes.root.mood", literal: "sleepy" }] },
  },
  {
    key: "mood-party",
    component: "Button",
    props: {
      expr: "({ children: '🥳 Веселье', variant: scopes.root.mood === 'party' ? 'default' : 'outline' })",
    },
    callbacks: { onClick: [{ set: "scopes.root.mood", literal: "party" }] },
  },
  {
    key: "mood-result",
    component: "Alert",
    props: {
      expr: "({ title: scopes.root.mood === 'happy' ? '😊 Настенька счастлива — и весь мир улыбается!' : scopes.root.mood === 'love' ? '🥰 Настенька влюблена в жизнь — это прекрасно!' : scopes.root.mood === 'star' ? '🤩 Настенька в восторге — энергия зашкаливает!' : scopes.root.mood === 'chill' ? '😌 Настенька отдыхает — заслуженный покой 🍃' : scopes.root.mood === 'sleepy' ? '😴 Настенька хочет спать — сладких снов, солнышко! 🌙' : '🥳 Настенька веселится — праздник продолжается! 🎉', status: 'info' })",
    },
  },
  {
    key: "stats-row",
    component: "FlexRow",
    props: { literal: { gap: "4", justify: "center", wrap: true } },
    children: ["stat-sparkles", "stat-pets", "stat-flowers", "stat-hearts"],
  },
  {
    key: "stat-sparkles",
    component: "Stat",
    props: {
      expr: "({ label: 'Блесков ✨', value: scopes.root.sparkleCount, trend: 'up', trendValue: 'Больше блеска!' })",
    },
  },
  {
    key: "stat-pets",
    component: "Stat",
    props: {
      expr: "({ label: 'Погладила котика 🐱', value: scopes.root.petCount, trend: 'up', trendValue: 'Мур!' })",
    },
  },
  {
    key: "stat-flowers",
    component: "Stat",
    props: {
      expr: "({ label: 'Цветочков 🌸', value: scopes.root.flowerCount, trend: 'up', trendValue: 'Красота!' })",
    },
  },
  {
    key: "stat-hearts",
    component: "Stat",
    props: {
      expr: "({ label: 'Сердечек 💖', value: scopes.root.hearts.length, trend: 'up', trendValue: 'Любовь!' })",
    },
  },
];
