export function textToEmoji(t: string): string {
  const s = (t || "").toLowerCase();

  // --- Dating / social (match early so it wins) ---
  if (/(date\s*night|datenight|romance|romantic|valentine|candle\s*light|candlelit|love\s*night)/.test(s)) return "💘";
  if (/(first\s*date|second\s*date|third\s*date|couples?\s*(night|date)|couple\s*time|relationship|bf|gf|boyfriend|girlfriend)/.test(s)) return "💑";
  if (/(speed\s*date|speed\s*dating|rapid\s*dating)/.test(s)) return "⚡️";
  if (/(singles?\s*(night|event|party)|single\s*mixer|dating\s*mixer|mixer|social\s*mixer|social\s*night|meet\s*and\s*greet|meetup\s*social|mingl(e|ing)|ice\s*breaker|icebreaker|hangout|hang\s*out|get\s*together|gathering|social|community\s*night)/.test(s)) return "🫶";
  if (/(blind\s*date|mystery\s*date)/.test(s)) return "🙈";
  if (/(proposal|engagement|fianc(e|é)|ring\s*shopping)/.test(s)) return "💍";
  if (/(anniversary|celebration\s*dinner|special\s*occasion)/.test(s)) return "🕯️";

  // --- Parties / nightlife ---
  if (/(party|house\s*party|club|night\s*club|dance|dancing|dj|edm|rave|night\s*out|after\s*party|afterparty)/.test(s)) return "🪩";
  if (/(bar\s*crawl|pub\s*crawl|crawl|brewery\s*crawl)/.test(s)) return "🍻";
  if (/(karaoke|open\s*mic|openmic)/.test(s)) return "🎤";
  if (/(concert|live\s*music|gig|show|performance|band|festival)/.test(s)) return "🎸";

  // --- Food & drinks ---
  if (/(coffee|cafe|coffee\s*shop|espresso|latte|cappuccino|chai|tea|matcha)/.test(s)) return "☕️";
  if (/(brunch|breakfast|pancakes?|waffles?)/.test(s)) return "🥞";
  if (/(dinner|supper|fine\s*dining|restaurant|steakhouse|omakase|tasting\s*menu)/.test(s)) return "🍽️";
  if (/(eat|food|foodie|snacks?|bites?|lunch|dinner|meal|potluck|cookout|bbq|barbecue|pizza|tacos?|sushi|ramen|noodles)/.test(s)) return "🍕";
  if (/(wine|winery|vineyard|wine\s*tasting)/.test(s)) return "🍷";
  if (/(cocktail|mixology|happy\s*hour|mocktail|speakeasy)/.test(s)) return "🍸";
  if (/(drink|drinks|beer|pub|bar|taproom|brewery|craft\s*beer)/.test(s)) return "🍺";
  if (/(dessert|ice\s*cream|gelato|boba|bubble\s*tea|desserts|sweet|cake|bakery)/.test(s)) return "🍨";

  // --- Outdoor / activities ---
  if (/(run|running|jog|jogging|sprint|marathon|5k|10k|half\s*marathon)/.test(s)) return "🏃‍♂️";
  if (/(walk|walking|stroll|strolling|walk\s*and\s*talk|trail\s*walk)/.test(s)) return "🚶‍♂️";
  if (/(gym|workout|training|lift|lifting|barbell|weights?|strength|crossfit|hiit)/.test(s)) return "🏋️‍♀️";
  if (/(yoga|meditate|meditation|stretch|stretching|breathwork|pilates)/.test(s)) return "🧘‍♀️";
  if (/(hike|hiking|trail|trek|trekking|mountain|summit|nature\s*walk)/.test(s)) return "🥾";
  if (/(beach|ocean|seaside|sunset\s*beach)/.test(s)) return "🏖️";
  if (/(park|picnic|outdoor\s*picnic|garden|botanical)/.test(s)) return "🌳";
  if (/(camp|camping|bonfire|fire\s*pit|campfire|s'mores|smores)/.test(s)) return "🔥";

  // --- Sports / active ---
  if (/(basketball|hoops)/.test(s)) return "🏀";
  if (/(soccer|football\s*match)/.test(s)) return "⚽️";
  if (/(tennis)/.test(s)) return "🎾";
  if (/(pickleball)/.test(s)) return "🏓";
  if (/(bowling)/.test(s)) return "🎳";

  // --- Games / hobbies ---
  if (/(board\s*game|boardgame|game\s*night|card\s*game|cards)/.test(s)) return "🎲";
  if (/(trivia|quiz\s*night)/.test(s)) return "🧠";
  if (/(movie|movies|film|cinema|theater|theatre|screening)/.test(s)) return "🎬";
  if (/(museum|gallery|art\s*show|exhibit|exhibition|art\s*walk)/.test(s)) return "🖼️";
  if (/(book\s*club|reading\s*club)/.test(s)) return "📖";
  if (/(photography|photo\s*walk|photoshoot)/.test(s)) return "📸";
  if (/(gaming|videogame|video\s*game|esports)/.test(s)) return "🎮";

  // --- Learning / work ---
  if (/(study|learn|learning|read|reading|library|homework)/.test(s)) return "📚";
  if (/(workshop|class|course|training\s*session|seminar|lecture|bootcamp)/.test(s)) return "🧑‍🏫";
  if (/(network(ing)?|career|job\s*fair|recruiting|recruitment|professional\s*meetup|industry\s*meetup)/.test(s)) return "🤝";
  if (/(hackathon|code\s*jam|coding|dev\s*meetup)/.test(s)) return "💻";

  // --- Default ---
  return "📍";
}
