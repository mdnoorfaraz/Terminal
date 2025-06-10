let chatState = {
        active: false,
        recipient: null,
      };

      const firebaseConfig = {
        apiKey: "AIzaSyCTAm42uiGGfB8roKAJlNvbRtoD9qUSLoI",
        authDomain: "terminal-85d58.firebaseapp.com",
        projectId: "terminal-85d58",
        storageBucket: "terminal-85d58.appspot.com",
        messagingSenderId: "111224745444",
        appId: "1:111224745444:web:060c572bcea8ffab122bf1",
        measurementId: "G-5R74WSCFNL",
      };
      firebase.initializeApp(firebaseConfig);
      const auth = firebase.auth();
      const db = firebase.firestore();

      const commandInput = document.getElementById("commandInput");
      const output = document.getElementById("output");

      let loginStep = 0;
      let loginEmail = "";

      // Initialize chat box

      const COMMANDS = {
        "msg inbox": () => {
          if (!auth.currentUser) return " Please login to view messages.";

          db.collection("messages")
            .where("to", "==", auth.currentUser.email)
            .orderBy("timestamp", "desc")
            .limit(10)
            .get()
            .then((snapshot) => {
              if (snapshot.empty) {
                printOutput(" No messages found.");
                return;
              }
              let inbox = " Inbox:\n";
              snapshot.forEach((doc) => {
                const msg = doc.data();
                inbox += `From: ${msg.from}\nMsg: ${msg.text}\n\n`;
              });
              printOutput(inbox.trim());
            });

          return "";
        },

        "msg send": () => {
          printOutput("Use format: msg send <email> <your message>");

          // We handle actual sending inside the keydown listener below
          return "";
        },

        help: () =>
          `Available commands: help, dark, light, clear, cls, about, insta, email, map, login, logout, note add <text>, note show, msg send, msg inbox, exit`,

        about: () => `This is your personal terminal web app.`,

        dark: () => {
          document.body.classList.remove("bg-white", "text-black");
          document.body.classList.add("bg-black", "text-green-400");
          return "Switched to dark mode.";
        },

        light: () => {
          document.body.classList.remove("bg-black", "text-green-400");
          document.body.classList.add("bg-white", "text-black");
          return "Switched to light mode.";
        },

        clear: () => {
          output.innerHTML = "";
          return "";
        },

        cls: () => {
          output.innerHTML = "";
          return "";
        },

        insta: () => {
          window.open("https://instagram.com", "_blank");
          return "Opening Instagram...";
        },

        email: () => {
          window.open("https://mail.google.com", "_blank");
          return "Opening Gmail...";
        },

        map: () => {
          window.open("https://maps.google.com", "_blank");
          return "Opening Google Maps...";
        },
        man: () => {
          window.open("user-manual.html", "_blank");
          return "Opening Google Maps...";
        },

        logout: () => {
          auth.signOut();
          return "Logged out successfully.";
        },

        login: () => {
          loginStep = 1;
          return "Choose login method: [google] or [email]";
        },
        manual: () => `
===========================
   USER MANUAL - COMMANDS
===========================
help        - List all commands
manual      - Show this manual
login       - Login to your account
logout      - Logout from your account
whoami      - Show your user info
msg inbox   - View messages
msg send    - Send a message: msg send <email> <message>
dark/light  - Switch terminal themes
clear, cls  - Clear terminal
insta       - Open Instagram
email       - Open Gmail
map         - Open Google Maps
note show   - Show your notes
note add    - Add a note
exit        - Exit terminal
Type commands and press Enter.
===========================
`,

        // 👉 Add this new command here:
        whoami: () => {
          const user = firebase.auth().currentUser;

          if (user) {
            const username = user.displayName || user.email?.split("@")[0];
            const email = user.email;

            return `👤 Username: ${username}\n📧 Email: ${email}`;
          } else {
            return "⚠️ No user is currently logged in.";
          }
        },

        "note show": () => {
          if (!auth.currentUser) return "Please login to view notes.";
          db.collection("notes")
            .where("uid", "==", auth.currentUser.uid)
            .get()
            .then((snapshot) => {
              let result = "Your Notes:\n";
              snapshot.forEach((doc) => {
                result += `- ${doc.data().text}\n`;
              });
              printOutput(result.trim());
            });
          return "";
        },

        exit: () => {
          printOutput("Exiting terminal...");
          setTimeout(() => {
            window.location.href = "about:blank";
          }, 1000);
          return "Bye! Bye! Thank you for using this terminal.";
        },
      };

      // Show initial welcome message
      // Initialize Firebase Auth listener
      firebase.auth().onAuthStateChanged((user) => {
        if (user) {
          // Extract a "username" from displayName OR email
          const username = user.displayName || user.email?.split("@")[0]; // fallback to email prefix if no name

          // Show welcome with dynamic username
          showWelcomeMessage({ username });
        } else {
          // No user logged in
          showWelcomeMessage(null);
        }
      });
      function showWelcomeMessage(user) {
        const terminalWelcome = document.getElementById("terminal-welcome");

        if (user && user.username) {
          terminalWelcome.textContent = `Welcome '${user.username}' to your Personal Terminal`;
        } else {
          terminalWelcome.textContent = `Welcome to your Personal Terminal`;
        }
      }

      function printOutput(text, delay = 0) {
        const el = document.createElement("div");
        if (delay > 0) {
          el.textContent = "";
          output.appendChild(el);
          let i = 0;
          const interval = setInterval(() => {
            el.textContent += text[i++];
            if (i >= text.length) clearInterval(interval);
          }, delay);
        } else {
          el.textContent = text;
          output.appendChild(el);
        }
      }

      commandInput.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          const input = commandInput.value.trim();
          const div = document.createElement("div");
          div.innerHTML = `<div class='mb-1'>>> ${input}</div>`;
          output.appendChild(div);

          if (loginStep > 0) {
            if (loginStep === 1) {
              if (input === "google") {
                const provider = new firebase.auth.GoogleAuthProvider();
                auth
                  .signInWithPopup(provider)
                  .then(() => {
                    printOutput("Logged in as " + auth.currentUser.displayName);
                  })
                  .catch((err) => {
                    printOutput(" " + err.message);
                  });
                loginStep = 0;
              } else if (input === "email") {
                loginStep = 2;
                printOutput(" Enter your email:");
              } else {
                printOutput(' Invalid method. Type "google" or "email"');
              }
            } else if (loginStep === 2) {
              loginEmail = input;
              loginStep = 3;
              printOutput(" Enter your password:");
            } else if (loginStep === 3) {
              const password = input;
              auth
                .signInWithEmailAndPassword(loginEmail, password)
                .then(() => {
                  printOutput("Logged in as " + auth.currentUser.email);
                })
                .catch((err) => {
                  printOutput(" " + err.message);
                });
              loginStep = 0;
            } else if (command === "whoami") {
              showUserInfo(); // Call the function below
            }

            commandInput.value = "";
            window.scrollTo(0, document.body.scrollHeight);
            return;
          }

          // 🔹 Send a message
          if (input.startsWith("msg send")) {
            if (!auth.currentUser) {
              printOutput("Please login to send messages.");
            } else {
              const parts = input.split(" ");
              if (parts.length < 4) {
                printOutput("⚠️Use: msg send <email> <your message>");
              } else {
                const to = parts[2];
                const message = parts.slice(3).join(" ");
                db.collection("messages")
                  .add({
                    from: auth.currentUser.email,
                    to: to,
                    text: message,
                    timestamp: new Date(),
                  })
                  .then(() => {
                    printOutput("Message sent to " + to);
                  })
                  .catch((err) => {
                    printOutput("Error: " + err.message);
                  });
              }
            }
          }

          // 🔹 View inbox
          else if (input === "msg inbox") {
            if (!auth.currentUser) {
              printOutput("Please login to check messages.");
            } else {
              db.collection("messages")
                .where("to", "==", auth.currentUser.email)
                .orderBy("timestamp", "desc")
                .limit(10)
                .get()
                .then((snapshot) => {
                  if (snapshot.empty) {
                    printOutput("No messages in inbox.");
                  } else {
                    printOutput(" Your inbox:");
                    snapshot.forEach((doc) => {
                      const msg = doc.data();
                      printOutput(
                        `From: ${msg.from}\n ${msg.text}\n ${new Date(
                          msg.timestamp.toDate()
                        ).toLocaleString()}\n`
                      );
                    });
                  }
                })
                .catch((err) => {
                  printOutput("Error loading inbox: " + err.message);
                });
            }
          }

          // 🔹 Predefined terminal commands
          else if (COMMANDS[input]) {
            const result = COMMANDS[input]();
            if (result) printOutput(result);
          }

          // 🔹 Unknown command
          else {
            printOutput(`Unknown command: ${input}`);
          }

          const chatBox = document.getElementById("chatBox");
          const chatInput = document.getElementById("chatInput");
          const chatMessages = document.getElementById("chatMessages");
          const onlineStatus = document.getElementById("onlineStatus");

          let typingTimeout;

          // Update user's online status
          function setUserOnlineStatus() {
            if (!auth.currentUser) return;
            db.collection("users").doc(auth.currentUser.uid).set(
              {
                email: auth.currentUser.email,
                status: "online",
                typing: false,
              },
              { merge: true }
            );

            // Set offline when tab is closed
            window.addEventListener("beforeunload", () => {
              db.collection("users").doc(auth.currentUser.uid).update({
                status: "offline",
                typing: false,
              });
            });
          }

          // Start chat command
          COMMANDS["chat"] = () => {
            if (!auth.currentUser) return "Please login to start chat.";
            chatBox.style.display = "block";
            chatInput.focus();
            listenToChat();
            listenToUsers();
            setUserOnlineStatus();
            return "Chat started.";
          };

          // Send message on Enter
          chatInput.addEventListener("keydown", (e) => {
            if (!auth.currentUser) return;

            // Typing indicator
            db.collection("users")
              .doc(auth.currentUser.uid)
              .update({ typing: true });
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(() => {
              db.collection("users")
                .doc(auth.currentUser.uid)
                .update({ typing: false });
            }, 2000);

            if (e.key === "Enter" && chatInput.value.trim() !== "") {
              db.collection("chats").add({
                from: auth.currentUser.email,
                text: chatInput.value,
                timestamp: new Date(),
              });
              chatInput.value = "";
            }
          });

          // Listen to chat messages
          function listenToChat() {
            db.collection("chats")
              .orderBy("timestamp", "asc")
              .limitToLast(50)
              .onSnapshot((snapshot) => {
                chatMessages.innerHTML = "";
                snapshot.forEach((doc) => {
                  const msg = doc.data();
                  const line = document.createElement("div");
                  line.textContent = `<${msg.from}> ${msg.text}`;
                  chatMessages.appendChild(line);
                });
                chatMessages.scrollTop = chatMessages.scrollHeight;
              });
          }

          // Listen to online users
          function listenToUsers() {
            db.collection("users")
              .where("status", "==", "online")
              .onSnapshot((snapshot) => {
                let output = "--- Online Users ---\n";
                snapshot.forEach((doc) => {
                  const user = doc.data();
                  output += `- ${user.email}${
                    user.typing ? " [typing...]" : ""
                  }\n`;
                });
                output += "----------------------";
                onlineStatus.textContent = output;
              });
          }

          commandInput.value = "";
          window.scrollTo(0, document.body.scrollHeight);
        }
      });