import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const ChatSettings = () => {
  const navigate = useNavigate();
  const API = import.meta.env.VITE_API_URL;

  // authenticating user otherwise known as protecting your route
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get(`${API}/home/dashboard`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        // console.log(response);
      })
      .catch((error) => {
        console.error(error);
        navigate("/login");
      });
  }, [navigate]);
  return (
    <div className="bodyy1">
      <div className="NoteBar">
        <div className="users1">
          <span class="material-symbols-outlined">arrow_back</span>
          <section className="nameAndMessage">
            <span className="orang">Chat Settings</span>
          </section>
        </div>
      </div>

      <div className="baripee">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="whitter">Chat settings</span>
          </section>
        </div>
      </div>
      <div className="baripp">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="orangoo">Enter is send</span>
            <span className="whitter">Enter key will send your message</span>
          </section>
        </div>
        <div className="timeAndNum">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="flexSwitchCheckDefault"
            />
          </div>
        </div>
      </div>

      <div className="baripp">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="orangoo">Media visibility</span>
            <span className="whitter">
              Show newly downloaded media in your phone's gallery
            </span>
          </section>
        </div>
        <div className="timeAndNum">
          <div class="form-check form-switch">
            <input
              class="form-check-input"
              type="checkbox"
              role="switch"
              id="flexSwitchCheckDefault"
            />
          </div>
        </div>
      </div>

      <div className="barisspe">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="orangoo">Font size</span>
            <span className="whitter">Medium</span>
          </section>
        </div>
      </div>

      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">backup</span>
          <section className="nameAndMessage">
            <span className="orang">Chat backup</span>
          </section>
        </div>
      </div>

      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">history</span>
          <section className="nameAndMessage">
            <span className="orang">History</span>
          </section>
        </div>
      </div>

      <footer className="foot">
        <img src={logo} className="imgo" alt="" />
      </footer>
    </div>
  );
};

export default ChatSettings;
