import { Chess } from "chess.js";

const getTypeOfEnd = (chess: Chess): EndOfGame => {
  if (chess.isCheckmate()) {
    return "checkmate";
  } else if (chess.isDraw()) {
    return "draw";
  } else if (chess.isStalemate()) {
    return "stalemate";
  } else if (chess.isThreefoldRepetition()) {
    return "threefold repetition";
  } else if (chess.isInsufficientMaterial()) {
    return "insufficient material";
  } else if (chess.isDraw()) {
    return "draw";
  } else {
    return null;
  }
};

export default getTypeOfEnd;
