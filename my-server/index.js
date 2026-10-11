const express = require("express");
const app = express();
const port = process.env.PORT || 3000;
const morgan = require("morgan");
app.use(morgan("combined"));

const path = require("path");
const fs = require("fs");

// Serve static assets from public directory (images, etc.)
app.use(express.static(path.join(__dirname, "public")));

const cors = require("cors");
app.use(cors());

const bodyParser = require("body-parser");
app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ limit: "50mb", extended: true }));

// Default API
app.get("/", (req, res) => {
  res.send("UEL Space Restful API & Static Asset Server is running!");
});

// Mock database for spaces
let spacesDatabase = [
  {
    id: "b1-104",
    name: "Phòng B1.104",
    building: "Tòa nhà B1 - Tầng 1",
    spaceType: "Giảng đường",
    capacity: 50,
    capacityText: "50 người",
    areaSize: 60,
    status: "available",
    statusText: "Trống",
    equipment: ["Máy chiếu", "Điều hòa", "Wifi tốc độ cao"],
    image: "demo_space_card.png"
  },
  {
    id: "a2-1",
    name: "Phòng Họp A2.1",
    building: "Tòa nhà A - Tầng 2",
    spaceType: "Phòng họp",
    capacity: 15,
    capacityText: "15 người",
    areaSize: 30,
    status: "available",
    statusText: "Trống",
    equipment: ["Máy chiếu", "Điều hòa", "Bảng từ"],
    image: "demo_space_card.png"
  },
  {
    id: "thu-vien-2",
    name: "Khu tự học Thư viện",
    building: "Tòa nhà Thư viện - Tầng 2",
    spaceType: "Khu tự học",
    capacity: 120,
    capacityText: "120 người",
    areaSize: 200,
    status: "available",
    statusText: "Trống",
    equipment: ["Wifi tốc độ cao", "Điều hòa", "Ổ cắm điện"],
    image: "demo_space_card.png"
  },
  {
    id: "a3-301",
    name: "Giảng đường A3.301",
    building: "Tòa nhà A3 - Tầng 3",
    spaceType: "Giảng đường",
    capacity: 80,
    capacityText: "80 người",
    areaSize: 95,
    status: "available",
    statusText: "Trống",
    equipment: ["Máy chiếu", "Điều hòa", "Micro không dây"],
    image: "demo_space_card.png"
  },
  {
    id: "choi-1",
    name: "Chòi tự học 1",
    building: "Khuôn viên ngoài trời (Đường Thanh Niên)",
    spaceType: "Khu tự học",
    capacity: 8,
    capacityText: "8 người",
    areaSize: 15,
    status: "available",
    statusText: "Trống",
    equipment: ["Quạt trần", "Bàn ghế gỗ", "Ổ cắm điện"],
    image: "demo_space_card.png"
  },
  {
    id: "b2-101",
    name: "Phòng B2.101",
    building: "Tòa nhà B2 - Tầng 1",
    spaceType: "Phòng học",
    capacity: 45,
    capacityText: "45 người",
    areaSize: 55,
    status: "available",
    statusText: "Trống",
    equipment: ["Máy chiếu", "Điều hòa", "Wifi tốc độ cao"],
    image: "demo_space_card.png"
  }
];

// API: Lấy danh sách không gian
app.get("/spaces", (req, res) => {
  res.json(spacesDatabase);
});

// API: Chi tiết không gian theo ID
app.get("/spaces/:id", (req, res) => {
  const id = req.params["id"];
  const space = spacesDatabase.find((x) => x.id === id);
  if (!space) {
    return res.status(404).json({ message: "Không tìm thấy phòng!" });
  }
  res.json(space);
});

// ==========================================
// AUTHENTICATION & GOOGLE OAUTH 2.0 API
// ==========================================
const ADMIN_EMAILS = [
  "admin@uel.edu.vn",
  "quantri@uel.edu.vn",
  "system@uel.edu.vn"
];

app.post(["/api/auth/google", "/auth/google"], async (req, res) => {
  try {
    const { accessToken, idToken, email: devEmail, name: devName, picture: devPicture, isDevMock } = req.body;

    let email = "";
    let name = "Người dùng UEL";
    let picture = "";

    if (accessToken) {
      // Xác thực access token từ Google OAuth 2.0 (Custom Button Flow)
      const googleResponse = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
        headers: { Authorization: `Bearer ${accessToken}` }
      });

      if (!googleResponse.ok) {
        return res.status(401).json({
          success: false,
          error: "Phiên xác thực Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại!"
        });
      }

      const googlePayload = await googleResponse.json();
      email = (googlePayload.email || "").trim().toLowerCase();
      name = googlePayload.name || email.split("@")[0];
      picture = googlePayload.picture || "";
    } else if (idToken) {
      // Xác thực token chính thức với Google API
      const googleVerifyUrl = `https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`;
      const googleResponse = await fetch(googleVerifyUrl);

      if (!googleResponse.ok) {
        return res.status(401).json({
          success: false,
          error: "Mã xác thực Google không hợp lệ hoặc đã hết hạn. Vui lòng thử lại!"
        });
      }

      const googlePayload = await googleResponse.json();
      email = (googlePayload.email || "").trim().toLowerCase();
      name = googlePayload.name || email.split("@")[0];
      picture = googlePayload.picture || "";
    } else if (isDevMock && devEmail) {
      // Chế độ mô phỏng / kiểm thử cho Developer
      email = devEmail.trim().toLowerCase();
      name = devName || email.split("@")[0];
      picture = devPicture || "";
    } else {
      return res.status(400).json({
        success: false,
        error: "Yêu cầu không hợp lệ: Thiếu token hoặc thông tin xác thực Google!"
      });
    }

    // Kiểm tra quy tắc domain email trường UEL (@uel.edu.vn hoặc @st.uel.edu.vn)
    const isLecturerOrStaff = email.endsWith("@uel.edu.vn");
    const isStudent = email.endsWith("@st.uel.edu.vn");

    if (!isLecturerOrStaff && !isStudent) {
      return res.status(403).json({
        success: false,
        error: `Tài khoản (${email}) bị từ chối! Hệ thống chỉ chấp nhận tài khoản Google thuộc Trường Đại học Kinh tế - Luật (@uel.edu.vn hoặc @st.uel.edu.vn).`
      });
    }

    // Phân quyền (Role mapping):
    // 1. @st.uel.edu.vn -> STUDENT
    // 2. @uel.edu.vn -> LECTURER (hoặc ADMIN nếu nằm trong danh sách quản trị)
    let role = "STUDENT";
    let organization = "Sinh viên UEL";

    if (ADMIN_EMAILS.includes(email) || email.startsWith("admin")) {
      role = "ADMIN";
      organization = "Ban Quản lý Hạ tầng & Cơ sở vật chất UEL";
    } else if (isLecturerOrStaff) {
      role = "LECTURER";
      organization = "Giảng viên - Trường Đại học Kinh tế - Luật";
    } else {
      role = "STUDENT";
      organization = "Trường Đại học Kinh tế - Luật (UEL)";
    }

    const userId = isStudent 
      ? email.split("@")[0].toUpperCase() 
      : (role === "ADMIN" ? "ADMIN-001" : "GV-" + email.split("@")[0].toUpperCase());

    const userProfile = {
      id: userId,
      name: name,
      email: email,
      role: role,
      avatar: picture,
      organization: organization
    };

    return res.json({
      success: true,
      message: "Đăng nhập Google thành công!",
      user: userProfile,
      token: "uel-session-" + Buffer.from(email + ":" + Date.now()).toString("base64")
    });

  } catch (error) {
    console.error("Lỗi xác thực Google:", error);
    return res.status(500).json({
      success: false,
      error: "Đã xảy ra lỗi máy chủ trong quá trình xác thực tài khoản Google!"
    });
  }
});

// Start server
app.listen(port, () => {
  console.log(`UEL Space Server is listening on http://localhost:${port}`);
  console.log(`Static image assets are served at http://localhost:${port}/images/`);
});
