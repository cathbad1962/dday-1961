# D-Day 1961 Web App — Specification

As of 2026-10-23 · Karl O'Neill · Living copy: https://claude.ai/artifact/RPAJN3cAZ672DAjjnybehA

## Overview and goals

A browser game that faithfully reproduces Avalon Hill's 1961 _D-Day_ for two players online, or one player against a computer opponent. It is a personal project for Karl and friends, not a public release.

**Goals**

- Play the complete 1961 game with every rule enforced by the app, so no rulebook lookups mid-game.
- Two friends can play live from separate PCs using only a shared link.
- A solo player can take either side against a rule-following computer opponent.
- All game data (map, units, setup, reinforcements) lives in editable data files, not in code.

**Decisions from the interview**

| Topic              | Decision                                                                                   |
| ------------------ | ------------------------------------------------------------------------------------------ |
| Edition            | 1961 rules as baseline; 1965/1977 rules may become optional variants later                 |
| Map grid           | Hexes, per Karl's 1961 board                                                               |
| Source of truth    | Karl's physical copy (rulebook dated 1961)                                                 |
| Rules enforcement  | Fully automated; illegal moves are blocked                                                 |
| Dice               | App rolls by default; optional manual entry of physical dice                               |
| Visual style       | Modern, NATO unit symbols                                                                  |
| Hidden information | Secret Allied invasion choice; optional fog of war                                         |
| Play modes         | Live online two-player; vs computer (either side)                                          |
| Online features    | Save/resume, in-turn take-backs, link-based games (no accounts), chat, move log and replay |
| Devices            | Desktop browser only                                                                       |
| Hosting            | Karl's existing DigitalOcean droplet                                                       |
| Builder            | Claude Code writes the code; Karl reviews and play-tests                                   |

**Out of scope for v1:** user accounts, spectators, play-by-email, tablet and phone layouts, public release.

## Scope and source material

Karl's physical 1961 copy is the single source of truth; where anything else disagrees with it, the copy wins.

**Rules capture**

1. Karl photographs every rulebook page, the combat results table, any charts on the board and both counter sheets.
2. Claude transcribes the rulebook word for word into `docs/rules/rulebook-1961.md`, with each paragraph numbered (e.g. R4.2) so code and tests can cite it.
3. Claude writes a structured rules specification, `docs/rules/rules-spec.md`, restating each rule as testable statements that cite the paragraphs they come from.
4. Karl reviews the rules spec against the rulebook before the engine is built.

**Ambiguities and errata**

- Gaps and contradictions are logged in a rulings register, `docs/rules/rulings.md`, one entry per issue.
- Each entry proposes a resolution from published errata or accepted community interpretations (e.g. BoardGameGeek threads, the General magazine), with its source linked.
- Karl approves or changes each ruling, and the decision is recorded.
- Rulings that are genuinely contested become house-rule options in the game setup screen.

**Later editions:** the engine is built so rule variations can be switched on per game, so 1965 or 1977 rules can be added later without a rewrite. No later-edition rules are in v1.

## Gameplay requirements

The app enforces every rule in the approved rules spec; a player can only make moves the rules allow. Specific values (movement allowances, terrain effects, combat odds, turn count, victory conditions) come from the rulebook capture, not from this document.

**Rules enforcement**

- Turn sequence: the app drives each phase in rulebook order and shows the current turn, phase and side to move.
- Movement: selecting a unit highlights every reachable hex, honouring terrain costs, rivers, zones of control, stacking limits and any supply or sea-movement rules.
- Invasion and reinforcements: landings, beachhead rules and reinforcement arrivals follow the rulebook schedule automatically.
- Combat: the attacker designates attacks; the app totals strengths, applies terrain modifiers, computes odds, rolls and applies the combat results table result, including retreats and advances.
- Victory: checked at the points the rulebook specifies; the game ends and declares the winner.
- Every enforced rule cites its rulebook paragraph, and a player can click a "why?" link to see why a move is blocked.

**Dice**

- Default: the server rolls, so neither client can tamper with results; every roll is logged.
- Optional per game: "physical dice" mode, where the attacker types in the result of a real die roll.

**Hidden information**

- Secret invasion choice: the Allied player chooses their invasion area secretly; the German player never sees it until the rules reveal it. In online games the server holds the secret, so it cannot be read from the German browser.
- Optional fog of war (chosen at game setup): each side sees enemy units only within a set range of its own units. The range is a setup option, default to be agreed in play-testing. Fog of war is a non-1961 variant and is off by default.

## Editor

The editor is built first, and Karl uses it to enter the whole board, counter mix and setup from his physical copy. Everything it saves is plain JSON in `data/`, version-controlled with the code.

**Map editor**

- Set the grid size (columns × rows) and hex orientation to match the board; show the board's own row/column numbering if it has one.
- Paint terrain onto hexes from a palette (clear, forest, rough, city, coast, sea and so on, as defined by the rulebook's terrain key).
- Draw hexside features: rivers, major rivers, fortified lines, coastline.
- Tag special hexes: invasion areas, ports, reinforcement entry hexes, victory hexes, map-edge exits.
- Optional background: load a photo of the board under the grid at adjustable opacity, for tracing.
- Validate: flag unpainted hexes and features that do not touch a hex edge.

**Unit editor**

- One record per counter: side, nationality, unit size and type, ID, attack, defence and movement values, and NATO symbol.
- Counter preview, rendered as it will appear in play.
- Count check against the counter sheets.

**Setup and reinforcement editor**

- Place German starting units on the map by drag and drop.
- Allied invasion forces and reinforcements, entered as a schedule by turn and arrival location.
- German reinforcements and withdrawals, entered the same way.

**Data files**

| File                       | Contents                                               |
| -------------------------- | ------------------------------------------------------ |
| `data/map.json`            | Grid, terrain per hex, hexside features, special hexes |
| `data/units.json`          | Every counter and its values                           |
| `data/setup.json`          | Starting positions                                     |
| `data/reinforcements.json` | Arrival and withdrawal schedule by turn                |
| `data/crt.json`            | Combat results table                                   |
| `data/terrain.json`        | Terrain types, movement costs, combat effects          |

The rules engine validates all files on load and refuses to start a game with inconsistent data.

## Online play

Games are joined by link, with no accounts; the server is authoritative for all game state, dice and hidden information.

**Starting and joining**

- The creator picks a side, rule options (dice mode, fog of war, house rules) and gets two links: one to share with the opponent, one to keep for themself.
- Each link holds a long random secret that identifies the player's seat. Anyone holding a link can play that side, so links are shared privately.
- A home page lists the games this browser has joined (remembered in local storage), with a "paste link" box as backup.

**During play**

- Live updates over WebSockets: the opponent's moves appear as they are made.
- Take-backs: a player can undo moves within their own current phase until they roll combat or end the phase. Once dice are rolled, nothing before them can be undone.
- Chat panel alongside the map, stored with the game.
- Connection status for both players; a dropped player reconnects with their link and resumes.

**Save and resume**

- Every action is saved on the server as it happens; there is no save button.
- A game can be left and resumed days later from the same links.
- Games idle for a set period (default 180 days) may be archived.

**Move log and replay**

- A move log lists every action and roll by turn and phase.
- Finished (or in-progress, own-side) games can be replayed step by step from the start.
- In replay, hidden information is shown only once the game is over.

## Computer opponent

Version 1 is a basic, rule-following opponent that can play either side; a stronger AI follows in a later phase. The AI uses the same rules engine as human players, so it can never make an illegal move or see hidden information it should not.

**Basic AI (v1)**

- Allies: picks an invasion area (weighted random from a configurable list), lands forces, expands the beachhead, and advances toward the victory objectives.
- Germans: holds the coast and key terrain, counter-attacks landings at favourable odds, and falls back to defensive lines when outnumbered.
- Combat: only makes attacks at or above a configurable minimum odds.
- Runs on the server; takes at most a few seconds per phase, with each move animated so the human can follow it.

**Stronger AI (later)**

- A search-based planner (e.g. Monte Carlo playouts over candidate moves) with heuristic scoring of positions.
- Difficulty levels.
- A self-play harness that pits AI versions against each other to measure progress.

**Interface:** every AI implements one `Player` interface (`chooseAction(state, legalActions)`), so a new AI drops in without changes to the engine or server.

## User interface

A desktop-browser layout (minimum 1280 × 720) with a clean modern style and NATO unit symbols; no tablet or phone layout in v1.

**Layout**

- Map in the centre: pan by drag, zoom by scroll wheel, with a minimap for orientation.
- Top bar: turn, phase, side to move, "end phase" button.
- Right panel, tabbed: selected hex and unit details, stack contents, move log, chat.
- Combat dialog: units involved, strengths, terrain modifiers, final odds, the die roll and the result.

**Map and counters**

- Flat, legible terrain colours with a toggleable terrain key.
- Counters drawn as NATO symbols with unit size marker, ID and attack-defence-movement values; Allied and German colour schemes distinguishable for colour-blind players.
- Stacks shown offset, with a count badge; click to expand.
- Overlays: reachable hexes, zones of control, supply status, last move made by the opponent.

**Interaction**

- Click a unit, click a destination; right-click or Esc cancels.
- Keyboard shortcuts for undo, end phase, and toggling overlays.
- Every blocked action shows its reason and rulebook reference.

## Architecture and tech stack

One TypeScript monorepo in `C:\Users\Karl\WebstormProjects\dday_1961`, built around a pure rules engine that the browser, the server and the AI all share.

```
 Player's browser                 DigitalOcean droplet
+------------------+   WebSocket  +-------------------------------------------------+
| React UI         |<------------>| nginx (Forge) <-> Node server (Fastify)         |
|  map/editor/chat |              |                    +--------------------------+ |
| Engine (copy)    |              |                    | Game service             | |
|  move previews   |              |   SQLite <-------->|  validates, dice, hidden | |
+------------------+              |   games and logs   |          |               | |
                                  |                    |          v               | |
                                  |                    | Rules engine (+ data/)   | |
                                  |                    |          ^               | |
                                  |                    | AI players               | |
                                  |                    +--------------------------+ |
                                  +-------------------------------------------------+
```

The browser sends actions over a WebSocket; the server's copy of the engine is the one that decides, and only the filtered result goes back.

**Packages**

| Package           | Role                                                                                                                 | Main tools                          |
| ----------------- | -------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| `packages/engine` | Pure game rules: state, legal actions, apply action, combat, victory. No I/O, fully deterministic given a dice seed. | TypeScript, Vitest                  |
| `packages/client` | Game UI and editor                                                                                                   | React, Vite, SVG hex map            |
| `packages/server` | Game hosting, links, dice, hidden info, chat, persistence                                                            | Node.js, Fastify, WebSockets (`ws`) |
| `packages/ai`     | Computer opponents behind the `Player` interface                                                                     | TypeScript                          |
| `data/`           | Map, units, setup, reinforcements, CRT, terrain (JSON)                                                               | JSON Schema validation (Zod)        |

**Core design: event-sourced games**

- A game is its starting options plus an ordered list of actions (move, attack, roll, end phase, chat).
- Current state = the engine replaying those actions. This gives save/resume, take-backs (drop the trailing actions back to the last roll), the move log and replay without extra machinery.
- The server validates every action through the engine before storing it; a client cannot force an illegal move.
- Hidden information: the server sends each player a filtered view of the state (no invasion choice, no fogged units).

**Persistence:** SQLite (one file on the droplet) holding games, action logs and chat; backed up nightly to a second location.

**Hosting on the DigitalOcean droplet (via Laravel Forge)**

- The droplet is managed by Laravel Forge and also hosts karloneill.com, so the game is added as a Forge site rather than configured by hand.
- The Node server serves the built client and the WebSocket API on 127.0.0.1:3061, run as a Forge daemon (supervisor), behind Forge's nginx with HTTPS for ddaygame.dev via Forge's Let's Encrypt integration.
- Deployment: Forge zero-downtime deploys from the main branch of cathbad1962/dday-1961; the deploy script installs, builds and restarts the daemon. Steps are in [DEPLOY.md](DEPLOY.md).
- DNS for ddaygame.dev is on Cloudflare; the Cloudflare proxy is switched on (SSL mode Full (strict)) once the origin certificate is issued.

## Testing strategy

The rules engine carries most of the testing, because a faithful rules implementation is the point of the project.

- **Rule tests:** every statement in the rules spec has at least one Vitest test named after its rulebook paragraph (e.g. `R7.3 units may not move through enemy ZOC`). A coverage report lists any rules paragraph with no test.
- **Scenario tests:** small hand-built positions (a river crossing, a beach landing, a surrounded stack) with the expected legal moves and combat results.
- **Deterministic replays:** seeded dice let a whole recorded game be replayed and compared to a saved final state; any engine change that alters an old game's outcome fails the build.
- **Data validation:** schema checks on every JSON file, plus consistency checks (every unit in setup exists, every reinforcement hex is on the map).
- **AI soak test:** AI plays AI for full games; any illegal action or crash fails the run.
- **Server tests:** two simulated clients play through a short game over WebSockets, checking that hidden information never reaches the wrong player.
- **Karl's play-tests:** at the end of each phase Karl plays the build on his physical board alongside, and logs mismatches as rulings or bugs.

## Milestones

The plan is 54 work days of 2 hours each (about 108 hours), counted in work days, not calendar dates. Each day ends with something Karl can see or run. Hotseat play is ready at day 30, online play at day 37, and v1 with a basic AI at day 48.

Estimates firm up after rules capture (days 3–6): if the rulebook has more subsystems than expected (e.g. air power, naval rules), Phase 2 grows. Karl's own time entering the map (day 12) and play-testing is in addition to these days.

| Day | Phase           | Work                                                          | Done when                                         |
| --- | --------------- | ------------------------------------------------------------- | ------------------------------------------------- |
| 1   | 0 Foundations   | Monorepo scaffold: TypeScript, Vite, React, Vitest, lint, git | `npm test` passes; blank client page runs locally |
| 2   | 0 Foundations   | Forge site: placeholder server, HTTPS, daemon, deploy script  | Placeholder page live at https://ddaygame.dev     |
| 3   | 0 Rules capture | Transcribe rulebook from Karl's photos, first half            | Numbered `rulebook-1961.md` part 1                |
| 4   | 0 Rules capture | Transcribe second half, CRT, terrain and turn charts          | Full rulebook transcribed; `crt.json` drafted     |
| 5   | 0 Rules capture | Structured rules spec, first half                             | Testable rule statements with citations           |
| 6   | 0 Rules capture | Rules spec second half; rulings register opened               | Karl reviews spec and first rulings               |
| 7   | 1 Editor        | Hex grid maths: coordinates, neighbours, distance, lines      | Unit tests pass                                   |
| 8   | 1 Editor        | SVG hex map rendering, pan, zoom                              | Empty grid of the board's size on screen          |
| 9   | 1 Editor        | Terrain palette, painting, save/load `map.json`               | Terrain painted and reloaded                      |
| 10  | 1 Editor        | Hexside features: rivers, coastline, fortified lines          | Features drawn and saved                          |
| 11  | 1 Editor        | Special-hex tags, board-photo overlay, map validation         | Karl can start entering the board                 |
| 12  | 1 Editor        | Karl enters the map; Claude fixes editor issues he finds      | Complete `map.json` checked against the board     |
| 13  | 1 Editor        | Unit editor and NATO counter rendering                        | Counter sheet entered as `units.json`             |
| 14  | 1 Editor        | Setup placement and reinforcement schedule editors            | `setup.json` and `reinforcements.json` complete   |
| 15  | 1 Editor        | Data schemas and cross-file validation                        | All data loads with zero errors                   |
| 16  | 2 Engine        | State model, action model, event-sourced replay, seeded dice  | Empty game replays deterministically              |
| 17  | 2 Engine        | Turn and phase sequencer                                      | Turns cycle through all phases in rulebook order  |
| 18  | 2 Engine        | Movement: terrain costs, reachable hexes                      | Movement tests pass                               |
| 19  | 2 Engine        | Zones of control and stacking                                 | ZOC and stacking tests pass                       |
| 20  | 2 Engine        | Invasion choice, landings, beachheads                         | Landing tests pass                                |
| 21  | 2 Engine        | Reinforcements and withdrawals                                | Schedule applied correctly over a full game       |
| 22  | 2 Engine        | Supply and any remaining movement rules                       | Supply tests pass                                 |
| 23  | 2 Engine        | Combat: attack designation, odds, CRT lookup                  | Combat tests pass                                 |
| 24  | 2 Engine        | Combat results: eliminations, retreats, advances              | Result tests pass                                 |
| 25  | 2 Engine        | Victory conditions and game end                               | Victory tests pass                                |
| 26  | 2 Hotseat       | Play UI: select, move, overlays                               | Units moved legally on screen                     |
| 27  | 2 Hotseat       | Combat dialog, move log, undo                                 | Full turn playable hotseat                        |
| 28  | 2 Hotseat       | "Why?" rule explanations; rule-coverage report                | Every blocked move explains itself                |
| 29  | 2 Hotseat       | Scenario and replay tests; fixes                              | Coverage report shows no untested rule            |
| 30  | 2 Hotseat       | Karl play-tests a hotseat game against his board; fixes       | Karl signs off on hotseat play                    |
| 31  | 3 Online        | Server: game creation, seat links, SQLite storage             | Game created and reloaded from links              |
| 32  | 3 Online        | WebSocket sync, server-side validation and dice               | Two browsers see each other's moves               |
| 33  | 3 Online        | Filtered views; secret invasion choice                        | Hidden-info tests pass                            |
| 34  | 3 Online        | Take-backs, reconnect, connection status                      | Dropped player rejoins mid-turn                   |
| 35  | 3 Online        | Chat and "my games" home page                                 | Chat persists across sessions                     |
| 36  | 3 Online        | Replay viewer                                                 | Finished game replays step by step                |
| 37  | 3 Online        | Deploy; Karl plays a friend online                            | Online game completed on the droplet              |
| 38  | 4 Basic AI      | `Player` interface, AI harness, AI-vs-AI soak test            | Random-legal AI finishes full games               |
| 39  | 4 Basic AI      | German AI: hold line, counter-attack landings                 | German AI beats random play                       |
| 40  | 4 Basic AI      | German AI: fallback lines, odds threshold                     | Karl finds German AI plausible                    |
| 41  | 4 Basic AI      | Allied AI: invasion choice, landings                          | Allied AI lands and holds a beachhead             |
| 42  | 4 Basic AI      | Allied AI: breakout and advance on objectives                 | Allied AI beats random play                       |
| 43  | 4 Basic AI      | Play vs computer from the UI, animated AI moves               | Karl plays a full game against each AI side       |
| 44  | 5 Polish        | Optional fog of war                                           | Fog tests pass; toggle at game setup              |
| 45  | 5 Polish        | Physical-dice mode; house-rule options screen                 | Options apply to new games                        |
| 46  | 5 Polish        | Visual polish, colour-blind check, minimap                    | Karl approves the look                            |
| 47  | 5 Polish        | Keyboard shortcuts, performance pass, nightly backups         | Backups verified by a test restore                |
| 48  | 5 Polish        | v1 play-test and bug fixes                                    | **v1 released to friends**                        |
| 49  | 6 Strong AI     | Position evaluation function                                  | Evaluation ranks test positions sensibly          |
| 50  | 6 Strong AI     | Monte Carlo planner for combat choices                        | Beats basic AI in combat-only tests               |
| 51  | 6 Strong AI     | Planner extended to movement                                  | Beats basic AI over full games                    |
| 52  | 6 Strong AI     | Difficulty levels                                             | Easy/normal/hard selectable                       |
| 53  | 6 Strong AI     | Self-play benchmark and tuning                                | Win-rate report against basic AI                  |
| 54  | 6 Strong AI     | Final tuning and release                                      | Stronger AI live                                  |

## Open questions and risks

**Open questions**

- [x] Decided: the game is hosted at ddaygame.dev, as a Forge site on the existing droplet.
- [x] Decided: code is hosted on GitHub at https://github.com/cathbad1962/dday-1961, used for backup and automated deploys.
- [ ] Fog-of-war visibility range: default to be set after play-testing.
- [ ] Should a player be able to play against the computer offline, without the server? (Current plan: no, the AI runs on the server.)
- [ ] Rulebook photos: when can Karl supply them? Rules capture (days 3–6) depends on them.

**Risks**

| Risk                                             | Effect                         | Mitigation                                                             |
| ------------------------------------------------ | ------------------------------ | ---------------------------------------------------------------------- |
| Rules are bigger or more ambiguous than expected | Phase 2 overruns               | Re-estimate after day 6; rulings register keeps decisions moving       |
| Map entry takes longer than a day                | Editor phase slips             | Board-photo overlay for tracing; entry can run alongside engine work   |
| Basic AI plays poorly                            | Solo games feel flat           | Tune thresholds in play-tests; stronger AI phase follows               |
| Shareable links leaked                           | Someone else could take a seat | Long random secrets; option to regenerate a seat link                  |
| Copyright on Avalon Hill material                | Problem if ever made public    | Personal use only; no original artwork reproduced, modern NATO styling |
| Droplet failure                                  | Lost games                     | Nightly SQLite backups off the droplet                                 |
