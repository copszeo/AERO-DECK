'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const AUDIO_EXTENSIONS = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac', 'opus'];
const VIDEO_EXTENSIONS = ['mp4', 'webm', 'mov', 'mkv', 'm4v', 'avi'];

function classifyMedia(filePath) {
  const extension = path.extname(String(filePath ?? '')).slice(1).toLowerCase();
  if (AUDIO_EXTENSIONS.includes(extension)) return 'audio';
  if (VIDEO_EXTENSIONS.includes(extension)) return 'video';
  return '';
}

function inspectMediaFile(filePath) {
  const sourcePath = String(filePath ?? '').trim();
  if (/^(?:\\\\|\/\/)/.test(sourcePath)) {
    throw new Error('Lokasi media jaringan atau device path tidak didukung.');
  }
  const normalizedPath = path.resolve(sourcePath);
  if (!fs.existsSync(normalizedPath) || !fs.statSync(normalizedPath).isFile()) {
    throw new Error('File media tidak ditemukan.');
  }

  const type = classifyMedia(normalizedPath);
  if (!type) {
    throw new Error('Format file belum didukung.');
  }

  return {
    path: normalizedPath,
    type,
    name: path.parse(normalizedPath).name,
    fileName: path.basename(normalizedPath)
  };
}

function serializePad(pad) {
  if (pad.type === 'action') {
    const hasLocalTarget = ['open', 'close'].includes(pad.action?.type);
    const targetPath = hasLocalTarget ? String(pad.action.target || '') : '';
    const exists = hasLocalTarget ? fs.existsSync(targetPath) : true;
    return {
      ...pad,
      exists,
      fileName: targetPath ? path.basename(targetPath) : '',
      mediaUrl: ''
    };
  }
  const exists = fs.existsSync(pad.mediaPath);
  return {
    ...pad,
    exists,
    fileName: path.basename(pad.mediaPath),
    mediaUrl: exists ? pathToFileURL(pad.mediaPath).href : ''
  };
}

module.exports = {
  AUDIO_EXTENSIONS,
  VIDEO_EXTENSIONS,
  classifyMedia,
  inspectMediaFile,
  serializePad
};
