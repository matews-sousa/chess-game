import { Chess, Square } from "chess.js";
import Chessboard, { Piece } from "chessboardjsx";
import { useEffect, useState } from "react";
import { useGame } from "../contexts/GameContext";
import highlightAvailableMoves from "../utils/highlightAvailableMoves";

interface Props {
  handleOnDrop: ({ sourceSquare, targetSquare }: { sourceSquare: Square; targetSquare: Square }) => void;
  chess: Chess;
}

const Board = ({ handleOnDrop, chess }: Props) => {
  const { gameData, currentPlayerColor } = useGame();
  const [squareStyles, setSquareStyles] = useState<{ [key: string]: React.CSSProperties }>({});
  const [fromClick, setFromClick] = useState<Square | null>(null);

  const handleSquareClick = (square: Square) => {
    if (fromClick === square) {
      setFromClick(null);
      setSquareStyles({});
      return;
    }

    const _moves = chess.moves({ square, verbose: true }).map((move) => move.to);

    if (!_moves.includes(square) && _moves.length > 0) {
      setFromClick(square);
    } else {
      handleOnDrop({ sourceSquare: fromClick!, targetSquare: square! });
      setFromClick(null);
    }

    setSquareStyles(highlightAvailableMoves(_moves));
  };

  // allow to move only if the piece is the same color as the current player
  const allowDrag = ({ piece }: { piece: Piece }) => piece[0] === currentPlayerColor[0];

  useEffect(() => {
    const lastMove = gameData?.history[gameData.history.length - 1];

    if (lastMove) {
      setSquareStyles({
        [lastMove.from]: { backgroundColor: "rgb(255, 255, 0, 0.4)" },
        [lastMove.to]: { backgroundColor: "rgb(255, 255, 0, 0.4)" },
      });
    }
  }, [gameData?.history]);

  return (
    <Chessboard
      squareStyles={squareStyles}
      onDrop={handleOnDrop}
      onSquareClick={handleSquareClick}
      position={gameData?.position}
      orientation={currentPlayerColor}
      draggable={gameData?.status === "started"}
      allowDrag={allowDrag}
      calcWidth={({ screenWidth }) => (screenWidth < 768 ? screenWidth - 60 : screenWidth / 2.7)}
    />
  );
};

export default Board;
