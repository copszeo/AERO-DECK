# Panduan penggunaan

## 1. Instal AERO DECK

1. Unduh installer terbaru dari halaman
   [Releases](https://github.com/copszeo/AERO-DECK/releases/latest).
2. Jalankan `AERO-DECK-Setup-<versi>.exe`.
3. Pilih lokasi instalasi lalu selesaikan wizard.
4. Buka AERO DECK dari Desktop atau Start Menu.

Installer publik saat ini belum ditandatangani dengan sertifikat code signing.
Windows SmartScreen dapat menampilkan peringatan **Unknown publisher**. Selalu
unduh installer dari repository resmi dan cocokkan checksum SHA-256 yang tersedia
di release. Jangan menjalankan file jika sumber atau checksum-nya berbeda.

## 2. Siapkan deck

Setiap instalasi memiliki satu deck awal. Gunakan pemilih deck pada dashboard
untuk berpindah deck, lalu gunakan menu deck untuk menambah, mengganti nama, atau
menghapus deck.

- Hanya pad pada deck aktif yang hotkey-nya didaftarkan.
- Hotkey yang sama dapat digunakan kembali pada deck berbeda.
- Menghapus deck turut menghapus konfigurasi semua pad di dalamnya.
- Menghapus deck atau pad tidak pernah menghapus file audio/video asli.

## 3. Tambahkan media

1. Klik **Tambah media**.
2. Pilih **Audio** atau **Video**.
3. Pilih file dari komputer.
4. Isi nama pad.
5. Klik kolom hotkey, lalu tekan tombol atau kombinasi yang diinginkan.
6. Atur warna, volume, loop, dan mode playback.
7. Klik **Simpan ke pad**.

Pad juga dapat dibuat dengan menarik file media dari File Explorer ke
dashboard. Untuk mengubah urutan, tarik kartu pad ke posisi baru di deck aktif.

### Pilih mode playback

| Mode | Perilaku |
| --- | --- |
| `exclusive` | Hentikan seluruh media yang aktif, lalu mulai pad ini. Cocok jika hanya satu media boleh berbunyi. |
| `restart` | Hentikan instance pad yang sama lalu mulai dari awal. Audio dari pad lain tetap berjalan. |
| `toggle` | Jika pad sedang aktif, hentikan; jika belum aktif, mulai playback. |
| `overlap` | Mulai instance audio baru setiap kali dipicu, sehingga satu pad dapat berbunyi bertumpuk. |

Video selalu memakai satu sesi player. Memicu video baru akan menggantikan video
aktif, termasuk ketika mode pad video adalah `overlap`.

## 4. Tambahkan action pad

Klik **Tambah aksi**, beri nama dan warna pad, lalu pilih hotkey pemicu bila
diperlukan. Editor visual menyediakan aksi berikut:

| Jenis aksi | Cara menggunakan |
| --- | --- |
| **Buka file, aplikasi, atau folder** | Pilih target lokal. Windows membuka target dengan aplikasi atau handler default. |
| **Tutup aplikasi** | Pilih file executable yang tepat. Secara default AERO DECK meminta jendela utama menutup secara normal; opsi **paksa** menghentikan proses. |
| **Buka website** | Masukkan URL HTTP(S), `mailto:`, atau URI yang diizinkan untuk Discord, Obsidian, Spotify, dan Steam. |
| **Kirim hotkey** | Rekam kombinasi yang akan dikirim ke aplikasi yang sedang menerima input. |
| **Ketik teks** | Masukkan teks dan aktifkan opsi Enter bila AERO DECK perlu menekan Enter setelah selesai mengetik. |
| **Kontrol multimedia** | Pilih previous, play/pause, next, stop, mute, volume up, atau volume down. |
| **Pindah deck** | Pilih deck tujuan. Setelah berpindah, hotkey global mengikuti deck yang baru aktif. |

Action pad dapat dipicu dengan klik atau hotkey global seperti media pad. Untuk
aksi **Kirim hotkey** dan **Ketik teks**, fokuskan aplikasi tujuan terlebih
dahulu. AERO DECK mengirim input ke jendela yang aktif, bukan ke nama aplikasi
yang disimpan.

### Tutup aplikasi dengan aman

AERO DECK mencocokkan full path executable secara persis. Memilih
`C:\Program Files\Contoh\Contoh.exe` tidak akan menutup executable lain yang
kebetulan memiliki nama mirip.

Gunakan penutupan normal terlebih dahulu agar aplikasi dapat meminta penyimpanan
data. Opsi **paksa** dapat diperlukan untuk proses tanpa jendela yang dapat
ditutup, tetapi dapat menghilangkan dokumen, rekaman, atau perubahan yang belum
disimpan.

### Buat automasi

Pilih salah satu jenis aksi utama berikut, lalu susun langkahnya melalui builder:

| Automasi | Perilaku |
| --- | --- |
| **Sequence / Rangkaian berurutan** | Menjalankan langkah pertama sampai selesai sebelum memulai langkah berikutnya. |
| **Bersamaan** | Memulai hingga delapan langkah secara paralel. Urutan selesainya dapat berbeda setiap kali dijalankan. |
| **Random** | Memilih dan menjalankan satu langkah secara acak. |
| **Toggle / Beralih dua keadaan** | Pemicu pertama menjalankan keadaan pertama, pemicu berikutnya keadaan kedua, lalu bergantian. |

Langkah media pada Sequence dianggap selesai setelah permintaan playback
dikirim; Sequence tidak menunggu audio/video selesai sampai akhir. Keadaan
Toggle disimpan selama sesi AERO DECK berjalan dan kembali ke keadaan pertama
setelah aplikasi dimulai ulang.

Langkah automasi dapat berupa:

- media pad audio/video pada deck yang sama;
- buka atau tutup aplikasi/file/folder;
- website atau URI;
- hotkey dan teks;
- kontrol multimedia;
- pindah deck; dan
- **Delay** dalam milidetik.

Referensi media dan deck divalidasi saat disimpan. AERO DECK menolak penghapusan
media pad yang masih dirujuk action. Penghapusan deck ditolak bila action dari
deck lain masih merujuknya; action dan referensi yang seluruhnya berada di dalam
deck yang dihapus dapat ikut dihapus.

> [!WARNING]
> Action pad adalah konfigurasi aktif: ia dapat membuka/menutup aplikasi dan
> mengetik ke jendela aktif. Periksa target sebelum menyimpan, hindari hotkey
> satu tombol untuk aksi berisiko, dan impor backup hanya dari sumber tepercaya.

Action Windows tertentu tidak tersedia ketika source dijalankan pada sistem
operasi lain. Pengetikan memakai simulasi keyboard Windows; karakter yang muncul
bergantung pada layout keyboard, bahasa input, fokus, dan perilaku aplikasi
tujuan.

## 5. Gunakan hotkey di latar belakang

Hotkey global aktif secara default. Dashboard boleh diminimalkan atau
disembunyikan dengan tombol **×**; AERO DECK tetap berjalan di system tray.

Tombol satu karakter seperti `A` atau `1` ikut aktif ketika Anda mengetik di
aplikasi lain. Gunakan kombinasi seperti `Ctrl+Alt+1` atau jeda **Hotkey global**
dari sidebar/system tray ketika sedang mengetik.

Hotkey dapat memicu media maupun action pad. Hanya pad pada deck aktif yang
didaftarkan. Saat editor terbuka, AERO DECK menjeda registrasi sementara agar
shortcut yang sedang direkam tidak langsung menjalankan pad.

### Stop All

Hotkey **Stop All** default adalah `Ctrl+Alt+F12`. Tekan kombinasi ini dari
aplikasi mana pun untuk menghentikan seluruh audio/video dan meminta pembatalan
action yang masih berjalan. Operasi OS yang telah selesai—misalnya aplikasi yang
sudah dibuka—tidak dapat diurungkan oleh Stop All. Shortcut tersebut
didaftarkan terpisah dari hotkey pad, sehingga tetap dapat dipakai saat toggle
**Hotkey global** untuk pad sedang dinonaktifkan.

Saat action sedang mengirim hotkey atau teks simulasi, semua shortcut global
termasuk Stop All dijeda sementara agar input tersebut sampai ke aplikasi tujuan
dan tidak memicu AERO DECK sendiri. Selama jeda singkat ini, gunakan tombol
**Hentikan semua** pada dashboard atau menu tray jika perlu membatalkan action.

Ubah kombinasi Stop All melalui **Settings**. AERO DECK menolak kombinasi yang
bertabrakan dengan pad pada deck aktif. Jika shortcut dipakai Windows atau
aplikasi lain, pilih kombinasi berbeda.

## 6. Atur startup Windows

Buka **Settings**, lalu aktifkan sesuai kebutuhan:

- **Jalankan bersama Windows** untuk membuka AERO DECK setelah masuk ke Windows.
- **Mulai diminimalkan** agar peluncuran berikutnya langsung berjalan di
  background/system tray.

Pengaturan startup hanya diterapkan oleh aplikasi Windows yang sudah dipasang;
menjalankan source dalam mode pengembangan tidak menambahkan startup entry.
Gunakan menu tray **Keluar** untuk menghentikan aplikasi sepenuhnya.

## 7. Export dan import backup

### Export

1. Buka **Settings**.
2. Pilih **Export backup**.
3. Simpan file `AERO-DECK-backup-<tanggal>.aerodeck.json` di lokasi aman.

Backup berisi deck, konfigurasi pad, action, hotkey, dan pengaturan. Backup dapat
memuat path lokal media, target aplikasi/file/folder, URL/URI, kombinasi input,
serta teks yang akan diketik. Backup **tidak memuat file audio atau video**.
Menyalin backup ke komputer lain tidak otomatis menyalin medianya.

File backup dapat memperlihatkan nama pengguna serta struktur folder. Jangan
mengunggahnya ke issue publik atau membagikannya tanpa memeriksa isinya. Teks
action juga dapat berisi informasi pribadi.

### Import

1. Export konfigurasi saat ini sebagai cadangan.
2. Pilih **Import backup**, lalu tentukan file JSON.
3. Pastikan file berasal dari diri sendiri atau pihak yang benar-benar
   tepercaya.
4. Baca konfirmasi dan pilih import hanya jika seluruh library saat ini boleh
   diganti.

Import mengganti semua deck, pad, dan pengaturan. AERO DECK membuat salinan
internal sebelum import, tetapi backup manual tetap dianjurkan. File media asli
tidak diubah. Jika media dipindahkan atau path berbeda pada komputer baru, edit
pad dan pilih kembali file sumbernya.

Import tidak langsung menjalankan action. Namun, action dari backup dapat
membuka atau menutup aplikasi, membuka URL/URI, mengirim hotkey, dan mengetik
teks ketika kartu atau hotkey-nya kemudian dipicu. Jangan mencoba backup acak
dari internet.

## 8. Settings, About, dan update

Halaman **Settings/About** menampilkan versi aplikasi, lokasi data, pengaturan
hotkey/startup, fitur backup, dan tautan rilis.

Pengecekan update bersifat manual:

1. Buka **Settings/About**.
2. Pilih **Cek update**.
3. AERO DECK menghubungi GitHub Releases dan membandingkan versi terpasang dengan
   rilis terbaru.
4. Jika tersedia versi baru, buka halaman Releases dan unduh installer secara
   manual.

Tidak ada pemeriksaan update otomatis. Request dilakukan hanya ketika tombol
ditekan dan tidak menyertakan media, deck, hotkey, atau isi library. Koneksi akan
gagal secara wajar ketika offline atau GitHub tidak dapat dijangkau.

## 9. Audio untuk Discord atau streaming

AERO DECK memutar audio ke output Windows yang aktif. Agar audio masuk sebagai
mikrofon, gunakan virtual audio cable lalu pilih routing output yang sesuai di
Windows dan aplikasi tujuan.

## 10. Video untuk OBS

Tambahkan source **Window Capture** di OBS dan pilih **AERO DECK Player**.
Jendela player mempertahankan rasio video serta dapat dibuat fullscreen atau
selalu di atas.

## Pemecahan masalah

### Hotkey tidak bekerja

- Pastikan toggle **Hotkey global** aktif.
- Pastikan deck yang berisi pad sedang aktif.
- Periksa apakah kartu status menampilkan hotkey bermasalah.
- Ganti hotkey karena shortcut mungkin sudah dipakai Windows atau aplikasi lain.
- Coba kombinasi `Ctrl+Alt+<tombol>`.
- Buka ulang AERO DECK dari system tray.

### Stop All tidak bekerja

- Tutup editor atau perekam hotkey terlebih dahulu.
- Pastikan status registrasi Stop All tidak menampilkan konflik.
- Ganti shortcut default jika `Ctrl+Alt+F12` dipakai aplikasi lain.

### Media gagal diputar

- Pastikan file belum dipindahkan atau dihapus.
- Gunakan MP3/WAV untuk audio atau MP4 H.264/AAC/WebM untuk video.
- Coba putar file dengan aplikasi Windows lain untuk memastikan file tidak rusak.

### Pad overlap terus berbunyi

Mode `overlap` dapat membuat beberapa instance audio, terutama bila tombol
ditekan berulang. Gunakan **Stop All**, lalu pilih mode `restart`, `toggle`, atau
`exclusive` jika penumpukan tidak diperlukan.

### Media hilang setelah import

Backup hanya menyimpan path media. Salin file media secara terpisah, lalu edit
pad yang bertanda file hilang dan pilih lokasi barunya.

### Hotkey atau teks dikirim ke aplikasi yang salah

Action input mengikuti jendela Windows yang sedang aktif. Fokuskan aplikasi dan
kolom tujuan sebelum memicu action pad. Hindari berpindah jendela selama
Sequence yang mengirim beberapa input sedang berjalan.

Jika karakter berbeda dari teks yang disimpan, periksa layout keyboard dan
bahasa input Windows. Fitur ini menyimulasikan keyboard, bukan memasukkan teks
melalui API khusus aplikasi.

### Aplikasi tidak dapat ditutup

Pilih kembali executable yang benar. Action **Tutup aplikasi** mencocokkan path
executable secara persis dan gagal dengan aman bila proses tersebut tidak
berjalan. Gunakan opsi **paksa** hanya setelah menyimpan pekerjaan di aplikasi
tujuan.

### Action hasil import tidak dikenal

Jangan memicu action tersebut. Hapus library hasil import atau pulihkan backup
sendiri, lalu periksa sumber file. Backup AERO DECK harus diperlakukan seperti
macro atau script lokal, bukan seperti dokumen pasif.

### Aplikasi terlihat tertutup

Tombol **×** menyembunyikan dashboard ke system tray. Klik ikon AERO DECK pada
tray untuk membukanya kembali. Pilih **Keluar** dari menu tray untuk menghentikan
aplikasi sepenuhnya.

### Pengecekan update gagal

Pastikan komputer terhubung ke internet dan GitHub dapat diakses, lalu coba lagi.
Kegagalan cek update tidak memengaruhi pad atau playback lokal.
