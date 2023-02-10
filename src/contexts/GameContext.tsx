import { RealtimeChannel } from "@supabase/supabase-js";
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
            const { data } = await supabase
              .from("games")
              .update({
                status: "started",
                players: [
                  gameData.players[0],
                  {
                    id: currentUser.id,
                    color: gameData.players[0].color === "white" ? "black" : "white",
                    name: currentUser.user_metadata.firstName || currentUser.email,
                  },
                ],
              })
              .eq("uuid", uuid)
              .select()
              .single();
            setGameData(data as Game);
          }
        }
      });

    setChannel(channel);

    return () => {
      channel.unsubscribe();
    };
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
