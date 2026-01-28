import { useState } from "react";
import { useEffect } from "react";
import logo from "./assets/logo.png";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const NewGroup = () => {
  const [user, setUser] = useState({});
  const [group, setGroup] = useState({});
  const [list, setList] = useState([]);
  const [search, setSearch] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [groupNameError, setGroupNameError] = useState("");

  const API = import.meta.env.VITE_API_URL;

  const handleGroupNameChange = (e) => {
    setGroupName(e.target.value);
  };

  const handleGroupDescriptionChange = (e) => {
    setGroupDescription(e.target.value);
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
  // getting the list of users from the data base
  useEffect(() => {
    if (!user?._id) return;

    axios
      .get(`${API}/home/getUsers/${user._id}`)
      .then((response) => {
        setList(response.data);
      })
      .catch((error) => {
        console.error("User fetch error:", error);
      });
  }, [user]); // ✅ runs only when user loads

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
  // useEffect(() => {
  //   axios
  //     .get(`${API}/home/getUsers`)
  //     .then((response) => {
  //       console.log(response.data);
  //       setList(response.data);
  //     })
  //     .catch((error) => {
  //       console.error(error);
  //     });
  // }, []);

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
    setGroup((prevGroup) => {
      const isUserInGroup = prevGroup[use._id];
      if (isUserInGroup) {
        // Remove user if already in group
        const updatedGroup = { ...prevGroup };
        delete updatedGroup[use._id];
        return updatedGroup;
      } else {
        // Add user
        return { ...prevGroup, [use._id]: use };
      }
    });
  };
  // logging the group object anytime it changes
  useEffect(() => {
    console.log("Group length:", Object.keys(group).length);
  }, [group]);

  // sending group data to the database
  // sending group data to the database
  // sending group data to the database

  const createGroup = async () => {
    if (!groupName.trim()) {
      alert("Group name is required");
      return;
    }

    if (Object.keys(group).length === 0) {
      alert("Please add group members before creating the group");
      return;
    }

    try {
      const groupData = {
        name: groupName,
        description: groupDescription,
        members: Object.values(group),
      };

      const endPoint = `${API}/home/dashboard/newGroup`;
      const response = await axios.post(endPoint, groupData);

      if (response.data.status === "success" || response.status === 200) {
        alert("Group created successfully!");
        // optional: reset fields
        setGroupName("");
        setGroupDescription("");
        setGroup({});
      } else {
        alert("Failed to create group. Please try again.");
      }
    } catch (error) {
      console.error(error);
      alert("An error occurred while creating the group.");
    }
  };

  return (
    <div className="bodyy1">
      <div className="bar">
        <div className="users1">
          <span class="material-symbols-outlined">arrow_back</span>
          <section className="nameAndMessage">
            <span className="orang">New Group</span>
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

          <div class="dropdown-menu" data-bs-auto-close="outside">
            {Object.values(group).map((member) => (
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
                    className="user-btn remove-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAdd(member);
                    }}
                  >
                    <span class="material-symbols-outlined">delete</span>
                  </button>
                </div>
              </div>
            ))}
            <div id="baroo">
              <input
                type="text"
                placeholder="group name"
                className="liner"
                value={groupName}
                onChange={handleGroupNameChange}
              />
              {groupNameError && (
                <p style={{ color: "red" }}>{groupNameError}</p>
              )}
              <input
                type="text"
                placeholder="group description"
                className="liner"
                value={groupDescription}
                onChange={handleGroupDescriptionChange}
              />
              <button className="upx" onClick={createGroup}>
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
  );
};

export default NewGroup;
