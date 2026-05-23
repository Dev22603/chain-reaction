# Manual QA Test Plan (Cross-Browser)

Use **Window A** (Normal) and **Window B** (Incognito) to verify the full game lifecycle and security hardening.

## 1. Authentication & Persistence
*   **A: Signup/Login:** Create an account in Window A. Verify you land on the dashboard.
*   **A: Refresh:** Refresh the page; verify you stay logged in (JWT check).
*   **B: Guest Access:** Open the app in Window B. Enter a name and join as a Guest. Verify you can see the Casual queue but not the Leaderboard rankings.

## 2. Matchmaking (The "Ranked" Gate)
*   **B (Guest): Ranked Attempt:** Try to join the **Ranked** queue.
    *   *Expected:* You should receive an error message (or be blocked) stating "Ranked matches require a logged-in account."
*   **A (User) + B (Guest): Casual Match:** Both windows join the **Casual** queue (same board size).
    *   *Expected:* Match starts. Play a few moves. Verify both see the same board state.
*   **A (User): Forfeit:** Close Window A.
    *   *Expected:* Window B should immediately see a "Victory" message as the opponent disconnected.

## 3. Game Mechanics & Integrity
*   **A + B (Two Users): Ranked Match:** Login to a different account in Window B (or create one). Both join **Ranked**.
*   **Chain Reaction:** Trigger a 4-way explosion.
    *   *Expected:* Visual colors change correctly, and the explosion cascades to neighbors.
*   **Turn Enforcement:** Try to move in Window B when it is Window A's turn.
    *   *Expected:* The move is ignored or a "Not your turn" message appears.
*   **Win/Score Verification:** Window A wins the match.
    *   *Expected:* Window A's score increases on the Leaderboard. Window B's score decreases or stays same.

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
