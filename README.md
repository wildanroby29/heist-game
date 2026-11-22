# The Vault — a bank heist

[![make.fun](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/wildanroby29/heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/wildanroby29/heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559)

A complete top-down bank heist that plays offline in a desktop browser.
Sneak past three patrolling guards and three sweeping wall cameras, pocket
$2,500 in gold bars from the vault, and reach the ESCAPE door — without
filling the alarm meter.

## How to play

- **WASD / arrow keys** — move
- **Shift** — sneak (slower, quieter, harder to spot)
- **E** — pocket a gold bar
- **Q or mouse click** — throw a coin; nearby guards go to check the noise
- **R** — restart after a win or a catch · **M** — mute

Guards and cameras sweep vision cones across the bank hall. Being seen fills
the alarm; hiding drains it. A full alarm sends every guard running at you,
and a guard that reaches you costs a life. You have 3 lives. Desks, the
teller counter and pillars block sight — plan your route around them.

## Run it

Serve `game/` with any static server and open `game/index.html`, or run
`node serve.ts` and open http://localhost:8080.
