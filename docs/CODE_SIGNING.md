# Code signing installer Windows

## Status saat ini

Installer publik AERO DECK saat ini **belum ditandatangani** dengan sertifikat
code signing. Windows dapat menampilkan **Unknown publisher** atau peringatan
SmartScreen. Checksum membantu memastikan file tidak berubah setelah dibuat,
tetapi tidak menggantikan identitas publisher dari digital signature.

Jangan menyatakan suatu rilis telah ditandatangani kecuali signature artifact
final sudah diverifikasi pada Windows.

## Yang dibutuhkan

- Sertifikat code signing Windows yang valid dari penyedia tepercaya.
- Private key, biasanya dalam file `.pfx`, dan password-nya.
- Windows runner atau mesin build yang aksesnya dibatasi.
- Timestamp server dari penerbit sertifikat.

Sertifikat dan password adalah secret distribusi. Jangan commit, menaruhnya di
folder repository, mengunggahnya sebagai artifact, atau menampilkannya di log.
Batasi akses secret hanya ke maintainer dan workflow rilis yang memerlukannya.

## Integrasi dengan electron-builder

AERO DECK dibangun dengan electron-builder. Saat sertifikat tersedia:

1. Simpan PFX di secret manager CI atau lokasi lokal di luar repository.
2. Berikan lokasi/isi sertifikat dan password kepada electron-builder melalui
   mekanisme secret yang didukung, misalnya `CSC_LINK` dan
   `CSC_KEY_PASSWORD`.
3. Jalankan build rilis dari commit/tag yang sudah ditinjau:

   ```powershell
   npm ci
   npm run check
   npm test
   npm run dist:win
   ```

4. Hapus file sertifikat sementara dan environment variable secret setelah
   build, termasuk ketika build gagal.

Jangan menulis nilai sebenarnya dalam script, workflow, contoh konfigurasi, atau
command history. Pada CI, mask secret dan cegah workflow dari fork tidak tepercaya
mendapat akses ke signing job. Untuk konfigurasi aktual, ikuti dokumentasi resmi
[electron-builder Windows code signing](https://www.electron.build/code-signing-win.html).

## Verifikasi artifact final

Lakukan verifikasi pada file installer yang akan diunggah, setelah seluruh
proses signing selesai:

```powershell
$version = node -p "require('./package.json').version"
$installer = ".\release\AERO-DECK-Setup-$version.exe"
$signature = Get-AuthenticodeSignature $installer
$signature | Format-List Status, StatusMessage, SignerCertificate, TimeStamperCertificate
```

Status harus `Valid`, subject sertifikat harus sesuai publisher, dan timestamp
harus tersedia. Pemeriksaan tambahan dapat dilakukan dengan SignTool:

```powershell
signtool verify /pa /all /v $installer
```

Selalu uji instalasi, peluncuran, upgrade, dan uninstall pada Windows 10/11.
Digital signature yang valid tidak menjamin SmartScreen langsung memberi
reputasi; reputasi juga dipengaruhi riwayat sertifikat dan unduhan.

## Checksum

Buat checksum **setelah signing**, karena penandatanganan mengubah file:

```powershell
Get-FileHash $installer -Algorithm SHA256
```

Publikasikan hash tersebut bersama installer sebagai `SHA256SUMS.txt`. Pengguna
tetap harus mengunduh artifact dan checksum dari halaman Releases resmi.

## Jika sertifikat belum tersedia

Rilis unsigned masih dapat dipublikasikan selama statusnya dinyatakan jelas:

- tulis bahwa publisher akan tampil sebagai **Unknown publisher**;
- sertakan checksum SHA-256;
- jangan memakai kata “signed”, “verified publisher”, atau klaim setara;
- minta pengguna memeriksa repository dan nama artifact resmi; dan
- jangan menyarankan pengguna menonaktifkan SmartScreen secara global.

Ikuti [checklist rilis](RELEASE_CHECKLIST.md) untuk verifikasi lengkap.
