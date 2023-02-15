import React from "react";
import { Chess } from "chess.js";
import getTypeOfEnd from "./getTypeOfEnd";
import { supabase } from "../lib/supabase";

const updateGame = async (
  chess: Chess,
  gameData: Game,
  setGameData: React.Dispatch<React.SetStateAction<Game | null>>,
) => {
  try {
    const newHistory = { from: chess.history({ verbose: true })[0].from, to: chess.history({ verbose: true })[0].to };

    const newGameData = {
      position: chess.fen(),
      status: chess.isGameOver() ? "finished" : "started",
      winner: chess.isGameOver() ? (chess.turn() === "w" ? "black" : "white") : null,
      endOfGame: getTypeOfEnd(chess),
      history: [...gameData.history, newHistory],
    } as Game;
    setGameData((prev) => ({ ...prev, ...newGameData }));
    return await supabase.from("games").update(newGameData).eq("uuid", gameData.uuid);
  } catch (error) {
    console.log(error);
  }
};

export default updateGame;
