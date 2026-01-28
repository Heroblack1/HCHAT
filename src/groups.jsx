import React from "react";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const Groups = () => {
  const [groups, setGroups] = useState([]);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

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
        // console.log(response);
      })
      .catch((error) => {
        console.error(error);
        navigate("/login");
      });
  }, [navigate]);

  useEffect(() => {
    if (!menuOpen) return;

    const handleClickOutside = (event) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [menuOpen]);
  // get list of all groups function
  // get list of all groups function
  // get list of all groups function
  useEffect(() => {
    axios
      .get(`${API}/home/getGroups`)
      .then((response) => {
        const groups = response.data;
        const token = localStorage.getItem("token");
        axios
          .get(`${API}/home/dashboard`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((userResponse) => {
            const userId = userResponse.data.user._id;
            const filteredGroups = groups.filter((group) =>
              group.members.includes(userId)
            );
            console.log(groups);

            console.log(filteredGroups);
            setGroups(filteredGroups);
          });
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  // setting of the profile picture
  const handleChange = async (e) => {
    console.log(user); // Log the user object to see its structure and properties
    if (!user || !user._id) {
      console.error("User ID is not defined");
      return;
    }
    const file = e.target.files[0];
    setSelectedFile(URL.createObjectURL(file)); // for preview
    const formData = new FormData();
    formData.append("image", file);
    try {
      const response = await axios.put(`${API}/users/${user._id}`, formData);
      console.log("Updated user:", response.data);
    } catch (error) {
      console.error(error);
      if (error.response) {
        console.log(error.response.data);
        console.log(error.response.status);
        console.log(error.response.headers);
      } else {
        console.log(error.message);
      }
    }
  };

  return (
    <div className="bodyy1">
      <nav className="bard">
        <img src={logo} className="img" alt="" />
        <div className="circle">
          {/* {user.image ? (
            <img
              src={`http://localhost:5000${user.image}`}
              className="imgs"
              alt="Profile"
            />
          ) : ( */}
          <span className="material-symbols-outlined">photo_camera_front</span>
          {/* )} */}
        </div>
      </nav>

      <div className="threeDots">
        <div className="babaLink">
          <Link className="link" to={"/dashboard"}>
            Chats
          </Link>
          <Link className="link" to={"/dashboard/status"}>
            Status
          </Link>
          <Link className="link" to={"/dashboard/groups"}>
            Groups
          </Link>
          <Link className="link" to={"/dashboard/broadcasts"}>
            Broadcasts
          </Link>
        </div>
        <div className="menuContainer" ref={menuRef}>
          <button
            ref={buttonRef}
            className="button"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            <span className="material-symbols-outlined" id="whiteIcon">
              more_vert
            </span>
          </button>

          {menuOpen && (
            <section className="sett active">
              <div>
                <input type="file" id="file-input" onChange={handleChange} />
                <label htmlFor="file-input" className="file-label">
                  Profile picture
                </label>
              </div>
              <div>
                <Link className="link1" to={"/dashboard/newGroup"}>
                  New Group
                </Link>
              </div>
              <div>
                <Link className="link1" to={"/dashboard/newBroadcast"}>
                  New Broadcast
                </Link>
              </div>
              <div>
                <Link className="link1" to={"/dashboard/settings"}>
                  Settings
                </Link>
              </div>
            </section>
          )}
        </div>
      </div>

      <section className="baba">
        {groups.map((group) => (
          <Link
            className="bar"
            key={group._id}
            to="/dashboard/groupChat"
            state={{ group }}
          >
            <div className="users">
              <div className="circ">
                {/* You can add a group image here if available */}
              </div>
              <section className="nameAndMessage">
                <span className="orang">{group.name}</span>
                <span className="whi">Message sent successfully</span>
              </section>
            </div>
            <div className="timeAndNum">
              <div className="cir"></div>
            </div>
          </Link>
        ))}
      </section>

      <footer className="foot">
        <img src={logo} className="imgo" alt="" />
      </footer>
    </div>
  );
};

export default Groups;
