import { Chess, Square } from "chess.js";
import Chessboard from "chessboardjsx";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { useGame } from "../contexts/GameContext";
import { supabase } from "../lib/supabase";
import { MdContentCopy } from "react-icons/md";
import { HiFlag } from "react-icons/hi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PromotionList from "../components/PromotionList";
import getTypeOfEnd from "../utils/getTypeOfEnd";
import Chat from "../components/Chat";

// give chess initial position in fen notation
const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const chess = new Chess();

const Game = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const { currentUser } = useAuth();
  const { gameData, channel, whitePlayer, blackPlayer, setUuid } = useGame();

  const [newGameUuid, setNewGameUuid] = useState<string | null>(null);

  const [position, setPosition] = useState<string>(initialFEN);
  const [history, setHistory] = useState<string[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [winner, setWinner] = useState<"white" | "black" | null>(null);
  const [typeOfEnd, setTypeOfEnd] = useState<EndOfGame>(null);
  const [nextMoveIsPromotion, setNextMoveIsPromotion] = useState(false);
  const [promotionFromTo, setPromotionFromTo] = useState<{ from: Square; to: Square } | null>(null);

  const playerColor = gameData?.players.find((player) => player.id === currentUser?.id)?.color as "white" | "black";

  const resetLocalGameState = () => {
    setPosition(initialFEN);
    setHistory([]);
    setIsGameOver(false);
    setWinner(null);
    setTypeOfEnd(null);
    setNextMoveIsPromotion(false);
    setPromotionFromTo(null);
    setNewGameUuid(null);
  };

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

    // get the possible moves and check if the next move is a promotion
    const moves = chess.moves({ verbose: true, square: sourceSquare });
    const isValidAndPromotion = moves.some((move) => move.to === targetSquare && move.promotion);

    // if the next move is a promotion, we need to wait for the user to choose a piece
    if (isValidAndPromotion && chess.get(sourceSquare)?.type === "p") {
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
      const newHistory = [...history, chess.history()[0]];
      setHistory(newHistory);

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
          newHistory,
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
      const newHistory = [...history, chess.history()[0]];
      setHistory(newHistory);
      await channel.send({
        type: "broadcast",
        event: "make-move",
        payload: {
          move: {
            from: promotionFromTo.from,
            to: promotionFromTo.to,
            promotion: promotionValue,
          },
          newHistory,
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

  const handleResign = async () => {
    if (!uuid || !currentUser || !channel || gameData?.status === "finished") return;
    const winner = playerColor === "white" ? "black" : "white";
    const typeOfEnd: EndOfGame = "resignation";
    setIsGameOver(true);
    setWinner(winner);
    setTypeOfEnd(typeOfEnd);
    await supabase
      .from("games")
      .update({
        status: "finished",
        winner,
        endOfGame: typeOfEnd,
      })
      .eq("uuid", uuid);
    await channel.send({
      type: "broadcast",
      event: "make-move",
      payload: {
        winner,
        typeOfEnd,
      },
    });
  };

  const handlePlayAgain = async () => {
    if (!channel || !currentUser || gameData?.status !== "finished") return;

    const { data, error } = await supabase
      .from("games")
      .insert({
        creator_id: currentUser.id,
        players: [
          {
            id: currentUser.id,
            color: playerColor === "black" ? "white" : "black",
            name: currentUser.user_metadata.firstName || currentUser.email,
          },
          {
            id: gameData.players[1].id,
            color: playerColor,
            name: gameData.players[1].name,
          },
        ],
      })
      .select()
      .single();

    if (error) {
      console.log(error);
      return;
    }
    await channel.send({
      type: "broadcast",
      event: "invite-play-again",
      payload: {
        newGameUuid: data.uuid,
      },
    });
  };

  useEffect(() => {
    if (!uuid || !currentUser) return;
    setUuid(uuid);
  }, [uuid]);

  useEffect(() => {
    if (!channel) return;
    channel.on("broadcast", { event: "make-move" }, async (payload) => {
      const { move, winner, typeOfEnd, newHistory } = payload.payload;
      if (typeOfEnd !== "resignation") chess.move(move);
      setWinner(winner);
      typeOfEnd !== "resignation" ? setIsGameOver(chess.isGameOver()) : setIsGameOver(true);
      setTypeOfEnd(typeOfEnd);
      setPosition(chess.fen());
      setHistory(newHistory);

      if (typeOfEnd !== "resignation") {
        await supabase
          .from("games")
          .update({
            position: chess.fen(),
            status: chess.isGameOver() ? "finished" : "started",
            winner,
            endOfGame: typeOfEnd,
            history: newHistory,
          })
          .eq("uuid", uuid)
          .select()
          .single();
      }
    });

    channel.on("broadcast", { event: "invite-play-again" }, async (payload) => {
      const { newGameUuid } = payload.payload;
      setNewGameUuid(newGameUuid);
    });

    channel.on("broadcast", { event: "accept-invite" }, async (payload) => {
      const { newGameUuid } = payload.payload;
      await supabase.from("games").update({ status: "started" }).eq("uuid", newGameUuid);
      resetLocalGameState();
      navigate(`/${newGameUuid}`);
    });
  }, [channel]);

  useEffect(() => {
    if (!gameData) return;
    if (gameData.players.length === 2) {
      chess.load(gameData.position || initialFEN);
      setPosition(gameData.position || initialFEN);
    }
  }, [gameData]);

  if (!gameData || !uuid || !channel) return null;

  if (gameData.status === "waiting") {
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

          <button
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mt-4"
            onClick={async () => {
              await supabase.from("games").delete().eq("uuid", uuid);
              navigate("/");
            }}
          >
            Cancel
          </button>
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
              {nextMoveIsPromotion && (
                <PromotionList handleChoosePromotion={handleChoosePromotion} playerColor={playerColor} />
              )}
              <Chessboard
                allowDrag={handleAllowDrag}
                position={position}
                draggable={!isGameOver}
                onDrop={handleOnDrop}
                orientation={playerColor}
                calcWidth={({ screenWidth }) => (screenWidth < 768 ? screenWidth - 60 : screenWidth / 2.7)}
              />
              {(isGameOver || gameData.status === "finished") && (
                <div className="absolute inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center">
                  <div className="bg-white p-6 rounded-md flex flex-col items-center justify-center">
                    <h1 className="text-2xl font-bold mb-4">{winner === playerColor ? "You won!" : "You lost!"} </h1>
                    <p className="mb-4 font-bold">{typeOfEnd?.toUpperCase()}</p>
                    <div className="flex gap-2 items-center">
                      <button
                        className="hover:bg-gray-200 text-black font-bold py-2 px-4 rounded"
                        onClick={async () => {
                          navigate("/");
                        }}
                      >
                        Back to home
                      </button>

                      {!newGameUuid ? (
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          onClick={handlePlayAgain}
                        >
                          Play Again
                        </button>
                      ) : (
                        <button
                          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                          onClick={async () => {
                            await channel.send({
                              type: "broadcast",
                              event: "accept-invite",
                              payload: {
                                newGameUuid,
                              },
                            });
                            resetLocalGameState();
                            navigate(`/${newGameUuid}`);
                          }}
                        >
                          Accept Rematch
                        </button>
                      )}
                    </div>
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

          <div className="flex flex-col justify-between space-y-4 rounded-md h-[80vh]">
            <div>
              <button
                onClick={handleResign}
                className="flex items-center gap-2 px-2 py-3 bg-red-400 hover:bg-red-500 font-semibold rounded-md text-white"
              >
                <span>Resign</span>
                <HiFlag className="h-5 w-5" />
              </button>
            </div>
            <Chat channel={channel} />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Game;
