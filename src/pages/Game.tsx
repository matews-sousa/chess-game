import { Chess, Square } from "chess.js";
import Chessboard from "chessboardjsx";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { useGame } from "../contexts/GameContext";
import { supabase } from "../lib/supabase";
import { MdContentCopy } from "react-icons/md";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PromotionList from "../components/PromotionList";

// give chess initial position in fen notation
const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const chess = new Chess();

const Game = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const { currentUser } = useAuth();
  const { gameData, channel, whitePlayer, blackPlayer, setUuid } = useGame();
  const [position, setPosition] = useState<string>(initialFEN);
  const [isGameOver, setIsGameOver] = useState(chess?.isGameOver());
  const [nextMoveIsPromotion, setNextMoveIsPromotion] = useState(false);
  const [promotionFromTo, setPromotionFromTo] = useState<{ from: Square; to: Square } | null>(null);
  const playerColor = gameData?.players.find((player) => player.id === currentUser?.id)?.color as "white" | "black";

  const copyToClipboard = () => {
    if (!uuid) return;
    navigator.clipboard.writeText(uuid);
    toast.success("Copied to clipboard", {
      position: "top-center",
      autoClose: 5000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
      theme: "light",
    });
  };

  const handleOnDrop = async ({ sourceSquare, targetSquare }: { sourceSquare: Square; targetSquare: Square }) => {
    if (sourceSquare === targetSquare || !channel) return;

    // if the next move is a promotion, we need to wait for the user to choose a piece
    if ((targetSquare[1] === "8" || targetSquare[1] === "1") && chess.get(sourceSquare)?.type === "p") {
      setNextMoveIsPromotion(true);
      setPromotionFromTo({ from: sourceSquare, to: targetSquare });
      return;
    }

    // if the next move is not a promotion, we can make the move
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
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

  const handleChoosePromotion = async (promotionValue: "b" | "n" | "r" | "q") => {
    if (!channel || !promotionFromTo) return;

    try {
      const move = chess.move({
        from: promotionFromTo.from,
        to: promotionFromTo.to,
        promotion: promotionValue,
      });
      if (move === null) return;
      setPosition(chess.fen());
      setIsGameOver(chess.isGameOver());
      await channel.send({
        type: "broadcast",
        event: "make-move",
        payload: {
          move: {
            from: promotionFromTo.from,
            to: promotionFromTo.to,
            promotion: promotionValue,
          },
        },
      });
      setNextMoveIsPromotion(false);
      setPromotionFromTo(null);
    } catch (error) {
      console.log(error);
    }
  };

  // allow to move only if the player is owner of the piece (playerColor === pieceColor)
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

  if (gameData.players.length === 1 && gameData.creator_id === currentUser?.id && uuid) {
    return (
      <Layout>
        <ToastContainer />
        <div className="flex flex-col items-center justify-center h-[65vh]">
          <div className="flex flex-col items-center justify-between mb-10">
            <p className="font-medium mb-2">Copy the ID and share with a friend to join the game.</p>
            <div className="flex items-center justify-between gap-6 bg-gray-100 px-4 py-2 rounded-md">
              <p className="cursor-pointer" onClick={copyToClipboard}>
                {uuid}
              </p>
              <button className="p-2 rounded-md bg-gray-200 hover:bg-gray-300" onClick={copyToClipboard}>
                <MdContentCopy />
              </button>
            </div>
          </div>
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
      </Layout>
    );
  }

  return (
    <Layout>
      {chess && position && gameData && gameData.players.length === 2 && (
        <div className="flex flex-col items-start">
          {playerColor === "white" ? (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold">{blackPlayer?.name}</h1>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold">{whitePlayer?.name}</h1>
            </div>
          )}
          <div className="relative">
            {nextMoveIsPromotion && <PromotionList handleChoosePromotion={handleChoosePromotion} />}
            <Chessboard
              allowDrag={handleAllowDrag}
              position={position}
              draggable={!isGameOver}
              onDrop={handleOnDrop}
              orientation={playerColor}
            />
          </div>
          {playerColor === "white" ? (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold">{whitePlayer?.name}</h1>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <h1 className="text-2xl font-bold">{blackPlayer?.name}</h1>
            </div>
          )}
        </div>
      )}
    </Layout>
  );
};

export default Game;
