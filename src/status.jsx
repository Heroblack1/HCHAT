import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";

const Status = () => {
  const [user, setUser] = useState({});
  const [showOptions, setShowOptions] = useState(false);

  // === Status data states ===
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [textStatus, setTextStatus] = useState("");
  const [capturedImage, setCapturedImage] = useState(null);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioUrl, setAudioUrl] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const [menuOpen, setMenuOpen] = useState(false);

  // === Overlays ===
  const [showTextField, setShowTextField] = useState(false);
  const [showVoiceOverlay, setShowVoiceOverlay] = useState(false);
  const [showCameraOverlay, setShowCameraOverlay] = useState(false);
  const [showFileOverlay, setShowFileOverlay] = useState(false);

  // === Upload ===
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // === Camera & Voice Refs ===
  const [useFrontCamera, setUseFrontCamera] = useState(true);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const [videoStream, setVideoStream] = useState(null);

  const navigate = useNavigate();

  const [showStatusViewer, setShowStatusViewer] = useState(false);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const statusTimerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const [viewerStatuses, setViewerStatuses] = useState([]);

  // Trigger viewer when user clicks ring
  const handleOpenStatusViewer = () => {
    if (userStatuses.length === 0) return;
    setShowStatusViewer(true);
    setCurrentStatusIndex(0);
  };

  // Called when timer or playback ends
  const handleStatusEnd = () => {
    if (currentStatusIndex < userStatuses.length - 1) {
      setCurrentStatusIndex((prev) => prev + 1);
    } else {
      // Last status → close viewer
      setShowStatusViewer(false);
    }
  };

  // Clean up timer
  useEffect(() => {
    return () => clearTimeout(statusTimerRef.current);
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
      const response = await axios.put(
        `http://localhost:5000/users/${user._id}`,
        formData
      );
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

  // === Authenticate user ===
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return navigate("/login");

    axios
      .get("http://localhost:5000/home/dashboard", {
        headers: { Authorization: `Bearer ${token}` },
      })
      .then((res) => {
        const fetchedUser = res.data.user;
        setUser(fetchedUser);
        localStorage.setItem("user", JSON.stringify(fetchedUser));

        console.log("Fetched user ID:", fetchedUser.nickName); // ✅ this now works
      })
      .catch(() => navigate("/login"));
  }, [navigate]);

  // getting status from db
  // === Fetch statuses from DB ===
  const [statuses, setStatuses] = useState([]);

  useEffect(() => {
    const fetchStatuses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          "http://localhost:5000/home/dashboard/getStatuses",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (res.data.success) {
          console.log("Fetched statuses:", res.data.statuses);
          setStatuses(res.data.statuses);
          console.log("Sample status object:", res.data.statuses[0]);
        }
      } catch (err) {
        console.error("Error fetching statuses:", err);
      }
    };

    // ✅ Only fetch when user is loaded
    if (user && user._id) {
      fetchStatuses();
    }
  }, [user]);
  // === Helpers ===
  const toggleOptions = () => setShowOptions(!showOptions);

  const toBase64 = (fileOrBlob) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(fileOrBlob);
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
    });

  const resetAllStates = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setTextStatus("");
    setCapturedImage(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setShowTextField(false);
    setShowVoiceOverlay(false);
    setShowCameraOverlay(false);
    setShowFileOverlay(false);
    setUploading(false);
    setUploadProgress(0);
  };

  // close status viewer click
  const closeStatusViewer = () => {
    setShowStatusViewer(false);
    setCurrentStatusIndex(0);
  };
  // === Upload Handler ===
  const handleUpload = async (type) => {
    try {
      setUploading(true);
      setUploadProgress(0);

      const token = localStorage.getItem("token");
      const user = JSON.parse(localStorage.getItem("user")); // 👈 get user object from storage

      if (!user?._id) {
        alert("User not found. Please log in again.");
        setUploading(false);
        return;
      }

      let payload = {
        type,
        userId: user._id,
        userName:
          user.nickName ||
          user.username ||
          user.name ||
          user.fullName ||
          "Unknown",
      };

      if (type === "text") {
        payload.text = textStatus;
      } else if (type === "file" && selectedFile) {
        payload.file = await toBase64(selectedFile);
      } else if (type === "voice" && audioBlob) {
        payload.voice = await toBase64(audioBlob);
      } else if (type === "camera" && capturedImage) {
        payload.image = capturedImage;
      }

      await axios.post("http://localhost:5000/home/dashboard/status", payload, {
        headers: { Authorization: `Bearer ${token}` },
        onUploadProgress: (e) => {
          if (e.total) {
            const progress = Math.round((e.loaded * 100) / e.total);
            setUploadProgress(progress);
          }
        },
      });

      alert("Status uploaded successfully!");
      resetAllStates();

      // ✅ Re-fetch immediately after upload
      const tokenn = localStorage.getItem("token");
      const res = await axios.get(
        "http://localhost:5000/home/dashboard/getStatuses",
        {
          headers: { Authorization: `Bearer ${tokenn}` },
        }
      );
      if (res.data.success) {
        setStatuses(res.data.statuses);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert("Upload failed.");
    } finally {
      setUploading(false);
    }
  };
  // === File Handlers ===
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setFilePreview(URL.createObjectURL(file));
      setShowOptions(false);
      setShowFileOverlay(true);
    }
  };

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

  // === Voice Recording ===
  const handleVoiceClick = () => {
    setShowVoiceOverlay(true);
    setShowOptions(false);
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const url = URL.createObjectURL(blob);
        setAudioBlob(blob);
        setAudioUrl(url);
      };

      recorder.start();
      setIsRecording(true);
    } catch {
      alert("Microphone access denied.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current.stop();
    setIsRecording(false);
  };

  const closeVoiceOverlay = () => {
    setShowVoiceOverlay(false);
    setAudioBlob(null);
    setAudioUrl(null);
  };

  // === Camera Logic ===
  const handleCameraClick = () => {
    setShowCameraOverlay(true);
    setShowOptions(false);
    startCamera();
  };

  const startCamera = async () => {
    try {
      const constraints = {
        video: { facingMode: useFrontCamera ? "user" : "environment" },
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      setVideoStream(stream);
      if (videoRef.current) videoRef.current.srcObject = stream;
    } catch {
      alert("Camera access denied.");
    }
  };

  const flipCamera = () => {
    if (videoStream) videoStream.getTracks().forEach((t) => t.stop());
    setUseFrontCamera((prev) => !prev);
  };

  useEffect(() => {
    if (showCameraOverlay) startCamera();
  }, [useFrontCamera]);

  const captureImage = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const image = canvas.toDataURL("image/png");
    setCapturedImage(image);
  };

  const closeCameraOverlay = () => {
    if (videoStream) videoStream.getTracks().forEach((t) => t.stop());
    setVideoStream(null);
    setShowCameraOverlay(false);
  };
  // === Filter user's own statuses ===
  const userStatuses = React.useMemo(() => {
    if (!user?.nickName || !statuses?.length) return [];

    return statuses.filter(
      (status) => status.userName?.toLowerCase() === user.nickName.toLowerCase()
    );
  }, [statuses, user]);

  // === STATUS VIEWER LOGIC ===
  // === STATUS VIEWER LOGIC ===
  const [isLoaded, setIsLoaded] = useState(false);
  const progressRef = useRef(null);
  const [showViewer, setShowViewer] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewerProgress, setViewerProgress] = useState(0);
  const progressTimerRef = useRef(null);

  const currentStatus = viewerStatuses[currentIndex] || null;

  // ✅ Open viewer
  const handleStatusClick = () => {
    if (userStatuses.length === 0) {
      alert("No statuses to show.");
      return;
    }
    setViewerStatuses(userStatuses); // 👈 Ensure current user's statuses are loaded
    setShowViewer(true);
    setCurrentIndex(0);
    setViewerProgress(0);
    startProgress();
  };
  const handleNextStatus = () => {
    clearInterval(progressTimerRef.current);

    if (currentIndex + 1 < viewerStatuses.length) {
      setCurrentIndex((prev) => prev + 1);
      setViewerProgress(0);
      startProgress();
    } else {
      // ✅ When last status is done, close viewer
      setShowViewer(false);
      setViewerProgress(0);
    }
  };

  const handlePrevStatus = () => {
    clearInterval(progressTimerRef.current);

    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setViewerProgress(0);
      startProgress();
    } else {
      // optional: wrap to last status
      setCurrentIndex(viewerStatuses.length - 1);
      setViewerProgress(0);
      startProgress();
    }
  };
  // ✅ Start progress bar
  const startProgress = () => {
    clearInterval(progressTimerRef.current);
    const duration = 10000; // 10 seconds per status
    const start = Date.now();

    progressTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const progress = Math.min((elapsed / duration) * 100, 100);
      setViewerProgress(progress);

      if (progress >= 100) {
        handleNextStatus();
      }
    }, 100);
  };

  // ✅ Close viewer
  const closeViewer = () => {
    clearInterval(progressTimerRef.current);
    setShowViewer(false);
    setViewerProgress(0);
    setCurrentIndex(0);
  };

  // ✅ Cleanup
  useEffect(() => {
    return () => clearInterval(progressTimerRef.current);
  }, []);

  // === Other users who have posted statuses ===
  const otherUsers = React.useMemo(() => {
    if (!statuses?.length || !user?._id) return [];

    const unique = {};
    statuses.forEach((status) => {
      const id =
        status.userId?._id ||
        status.userId ||
        status.user?._id ||
        status.user ||
        null;

      if (id && String(id) !== String(user._id) && !unique[id]) {
        unique[id] = {
          id,
          username:
            status.userName || // ✅ your backend field
            status.userId?.username ||
            status.user?.username ||
            status.user?.name ||
            "Unknown",
          image:
            status.userId?.image ||
            status.user?.image ||
            "/default-profile.png",
          lastUpdated: status.createdAt,
        };
      }
    });

    return Object.values(unique);
  }, [statuses, user]);

  // 🔹 Helper: get statuses for a specific user
  const getUserStatuses = (userId) => {
    return statuses.filter((s) => {
      const id = s.userId?._id || s.userId || s.user?._id || s.user || null;
      return String(id) === String(userId);
    });
  };

  // 🔹 Filter by username (case-insensitive)
  const getStatusesByUsername = (username) => {
    if (!username || !statuses?.length) return [];
    return statuses.filter(
      (status) => status.userName?.toLowerCase() === username.toLowerCase()
    );
  };
  // console.log("User:", user);
  // console.log("All statuses:", statuses);
  // console.log("Filtered userStatuses:", userStatuses);
  return (
    <div className="bodyy1">
      <nav className="bario">
        <img src={logo} className="img" alt="" />
        <div className="circle">
          {user.image ? (
            <img
              src={`http://localhost:5000${user.image}`}
              className="imgs"
              alt="Profile"
            />
          ) : (
            <span className="material-symbols-outlined">
              photo_camera_front
            </span>
          )}
        </div>
      </nav>

      <div className="threeDotss">
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

      {/* ADD STATUS */}
      <div className="status-add-container">
        <div className="stay">
          <h1>Your status</h1>
          <section className="almost">
            <div className="status-circle" onClick={handleStatusClick}>
              <span className="material-symbols-outlined">add</span>
              {userStatuses.length > 0 && (
                <div
                  className="status-ring"
                  style={{ "--segments": userStatuses.length }}
                ></div>
              )}
            </div>
            <span onClick={toggleOptions}>Add new updtae</span>
          </section>
        </div>

        <div className="stay">
          <h1>New updates</h1>

          {otherUsers.length === 0 ? (
            <p>No new updates yet.</p>
          ) : (
            <div className="updates-list">
              {otherUsers.map((u) => {
                const theirStatuses = getUserStatuses(u.id);
                return (
                  <div
                    className="update-item"
                    key={u.id}
                    onClick={() => {
                      setShowViewer(true);
                      setCurrentIndex(0);
                      setViewerProgress(0);
                      setViewerStatuses(theirStatuses); // 👈 set which statuses to show
                      startProgress();
                    }}
                  >
                    <div className="status-circle">
                      <img
                        src={`http://localhost:5000${u.image}`}
                        className="status-user-img"
                      />
                      {theirStatuses.length > 0 && (
                        <div
                          className="status-ring"
                          style={{ "--segments": theirStatuses.length }}
                        ></div>
                      )}
                    </div>
                    <div className="update-info">
                      <span className="update-username">{u.username}</span>
                      <span className="update-time">
                        {new Date(u.lastUpdated).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {showOptions && (
          <div className="status-options">
            <label htmlFor="addashi" className="option-btn">
              <span className="material-symbols-outlined">
                insert_drive_file
              </span>
              <p>File</p>
              <input
                type="file"
                id="addashi"
                onChange={handleFileChange}
                hidden
              />
            </label>

            <button
              className="option-btn"
              onClick={() => setShowTextField(true)}
            >
              <span className="material-symbols-outlined">edit_note</span>
              <p>Text</p>
            </button>

            <button className="option-btn" onClick={handleVoiceClick}>
              <span className="material-symbols-outlined">mic</span>
              <p>Voice</p>
            </button>

            <button className="option-btn" onClick={handleCameraClick}>
              <span className="material-symbols-outlined">photo_camera</span>
              <p>Camera</p>
            </button>
          </div>
        )}
      </div>

      {/* TEXT OVERLAY */}
      {showTextField && (
        <div className="file-preview-overlay">
          <div className="preview-content text-status-content">
            <textarea
              value={textStatus}
              onChange={(e) => setTextStatus(e.target.value)}
              placeholder="Type your status..."
              className="text-status-input"
            />
            <div className="preview-buttons">
              <button className="cancel-btn" onClick={resetAllStates}>
                Cancel
              </button>
              <button
                className="upload-btn"
                onClick={() => handleUpload("text")}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="spinner">
                    <div className="loader"></div>
                    <span className="percent">{uploadProgress}%</span>
                  </div>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FILE OVERLAY */}
      {showFileOverlay && (
        <div className="file-preview-overlay">
          <div className="preview-content file-status">
            {filePreview && (
              <>
                {/* Detect and render file type */}
                {selectedFile.type.startsWith("image/") ? (
                  <img
                    src={filePreview}
                    alt="Selected Preview"
                    className="selected-file-media"
                  />
                ) : selectedFile.type.startsWith("video/") ? (
                  <video
                    src={filePreview}
                    controls
                    className="selected-file-media"
                  ></video>
                ) : selectedFile.type === "application/pdf" ? (
                  <iframe
                    src={filePreview}
                    title="PDF Preview"
                    className="selected-file-media"
                  ></iframe>
                ) : (
                  <div className="file-generic">
                    <span className="material-symbols-outlined">
                      insert_drive_file
                    </span>
                    <p>{selectedFile.name}</p>
                  </div>
                )}
              </>
            )}

            {/* Buttons */}
            <div className="preview-buttons">
              <button className="cancel-btn" onClick={resetAllStates}>
                Cancel
              </button>
              <button
                className="upload-btn"
                onClick={() => handleUpload("file")}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="spinner">
                    <div className="loader"></div>
                    <span className="percent">{uploadProgress}%</span>
                  </div>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
            
        </div>
      )}

      {/* VOICE OVERLAY */}
      {showVoiceOverlay && (
        <div className="file-preview-overlay">
          <div className="preview-content voice-status">
            {!audioBlob ? (
              <div>
                {!isRecording ? (
                  <button onClick={startRecording} className="record-btn">
                    Start Recording
                  </button>
                ) : (
                  <button onClick={stopRecording} className="stop-btn">
                    Stop Recording
                  </button>
                )}
              </div>
            ) : (
              <div>
                <audio controls src={audioUrl}></audio>
              </div>
            )}
            <div className="preview-buttons">
              <button className="cancel-btn" onClick={closeVoiceOverlay}>
                Cancel
              </button>
              <button
                className="upload-btn"
                onClick={() => handleUpload("voice")}
                disabled={!audioBlob || uploading}
              >
                {uploading ? (
                  <div className="spinner">
                    <div className="loader"></div>
                    <span className="percent">{uploadProgress}%</span>
                  </div>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CAMERA OVERLAY */}
      {showCameraOverlay && (
        <div className="file-preview-overlay">
          <div className="preview-content camera-status">
            {!capturedImage ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="camera-video"
                ></video>
                <canvas ref={canvasRef} style={{ display: "none" }}></canvas>
                <div className="camera-controls">
                  <button onClick={flipCamera}>Flip</button>
                  <button onClick={captureImage}>Capture</button>
                </div>
              </>
            ) : (
              <img src={capturedImage} alt="Captured" className="file-img" />
            )}
            <div className="preview-buttons">
              <button className="cancel-btn" onClick={closeCameraOverlay}>
                Cancel
              </button>
              <button
                className="upload-btn"
                onClick={() => handleUpload("camera")}
                disabled={uploading}
              >
                {uploading ? (
                  <div className="spinner">
                    <div className="loader"></div>
                    <span className="percent">{uploadProgress}%</span>
                  </div>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <footer className="foot">
        <img src={logo} className="imgo" alt="" />
      </footer>
      {/* === STATUS VIEWER OVERLAY === */}
      {/* === STATUS VIEWER OVERLAY === */}
      {/* === STATUS VIEWER OVERLAY === */}
      {/* === STATUS VIEWER OVERLAY === */}
      {showViewer && currentStatus && (
        <div className="status-viewer-overlay" onClick={closeViewer}>
          {/* Progress bars */}
          <div className="status-progress-container">
            {viewerStatuses.map((_, i) => (
              <div key={i} className="status-progress-bar">
                <div
                  className="status-progress-fill"
                  style={{
                    width:
                      i < currentIndex
                        ? "100%"
                        : i === currentIndex
                        ? `${viewerProgress}%`
                        : "0%",
                    background: "white",
                  }}
                ></div>
              </div>
            ))}
          </div>
          <button
            className="nav-arrow left"
            onClick={(e) => {
              e.stopPropagation();
              handlePrevStatus();
            }}
          >
            <span className="material-symbols-outlined">arrow_back_ios</span>
          </button>

          {/* your existing render logic (image/video/text/audio) */}

          {/* → Right arrow */}
          <button
            className="nav-arrow right"
            onClick={(e) => {
              e.stopPropagation();
              handleNextStatus();
            }}
          >
            <span className="material-symbols-outlined">arrow_forward_ios</span>
          </button>

          {/* Actual status content */}
          <div
            className="status-viewer-content"
            onClick={(e) => e.stopPropagation()} // prevent closing when clicking inside
          >
            {(() => {
              const s = currentStatus;
              if (!s) return <p>Unsupported or empty status</p>;

              const getSrc = (val) => {
                if (!val) return "";
                if (val.startsWith("data:")) return val;
                if (val.startsWith("blob:")) return val;
                if (val.startsWith("http")) return val;
                return `http://localhost:5000${
                  val.startsWith("/") ? "" : "/"
                }${val}`;
              };

              // ✅ Text status
              if (s.type === "text" && s.content) {
                return <p className="status-text">{s.content}</p>;
              }

              // ✅ Image
              if (
                s.type === "image" ||
                (s.filePath &&
                  (s.filePath.endsWith(".jpg") ||
                    s.filePath.endsWith(".jpeg") ||
                    s.filePath.endsWith(".png")))
              ) {
                return (
                  <img
                    src={getSrc(s.filePath)}
                    alt="status"
                    className="status-media"
                  />
                );
              }

              // ✅ Video
              if (
                s.type === "video" ||
                (s.filePath &&
                  (s.filePath.endsWith(".mp4") ||
                    s.filePath.endsWith(".webm") ||
                    s.filePath.startsWith("data:video")))
              ) {
                return (
                  <video
                    src={getSrc(s.filePath)}
                    controls
                    autoPlay
                    muted
                    className="status-media"
                  ></video>
                );
              }

              // ✅ Voice note
              if (
                s.type === "voice" ||
                (s.filePath &&
                  (s.filePath.endsWith(".mp3") ||
                    s.filePath.endsWith(".wav") ||
                    s.filePath.startsWith("data:audio")))
              ) {
                return (
                  <audio
                    src={getSrc(s.filePath)}
                    controls
                    autoPlay
                    preload="auto"
                    className="status-audio"
                  />
                );
              }

              // ✅ PDF
              if (
                s.filePath &&
                (s.filePath.endsWith(".pdf") ||
                  s.filePath.startsWith("data:application/pdf"))
              ) {
                return (
                  <iframe
                    src={getSrc(s.filePath)}
                    title="PDF Preview"
                    className="status-media"
                  ></iframe>
                );
              }

              // ❌ Fallback
              return (
                <div className="unsupported">
                  <span className="material-symbols-outlined">block</span>
                  <p>Unsupported file type</p>
                </div>
              );
            })()}
          </div>

          {/* Close Button */}
          <button className="close-status-btn" onClick={closeViewer}>
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default Status;
