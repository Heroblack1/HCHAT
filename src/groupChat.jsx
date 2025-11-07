import { useState, useRef, useEffect } from "react";
import axios from "axios";
import logo from "./assets/logo.png";
import { Link } from "react-router-dom";
import { useNavigate } from "react-router-dom";
import { useLocation } from "react-router-dom";

const GroupChat = ({ socket }) => {
  const [user, setUser] = useState({});
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);
  const [files, setFiles] = useState([]);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedFileName, setSelectedFileName] = useState("");
  const [groupMessages, setGroupMessages] = useState([]);
  const [recording, setRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaStream = useRef(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);
  const [showVideo, setShowVideo] = useState(false);
  const videoRef = useRef(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const canvasRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const group = location.state?.group;

  const API = import.meta.env.VITE_API_URL;

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

  // getting group messages
  useEffect(() => {
    axios
      .get(`${API}/home/dashboard/groupMessages?groupId=${group._id}`)
      .then((response) => {
        const messages = response.data;
        const files = messages.filter((message) => message.file);
        const updatedFiles = files.map((file) => {
          let type = "application/octet-stream";
          if (file.fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
            type = "image/jpeg";
          } else if (file.fileName.match(/\.(mp3|wav|webm)$/)) {
            type = "audio/webm";
          }
          const blob = new Blob([new Uint8Array(file.file.data)], { type });
          const url = URL.createObjectURL(blob);
          return { ...file, url, file: blob };
        });
        setMessages(messages.filter((message) => message.message));
        setFiles(updatedFiles);
      })
      .catch((error) => {
        console.error(error);
      });
  }, [group]);

  // emit and listen for group messages
  // useEffect(() => {
  //   if (group?._id) {
  //     socket.current.emit("joinGroup", group._id);
  //   }
  //   return () => {
  //     if (group?._id) {
  //       socket.current.emit("leaveGroup", group._id);
  //     }
  //   };
  // }, [socket, group]);

  useEffect(() => {
    if (socket.current && group?._id) {
      socket.current.emit("joinGroup", group._id);
      socket.current.emit("joinGroupPage", group._id);
    }
    return () => {
      if (socket.current && group?._id) {
        socket.current.emit("leaveGroup", group._id);
      }
    };
  }, [socket, group]);

  // useEffect(() => {
  //   const handleNewGroupMessage = (message) => {
  //     setMessages((prevMessages) => {
  //       if (
  //         prevMessages.some(
  //           (prevMessage) =>
  //             prevMessage.time === message.time &&
  //             prevMessage.senderId === message.senderId
  //         )
  //       ) {
  //         return prevMessages;
  //       }
  //       return [...prevMessages, message];
  //     });
  //   };

  const recvn = () => {
    if (!recording) {
      handleStartRecording();
    } else {
      handleStopRecording();
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
        const audioBlob = new Blob(audioChunks.current, {
          type: "audio/webm",
        });
        const url = URL.createObjectURL(audioBlob);
        const audio = new Audio(url);
        audio.play().catch((error) => {
          console.error("Error playing audio:", error);
        });
        const reader = new FileReader();
        reader.onload = () => {
          socket.current.emit("newGroupFile", {
            file: reader.result,
            fileName: "recording.webm",
            groupId: group._id,
            senderId: user._id,
            time: new Date().toISOString(),
          });
        };
        reader.readAsArrayBuffer(audioBlob);
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

  const handleStopRecording = () => {
    if (mediaRecorder.current) {
      mediaRecorder.current.stop();
    }
  };

  useEffect(() => {
    const handleNewGroupMessage = (message) => {
      if (message.groupId === group._id) {
        setMessages((prevMessages) => {
          if (
            prevMessages.some(
              (prevMessage) =>
                prevMessage.time === message.time &&
                prevMessage.senderId === message.senderId
            )
          ) {
            return prevMessages;
          }
          return [...prevMessages, message];
        });
      }
    };

    const handleNewGroupFile = (fileData) => {
      if (fileData && fileData.groupId === group?._id) {
        setFiles((prevFiles) => {
          if (
            prevFiles.some(
              (prevFile) =>
                prevFile.time === fileData.time &&
                prevFile.senderId === fileData.senderId
            )
          ) {
            return prevFiles;
          }
          const currentTime = new Date().toISOString();
          let type = "application/octet-stream";
          if (fileData.fileName.match(/\.(jpg|jpeg|png|gif)$/)) {
            type = "image/jpeg";
          } else if (fileData.fileName.match(/\.(mp3|wav|webm)$/)) {
            type = "audio/webm";
          }
          if (fileData.file) {
            const blob = new Blob([new Uint8Array(fileData.file)], { type });
            const url = URL.createObjectURL(blob);
            return [
              ...prevFiles,
              { ...fileData, time: currentTime, url, file: blob },
            ];
          } else {
            console.error("File data is null or undefined.");
            return prevFiles;
          }
        });
      }
    };

    socket.current.on("newGroupMessage", handleNewGroupMessage);
    socket.current.on("newGroupFile", handleNewGroupFile);

    return () => {
      socket.current.off("newGroupMessage", handleNewGroupMessage);
      socket.current.off("newGroupFile", handleNewGroupFile);
    };
  }, [socket]);

  const sendMessage = async (e) => {
    console.log(messages);
    const currentTime = new Date().toISOString();
    if (groupMessages && message.trim() !== "") {
      socket.current.emit("newGroupMessage", {
        message: message,
        groupId: group._id,
        senderId: user._id,
        time: currentTime,
      });
      setMessages((prevMessages) => [
        ...prevMessages,
        {
          message: message,
          senderId: user._id,
          time: currentTime,
        },
      ]);
      setMessage("");
    }
  };

  const sendFile = async () => {
    if (selectedFile && socket.current && group?._id) {
      const img = new Image();
      img.src = URL.createObjectURL(selectedFile);
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        canvas.width = img.width / 2; // resize the image to half its original size
        canvas.height = img.height / 2;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          const reader = new FileReader();
          reader.onload = () => {
            socket.current.emit("newGroupFile", {
              file: reader.result,
              fileName: selectedFile.name,
              groupId: group._id,
              senderId: user._id,
              time: new Date().toISOString(),
            });
          };
          reader.readAsArrayBuffer(blob);
        }, selectedFile.type);
      };
      setSelectedFile(null);
      setSelectedFileName("");
    } else {
      console.error("Selected file, socket, or group is null or undefined.");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setSelectedFile(file);
    setSelectedFileName(file.name);
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

  const snap = async () => {
    if (!videoRef.current) return;
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (canvas && video) {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const context = canvas.getContext("2d");
      context.drawImage(video, 0, 0);
      const imageDataURL = canvas.toDataURL("image/jpeg");
      // Send the captured image
      fetch(imageDataURL)
        .then((res) => res.blob())
        .then((blob) => {
          const file = new File([blob], "captured_image.jpg", {
            type: "image/jpeg",
          });
          const reader = new FileReader();
          reader.onload = () => {
            socket.current.emit("newGroupFile", {
              file: reader.result,
              fileName: file.name,
              groupId: group._id,
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
      setShowVideo(false);
    }
  };

  return (
    <div className="bodyy1">
      <div className="bario">
        <div className="users1">
          <span class="material-symbols-outlined">arrow_back</span>
          <div className="circ">
            {group.image ? (
              <img
                src={`${API}${group.image}`}
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
            <span className="orang">{group.name}</span>
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
          .map((item, index) => (
            <span
              key={index}
              className={`spaner ${
                item.senderId === user._id ? "sent" : "received"
              }`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems:
                  item.senderId === user._id ? "flex-end" : "flex-start",
              }}
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
              ) : item.fileName ? (
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
              ) : null}
            </span>
          ))}
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
              <input type="file" id="addashi" onChange={handleFileChange} />
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
        {message.trim() !== "" ? (
          <button onClick={sendMessage} className="nahbut">
            <span class="material-symbols-outlined">send</span>
          </button>
        ) : selectedFile ? (
          <button onClick={sendFile} className="nahbut">
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

            {capturedImage && (
              <button
                style={{ marginLeft: "10px" }}
                onClick={() => {
                  fetch(capturedImage)
                    .then((res) => res.blob())
                    .then((blob) => {
                      const file = new File([blob], "captured_image.jpg", {
                        type: "image/jpeg",
                      });
                      const reader = new FileReader();
                      reader.onload = () => {
                        socket.current.emit("newGroupFile", {
                          file: reader.result,
                          fileName: file.name,
                          groupId: group._id,
                          senderId: user._id,
                          time: new Date().toISOString(),
                        });
                      };
                      reader.readAsArrayBuffer(file);
                    });
                  setShowVideo(false);
                }}
              >
                Send
              </button>
            )}

            <button
              style={{ marginLeft: "10px" }}
              onClick={() => setShowVideo(false)}
            >
              Close
            </button>
          </div>
          <canvas ref={canvasRef} style={{ display: "none" }} />
        </div>
      )}
    </div>
  );
};

export default GroupChat;
