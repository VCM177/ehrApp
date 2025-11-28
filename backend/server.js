const express = require('express');
const cors = require('cors');
const fs = require('fs-extra');
const path = require('path');
//const { v4: uuidv4 } = require('uuid');
let uuidv4;

(async () => {
    // Sử dụng import() động
    const { v4 } = await import('uuid');
    uuidv4 = v4;

    // Bắt đầu ứng dụng hoặc các hàm cần uuidv4 sau khi import thành công
    console.log("UUID module loaded.");
    // Ví dụ: console.log(uuidv4());
    
    // Tiếp tục khởi động server ở đây
    // Khởi động server (ví dụ: app.listen(...))
    // ...
})();

const app = express();
const PORT = 5000; // Server này sẽ chạy ở port 5000

// Middleware
app.use(cors()); // Cho phép request từ Frontend (ví dụ: localhost:3000)
app.use(express.json({ limit: '50mb' })); // Cho phép nhận JSON payload lớn (để chứa file mã hóa)

// Đường dẫn thư mục lưu trữ
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// Đảm bảo thư mục uploads tồn tại khi server khởi động
fs.ensureDirSync(UPLOADS_DIR);

// ================= ROUTES =================

// Route kiểm tra server có sống không
app.get('/', (req, res) => {
    res.send('MediChain Off-chain Storage Server is running!');
});

/**
 * API: Upload EHR đã mã hóa
 * Method: POST
 * Endpoint: /api/upload
 * Body (JSON): { "encryptedData": "chuỗi_base64_dữ_liệu", "iv": "chuỗi_base64_iv" }
 * Response: { "success": true, "offChainAddress": "unique-file-id" }
 */
app.post('/api/upload', async (req, res) => {
    try {
        const { encryptedData, iv } = req.body;

        if (!encryptedData || !iv) {
            return res.status(400).json({ success: false, message: 'Missing encryptedData or iv' });
        }

        // Tạo một ID duy nhất cho file này (đây sẽ là offChainAddress trên blockchain)
        const fileId = uuidv4();
        const filePath = path.join(UPLOADS_DIR, `${fileId}.json`);

        // Dữ liệu để lưu xuống file
        const fileContent = {
            id: fileId,
            encryptedData: encryptedData,
            iv: iv,
            timestamp: new Date().toISOString()
        };

        // Ghi file JSON xuống đĩa
        await fs.writeJson(filePath, fileContent);
        console.log(`[UPLOAD] File saved: ${fileId}.json`);

        // Trả về ID cho frontend
        res.json({ success: true, offChainAddress: fileId });

    } catch (error) {
        console.error('[UPLOAD ERROR]', error);
        res.status(500).json({ success: false, message: 'Server error during upload' });
    }
});

/**
 * API: Download EHR đã mã hóa
 * Method: GET
 * Endpoint: /api/download/:fileId
 * Response (JSON): { "id": "...", "encryptedData": "...", "iv": "..." }
 */
app.get('/api/download/:fileId', async (req, res) => {
    try {
        const fileId = req.params.fileId;
        const filePath = path.join(UPLOADS_DIR, `${fileId}.json`);

        // Kiểm tra file có tồn tại không
        if (!await fs.pathExists(filePath)) {
            return res.status(404).json({ success: false, message: 'File not found' });
        }

        // Đọc file JSON từ đĩa
        const fileContent = await fs.readJson(filePath);
        console.log(`[DOWNLOAD] File retrieved: ${fileId}.json`);

        // Trả về nội dung file
        res.json(fileContent);

    } catch (error) {
        console.error('[DOWNLOAD ERROR]', error);
        res.status(500).json({ success: false, message: 'Server error during download' });
    }
});

// ================= START SERVER =================
app.listen(PORT, () => {
    console.log(`\n--- MediChain Off-chain Server running on http://localhost:${PORT} ---`);
    console.log(`Storage directory: ${UPLOADS_DIR}\n`);
});