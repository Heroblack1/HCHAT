import { useState, useEffect, useRef } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";

function Dashboard() {
  const [user, setUser] = useState({});
  const [list, setList] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);
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
        setUser(response.data.user);
      })
      .catch((error) => {
        console.error(error);
        navigate("/login");
      });
  }, [navigate]);

  // setting of the profile picture
  // setting of the profile picture
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

  if (!user) {
    return <p>Loading...</p>;
  }

  // searching for users to add to group
  // searching for users to add to group
  // searching for users to add to group
  const handleChangee = (e) => {
    setSearch(e.target.value);
    console.log(search);
    console.log(list);
  };

  // matching the searh with the user names
  // matching the searh with the user names
  // matching the searh with the user names
  const filteredUsers = list.filter((us) => {
    return (
      us &&
      us.nickName &&
      us.nickName.toLowerCase().includes(search.toLowerCase())
    );
  });

  // getting the list of users from the data base
  useEffect(() => {
    axios
      .get(`${API}/home/getUsers`)
      .then((response) => {
        setList(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  useEffect(() => {
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
  }, []);

  return (
    <div className="bodyy1">
      <nav className="bard">
        <img src={logo} className="img" alt="" />
        <div className="circle">
          {user.image ? (
            <img src={`${API}${user.image}`} className="imgs" alt="Profile" />
          ) : (
            <span className="material-symbols-outlined">
              photo_camera_front
            </span>
          )}
        </div>
      </nav>

      <section className="baba">
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
        {/* <div className="bar">
          <div className="users">
            <div className="circ">
              <img
                src={`${API}${user.image}`}
                className="imgs"
              />
            </div>
            <section className="nameAndMessage">
              <span className="orang">{user.nickName}</span>
              <span className="whi">Your message has been sent</span>
            </section>
          </div>
          <div className="timeAndNum">
            <span className="whit">{user._id}</span>
            <div className="cir">1</div>
          </div>
        </div> */}

        <input
          type="search"
          placeholder="Search Participants..."
          className="line"
          value={search}
          onChange={handleChangee}
        />

        {search.length > 0 ? (
          filteredUsers.length > 0 ? (
            <div>
              {filteredUsers.map((use) => (
                <div className="bar" key={use._id}>
                  <div className="users1">
                    <div className="circ">
                      <img src={`${API}${use.image}`} className="imgs" />
                    </div>
                    <section className="nameAndMessage1">
                      <span className="orang">{use.nickName}</span>
                    </section>
                  </div>
                  <div className="nameAndMessage1">
                    <button
                      className={`user-btn ${
                        group[use._id] ? "remove-btn" : "add-btn"
                      }`}
                      onClick={() => handleAdd(use)}
                    >
                      {group[use._id] ? "Remove User" : "Add User"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No users found.</p>
          )
        ) : null}

        {list
          .filter((use) => use._id !== user._id)
          .map((use) => (
            <Link
              className="bar"
              key={use._id}
              to={"/dashboard/chat"}
              state={use}
            >
              <div className="users">
                <div className="circ">
                  {use.image ? (
                    <img
                      src={`${API}${use.image}`}
                      className="imgs"
                      alt="Profile"
                    />
                  ) : (
                    <span className="material-symbols-outlined">
                      photo_camera_front
                    </span>
                  )}
                </div>
                <section className="nameAndMessage">
                  <span className="orang">{use.nickName}</span>
                  <span className="whi">Your message has been sent</span>
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
}

export default Dashboard;
