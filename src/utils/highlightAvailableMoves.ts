import { Square } from "chess.js";

const highlightAvailableMoves = (availableMoves: Square[]) => {
  const styles = availableMoves.reduce((acc, move) => {
    acc[move] = {
      background: "radial-gradient(circle, #fffc00 36%, transparent 40%)",
      borderRadius: "50%",
    };
    return acc;
  }, {} as { [key: string]: React.CSSProperties });

  return styles;
};

export default highlightAvailableMoves;
