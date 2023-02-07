type Player = {
  id: string;
  color: "white" | "black";
  name: string;
};

type Game = {
  uuid: string;
  created_at: Date;
  creator_id: string;
  players: Player[];
  status?: "waiting" | "started" | "finished";
  winner: Player | null;
  position?: string;
  turn: "w" | "b";
};
