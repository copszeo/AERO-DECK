## Ringkasan

Jelaskan perubahan dan alasan utamanya dalam beberapa kalimat.

## Jenis perubahan

- [ ] Perbaikan bug
- [ ] Fitur
- [ ] UI atau aksesibilitas
- [ ] Test atau refactor
- [ ] Dokumentasi
- [ ] Dependency atau packaging

## Cara memverifikasi

Tuliskan command dan langkah manual yang dijalankan.

```text
npm run check
npm test
```

Jika menyentuh hotkey atau media, sertakan hasil yang relevan:

- Hotkey diuji:
- Layout keyboard:
- Kondisi aplikasi: fokus / background / minimized / tray
- Fixture audio/video dan format:
- Versi Windows:

## Checklist

- [ ] Perubahan fokus pada satu tujuan dan tidak memuat file yang tidak terkait.
- [ ] Saya sudah menjalankan `npm run check` dan `npm test`.
- [ ] Saya menambah atau memperbarui test untuk perubahan perilaku.
- [ ] Saya sudah menguji manual di Windows jika menyentuh hotkey global, tray, audio/video, path file, atau installer.
- [ ] Saya tidak menyertakan media pribadi, credential, dump library, atau path absolut pengguna.
- [ ] API preload/IPC baru dibatasi, memvalidasi input, dan memeriksa pengirim.
- [ ] Perubahan persistence tetap kompatibel atau menyertakan strategi recovery/migrasi.

## Screenshot atau catatan tambahan

Opsional. Samarkan username, path, nama file pribadi, dan isi media sebelum mengunggah gambar atau log.
