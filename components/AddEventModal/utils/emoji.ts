export function textToEmoji(t: string): string {
    const s = t.toLowerCase();
    if (/(run|jog|sprint)/.test(s)) return "🏃‍♂️";
    if (/(walk|stroll)/.test(s)) return "🚶‍♂️";
    if (/(gym|workout|lift|barbell)/.test(s)) return "🏋️‍♀️";
    if (/(coffee|cafe|espresso|latte)/.test(s)) return "☕️";
    if (/(drink|beer|pub)/.test(s)) return "🍺";
    if (/(eat|food|pizza|lunch|dinner|bites)/.test(s)) return "🍕";
    if (/(study|learn|read)/.test(s)) return "📚";
    if (/(party|club|dance)/.test(s)) return "🎉";
    if (/(sleep|nap)/.test(s)) return "🌙";
    if (/(yoga|meditate|stretch)/.test(s)) return "🧘‍♀️";
    if (/(park|picnic)/.test(s)) return "🌳";
    return "📍";
  }
  