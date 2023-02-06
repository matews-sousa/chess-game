import { Chess, Square } from "chess.js";
import Chessboard from "chessboardjsx";
import { useEffect, useState } from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes, useParams } from "react-router-dom";
import AuthProvider, { useAuth } from "./contexts/AuthContext";
import { GameProvider } from "./contexts/GameContext";
import Game from "./pages/Game";
import Home from "./pages/Home";
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";

const ProtectedRoute = () => {
  const { currentUser } = useAuth();

  return !currentUser ? <Navigate to="/login" /> : <Outlet />;
};

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/sign-up" element={<SignUp />} />
            <Route path="/" element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/:uuid" element={<Game />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </GameProvider>
    </AuthProvider>
  );
}

export default App;
