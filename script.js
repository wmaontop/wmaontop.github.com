let users = JSON.parse(localStorage.getItem("snap_users")) || {};
let chats = JSON.parse(localStorage.getItem("snap_chats")) || {};
let stories = JSON.parse(localStorage.getItem("snap_stories")) || [];

let currentUser = localStorage.getItem("snap_currentUser") || "";
let currentFriend = "";
let currentSnap = "";

let video = document.getElementById("video");
let canvas = document.getElementById("canvas");

let facingMode = "user";

function save() {
  localStorage.setItem("snap_users", JSON.stringify(users));
  localStorage.setItem("snap_chats", JSON.stringify(chats));
  localStorage.setItem("snap_stories", JSON.stringify(stories));
  localStorage.setItem("snap_currentUser", currentUser);
}

function openPage(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  if (id === "cameraPage") {
    document.getElementById("topUser").innerText = "@" + currentUser;
    startCamera();
  }

  if (id === "chatsPage") loadChats();
  if (id === "storiesPage") loadStories();
}

function register() {
  let username = document.getElementById("authUser").value.trim().toLowerCase();
  let password = document.getElementById("authPass").value;

  if (!username || !password) {
    return msg("Enter username and password.");
  }

  if (users[username]) {
    return msg("Username already exists.");
  }

  users[username] = {
    password: password,
    friends: []
  };

  currentUser = username;
  save();
  openPage("cameraPage");
}

function login() {
  let username = document.getElementById("authUser").value.trim().toLowerCase();
  let password = document.getElementById("authPass").value;

  if (!users[username]) {
    return msg("Account not found.");
  }

  if (users[username].password !== password) {
    return msg("Wrong password.");
  }

  currentUser = username;
  save();
  openPage("cameraPage");
}

function logout() {
  currentUser = "";
  localStorage.removeItem("snap_currentUser");
  openPage("authPage");
}

function msg(text) {
  document.getElementById("authMsg").innerText = text;
}

async function startCamera() {
  try {
    if (video.srcObject) {
      video.srcObject.getTracks().forEach(track => track.stop());
    }

    let stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: facingMode
      },
      audio: false
    });

    video.srcObject = stream;

    // This fixes the front camera mirror issue.
    video.style.transform = "scaleX(1)";
  } catch (error) {
    alert("Allow camera permission and use HTTPS.");
  }
}

function switchCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";
  startCamera();
}

function takeSnap() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let ctx = canvas.getContext("2d");

  // No mirroring here, so saved snaps match real left/right.
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  currentSnap = canvas.toDataURL("image/png");
  document.getElementById("previewImg").src = currentSnap;

  loadSendList();
  openPage("previewPage");
}

function addFriend() {
  let friend = document.getElementById("friendInput").value.trim().toLowerCase();

  if (!friend) return;

  if (!users[friend]) {
    return alert("That username does not exist.");
  }

  if (friend === currentUser) {
    return alert("You cannot add yourself.");
  }

  if (users[currentUser].friends.includes(friend)) {
    return alert("Already friends.");
  }

  users[currentUser].friends.push(friend);

  if (!users[friend].friends.includes(currentUser)) {
    users[friend].friends.push(currentUser);
  }

  document.getElementById("friendInput").value = "";
  save();
  loadChats();
}

function chatKey(a, b) {
  return [a, b].sort().join("_");
}

function loadChats() {
  let box = document.getElementById("chatList");
  box.innerHTML = "";

  let friends = users[currentUser].friends;

  if (friends.length === 0) {
    box.innerHTML = "<p style='text-align:center;'>Add a registered username to start chatting.</p>";
    return;
  }

  friends.forEach(friend => {
    let key = chatKey(currentUser, friend);
    let last = chats[key]?.length ? chats[key][chats[key].length - 1] : null;
    let preview = last ? (last.type === "snap" ? "📸 Snap" : last.text) : "Tap to chat";

    box.innerHTML += `
      <div class="card" onclick="openChat('${friend}')">
        <div>
          <b>@${friend}</b>
          <p>${preview}</p>
        </div>
        <span>›</span>
      </div>
    `;
  });
}

function openChat(friend) {
  currentFriend = friend;
  document.getElementById("chatTitle").innerText = "@" + friend;
  loadMessages();
  openPage("chatRoomPage");
}

function loadMessages() {
  let box = document.getElementById("messages");
  box.innerHTML = "";

  let key = chatKey(currentUser, currentFriend);
  let list = chats[key] || [];

  list.forEach(message => {
    let side = message.from === currentUser ? "me" : "them";

    if (message.type === "snap") {
      box.innerHTML += `
        <div class="message ${side}">
          <b>@${message.from}</b>
          <img src="${message.image}">
          <p>${message.caption || ""}</p>
          <small>${message.time}</small>
        </div>
      `;
    } else {
      box.innerHTML += `
        <div class="message ${side}">
          <b>@${message.from}</b>
          <p>${message.text}</p>
          <small>${message.time}</small>
        </div>
      `;
    }
  });

  box.scrollTop = box.scrollHeight;
}

function sendMessage() {
  let input = document.getElementById("messageInput");
  let text = input.value.trim();

  if (!text) return;

  let key = chatKey(currentUser, currentFriend);

  if (!chats[key]) {
    chats[key] = [];
  }

  chats[key].push({
    type: "chat",
    from: currentUser,
    text: text,
    time: new Date().toLocaleTimeString()
  });

  input.value = "";
  save();
  loadMessages();
}

function loadSendList() {
  let box = document.getElementById("sendList");
  box.innerHTML = "";

  let friends = users[currentUser].friends;

  if (friends.length === 0) {
    box.innerHTML = "<p style='text-align:center;'>No friends yet.</p>";
    return;
  }

  friends.forEach(friend => {
    box.innerHTML += `
      <div class="card">
        <b>@${friend}</b>
        <button onclick="sendSnap('${friend}')">Send</button>
      </div>
    `;
  });
}

function sendSnap(friend) {
  let caption = document.getElementById("captionInput").value;
  let key = chatKey(currentUser, friend);

  if (!chats[key]) {
    chats[key] = [];
  }

  chats[key].push({
    type: "snap",
    from: currentUser,
    image: currentSnap,
    caption: caption,
    time: new Date().toLocaleTimeString()
  });

  save();
  document.getElementById("captionInput").value = "";
  openPage("chatsPage");
}

function postStory() {
  let caption = document.getElementById("captionInput").value;

  stories.unshift({
    user: currentUser,
    image: currentSnap,
    caption: caption,
    time: new Date().toLocaleString()
  });

  save();
  document.getElementById("captionInput").value = "";
  openPage("storiesPage");
}

function loadStories() {
  let box = document.getElementById("stories");
  box.innerHTML = "";

  let visibleStories = stories.filter(story =>
    story.user === currentUser || users[currentUser].friends.includes(story.user)
  );

  if (visibleStories.length === 0) {
    box.innerHTML = "<p style='text-align:center;'>No stories yet.</p>";
    return;
  }

  visibleStories.forEach(story => {
    box.innerHTML += `
      <div class="story">
        <b>@${story.user}</b>
        <img src="${story.image}">
        <h3>${story.caption || ""}</h3>
        <small>${story.time}</small>
      </div>
    `;
  });
}

if (currentUser && users[currentUser]) {
  openPage("cameraPage");
}
