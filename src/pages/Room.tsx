import React, { useEffect } from "react";
import { Navigate, useParams } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { useGame } from "../contexts/GameContext";
import { supabase } from "../lib/supabase";

const Room = () => {
  const { uuid } = useParams();
  const { currentUser } = useAuth();
  const { gameData, setGameData, setUuid } = useGame();

  const handleJoinGame = async () => {
    console.log("here");
    if (!gameData || currentUser?.id === gameData.players[0].id) return;
    const { data, error } = await supabase
      .from("games")
      .update({
        players: [
          ...gameData.players,
          {
            id: currentUser?.id,
            email: currentUser?.email,
            color: gameData.players[0].color === "white" ? "black" : "white",
          },
        ],
      })
      .eq("uuid", uuid)
      .select();
    if (error) console.log(error);
    console.log(data);
    setGameData(data);
  };

  useEffect(() => {
    if (!uuid) return;
    setUuid(uuid);
    handleJoinGame();
  }, [uuid]);

  if (!gameData) return <div>Loading...</div>;

  return (
    <div>
      {gameData.players.length === 1 ? (
        <div>
          <h1>Waiting for another player to join...</h1>
        </div>
      ) : (
        <Navigate to="/game" />
      )}
    </div>
  );
};

export default Room;
