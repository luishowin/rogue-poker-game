#!/usr/bin/env node
import readline from "readline";
import { NikoJadiEngine } from "../src/engine/index.js";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const game = new NikoJadiEngine();

console.log("🎮 NikoJadi CLI Test Harness");
console.log("Type commands like:");
console.log("  move <player> <card>");
console.log("  state");
console.log("  exit\n");

function prompt() {
  rl.question("> ", (input) => {
    const [cmd, ...args] = input.trim().split(/\s+/);
    handleCommand(cmd, args);
  });
}

function handleCommand(cmd, args) {
  switch (cmd) {
    case "move": {
      const [player, card] = args;
      if (!player || !card) {
        console.log("Usage: move <player> <card>");
      } else {
        const result = game.processMove(player, { type: "play", card });
        console.log("→", result);
      }
      break;
    }

    case "declare": {
  const [player] = args;
  if (!player) {
    console.log("Usage: declare <player>");
  } else {
    const result = game.processMove(player, { type: "declare" });
    console.log("→", result);
  }
  break;
}


    case "state":
      console.dir(game.state, { depth: null });
      break;

    case "help":
      console.log("Commands: move, declare, state, help, exit");
      break;

    case "exit":
      rl.close();
      return;

    default:
      console.log("Unknown command. Type 'help'.");
  }
  prompt();
}

prompt();

rl.on("close", () => {
  console.log("\n👋 Exiting NikoJadi test harness.");
  process.exit(0);
});
