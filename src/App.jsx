import { useEffect, useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "/vite.svg";
import "./App.css";
import Home from "./home";
import { Route, Routes } from "react-router-dom";
import Getstarted from "./getStarted";
import SuccessOrFail from "./successOrFail";
import Login from "./login";
import Dashboard from "./dashboard";
import { Navigate } from "react-router-dom";
import NewGroup from "./newGroup";
import NewBroadcast from "./newBroadcast";
import "bootstrap/dist/js/bootstrap.bundle.min.js";
import "bootstrap/dist/css/bootstrap.min.css";
import Groups from "./groups";
import Status from "./status";
import Broadcasts from "./broadcasts";
import Settings from "./settings";
import Notifications from "./notifications";
import ChatSettings from "./chatSettings";
import Chat from "./chat";
import GroupChat from "./groupChat";
import BroadcastChat from "./broadcastChat";
import { useRef } from "react";
import socketClient from "socket.io-client";

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem("token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const API = import.meta.env.VITE_API_URL;

// connecting socketClient.io
// connecting socketClient.io
// connecting socketClient.io

function App() {
  const [socketReady, setSocketReady] = useState(false);
  const [count, setCount] = useState(0);
  const socket = useRef(null);

  useEffect(() => {
    socket.current = socketClient(API);

    socket.current.on("connect", () => {
      console.log("socket connected");
      setSocketReady(true); // <-- triggers rerender
    });

    return () => {
      socket.current.disconnect();
    };
  }, []);

  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/getStarted" element={<Getstarted />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/newGroup"
          element={
            <ProtectedRoute>
              <NewGroup />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/chat"
          element={
            <ProtectedRoute>
              {socketReady ? (
                <Chat socket={socket} />
              ) : (
                <div>Connecting...</div>
              )}
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/groupChat"
          element={
            <ProtectedRoute>
              <GroupChat socket={socket} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/broadcastChat"
          element={
            <ProtectedRoute>
              <BroadcastChat socket={socket} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/newBroadcast"
          element={
            <ProtectedRoute>
              <NewBroadcast />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/groups"
          element={
            <ProtectedRoute>
              <Groups />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/status"
          element={
            <ProtectedRoute>
              <Status />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/broadcasts"
          element={
            <ProtectedRoute>
              <Broadcasts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard/settings/chatSettings"
          element={
            <ProtectedRoute>
              <ChatSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/getStarted/successOrFail/:message"
          element={<SuccessOrFail />}
        />
      </Routes>
    </>
  );
}

export default App;
