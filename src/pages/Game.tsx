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
import getTypeOfEnd from "../utils/getTypeOfEnd";

// give chess initial position in fen notation
const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const chess = new Chess();

const Game = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const { currentUser } = useAuth();
  const { gameData, channel, whitePlayer, blackPlayer, setUuid } = useGame();

  const [messageText, setMessageText] = useState<string>("");
  const [messages, setMessages] = useState<Message[]>([]);

  const [position, setPosition] = useState<string>(initialFEN);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<"white" | "black" | null>(null);
  const [typeOfEnd, setTypeOfEnd] = useState<EndOfGame>(null);
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

      if (chess.isGameOver()) {
        const winner = chess.turn() === "w" ? "black" : "white";
        const typeOfEnd = getTypeOfEnd(chess);
        setWinner(winner);
        setTypeOfEnd(typeOfEnd);
      }

      await channel.send({
        type: "broadcast",
        event: "make-move",
        payload: {
          move: {
            from: sourceSquare,
            to: targetSquare,
          },
          winner: chess.isGameOver() ? (chess.turn() === "w" ? "black" : "white") : null,
          typeOfEnd: chess.isGameOver() ? getTypeOfEnd(chess) : null,
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

  const handleSendMessage = async (message: string) => {
    if (!uuid || !currentUser) return;
    const { error } = await supabase.from("messages").insert({
      game_id: uuid,
      player_id: currentUser.id,
      from: currentUser.user_metadata.firstName || currentUser.email,
      text: message,
    });
    if (error) console.log(error);
  };

  useEffect(() => {
    if (!uuid || !currentUser) return;
    setUuid(uuid);
    supabase
      .channel("postgresChangesChannel")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "messages", filter: `game_id=eq.${uuid}` },
        (payload) => {
          setMessages((prev) => [...prev, payload.new as Message]);
        },
      )
      .subscribe();
  }, [uuid]);

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "make-move" }, async (payload) => {
      const { move, winner, typeOfEnd } = payload.payload;
      chess.move(move);
      setWinner(winner);
      setIsGameOver(chess.isGameOver());
      setTypeOfEnd(typeOfEnd);
      setPosition(chess.fen());
      await supabase
        .from("games")
        .update({
          position: chess.fen(),
          status: chess.isGameOver() ? "finished" : "started",
          winner,
          endOfGame: typeOfEnd,
        })
        .eq("uuid", uuid)
        .select()
        .single();
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
        <div className="grid grid-cols-1 lg:grid-cols-2">
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
              {isGameOver && (
                <div className="absolute inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center">
                  <div className="bg-white p-6 rounded-md flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold mb-4">{winner === playerColor ? "You won!" : "You lost!"} </h1>
                    <p className="mb-4 font-bold">{typeOfEnd?.toUpperCase()}</p>
                    <button
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                      onClick={async () => {
                        navigate("/");
                      }}
                    >
                      Back to home
                    </button>
                  </div>
                </div>
              )}
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
          <div className="flex flex-col justify-between">
            <div className="flex flex-col space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex flex-col items-start p-2 bg-gray-200 rounded-md max-w-xs w-full ${
                    message.player_id === currentUser?.id ? "self-end" : "self-start"
                  }`}
                >
                  <p className="font-bold">{message.player_id === currentUser?.id ? "You" : message.from}</p>
                  <p>{message.text}</p>
                </div>
              ))}
            </div>
            <form
              className="flex"
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage(messageText);
                setMessageText("");
              }}
            >
              <input
                className="flex-1 px-2 py-3 bg-gray-200 rounded-l-md"
                type="text"
                onChange={(e) => setMessageText(e.target.value)}
                value={messageText}
              />
              <button type="submit" className="px-2 py-3 bg-blue-400 rounded-r-md font-semibold text-white">
                Send
              </button>
            </form>
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Game;
