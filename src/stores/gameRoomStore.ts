import { Chess, Square } from "chess.js";
import { create } from "zustand";

type GameRoomStore = {
  chess: Chess;
  promotionFromTo: {
    from: Square;
    to: Square;
  } | null;
  newGameUuid: string | null;
  setChess: (chess: Chess) => void;
  setPromotionFromTo: (promotionFromTo: { from: Square; to: Square } | null) => void;
  setNewGameUuid: (newGameUuid: string | null) => void;
  resetGame: () => void;
};

export const useGameRoomStore = create<GameRoomStore>((set) => ({
  chess: new Chess(),
  promotionFromTo: null,
  newGameUuid: null,
  setChess: (chess: Chess) => set({ chess }),
  setNewGameUuid: (newGameUuid: string | null) => set({ newGameUuid }),
  setPromotionFromTo: (promotionFromTo: { from: Square; to: Square } | null) => set({ promotionFromTo }),
  resetGame: () => {
    set({
      chess: new Chess(),
      promotionFromTo: null,
      newGameUuid: null,
    });
  },
}));
