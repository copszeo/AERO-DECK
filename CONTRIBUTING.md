# Berkontribusi ke AERO DECK

Terima kasih sudah membantu AERO DECK. Kontribusi kecil seperti memperjelas teks, menambah test, atau memperbaiki satu bug sangat diterima. Anda tidak harus membuka issue terlebih dahulu untuk perubahan kecil yang jelas.

## Sebelum membuat issue

Cari issue yang sudah ada agar diskusi tidak terpecah. Gunakan template yang sesuai dan sertakan informasi yang cukup untuk mengulang masalah.

Untuk bug hotkey, tuliskan:

- versi AERO DECK dan versi Windows;
- layout keyboard, misalnya US, Indonesian, atau layout lain;
- hotkey persis, misalnya `A`, `Ctrl+Shift+1`, atau `F9`;
- apakah **Hotkey global** aktif;
- apakah aplikasi sedang fokus, diminimalkan, atau berada di system tray;
- aplikasi lain yang mungkin memakai hotkey yang sama; dan
- apakah masalah selalu terjadi atau hanya sesekali.

Untuk bug audio/video, tuliskan:

- ekstensi file, misalnya `.mp3`, `.wav`, `.mp4`, atau `.webm`;
- codec jika diketahui;
- apakah file masih berada di lokasi semula;
- apakah file dapat diputar di aplikasi lain; dan
- urutan tindakan sebelum masalah muncul.

Jangan mengunggah media pribadi, file library AERO DECK, atau path pengguna lengkap. Ubah contoh seperti:

```text
C:\Users\Budi\Videos\acara-klien\rahasia.mp4
```

menjadi:

```text
C:\Users\<nama>\Videos\<folder>\contoh.mp4
```

Jika file diperlukan untuk reproduksi, gunakan fixture kecil yang dibuat khusus dan tidak memuat informasi pribadi atau materi berhak cipta.

## Menyiapkan lingkungan pengembangan

Prasyarat:

- Node.js 22;
- npm;
- Windows untuk verifikasi akhir global hotkey, tray, audio/video, dan installer.

Pasang dependency dan jalankan aplikasi:

```bash
npm ci
npm start
```

Jalankan pemeriksaan sebelum mengirim pull request:

```bash
npm run check
npm test
```

Build Windows yang tersedia:

```bash
npm run pack:win
npm run dist:win
```

`pack:win` membuat aplikasi unpacked, sedangkan `dist:win` membuat installer NSIS. Artifact pengembangan dapat belum ditandatangani secara digital.

## Peta kode singkat

- `src/main/`: lifecycle Electron, jendela, tray, IPC, global shortcut, media, dan persistence.
- `src/preload/`: API terbatas antara renderer dan main process.
- `src/renderer/`: dashboard serta player audio/video.
- `test/`: unit test yang berjalan tanpa GUI Electron.

Pertahankan boundary ini. Renderer tidak boleh memperoleh akses Node.js langsung. API preload dan channel IPC baru harus sesempit mungkin, memvalidasi input, dan memeriksa asal pengirim.

## Membuat perubahan

1. Fork repository dan buat branch dengan nama singkat, misalnya `fix/hotkey-shift-digit`.
2. Buat perubahan yang fokus pada satu tujuan.
3. Tambahkan atau perbarui test untuk perubahan perilaku.
4. Jalankan `npm run check` dan `npm test`.
5. Uji manual di Windows jika perubahan menyentuh hotkey global, tray, player, path file, atau installer.
6. Buka pull request dan jelaskan hasil verifikasinya.

Ikuti gaya kode yang sudah ada: CommonJS, `'use strict'`, indentasi dua spasi, semicolon, dan nama yang menjelaskan tujuan. Pertahankan bahasa Indonesia pada UI, dengan istilah teknis yang umum bila terjemahan justru membingungkan.

## Panduan test

Test baru sebaiknya deterministik dan tidak bergantung pada speaker, codec mesin, atau shortcut OS yang sedang tersedia. Gunakan temporary directory dan fake adapter untuk filesystem, player, atau API Electron bila memungkinkan.

Kasus penting meliputi:

- normalisasi dan konflik hotkey;
- register, unregister, capture mode, serta kegagalan registrasi hotkey;
- path dengan spasi, Unicode, dan karakter `#`;
- file hilang, tipe media tidak sesuai, dan JSON persistence rusak;
- pergantian audio/video secara cepat;
- queued playback dan perintah **Hentikan semua**; serta
- validasi payload dan pengirim IPC.

Test headless tidak menggantikan smoke test pada Windows. Perubahan media harus diuji dengan fixture nonpribadi, dan perubahan hotkey harus diuji saat aplikasi fokus maupun berada di background.

## Keamanan dan privasi

Jangan commit credential, token, data pengguna, media, dump library, atau path absolut dari komputer Anda. Jangan memperluas `nodeIntegration`, menonaktifkan `contextIsolation`/sandbox, atau menambah akses filesystem dari renderer tanpa alasan dan review keamanan yang jelas.

Kerentanan keamanan jangan dilaporkan melalui issue publik. Ikuti [SECURITY.md](SECURITY.md).
