import { Chess, Square } from "chess.js";
import Chessboard from "chessboardjsx";
import { useState } from "react";

const chess = new Chess();

function App() {
  const [gameState, setGameState] = useState({
    position: chess.fen(),
    pgn: "",
    isGameOver: chess.isGameOver(),
    checkmate: chess.isCheckmate(),
    stalemate: chess.isStalemate(),
    draw: chess.isDraw(),
  });

  const handleOnDrop = ({ sourceSquare, targetSquare }: { sourceSquare: Square; targetSquare: Square }) => {
    if (sourceSquare === targetSquare) return;
    try {
      const move = chess.move({
        from: sourceSquare,
        to: targetSquare,
        promotion: "n",
      });
      setGameState((prev) => ({
        ...prev,
        pgn: chess.pgn(),
        position: chess.fen(),
        isGameOver: chess.isGameOver(),
        checkmate: chess.isCheckmate(),
        stalemate: chess.isStalemate(),
        draw: chess.isDraw(),
      }));
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="h-screen w-screen flex items-center justify-center">
      <Chessboard position={gameState.position} draggable={!gameState.isGameOver} onDrop={handleOnDrop} />
    </div>
  );
}

export default App;
