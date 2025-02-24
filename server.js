require("dotenv").config();
const express = require("express");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const WebSocket = require("ws");
const http = require("http");

const app = express();
const server = http.createServer(app); // Express 서버를 HTTP 서버로 감싸기
const wss = new WebSocket.Server({ server }); // WebSocket 서버 생성

const PORT = process.env.PORT || 3000;

// 미들웨어
app.use(cors());
app.use(express.json());

wss.on("connection", (ws) => {
  console.log("새로운 클라이언트 연결됨");

  // 클라이언트로부터 메시지 수신
  ws.on("message", (data) => {
    const messageData = JSON.parse(data);

    // 모든 연결된 클라이언트에게 메시지 브로드캐스트
    wss.clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(messageData));
      }
    });
  });

  // 연결 종료 처리
  ws.on("close", () => {
    console.log("클라이언트 연결 종료");
  });
});

// 루트 경로 login.html로 리다이렉트
app.get("/", (req, res) => {
  res.redirect("/login.html");
});

// 정적 파일 설정
app.use(express.static("public")); // HTML, CSS, JS 파일들을 제공하기 위한 정적 파일 서비스

const password = "password123";
const hashedPassword = bcrypt.hash(password, 10).then((hash) => {
  console.log(hash);
  return hash;
});

// 임시 사용자 데이터 (실제로는 데이터베이스를 사용해야 합니다)
let users = [];

async function initUsers() {
  const password = "password123";
  const hashedPassword = await bcrypt.hash(password, 10);

  users = [
    {
      username: "test",
      password: "$2a$10$wKEztUvZz7OjjLS0aWKd4udTm1cRNsaEMFJOePSiBByU6TItdZejm",
    },
    {
      username: "test2",
      password: "$2a$10$wKEztUvZz7OjjLS0aWKd4udTm1cRNsaEMFJOePSiBByU6TItdZejmt",
    },
  ];

  return users;
}

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";

// 로그인 엔드포인트
app.post("/api/login", async (req, res) => {
  const { username, password } = req.body;

  // 에러 처리
  try {
    // 사용자 찾기
    const user = users.find((u) => u.username === username);
    if (!user) {
      return res.status(401).json({ message: "사용자를 찾을 수 없습니다." });
    }

    // 비밀번호 확인
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ message: "비밀번호가 일치하지 않습니다." });
    }

    // JWT 토큰 생성
    const token = jwt.sign({ username: user.username }, JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ token, username: user.username });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "서버 오류가 발생했습니다." });
  }
});

// 토큰 검증 미들웨어
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.status(401).json({ message: "인증 토큰이 필요합니다." });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "유효하지 않은 토큰입니다." });
    }
    req.user = user;
    next();
  });
};

// 사용자 정보 확인 엔드포인트
app.get("/api/user", authenticateToken, (req, res) => {
  res.json({ username: req.user.username });
});

initUsers().then(() => {
  server.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
  });
});
