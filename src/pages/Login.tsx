import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const { currentUser, loading, signIn } = useAuth();
  console.log(currentUser);

  const handleSignUp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await signIn(email, password);
  };

  if (currentUser) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <h1>Login</h1>
      <form onSubmit={handleSignUp}>
        <label htmlFor="email">Email</label>
        <input type="email" name="email" id="email" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit">Login</button>
      </form>
    </div>
  );
};

export default Login;
