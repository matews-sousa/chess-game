type Player = {
  id: string;
  color: "white" | "black";
  name: string;
};

type GameStatus = "waiting" | "started" | "finished";

type EndOfGame =
  | "checkmate"
  | "stalemate"
  | "insufficient material"
  | "threefold repetition"
  | "fifty move rule"
  | "draw"
  | null;

type Game = {
  uuid: string;
  created_at: Date;
  creator_id: string;
  players: Player[];
  status: GameStatus;
  position?: string;
  winner?: "white" | "black" | null;
  endOfGame?: EndOfGame;
};

type Message = {
  id: string;
  created_at: Date;
  game_id: string;
  player_id: string;
  from: string;
  text: string;
};
