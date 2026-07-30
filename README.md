<p align="center">
  <img src="assets/icon.png" alt="Logo AERO DECK" width="112" height="112">
</p>

<h1 align="center">AERO DECK</h1>

<p align="center">
  Media dan automation deck desktop untuk Windows.<br>
  Putar audio/video atau jalankan aksi Windows dari hotkey, bahkan saat aplikasi berada di latar belakang.
</p>

<p align="center">
  <strong>Alternatif gratis dan open-source untuk workflow keyboard yang biasanya dijalankan lewat Stream Deck.</strong><br>
  Gunakan keyboard yang sudah Anda punya, tanpa harus membeli perangkat tambahan.
</p>

<p align="center">
  <a href="https://github.com/copszeo/AERO-DECK/actions">
    <img src="https://img.shields.io/github/actions/workflow/status/copszeo/AERO-DECK/ci.yml?branch=main&label=CI&style=flat-square" alt="Status CI">
  </a>
  <a href="https://github.com/copszeo/AERO-DECK/releases/latest">
    <img src="https://img.shields.io/github/v/release/copszeo/AERO-DECK?display_name=tag&sort=semver&style=flat-square" alt="Rilis terbaru">
  </a>
  <a href="#lisensi">
    <img src="https://img.shields.io/badge/lisensi-MIT-2ea44f?style=flat-square" alt="Lisensi MIT">
  </a>
  <img src="https://img.shields.io/badge/harga-gratis-7C3AED?style=flat-square" alt="Gratis">
  <img src="https://img.shields.io/badge/platform-Windows%2010%20%7C%2011-0078D4?logo=windows&logoColor=white&style=flat-square" alt="Windows 10 dan 11">
  <img src="https://img.shields.io/badge/Electron-43.2.0-47848F?logo=electron&logoColor=white&style=flat-square" alt="Electron 43.2.0">
</p>

<p align="center">
  <a href="https://github.com/copszeo/AERO-DECK/releases/latest"><strong>⬇ Download Latest Release</strong></a>
  ·
  <a href="#mulai-cepat">Mulai cepat</a>
  ·
  <a href="https://github.com/copszeo/AERO-DECK/issues">Laporkan masalah</a>
</p>

---

AERO DECK mengubah keyboard menjadi kumpulan media dan action pad. Gunakan huruf,
angka, `F1`–`F12`, atau kombinasi seperti `Ctrl+Alt+7` untuk memutar media,
membuka aplikasi, mengirim shortcut, mengetik teks, atau menjalankan rangkaian
aksi tanpa harus kembali ke dashboard.

> [!NOTE]
> AERO DECK adalah proyek independen dan tidak berafiliasi, disponsori, atau
> didukung oleh Elgato, Corsair, maupun pihak lain. Aplikasi ini ditujukan sebagai
> alternatif perangkat lunak gratis, bukan pengganti seluruh fitur perangkat
> keras atau ekosistem [Elgato Stream Deck](https://www.elgato.com/stream-deck).
> Nama dan merek dagang
> terkait tetap menjadi milik pemegangnya masing-masing.

## Pratinjau

| Dashboard pad dan aksi | Builder automasi visual |
| --- | --- |
| ![Dashboard pad dan aksi AERO DECK](docs/screenshots/dashboard.png) | ![Builder automasi visual AERO DECK](docs/screenshots/editor.png) |

## Fitur utama

- **Pad audio dan video** — satu dashboard untuk suara, musik, klip, dan video.
- **Action pad Windows** — buka aplikasi/file/folder, tutup aplikasi, buka
  website/URI, kirim hotkey, ketik teks, atau kontrol multimedia.
- **Automasi visual** — susun `Sequence`, `Bersamaan`, `Random`, dan `Toggle`
  menggunakan langkah media, aksi, pindah deck, serta `Delay`.
- **Hotkey global** — picu media atau aksi dengan huruf, angka, tombol fungsi,
  atau kombinasi modifier.
- **Beberapa deck** — pisahkan pad menurut aktivitas; hanya hotkey deck aktif yang didaftarkan.
- **Urutan fleksibel** — susun ulang pad dalam deck dengan drag-and-drop.
- **Empat mode playback** — pilih `exclusive`, `restart`, `toggle`, atau `overlap` per pad.
- **Stop All global** — hentikan media dan minta pembatalan action dari mana pun.
- **Mode background dan system tray** — hotkey tetap tersedia saat dashboard disembunyikan.
- **Video player terpisah** — mendukung kontrol video, layar penuh, dan mode selalu di atas.
- **Kontrol per pad** — atur nama, warna, volume, hotkey, dan pemutaran berulang.
- **Startup opsional** — jalankan bersama Windows dan mulai dalam keadaan diminimalkan.
- **Backup konfigurasi** — ekspor dan impor deck, pad, serta pengaturan dalam satu file JSON.
- **Settings dan About** — kelola shortcut, startup, backup, lokasi data, serta cek update manual.
- **Pencarian dan file drop** — temukan pad dengan cepat atau jatuhkan file langsung ke aplikasi.
- **Status yang jelas** — lihat media yang sedang diputar, konflik hotkey, dan file sumber yang hilang.
- **Penyimpanan lokal** — konfigurasi tersimpan di perangkat; file media asli tetap di lokasinya.

## Mulai cepat

### Persyaratan

- Windows 10 atau Windows 11, 64-bit.
- File audio atau video yang tersimpan di drive lokal maupun drive yang selalu tersedia.

### Instalasi

1. Buka halaman [Latest Release](https://github.com/copszeo/AERO-DECK/releases/latest).
2. Unduh installer `AERO-DECK-Setup-<versi>.exe`.
3. Jalankan installer, pilih lokasi pemasangan, lalu buka AERO DECK dari Desktop atau Start Menu.
4. Pilih **Tambah media** untuk audio/video atau **Tambah aksi** untuk aksi
   Windows dan automasi.
5. Simpan pad, lalu tekan kartu atau hotkey untuk mengujinya.

> [!IMPORTANT]
> Installer publik saat ini belum ditandatangani dengan sertifikat code signing,
> sehingga Windows SmartScreen dapat menampilkan **Unknown publisher**. Unduh hanya
> dari halaman Releases resmi dan cocokkan checksum SHA-256 yang disertakan. Jangan
> mengabaikan peringatan untuk file yang sumber atau checksum-nya berbeda.

Panduan lebih lengkap tersedia di [docs/USAGE.md](docs/USAGE.md).

## Deck dan mode playback

Deck membantu memisahkan pad, misalnya untuk streaming, rapat, atau game. Hotkey
boleh digunakan kembali pada deck yang berbeda karena hanya deck aktif yang
didaftarkan. Menghapus deck turut menghapus konfigurasi pad di dalamnya, tetapi
tidak menghapus file media asli.

| Mode | Perilaku |
| --- | --- |
| `exclusive` | Menghentikan seluruh media yang aktif, lalu memulai pad ini. |
| `restart` | Menghentikan instance pad yang sama lalu memulainya dari awal; audio lain tetap berjalan. |
| `toggle` | Menghentikan pad jika sedang aktif, atau memulainya jika belum aktif. |
| `overlap` | Membuat instance audio baru pada setiap pemicu agar bunyi dapat bertumpuk. |

Player video tetap menggunakan satu sesi pada satu waktu. Karena itu, video baru
akan menggantikan video yang sedang aktif meskipun mode pad-nya `overlap`.

## Action pad dan automasi

Action pad menjalankan pekerjaan lokal yang Anda konfigurasi melalui builder
visual. Hotkey action pad memakai sistem global yang sama dengan media pad.

| Aksi | Perilaku |
| --- | --- |
| **Buka** | Membuka aplikasi, file, atau folder lokal yang dipilih. |
| **Tutup aplikasi** | Menutup proses yang executable-nya cocok persis; opsi **paksa** tersedia bila aplikasi tidak dapat ditutup secara normal. |
| **Website** | Membuka HTTP(S), `mailto:`, atau URI aplikasi yang diizinkan: Discord, Obsidian, Spotify, dan Steam. |
| **Kirim hotkey** | Mengirim kombinasi keyboard ke aplikasi yang sedang menerima input. |
| **Ketik teks** | Mengetik teks yang disimpan dan, bila dipilih, menekan Enter. |
| **Kontrol multimedia** | Previous, play/pause, next, stop, mute, volume up, atau volume down. |
| **Pindah deck** | Mengaktifkan deck tujuan dan mengganti hotkey deck yang terdaftar. |
| **Sequence** | Menjalankan langkah satu per satu sesuai urutan. |
| **Bersamaan** | Memulai hingga delapan langkah secara paralel. |
| **Random** | Menjalankan satu pilihan secara acak. |
| **Toggle** | Bergantian menjalankan dua keadaan setiap kali dipicu. |

Langkah automasi dapat merujuk media pad pada deck yang sama dan menggunakan
**Delay**. Menghapus media atau deck yang masih dirujuk aksi akan ditolak agar
automasi tidak diam-diam rusak. Pengecualian: menghapus satu deck boleh ikut
menghapus action dan referensi yang seluruhnya berada di dalam deck itu.

`Sequence` menganggap langkah media selesai setelah permintaan playback
dikirim; ia tidak menunggu durasi audio/video hingga habis. `Toggle` mengingat
keadaan selama sesi aplikasi berjalan dan kembali ke keadaan pertama setelah
AERO DECK dimulai ulang. Stop All meminta pembatalan langkah yang masih berjalan,
tetapi tidak membatalkan pekerjaan OS yang sudah selesai, seperti aplikasi yang
telanjur dibuka.

> [!WARNING]
> Action pad dapat membuka atau menutup aplikasi dan mengetik ke jendela aktif.
> Aktifkan opsi **paksa** hanya bila Anda menerima risiko kehilangan pekerjaan
> yang belum disimpan. Impor backup hanya dari sumber tepercaya karena backup
> juga dapat memuat konfigurasi action pad.

Action sistem tertentu hanya bekerja pada Windows. Fitur **Ketik teks** memakai
simulasi keyboard Windows, sehingga hasil karakter mengikuti layout keyboard,
bahasa, fokus jendela, dan perilaku aplikasi tujuan.

## Hotkey dan system tray

Hotkey global bekerja selama proses AERO DECK masih berjalan, termasuk ketika dashboard tidak terlihat.

- Tombol tunggal seperti `A`, `5`, atau `F8` dapat memicu media maupun aksi ketika Anda sedang mengetik atau bekerja di aplikasi lain. Untuk pemakaian umum, kombinasi seperti `Ctrl+Alt+5` lebih aman.
- Windows atau aplikasi lain dapat lebih dahulu memakai sebuah kombinasi. Jika AERO DECK menandai hotkey sebagai bermasalah, pilih kombinasi lain.
- Saat editor atau perekam hotkey terbuka, registrasi global dapat dijeda sementara agar input tidak memicu pad.
- Hotkey **Stop All** default adalah `Ctrl+Alt+F12` dan dapat diubah di **Settings**.
- **Stop All** didaftarkan terpisah agar tetap dapat menghentikan media ketika hotkey pad sedang dinonaktifkan.
- Saat action sedang mengirim hotkey atau teks, seluruh shortcut global—termasuk Stop All—dijeda singkat agar input tidak ditangkap kembali oleh AERO DECK. Tombol Stop All di dashboard dan menu tray tetap dapat digunakan.
- Tombol **×** pada dashboard menyembunyikan aplikasi ke system tray; tombol tersebut bukan perintah keluar.
- Gunakan menu tray untuk membuka dashboard, mengaktifkan atau menjeda hotkey global, menghentikan semua media, atau keluar sepenuhnya.
- Untuk sementara mematikan seluruh shortcut tanpa menghapus pemetaan, nonaktifkan toggle **Hotkey global**.

## Startup, backup, dan update

- Opsi **Jalankan bersama Windows** berlaku pada aplikasi Windows yang sudah
  dipasang. Opsi **Mulai diminimalkan** membuat peluncuran berikutnya langsung
  berjalan di background/system tray.
- Export backup menyimpan deck, pad, hotkey, action, dan pengaturan, termasuk
  **path file media**, target aplikasi/file/folder, URL, serta teks action.
  File audio/video itu sendiri tidak masuk ke dalam backup.
- Import mengganti library dan pengaturan saat ini setelah konfirmasi. Simpan
  backup sebelum berpindah perangkat; media harus tetap tersedia pada path yang
  sama atau dipilih kembali melalui editor.
- File backup dapat memperlihatkan nama pengguna dan struktur folder. Perlakukan
  sebagai data pribadi dan jangan unggah ke issue publik. Impor hanya backup
  tepercaya: konfigurasi di dalamnya dapat membuka/menutup aplikasi, mengirim
  hotkey, atau mengetik teks ketika pad kemudian dipicu.
- Tombol **Cek update** melakukan request ke GitHub hanya ketika ditekan. AERO
  DECK tidak memeriksa update otomatis dan tidak mengirim media atau library.

## Format media

AERO DECK menerima ekstensi berikut:

| Jenis | Ekstensi |
| --- | --- |
| Audio | `.mp3`, `.wav`, `.ogg`, `.m4a`, `.aac`, `.flac`, `.opus` |
| Video | `.mp4`, `.webm`, `.mov`, `.mkv`, `.m4v`, `.avi` |

Ekstensi file tidak menjamin codec di dalamnya dapat diputar oleh Chromium/Electron. Untuk kompatibilitas terbaik, gunakan:

- Audio: MP3 atau WAV.
- Video: MP4 dengan H.264/AAC, atau WebM dengan VP8/VP9 dan Opus.

Jika sebuah file diterima tetapi gagal diputar, konversikan file ke salah satu kombinasi di atas lalu pilih kembali file tersebut pada editor pad.

## Penggunaan bersama OBS, Discord, dan aplikasi streaming

AERO DECK mengirim audio ke perangkat output Windows yang sedang aktif. Agar suara masuk sebagai mikrofon Discord, voice chat, atau mixer streaming, gunakan perangkat audio virtual dan atur routing audio Windows sesuai kebutuhan.

Untuk video, tambahkan **Window Capture** di OBS dan pilih jendela **AERO DECK Player**.

## Pemecahan masalah

| Masalah | Yang perlu diperiksa |
| --- | --- |
| Hotkey tidak merespons | Pastikan **Hotkey global** aktif, editor sudah ditutup, dan kombinasi tidak dipakai Windows atau aplikasi lain. Coba kombinasi dengan `Ctrl` atau `Alt`. |
| Hotkey mengganggu saat mengetik | Hindari hotkey satu tombol atau jeda hotkey global dari dashboard maupun menu tray. |
| Tidak ada suara | Periksa volume pad, volume Windows, perangkat output aktif, dan Volume Mixer. |
| Video gagal diputar | Gunakan MP4 H.264/AAC atau WebM, lalu pastikan file dapat diputar di aplikasi lain. |
| Pad menampilkan **File hilang** | Edit pad dan pilih kembali file sumber. AERO DECK menyimpan referensi lokasi, bukan salinan media. |
| Dashboard menghilang setelah menekan **×** | Aplikasi sedang berjalan di system tray. Klik ikon AERO DECK untuk membukanya kembali. |
| Suara tidak masuk ke Discord/OBS | Atur perangkat audio virtual sebagai rute output/input; AERO DECK tidak membuat perangkat mikrofon virtual. |
| Aksi hotkey/teks masuk ke aplikasi yang salah | Pastikan jendela tujuan sedang fokus sebelum memicu action pad. |
| Teks menghasilkan karakter berbeda | Samakan layout keyboard Windows dengan layout yang digunakan saat membuat aksi. |
| Aplikasi tidak dapat ditutup | Pastikan executable yang dipilih sama persis dengan proses yang berjalan. Opsi paksa dapat menghentikan proses, tetapi berisiko menghilangkan data yang belum disimpan. |

Jika masalah tetap terjadi, buka [GitHub Issue](https://github.com/copszeo/AERO-DECK/issues/new) dan sertakan versi AERO DECK, versi Windows, langkah reproduksi, serta format media yang digunakan. Jangan unggah media pribadi atau data sensitif.

## Privasi dan keamanan

- AERO DECK dirancang **local-first**: tidak memerlukan akun dan tidak mengunggah media melalui fitur aplikasinya.
- File media tidak disalin, dimodifikasi, atau dihapus. Aplikasi menyimpan referensi path dan konfigurasi pad di direktori data aplikasi pengguna Windows.
- Hanya shortcut yang dipilih pengguna yang didaftarkan sebagai global shortcut; aplikasi tidak memerlukan perekaman seluruh input keyboard.
- Action pad menjalankan operasi OS hanya setelah kartu atau hotkey-nya dipicu.
  Karena action dapat membuka/menutup aplikasi dan menyimulasikan input,
  konfigurasi serta backup harus diperlakukan sebagai data aktif.
- Renderer Electron menggunakan context isolation dan sandbox, dengan akses sistem dibatasi melalui API preload.
- Pengecekan update manual menghubungi GitHub Releases dengan versi aplikasi saat
  ini hanya setelah pengguna memilih **Cek update**.
- Selalu ambil installer dari [Releases resmi](https://github.com/copszeo/AERO-DECK/releases) dan cocokkan checksum jika tersedia.

Untuk melaporkan kerentanan, gunakan [private vulnerability report](https://github.com/copszeo/AERO-DECK/security/advisories/new). Hindari memublikasikan detail eksploitasi pada issue umum sebelum pemelihara sempat menanganinya.

Dokumen proyek: [panduan penggunaan](docs/USAGE.md) ·
[matriks fitur Stream Deck](docs/STREAM_DECK_FEATURE_MATRIX.md) ·
[privasi](PRIVACY.md) · [keamanan](SECURITY.md) ·
[code signing](docs/CODE_SIGNING.md) ·
[checklist rilis](docs/RELEASE_CHECKLIST.md)

## Pengembangan

### Menjalankan dari source

Prasyarat: Git, Node.js versi LTS terbaru, dan npm.

```bash
git clone https://github.com/copszeo/AERO-DECK.git
cd AERO-DECK
npm ci
npm start
```

### Perintah proyek

| Perintah | Kegunaan |
| --- | --- |
| `npm start` | Menjalankan aplikasi dalam mode pengembangan. |
| `npm test` | Menjalankan unit test dengan Node.js test runner. |
| `npm run check` | Memeriksa sintaks source utama, preload, dan renderer. |
| `npm run pack:win` | Membuat build Windows tanpa installer. |
| `npm run dist:win` | Membuat installer NSIS Windows x64 di direktori `release/`. |

Build distribusi Windows paling konsisten bila dijalankan pada Windows atau runner CI Windows.

### Struktur proyek

```text
assets/          Ikon dan aset aplikasi
src/main/        Lifecycle Electron, hotkey, tray, media, action runner, dan penyimpanan
src/preload/     Jembatan API terisolasi untuk dashboard dan player
src/renderer/    Dashboard serta UI player audio/video
test/            Unit test hotkey, media, penyimpanan, dan playback queue
```

## Roadmap

Roadmap berikut adalah arah pengembangan dan bukan janji tanggal rilis:

- [ ] Pilihan perangkat output audio dan monitor tujuan video.
- [ ] Integrasi native OBS dan layanan streaming.
- [ ] API plugin yang stabil dan model izin untuk ekstensi pihak ketiga.
- [ ] Pages, folders, dan key logic seperti double-press/press-and-hold.
- [ ] Ikon pad khusus serta pengaturan ukuran grid.
- [ ] Fade in/out dan pengaturan audio lanjutan.
- [ ] Peningkatan aksesibilitas keyboard, screen reader, serta high contrast.
- [ ] Lokalisasi antarmuka tambahan.
- [ ] Build portable dan arsitektur Windows tambahan.

Lihat [Issues](https://github.com/copszeo/AERO-DECK/issues) untuk diskusi dan progres terbaru.

## Berkontribusi

Kontribusi bug fix, dokumentasi, pengujian, dan peningkatan UX sangat diterima.

1. Fork repository dan buat branch dari `main`.
2. Lakukan perubahan dengan scope yang jelas.
3. Jalankan `npm run check` dan `npm test`.
4. Buat pull request yang menjelaskan masalah, solusi, serta cara verifikasinya.

Untuk perubahan besar, buka issue terlebih dahulu agar arah implementasi dapat disepakati sebelum banyak pekerjaan dilakukan.

## Lisensi

AERO DECK didistribusikan di bawah [lisensi MIT](LICENSE).
