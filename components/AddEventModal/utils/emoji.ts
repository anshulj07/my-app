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
  if (has(["basketball", "hoops"])) return "🏀";
  if (has(["soccer", "football", "match"])) return "⚽️";
  if (has(["tennis"])) return "🎾";
  if (has(["pickleball"])) return "🏓";
  if (has(["bowling"])) return "🎳";

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
