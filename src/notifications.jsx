import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Notifications = () => {
  const navigate = useNavigate();
  // authenticating user otherwise known as protecting your route
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:5000/home/dashboard", {
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
            <span className="orang">Notification</span>
          </section>
        </div>
      </div>

      <div className="barip">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="orangoo">Conversation tones</span>
            <span className="whitter">
              Play sounds for incoming and outgoing messages
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

      <div className="baripe">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="whitter">Messages</span>
            <span className="orangoo">Notification tone</span>
            <span className="whitter">Default (skyline)</span>
            <span className="orangoo">Vibrate</span>
            <span className="whitter">Default</span>
            <span className="orangoo">Popup Notification</span>
            <span className="whitter">No Popup</span>
            <span className="orangoo">Light</span>
            <span className="whitter">Dark</span>
          </section>
        </div>
      </div>

      <div className="baripp">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="orangoo">Conversation tones</span>
            <span className="whitter">
              Show previews of notifications at the top of the screen
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

      <div className="baripe">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="whitter">Groups</span>
            <span className="orangoo">Notification tone</span>
            <span className="whitter">Default (skyline)</span>
            <span className="orangoo">Vibrate</span>
            <span className="whitter">Default</span>
            <span className="orangoo">Popup Notification</span>
            <span className="whitter">No Popup</span>
            <span className="orangoo">Light</span>
            <span className="whitter">Dark</span>
          </section>
        </div>
      </div>

      <div className="baripp">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="orangoo">Conversation tones</span>
            <span className="whitter">
              Show previews of notifications at the top of the screen
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

      <div className="barispe">
        <div className="users1">
          <section className="nameAndMessage">
            <span className="whitter">Calls</span>
            <span className="orangoo">Ringtone</span>
            <span className="whitter">Default (skyline)</span>
            <span className="orangoo">Vibrate</span>
            <span className="whitter">Default</span>
          </section>
        </div>
      </div>
      <footer className="foot">
        <img src={logo} className="imgo" alt="" />
      </footer>
    </div>
  );
};

export default Notifications;
