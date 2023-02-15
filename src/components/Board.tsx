import { Square } from "chess.js";
import Chessboard, { Piece } from "chessboardjsx";
import { useGame } from "../contexts/GameContext";

interface Props {
  handleOnDrop: ({ sourceSquare, targetSquare }: { sourceSquare: Square; targetSquare: Square }) => void;
}

const Board = ({ handleOnDrop }: Props) => {
  const { gameData, currentPlayerColor } = useGame();

  // allow to move only if the piece is the same color as the current player
  const allowDrag = ({ piece }: { piece: Piece }) => piece[0] === currentPlayerColor[0];

  return (
    <Chessboard
      onDrop={handleOnDrop}
      position={gameData?.position}
      orientation={currentPlayerColor}
      draggable={gameData?.status === "started"}
      allowDrag={allowDrag}
      calcWidth={({ screenWidth }) => (screenWidth < 768 ? screenWidth - 60 : screenWidth / 2.7)}
    />
  );
};

export default Board;
