# Panduan penggunaan

## 1. Instal AERO DECK

1. Unduh installer terbaru dari halaman
   [Releases](https://github.com/copszeo/AERO-DECK/releases/latest).
2. Jalankan `AERO-DECK-Setup-<versi>.exe`.
3. Pilih lokasi instalasi lalu selesaikan wizard.
4. Buka AERO DECK dari Desktop atau Start Menu.

Build publik awal belum ditandatangani sertifikat komersial. Windows SmartScreen
dapat menampilkan peringatan **Unknown publisher**. Selalu unduh installer dari
repository resmi dan cocokkan checksum SHA-256 yang tersedia di release.

## 2. Tambahkan media

1. Klik **Tambah media**.
2. Pilih **Audio** atau **Video**.
3. Pilih file dari komputer.
4. Isi nama pad.
5. Klik kolom hotkey, lalu tekan tombol atau kombinasi yang diinginkan.
6. Atur warna, volume, dan loop.
7. Klik **Simpan ke pad**.

Pad juga dapat dibuat dengan menarik file ke dashboard.

## 3. Gunakan di latar belakang

Hotkey global aktif secara default. Dashboard boleh diminimalkan atau
disembunyikan dengan tombol **×**; AERO DECK tetap berjalan di system tray.

Tombol satu karakter seperti `A` atau `1` ikut aktif ketika Anda mengetik di
aplikasi lain. Gunakan kombinasi seperti `Ctrl+Alt+1` atau jeda **Hotkey global**
dari sidebar/system tray ketika sedang mengetik.

## 4. Audio untuk Discord atau streaming

AERO DECK memutar audio ke output Windows yang aktif. Agar audio masuk sebagai
mikrofon, gunakan virtual audio cable lalu pilih routing output yang sesuai di
Windows dan aplikasi tujuan.

## 5. Video untuk OBS

Tambahkan source **Window Capture** di OBS dan pilih **AERO DECK Player**.
Jendela player mempertahankan rasio video serta dapat dibuat fullscreen atau
selalu di atas.

## Pemecahan masalah

### Hotkey tidak bekerja

- Pastikan toggle **Hotkey global** aktif.
- Periksa apakah kartu status menampilkan hotkey bermasalah.
- Ganti hotkey karena shortcut mungkin sudah dipakai Windows atau aplikasi lain.
- Coba kombinasi `Ctrl+Alt+<tombol>`.
- Buka ulang AERO DECK dari system tray.

### Media gagal diputar

- Pastikan file belum dipindahkan atau dihapus.
- Gunakan MP3/WAV untuk audio atau MP4 H.264/AAC/WebM untuk video.
- Coba putar file dengan aplikasi Windows lain untuk memastikan file tidak rusak.

### Aplikasi terlihat tertutup

Tombol **×** menyembunyikan dashboard ke system tray. Klik ikon AERO DECK pada
tray untuk membukanya kembali. Pilih **Keluar** dari menu tray untuk menghentikan
aplikasi sepenuhnya.
