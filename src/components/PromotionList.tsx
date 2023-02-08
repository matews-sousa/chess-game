interface Props {
  handleChoosePromotion: (promotionValue: "b" | "n" | "r" | "q") => void;
  playerColor: "white" | "black";
}

const PromotionList = ({ handleChoosePromotion, playerColor }: Props) => {
  return (
    <div className="absolute top-0 inset-x-0 z-50 flex items-center justify-between bg-amber-500 h-[70px] px-10">
      {options.map((option) => (
        <button key={option.label} className="flex items-center" onClick={() => handleChoosePromotion(option.value)}>
          <img src={`/${playerColor[0]}_${option.value}.svg`} alt="" />
        </button>
      ))}
    </div>
  );
};

export default PromotionList;

const options: {
  value: "b" | "n" | "r" | "q";
  label: string;
}[] = [
  {
    value: "b",
    label: "Bishop",
  },
  {
    value: "n",
    label: "Knight",
  },
  {
    value: "r",
    label: "Rook",
  },
  {
    value: "q",
    label: "Queen",
  },
];
