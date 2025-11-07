import { useState, useRef, useEffect } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const BroadcastChat = ({ socket }) => {
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

  const navigate = useNavigate();
  const location = useLocation();
  const broadcast = location.state?.broadcast;

  // authenticating the user
  useEffect(() => {
    const token = localStorage.getItem("token");
    axios
      .get("http://localhost:5000/home/dashboard", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      .then((response) => {
        setUser(response.data.user);
        console.log(broadcast.members);
      })
      .catch((error) => {
        console.error(error);
        navigate("/login");
      });
  }, [navigate]);

  // function generateBroadcastRoomId(members) {
  function generateBroadcastRoomId(members) {
    return members.sort().join("-");
  }

  useEffect(() => {
    const broadcastRoomId = generateBroadcastRoomId(broadcast.members);
    socket.current.emit("joinRoom", broadcastRoomId);
    console.log(broadcastRoomId);
  }, [broadcast]);

  const getFileType = (fileName) => {
    if (fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
      return "image/jpeg";
    } else if (fileName.match(/\.(mp3|wav|webm)$/)) {
      return "audio/webm";
    } else {
      return "application/octet-stream";
    }
  };

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
        const audio = new Audio(url);
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
        const reader = new FileReader();
        reader.onload = () => {
          socket.current.emit("newBroadcastFile", {
            file: reader.result,
            fileName: "recording.webm",
            members: broadcast.members,
            senderId: user._id,
            time: new Date().toISOString(),
          });
        };
        reader.readAsArrayBuffer(audioBlob);
        setFiles((prevFiles) => [
          ...prevFiles,
          {
            fileName: "recording.webm",
            senderId: user._id,
            time: new Date().toISOString(),
            url,
          },
        ]);
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

  //   sending broadcast
  //   sending broadcast
  //   sending broadcast
  const sendMessage = async (e) => {
    console.log("button works");
    console.log(message);
    const currentTime = new Date().toISOString();

    if (message) {
      socket.current.emit("newBroadcastMessage", {
        message: message,
        members: broadcast.members,
        senderId: user._id,
        time: currentTime,
      });
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message,
          members: broadcast.members,
          senderId: user._id,
          time: currentTime,
        },
      ]);
    }

    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = () => {
        if (socket.current) {
          socket.current.emit("newBroadcastFile", {
            file: reader.result,
            fileName: selectedFile.name,
            members: broadcast.members,
            senderId: user._id,
            time: new Date().toISOString(),
          });
          const url = URL.createObjectURL(selectedFile);
          setFiles((prevFiles) => [
            ...prevFiles,
            {
              fileName: selectedFile.name,
              senderId: user._id,
              time: new Date().toISOString(),
              url,
            },
          ]);
        } else {
          console.error("Socket is not connected");
        }
      };
      reader.readAsArrayBuffer(selectedFile);
      setSelectedFile(null);
      setSelectedFileName("");
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
            socket.current.emit("newBroadcastFile", {
              file: reader.result,
              fileName: file.name,
              members: broadcast.members,
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

  useEffect(() => {
    if (broadcast && broadcast.members) {
      const broadcastRoomId = generateBroadcastRoomId(broadcast.members);
      socket.current.emit("joinRoom", broadcastRoomId);
    }
  }, [socket, broadcast]);

  //   recieving broadcasts messages from socket.io
  // useEffect(() => {
  //   const handleNewBroadcastMessage = (message) => {
  //     if (message.members.includes(user._id)) {
  //       setMessages((prevMessages) => [...prevMessages, message]);
  //     }
  //   };

  //   socket.current.on("newBroadcastMessage", handleNewBroadcastMessage);

  //   return () => {
  //     socket.current.off("newBroadcastMessage", handleNewBroadcastMessage);
  //   };
  // }, [socket, user, broadcast]);

  //   recieving broadcasts files from socket.io

  // useEffect(() => {
  //   const handleNewBroadcastFile = (fileData) => {
  //     if (
  //       fileData.members.includes(user._id) &&
  //       use._id === fileData.senderId
  //     ) {
  //       const existingFileIndex = files.findIndex(
  //         (file) =>
  //           file.senderId === fileData.senderId &&
  //           file.fileName === fileData.fileName &&
  //           file.file.byteLength === fileData.file.byteLength
  //       );
  //       if (existingFileIndex !== -1) {
  //         return;
  //       }
  //       const currentTime = new Date().toISOString();
  //       let type = "application/octet-stream";
  //       if (fileData.fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
  //         type = "image/jpeg";
  //       } else if (fileData.fileName.match(/\.(mp3|wav|webm)$/)) {
  //         type = "audio/webm";
  //       }
  //       const blob = new Blob([fileData.file], { type });
  //       const url = URL.createObjectURL(blob);
  //       setFiles((prevFiles) => [
  //         ...prevFiles,
  //         {
  //           ...fileData,
  //           time: currentTime,
  //           url,
  //         },
  //       ]);
  //     }
  //   };

  //   socket.current.on("newBroadcastFile", handleNewBroadcastFile);

  //   return () => {
  //     socket.current.off("newBroadcastFile", handleNewBroadcastFile);
  //   };
  // }, [socket, user, use, files]);

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
          setFiles((prevFiles) => [
            ...prevFiles,
            {
              file: reader.result,
              fileName: file.name,
              senderId: user._id,
              time: new Date().toISOString(),
              url,
            },
          ]);
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

  useEffect(() => {
    const handleNewBroadcastMessage = (message) => {
      if (message.members.includes(user._id)) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    };
    socket.current.on("newBroadcastMessage", handleNewBroadcastMessage);
    return () => {
      socket.current.off("newBroadcastMessage", handleNewBroadcastMessage);
    };
  }, [socket, user, broadcast]);

  return (
    <div className="bodyy1">
      <div className="bario">
        <div className="users1">
          <span class="material-symbols-outlined">arrow_back</span>
          <div className="circ">
            {broadcast && broadcast.image ? (
              <img
                src={`http://localhost:5000${broadcast.image}`}
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
            <span className="orang">{broadcast.name}</span>
            <span className="whi">Online</span>
          </section>
        </div>
        <div className="timeAndNumer">
          <span class="material-symbols-outlined">call</span>
          <span class="material-symbols-outlined">videocam</span>
          <span class="material-symbols-outlined">more_vert</span>
        </div>
      </div>

      <section className="chatContaner">
        {[...messages, ...files]
          .sort((a, b) => new Date(a.time) - new Date(b.time))
          .map((item, index) =>
            item.message ? (
              <span
                key={index}
                className={`spaner ${
                  item.senderId === user._id ? "sent" : "received"
                }`}
              >
                {item.message}
                <small className="time">
                  {new Date(item.time).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </small>
              </span>
            ) : (
              <span
                key={index}
                className={`spaner ${
                  item.senderId === user._id ? "sent" : "received"
                }`}
              >
                {item.fileName.match(/\.(jpg|jpeg|png|gif)$/) ? (
                  <img
                    src={item.url}
                    alt={item.fileName}
                    style={{ width: "100px", height: "100px" }}
                  />
                ) : item.fileName.match(/\.(mp3|wav|webm)$/) ? (
                  <audio controls>
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
            )
          )}
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
              <input type="file" id="addashi" onChange={handleChange} />
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
                  setCapturedImage(null);
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
                if (capturedImage) {
                  fetch(capturedImage)
                    .then((res) => res.blob())
                    .then((blob) => {
                      const file = new File([blob], "captured_image.jpg", {
                        type: "image/jpeg",
                      });
                      const reader = new FileReader();
                      reader.onload = () => {
                        socket.current.emit("newBroadcastFile", {
                          file: reader.result,
                          fileName: file.name,
                          members: broadcast.members,
                          senderId: user._id,
                          time: new Date().toISOString(),
                        });
                        const url = URL.createObjectURL(blob);
                        setFiles((prevFiles) => [
                          ...prevFiles,
                          {
                            file: reader.result,
                            fileName: file.name,
                            senderId: user._id,
                            time: new Date().toISOString(),
                            url,
                          },
                        ]);
                      };
                      reader.readAsArrayBuffer(file);
                    });
                  setCapturedImage(null);
                  setShowVideo(false);
                }
              }}
            >
              {capturedImage ? "Send" : "Close"}
            </button>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} className="can" />
        </div>
      )}
    </div>
  );
};

export default BroadcastChat;
