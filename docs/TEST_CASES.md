# Manual QA Test Plan (Cross-Browser)

Use **Window A** (Normal) and **Window B** (Incognito) to verify the full game lifecycle and security hardening.

## 1. Authentication & Persistence
*   **A: Signup/Login:** Create an account in Window A. Verify you land on the dashboard.
*   **A: Refresh:** Refresh the page; verify you stay logged in (JWT check).
*   **B: Guest Access:** Open the app in Window B. Enter a name and join as a Guest. Verify the level badge shows "Sign in to earn XP" and play is still possible.

## 2. Matchmaking (Quick Match)
*   **A (User) + B (Guest): Quick Match:** Both windows press **Play** and pick the same board size and player count.
    *   *Expected:* Match starts. Play a few moves. Verify both see the same board state.
*   **Queue isolation:** Put a third window in a different size or player count.
    *   *Expected:* It must NOT match with the first two.
*   **A (User): Forfeit:** Close Window A.
    *   *Expected:* Window B should immediately see a "Victory" message as the opponent disconnected.

## 3. Game Mechanics & Integrity
*   **A + B (Two Users): XP Match:** Login to a different account in Window B (or create one). Both join the same quick match.
*   **Chain Reaction:** Trigger a 4-way explosion.
    *   *Expected:* Visual colors change correctly, and the explosion cascades to neighbors.
*   **Turn Enforcement:** Try to move in Window B when it is Window A's turn.
    *   *Expected:* The move is ignored or a "Not your turn" message appears.
*   **Win/XP Verification:** Window A wins a Classic 1v1.
    *   *Expected:* Game-over screen shows +20 XP for the winner and +4 XP for the loser; the overall and Classic/2-player leaderboards update.
*   **Join create-on-miss:** In Window B, use **Join** with a made-up code (e.g. ZZZZZZ).
    *   *Expected:* No error. A new room is created with that code (Classic board, 2 players); Window A joining the same code starts the game.

## 4. Hardening & Edge Cases (The New Stuff)
*   **Rate Limit (Spam):** In the game, try to click the board 20 times in 1 second.
    *   *Expected:* The server should drop the extra messages (Rate limit trip). Check browser console for WebSocket close/error if you hit the limit hard.
*   **Multiple Tabs (Same User):** Open a second tab in Window A and try to join a queue.
    *   *Expected:* Server should either disconnect the old session or prevent the new one from joining the same room.
*   **Idle Timeout:** Leave a game running and don't move for 2 minutes.
    *   *Expected:* The game should eventually close or time out (testing the reaper/idle logic).

## 5. Mobile/Responsive Check
*   **A: Resize:** Shrink Window A to a narrow mobile width.
    *   *Expected:* The grid should scale down to fit the screen without cutting off the "End Game" or "Chat" buttons.
