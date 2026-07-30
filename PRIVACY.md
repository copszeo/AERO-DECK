# Privasi AERO DECK

AERO DECK dirancang sebagai aplikasi lokal.

## Data yang disimpan

Aplikasi menyimpan konfigurasi berikut di folder data aplikasi milik pengguna:

- nama dan warna pad;
- lokasi file media yang dipilih;
- hotkey, volume, mode playback, dan pengaturan loop;
- konfigurasi action pad, termasuk target aplikasi/file/folder, URL/URI,
  shortcut yang akan dikirim, teks yang akan diketik, perintah multimedia,
  tujuan deck, dan langkah automasi;
- deck aktif dan urutan pad;
- pengaturan hotkey global, startup Windows, dan mulai diminimalkan.

File audio dan video asli tidak disalin, diunggah, atau dihapus oleh AERO DECK.
Action hanya dijalankan setelah pengguna memicu kartu atau hotkey-nya; import
backup tidak otomatis menjalankan action.

## Jaringan dan telemetri

Versi 1.2.0 tidak memiliki akun pengguna, analitik, iklan, telemetri, atau
sinkronisasi cloud. Aplikasi tidak mengirim konfigurasi maupun media ke server
pengembang.

Pengecekan update tidak berjalan otomatis. Jika pengguna menekan tombol
**Cek update**, aplikasi meminta metadata rilis terbaru dari GitHub Releases dan
mengirim informasi jaringan yang lazim pada request HTTPS, termasuk alamat IP
serta versi AERO DECK pada header `User-Agent`. Request tersebut tidak memuat
deck, hotkey, path lokal, file media, maupun isi library.

Koneksi internet juga digunakan di luar aplikasi ketika pengguna mengunduh
installer dari GitHub atau developer memasang dependency/build tool.

Action **Website** dapat membuka URL atau URI melalui browser/aplikasi handler
Windows. Setelah dibuka, aplikasi atau layanan pihak ketiga tersebut dapat
melakukan koneksi jaringan menurut kebijakan privasinya sendiri. AERO DECK tidak
meneruskan isi library lain ke target tersebut.

Action **Buka** juga dapat menjalankan aplikasi yang dipilih pengguna. Bila
aplikasi itu memakai internet, komunikasinya berada di luar kendali AERO DECK.

## Input keyboard dan action Windows

Hotkey global digunakan untuk mengenali shortcut pad yang dikonfigurasi.
AERO DECK tidak menyimpan riwayat seluruh tombol yang diketik di aplikasi lain.

Action **Kirim hotkey** dan **Ketik teks** menyimulasikan input keyboard Windows
ke jendela yang sedang aktif. AERO DECK hanya mengirim kombinasi atau teks yang
disimpan pada action; hasilnya bergantung pada fokus serta layout keyboard
Windows. Action **Tutup aplikasi** menggunakan path executable yang dipilih dan
dapat menghentikan proses secara paksa bila pengguna mengaktifkan opsi tersebut.

## Backup

File backup JSON menyimpan konfigurasi, path lengkap file media/target, URL,
hotkey, teks action, dan langkah automasi, tetapi tidak menyalin audio atau
video. Data tersebut dapat memperlihatkan nama pengguna, struktur folder, atau
teks pribadi.

Backup bukan dokumen pasif. Action dari backup dapat membuka/menutup aplikasi,
membuka URL/URI, mengirim hotkey, atau mengetik teks setelah pengguna memicunya.
Impor hanya backup buatan sendiri atau dari pihak yang benar-benar tepercaya.
Jangan unggah backup ke issue publik tanpa memeriksa serta menyensor isinya.

## Menghapus data

Uninstall aplikasi tidak selalu menghapus konfigurasi pengguna. Untuk reset
manual, tutup AERO DECK lalu hapus folder data aplikasi AERO DECK dari
`%APPDATA%`.

Untuk pertanyaan privasi, buka issue di repository tanpa menyertakan file media,
path lokal lengkap, atau informasi pribadi.
