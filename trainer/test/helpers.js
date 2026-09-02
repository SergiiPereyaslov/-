'use strict';

const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// Кожен тестовий файл працює зі своєю базою: жодного спільного стану.
function useTempDb(name) {
  const file = path.join(os.tmpdir(), `trainer-test-${name}-${process.pid}.db`);
  for (const suffix of ['', '-wal', '-shm']) {
    if (fs.existsSync(file + suffix)) fs.unlinkSync(file + suffix);
  }
  process.env.TRAINER_DB = file;
  return file;
}

module.exports = { useTempDb };
