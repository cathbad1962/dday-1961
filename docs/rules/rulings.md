# Rulings

Where the 1961 rules are unclear or contradict each other, these rulings decide how the app plays. Each was agreed with Karl. They are in our own words; the rulebook itself is not reproduced here.

## 1. Victory deadline and the four-week count

Agreed 2026-10-24.

**The problem.** The Instruction Manual sets the deadline at the 50th week. The Reference Folder's introduction says the Allies must breach the Rhine–IJssel line "by the 46th week" and then hold for four weeks.

**Ruling.** The two agree: 46 + 4 = 50. The deadline is **week 50**.

- The count is taken **at the end of each game week**, after the German turn.
- A week counts if, at that moment, at least **10 Allied divisions** (HQ counters excluded) are east of the Rhine–IJssel line.
- The Allies win as soon as **4 consecutive weeks** have counted, provided the fourth is week 50 or earlier. The latest a winning streak can start is week 47.
- If a week does not count, the streak resets to zero.
- Which squares are "east of the line" is settled by ruling 5.

## 2. Attacking across a river

Agreed 2026-10-24.

**The problem.** The Instruction Manual and the Combat Factors table double the defender's defence when attacked from across a river. The card's "in combination" examples and the Le Havre walkthrough instead halve the attack factor of the units attacking across the river.

**Ruling.** The examples follow one consistent pattern, which the app uses:

1. **Defender doubles:** a defending unit's defence doubles (triples in a fortress behind a river, Combat Factors row 13) if _every_ attacker in the battle is across the river from it. Example (5): 5-16.
2. **Attacker halves:** an attacking unit that is across the river from a defending unit which did _not_ double has its attack factor halved. The halved factors are added together and a half rounds up. Examples "(4) & (5) a" (6-6) and "(6) & (3) a" (6-4), and the 95th's "8 to 4" in the walkthrough.
   - Otherwise attack and defence are normal. Example "(4) & (5) b": RED attacks two BLUE units, is across the river only from BLUE-B, so only BLUE-B doubles and RED is not halved (6-13).
3. **"Across the river"** means either:
   - a river edge separates the attacker from the defender, or
   - the attacker crossed a river during its movement this turn and attacks a defender on that river or one square from it.

   The app records each unit's path during the turn to apply the second case.

## 3. When cut-off units are eliminated

Agreed 2026-10-24.

**The problem.** The Instruction Manual says units cut off from supply are eliminated "the second week after" the line is cut, then that the player must restore the line "the week after" it is cut. The exact turn is not stated.

**Ruling.** The player gets one turn of their own to fix a cut, as in the Reference Folder's Rouen example:

1. At the **start** of each player's turn, every unit of that player that cannot trace a supply line is marked _out of supply_.
2. During that turn the player may move and attack to reopen a line.
3. At the **end** of that turn, every unit still out of supply is eliminated. Units that can trace a line again lose the marker.
4. A unit with no supply line at all is always eliminated. The owner chooses which units go only when a line exists but the Allied supply capacity is short (the Rouen case); then they choose among combat divisions, never HQs.
5. Being out of supply has no other effect: the unit moves and fights normally until eliminated.

## 4. The other victory conditions

Agreed 2026-10-24.

**The problem.** The Instruction Manual gives one victory condition and says "other, but less likely" ones are in the Reference Folder. Only the Reference Folder lists them, without saying how they are counted.

**Ruling.** All of them apply. The game ends as soon as either side wins.

The **Allies** win if, by week 50:

1. at least 10 divisions are east of the Rhine–IJssel line for 4 consecutive weeks (ruling 1); or
2. no German unit is west of the line for 4 consecutive weeks, counted at the end of each week as in ruling 1; or
3. every German unit has been eliminated (checked immediately).

The **Germans** win if:

1. week 50 ends without an Allied win; or
2. no Allied unit is on the continent for 10 consecutive weeks, counted at the end of each week. "On the continent" means any land square of the board; units in Britain or at sea in a sea transfer do not count. The count can only begin after the week-1 invasion; or
3. every Allied unit on the continent has been eliminated after the invasion has landed (checked immediately). Units still in Britain do not prevent this.

## 5. The Rhine–IJssel line and German supply

Agreed 2026-10-24.

**The problem.** The victory conditions and German supply depend on the Rhine–IJssel line, but the rules do not say which squares are east of it, or what a German unit must reach to "trace an unbroken line to the Rhine Ijjsel".

**Ruling.**

1. **The line** is the river edges of the IJssel, from where it ends at the IJsselmeer at `II5` (Karl, from the board) to where it leaves the Rhine near Arnhem, then the Rhine upstream to the Swiss border. The board draws it like any other river, so the map editor marks those edges as the Rhine–IJssel line.
2. **East of the line** is every square on the German side of those edges, worked out by the app from the marked edges and shown in the editor for checking. Land north and east of the IJsselmeer that is joined to Germany without crossing the line (Friesland, Groningen, towards Bremen) is east of the line.
3. **German supply:** a German unit is in supply if it can trace a path to a square east of the line, not passing through Allied zones of control, neutral countries, impassable mountains or sea. Rivers do not block the path.
4. Being east of the line does not supply a unit by itself: it needs a square east of the line free of Allied control, its own or one it can reach. A pocket surrounded inside Germany can be cut off.
5. **Tracing, both sides:** the path starts at the unit's own square, which may be in an enemy zone of control; every other square on it must be free of enemy control. Allied paths end at a supply beach or port the Allies hold.

## 6. Zone of control of a unit on a coastal square

Agreed 2026-10-24.

**The problem.** The Instruction Manual says a coastal unit controls the sea square the arrow points from "plus adjacent land squares"; the Combat Factors card says "plus 4 adjacent land squares".

**Ruling.** The "4" describes the usual case on a straight coast, not a limit.

1. A unit on a coastal square controls **every adjacent land square** (3, 4 or 5 depending on the coastline) and the **one sea square whose red arrow points to its square**. It controls no other sea square.
2. If no red arrow points to its square, it controls only the adjacent land squares.
3. The other limits still apply: no control across a river, and a fortress on the coast controls only the arrow's sea square (Combat Factors row 12).
