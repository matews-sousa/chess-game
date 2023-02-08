import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import GamesTable from "../components/GamesTable";
import Layout from "../components/Layout";
import { useAuth } from "../contexts/AuthContext";
import { supabase } from "../lib/supabase";

// random color
const colors = ["white", "black"] as const;
type Color = typeof colors[number];
// write a function to get a random color
const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)];

const Home = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [gameId, setGameId] = useState<string | null>(null);
  const [myGames, setMyGames] = useState<Game[]>([]);

  const handleSelectColor = async (color: Color) => {
    const { data, error } = await supabase
      .from("games")
      .insert({
        creator_id: currentUser?.id,
        players: [
          {
            id: currentUser?.id,
            color,
            name: currentUser?.user_metadata.firstName || currentUser?.email,
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
      // check if the user is already in the game, if it is, navigate to the game page
      if (data.players.find((player: Player) => player.id === currentUser?.id)) {
        navigate(`/${gameId}`);
        return;
      }
      alert("Game is full");
      return;
    }
    // add the user to the game
    const { data: updatedGame, error: updateError } = await supabase
      .from("games")
      .update({
        status: "started",
        players: [
          data.players[0],
          {
            id: currentUser?.id,
            color: data.players[0].color === "white" ? "black" : "white",
            name: currentUser?.user_metadata.firstName || currentUser?.email,
          },
        ],
      })
      .eq("uuid", gameId)
      .select()
      .single();
    // navigate to the game page
    navigate(`/${updatedGame.uuid}`);
  };

  useEffect(() => {
    const fetchGames = async () => {
      const { data, error } = await supabase.from("games").select("*");
      const myGames = data?.filter((game: Game) =>
        game.players.find((player: Player) => player.id === currentUser?.id),
      );
      setMyGames(myGames as Game[] | []);
    };
    fetchGames();
  }, []);

  return (
    <Layout>
      <h2 className="text-4xl font-bold mb-10">
        Welcome, <span className="underline">{currentUser?.user_metadata.firstName || currentUser?.email}</span>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="col-span-1">
          <h3 className="text-3xl font-semibold mb-6">Create Game</h3>
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => handleSelectColor("white")}
              className="bg-gray-200 hover:bg-gray-300 font-semibold py-10 rounded-md flex flex-col items-center justify-center"
            >
              <img src="/w_k.svg" alt="White King piece" />
              <span>White</span>
            </button>
            <button
              onClick={() => handleSelectColor("black")}
              className="bg-gray-200 hover:bg-gray-300 font-semibold py-10 rounded-md flex flex-col items-center justify-center"
            >
              <img src="/b_k.svg" alt="Black King piece" />
              <span>Black</span>
            </button>
            <button
              onClick={() => handleSelectColor(getRandomColor())}
              className="bg-gray-200 hover:bg-gray-300 font-semibold py-10 rounded-md flex flex-col items-center justify-center"
            >
              <div className="flex gap-2">
                <img src="/w_k.svg" alt="White King piece" />
                <img src="/b_k.svg" alt="Black King piece" />
              </div>
              <span>Random</span>
            </button>
          </div>
        </div>

        <div className="col-span-1">
          <h3 className="text-3xl font-semibold mb-6">Join Game</h3>
          <div className="flex flex-col">
            <input
              type="text"
              placeholder="Enter game ID"
              className="border border-gray-400 rounded-md px-2 py-3"
              onChange={(e) => setGameId(e.target.value)}
            />
            <button
              onClick={handleJoinGame}
              className="mt-2 bg-green-500 hover:bg-green-600 rounded-md px-2 py-3 text-white font-semibold disabled:opacity-75 disabled:cursor-default"
            >
              Join
            </button>
          </div>
        </div>

        <div className="col-span-2 mt-6">
          <h3 className="text-3xl font-semibold mb-6">My Games</h3>
          <GamesTable games={myGames} />
        </div>
      </div>
    </Layout>
  );
};

export default Home;
