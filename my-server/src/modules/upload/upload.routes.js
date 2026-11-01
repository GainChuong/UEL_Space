const { Router } = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

/**
 * Tạo tên file theo chuẩn: ngày_tháng_năm_giờ_phút_giây
 * Ví dụ: 01_11_2026_10_07_35.jpg
 * Giúp loại bỏ hoàn toàn cache cũ và luôn luôn lấy dữ liệu hình ảnh mới nhất từ server
 */
function formatDateTimeFilename(originalName = '') {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  const day = pad(now.getDate());
  const month = pad(now.getMonth() + 1);
  const year = now.getFullYear();
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  const ext = (path.extname(originalName) || '.jpg').toLowerCase();
  return `${day}_${month}_${year}_${hours}_${minutes}_${seconds}${ext}`;
}

const targetServerDir = path.join(__dirname, '../../../public/images/spaces');
const targetFrontendDir = path.join(__dirname, '../../../../frontend/public/images/spaces');

if (!fs.existsSync(targetServerDir)) {
  fs.mkdirSync(targetServerDir, { recursive: true });
}
if (!fs.existsSync(targetFrontendDir)) {
  fs.mkdirSync(targetFrontendDir, { recursive: true });
}

// Multer Storage với tên file là ngày_tháng_năm_giờ_phút_giây
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, targetServerDir);
  },
  filename: (req, file, cb) => {
    const filename = formatDateTimeFilename(file.originalname);
    cb(null, filename);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 } // 15MB limit
});

function uploadRoutes() {
  const router = Router();

  // 1. Upload bằng multipart/form-data (File input thông qua formData)
  router.post('/', upload.single('file'), (req, res) => {
    try {
      if (!req.file) {
        // Kiểm tra xem có gửi dạng base64 trong JSON không
        if (req.body && (req.body.imageBase64 || req.body.image || req.body.data)) {
          return handleBase64Upload(req, res);
        }
        return res.status(400).json({ success: false, message: 'Vui lòng đính kèm file ảnh cần tải lên' });
      }

      const filename = req.file.filename;
      const serverPath = path.join(targetServerDir, filename);
      const frontendPath = path.join(targetFrontendDir, filename);

      // Đồng bộ sang thư mục public của frontend để dev server đọc được ngay lập tức
      try {
        fs.copyFileSync(serverPath, frontendPath);
      } catch (copyErr) {
        console.warn('[Upload] Đồng bộ sang frontend folder cảnh báo:', copyErr.message);
      }

      const relativePath = `spaces/${filename}`;
      const url = `/images/spaces/${filename}`;

      return res.status(201).json({
        success: true,
        message: 'Tải ảnh lên máy chủ thành công với tên định danh thời gian mới nhất',
        filename,
        relativePath,
        url,
        timestamp: filename.replace(/\.[^/.]+$/, '')
      });
    } catch (err) {
      console.error('[Upload] Lỗi xử lý upload file:', err);
      return res.status(500).json({ success: false, message: 'Lỗi máy chủ khi lưu file ảnh: ' + err.message });
    }
  });

  // 2. Upload dạng Base64 JSON
  router.post('/base64', (req, res) => {
    handleBase64Upload(req, res);
  });

  function handleBase64Upload(req, res) {
    try {
      const raw = req.body.imageBase64 || req.body.image || req.body.data;
      if (!raw) {
        return res.status(400).json({ success: false, message: 'Dữ liệu base64 không hợp lệ' });
      }

      const matches = raw.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let ext = '.jpg';
      let buffer;

      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = '.png';
        else if (mime.includes('webp')) ext = '.webp';
        else if (mime.includes('gif')) ext = '.gif';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(raw, 'base64');
      }

      const originalName = req.body.filename || `upload${ext}`;
      const filename = formatDateTimeFilename(originalName);

      const serverPath = path.join(targetServerDir, filename);
      const frontendPath = path.join(targetFrontendDir, filename);

      fs.writeFileSync(serverPath, buffer);
      try {
        fs.copyFileSync(serverPath, frontendPath);
      } catch (_) {}

      const relativePath = `spaces/${filename}`;
      const url = `/images/spaces/${filename}`;

      return res.status(201).json({
        success: true,
        message: 'Tải ảnh base64 lên máy chủ thành công',
        filename,
        relativePath,
        url,
        timestamp: filename.replace(/\.[^/.]+$/, '')
      });
    } catch (err) {
      console.error('[Upload] Lỗi xử lý upload base64:', err);
      return res.status(500).json({ success: false, message: 'Lỗi xử lý ảnh base64: ' + err.message });
    }
  }

  // 3. API cung cấp timestamp hiện tại theo chuẩn ngày_tháng_năm_giờ_phút_giây để client gắn cache-busting
  router.get('/timestamp', (req, res) => {
    const filename = formatDateTimeFilename('now.jpg');
    const timestamp = filename.replace('.jpg', '');
    res.json({
      timestamp,
      formatted: timestamp.replace(/_/g, ' ')
    });
  });

  return router;
}

module.exports = { uploadRoutes, formatDateTimeFilename };

