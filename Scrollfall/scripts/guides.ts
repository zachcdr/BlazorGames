// What the generator model needs to know about each template's params.
// Pipeline-only knowledge; the schemas in src/templates stay the source of truth.

const PALETTE =
  'red #e5484d, blue #3e63dd, green #30a46c, yellow #ffc53d, purple #8e4ec6, orange #f76b15, pink #d6409f, teal #12a594';

export const GUIDES: Record<string, string> = {
  'odd-one-out': `The player sees 3-9 items in a grid and taps the one that doesn't belong.
params: { "items": string[] (3-9 entries, each usually a single emoji, max 16 chars), "answerIndex": integer index of the odd one }
- Exactly one correct answer. Every other item must clearly share the property the prompt names; the answer must clearly lack it.
- The answer item must appear exactly once. Repeated distractors are fine.
- Avoid ambiguous categories (tomato as a fruit, whale as a fish, bats as birds) and emoji that render similarly on different platforms.
- The prompt says what to look for ("Tap the one that isn't a fruit"). For pure perception puzzles with near-identical emoji, use "Tap the odd one out" or "Find the different face".
- Put answerIndex in varied positions, not always the same one.
- durationMs 4000-6000. Higher difficulty: more items, subtler difference.`,

  'stop-the-wheel': `A wheel of colored segments spins clockwise. A pointer is fixed at 12 o'clock. The player taps once to stop it and wins if the target segment is under the pointer.
params: { "segments": [{ "color": "#rrggbb", "label"?: string (an emoji, max 8 chars) }] (2-12 segments), "targetSegment": integer index, "speed": turns per second (0.1-3), "startAngle": degrees 0-359 }
- Fairness rule, checked exactly: 1000 / (segments.length * speed) must be at least 150. So max speed is 1.66 for 4 segments, 1.11 for 6, 0.83 for 8, 0.55 for 12.
- The target must be unique: no other segment may have the same color AND the same label.
- Use only these colors so prompts match what players see: ${PALETTE}.
- The prompt names the target by color ("Stop the wheel on red") or, if every segment has a label, by its label ("Stop on the taco"). The named color must be the target segment's color.
- durationMs 5000-8000, so the target comes round at least once after a 300 ms reaction delay.`,

  'trace-shape': `The player drags a finger along a path on a square pad before the path fades away.
params: { "points": [[x, y], ...] (2-40 points; x and y between 5 and 95 on a 0-100 pad, y grows downward), "tolerance": 6-15 (how far off the line the finger may stray; smaller is harder), "fadeMs": 300-5000 (how fast the guide fades) }
- Consecutive points must differ. Path length (sum of segment lengths) must be at least 30.
- Time a person needs is 500 + 8 * pathLength ms; durationMs must be at least that. E.g. a 250-long path needs 2500 ms.
- Keep separate parts of the path at least 2 * tolerance apart so they don't blur together.
- Closed shapes repeat the first point at the end. The player starts at the first point.
- Make recognizable shapes: letters, digits, arrows, zigzags, houses, hearts, lightning bolts, waves, spirals.
- The prompt names the shape ("Trace the heart").
- Higher difficulty: longer or twistier paths, smaller tolerance, shorter fadeMs.`,

  'which-is-heavier': `Two things appear side by side. The player taps the heavier one.
params: { "left": { "emoji": string, "name": string (max 24 chars) }, "right": { same }, "answer": "left" | "right", "explanation": string (max 80 chars, one short fact shown after the pick) }
- Only clear-cut, uncontroversial pairs: for typical adult animals or standard objects, the heavier one should be at least about 1.5x heavier. No pairs that are close, equal, or vary a lot between individuals.
- Density questions are allowed when the prompt starts with "Same size:" (e.g. gold bar vs silver bar).
- Every answer is fact-checked independently by another model; anything uncertain is rejected.
- Vary which side is heavier. The prompt is usually "Which is heavier?".
- durationMs 4000-6000. Higher difficulty: less obvious pairs (but still clear-cut).`,

  'tap-count': `The player taps a target exactly N times (the count is not shown), then taps Done. Optional distractor items appear too; everything reshuffles after each target tap, and tapping a distractor loses.
params: { "targetCount": 2-10, "target": string (one emoji), "distractors": string[] (0-5 emoji, none equal to the target) }
- Time a person needs is 500 + targetCount * 300 ms (or * 550 ms when there are distractors, since the target has to be found again after every reshuffle) + 500 ms. durationMs must be at least that plus 1000 ms of slack.
- The prompt names the target and the exact count as digits ("Tap the drum exactly 5 times"). The number in the prompt must equal targetCount.
- Higher difficulty: more taps (up to 10), more distractors, distractors that look like the target. Keep it fun: 8-10 taps with distractors is already hard.`,

  'memory-flash': `A grid flashes an item in one cell (plus optional decoys) for flashMs, then hides everything. The player taps the cell where the item was.
params: { "rows": 2-5, "cols": 2-5, "flashMs": 200-2000, "targetCell": integer, row-major index from 0 to rows*cols-1, "item": string (one emoji), "decoys": [{ "cell": integer, "item": string }] (0-8; different cells, never the target cell, decoy items different from the item) }
- The prompt names the item ("Where was the cat?").
- durationMs must be at least flashMs + 2500.
- Spread targetCell around the grid.
- Higher difficulty: bigger grid, shorter flash, more decoys, decoys that look like the item.`,

  'quick-math': `The player sees a sum like "7 × 8 = ?" and taps the right answer from 4 tiles.
params: { "a": integer, "op": one of "+", "−", "×", "÷" (use these exact characters), "b": integer, "options": exactly 4 different integers }
- This is quick mental maths, solved in a few seconds. Hard limits, checked exactly: "+" sums to 100 or less; "−" keeps a at most 100 and the answer 0 or more; "×" uses two numbers from 0 to 12; "÷" divides by 1-12 with an answer of 12 or less.
- The game computes the answer itself. Exactly one option must equal it; there is no answer field.
- Division must come out to a whole number, and never divide by 0.
- Wrong options must be tempting: off by one or ten, the result of the wrong operator (7 + 8 instead of 7 × 8), swapped digits (65 for 56), a nearby times-table answer. Never obviously silly numbers.
- Put the correct answer in varied positions.
- The prompt is short and energetic ("Quick maths!", "Tap the answer", "Solve it!"). Don't repeat the sum in the prompt; it's shown big on screen.
- Difficulty 1: single-digit + and −. 2: times tables up to 5, two-digit + one-digit. 3: times tables up to 10, easy division, two-digit + and − without carrying. 4: 11 and 12 times tables, division, + and − with carrying. 5: the trickiest tables (7 × 8, 12 × 9) and divisions, with very tempting distractors.
- Use a wide spread of different sums; avoid favourites like 12 × 11 or 7 × 8 appearing more than once.
- durationMs: at least 4000 for single-digit + and −, 5000 for × and ÷, 5500 for other + and −; up to 8000 for the hardest.`,

  'sequence-memory': `Squares in a grid flip over one at a time in a sequence, then the player taps the same squares in the same order. A wrong tap loses.
params: { "rows": 2-4, "cols": 2-4, "sequence": integer cells (row-major, 0 to rows*cols-1), 2-8 long, no cell repeated, "showMs": 250-1200 (how long each square stays flipped), "gapMs": 100-600 (pause between flips) }
- The show lasts (sequence.length - 1) * (showMs + gapMs) + showMs.
- A person then needs 600 + 400 per square to tap them back. durationMs must cover the show plus that, plus at least 1000 ms of slack.
- Avoid boring sequences (straight lines in reading order) above difficulty 2; mix directions.
- The prompt is short ("Repeat the pattern", "Tap them in order", "Copy the sequence").
- Higher difficulty: longer sequence, bigger grid, shorter showMs and gapMs.`,

  'hold-to-fill': `The player presses and holds to fill a container, and lets go when the level is inside a target band. Holding too long overflows and loses.
params: { "item": string (one emoji for what's being filled), "fillPerSecond": 15-150 (percent of the container per second), "targetFrom": 10-90, "targetTo": 15-95 (percent; band from targetFrom to targetTo) }
- Fairness rule, checked exactly: (targetTo - targetFrom) / fillPerSecond * 1000 must be at least 150 ms.
- A person needs 500 + targetTo / fillPerSecond * 1000 + 300 ms; durationMs must be at least that plus 1000 ms of slack.
- The prompt says what to fill, to the line ("Fill the mug to the line", "Pump the balloon to the line"), and must match the item.
- Higher difficulty: faster fill, narrower band, band near the top (risk of overflow).`,
};

export const THEMES = [
  'kitchen', 'ocean', 'space', 'jungle', 'farm', 'city', 'winter', 'beach', 'music', 'sports',
  'school', 'garden', 'dinosaurs', 'pirates', 'robots', 'castle', 'desert', 'birthday party', 'camping', 'weather',
  'insects', 'transport', 'bakery', 'zoo', 'pets', 'halloween', 'tools', 'fruit market', 'arctic', 'rainforest',
  'museum', 'circus', 'mountains', 'pond', 'treasure', 'breakfast', 'clothes', 'toys', 'science lab', 'fairy tale',
];
