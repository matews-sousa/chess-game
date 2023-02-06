import { supabase } from "../lib/supabase";

const getGame = async (uuid: string) => {
  const { data, error } = await supabase.from("games").select("*").eq("uuid", uuid).single();
  if (error) {
    throw error;
  }
  return data;
};

const createGame = async (_data: Game) => {
  const { data, error } = await supabase.from("games").insert(_data).select();
  if (error) {
    throw error;
  }
  return data;
};

const joinGame = async (uuid: string, playerData: Player) => {
  const { data, error } = await supabase.from("games").update({ players: playerData }).eq("uuid", uuid).select();
  if (error) {
    throw error;
  }
  return data;
};

export { getGame, createGame, joinGame };
