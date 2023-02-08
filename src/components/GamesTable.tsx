import React from "react";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  games: Game[];
}

const GamesTable = ({ games }: Props) => {
  const { currentUser } = useAuth();

  return (
    <table className="w-full text-sm text-left">
      <thead className="text-xs uppercase bg-gray-50 ">
        <tr className="">
          <th className="text-left px-6 py-3" scope="col">
            Players
          </th>
          <th className="text-left px-6 py-3" scope="col">
            Result
          </th>
          <th className="text-left px-6 py-3" scope="col">
            Date
          </th>
          <th className="text-left px-6 py-3" scope="col">
            Moves
          </th>
        </tr>
      </thead>
      <tbody className="">
        {games.map((game) => {
          const whitePlayer = game.players.find((player) => player.color === "white");
          const blackPlayer = game.players.find((player) => player.color === "black");
          const currentUserPlayer = game.players.find((player) => player.id === currentUser?.id);

          return (
            <tr key={game.uuid} className="bg-white border-b">
              <td className="px-6 py-4">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-6 w-6 bg-white rounded-full border-4 border-gray-500 ${
                      game.winner === "white" && "border-green-500"
                    }`}
                  ></div>
                  <div>{whitePlayer?.name}</div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <div
                    className={`h-6 w-6 bg-black rounded-full border-4 border-gray-500 ${
                      game.winner === "black" && "border-green-500"
                    }`}
                  ></div>
                  <div>{blackPlayer?.name}</div>
                </div>
              </td>
              <td className="px-6 py-4 flex items-center gap-4">
                <div className="space-y-2">
                  <p>{game.winner === "white" ? 1 : 0}</p>
                  <p>{game.winner === "black" ? 1 : 0}</p>
                </div>
                <div>
                  {game.winner === null ? (
                    <span className="text-gray-700 font-semibold p-2 bg-gray-200 rounded-md">Draw</span>
                  ) : currentUserPlayer?.color === game.winner ? (
                    <span className="text-green-500 font-semibold p-2 bg-gray-200 rounded-md">You won!</span>
                  ) : (
                    <span className="text-red-500 font-semibold p-2 bg-gray-200 rounded-md">You lost!</span>
                  )}
                </div>
              </td>
              <td className="px-6 py-4">
                {new Date(game.created_at).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </td>
              <td className="px-6 py-4">{game.history?.length}</td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
};

export default GamesTable;
