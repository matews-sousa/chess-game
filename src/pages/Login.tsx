import React from "react";
import { Navigate, Link } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const { currentUser, signIn } = useAuth();

  const handleSignIn = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await signIn(email, password);
  };

  if (currentUser) {
    return <Navigate to="/" />;
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-200 px-2">
      <form onSubmit={handleSignIn} className="bg-white flex flex-col p-6 rounded-md shadow max-w-lg w-full space-y-4">
        <h1 className="text-4xl font-bold mb-6">Login</h1>
        <div className="flex flex-col space-y-2">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            name="email"
            id="email"
            className="border border-gray-400 rounded-md px-2 py-3"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="flex flex-col space-y-2">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            name="password"
            id="password"
            className="border border-gray-400 rounded-md px-2 py-3"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        <button
          type="submit"
          className="mt-2 bg-green-500 hover:bg-green-600 rounded-md px-2 py-3 text-white font-semibold"
        >
          Login
        </button>
        <p className="text-center">
          <span>Don't have an account yet?</span>{" "}
          <Link to="/sign-up" className="text-blue-400 hover:text-blue-500 underline">
            Sign Up
          </Link>
        </p>
      </form>
    </div>
  );
};

export default Login;
