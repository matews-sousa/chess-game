import { Square } from "chess.js";
import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { useGame } from "../contexts/GameContext";
import { supabase } from "../lib/supabase";
import { HiFlag } from "react-icons/hi";
import "react-toastify/dist/ReactToastify.css";
import PromotionList from "../components/PromotionList";
import Chat from "../components/Chat";
import { useGameRoomStore } from "../stores/gameRoomStore";
import updateGame from "../utils/updateGame";
import Waiting from "../components/Waiting";
import Results from "../components/Results";
import Board from "../components/Board";

const Game = () => {
  const navigate = useNavigate();
  const { uuid } = useParams<{ uuid: string }>();
  const { currentUser } = useAuth();
  const { gameData, setGameData, channel, currentPlayerColor, whitePlayer, blackPlayer, setUuid } = useGame();
  const { chess, promotionFromTo, setNewGameUuid, resetGame, setPromotionFromTo } = useGameRoomStore();

  const handleOnDrop = async ({ sourceSquare, targetSquare }: { sourceSquare: Square; targetSquare: Square }) => {
    if (sourceSquare === targetSquare || !gameData) return;

    // get the possible moves and check if the next move is a promotion
    const moves = chess.moves({ verbose: true, square: sourceSquare });
    const isValidAndPromotion = moves.some((move) => move.to === targetSquare && move.promotion);

    // if the next move is a promotion, we need to wait for the user to choose a piece
    if (isValidAndPromotion && chess.get(sourceSquare)?.type === "p") {
      setPromotionFromTo({ from: sourceSquare, to: targetSquare });
      return;
    }

    // if the next move is not a promotion, we can make the move
    try {
      chess.move({
        from: sourceSquare,
        to: targetSquare,
      });
      await updateGame(chess, gameData, setGameData);
    } catch (error) {
      console.log(error);
    }
  };

  const handleChoosePromotion = async (promotionValue: "b" | "n" | "r" | "q") => {
    if (!promotionFromTo || !gameData) return;

    try {
      chess.move({
        from: promotionFromTo.from,
        to: promotionFromTo.to,
        promotion: promotionValue,
      });
      await updateGame(chess, gameData, setGameData);
      setPromotionFromTo(null);
    } catch (error) {
      console.log(error);
    }
  };

  const handleResign = async () => {
    if (!uuid || !currentUser || !channel || gameData?.status === "finished") return;
    const winner = currentPlayerColor === "white" ? "black" : "white";
    const typeOfEnd: EndOfGame = "resignation";
    await supabase
      .from("games")
      .update({
        status: "finished",
        winner,
        endOfGame: typeOfEnd,
      })
      .eq("uuid", uuid);
  };

  useEffect(() => {
    if (!uuid || !currentUser) return;
    setUuid(uuid);

    return () => {
      resetGame();
      setGameData(null);
    };
  }, [uuid]);

  useEffect(() => {
    if (!channel) return;

    channel.on("broadcast", { event: "invite-play-again" }, async (payload) => {
      const { newGameUuid } = payload.payload;
      setNewGameUuid(newGameUuid);
    });

    channel.on("broadcast", { event: "accept-invite" }, async (payload) => {
      const { newGameUuid } = payload.payload;
      await supabase.from("games").update({ status: "started" }).eq("uuid", newGameUuid);
      resetGame();
      navigate(`/${newGameUuid}`);
    });
  }, [channel]);

  useEffect(() => {
    if (!gameData || !chess || gameData.players.length !== 2) return;
    chess.load(gameData.position);
  }, [gameData]);

  if (!gameData || !uuid || !channel) return null;

  return (
    <Layout>
      {gameData.status !== "waiting" ? (
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="flex flex-col items-start">
            {currentPlayerColor === "white" ? (
              <div className="flex flex-col items-center">
                <h1 className="text-2xl font-bold">{blackPlayer?.name}</h1>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <h1 className="text-2xl font-bold">{whitePlayer?.name}</h1>
              </div>
            )}
            <div className="relative">
              {promotionFromTo && (
                <PromotionList handleChoosePromotion={handleChoosePromotion} playerColor={currentPlayerColor} />
              )}
              <Board handleOnDrop={handleOnDrop} />
              {gameData.status === "finished" && <Results />}
            </div>
            {currentPlayerColor === "white" ? (
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
      ) : (
        <Waiting uuid={uuid} />
      )}
    </Layout>
  );
};

export default Game;
