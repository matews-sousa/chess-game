import { Chess, Square } from "chess.js";
import Chessboard from "chessboardjsx";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGame } from "../contexts/GameContext";
import { supabase } from "../lib/supabase";

// give chess initial position in fen notation
const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const chess = new Chess();

const Game = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const { currentUser } = useAuth();
  const { gameData, channel, whitePlayer, blackPlayer, setUuid } = useGame();
  const [position, setPosition] = useState<string>("start");
  const [isGameOver, setIsGameOver] = useState(chess?.isGameOver());
  const playerColor = gameData?.players.find((player) => player.id === currentUser?.id)?.color as "white" | "black";

  const handleOnDrop = async ({ sourceSquare, targetSquare }: { sourceSquare: Square; targetSquare: Square }) => {
    if (sourceSquare === targetSquare || !channel) return;
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "n",
      });
      if (move === null) return;
      setPosition(chess.fen());
      setIsGameOver(chess.isGameOver());
      await channel.send({
        type: "broadcast",
        event: "make-move",
        payload: {
          move: {
            from: sourceSquare,
            to: targetSquare,
          },
        },
      });
    } catch (error) {
      console.log(error);
    }
  };

  const handleAllowDrag = ({ piece }: { piece: string }) => piece[0] === playerColor[0];

  useEffect(() => {
    if (!uuid || !currentUser) return;
    setUuid(uuid);
  }, [uuid]);

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "make-move" }, async (payload) => {
      const { move } = payload.payload;
      chess.move(move);
      setPosition(chess.fen());
      await supabase.from("games").update({ position: chess.fen() }).eq("uuid", uuid).select().single();
    });
  }, [channel]);

  useEffect(() => {
    if (!gameData) return;
    if (gameData.players.length === 2) {
      chess.load(gameData.position || initialFEN);
      setPosition(gameData.position || initialFEN);
    }
  }, [gameData]);

  if (!gameData) return null;

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      {gameData && gameData.players.length === 2 ? (
        <div>
          {playerColor === "white" ? (
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold">{blackPlayer?.id}</h1>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold">{whitePlayer?.id}</h1>
            </div>
          )}
          <Chessboard
            allowDrag={handleAllowDrag}
            position={position}
            draggable={!isGameOver}
            onDrop={handleOnDrop}
            orientation={playerColor}
          />
          {playerColor === "white" ? (
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold">{whitePlayer?.id}</h1>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center">
              <h1 className="text-2xl font-bold">{blackPlayer?.id}</h1>
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold">Waiting for another player...</h1>
          {gameData.creator_id === currentUser?.id && (
            <button
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
              onClick={async () => {
                await supabase.from("games").delete().eq("uuid", uuid);
                navigate("/");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default Game;
