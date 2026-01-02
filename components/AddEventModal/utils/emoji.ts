export function textToEmoji(t: string): string {
  const s = (t || "").toLowerCase();
  const compact = s.replace(/[^a-z0-9]+/g, ""); // catches datenight/openmic/afterparty/boardgame
  const tokens = new Set(
    s
      .replace(/[^a-z0-9]+/g, " ")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
  );

  const has = (words: string[]) =>
    words.some((w) => tokens.has(w) || compact.includes(w));

  // --- Dating / social (keep high priority) ---
  if (has(["date", "romance", "romantic", "valentine", "candlelit", "love"])) return "💘";
  if (has(["couple", "relationship", "boyfriend", "girlfriend", "bf", "gf"])) return "💑";
  if (has(["speeddating", "speeddate"])) return "⚡️";
  if (has(["single", "mixer", "meetup", "mingle", "social", "hangout", "gathering", "community"])) return "🫶";
  if (has(["blinddate", "mysterydate"])) return "🙈";
  if (has(["proposal", "engagement", "fiance", "fiancé", "ring"])) return "💍";
  if (has(["anniversary", "celebration", "occasion"])) return "🕯️";

  // --- Parties / nightlife ---
  if (has(["party", "club", "dance", "dancing", "dj", "edm", "rave", "afterparty", "nightout"])) return "🪩";
  if (has(["barcrawl", "pubcrawl", "crawl", "brewerycrawl"])) return "🍻";
  if (has(["karaoke", "openmic"])) return "🎤";
  if (has(["concert", "music", "gig", "show", "performance", "band", "festival"])) return "🎸";

  // --- Food & drinks ---
  if (has(["coffee", "cafe", "espresso", "latte", "cappuccino", "chai", "tea", "matcha"])) return "☕️";
  if (has(["brunch", "breakfast", "pancake", "pancakes", "waffle", "waffles"])) return "🥞";
  if (has(["dinner", "supper", "restaurant", "steakhouse", "omakase", "tasting"])) return "🍽️";
  if (has(["food", "foodie", "snack", "snacks", "lunch", "meal", "potluck", "cookout", "bbq", "barbecue", "pizza", "taco", "tacos", "sushi", "ramen", "noodle", "noodles"])) return "🍕";
  if (has(["wine", "winery", "vineyard", "winetasting"])) return "🍷";
  if (has(["cocktail", "mocktail", "mixology", "happyhour", "speakeasy"])) return "🍸";
  if (has(["drink", "drinks", "beer", "pub", "bar", "taproom", "brewery", "craftbeer"])) return "🍺";
  if (has(["dessert", "sweet", "icecream", "gelato", "boba", "bubbletea", "cake", "bakery"])) return "🍨";

  // --- Outdoor / activities ---
  if (has(["run", "running", "jog", "jogging", "sprint", "marathon", "5k", "10k"])) return "🏃‍♂️";
  if (has(["walk", "walking", "stroll", "strolling", "trail"])) return "🚶‍♂️";
  if (has(["gym", "workout", "training", "lift", "lifting", "barbell", "weight", "weights", "strength", "crossfit", "hiit"])) return "🏋️‍♀️";
  if (has(["yoga", "meditate", "meditation", "stretch", "stretching", "breathwork", "pilates"])) return "🧘‍♀️";
  if (has(["hike", "hiking", "trek", "trekking", "mountain", "summit", "nature"])) return "🥾";
  if (has(["beach", "ocean", "seaside", "sunset"])) return "🏖️";
  if (has(["park", "picnic", "garden", "botanical"])) return "🌳";
  if (has(["camp", "camping", "bonfire", "firepit", "campfire", "smores"])) return "🔥";

  // --- Sports / active ---
  if (has(["baseball", "softball"])) return "⚾️";
  if (has(["american football", "nfl", "football game"])) return "🏈";
  if (has(["rugby"])) return "🏉";
  if (has(["cricket"])) return "🏏";
  if (has(["volleyball"])) return "🏐";
  if (has(["badminton"])) return "🏸";
  if (has(["table tennis", "ping pong"])) return "🏓";
  if (has(["golf"])) return "⛳️";
  if (has(["hockey", "ice hockey"])) return "🏒";
  if (has(["field hockey"])) return "🏑";
  if (has(["lacrosse"])) return "🥍";
  if (has(["boxing"])) return "🥊";
  if (has(["martial arts", "mma", "karate", "taekwondo", "judo"])) return "🥋";
  if (has(["wrestling"])) return "🤼‍♂️";
  if (has(["fencing"])) return "🤺";
  if (has(["archery"])) return "🏹";
  if (has(["cycling", "bike", "biking", "bicycle"])) return "🚴‍♂️";
  if (has(["mountain biking", "mtb"])) return "🚵‍♂️";
  if (has(["skate", "skating", "skateboard"])) return "🛹";
  if (has(["roller skate", "roller skating"])) return "🛼";
  if (has(["ski", "skiing"])) return "⛷️";
  if (has(["snowboard", "snowboarding"])) return "🏂";
  if (has(["ice skate", "ice skating"])) return "⛸️";
  if (has(["swim", "swimming", "pool"])) return "🏊‍♂️";
  if (has(["surf", "surfing"])) return "🏄‍♂️";
  if (has(["row", "rowing"])) return "🚣‍♂️";
  if (has(["canoe", "kayak", "kayaking"])) return "🛶";
  if (has(["sail", "sailing"])) return "⛵️";
  if (has(["scuba", "snorkel", "snorkeling", "diving"])) return "🤿";
  if (has(["climb", "climbing", "rock climb", "bouldering"])) return "🧗‍♂️";
  if (has(["horse", "horseback", "equestrian"])) return "🏇";
  if (has(["fishing"])) return "🎣";
  if (has(["shooting", "range", "target practice"])) return "🎯";
  if (has(["dance", "dancing", "club", "party"])) return "💃";
  if (has(["cheer", "cheerleading"])) return "📣";

  // --- Games / hobbies ---
  if (has(["boardgame", "gamenight", "game", "card", "cards"])) return "🎲";
  if (has(["trivia", "quiz"])) return "🧠";
  if (has(["movie", "movies", "film", "cinema", "theater", "theatre", "screening"])) return "🎬";
  if (has(["museum", "gallery", "art", "exhibit", "exhibition"])) return "🖼️";
  if (has(["bookclub", "reading"])) return "📖";
  if (has(["photography", "photowalk", "photoshoot"])) return "📸";
  if (has(["gaming", "videogame", "esports"])) return "🎮";

  // --- Learning / work ---
  if (has(["study", "learn", "learning", "read", "reading", "library", "homework"])) return "📚";
  if (has(["workshop", "class", "course", "training", "seminar", "lecture", "bootcamp"])) return "🧑‍🏫";
  if (has(["network", "networking", "career", "jobfair", "recruiting", "recruitment", "professional", "industry"])) return "🤝";
  if (has(["hackathon", "codejam", "coding", "dev"])) return "💻";

  return "📍";
}
