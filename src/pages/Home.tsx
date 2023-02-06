import React from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

// random color
const colors = ["white", "black"] as const;
type Color = typeof colors[number];
// write a function to get a random color
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Home = () => {
  const navigate = useNavigate();
  const { currentUser, signOut } = useAuth();
  const [gameId, setGameId] = React.useState<string | null>(null);

  const handleSelectColor = async (color: string) => {
    const { data, error } = await supabase
      .from("games")
      .insert({
        creator_id: currentUser?.id,
        players: [
          {
            id: currentUser?.id,
            color,
          },
        ],
      })
      .select()
      .single();
    // navigate to the game page
    navigate(`/${data.uuid}`);
  };

  const handleJoinGame = async () => {
    // check if the game exists
    const { data, error } = await supabase.from("games").select("*").eq("uuid", gameId).single();
    if (!data) {
      alert("Game does not exist");
      return;
    }
    // check if the game is full
    if (data.players.length === 2) {
      alert("Game is full");
      return;
    }
    // check if the user is already in the game
    if (data.players.find((player) => player.id === currentUser?.id)) {
      alert("You are already in the game");
      return;
    }
    // add the user to the game
    const { data: updatedGame, error: updateError } = await supabase
      .from("games")
      .update({
        players: [
          ...data.players,
          {
            id: currentUser?.id,
            color: data.players[0].color === "white" ? "black" : "white",
          },
        ],
      })
      .eq("uuid", gameId)
      .select()
      .single();
    // navigate to the game page
    navigate(`/${updatedGame.uuid}`);
  };

  if (!currentUser) {
    return <Navigate to="/login" />;
  }

  return (
    <div>
      <h1>Home</h1>
      <p>Welcome {currentUser?.email}</p>
      <button onClick={signOut}>Sign Out</button>
      <div className="flex gap-2">
        <button onClick={() => handleSelectColor("white")}>White</button>
        <button onClick={() => handleSelectColor("black")}>Black</button>
        <button onClick={() => handleSelectColor(getRandomColor())}>Random</button>
      </div>

      <div className="mt-10">
        <h1>Join Game</h1>
        <input type="text" placeholder="Enter game ID" onChange={(e) => setGameId(e.target.value)} />
        <button onClick={handleJoinGame}>Join</button>
      </div>
    </div>
  );
};

export default Home;
