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
    const newGameData = {
      position: chess.fen(),
      status: chess.isGameOver() ? "finished" : "started",
      winner: chess.isGameOver() ? (chess.turn() === "w" ? "black" : "white") : null,
      endOfGame: getTypeOfEnd(chess),
      history: [...gameData.history, chess.history()[0]],
    } as Game;
    setGameData((prev) => ({ ...prev, ...newGameData }));
    return await supabase.from("games").update(newGameData).eq("uuid", gameData.uuid);
  } catch (error) {
    console.log(error);
  }
};

export default updateGame;
