# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SBTI-style gaming personality test website. A viral, self-deprecating quiz (24 questions, 3 minutes) that classifies players into 12 humorous "gaming personality" types. Pure static site — no backend, no build step (MVP).

**Tone reference**: SBTI (Silly Big Personality Test) — absurd, self-deprecating, screenshot-worthy labels. Not MBTI, not a serious psychological instrument.

## Key Files

- `docs/PRD.md` — product spec, page structure, tech stack, MVP scope
- `docs/characters.md` — 12 type profiles with clinical diagnoses, catchphrases, nemesis types
- `docs/character-prompts.md` — Xiaohei illustration prompts for all 12 types (16:9, white BG, hand-drawn)
- `docs/xiaohei-ip.md` — Xiaohei character IP bible: visual DNA, game-context extensions, 12 signature poses, prop library
- `docs/question-bank-review.md` — audit report on v1 question bank (language, genre coverage, scoring)
- `data/questions.json` — main question bank v2.0, 24 questions × 3 options
- `data/questions-eggy.json` — Eggy Party parallel question bank, 24 questions, same type system

## The 12 Types

| Label | ID | Bartle Quadrant |
|-------|-----|-----------------|
| 分奴 | `score_slave` | Killer · Competitive |
| 压力怪 | `pressure_monster` | Killer · Dominant |
| 乐子人 | `chaos_gremlin` | Killer · Expressive |
| 赛博驴 | `cyber_donkey` | Achiever · Power |
| 仓鼠 | `hamster` | Achiever · Collection |
| 白金人 | `platinum_hunter` | Achiever · Completion |
| 该溜子 | `wanderer` | Explorer · World |
| 考古学家 | `archaeologist` | Explorer · Narrative |
| BUG启动器 | `bug_conjurer` | Explorer · Mechanics |
| 游戏奶妈 | `game_nanny` | Socializer · Altruistic |
| 挂机仙人 | `afk_immortal` | Socializer · Atmosphere |
| 氪佬 | `whale` | Socializer · Expressive |

Bartle quadrants are an internal organizing principle — never exposed to users. Each type has a "nemesis" type defined in `characters.md`.

## Question Bank Rules

### Type Balance (CRITICAL)
Each of the 12 types must appear **exactly 6 times** across the 72 option slots (24 questions × 3 options). Verify with:
```bash
node -e "const q=require('./data/questions.json');const c={};q.questions.forEach(x=>x.options.forEach(o=>{for(const[t,s]of Object.entries(o.scores))c[t]=(c[t]||0)+1}));Object.entries(c).sort().forEach(([k,v])=>console.log(k+': '+v+(v===6?' ✓':' ✗')))"
```
Same check applies to `questions-eggy.json`.

### Scoring
- Each option gives **+2** to one type. No partial/soft scoring in MVP.
- Highest-scoring type = result. Tiebreak: compare second-highest types, favor the one in the same Bartle quadrant.
- Hard tie (identical scores) → show both types as "dual personality."

### Parallel Bank (Eggy Party)
- Q1-C in main bank has `"redirect": "eggy"` — when selected, frontend swaps to `questions-eggy.json`
- Q1-C in Eggy bank has `"redirect": "main"` — return path
- Both banks share the same 12 types and scoring engine. Only question text differs.

### Question Style
- Options are **inner monologue**, not behavioral description. Every option should have a punchline, parenthetical self-deception, or absurd detail.
- Questions use universal framing, not genre-specific jargon (e.g., "竞技类游戏" not "排位赛").
- Three-layer structure: Q1-8 universal, Q9-16 scenario, Q17-24 deep diagnostic.

## Xiaohei IP (Illustration Style)

When generating or editing character illustrations:
- **Pure white background** (#FFF) — no paper texture, no gradients, no shadows
- **Black hand-drawn lines** with slight wobble, not vector-perfect
- **Xiaohei is a solid black figure** with white dot eyes, thin black-line legs, blank expression. Face NEVER changes — emotion conveyed through body posture and surrounding symbols.
- **Sparse color annotations**: red (emphasis/warnings), orange (paths/flows), blue (secondary notes, optional)
- **Xiaohei must be the core action performer**. Rule: if removing Xiaohei doesn't break the composition, it's too decorative.
- `docs/xiaohei-ip.md` §3 has the 12 signature poses. `docs/character-prompts.md` has full generation prompts.
- Attribution line for site footer: `Character IP based on Ian Xiaohei by @helloianneo`

## Tech Decisions (Made)

- **Pure static**: HTML + CSS + vanilla JS. No framework, no build step, no backend.
- **html2canvas** for poster generation (result card → shareable image)
- **No user accounts, no data collection** — everything runs in-browser
- Deploy target: GitHub Pages / Vercel / Tencent COS static hosting

## Tech Decisions (Not Yet Made)

- Whether to use a micro-framework (Alpine.js / Petite-Vue) or stay vanilla JS
- Exact routing strategy (hash-based SPA vs separate HTML files)
- Font choices for the "handwritten annotation" CSS effect
