# Gameplay

The product feature: how a Chain Reaction match is played. Implementation rules (purity, API signatures) live in [../backend/RULES.md](../backend/RULES.md).

Chain Reaction is played on a rectangular grid. Each cell holds a **count** of orbs and an **owner** (a player index, or `null` if empty).

## Move

On your turn, click a cell that is either empty or already owned by you. The cell's count increases by 1 and ownership is set to you. You cannot click a cell owned by another player.

## Critical mass

Each cell has a critical mass equal to its number of orthogonal neighbors:

- Corner cells: **2**
- Edge cells: **3**
- Interior cells: **4**

When a cell's count reaches or exceeds its critical mass, it **explodes**: count drops by the critical mass, and one orb is sent to each orthogonal neighbor. The orbs that spread carry the exploding player's ownership.

## Cascades

Explosions chain. A neighbor pushed over its critical mass explodes too, which may push further neighbors over, and so on. The board settles when no cell is over critical.

## Ownership transfer

When an orb lands in a neighboring cell during an explosion, that neighbor becomes owned by the exploding cell's owner — regardless of prior ownership. This is how players capture territory.

## Elimination

A player is eliminated when they own zero cells.

**Grace period:** the elimination check runs only after every player has had at least one turn. Without this, every player would be "eliminated" on an empty board before their first move.

## Win condition

Exactly one player remains not eliminated. That player wins.

## Variants

None. The same rules apply at every grid size from 3×3 to 20×20. New variant rules go behind a flag and are documented here.

## Things we deliberately don't do

- No special rules for the first move (beyond the elimination grace period).
- No per-cell cooldowns or undo.
- No rule variations by grid size.
