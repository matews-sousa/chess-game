import { FaChessBishop, FaChessKnight, FaChessRook, FaChessQueen } from "react-icons/fa";

interface Props {
  handleChoosePromotion: (promotionValue: "b" | "n" | "r" | "q") => void;
}

const PromotionList = ({ handleChoosePromotion }: Props) => {
  return (
    <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between bg-yellow-600 h-20 px-10">
      {options.map((option) => (
        <button key={option.label} className="flex items-center" onClick={() => handleChoosePromotion(option.value)}>
          <option.icon className="h-10 w-10" />
        </button>
      ))}
    </div>
  );
};

export default PromotionList;

const options: {
  value: "b" | "n" | "r" | "q";
  label: string;
  icon: React.FC<React.SVGProps<SVGSVGElement>>;
}[] = [
  {
    value: "b",
    label: "Bishop",
    icon: FaChessBishop,
  },
  {
    value: "n",
    label: "Knight",
    icon: FaChessKnight,
  },
  {
    value: "r",
    label: "Rook",
    icon: FaChessRook,
  },
  {
    value: "q",
    label: "Queen",
    icon: FaChessQueen,
  },
];
