A web based rogue poker game.

rogue-poker-server/
│
├── package.json
├── package-lock.json
├── .gitignore
├── README.md
│
├── index.js                  # Entry point (starts the server)
│
├── src/                      # Main source code
│   ├── server.js             # Socket.io + Express setup
│   ├── game/                 # All game logic
│   │   ├── engine.js         # Rule engine (card logic, moves, turns)
│   │   ├── deck.js           # Deck generation, shuffling, dealing
│   │   └── state.js          # Game state tracking + validation
│   │
│   ├── utils/                # Helper utilities
│   │   └── helpers.js        # Random IDs, suit matching, etc.
│   │
│   └── config/               # Configuration constants
│       └── settings.js       # Max players, deck type, etc.
│
└── tests/                    # Local test files (optional)
    └── engine.test.js
