# D-Day (1961) rules specification

The complete 1961 rules as the app enforces them, written in our own words. The rules engine is built from this document.

- **Sources:** the 1961 Instruction Manual, the Combat Results Table card (RULE-D/RULE-A), the Combat Factors card, the Unit Symbols card and the Reference Folder, all from Karl's copy. The manual is the main source; the cards and the Reference Folder clarify it.
- **Rulings:** where the sources are unclear or disagree, [rulings.md](rulings.md) decides. References like _(R2)_ point to it. Items marked **Proposed P1…** are open: they are listed at the end and need Karl's agreement.
- **Words:** the rulebook says "square"; this document says **hex**. Coordinates follow [hex-numbering.md](hex-numbering.md).
- **Data from the board:** several tables are printed on the board itself (invasion tables, supply numbers, Britain arrival boxes). They are entered in the map and setup editor, and are referred to here as _board data_. See section 14.

## 1. Players and sides

- Two sides: **Allied** (SHAEF, blue counters) and **German** (OB WEST, red counters). Each side may be played by a person or the AI.
- The Allies sit on the west side of the board (Britain), the Germans on the east.
- One six-sided die. The attacker rolls (section 9.6). The app rolls it, or lets players enter a physical roll.

## 2. The board

### 2.1 Hex types

| Type | Effect |
| --- | --- |
| **Land** (clear) | Normal movement and combat. |
| **Sea** | No movement except week-1 assault squares (section 7) and sea transfer (section 8). |
| **Coastal** | A land hex next to the sea. Special zone of control (section 5). |
| **City** | Defence doubles. |
| **Fortified zone** (pink) | Defence doubles. |
| **Fortress** (red-outlined city) | Defence doubles; triples on the coast, or behind a river when attacked across it. No zone of control. |
| **Mountain** (brown) | Entering ends movement; defence doubles. |
| **"X" hex** | Impassable. |
| **Neutral** (Spain, Switzerland) | Impassable; nothing may be placed, moved or retreated there. |
| **Britain** | Off-board holding area for Allied units; not part of the continent. |

### 2.2 Edge and hex features

- **Rivers** run along hex edges. They never cost movement. They affect zones of control (5.2) and combat (9.4).
- The **Rhine–IJssel line** is a set of river edges, from the IJsselmeer at `II5` to the Swiss border. Every hex on the German side is **east of the line** _(R5)_.
- **Red sea numbers with arrows**: each arrow runs from a sea hex to a coastal hex. The number is the supply capacity of that beach. These sea hexes are the week-1 assault squares.
- **Boxed red numbers** are inland-port supply capacities. A boxed sea hex can never be assaulted.
- **Port letter hexes** ("R" for Rouen etc.): the hexes the Allies must hold to use that inland port.
- **Starred hexes**: German replacement hexes, and the set-up hexes for certain German units.
- **Invasion areas**: seven areas marked on the board, each with its own Troop Invasion Table (board data).

## 3. Units

- Every unit has three factors: **attack – defence – movement**. Attack never changes. Defence depends on terrain (9.3). Movement is the most hexes the unit may move in a turn.
- **Types:** infantry, armour (panzer), armoured infantry (German panzer grenadier), parachute, static infantry (German only), headquarters (HQ).
- **Sizes:** regiment, brigade, division, and HQs at army to theatre level. For supply and victory, every Allied counter on land counts as one division (HQs included for supply, excluded for victory).
- **Order of battle:** Allied 101 counters; German 73 counters. Full list in the editor's unit data.
- **HQs** (0-1-4) have no attack factor: they never attack, but they defend, have a zone of control and count against Allied supply capacity.

### 3.1 Stacking

- Germans: up to **3** units per hex. Allies: up to **2** units per hex.
- An HQ must be alone in its hex.
- Units may move through hexes holding friendly units freely. Stacking limits apply where a unit ends its movement, its retreat and its advance after combat.
- Units in a stack move individually, each with its own movement allowance, so a stack moving together is limited by its slowest member.

## 4. Sequence of play

### 4.1 Before the game

1. The Allied player places all Allied units in Britain, in the holding boxes printed on the board (board data).
2. The German player places every German unit on the board:
   - all static divisions on coastal land hexes;
   - 9th SS Panzer, 49th and 51st Panzer Brigades (49SS, 51SS), 3rd, 15th and 25th SS Panzer Grenadier and 106th Panzer Brigade on starred hexes east of the Rhine–IJssel line;
   - everything else anywhere, coastal hexes included;
   - nothing in Spain or Switzerland; stacking limits apply.
3. The Allied player sees the German set-up, then secretly chooses one of the seven invasion areas. The choice is revealed when the assault is placed (section 7).

### 4.2 The week

The game is played in **weeks** 1 to 50. Each week is an **Allied turn** followed by a **German turn**.

**Allied turn:**

1. **Start-of-week events** from the Time Record Card take effect (board data), including German replacements from week 16 (section 11).
2. **Supply check:** Allied units that cannot trace supply are marked out of supply _(R3)_.
3. **Movement:** reinforcements, parachute drops, sea transfers, withdrawals to Britain, and moves on land, in any order. No combat is resolved until all movement is finished.
4. **Combat:** all battles, one at a time, in the order the Allied player chooses.
5. **End of turn:** out-of-supply units still cut off are eliminated _(R3)_; a supply-capacity shortfall is settled (10.4).

**German turn:** supply check, movement, combat and end of turn, as for the Allies.

**End of week:** the victory counts are taken _(R1, R4)_.

## 5. Zones of control

### 5.1 Basic rule

A unit **controls** the six hexes next to it, with these exceptions:

| Unit is | It controls |
| --- | --- |
| On a normal land hex, fortified zone, city or mountain | The 6 adjacent hexes. |
| Next to a river | Not the hexes across the river edge. |
| On a coastal hex | Every adjacent land hex, plus the one sea hex whose arrow points to its hex; no other sea hex _(R6)_. |
| In a fortress | Nothing. |
| In a fortress on the coast | Only the sea hex whose arrow points to its hex. |
| On a sea hex (week 1) | The coastal hex its arrow points to. |

Overlapping zones of control do not by themselves cause combat; units fight only when adjacent.

### 5.2 Effects

- **Movement:** a unit entering a hex controlled by an enemy must stop there. It may never pass through an enemy-controlled hex.
- **Combat:** a unit that ends its movement in an enemy-controlled hex must attack (9.1).
- **Retreat:** a retreating unit that would enter an enemy-controlled hex is eliminated (9.7).
- **Supply:** supply paths may not pass through enemy-controlled hexes (10.1).
- Friendly units in a hex do not cancel an enemy's control of it. **(Proposed P1)**

## 6. Movement

- A player may move any, all or none of their units, each up to its movement factor. Factors cannot be saved or shared.
- Units may move in any direction. The die plays no part in movement.
- **Enemy zones of control:** stop on entering (5.2).
- **Rivers:** no cost.
- **Mountains:** entering a mountain hex ends the unit's movement for the turn. So a unit stops on the first mountain hex it enters, then moves one mountain hex per turn. Moving from a mountain hex to a non-mountain hex is at the full rate.
- **X hexes, neutral countries:** never entered.
- **Sea:** only by the rules of sections 7 and 8.
- **Units starting next to an enemy** may move away freely, or stay. **(Proposed P2: a unit that ends its movement in an enemy zone of control must attack, whether or not it moved.)**

## 7. Invasion and reinforcement

### 7.1 The week-1 assault

1. The Allied player places units on **sea hexes with red numbers inside the chosen invasion area**: at most 2 per sea hex, whatever the number. Boxed numbers can't be used. Not every sea hex need be used, nor the full allowance.
2. The **Troop Invasion Table** for that area (board data) limits the armour, infantry and parachute units in the first turn. HQs can't land before week 3.
3. **Parachute units** may also be dropped (section 8.2).
4. Each unit on a sea hex must attack the German unit on the coastal hex its arrow points to. If that coastal hex is empty, the unit moves onto it at once, and must then attack any German unit it is now in the zone of control of. There is no other movement inland in week 1.
5. Combat is resolved after all units are placed.
   - A unit on a sea hex that wins may move onto the coastal hex it attacked, if the defender left it.
   - A unit on a sea hex that must retreat ("back 2") is eliminated instead.
   - A coastal hex whose defender survives a sea assault can never be assaulted from the sea again; it can still be attacked over land.
6. Allied units left on sea hexes after week 1 must be dealt with. **(Proposed P3: they return to Britain at the start of week 2.)**

### 7.2 Reinforcements

From week 2 on, the Allies may bring units from Britain onto the continent, subject to:

1. the weekly rate on the invaded area's Troop Invasion Table (second turn, then "third turn on"); HQs count against it;
2. units available in Britain (holding boxes and arrival weeks, board data);
3. supply: units on land plus arrivals may not exceed supply capacity (10.3);
4. room: arriving units are placed on **vacant coastal hexes of the invaded area that a red-number arrow points to**, or on hexes of a **captured inland port**, 2 per hex at most whatever the capacity. **(Proposed P4: which hexes of an inland port count.)**

Arriving units may move their full movement factor and attack in the turn they arrive. Sea hexes may not be used after week 1.

Units may only enter the continent through the invaded area(s), captured inland ports, or by parachute.

### 7.3 Second invasion

From **week 9**, the Allies may assault a second invasion area once, by the same rules as week 1 (that area's first-turn table), or assault the original area again if the first invasion failed. Afterwards reinforcements may arrive through both areas. No further invasions are allowed.

## 8. Sea transfer and parachutes

### 8.1 Sea transfer

German units never move by sea. Allied units may make three kinds of sea move:

1. Britain to an invaded area: this is reinforcement (7.2).
2. An invaded area to Britain: withdrawal (10.4), or voluntary.
3. From one invaded area to another: from **week 10** only.

A transfer takes three turns:

1. The unit ends its move on an embarkation hex: a coastal hex of an invaded area, or a captured inland port. It may not embark elsewhere. At most 2 units embark from one hex per turn.
2. The next turn it is at sea. It is then placed on a vacant arrival hex of the destination area, or returned to Britain.
3. The following turn it moves normally.

A transfer within the same invasion area is not allowed.

### 8.2 Allied parachute units

- Each of the six Allied parachute units may be dropped **twice per game**.
- A drop picks the unit up from its hex or from Britain **(Proposed P5)** and places it on a land hex:
  - within 5 hexes of the nearest Allied combat unit (other combat units may move first to extend the range; in week 1, units on assault sea hexes count);
  - not next to an enemy unit;
  - not on a mountain or sea hex.
- After landing, the unit may move up to its full movement factor in the same turn, and attack.
- A drop from Britain counts as a reinforcement for that week's rate and for supply capacity; in week 1 it counts against the table's parachute allowance.

## 9. Combat

### 9.1 Who must fight

- Every unit of the moving player that ends its movement in an enemy zone of control must attack (Proposed P2).
- Each battle's attackers must all be in the zone of control of the defenders they attack, with two optional exceptions:
  - **Across a river:** a unit may attack enemy units across a river edge. If it does, it must attack every enemy unit adjacent to it across that river.
  - **Fortress:** units next to an enemy fortress may attack it. A unit in a fortress may attack out of it; if it does, it must attack every enemy unit adjacent to it.
- Every defending unit in whose zone of control an attacking unit stands must be attacked in some battle.
- No unit may fight more than one battle per turn, attacking or defending, even if it is next to an enemy after combat.
- HQs never attack.

### 9.2 Forming battles

- The attacker splits the fighting into battles as they like, within 9.1. A deliberate sacrifice at poor odds to free other units is allowed.
- Several units attacking one defender add their attack factors together.
- Units on one hex may be attacked in more than one battle.
- A stack may attack enemy units on different adjacent hexes, in separate battles.

### 9.3 Defence factor

A defending unit's defence is its printed factor, multiplied by:

| Situation | Multiplier |
| --- | --- |
| Normal land, coastal hex, sea hex | ×1 |
| City, fortified zone, mountain, fortress | ×2 |
| Fortress on the coast | ×3 |
| Fortress behind a river, attacked across it | ×3 |
| Attacked across a river, on the river or one hex from it | ×2 _(R2)_ |

Multipliers don't add up or compound: the highest one that applies is used, and nothing goes above ×3. **(Proposed P6)**

### 9.4 Rivers

_(R2)_ A defending unit doubles if every attacker in the battle attacks it from across a river. An attacking unit is halved if it is across a river from a defending unit that did not double. Halved factors are added and a half rounds up.

"Across a river" means a river edge separates attacker and defender, or the attacker crossed a river this turn and the defender is on that river or one hex from it.

### 9.5 Odds

- Add the attack factors (after halving) and the defence factors (after multipliers).
- **Attacker stronger or equal:** divide attack by defence and drop the fraction: 2-1, 3-1 … 6-1. Anything above 6-1 is 6-1. **(Proposed P7)**
- **Defender stronger:** divide defence by attack and drop the fraction: 1-1 (anything below 1-2), 1-2 … 1-6. Anything below 1-6 is 1-6. **(Proposed P7)**
- Examples from the manual: 24-11 → 2-1; 16-9 → 1-1; 38-12 → 3-1; 4-15 → 1-3; 2-3 → 1-1.

### 9.6 Combat Results Table

The attacker rolls one die.

| Odds | 1 | 2 | 3 | 4 | 5 | 6 |
| --- | --- | --- | --- | --- | --- | --- |
| 1-6 | A elim | A elim | A back 2 | A elim | A elim | A elim |
| 1-5 | A elim | A elim | A back 2 | A back 2 | A elim | A elim |
| 1-4 | A back 2 | A elim | A back 2 | A back 2 | A elim | A elim |
| 1-3 | A back 2 | A back 2 | A back 2 | A back 2 | A elim | A elim |
| 1-2 | D back 2 | Exchange | A back 2 | A back 2 | A elim | A elim |
| 1-1 | D elim | Exchange | D back 2 | A back 2 | A elim | A elim |
| 2-1 | D elim | Exchange | D back 2 | A back 2 | Exchange | A elim |
| 3-1 | D elim | Exchange | D back 2 | D back 2 | Exchange | D elim |
| 4-1 | D elim | Exchange | D elim | D back 2 | D back 2 | D elim |
| 5-1 | D elim | D back 2 | D elim | D back 2 | D elim | D elim |
| 6-1 | D elim | D back 2 | D elim | D elim | D elim | D elim |

The irregular 1-4 and 1-5 lines are as printed (checked against Karl's card).

### 9.7 Results

- **A elim / D elim:** every attacking / defending unit in the battle is eliminated.
- **Back 2:** every losing unit moves 2 hexes, on a route chosen by the winner, in any combination of directions, not ending where it started.
  - A unit is eliminated if it cannot complete 2 hexes without entering an enemy-controlled hex, impassable terrain, a neutral country, the sea or the edge of the board.
  - The winner must choose a route that avoids elimination if one exists.
  - A unit surrounded by enemy zones of control is eliminated.
  - Retreat may pass through friendly units; it must end within stacking limits. **(Proposed P8)**
- **Exchange:** the side with the smaller total removes all its units in the battle. The other side removes units whose factors add up to at least that total, choosing which.
  - Defenders are counted at their multiplied defence; attackers at their printed attack factor. **(Proposed P9)**
  - Equal totals: both sides remove everything.

### 9.8 Moving after combat

Units never move after combat, except that a winning attacker may move into the hex the defender left, up to stacking limits, when that hex is:

1. a coastal hex attacked from the sea (week-1 assault);
2. across a river from the attacker;
3. a city, fortified zone or fortress;
4. a mountain hex.

A unit that does so may not attack again that turn. **(Proposed P10: "winning" means the defender's hex was emptied by D elim, D back 2 or an exchange.)**

## 10. Supply

### 10.1 Tracing supply

A supply path is a chain of adjacent hexes from the unit to a supply source. It may not pass through enemy-controlled hexes, neutral countries, X hexes or sea hexes. The unit's own hex may be enemy-controlled; every other hex on the path must not be _(R5)_. Rivers don't block supply.

- **German source:** any hex east of the Rhine–IJssel line that is not under Allied control _(R5)_.
- **Allied source:** a beach or inland port the Allies hold (10.2).

### 10.2 Allied supply sources

- **Beach:** a coastal hex with a red-number arrow pointing to it. It supplies the number on its sea hex.
- **Inland port:** supplies its boxed number when the Allies hold **all** its letter hexes.
- **Holding** a source hex means:
  - an Allied combat unit has entered it since a German unit last occupied it (a garrison isn't needed);
  - no German unit occupies it; and
  - it is not in a German zone of control. **(Proposed P11)**
- Beaches and ports outside the invaded area count for supply once held, but reinforcements can't arrive through beaches outside the invaded area(s).

### 10.3 Supply capacity

The total capacity of the held sources must be at least the number of Allied units on land, HQs included. Reinforcements may not be brought in beyond it.

### 10.4 Cut-off units and supply shortfall

_(R3)_ Out-of-supply units are marked at the start of their owner's turn, and those still cut off at the end of that turn are eliminated. Being out of supply has no other effect.

If the Germans reduce Allied capacity below the number of Allied units on land, then in the Allies' next turn:

1. The Allies may attack to recover the lost sources.
2. If the shortfall remains, they must withdraw enough divisions. Withdrawing units move to embarkation hexes in an invaded area or a captured inland port, at most 2 per hex. They go to sea, and return to Britain in the following Allied turn.
3. If not enough can reach embarkation hexes, the Allied player removes combat divisions of their choice until the shortfall is gone. HQs can't be chosen.

## 11. German replacements

From **week 16**, at the start of each Allied turn, the Germans return eliminated units to the board, up to a total of **5 attack factors** per week. **(Proposed P12: how HQs, with 0 attack, are counted.)**

- They are placed on starred hexes under complete German control: not Allied-held and not next to an Allied unit.
- Stacking limits apply.

## 12. Victory

_(R1, R4)_ Counts are taken at the end of each week.

**Allies win:**
- 10+ Allied divisions (no HQs) east of the line for 4 consecutive weeks, the fourth no later than week 50; or
- no German unit west of the line for 4 consecutive weeks, by week 50; or
- every German unit eliminated.

**Germans win:**
- week 50 ends without an Allied win; or
- no Allied unit on the continent for 10 consecutive weeks; or
- every Allied unit on the continent eliminated after the invasion.

The game ends as soon as one side wins.

## 13. Not used by the app

- The corps substitute counters exist only to save space on a physical board; the app shows stacks directly.
- The RULE-A slide converts odds mechanically; the app uses the formula in 9.5, which the slide is based on.

## 14. Board data to enter in the editor

- The map: hex types, rivers (with the Rhine–IJssel line marked), cities, fortified zones, fortresses, mountains, X hexes, neutral hexes, coast.
- For each of the seven invasion areas: its boundary, assault sea hexes, arrows and red numbers, and its Troop Invasion Table.
- Inland ports: boxed capacities and letter hexes.
- Starred hexes.
- Britain holding boxes: which Allied units are available from which week.
- The Time Record Card events. **(Karl: is the Time Record Card printed on the board, or a separate card? It wasn't among the photographed pages.)**

## 15. Proposed rulings awaiting agreement

| # | Question | Proposal |
| --- | --- | --- |
| P1 | Does a friendly unit in a hex cancel enemy control of it? | No. The rules never say so, and the retreat examples treat control as absolute. |
| P2 | Must a unit that ends its turn in an enemy zone of control attack, even if it didn't move? | Yes. The manual says the enemy "has the option to attack or withdraw", so standing still without attacking isn't an option. |
| P3 | What happens to Allied units still on sea hexes after week 1? | They return to Britain at the start of week 2. Units only stay on sea hexes after a failed assault, and sea hexes "cannot be used after the first week". |
| P4 | Which hexes of a captured inland port can receive reinforcements? | Its letter hexes, 2 units per hex. |
| P5 | Can a parachute unit drop from Britain after week 1? | Yes, as one of its two drops, counting as a reinforcement for the weekly rate and supply. The Reference Folder lists parachute drop as a way onto the continent. |
| P6 | Do defence multipliers compound (e.g. city ×2 and river ×2)? | No: the highest applies, with ×3 as the cap. The Combat Factors card gives "city across a river" as ×2, not ×4. |
| P7 | Odds beyond the table? | Better than 6-1 counts as 6-1; worse than 1-6 counts as 1-6. |
| P8 | Stacking limits after a retreat? | The winner must choose a retreat ending within stacking limits; if none exists, the unit is eliminated. |
| P9 | In an exchange, are attackers counted at halved factors? | No: attackers at printed attack factor, defenders at multiplied defence (the card only mentions the defender's multiplier). |
| P10 | When may the winner move into the defender's hex? | When the defender's hex is emptied by D elim, D back 2 or an exchange. Any attacking unit in the battle may move in, up to stacking limits. |
| P11 | Does a German zone of control alone stop a beach or port from supplying? | Yes, as the manual says: the Allies "must keep those squares out of any German Unit's zone of control". |
| P12 | German HQs have attack 0. How do they count for replacements? | Each HQ counts as 1 factor against the 5 per week, so they can't all return free. |
