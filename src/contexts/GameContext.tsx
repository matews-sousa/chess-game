import { RealtimeChannel } from "@supabase/supabase-js";
import { Chess } from "chess.js";
import { useContext, createContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

interface GameContextProps {
  gameData: Game | null;
  channel: RealtimeChannel | null;
  whitePlayer: Player | undefined;
  blackPlayer: Player | undefined;
  setUuid: React.Dispatch<React.SetStateAction<string | null>>;
  setGameData: React.Dispatch<React.SetStateAction<Game | null>>;
}

const GameContext = createContext<GameContextProps>({} as GameContextProps);

export const GameProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser } = useAuth();
  const [uuid, setUuid] = useState<string | null>(null);
  const [gameData, setGameData] = useState<Game | null>(null);
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  const whitePlayer = gameData?.players.find((player) => player.color === "white");
  const blackPlayer = gameData?.players.find((player) => player.color === "black");

  const fetchGameData = async () => {
    const { data, error } = await supabase.from("games").select("*").eq("uuid", uuid).single();
    if (error) console.log(error);
    setGameData(data as Game);
  };

  useEffect(() => {
    if (!uuid || !currentUser) return;

    fetchGameData();

    supabase
      .channel("postgresChangesChannel")
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "games", filter: `uuid=eq.${uuid}` },
        (payload) => {
          setGameData(payload.new as Game);
        },
      )
      .subscribe();

    const channel = supabase.channel(uuid);

    channel
      .on("presence", { event: "join" }, async () => {})
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          if (gameData?.players.length === 1 && gameData?.players[0].id !== currentUser?.id) {
            await channel.send({
              type: "broadcast",
              event: "join-game",
              payload: {
                id: currentUser.id,
                color: gameData?.players[0].color === "white" ? "black" : "white",
              },
            });
          }
        }
      });

    channel.on("broadcast", { event: "join-game" }, async (payload) => {
      const { data, error } = await supabase.from("games").select("*").eq("uuid", uuid).single();
      if (error) return;

      if (data.players.length === 1) {
        await supabase
          .from("games")
          .update({ players: [data.players[0], payload.payload] })
          .eq("uuid", uuid)
          .select()
          .single();
      }
    });

    setChannel(channel);
  }, [uuid]);

  const value = {
    gameData,
    whitePlayer,
    blackPlayer,
    channel,
    setUuid,
    setGameData,
  };

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
};

export const useGame = () => useContext(GameContext);
