# Scrollfall — Build Handoff for Claude Code

Oct 21, 2026 · @Chap

## Overview

Build a playable prototype of Scrollfall: a vertical, swipeable feed where every post is a 3–10 second one-thumb micro-challenge. Think WarioWare on a TikTok feed.

The prototype should prove three things: the feed feels good to swipe, the template engine can render many varied challenges from small JSON configs, and an AI pipeline can generate valid challenges in bulk.

How to use this doc: export it as Markdown, save it as `HANDOFF.md` in an empty repo, and tell Claude Code to read it and start at Milestone 1. Treat it as the source of truth; update it when decisions change.

## MVP scope

The MVP is a single-player mobile web app with a local challenge library and an offline AI generation script. No accounts, no backend, no creator editor yet.

In scope:

- Full-screen vertical feed with swipe-up to skip and auto-advance after each result
- Template engine plus 6 starter templates
- Challenge configs stored as JSON files in the repo, validated by schema
- Result screen per challenge: win/lose, time taken, under 1 second on screen
- A simple creature that changes based on what you play, stored in localStorage
- Daily run: the same 20 challenges for everyone, picked by date seed, with an emoji-grid share string
- Soft stopping point: the creature falls asleep after 15 minutes of play
- Node script that uses the Claude API to generate challenge configs, then validates them

Out of scope for now: accounts, cloud sync, creator editor UI, async duels, golden challenges, ads, cosmetics, native apps, sound.

## Tech stack and repo structure

Use a TypeScript mobile web app so it runs on any phone browser and Claude Code can test it headlessly. Native apps can come later.

| Concern | Choice | Why |
| --- | --- | --- |
| App | Vite + React + TypeScript | Fast dev loop, easy to port later |
| Rendering inside templates | HTML Canvas or DOM per template | Each template picks what fits |
| Gestures | Pointer events, no gesture library | One-thumb input only; keep it simple |
| State | Zustand | Small, no boilerplate |
| Schemas | Zod | One source for types and validation |
| Tests | Vitest + Playwright | Unit tests plus bot playtests in a phone viewport |
| AI generation | Node script + Anthropic SDK | Runs offline, writes JSON files |
| Persistence | localStorage | Enough for creature and daily run in MVP |

Suggested layout:

```
scrollfall/
  HANDOFF.md
  src/
    feed/            # Feed, swipe handling, preloading
    engine/          # Template registry, runner, timer, result
    templates/       # One folder per template: schema, renderer, solver
    creature/        # Creature state and rendering
    daily/           # Date-seeded run + share string
    schema/          # Shared Zod schemas
  content/
    challenges/      # Approved challenge JSON
    generated/       # Raw AI output before validation
  scripts/
    generate.ts      # Calls Claude API
    validate.ts      # Schema + solver + bot checks
  tests/
```

## Core architecture

Everything rests on one rule: a challenge is data, never code. A template is code that turns a config into a playable challenge. AI and future creators only ever produce configs.

Each template module exports four things:

1. `schema`: a Zod schema for its `params`
2. `Renderer`: a React component that receives params, a timer, and `onResult(win, ms)`
3. `solve(params)`: returns the correct answer or winning input, so validation can prove a challenge is winnable
4. `tags`: categories such as `reflex`, `puzzle`, `perception`, used by the creature and the feed

Shared challenge envelope:

```json
{
  "id": "odd-one-out_0001",
  "template": "odd-one-out",
  "version": 1,
  "prompt": "Tap the one that isn't a fruit",
  "durationMs": 5000,
  "difficulty": 2,
  "theme": "kitchen",
  "params": { "items": ["🍎", "🍌", "🥕", "🍇"], "answerIndex": 2 },
  "source": "ai",
  "stats": { "plays": 0, "wins": 0, "skips": 0 }
}
```

Envelope rules: `durationMs` is between 3000 and 10000, `prompt` is at most 40 characters, `difficulty` is 1–5, and `params` must pass the template's own schema.

## Starter templates and UX rules

Ship six templates that cover different skills, so the feed feels varied from day one.

| Template | Input | Params | Tag |
| --- | --- | --- | --- |
| `odd-one-out` | Tap one of 3–9 items | items, answerIndex | perception |
| `stop-the-wheel` | Single tap to stop | segments, targetSegment, speed | reflex |
| `trace-shape` | Drag along a path before it fades | path points, tolerance, fadeMs | dexterity |
| `which-is-heavier` | Tap left or right | two items, answer, explanation | knowledge |
| `tap-count` | Tap exactly N times | targetCount, distractors | reflex |
| `memory-flash` | Tap where the item was | grid size, flashMs, targetCell | memory |
| `quick-math` | Tap the answer from 4 tiles | a, op, b, options | puzzle |
| `sequence-memory` | Tap squares in the order they flipped | grid size, sequence, showMs, gapMs | memory |
| `hold-to-fill` | Hold, release inside the band | item, fillPerSecond, targetFrom, targetTo | reflex |

UX rules every template must follow:

- Portrait only, playable with one thumb in the bottom two-thirds of the screen
- No sound needed; all information is visual, prompts readable at arm's length
- The prompt shows for at most 800 ms, then play starts
- A visible timer bar on every challenge
- Tap targets at least 48 px
- Swipe up skips at any moment; never trap the player
- Next challenge is preloaded so the swipe feels instant

## AI generation pipeline

The AI fills template params; it never writes game code. Generation runs as a batch script, not on a timer, and only validated challenges reach `content/challenges/`.

1. `scripts/generate.ts --template odd-one-out --count 50` calls the Claude API (`claude-sonnet-5-5`) with the template's schema, 3 example configs, and a random theme seed from a theme list.
2. The model returns JSON only. Strip code fences, parse, and write raw output to `content/generated/`.
3. `scripts/validate.ts` runs each config through these checks:
   - Passes the envelope and template Zod schemas
   - `solve(params)` returns a valid answer that matches any stated answer
   - Playwright bot plays it in a 390 × 844 viewport and can win within `durationMs`
   - No duplicate of an existing challenge (same template + same normalized params)
   - Fact-type templates such as `which-is-heavier` get a second model call to verify the answer; disagreement rejects it
4. Passing configs move to `content/challenges/` with `source: "ai"`. Rejections are logged with a reason.

Read the API key from `ANTHROPIC_API_KEY` in `.env`; never commit it. Later, real play stats (skip rate, win rate) will rank challenges in the feed, so record them from the start.

## Feed, creature, daily run, stopping point

**Feed.** Shuffle the challenge library with light rules: never the same template twice in a row, and difficulty drifts up after wins and down after losses. Keep the ranking logic in one function so it can be swapped later.

**Creature.** Keep a running count per tag. The creature's look comes from the top two tags, for example reflex-heavy makes it sleek and fast, puzzle-heavy gives it a big head. It gains a growth stage every 25 wins. Start with simple SVG shapes; art comes later.

**Daily run.** Seed a random generator with the date (`YYYY-MM-DD`, local time) and pick 20 challenges from a fixed daily pool, so everyone gets the same set. After the run, build a share string such as `Scrollfall 2026-10-21 16/20` followed by rows of 🟩 and 🟥, and copy it to the clipboard.

**Stopping point.** After 15 minutes of active play in one session, the creature falls asleep and the feed shows a calm end card. Coming back after at least 2 hours gives a small bonus. The player can keep playing past the card, but there's no reward for doing so.

## Milestones

Work through these in order. Each one ends with its checks passing and a short summary of what changed.

- [x] **M1 — Skeleton.** Vite app, swipeable feed of placeholder cards, Zod envelope schema, test setup. Done when swiping works in a phone viewport and `npm test` passes.
- [x] **M2 — Engine + 2 templates.** Template registry, runner with timer bar and result flash, `odd-one-out` and `stop-the-wheel`, 10 hand-written configs each. Done when both templates are playable end to end and each has a passing `solve` test.
- [x] **M3 — Remaining 4 templates.** Done when all 6 pass schema, solver, and Playwright bot tests.
- [x] **M4 — AI pipeline.** `generate.ts` and `validate.ts`. Done when one run produces at least 30 valid configs per template with a logged rejection rate.
- [x] **M5 — Creature + daily run + stopping point.** Done when the creature changes visibly with play style, two browsers on the same date get identical daily runs, and the sleep card appears at 15 minutes (test with a time override).
- [ ] **M6 — Polish pass.** Preloading, 60 fps swipe on a mid-range phone, accessibility check on contrast and tap sizes.

## Instructions for Claude Code

You are building the Scrollfall MVP described above. Follow these working rules:

- Start each session by reading this file, then continue from the first unchecked milestone.
- Before coding a milestone, write a short plan and list the files you will touch.
- Keep challenges as data. If a feature seems to need code inside a challenge config, stop and ask.
- Add a new template only through the four-part module contract: schema, renderer, solver, tags.
- Write tests alongside code; run `npm test` and the Playwright suite before calling a milestone done.
- Use TypeScript strict mode, no `any`, small files, and plain names.
- Commit after each working step with a clear message.
- When a decision isn't covered here, pick the simplest option, note it under a "Decisions log" heading at the end of this file, and keep going.
- Ask before adding a dependency not listed in the tech stack table.

First prompt to paste into Claude Code: "Read HANDOFF.md, summarize the plan back in 5 lines, then start Milestone 1."

## Decisions log

- **2026-10-21 · No git yet.** Owner asked to skip the repo for now; the "commit after each step" rule is paused until a repo exists.
- **2026-10-21 · Vite 6, not 7.** Local Node is 20.18.1 and Vite 7 needs 20.19+. Vitest 3 pairs with Vite 6. `engines.node` is set to `>=20.18`. React is 19.
- **2026-10-21 · Envelope `source`** is `"hand" | "ai" | "creator"`. Hand-written configs use `"hand"`.
- **2026-10-21 · Envelope is strict.** Unknown top-level fields are rejected (keeps code out of configs), and `id` must be `<template>_<4+ digits>`.
- **2026-10-21 · Tag list** is fixed in `src/schema/envelope.ts`: reflex, puzzle, perception, dexterity, knowledge, memory.
- **2026-10-21 · Skip gesture.** Swipe up skips when it travels 18% of screen height, or flicks faster than 0.5 px/ms over more than 24 px. Downward drags rubber-band and never go back. Logic lives in `src/feed/swipe.ts`.
- **2026-10-21 · Feed loops** over the library until ranking lands; the next card is always mounted below the current one.
- **2026-10-21 · Test layout.** Unit tests in `tests/unit` (`npm test`), Playwright in `tests/e2e` (`npm run test:e2e`) on Chromium at 390 × 844 with real CDP touch events.
- **2026-10-21 · Template file layout.** Each template folder has `definition.ts` (schema, solve, tags; no React), `Renderer.tsx`, and `index.ts` exporting all four as a `TemplateModule`. `src/engine/definitions.ts` is the node-safe registry for validation scripts; `src/engine/registry.tsx` adds renderers for the app.
- **2026-10-21 · `solve` returns bot actions.** `solve(params)` returns `{ actions: [{ type: 'tap', target: <data-testid>, window?: { fromMs, toMs } }] }`. Windows are relative to play start. `checkChallenge` in `src/engine/validate.ts` requires at least 100 ms of each window inside `durationMs`. New input types (drag, multi-tap) extend the `BotAction` union in M3.
- **2026-10-21 · One JSON file per challenge,** named `<id>.json`, loaded at build time with `import.meta.glob`. Invalid configs are dropped and logged, never shown.
- **2026-10-21 · Runner timing.** Prompt intro 700 ms, result flash 700 ms (`INTRO_MS`, `RESULT_MS` in `src/engine/Runner.tsx`). Timeout counts as a loss. The next card is mounted in its intro state and reused when it becomes current.
- **2026-10-21 · Taps vs swipes.** The feed captures the pointer only after 10 px of movement. Templates act on `click`, so a drag-to-skip never registers as a tap. Timing-sensitive templates read the time on `pointerdown` and commit on `click` (see stop-the-wheel).
- **2026-10-21 · stop-the-wheel fairness.** Each segment must stay under the pointer at least 150 ms (schema refine). The target must look unique (color + label). The solver ignores the first 300 ms (reaction time). The target segment gets a dashed white outline so the prompt isn't the only cue.
- **2026-10-21 · Feed ranking** lives in `src/feed/rank.ts` (`pickNext`): no same template twice in a row, no repeat within the last 8, prefer difficulty within 1 of the target. Target starts at 2 and moves ±0.5 per win/loss; skips don't move it.
- **2026-10-21 · Play stats** are recorded per challenge id in localStorage (`scrollfall.stats.v1`). A swipe after a result is not a skip.
- **2026-10-21 · `?challenge=<id>`** puts that challenge first in the feed. Bot tests use it.
- **2026-10-21 · Contract additions (M3).** `BotAction` gained `{ type: 'drag', target, points }` (points are 0–100 inside the target's box). `Solution.estimatedMs` is an optional human-time estimate; `checkChallenge` rejects a config when it exceeds `durationMs`. `Timer.started()` lets renderers hide answers until play begins (the intro and the preloaded card must never reveal them).
- **2026-10-21 · Templates may claim a drag.** A renderer that needs dragging calls `stopPropagation()` on `pointerdown`, but only when the touch lands on its own start handle. Touches anywhere else still reach the feed, so swipe-to-skip is never trapped. trace-shape is the only template doing this.
- **2026-10-21 · trace-shape rules.** Pad coordinates are 0–100 (points kept within 5–95). Tracing starts within 1.5× tolerance of the start dot; lifting is allowed and you resume from where you stopped. Leaving the tolerance band loses. Progress only counts along the next stretch of path, so cutting across the shape doesn't count. Win within half a tolerance of the end. The guide and its tolerance band fade to nothing over `fadeMs`. Human pace estimate: 500 ms + 8 ms per unit.
- **2026-10-21 · which-is-heavier params** are `left`/`right` `{ emoji, name }`, `answer`, and `explanation` (≤ 80 chars, shown after the pick). Facts in hand-written configs were picked to be unambiguous; M4 adds the second-model fact check for AI ones.
- **2026-10-21 · tap-count mechanic.** The count is hidden; the player taps the target, then **Done**. Win only if the count is exact. Params: `targetCount` (2–20), `target`, `distractors` (0–5). With distractors, all items reshuffle (deterministically) after each target tap, and tapping a distractor loses. Human pace estimate: 400 ms + 250 ms per tap + 500 ms.
- **2026-10-22 · Scripts run with vite-node** (`npm run generate -- …`, `npm run validate -- …`). Node 20.18 can't run TypeScript directly; vite-node already came with Vitest and shares the Vite config. The API key is read with `process.loadEnvFile('.env')`; no dotenv.
- **2026-10-22 · Generation calls.** `claude-sonnet-5-5` via the Anthropic SDK, streaming, adaptive thinking (default), `fallbacks: "default"` (server-side refusal fallback). 10 configs per call (`--batch`), 4 calls in parallel, each call with a random theme from `scripts/guides.ts`. The system prompt (rules, template guide, 3 random hand-written examples) is prompt-cached. Plain JSON replies, not structured outputs: the Zod params schemas (tuples, refinements) don't map cleanly to JSON Schema, and validation catches bad shapes anyway.
- **2026-10-22 · Per-template generation guides** live in `scripts/guides.ts`, not in the template modules, so the four-part template contract stays unchanged. A new template needs a guide before it can be generated.
- **2026-10-22 · Raw output layout.** `content/generated/<template>_<timestamp>.json` holds the model's parsed items per call (or the call's error). After validation, raw files move to `content/generated/processed/`, and a report with every rejection and its reason goes to `content/generated/reports/`.
- **2026-10-22 · Validation stages,** cheapest first: shape (only envelope fields are kept; ids, stats, and `source` are set by the script) → envelope + params schema + solver winnability → prompt lint → duplicates → blind fact check → Playwright bot. Approved configs get ids continuing each template's numbering.
- **2026-10-22 · Prompt lint** (`scripts/lib/checks.ts`): tap-count prompts must contain the exact count; color-only wheels must name the target's color, and only the 8 palette colors are allowed so prompts can name them.
- **2026-10-22 · Duplicates** are the same template + params after sorting object keys and lowercasing/trimming strings. Array order still matters.
- **2026-10-22 · Fact check covers odd-one-out too,** not just which-is-heavier: picking the odd one is a judgment the generator can get wrong. The checker sees the prompt and options but never the stated answer, answers 20 questions per call, and may answer "unsure". Any disagreement, "unsure", or missing answer rejects the config.
- **2026-10-22 · Bot check.** validate.ts starts a Vite dev server and Chromium (390 × 844, touch), loads each candidate with `?config=<json>`, and plays the solver's actions with the same bot code the e2e tests use (`scripts/lib/bot.ts`). A config fails after 2 losses, so one timing hiccup doesn't reject it.
- **2026-10-22 · `?config=<url-encoded JSON>`** puts any config that passes `checkChallenge` first in the feed. Invalid configs are ignored. It also works as a future share link.
- **2026-10-22 · E2E bot scope.** The Playwright suite bot-plays every hand-written config plus the first AI config of each template. AI configs are already bot-tested by validate.ts on the way in, and replaying all of them would make the suite take ~15 minutes.
- **2026-10-22 · First pipeline run (M4).** 50 per template = 300 candidates; 298 approved (49–50 per template), 1 duplicate and 1 bot loss rejected. Generation ~$1.53, fact check ~$0.06. The bot loss was a 12-segment wheel at max speed with its first 152 ms window opening just after play started; rejecting it is defensible. A flipped-answer test confirmed the fact checker rejects wrong answers (8/8). Trace shapes were reviewed by eye: nearly all are recognizable, and a few are loose matches for their names (e.g. "strawberry" is a triangle). Report: `content/generated/reports/validate_20261022T171244.json`.
- **2026-10-22 · Three more templates (added between M4 and M5 at the owner's request):** quick-math, sequence-memory, hold-to-fill. A spelling template was considered and skipped. Each has 10 hand-written configs, a generator guide, and an AI batch.
- **2026-10-22 · quick-math stores operands, not an answer.** `{ a, op, b, options }` with `op` in `+ − × ÷` (those exact characters). The answer is computed by `compute()`, and the schema requires exactly one of the 4 unique options to match it, so correctness is proven by code and needs no fact check. Division must be exact. Tag `puzzle`, the first template to use it.
- **2026-10-22 · Shared choice grid.** `src/templates/shared/ChoiceGrid.tsx` renders tap-one-of-N tiles with correct/wrong rings; odd-one-out and quick-math use it (CSS classes `.choice-grid` / `.choice`).
- **2026-10-22 · sequence-memory rules.** Squares flip one at a time (`showMs` each, `gapMs` apart), then the player taps them back in order. No repeated cells in a sequence (2–8 long, grids 2–4 × 2–4). Taps during the show are ignored; a wrong tap loses and rings the square that was next; correct taps stay green with their order number. Nothing flips until play starts. Human estimate: show + 600 ms + 400 ms per square.
- **2026-10-22 · hold-to-fill rules.** Fill rises at `fillPerSecond` percent while held; release inside `targetFrom`–`targetTo` wins, release below loses, and reaching 100% while still holding loses at once. The band must take ≥ 150 ms to fill through. New bot action `{ type: 'hold', target, holdMs }`. Unlike trace-shape, the pad does **not** claim the pointer: if the thumb drifts into a swipe, the feed takes the pointer, the hold is cancelled with no result, and the swipe skips.
- **2026-10-22 · AI batch for the three new templates.** 150 candidates, 141 approved (quick-math 46, sequence-memory 45, hold-to-fill 50); all 9 rejections were duplicates. Cost ~$0.45. Library is now 529 challenges across 9 templates. Known content nits: some themed sequence-memory prompts don't say what to do ("Watch the snowflakes"), and two hold-to-fill configs use drinks (🍺 "grog", 🍸 cocktail).
- **2026-10-22 · The feed is a list of cards,** not just challenges: `challenge` (optionally with its daily-run position), `home`, `sleep`, `daily-summary` (`FeedCard` in `src/feed/feedStore.ts`). Swiping past a non-challenge card never counts as a skip.
- **2026-10-22 · Home card.** The app opens on a creature card (creature, stage, traits, progress to the next stage, the daily-run button); swipe up to play. `?challenge=` / `?config=` skip it. In the endless feed a creature check-in card comes back every 12 challenges (`CHECK_IN_EVERY`) so growth stays visible.
- **2026-10-22 · Creature.** Tag counts go up for every played challenge (win or lose, never skips); wins (plus rested bonuses) drive growth: a stage every 25, stages Hatchling → Sprout → Explorer → Champion → Legend (fully grown). Look comes from the top two tags (ties broken in tag order): primary trait at full strength and sets the color, secondary at half. Traits: reflex = sleek with speed lines, puzzle = big head, perception = big eyes, dexterity = long arms, knowledge = glasses, memory = big ears. Stages add an antenna, cheeks, a tail, then a crown. Stored in `scrollfall.creature.v1`.
- **2026-10-22 · Daily run.** 20 challenges from the whole approved library (sorted by id, so load order can't matter), picked with a mulberry32 RNG seeded from `scrollfall:YYYY-MM-DD` (local date). Difficulty ramps 1→5 (3/4/5/4/4 per level), no template twice in a row, avoiding the last 3 templates when possible. Everyone on the same build and date gets the same run; adding content changes future runs. Each position is recorded once (`scrollfall.daily.v1`), so reloading resumes and replaying can't change the score. Skips count as 🟥. Share copies `Scrollfall YYYY-MM-DD N/20` plus 4 rows of 5, with a textarea fallback when the Clipboard API is unavailable (plain-http on a phone).
- **2026-10-22 · Stopping point.** Active time = intro + play time of challenges the player actually played, plus time on skipped cards (capped at the card's duration); timeouts don't count, so an unattended feed never accrues time. At 15 minutes the creature falls asleep and the sleep card replaces the preloaded next card (mid daily run, it waits until after the summary). While asleep, play still works and records stats, but the creature doesn't grow. A break of ≥ 30 minutes starts a new session (creature wakes); a break of ≥ 2 hours after playing also grants +5 growth, announced on the home card. Session state in `scrollfall.session.v1`; checked on open and whenever the tab becomes visible.
- **2026-10-22 · Time overrides for testing.** `?sleepAfter=<seconds>` shortens the 15-minute limit. Wall-clock reads go through `src/time.ts` (`Date.now`), so Playwright's `page.clock.setFixedTime` drives the daily date and the 2-hour bonus without touching animation timers.
- **2026-10-22 · Runner reports timeouts.** `onResolve(win, ms, timedOut)`; `INTRO_MS`/`RESULT_MS` moved to `src/engine/phases.ts`.
- **2026-10-22 · Hosting: served by the owner's existing Blazor app on Azure at `/scrollfall/`** (same origin). `npm run publish:to -- <BlazorApp>/wwwroot/scrollfall` builds with base `/scrollfall/` straight into that folder (`--base` to change it). The script empties the target first, so it refuses unless the folder name matches the base path's last segment and the folder is empty or holds a previous build. Dev and tests still run at `/`. The Blazor side needs the files present *before* `dotnet build/publish` (so .NET 8+ `MapStaticAssets` sees them) and routes so its fallback doesn't swallow `/scrollfall/`. Verified by serving a sub-path build and playing through it.
- **2026-10-22 · Host app specifics.** The host is `C:\Code\Personal\BlazorGames` (project `Quarantine`): Blazor Server on .NET Core 3.1, deployed with Visual Studio Web Deploy (no CI). Update flow: `npm run publish:to -- ../BlazorGames/Quarantine/wwwroot/scrollfall --base scrollfall`, then publish from VS as usual. In that app: `Startup.cs` maps `MapFallbackToFile("scrollfall/{**path}", "scrollfall/index.html")` before the Blazor fallback; the nav menu and home grid link to `scrollfall/` with `target="_top"`, because Blazor 3.1's router would otherwise intercept the link and show its not-found page. Built output is committed to that repo's `wwwroot/scrollfall`. Verified end to end against the running Blazor app (home card and nav link open the game, a challenge plays, other Blazor routes unaffected).
- **2026-10-22 · Easier quick-math (owner feedback: too tough).** The schema now limits sums to quick mental maths: `+` totals ≤ 100, `−` stays within 0–100, `×` within the 12 times table, `÷` by 1–12 with an answer ≤ 12 (`mentalMathProblem()`). The solver's human estimate is 4 s for single-digit `+`/`−`, 5 s for tables, 5.5 s for other sums. Duplicate detection for quick-math compares only the sum (`a op b`, with `+`/`×` order ignored), not the wrong-answer tiles. 34 AI configs were removed (22 too hard, 12 repeated sums), 2 hand configs were rewritten (48 + 56 → 48 + 36, 25 × 16 → 12 × 9), and a new batch added 33 (27 rejected as repeats; ~$0.22).
- **2026-10-22 · Easier tap-count (owner feedback: 12+ taps too hard in time).** Max 10 taps. Human estimate is now 500 ms + 300 ms per tap (550 ms with distractors, since the target must be found again after every reshuffle) + 500 ms. 26 AI configs with more than 10 taps were removed. Existing math and tap-count configs whose duration left less than 1 s of slack under the new estimates had `durationMs` raised (65 configs).
- **2026-10-21 · memory-flash params** are `rows`, `cols` (2–5 each), `flashMs` (200–2000), `targetCell`, `item`, and optional `decoys` (`{ cell, item }`, different look from the item). Taps during the flash are ignored. All items are revealed after the pick.
