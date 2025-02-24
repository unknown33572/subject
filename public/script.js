// API 엔드포인트
const API_URL = "http://localhost:3000/api";

// 로그인 상태 확인
async function checkLoginStatus() {
  const token = localStorage.getItem("token");
  const currentPage = window.location.pathname;

  if (token) {
    try {
      const response = await fetch(`${API_URL}/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        if (currentPage.includes("login.html")) {
          window.location.href = "index.html";
        }
      } else {
        // 토큰이 유효하지 않은 경우
        localStorage.removeItem("token");
        localStorage.removeItem("username");
        if (currentPage.includes("index.html")) {
          window.location.href = "login.html";
        }
      }
    } catch (error) {
      console.error("Auth check error:", error);
      if (currentPage.includes("index.html")) {
        window.location.href = "login.html";
      }
    }
  } else {
    if (currentPage.includes("index.html")) {
      window.location.href = "login.html";
    }
  }
}

// 페이지 로드 시 로그인 상태 확인
document.addEventListener("DOMContentLoaded", () => {
  checkLoginStatus();

  // 로그인 폼 처리
  const loginForm = document.getElementById("loginForm");
  if (loginForm) {
    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const username = document.getElementById("username").value;
      const password = document.getElementById("password").value;

      try {
        const response = await fetch(`${API_URL}/login`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        const data = await response.json();

        if (response.ok) {
          localStorage.setItem("token", data.token);
          localStorage.setItem("username", data.username);
          window.location.href = "index.html";
        } else {
          alert(data.message || "로그인에 실패했습니다.");
        }
      } catch (error) {
        console.error("Login error:", error);
        alert("서버 오류가 발생했습니다.");
      }
    });
  }

  // 로그아웃 버튼 처리
  const logoutBtn = document.getElementById("logoutBtn");
  if (logoutBtn) {
    logoutBtn.addEventListener("click", () => {
      localStorage.removeItem("token");
      localStorage.removeItem("username");
      window.location.href = "login.html";
    });
  }

  // 사용자 이름 표시
  const userDisplay = document.getElementById("userDisplay");
  if (userDisplay) {
    const username = localStorage.getItem("username");
    userDisplay.textContent = `${username}님`;
  }

  // 채팅 입력 처리
  const chatInput = document.querySelector(".chat-input input");
  const chatSendButton = document.querySelector(".chat-input button");
  const chatBox = document.querySelector(".chat-box");

  // WebSocket 연결
  const ws = new WebSocket("ws://localhost:3000/ws");

  ws.onopen = () => {
    console.log("WebSocket 연결됨");
  };

  ws.onmessage = (event) => {
    const message = JSON.parse(event.data);
    displayMessage(message);
  };

  ws.onerror = (error) => {
    console.error("WebSocket 에러:", error);
  };

  ws.onclose = () => {
    console.log("WebSocket 연결 종료");
  };

  // 메시지 전송 함수
  function sendMessage() {
    const message = chatInput.value.trim();
    if (message) {
      const username = localStorage.getItem("username");
      const messageData = {
        type: "chat",
        username: username,
        message: message,
        timestamp: new Date().toISOString(),
      };

      ws.send(JSON.stringify(messageData));
      chatInput.value = "";
    }
  }

  // 메시지 표시 함수
  function displayMessage(messageData) {
    const messageElement = document.createElement("div");
    messageElement.className = "chat-message";
    messageElement.innerHTML = `
      <strong>${messageData.username}:</strong> 
      <span>${messageData.message}</span>
      <small>${new Date(messageData.timestamp).toLocaleTimeString()}</small>
    `;
    chatBox.appendChild(messageElement);
    chatBox.scrollTop = chatBox.scrollHeight;
  }

  // 전송 버튼 클릭 이벤트
  chatSendButton.addEventListener("click", sendMessage);

  // Enter 키 입력 이벤트
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      sendMessage();
    }
  });
});

document.addEventListener("DOMContentLoaded", () => {
  const pokemonCard = document.querySelector(".pokemon-card");

  pokemonCard.addEventListener("click", function (e) {
    if (
      e.target.classList.contains("form-control") ||
      e.target.classList.contains("btn")
    ) {
      return;
    }
    this.classList.toggle("flipped");
  });
});
