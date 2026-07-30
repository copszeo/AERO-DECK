# Changelog

Semua perubahan penting AERO DECK dicatat di dokumen ini. Format mengikuti
[Keep a Changelog](https://keepachangelog.com/en/1.1.0/) dan versi mengikuti
[Semantic Versioning](https://semver.org/).

## [1.2.0] - 2026-07-30

### Ditambahkan

- Action pad Windows dengan editor visual untuk membuka aplikasi, file, atau
  folder; membuka website/URI; mengirim hotkey; mengetik teks dan Enter;
  mengontrol multimedia; serta berpindah deck.
- Action **Tutup aplikasi** yang mencocokkan executable secara persis dan
  menyediakan opsi penutupan paksa.
- Builder automasi untuk menjalankan langkah secara berurutan (`Sequence`),
  bersamaan (`Bersamaan`/parallel), acak (`Random`), atau bergantian antara dua
  keadaan (`Toggle`).
- Langkah `Delay` dan referensi media pad untuk menyertakan audio/video dalam
  automasi.
- Status action pad, pesan kegagalan, dan pemicu hotkey global yang tetap bekerja
  saat dashboard berada di latar belakang.

### Diubah

- Format library naik ke schema v3. Library v1/v2 dimigrasikan otomatis tanpa
  mengubah konfigurasi media lama.
- Validasi library kini menjaga referensi media dan deck. Media atau deck yang
  masih digunakan action pad tidak dapat dihapus secara tidak sengaja.
- Stop All kini turut meminta pembatalan action yang masih berjalan.
- Backup JSON mencakup action pad dan seluruh langkah automasinya.

### Keamanan dan privasi

- Target open/close, URL, hotkey, teks, kedalaman automasi, jumlah langkah,
  delay, dan referensi library divalidasi sebelum disimpan atau dijalankan.
- Target action diteruskan sebagai data ke adapter Windows, bukan digabungkan ke
  command line pengguna.
- Backup harus berasal dari sumber tepercaya karena action di dalamnya dapat
  membuka/menutup aplikasi, mengirim input keyboard, dan membuka URL setelah
  dipicu.
- Pengetikan menggunakan simulasi keyboard Windows dan mengikuti layout serta
  fokus jendela aktif.

## [1.1.0] - 2026-07-30

### Ditambahkan

- Beberapa deck untuk memisahkan pad berdasarkan aktivitas, lengkap dengan
  tambah, ganti nama, hapus, dan pemilihan deck aktif.
- Drag-and-drop untuk menyusun ulang pad di dalam deck.
- Empat mode playback per pad: `exclusive`, `restart`, `toggle`, dan `overlap`.
- Hotkey global **Stop All** yang dapat diubah dari Settings; nilai default
  `Ctrl+Alt+F12`.
- Opsi menjalankan AERO DECK bersama Windows dan memulai aplikasi dalam keadaan
  diminimalkan.
- Export dan import backup JSON untuk deck, pad, serta pengaturan.
- Halaman Settings/About dengan versi aplikasi, lokasi data, shortcut, startup,
  backup, tautan rilis, dan pengecekan update manual.

### Diubah

- Library versi lama dimigrasikan ke deck awal tanpa mengubah file media asli.
- Hotkey pad hanya didaftarkan untuk deck aktif. Kombinasi yang sama dapat
  digunakan pada deck berbeda.
- Playback audio mendukung beberapa instance untuk mode `overlap`; player video
  tetap menggunakan satu sesi pada satu waktu.

### Privasi dan distribusi

- Pengecekan update hanya menghubungi GitHub Releases setelah pengguna menekan
  tombol **Cek update**; media dan isi library tidak dikirim.
- Backup menyimpan referensi path media, bukan salinan file audio/video.
- Installer publik masih unsigned dan dapat menampilkan **Unknown publisher**.
  Verifikasi sumber unduhan serta checksum SHA-256 sebelum menjalankannya.

## [1.0.0] - 2026-07-30

### Ditambahkan

- Media pad audio dan video dengan tampilan desktop modern.
- Global hotkey untuk A–Z, 0–9, F1–F12, dan kombinasi modifier.
- Player terpisah yang tetap bekerja ketika dashboard berada di latar belakang.
- System tray dengan aksi buka, jeda hotkey, hentikan media, dan keluar.
- Pengaturan volume, warna pad, loop, pencarian, edit, dan hapus.
- Penyimpanan konfigurasi lokal dengan penulisan atomik dan pemulihan data rusak.
- Deteksi konflik hotkey serta status registrasi yang dapat dilihat pengguna.
- Installer NSIS Windows x64.
- Pengujian otomatis dan workflow CI untuk macOS serta Windows.

[1.2.0]: https://github.com/copszeo/AERO-DECK/releases/tag/v1.2.0
[1.1.0]: https://github.com/copszeo/AERO-DECK/releases/tag/v1.1.0
[1.0.0]: https://github.com/copszeo/AERO-DECK/releases/tag/v1.0.0
