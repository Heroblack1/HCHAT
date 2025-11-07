import React from "react";
import { useState, useEffect } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Settings = () => {
  const [user, setUser] = useState({});

  const API = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();
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
        setUser(response.data.user);
        // console.log(response);
      })
      .catch((error) => {
        console.error(error);
        navigate("/login");
      });
  }, [navigate]);

  return (
    <div className="bodyy1">
      <div className="bart">
        <span className="whii">Settings</span>

        <div className="timeAndNum">
          <span class="material-symbols-outlined">search</span>
        </div>
      </div>

      <div className="bara">
        <div className="users">
          <div className="circ">
            <img className="imgs" src={`${API}${user.image}`} />
          </div>
          <section className="nameAndMessage">
            <span className="orang">{user.nickName}</span>
            <span className="whi">Your message has been sent</span>
          </section>
        </div>
      </div>

      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">light_mode</span>
          <section className="nameAndMessage">
            <span className="orang">Light mode</span>
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

      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">account_box</span>
          <section className="nameAndMessage">
            <span className="orang">Account</span>
          </section>
        </div>
        <div className="timeAndNum">
          <div class="form-check form-switch">
            <span class="material-symbols-outlined">arrow_forward_ios</span>
          </div>
        </div>
      </div>

      <Link className="bar" to={"/dashboard/settings/notifications"}>
        <div className="users1">
          <span class="material-symbols-outlined">notifications</span>
          <section className="nameAndMessage">
            <span className="orang">Notification</span>
          </section>
        </div>
        <div className="timeAndNum">
          <div class="form-check form-switch">
            <span class="material-symbols-outlined">arrow_forward_ios</span>
          </div>
        </div>
      </Link>

      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">chat_bubble</span>
          <section className="nameAndMessage">
            <span className="orang">Chat Settings</span>
          </section>
        </div>
        <div className="timeAndNum">
          <div class="form-check form-switch">
            <span class="material-symbols-outlined">arrow_forward_ios</span>
          </div>
        </div>
      </div>

      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">storage</span>
          <section className="nameAndMessage">
            <span className="orang">Data and storage</span>
          </section>
        </div>
        <div className="timeAndNum">
          <div class="form-check form-switch">
            <span class="material-symbols-outlined">arrow_forward_ios</span>
          </div>
        </div>
      </div>

      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">lock</span>
          <section className="nameAndMessage">
            <span className="orang">Privacy</span>
          </section>
        </div>
        <div className="timeAndNum">
          <div class="form-check form-switch">
            <span class="material-symbols-outlined">arrow_forward_ios</span>
          </div>
        </div>
      </div>

      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">info</span>
          <section className="nameAndMessage">
            <span className="orang">About</span>
          </section>
        </div>
      </div>
    </div>
  );
};

export default Settings;
