import { useState, useRef, useEffect } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const Chat = ({ socket }) => {
  const [user, setUser] = useState({});
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [files, setFiles] = useState([]);
  const [capturedImage, setCapturedImage] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [capturedImageName, setCapturedImageName] = useState("");
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaStream = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [showCallOptions, setShowCallOptions] = useState(false);
  const [isOnline, setIsOnline] = useState(false);

  const API = import.meta.env.VITE_API_URL;

  const navigate = useNavigate();
  const location = useLocation();
  const use = location.state;

  const [callType, setCallType] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [incomingCall, setIncomingCall] = useState(null);

  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const peerConnection = useRef(null);
  // authenticating the user
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

  // generating room id
  function generateRoomId(user1Id, user2Id) {
    return [user1Id, user2Id].sort().join("-");
  }

  useEffect(() => {
    if (!user._id || !use?._id) return;

    const interval = setInterval(() => {
      if (socket.current && socket.current.connected) {
        const roomId = generateRoomId(user._id, use._id);
        socket.current.emit("joinRoom", roomId);
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [user, use]);
  // getting user messages from db
  // getting user messages
  // getting user messages
  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await axios.get(
          `${API}/home/dashboard/messages?userId=${user._id}&recipientId=${use._id}`
        );
        const directMessages = response.data;
        const directFiles = directMessages.filter((message) => message.file);
        const updatedDirectFiles = directFiles.map((file) => {
          const type = getFileType(file.fileName);
          const blob = new Blob([new Uint8Array(file.file.data)], { type });
          const url = URL.createObjectURL(blob);
          return { ...file, url, file: blob };
        });

        const broadcastResponse = await axios.get(
          `${API}/home/dashboard/broadcastMessages?userId=${user._id}`
        );
        const broadcastMessages = broadcastResponse.data.filter(
          (message) =>
            message.members.includes(user._id) &&
            (message.senderId === use._id || message.members.includes(use._id))
        );
        const broadcastFiles = broadcastMessages.filter(
          (message) => message.file
        );
        const updatedBroadcastFiles = broadcastFiles.map((file) => {
          const type = getFileType(file.fileName);
          const blob = new Blob([new Uint8Array(file.file.data)], { type });
          const url = URL.createObjectURL(blob);
          return { ...file, url, file: blob };
        });

        const allMessages = [
          ...directMessages.filter((message) => message.message),
          ...broadcastMessages.filter((message) => message.message),
        ];
        const allFiles = [...updatedDirectFiles, ...updatedBroadcastFiles];

        setMessages(
          allMessages.sort((a, b) => new Date(a.time) - new Date(b.time))
        );
        setFiles((prevFiles) => {
          const combined = [...prevFiles, ...allFiles];
          const unique = combined.filter(
            (v, i, a) =>
              i ===
              a.findIndex(
                (t) =>
                  t.fileName === v.fileName &&
                  t.senderId === v.senderId &&
                  t.time === v.time
              )
          );
          return unique.sort((a, b) => new Date(a.time) - new Date(b.time));
        });
      } catch (error) {
        console.error(error);
      }
    };
    fetchMessages();
  }, [user, use]);

  const getFileType = (fileName) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
      return "image/jpeg";
    } else if (fileName.match(/\.(mp3|wav|webm)$/)) {
      return "audio/webm";
    } else {
      return "application/octet-stream";
    }
  };

  // start recorder
  const handleStartRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaStream.current = stream;
      mediaRecorder.current = new MediaRecorder(stream);
      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };
      mediaRecorder.current.onstop = () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/webm" });
        const url = URL.createObjectURL(audioBlob);

        // ✅ Instantly show the VN locally
        setFiles((prevFiles) => [
          ...prevFiles,
          {
            file: audioBlob,
            fileName: "recording.webm",
            senderId: user._id,
            recipientId: use._id,
            time: new Date().toISOString(),
            url,
          },
        ]);

        // ✅ Then send it to the server
        const reader = new FileReader();
        reader.onload = () => {
          socket.current.emit("newFile", {
            file: reader.result,
            fileName: "recording.webm",
            recipientId: use._id,
            senderId: user._id,
            time: new Date().toISOString(),
          });
        };
        reader.readAsArrayBuffer(audioBlob);

        // 🧹 Cleanup
        audioChunks.current = [];
        mediaStream.current.getTracks().forEach((track) => track.stop());
        setRecording(false);
      };
      mediaRecorder.current.start();
      setRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
    }
  };

  // stop recording
  const handleStopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
  };

  // send to server
  const recvn = () => {
    if (!recording) {
      handleStartRecording();
    } else {
      handleStopRecording();
      // Send the recorded audio
      // const reader = new FileReader();
      // reader.onload = () => {
      //   socket.current.emit("newFile", {
      //     file: reader.result,
      //     fileName: "recording.webm",
      //     recipientId: use._id,
      //     senderId: user._id,
      //     time: new Date().toISOString(),
      //   });
      // };
      // reader.readAsArrayBuffer(audioBlob);
    }
  };

  // sending message via socket.io
  // sending message via socket.io
  // sending message via socket.io
  // sending message via socket.io
  const sendMessage = async (e) => {
    console.log("button works");
    console.log(message);
    const currentTime = new Date().toISOString();
    const roomId = generateRoomId(user._id, use._id);
    if (message) {
      socket.current.emit("newMessage", {
        message: message,
        roomId: roomId,
        recipientId: use._id,
        senderId: user._id,
        time: currentTime,
      });
      setMessage("");
    }
    if (selectedFile) {
      if (!user._id || !use._id) return;

      const roomId = generateRoomId(user._id, use._id);
      const reader = new FileReader();

      // ✅ Instantly show your own sent file
      const url = URL.createObjectURL(selectedFile);
      setFiles((prevFiles) => [
        ...prevFiles,
        {
          file: selectedFile,
          fileName: selectedFile.name,
          senderId: user._id,
          recipientId: use._id,
          time: new Date().toISOString(),
          url,
        },
      ]);

      reader.onload = () => {
        console.log("Sending file:", selectedFile.name);
        if (socket.current) {
          socket.current.emit("newFile", {
            file: reader.result,
            fileName: selectedFile.name,
            roomId,
            recipientId: use._id,
            senderId: user._id,
            time: new Date().toISOString(),
          });
          setSelectedFile(null);
          setSelectedFileName("");
        } else {
          console.error("Socket not connected");
        }
      };

      reader.onerror = (err) => console.error("File read error:", err);
      reader.readAsArrayBuffer(selectedFile);
    }
    if (capturedImage) {
      fetch(capturedImage)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "captured_image.jpg", {
            type: "image/jpeg",
          });
          const reader = new FileReader();
          reader.onload = () => {
            socket.current.emit("newFile", {
              file: reader.result,
              fileName: file.name,
              recipientId: use._id,
              senderId: user._id,
              time: new Date().toISOString(),
            });
          };
          reader.readAsArrayBuffer(file);
        });
      setCapturedImage(null);
      setShowVideo(false);
    }
  };

  // useEffect(() => {
  //   if (!socket.current || !user._id) return;
  //   socket.current.emit("join", user._id);
  // }, [socket, user]);

  useEffect(() => {
    if (!user._id) return;

    const interval = setInterval(() => {
      if (socket.current && socket.current.connected) {
        socket.current.emit("join", user._id);
        clearInterval(interval);
      }
    }, 300);

    return () => clearInterval(interval);
  }, [user]);

  // receiving the message from your server
  useEffect(() => {
    const handleNewMessage = (message) => {
      if (
        (message.recipientId === use._id && message.senderId === user._id) ||
        (message.recipientId === user._id && message.senderId === use._id)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };
    socket.current.on("newMessage", handleNewMessage);
    return () => {
      socket.current.off("newMessage", handleNewMessage);
    };
  }, [socket, user, use]);

  // handling broadcast messages
  useEffect(() => {
    const handleNewBroadcastMessage = (message) => {
      if (
        message.members.includes(user._id) &&
        (message.senderId === use._id || message.members.includes(use._id))
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };

    socket.current.on("newBroadcastMessage", handleNewBroadcastMessage);

    return () => {
      socket.current.off("newBroadcastMessage", handleNewBroadcastMessage);
    };
  }, [socket, user, use]);

  // receiving the file from your server
  // receiving the file from your server
  useEffect(() => {
    const handleNewFile = (fileData) => {
      // Prevent double rendering — skip your own sent files
      if (fileData.senderId === user._id) return;

      // Proceed only for valid sender/receiver pairs
      if (
        (fileData.recipientId === use._id && fileData.senderId === user._id) ||
        (fileData.recipientId === user._id && fileData.senderId === use._id)
      ) {
        const existingFileIndex = files.findIndex(
          (file) =>
            file.senderId === fileData.senderId &&
            file.fileName === fileData.fileName &&
            file.file.byteLength === fileData.file.byteLength
        );
        if (existingFileIndex !== -1) return;

        const currentTime = new Date().toISOString();
        let type = "application/octet-stream";
        if (fileData.fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
          type = "image/jpeg";
        } else if (fileData.fileName.match(/\.(mp3|wav|webm)$/)) {
          type = "audio/webm";
        }

        const blob = new Blob([fileData.file], { type });
        const url = URL.createObjectURL(blob);

        setFiles((prevFiles) => [
          ...prevFiles,
          {
            ...fileData,
            time: currentTime,
            url,
          },
        ]);
      }
    };

    //   socket.current.on("newFile", handleNewFile);
    //   return () => {
    //     socket.current.off("newFile", handleNewFile);
    //   };
    // }, [socket, user, use, files]);

    const handleNewBroadcastFile = (fileData) => {
      // This is a broadcast file
      if (
        fileData.members.includes(user._id) &&
        (fileData.senderId === use._id || fileData.members.includes(use._id))
      ) {
        const existingFileIndex = files.findIndex(
          (file) =>
            file.senderId === fileData.senderId &&
            file.fileName === fileData.fileName &&
            file.file.byteLength === fileData.file.byteLength
        );
        if (existingFileIndex !== -1) {
          return;
        }
        const currentTime = new Date().toISOString();
        let type = "application/octet-stream";
        if (fileData.fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
          type = "image/jpeg";
        } else if (fileData.fileName.match(/\.(mp3|wav|webm)$/)) {
          type = "audio/webm";
        }
        const blob = new Blob([fileData.file], { type });
        const url = URL.createObjectURL(blob);
        setFiles((prevFiles) => [
          ...prevFiles,
          {
            ...fileData,
            time: currentTime,
            url,
          },
        ]);
      }
    };

    socket.current.on("newFile", handleNewFile);
    socket.current.on("newBroadcastFile", handleNewBroadcastFile);

    return () => {
      socket.current.off("newFile", handleNewFile);
      socket.current.off("newBroadcastFile", handleNewBroadcastFile);
    };
  }, [socket, user, use, files]);

  // sending files via socket.io
  const handleChange = async (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setSelectedFileName(file.name);
  };

  // snapping a pic
  // snapping a pic
  const snap = async () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const context = canvas.getContext("2d");
    context.drawImage(videoRef.current, 0, 0);
    const imageDataURL = canvas.toDataURL("image/jpeg");
    setCapturedImage(imageDataURL);
    fetch(imageDataURL)
      .then((res) => res.blob())
      .then((blob) => {
        const file = new File([blob], "captured_image.jpg", {
          type: "image/jpeg",
        });
        const reader = new FileReader();
        reader.onload = () => {
          const url = URL.createObjectURL(blob);
          // setFiles((prevFiles) => [
          //   ...prevFiles,
          //   {
          //     file: reader.result,
          //     fileName: file.name,
          //     senderId: user._id,
          //     time: new Date().toISOString(),
          //     url,
          //   },
          // ]);
        };
        reader.readAsArrayBuffer(file);
      });
    setMessage("Captured Image");
  };

  const bringVid = async () => {
    setShowVideo(true);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error("Error accessing camera:", error);
    }
  };

  const iceServers = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" }, // Google STUN
    ],
  };
  // initiating a call
  const handleStartCall = async (type) => {
    setCallType(type);
    setInCall(true);
    console.log(`Starting a ${type} call with ${use.nickName}`);

    // 1️⃣ Get media stream
    const constraints =
      type === "video" ? { video: true, audio: true } : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (localVideoRef.current && type === "video") {
      localVideoRef.current.srcObject = stream;
    }

    // 2️⃣ Create PeerConnection
    peerConnection.current = new RTCPeerConnection(iceServers);
    stream
      .getTracks()
      .forEach((track) => peerConnection.current.addTrack(track, stream));

    peerConnection.current.ontrack = (event) => {
      if (callType === "video") {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      } else {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      }
    };

    // 4️⃣ ICE candidates
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("webrtc-candidate", {
          candidate: event.candidate,
          to: use._id,
          from: user._id,
        });
      }
    };

    // 5️⃣ Create and send offer
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socket.current.emit("webrtc-offer", {
      offer,
      to: use._id,
      from: user._id,
      type,
    });
  };

  // recieving call offers
  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("webrtc-offer", async ({ offer, from, type }) => {
      setIncomingCall({ from, type, offer });
    });

    socket.current.on("webrtc-answer", async ({ answer }) => {
      if (peerConnection.current) {
        await peerConnection.current.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      }
    });

    socket.current.on("webrtc-candidate", async ({ candidate }) => {
      if (peerConnection.current && candidate) {
        await peerConnection.current.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      }
    });

    return () => {
      socket.current.off("webrtc-offer");
      socket.current.off("webrtc-answer");
      socket.current.off("webrtc-candidate");
    };
  }, [socket]);

  // handle accepting incoming calls
  const acceptCall = async () => {
    const { from, type, offer } = incomingCall;
    setCallType(type);
    setIncomingCall(null);
    setInCall(true);

    const constraints =
      type === "video" ? { video: true, audio: true } : { audio: true };
    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    if (localVideoRef.current && type === "video") {
      localVideoRef.current.srcObject = stream;
    }

    peerConnection.current = new RTCPeerConnection(iceServers);
    stream
      .getTracks()
      .forEach((track) => peerConnection.current.addTrack(track, stream));

    peerConnection.current.ontrack = (event) => {
      if (callType === "video") {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      } else {
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = event.streams[0];
        }
      }
    };

    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socket.current.emit("webrtc-candidate", {
          candidate: event.candidate,
          to: from,
          from: user._id,
        });
      }
    };

    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );

    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);

    socket.current.emit("webrtc-answer", {
      answer,
      to: from,
      from: user._id,
    });
  };

  // online status of users
  useEffect(() => {
    if (!socket.current) return;

    socket.current.on("updateUserStatus", ({ userId, status }) => {
      if (userId === use._id) {
        setIsOnline(status === "online");
      }
    });

    return () => {
      socket.current.off("updateUserStatus");
    };
  }, [socket, use]);

  return (
    <div className="bodyy1">
      <div className="bario">
        <div className="users1">
          <span class="material-symbols-outlined">arrow_back</span>
          <div className="circ">
            {user.image ? (
              <img src={use.image} className="imgs" alt="Profile" />
            ) : (
              <span className="material-symbols-outlined">
                photo_camera_front
              </span>
            )}
          </div>
          <section className="nameAndMessage">
            <span className="orang">{use.nickName}</span>
            <span style={{ color: isOnline ? "green" : "gray" }}>
              {isOnline ? "Online" : "Offline"}
            </span>
          </section>
        </div>
        <div className="timeAndNumer">
          <button
            id="callButton"
            onClick={() => setShowCallOptions((prev) => !prev)}
          >
            <span className="material-symbols-outlined">call</span>
          </button>

          <span class="material-symbols-outlined">videocam</span>
          <span class="material-symbols-outlined">more_vert</span>
        </div>
      </div>

      {showCallOptions && (
        <div className="call-options-popup">
          <div className="popup-content">
            <p>Choose call type:</p>
            <button
              onClick={() => {
                setShowCallOptions(false);
                handleStartCall("voice");
              }}
              className="popup-button"
            >
              📞 Voice Call
            </button>

            <button
              onClick={() => {
                setShowCallOptions(false);
                handleStartCall("video");
              }}
              className="popup-button"
            >
              🎥 Video Call
            </button>
          </div>
        </div>
      )}

      <audio
        ref={remoteAudioRef}
        autoPlay
        playsInline
        style={{ display: "none" }}
      />
      <section className="chatContaner">
        {[...messages, ...files]
          .sort((a, b) => new Date(a.time) - new Date(b.time))
          .map((item, index) => {
            const isBroadcast = item.members && item.members.includes(user._id);
            const isDirectMessage =
              (item.recipientId === use._id && item.senderId === user._id) ||
              (item.recipientId === user._id && item.senderId === use._id);
            const isBroadcastInCurrentChat =
              isBroadcast &&
              (item.senderId === use._id || item.senderId === user._id);

            if ((isBroadcast && isBroadcastInCurrentChat) || isDirectMessage) {
              return (
                <span
                  key={index}
                  className={`spaner ${
                    isBroadcast
                      ? item.senderId === user._id
                        ? "sent"
                        : "received"
                      : item.senderId === user._id
                      ? "sent"
                      : "received"
                  }`}
                >
                  {item.message ? (
                    <span>
                      {item.message}
                      <small className="time">
                        {new Date(item.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </span>
                  ) : (
                    <span>
                      {item.fileName.match(/\.(jpg|jpeg|png|gif)$/) ? (
                        <img
                          src={item.url}
                          alt={item.fileName}
                          style={{ width: "100px", height: "100px" }}
                        />
                      ) : item.fileName.match(/\.(mp3|wav|webm)$/) ? (
                        <audio controls className="vn">
                          <source src={item.url} type="audio/webm" />
                          Your browser does not support the audio element.
                        </audio>
                      ) : (
                        <a href={item.url} download={item.fileName}>
                          {item.fileName}
                        </a>
                      )}
                      <small className="time">
                        {new Date(item.time).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </small>
                    </span>
                  )}
                </span>
              );
            } else {
              return null;
            }
          })}
      </section>

      <footer className="foota">
        <div className="char">
          <input
            className="yes"
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
          />
          {selectedFileName && (
            <small className="smal">
              Selected file: {selectedFileName}
              <span
                style={{ marginLeft: "10px", cursor: "pointer" }}
                onClick={() => {
                  setSelectedFile(null);
                  setSelectedFileName("");
                }}
              >
                <span
                  class="material-symbols-outlined"
                  style={{ fontSize: "16px" }}
                >
                  cancel
                </span>
              </span>
            </small>
          )}

          <div>
            <label htmlFor="addashi" className="lay">
              <span class="material-symbols-outlined" id="grenade">
                attach_file
              </span>
              <input
                type="file"
                id="addashi"
                onChange={handleChange}
                accept="/"
                key={selectedFileName} // force re-render when cleared
              />
            </label>
          </div>
          <div>
            <button className="lay" onClick={bringVid}>
              <span class="material-symbols-outlined" id="grenade">
                photo_camera
              </span>
            </button>
          </div>
        </div>
        {message.trim() !== "" || selectedFile ? (
          <button onClick={sendMessage} className="nahbut">
            <span class="material-symbols-outlined">send</span>
          </button>
        ) : (
          <button className="nahbut" onClick={recvn}>
            <span class="material-symbols-outlined">
              {recording ? "stop" : "mic"}
            </span>
          </button>
        )}

        {inCall && (
          <div className="call-container">
            {callType === "video" ? (
              <>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className="local-video"
                />
                <video ref={remoteVideoRef} autoPlay className="remote-video" />
              </>
            ) : (
              <p>🎧 Voice call in progress...</p>
            )}
            <button
              onClick={() => {
                setInCall(false);
                peerConnection.current?.close();
                peerConnection.current = null;
              }}
            >
              End Call
            </button>
          </div>
        )}

        {/* incoming call popup */}
        {incomingCall && (
          <div className="incoming-call-popup">
            <p>
              {incomingCall.from} is calling you ({incomingCall.type})
            </p>
            <button onClick={acceptCall}>Accept</button>
            <button onClick={() => setIncomingCall(null)}>Decline</button>
          </div>
        )}
      </footer>

      {showVideo && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "80%", height: "60%" }}
            />
            {capturedImage && (
              <img
                src={capturedImage}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            )}
          </div>
          <div style={{ marginTop: "20px" }}>
            <button
              className="capt"
              onClick={() => {
                if (capturedImage) {
                  setCapturedImage(null); // Discard captured image
                } else {
                  const canvas = canvasRef.current;
                  const video = videoRef.current;
                  if (canvas && video) {
                    canvas.width = video.videoWidth;
                    canvas.height = video.videoHeight;
                    const context = canvas.getContext("2d");
                    context.drawImage(video, 0, 0);
                    const imageDataURL = canvas.toDataURL("image/jpeg");
                    setCapturedImage(imageDataURL);
                  }
                }
              }}
            >
              {capturedImage ? "Discard" : "Capture"}
            </button>

            <button
              style={{ marginLeft: "10px" }}
              onClick={() => {
                if (!capturedImage || !user._id || !use._id) return;

                const roomId = generateRoomId(user._id, use._id);

                fetch(capturedImage)
                  .then((res) => res.blob())
                  .then((blob) => {
                    const file = new File([blob], "captured_image.jpg", {
                      type: "image/jpeg",
                    });
                    const reader = new FileReader();

                    reader.onload = () => {
                      if (socket.current) {
                        socket.current.emit("newFile", {
                          file: reader.result,
                          fileName: file.name,
                          roomId,
                          recipientId: use._id,
                          senderId: user._id,
                          time: new Date().toISOString(),
                        });
                      } else {
                        console.error("Socket not connected");
                      }

                      const url = URL.createObjectURL(blob);
                      setFiles((prevFiles) => [
                        ...prevFiles,
                        {
                          file: blob, // Blob, not ArrayBuffer
                          fileName: file.name,
                          senderId: user._id,
                          recipientId: use._id,
                          time: new Date().toISOString(),
                          url,
                        },
                      ]);

                      // Slight delay ensures re-render sync
                      setTimeout(() => {
                        setCapturedImage(null);
                        setShowVideo(false);
                      }, 100);
                    };

                    reader.onerror = (err) =>
                      console.error("Error reading captured image:", err);
                    reader.readAsArrayBuffer(file);
                  })
                  .catch((err) =>
                    console.error("Error fetching captured image:", err)
                  );
              }}
            >
              {capturedImage ? "Send" : "Close"}
            </button>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} className="can" />
        </div>
      )}

      {/* 📞 ACTIVE CALL INTERFACE */}
      {inCall && (
        <div className="call-overlay">
          <div className="call-box">
            <img
              src={`${API}${use.image}`}
              alt="Profile"
              className="call-avatar"
            />
            <h3 className="call-name">{use.nickName}</h3>
            <p className="call-status">
              {callType === "video"
                ? "Video call in progress..."
                : "Voice call..."}
            </p>

            {callType === "video" && (
              <div className="video-container">
                <video ref={remoteVideoRef} autoPlay className="remote-video" />
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className="local-video"
                />
              </div>
            )}

            <button
              className="end-call-btn"
              onClick={() => {
                setInCall(false);
                peerConnection.current?.close();
                peerConnection.current = null;
              }}
            >
              <span className="material-symbols-outlined">call_end</span>
            </button>
          </div>
        </div>
      )}

      {/* 📲 INCOMING CALL POPUP */}
      {incomingCall && (
        <div className="incoming-call-overlay">
          <div className="incoming-call-box">
            <img
              src={`${API}${use.image}`}
              alt="Caller"
              className="call-avatar"
            />
            <h3 className="call-name">{use.nickName}</h3>
            <p className="call-status">
              Incoming {incomingCall.type === "video" ? "Video" : "Voice"}{" "}
              Call...
            </p>
            <div className="incoming-call-buttons">
              <button className="accept-btn" onClick={acceptCall}>
                <span className="material-symbols-outlined">call</span>
              </button>
              <button
                className="decline-btn"
                onClick={() => setIncomingCall(null)}
              >
                <span className="material-symbols-outlined">call_end</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
