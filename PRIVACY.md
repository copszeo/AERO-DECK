# Privasi AERO DECK

AERO DECK dirancang sebagai aplikasi lokal.

## Data yang disimpan

Aplikasi menyimpan konfigurasi berikut di folder data aplikasi milik pengguna:

- nama dan warna pad;
- lokasi file media yang dipilih;
- hotkey, volume, dan pengaturan loop;
- status apakah hotkey global diaktifkan.

File audio dan video asli tidak disalin, diunggah, atau dihapus oleh AERO DECK.

## Jaringan dan telemetri

Versi 1.0.0 tidak memiliki akun pengguna, analitik, iklan, telemetri, atau
sinkronisasi cloud. Aplikasi tidak mengirim konfigurasi maupun media ke server
pengembang.

Koneksi internet hanya diperlukan ketika pengguna mengunduh installer dari
GitHub atau ketika developer memasang dependency/build tool.

## Menghapus data

Uninstall aplikasi tidak selalu menghapus konfigurasi pengguna. Untuk reset
manual, tutup AERO DECK lalu hapus folder data aplikasi AERO DECK dari
`%APPDATA%`.

Untuk pertanyaan privasi, buka issue di repository tanpa menyertakan file media,
path lokal lengkap, atau informasi pribadi.
