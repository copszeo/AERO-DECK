# Kebijakan Keamanan AERO DECK

## Versi yang didukung

AERO DECK masih berkembang. Perbaikan keamanan ditujukan untuk branch default dan rilis terbaru. Rilis lama mungkin diminta memperbarui ke versi terbaru sebelum menerima perbaikan.

| Versi | Dukungan keamanan |
| --- | --- |
| Rilis terbaru | Didukung |
| Branch default | Didukung |
| Rilis lebih lama | Tidak dijamin |

## Melaporkan kerentanan

Jangan membuka issue publik untuk dugaan kerentanan, proof of concept, atau detail yang dapat membantu eksploitasi.

Gunakan **Security → Advisories → Report a vulnerability** pada repository GitHub ini. Jika private vulnerability reporting belum tersedia, pilih template issue **Permintaan kanal laporan keamanan** tanpa menambahkan detail teknis, lalu tunggu maintainer menyediakan kanal privat. Jangan sertakan exploit, media, log sensitif, atau path lokal pada issue tersebut.

Dalam laporan privat, sertakan:

- versi AERO DECK dan Windows;
- komponen yang terdampak;
- prasyarat dan langkah reproduksi minimal;
- dampak yang realistis;
- apakah masalah dapat dipicu oleh file, nama file, path, hotkey, atau renderer; dan
- saran mitigasi jika ada.

Samarkan username, nama organisasi, nama proyek, dan struktur folder. Jangan mengunggah file media pribadi atau seluruh file library AERO DECK. Gunakan path seperti `C:\Users\<nama>\Videos\<folder>\contoh.mp4` dan fixture buatan khusus.

Maintainer akan mengonfirmasi laporan sesuai kapasitas, memvalidasi dampak, dan mengoordinasikan waktu perbaikan serta pengungkapan. Mohon jangan memublikasikan detail sebelum koordinasi selesai.

## Sistem dan cakupan

AERO DECK adalah aplikasi desktop Electron untuk Windows. Aplikasi memilih media
lokal, menyimpan konfigurasi media/action pad di direktori data aplikasi,
mendaftarkan global shortcut, lalu memutar audio/video atau menjalankan action
Windows yang dikonfigurasi pengguna.

Cakupan kebijakan ini meliputi:

- Electron main process, preload, renderer dashboard, dan renderer player;
- channel IPC serta pemeriksaan asal pengirim;
- global shortcut dan lifecycle aplikasi;
- parsing, penyimpanan, serta penggunaan path media lokal;
- validasi, penyimpanan, dan eksekusi action, termasuk adapter input Windows;
- target open/close, URL/URI, hotkey, teks, kontrol multimedia, dan automasi;
- persistence library dan pemulihan data rusak;
- navigasi, permission, dan boundary sandbox;
- dependency serta packaging installer Windows.

Secara desain saat ini, AERO DECK tidak memerlukan backend, akun, telemetry, atau upload media. Perubahan yang menambah komunikasi jaringan atau pengumpulan data harus dijelaskan secara eksplisit dan ditinjau sebagai perubahan boundary keamanan serta privasi.

## Threat model dan trust boundary

Input yang harus dianggap tidak tepercaya meliputi:

- nama, ekstensi, metadata, dan path file yang dipilih atau di-drop;
- isi file persistence yang rusak atau dimodifikasi;
- file backup dan konfigurasi action yang berasal dari pihak lain;
- target aplikasi/file/folder, URL/URI, teks, shortcut, serta graph automasi;
- event keyboard dan kombinasi hotkey;
- payload IPC dari renderer; dan
- konten atau navigasi yang tidak sengaja mencapai renderer.

Boundary utama berada antara renderer yang disandbox, API preload yang terbatas,
dan main process yang memiliki akses OS. Memilih file lokal tidak berarti
renderer boleh membaca file lain atau memanggil operasi main process yang tidak
terkait. Action pad merupakan pemberian kewenangan yang disengaja dan terbatas:
hanya jenis serta target yang lolos validasi boleh diteruskan ke adapter OS saat
pad dipicu.

Backup harus dianggap sebagai **konfigurasi aktif**, setara macro lokal. Import
tidak menjalankan action secara otomatis, tetapi action hasil import dapat
membuka/menutup aplikasi, membuka URL/URI, mengirim input, atau memutar media
ketika kemudian dipicu.

## Invariant keamanan dan privasi

Properti berikut harus tetap berlaku:

- `contextIsolation` dan sandbox tetap aktif, sedangkan `nodeIntegration` tetap nonaktif.
- Preload hanya mengekspos operasi yang diperlukan; tidak mengekspos `ipcRenderer`, filesystem, shell, atau API Node.js secara umum.
- Main process memvalidasi payload IPC dan memastikan operasi dashboard hanya berasal dari dashboard yang sah.
- Path media harus menunjuk file lokal yang valid dan bertipe media yang didukung sebelum disimpan atau diputar.
- Action harus menggunakan jenis yang diizinkan, memiliki batas kedalaman,
  jumlah node, jumlah child, panjang input, delay, dan timeout, serta tidak boleh
  memiliki referensi melingkar.
- Referensi media action harus menunjuk pad audio/video di deck yang sama;
  referensi deck harus ada. Media/deck yang masih dirujuk tidak boleh dihapus
  diam-diam.
- Action media tersimpan menggunakan referensi `padId`, bukan path media bebas.
- Target open/close dan payload keyboard harus diteruskan sebagai data, bukan
  disisipkan ke command line atau script yang dibangun dari input pengguna.
- Action **Tutup aplikasi** hanya boleh mencocokkan full path executable yang
  dipilih. Mode paksa harus tetap menjadi pilihan eksplisit.
- URL harus memiliki scheme yang valid; scheme aktif/berisiko seperti
  `javascript:`, `data:`, dan `file:` ditolak.
- Nama file, path, library, dan media lokal tidak dikirim melalui jaringan atau telemetry tanpa persetujuan eksplisit pengguna.
- Pesan error dan log tidak boleh membocorkan path, username, atau isi media lebih dari yang diperlukan.
- Navigasi baru, permission renderer, dan pembukaan window eksternal ditolak secara default.
- Global shortcut dilepas saat capture mode atau shutdown dan tidak boleh memberi akses ke operasi selain memicu pad yang telah dikonfigurasi.
- Action hotkey/teks hanya mengirim nilai yang dikonfigurasi. Aplikasi tidak
  boleh berubah menjadi pencatat input keyboard umum.
- Kegagalan persistence tidak boleh diam-diam merusak state yang terakhir berhasil disimpan.
- File media asli tidak boleh diubah atau dihapus ketika pad diedit maupun dihapus.

## Temuan yang dapat dilaporkan

Contoh temuan keamanan yang relevan:

- arbitrary code execution atau command execution;
- command/script injection melalui target open/close, URL, hotkey, teks, atau
  action hasil import;
- bypass allowlist, batas automasi, pemeriksaan URI, kecocokan executable, atau
  validasi referensi action;
- sandbox escape, akses Node.js dari renderer, atau API preload yang terlalu luas;
- bypass pemeriksaan pengirim/payload IPC;
- pembacaan, pengubahan, penghapusan, atau pengiriman file di luar media yang dipilih;
- kebocoran path atau metadata pribadi ke jaringan, log publik, atau renderer yang tidak berwenang;
- navigasi atau permission yang memungkinkan konten tidak tepercaya memperoleh privilege;
- file/persistence buatan yang menyebabkan korupsi data persisten dengan dampak keamanan;
- action dari backup yang berjalan tanpa pemicu/konfirmasi yang semestinya atau
  memperoleh kewenangan di luar action yang ditampilkan;
- dependency atau proses packaging yang memungkinkan artifact diganti atau disusupi; dan
- denial of service yang persisten dan dapat dipicu melalui input tidak tepercaya dengan dampak nyata.

Sertakan reachability dan dampak nyata saat menilai severity. Keberadaan fungsi sensitif saja bukan temuan jika input tidak tepercaya tidak dapat mencapainya.

## Laporan bug biasa

Masalah berikut umumnya dilaporkan melalui template bug, kecuali memiliki dampak keamanan tambahan:

- hotkey bertabrakan dengan Windows atau aplikasi lain;
- codec tertentu tidak dapat diputar;
- audio/video tersendat atau UI player keliru;
- file media dipindah sehingga path tidak lagi valid;
- action gagal karena jendela tujuan tidak fokus, layout keyboard berbeda,
  executable tidak berjalan, atau aplikasi menolak penutupan normal;
- installer pengembangan yang belum ditandatangani memunculkan peringatan SmartScreen; dan
- crash lokal yang tidak melewati boundary, membocorkan data, atau merusak data persisten.

Saat ragu, pilih laporan privat terlebih dahulu.

## Keterbatasan yang diketahui

Ketersediaan global shortcut bergantung pada Windows dan aplikasi lain.
Kemampuan playback bergantung pada codec yang disertakan Electron dan codec
file; ekstensi yang didukung tidak menjamin setiap encoding dapat diputar.

Action **Kirim hotkey**, **Ketik teks**, **Kontrol multimedia**, dan **Tutup
aplikasi** memakai fasilitas Windows dan tidak dijanjikan bekerja pada sistem
operasi lain. Pengetikan adalah simulasi keyboard: hasilnya bergantung pada
layout input dan jendela yang sedang fokus. Penutupan paksa dapat menyebabkan
kehilangan data di aplikasi tujuan; ini merupakan risiko operasional yang harus
ditampilkan jelas, bukan kerentanan dengan sendirinya.

Pengguna harus mengimpor backup hanya dari sumber tepercaya. Menjalankan action
yang memang terlihat dan dikonfirmasi pengguna bukan kerentanan; bypass validasi,
eksekusi otomatis, penyamaran target, atau eskalasi kemampuan action dapat
menjadi temuan keamanan.

Build CI dapat menghasilkan installer tanpa digital signature. Signing dan reputasi SmartScreen merupakan bagian dari proses distribusi resmi, bukan bukti bahwa perubahan source tertentu aman.
