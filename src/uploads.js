'use strict';

const path = require('node:path');
const fs = require('node:fs');
const crypto = require('node:crypto');
const multer = require('multer');

// Файли зберігаємо поза кодом застосунку — у data/uploads.
// Каталог не потрапляє в git і копіюється разом із базою при резервному копіюванні.
const UPLOAD_DIR = path.join(__dirname, '..', 'data', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Дозволені розширення: договори у Word, PDF, таблиці, текст і скани.
const ALLOWED = new Set([
  '.doc', '.docx', '.rtf', '.odt', '.pdf',
  '.xls', '.xlsx', '.txt',
  '.jpg', '.jpeg', '.png',
]);
const MAX_SIZE = 25 * 1024 * 1024; // 25 МБ

const ALLOWED_HINT = 'Word (.doc, .docx), PDF, RTF, ODT, Excel (.xls, .xlsx), .txt '
  + 'або скан (.jpg, .png), до 25 МБ';

// Ім'я файлу на диску — випадкове: користувацьке ім'я ніколи не потрапляє
// у шлях, тож обхід каталогів (../) неможливий.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${crypto.randomBytes(16).toString('hex')}${ext}`);
  },
});

// Multer декодує ім'я файлу як latin1 — повертаємо коректний UTF-8,
// інакше українські назви перетворюються на «РґРѕРіРѕРІС–СЂ».
function decodeName(name) {
  const buf = Buffer.from(name, 'latin1');
  const utf8 = buf.toString('utf8');
  // Якщо після перекодування немає символів заміни — беремо його.
  return utf8.includes('�') ? name : utf8;
}

const upload = multer({
  storage,
  limits: { fileSize: MAX_SIZE, files: 10 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (!ALLOWED.has(ext)) {
      return cb(new Error(`Непідтримуваний тип файлу «${ext || 'без розширення'}». Дозволено: ${ALLOWED_HINT}.`));
    }
    cb(null, true);
  },
});

function filePath(storedName) {
  // Захист від виходу за межі каталогу навіть якщо в базі зіпсовані дані.
  const full = path.join(UPLOAD_DIR, path.basename(storedName));
  if (!full.startsWith(UPLOAD_DIR)) return null;
  return full;
}

function removeFile(storedName) {
  const full = filePath(storedName);
  if (full) fs.rmSync(full, { force: true });
}

// Людський розмір: 1536 -> «1,5 КБ».
function humanSize(bytes) {
  const n = Number(bytes) || 0;
  if (n < 1024) return `${n} Б`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1).replace('.', ',')} КБ`;
  return `${(n / (1024 * 1024)).toFixed(1).replace('.', ',')} МБ`;
}

module.exports = {
  upload, UPLOAD_DIR, ALLOWED_HINT, MAX_SIZE,
  filePath, removeFile, humanSize, decodeName,
};
