import { Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const { signOut } = useAuth();

  return (
    <nav className="flex items-center justify-between px-6 md:px-24 py-4 border-b border-gray-400">
      <Link to="/" className="text-2xl font-bold">
        Chess.dev
      </Link>

      <ul className="flex items-center space-x-6">
        <li>
          <Link to="/">Home</Link>
        </li>
        <li>
          <button className="p-2 rounded-md bg-red-400 text-white font-semibold" onClick={signOut}>
            Sign Out
          </button>
        </li>
      </ul>
    </nav>
  );
};

export default Navbar;
