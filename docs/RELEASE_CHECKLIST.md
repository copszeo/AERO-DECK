# Checklist rilis AERO DECK

Checklist ini digunakan untuk rilis Windows publik. Centang hanya langkah yang
benar-benar sudah dijalankan pada commit yang akan dirilis.

## 1. Siapkan rilis

- [ ] Pastikan scope versi dan perubahan sudah disepakati.
- [ ] Perbarui versi aplikasi, lockfile, changelog, serta catatan rilis.
- [ ] Pastikan dokumentasi tidak mengklaim fitur yang belum tersedia.
- [ ] Pastikan status signed/unsigned ditulis secara akurat.
- [ ] Tinjau dependency dan pastikan tidak ada credential, token, media pribadi,
      backup, path lokal, atau artifact build yang ikut ter-commit.
- [ ] Catat commit SHA yang akan diberi tag.

## 2. Pemeriksaan otomatis

Jalankan dari checkout bersih:

```powershell
npm ci
npm run check
npm test
npm run dist:win
```

- [ ] Syntax check lulus.
- [ ] Seluruh unit test lulus.
- [ ] Build NSIS Windows x64 selesai tanpa error.
- [ ] Artifact berasal dari commit/tag yang sama dengan source rilis.

## 3. Smoke test Windows

Uji pada Windows 10 atau Windows 11 x64:

- [ ] Installer dapat dibuka, dipasang, dan menjalankan AERO DECK.
- [ ] Dashboard dapat diminimalkan/disembunyikan dan dibuka kembali dari tray.
- [ ] Audio dan video dapat ditambahkan serta diputar.
- [ ] Hotkey pad bekerja ketika aplikasi lain sedang fokus.
- [ ] Hotkey **Stop All** menghentikan seluruh playback dari background.
- [ ] Deck dapat ditambah, diganti nama, dipilih, dan dihapus.
- [ ] Hanya hotkey deck aktif yang merespons.
- [ ] Pad dapat disusun ulang dengan drag-and-drop.
- [ ] Mode `exclusive`, `restart`, `toggle`, dan `overlap` berperilaku sesuai
      dokumentasi.
- [ ] Opsi startup Windows dan mulai diminimalkan bekerja setelah login ulang.
- [ ] Export backup berhasil dan file backup tidak berisi media.
- [ ] Import mengganti library hanya setelah konfirmasi dan tidak mengubah file
      media asli.
- [ ] **Cek update** bekerja ketika online dan gagal dengan pesan yang wajar
      ketika offline.
- [ ] Tidak ada request update sebelum pengguna menekan **Cek update**.
- [ ] Upgrade dari rilis sebelumnya mempertahankan pad dengan migrasi yang benar.
- [ ] Uninstall berhasil; perilaku data pengguna dijelaskan pada dokumentasi.

Gunakan fixture media buatan yang tidak memiliki data pribadi atau materi
berhak cipta.

## 4. Signature dan integritas

Jika sertifikat tersedia, ikuti [CODE_SIGNING.md](CODE_SIGNING.md):

- [ ] Installer final ditandatangani.
- [ ] `Get-AuthenticodeSignature` dan `signtool verify /pa /all /v` menyatakan
      signature valid.
- [ ] Publisher dan timestamp sesuai.

Jika sertifikat belum tersedia:

- [ ] Catatan rilis menyebut installer unsigned dan kemungkinan
      **Unknown publisher**.
- [ ] Tidak ada klaim verified publisher atau code signing.

Untuk kedua kondisi:

- [ ] Buat SHA-256 dari artifact final, setelah signing jika signing digunakan.
- [ ] Cocokkan checksum terhadap installer yang akan diunggah.
- [ ] Uji kembali installer final, bukan salinan sebelum signing.

Contoh membuat checksum:

```powershell
$version = node -p "require('./package.json').version"
Get-FileHash ".\release\AERO-DECK-Setup-$version.exe" -Algorithm SHA256
```

## 5. Publikasikan

- [ ] Buat tag versi dari commit yang sudah diuji.
- [ ] Unggah installer final dan `SHA256SUMS.txt` ke GitHub Releases.
- [ ] Tulis fitur utama, perubahan perilaku, langkah upgrade, batasan, dan status
      signature pada catatan rilis.
- [ ] Pastikan tautan download menunjuk repository resmi
      `copszeo/AERO-DECK`.
- [ ] Pastikan release bukan draft/prerelease jika memang dimaksudkan sebagai
      rilis stabil.
- [ ] Buka halaman release sebagai pengguna dan pastikan kedua artifact dapat
      diunduh.

## 6. Setelah rilis

- [ ] Pasang kembali dari artifact GitHub Releases dan ulangi smoke test singkat.
- [ ] Cocokkan checksum file yang diunduh dengan `SHA256SUMS.txt`.
- [ ] Pastikan tombol **Cek update** mendeteksi versi terbaru dari instalasi lama.
- [ ] Pantau issue untuk regresi instalasi, migrasi, hotkey, playback, dan backup.
- [ ] Jika artifact salah atau berisiko, hentikan distribusi, dokumentasikan
      dampak, dan terbitkan rilis perbaikan; jangan mengganti binary diam-diam
      dengan nama versi yang sama.
