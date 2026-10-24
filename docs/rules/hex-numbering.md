# Hex numbering

The 1961 board has no printed hex numbers. The app uses the pencilled numbering on Karl's copy as its coordinate scheme, so that a hex named in the app can be found on the physical board.

## Labels

A hex label is a column of letters followed by a number, e.g. `K16` (Cherbourg).

- **Numbers** run from north to south, from 1 near Bremen to 47 at the Spanish border.
- **Letters** run from west to east, in this order:

  `r s t u v w x y z A B … Z AA BB CC … QQ RR …`

  The lowercase letters `r`–`z` are used only in the far south-west (the Biscay coast and Spain), where the board extends west of the `A` line.

- Labels are **case-sensitive**: `v44` (the Biscay coast at the Spanish border) and `V44` are different hexes, far apart.

### Letter index

Internally each letter is converted to a whole-number index, so that neighbours and distances are simple arithmetic:

| Letters  | Index      |
| -------- | ---------- |
| `r`–`z`  | −8 to 0    |
| `A`–`Z`  | 1 to 26    |
| `AA`–`ZZ` | 27 to 52  |

## Board orientation

The board is played with north (Britain) to the left. Seen that way:

- The hexes are **flat-topped**, and each number is a vertical column of hexes. Column numbers increase to the right (south).
- Within a column, letters increase upward (east).
- Moving one column to the right, the hex with the same letter is half a hex higher, so a line of constant letter slopes up to the right.

## Neighbours

The scheme is axial. The six neighbours of a hex with letter index `L` and number `n` are:

| Direction on the board | Neighbour   |
| ---------------------- | ----------- |
| up (east)              | `L+1, n`    |
| down (west)            | `L−1, n`    |
| upper right            | `L, n+1`    |
| lower right            | `L−1, n+1`  |
| upper left             | `L+1, n−1`  |
| lower left             | `L, n−1`    |

For example, Cherbourg `K16` has `L16` to the east, and `K17` and `J17` to the south.

The distance in hexes between two hexes is `max(|ΔL|, |Δn|, |ΔL + Δn|)`.

## Reference hexes

Confirmed by Karl from his board:

| Hex          | Label             |
| ------------ | ----------------- |
| Cherbourg    | `K16`             |
| Brest        | `B21`             |
| Le Havre     | `O17`             |
| Paris        | `S20`, `S21`, `R21` |
| Bremen       | `QQ2`             |
| Marseilles   | `N45`             |
| Biscay coast at the Spanish border | `v44` |
| South-west corner of the board | `r47` (the pencil mark on the board there is wrong) |
| Bottom edge near the corner | `v47` |

## Other pencil marks

Karl's board also has pencil marks that are not part of this scheme: single capitals along the north-east edge, and numbers (29–44) in the sea west of Normandy and Brittany, which have been erased and survive only as faint traces. Karl confirmed (2026-10-24) that both are irrelevant; the app ignores them.

The layout above was checked against the board around Cherbourg, Le Havre and Brest and confirmed by Karl.
