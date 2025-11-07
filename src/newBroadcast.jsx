import { useState } from "react";
import { useEffect } from "react";
import logo from "./assets/logo.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NewBroadcast = () => {
  const [user, setUser] = useState({});
  const [broadcast, setBroadcast] = useState({});
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [broadcastName, setBroadcastName] = useState("");
  const [broadcastDescription, setBroadcastDescription] = useState("");
  const [broadcastNameError, setBroadcastNameError] = useState("");

  const API = import.meta.env.VITE_API_URL;

  const handleBroadcastNameChange = (e) => {
    setBroadcastName(e.target.value);
  };

  const handleBroadcastDescriptionChange = (e) => {
    setBroadcastDescription(e.target.value);
  };

  const navigate = useNavigate();

  // function to check if the user has been authenticated
  // function to check if the user has been authenticated
  // function to check if the user has been authenticated

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

  // get list of all users function
  // get list of all users function
  // get list of all users function
  useEffect(() => {
    axios
      .get(`${API}/home/getUsers`)
      .then((response) => {
        console.log(response.data);
        setList(response.data);
      })
      .catch((error) => {
        console.error(error);
      });
  }, []);

  // searching for users to add to group
  // searching for users to add to group
  // searching for users to add to group
  const handleChange = (e) => {
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

  // function to add users to a group object
  // function to add users to a group object
  // function to add users to a group object
  const handleAdd = (use) => {
    setBroadcast((prevBroadcast) => ({
      ...prevBroadcast,
      [use._id]: use,
    }));
  };

  const handleRemove = (userId) => {
    setBroadcast((prevBroadcast) => {
      const updated = { ...prevBroadcast };
      delete updated[userId];
      return updated;
    });
  };

  // logging the group object anytime it changes
  useEffect(() => {
    console.log("Broadcast length:", Object.keys(broadcast).length);
  }, [broadcast]);

  // sending group data to the database
  // sending group data to the database
  // sending group data to the database

  const createBroadcast = async () => {
    if (!broadcastName.trim()) {
      alert("Broadcast name is required");
      return;
    }

    if (Object.keys(broadcast).length === 0) {
      alert("Please add broadcast members before creating the broadcast");
      return;
    }

    try {
      const broadcastData = {
        name: broadcastName,
        description: broadcastDescription,
        members: Object.values(broadcast),
      };

      const endPoint = `${API}/home/dashboard/newBroadcast`;
      const response = await axios.post(endPoint, broadcastData);

      if (response.data.status === "success" || response.status === 200) {
        alert("Broadcast created successfully!");
        setBroadcastName("");
        setBroadcastDescription("");
        setBroadcast({});
      } else {
        alert("Failed to create broadcast. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while creating the broadcast.");
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        window.dropdownRef &&
        !window.dropdownRef.contains(event.target) &&
        !event.target.closest(".dropdown-toggle")
      ) {
        window.dropdownRef.classList.remove("show");
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, []);

  return (
    <div className="bodyy1">
      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">arrow_back</span>
          <section className="nameAndMessage">
            <span className="orang">New Broadcast</span>
            <span className="whi">Add participants</span>
          </section>
        </div>
        <div className="timeAndNum">
          <span class="material-symbols-outlined">search</span>
        </div>
      </div>

      <section className="bar">
        <input
          type="search"
          placeholder="Search Participants..."
          className="line"
          value={search}
          onChange={handleChange}
        />

        <div class="dropdown">
          <a
            id="bbbb"
            class="btn btn-secondary dropdown-toggle"
            href="#"
            role="button"
            data-bs-toggle="dropdown"
            aria-expanded="false"
          >
            Added members
          </a>

          <div
            className="dropdown-menu show"
            ref={(el) => (window.dropdownRef = el)}
            onClick={(e) => e.stopPropagation()}
          >
            {Object.values(broadcast).map((member) => (
              <div id="baro" key={member._id} class="dropdown-item" href="#">
                <div className="users1">
                  <div className="circ1">
                    <img src={`${API}${member.image}`} className="imgs" />
                  </div>
                  <section className="nameAndMessage1">
                    <span className="orango">{member.nickName}</span>
                  </section>
                </div>
                <div className="nameAndMessage1">
                  <button
                    className="upx"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRemove(member._id);
                    }}
                  >
                    Remove User
                  </button>
                </div>
              </div>
            ))}
            <div id="baroo">
              <input
                type="text"
                placeholder="group name"
                className="liner"
                value={broadcastName}
                onChange={handleBroadcastNameChange}
              />
              {broadcastNameError && (
                <p style={{ color: "red" }}>{broadcastNameError}</p>
              )}
              <input
                type="text"
                placeholder="group description"
                className="liner"
                value={broadcastDescription}
                onChange={handleBroadcastDescriptionChange}
              />
              <button className="upx" onClick={createBroadcast}>
                create group
              </button>
            </div>
          </div>
        </div>
      </section>

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
                    className={`upx ${broadcast[use._id] ? "remove" : "add"}`}
                    onClick={() =>
                      broadcast[use._id]
                        ? handleRemove(use._id)
                        : handleAdd(use)
                    }
                  >
                    {broadcast[use._id] ? "Remove User" : "Add User"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p>No users found.</p>
        )
      ) : null}

      {list.map((use) => (
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
              className={`upx ${broadcast[use._id] ? "remove" : "add"}`}
              onClick={() =>
                broadcast[use._id] ? handleRemove(use._id) : handleAdd(use)
              }
            >
              {broadcast[use._id] ? "Remove User" : "Add User"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default NewBroadcast;
