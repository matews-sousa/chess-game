import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGame } from "../contexts/GameContext";
import { supabase } from "../lib/supabase";
import { useGameRoomStore } from "../stores/gameRoomStore";

const Results = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { gameData, currentPlayerColor, channel } = useGame();
  const { newGameUuid, resetGame } = useGameRoomStore();

  const handlePlayAgain = async () => {
    if (!channel || !currentUser || gameData?.status !== "finished") return;

    const { data, error } = await supabase
      .from("games")
      .insert({
        creator_id: currentUser.id,
        history: [],
        players: [
          {
            id: currentUser.id,
            color: currentPlayerColor === "black" ? "white" : "black",
            name: currentUser.user_metadata.firstName || currentUser.email,
          },
          {
            id: gameData.players[1].id,
            color: currentPlayerColor,
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

  return (
    <div className="absolute inset-0 bg-black bg-opacity-75 z-50 flex flex-col items-center justify-center">
      <div className="bg-white p-6 rounded-md flex flex-col items-center justify-center">
        <h1 className="text-2xl font-bold mb-4">
          {gameData?.winner === currentPlayerColor ? "You won!" : "You lost!"}{" "}
        </h1>
        <p className="mb-4 font-bold">{gameData?.endOfGame?.toUpperCase()}</p>
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
                await channel?.send({
                  type: "broadcast",
                  event: "accept-invite",
                  payload: {
                    newGameUuid,
                  },
                });
                resetGame();
                navigate(`/${newGameUuid}`);
              }}
            >
              Accept Rematch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Results;
