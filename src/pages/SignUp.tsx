import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const SignUp = () => {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [password, setPassword] = useState("");
  const { currentUser, signUp } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmitting(true);
    if (!email || !password || !firstName) return;

    await signUp(email, password, firstName);
    setIsSubmitting(false);
  };

  if (currentUser) {
    return <Navigate to="/" />;
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center justify-center bg-gray-200 px-2">
      <form onSubmit={handleSignUp} className="bg-white flex flex-col p-6 rounded-md shadow max-w-lg w-full space-y-4">
        <h1 className="text-4xl font-bold mb-6">Sign Up</h1>
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
          <label htmlFor="firstName">Name</label>
          <input
            type="text"
            name="fistName"
            id="firstName"
            className="border border-gray-400 rounded-md px-2 py-3"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
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
          className="mt-2 bg-green-500 hover:bg-green-600 rounded-md px-2 py-3 text-white font-semibold disabled:opacity-75 disabled:cursor-default"
          disabled={isSubmitting}
        >
          Sign Up
        </button>
        <p className="text-center">
          <span>Already have an account?</span>{" "}
          <Link to="/login" className="text-blue-400 hover:text-blue-500 underline">
            Login
          </Link>
        </p>
      </form>
    </div>
  );
};

export default SignUp;
