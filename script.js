let video = document.getElementById("video");
let canvas = document.getElementById("canvas");
let currentSnap = "";
let currentFriend = "";
let facingMode = "user";

let friends = JSON.parse(localStorage.getItem("friends")) || [
  "Alex",
  "Mia",
  "Jay",
  "Sam"
];

let chats = JSON.parse(localStorage.getItem("chats")) || {};
let stories = JSON.parse(localStorage.getItem("stories")) || [];

function saveAll() {
  localStorage.setItem("friends", JSON.stringify(friends));
  localStorage.setItem("chats", JSON.stringify(chats));
  localStorage.setItem("stories", JSON.stringify(stories));
}

function openPage(id) {
  document.querySelectorAll(".page").forEach(page => {
    page.classList.remove("active");
  });

  document.getElementById(id).classList.add("active");

  if (id === "chatsPage") loadChats();
  if (id === "storiesPage") loadStories();
}

async function startCamera() {
  try {
    let stream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: facingMode },
      audio: false
    });

    video.srcObject = stream;
  } catch (err) {
    alert("Camera blocked. Allow camera permission and use HTTPS.");
  }
}

function switchCamera() {
  facingMode = facingMode === "user" ? "environment" : "user";

  if (video.srcObject) {
    video.srcObject.getTracks().forEach(track => track.stop());
  }

  startCamera();
}

function takeSnap() {
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  let ctx = canvas.getContext("2d");
  ctx.drawImage(video, 0, 0);

  currentSnap = canvas.toDataURL("image/png");
  document.getElementById("previewImg").src = currentSnap;

  loadFriendSendList();
  openPage("previewPage");
}

function loadFriendSendList() {
  let box = document.getElementById("friendSendList");
  box.innerHTML = "";

  friends.forEach(friend => {
    box.innerHTML += `
      <div class="friendCard">
        <span class="bitmoji">🙂</span>
        <b>${friend}</b>
        <button onclick="sendSnap('${friend}')">Send Snap</button>
      </div>
    `;
  });
}

function sendSnap(friend) {
  let caption = document.getElementById("captionInput").value;

  if (!chats[friend]) chats[friend] = [];

  chats[friend].push({
    type: "snap",
    from: "me",
    image: currentSnap,
    caption: caption,
    time: new Date().toLocaleTimeString()
  });

  saveAll();

  alert("Snap sent to " + friend);
  document.getElementById("captionInput").value = "";
  openPage("chatsPage");
}

function postStory() {
  let caption = document.getElementById("captionInput").value;

  stories.unshift({
    image: currentSnap,
    caption: caption,
    time: new Date().toLocaleString()
  });

  saveAll();

  alert("Posted to story");
  document.getElementById("captionInput").value = "";
  openPage("storiesPage");
}

function loadChats() {
  let list = document.getElementById("chatList");
  list.innerHTML = "";

  friends.forEach(friend => {
    let last = chats[friend]?.length
      ? chats[friend][chats[friend].length - 1]
      : null;

    let preview = "Tap to chat";

    if (last) {
      preview = last.type === "snap" ? "📸 Sent a snap" : last.text;
    }

    list.innerHTML += `
      <div class="chatCard" onclick="openChat('${friend}')">
        <div>
          <span class="bitmoji">🙂</span>
          <b>${friend}</b>
          <div class="small">${preview}</div>
        </div>
        <span>›</span>
      </div>
    `;
  });
}

function openChat(friend) {
  currentFriend = friend;
  document.getElementById("chatTitle").innerText = friend;
  loadMessages();
  openPage("chatRoomPage");
}

function loadMessages() {
  let box = document.getElementById("messages");
  box.innerHTML = "";

  let messages = chats[currentFriend] || [];

  messages.forEach(msg => {
    if (msg.type === "snap") {
      box.innerHTML += `
        <div class="message ${msg.from}">
          <img src="${msg.image}">
          <p>${msg.caption || ""}</p>
          <small>${msg.time}</small>
        </div>
      `;
    } else {
      box.innerHTML += `
        <div class="message ${msg.from}">
          <p>${msg.text}</p>
          <small>${msg.time}</small>
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

  if (!chats[currentFriend]) chats[currentFriend] = [];

  chats[currentFriend].push({
    type: "chat",
    from: "me",
    text: text,
    time: new Date().toLocaleTimeString()
  });

  input.value = "";

  setTimeout(() => {
    chats[currentFriend].push({
      type: "chat",
      from: "them",
      text: fakeReply(),
      time: new Date().toLocaleTimeString()
    });

    saveAll();
    loadMessages();
  }, 700);

  saveAll();
  loadMessages();
}

function fakeReply() {
  let replies = [
    "lol 😂",
    "send another snap",
    "that’s crazy",
    "wyd?",
    "fire 🔥",
    "bet",
    "no way"
  ];

  return replies[Math.floor(Math.random() * replies.length)];
}

function addFriend() {
  let name = document.getElementById("friendName").value.trim();

  if (!name) return;
  if (friends.includes(name)) return alert("Friend already added");

  friends.push(name);
  chats[name] = [];

  document.getElementById("friendName").value = "";

  saveAll();
  loadChats();
}

function loadStories() {
  let box = document.getElementById("stories");
  box.innerHTML = "";

  if (stories.length === 0) {
    box.innerHTML = "<p style='text-align:center;'>No stories yet</p>";
    return;
  }

  stories.forEach((story, index) => {
    box.innerHTML += `
      <div class="storyCard">
        <img src="${story.image}">
        <h3>${story.caption || "My Story"}</h3>
        <p class="small">${story.time}</p>
        <button onclick="deleteStory(${index})">Delete</button>
      </div>
    `;
  });
}

function deleteStory(index) {
  stories.splice(index, 1);
  saveAll();
  loadStories();
}

startCamera();
loadChats();
