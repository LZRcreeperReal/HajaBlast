# Haja Rumble

A browser-based card and dice betting game for 2–4 players.

## How to Play

### Setup
- Each player starts with **25 chips** and **3 cards**.

### Swap Phase
Before each round's ante, every player may swap their **lowest card** for a new one from the deck. This costs **1 chip** and can only be done **once per round**.

### Ante Roll
Everyone rolls a die. The number rolled is how many chips they pay into the pot (or all remaining chips if they don't have enough).

### Play Roll
Everyone rolls again. The result determines what they play:

| Roll | Effect |
|------|--------|
| 1 | Play 1 card at face value |
| 2 | Play 2 cards at face value |
| 3 | Play all 3 cards at face value |
| 4 | Pick 1 card to double, play that |
| 5 | 1 card doubled + 1 card at face value |
| 6 | 2 cards both doubled |

### Card Values
- Number cards: face value
- Jack, Queen, King: 11
- Ace: 12

### Winning
The player with the highest total score wins the entire pot. In the case of a tie, the pot is split. Players eliminated when they reach 0 chips. Last player standing wins the game.

## Development

```bash
npm install
npm run dev
```

## Deployment

Deploy to Vercel with zero configuration — just connect your GitHub repo.

```bash
npm run build
```
