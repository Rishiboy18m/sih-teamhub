const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { get, query, run } = require('../db');
const { authenticateToken } = require('../middleware/auth');

// Storage configuration with serverless /tmp fallback
const uploadsDir = process.env.VERCEL ? '/tmp/uploads' : path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Allowed file extensions for Security (Section 26 requirement)
const ALLOWED_EXTENSIONS = [
  '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx', '.txt',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
  '.zip', '.tar', '.gz', '.rar', '.7z',
  '.py', '.js', '.jsx', '.ts', '.tsx', '.json', '.html', '.css', '.md', '.sql'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const sanitizedOriginal = path.basename(file.originalname).replace(/[^a-zA-Z0-9.-]/g, '_');
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${uniqueSuffix}-${sanitizedOriginal}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB Max File Size limit
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXTENSIONS.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type '${ext}' is not allowed for security reasons.`));
    }
  }
});

// GET all files for team
router.get('/', authenticateToken, async (req, res) => {
  try {
    const files = await query(
      `SELECT f.*, u.full_name as uploader_name, u.avatar as uploader_avatar
       FROM files f
       JOIN users u ON f.uploaded_by_id = u.id
       WHERE f.team_id = ?
       ORDER BY f.created_at DESC`,
      [req.user.teamId]
    );

    return res.json({ files });
  } catch (err) {
    console.error('Get files error:', err);
    return res.status(500).json({ error: 'Failed to fetch project files' });
  }
});

// UPLOAD file
router.post('/upload', authenticateToken, (req, res) => {
  upload.single('file')(req, res, async (err) => {
    if (err) {
      return res.status(400).json({ error: err.message || 'File upload failed' });
    }

    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const { category } = req.body;
      const fileCategory = category || 'Documents';

      const result = await run(
        `INSERT INTO files (team_id, uploaded_by_id, original_name, stored_name, file_size, file_type, category)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          req.user.teamId,
          req.user.userId,
          req.file.originalname,
          req.file.filename,
          req.file.size,
          req.file.mimetype,
          fileCategory
        ]
      );

      // Create notification
      await run(
        'INSERT INTO notifications (team_id, title, message, type, color) VALUES (?, ?, ?, ?, ?)',
        [req.user.teamId, 'File Uploaded', `${req.user.fullName} uploaded file: ${req.file.originalname}`, 'file_uploaded', 'blue']
      );

      const newFile = await get(
        `SELECT f.*, u.full_name as uploader_name, u.avatar as uploader_avatar
         FROM files f
         JOIN users u ON f.uploaded_by_id = u.id
         WHERE f.id = ?`,
        [result.id]
      );

      return res.status(201).json({ message: 'File uploaded successfully', file: newFile });
    } catch (dbErr) {
      console.error('Save file metadata error:', dbErr);
      return res.status(500).json({ error: 'Failed to save file metadata' });
    }
  });
});

// DOWNLOAD file
router.get('/download/:fileId', async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const fileRecord = await get('SELECT * FROM files WHERE id = ?', [fileId]);

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    const filePath = path.join(uploadsDir, fileRecord.stored_name);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File missing from server storage' });
    }

    return res.download(filePath, fileRecord.original_name);
  } catch (err) {
    console.error('Download file error:', err);
    return res.status(500).json({ error: 'Failed to download file' });
  }
});

// DELETE file
router.delete('/:fileId', authenticateToken, async (req, res) => {
  try {
    const fileId = req.params.fileId;
    const fileRecord = await get('SELECT * FROM files WHERE id = ? AND team_id = ?', [fileId, req.user.teamId]);

    if (!fileRecord) {
      return res.status(404).json({ error: 'File not found' });
    }

    if (req.user.role !== 'leader' && fileRecord.uploaded_by_id !== req.user.userId) {
      return res.status(403).json({ error: 'Permission denied. Only Team Leader or file owner can delete files.' });
    }

    const filePath = path.join(uploadsDir, fileRecord.stored_name);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await run('DELETE FROM files WHERE id = ? AND team_id = ?', [fileId, req.user.teamId]);
    return res.json({ message: 'File deleted successfully' });
  } catch (err) {
    console.error('Delete file error:', err);
    return res.status(500).json({ error: 'Failed to delete file' });
  }
});

module.exports = router;
