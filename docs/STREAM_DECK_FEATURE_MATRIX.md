# Matriks fitur: Stream Deck dan AERO DECK

Dokumen ini membandingkan kemampuan AERO DECK dengan fitur yang dijelaskan dalam dokumentasi resmi Elgato. Tujuannya adalah membantu pengguna memahami cakupan proyek tanpa menganggap semua fitur Stream Deck sudah tersedia di AERO DECK.

> Snapshot riset: **30 Juli 2026**. Versi terbaru yang ditemukan pada indeks resmi adalah seri **Stream Deck 7.4**, termasuk [7.4.1 yang dirilis 14 April 2026][elgato-7-4-1].
>
> Halaman [7.4.0 yang dirilis 1 April 2026][elgato-7-4-0] memuat materi April Fools seperti “Stream Deck + Lever” dan “Slotius”. Keduanya tidak dihitung sebagai fitur produk dalam matriks ini.

## Arti status

| Status | Arti |
| --- | --- |
| **Tersedia** | Dapat digunakan dan dikonfigurasi melalui aplikasi AERO DECK saat ini. |
| **Roadmap** | Direncanakan atau sedang dipertimbangkan; belum ada janji tanggal rilis. |
| **Tidak relevan** | Sengaja tidak menjadi sasaran karena AERO DECK adalah aplikasi Windows tanpa perangkat keras khusus. |

## Media dan system actions

| Fitur Stream Deck | Status AERO DECK | Catatan AERO DECK | Sumber resmi |
| --- | --- | --- | --- |
| Soundboard / Play Audio | **Tersedia** | Memutar berkas audio lokal dari pad. AERO juga dapat memutar video lokal. | [Soundboard][elgato-soundboard] |
| Mode pemutaran audio | **Tersedia** | Tersedia `exclusive`, `restart`, `toggle`, `overlap`, dan loop. Ini bukan salinan satu-banding-satu dari mode Elgato; fade dan pemilihan perangkat output belum tersedia. | [Soundboard][elgato-soundboard] |
| Trigger saat aplikasi berada di latar belakang | **Tersedia** | Hotkey global AERO menjalankan media atau action pad ketika dashboard diminimalkan/disembunyikan. Action **Kirim hotkey** yang terpisah dapat mengirim shortcut ke aplikasi/OS. | [System Actions][elgato-system-actions] |
| Stop All global | **Tersedia** | Menghentikan seluruh audio/video dan meminta pembatalan action yang masih berjalan melalui UI, tray, atau hotkey darurat. Operasi OS yang sudah selesai tidak diurungkan. | [Soundboard][elgato-soundboard] |
| Open aplikasi, berkas, folder, website, dan URI | **Tersedia** | Builder action dapat memilih target lokal atau membuka HTTP(S), `mailto:`, serta URI Discord, Obsidian, Spotify, dan Steam melalui handler Windows. | [System Actions][elgato-system-actions] |
| Mengirim hotkey atau teks | **Tersedia** | Builder dapat mengirim shortcut atau menyimulasikan pengetikan teks dan Enter ke jendela aktif. Hasil teks mengikuti fokus serta layout keyboard Windows. | [System Actions][elgato-system-actions] |
| Kontrol multimedia OS | **Tersedia** | Previous, play/pause, next, stop, mute, volume up, dan volume down tersedia sebagai action Windows. | [System Actions][elgato-system-actions] |
| Close application | **Tersedia** | Memilih executable yang dicocokkan lewat full path; mencoba penutupan normal atau, bila dipilih eksplisit, menghentikan proses secara paksa. | [System Actions][elgato-system-actions] |
| Output audio per pad, loop, dan fade | **Roadmap** | Loop sudah tersedia, tetapi audio masih memakai output default Windows; pilihan perangkat dan fade belum tersedia. | [Soundboard][elgato-soundboard], [output audio][elgato-audio-output] |
| Tray, mulai bersama Windows, dan mulai diminimalkan | **Tersedia** | Pengaturan aplikasi Windows tersedia dan hotkey tetap bekerja ketika dashboard tidak aktif. | [Smart Profiles][elgato-smart-profiles] |

## Profiles, deck, pages, dan folders

| Fitur Stream Deck | Status AERO DECK | Catatan AERO DECK | Sumber resmi |
| --- | --- | --- | --- |
| Banyak profile / layout | **Tersedia** | Di AERO konsep terdekat disebut **deck**. Pengguna dapat membuat, mengganti nama, menghapus, dan berpindah deck. | [Profiles][elgato-profiles] |
| Menyusun ulang action | **Tersedia** | Pad dapat diurutkan ulang di dalam deck aktif. | [Pages][elgato-pages] |
| Pages dan navigasi next/previous/go-to | **Roadmap** | Deck belum memiliki subhalaman bernomor seperti Stream Deck. | [Pages][elgato-pages] |
| Folder dan nested folder | **Roadmap** | Belum ada hirarki pad/folder. | [Pinned Actions and Folders][elgato-pinned] |
| Pinned actions/folders lintas halaman | **Roadmap** | Belum ada action yang otomatis muncul pada semua halaman. | [Pinned Actions and Folders][elgato-pinned] |
| Smart Profile berdasarkan aplikasi yang sedang fokus | **Roadmap** | Deck dapat dipindahkan manual atau lewat action **Pindah deck**, tetapi belum mendeteksi foreground application. | [Smart Profiles][elgato-smart-profiles] |

## Automation dan key logic

| Fitur Stream Deck | Status AERO DECK | Catatan AERO DECK | Sumber resmi |
| --- | --- | --- | --- |
| Multi Action / rangkaian action | **Tersedia** | Builder **Sequence** menjalankan langkah berurutan dan dapat menyertakan media, system action, pindah deck, serta Delay. Ini implementasi independen, bukan format Multi Action Elgato. | [Multi Actions][elgato-multi-action] |
| Delay di dalam Multi Action | **Tersedia** | Langkah Delay dapat ditambahkan pada automasi dari dashboard. | [Multi Actions][elgato-multi-action] |
| Menjalankan action secara paralel | **Tersedia** | Builder **Bersamaan** memulai hingga delapan langkah child secara paralel untuk menjaga resource Windows. | [Multi Actions][elgato-multi-action] |
| Key Logic: press, double press, press-and-hold | **Roadmap** | Satu hotkey AERO saat ini memicu satu pad; belum ada variasi berdasarkan pola tekanan. | [Stream Deck 7.0][elgato-7-0] |
| Hotkey Switch / dua state action | **Tersedia** | Builder **Toggle** bergantian menjalankan dua action umum. Belum ada state icon atau key logic press/hold/double-press. | [System Actions][elgato-system-actions] |
| Menjalankan satu pilihan acak | **Tersedia** | Builder **Random** memilih satu child setiap kali pad dipicu. | [Multi Actions][elgato-multi-action] |
| MCP dan pemicu melalui asisten/voice | **Roadmap** | AERO belum menyediakan server atau konektor MCP. | [Stream Deck 7.4.1][elgato-7-4-1] |

## Visual, backup, dan sharing

| Fitur Stream Deck | Status AERO DECK | Catatan AERO DECK | Sumber resmi |
| --- | --- | --- | --- |
| Backup dan restore konfigurasi | **Tersedia** | Ekspor/impor lokal mencakup media/action pad, konfigurasi, dan **path** target. Berkas audio/video tidak disalin. Backup action harus berasal dari sumber tepercaya. | [Profile Backup][elgato-backup] |
| Berbagi satu action/folder/Multi Action | **Roadmap** | Backup AERO saat ini mencakup library, bukan paket satu action yang portabel. | [Action Sharing][elgato-action-sharing] |
| Ikon kustom, GIF/WEBP animasi, dan state icon | **Roadmap** | Pad belum memiliki pipeline ikon kustom yang setara. | [Customizing Key Icons][elgato-icons] |
| Background per page, screensaver, dan standby screen | **Roadmap** | AERO belum menyediakan tampilan idle atau background deck kustom. | [Screensaver][elgato-screensaver], [Stream Deck 6.6][elgato-6-6] |
| Impor profile lintas perangkat/OS | **Roadmap** | Backup berbasis path dapat dipindahkan, tetapi relink media dan portabilitas lintas komputer belum ditangani otomatis. | [Profile Backup][elgato-backup] |

## Plugins dan Marketplace

| Fitur Stream Deck | Status AERO DECK | Catatan AERO DECK | Sumber resmi |
| --- | --- | --- | --- |
| Plugin SDK untuk action pihak ketiga | **Roadmap** | Belum ada API plugin stabil, sandbox, manifest, atau kontrak kompatibilitas publik. | [Plugins][elgato-plugins], [SDK][elgato-sdk] |
| Marketplace untuk plugin, profile, icon, dan asset | **Roadmap** | AERO tidak terhubung ke Elgato Marketplace. Ekosistem ekstensi independen baru akan dipertimbangkan setelah API plugin stabil. | [Marketplace transition][elgato-marketplace] |
| Kompatibilitas plugin Stream Deck | **Tidak relevan** | AERO tidak menjalankan plugin proprietary Stream Deck dan tidak menargetkan kompatibilitas protokol Elgato. | [SDK][elgato-sdk] |

## Integrasi aplikasi dan layanan

| Integrasi Stream Deck | Status AERO DECK | Catatan AERO DECK | Sumber resmi |
| --- | --- | --- | --- |
| OBS Studio | **Roadmap** | Belum ada kontrol scene, record/stream, source visibility, mixer, replay buffer, filter, atau transition. | [OBS Studio Integration][elgato-obs] |
| Discord | **Roadmap** | Belum ada mute, deafen, push-to-talk, channel, atau kontrol volume pengguna. Audio AERO juga belum dirutekan otomatis ke voice chat. | [Discord Plugin Setup][elgato-discord] |
| Spotify | **Roadmap** | Belum ada autentikasi atau action khusus Spotify. Action multimedia OS umum tersedia, tetapi tidak memberikan metadata atau kontrol Spotify-specific. | [Spotify Marketplace][elgato-spotify] |
| YouTube | **Roadmap** | Belum ada autentikasi akun, kontrol live, chat, viewer count, atau action API YouTube. | [YouTube Marketplace][elgato-youtube] |
| Twitch | **Roadmap** | Belum ada chat message, ads, title/category, clip/marker, viewer count, atau mode moderasi. | [Twitch Integration][elgato-twitch] |

## Mobile dan virtual deck

| Fitur Stream Deck | Status AERO DECK | Catatan AERO DECK | Sumber resmi |
| --- | --- | --- | --- |
| Dashboard virtual di layar PC | **Tersedia** | AERO memiliki dashboard Windows untuk mengatur dan menekan pad dengan mouse. Belum berupa overlay mengambang yang dapat dipanggil di posisi kursor. | [Virtual Stream Deck][elgato-virtual] |
| Virtual deck overlay dengan layout bebas/unlimited keys | **Roadmap** | Always-on-top overlay, summon-to-cursor, resize layout, dan beberapa virtual device belum tersedia. | [Virtual Stream Deck][elgato-virtual] |
| Aplikasi iOS/Android dan pairing jaringan lokal | **Roadmap** | Belum ada companion mobile, QR pairing, sinkronisasi, atau remote control melalui Wi-Fi. | [Stream Deck Mobile][elgato-mobile] |

## Hardware, dials, dan touch controls

| Fitur Stream Deck | Status AERO DECK | Catatan AERO DECK | Sumber resmi |
| --- | --- | --- | --- |
| Dukungan tombol LCD Stream Deck | **Tidak relevan** | AERO dirancang sebagai alternatif software-only yang tidak memerlukan atau mengendalikan hardware Elgato. | [Virtual Stream Deck][elgato-virtual] |
| Dials: rotate, press, dan Dial Stack | **Tidak relevan** | AERO tidak memiliki dial fisik atau touch strip. Dukungan input generik seperti MIDI/gamepad dapat dievaluasi terpisah di masa depan. | [Dials][elgato-dials], [Dial Stacks][elgato-dial-stacks] |
| Action Wheel dan Action Trigger untuk dial | **Tidak relevan** | Keduanya khusus model dengan dial; bukan sasaran aplikasi keyboard-first saat ini. | [Action Wheel][elgato-action-wheel], [Action Trigger][elgato-action-trigger] |
| Touch strip: tap, hold, swipe, dan visual feedback | **Tidak relevan** | Tidak ada touch strip fisik pada AERO. Navigasi layar sentuh generik dapat menjadi fitur terpisah. | [Touch Strip][elgato-touch-strip] |
| Firmware, device discovery, dan network dock | **Tidak relevan** | AERO tidak mengelola firmware atau perangkat keras Elgato/Corsair. | [Stream Deck 7.0.1][elgato-7-0-1] |

## Kesimpulan cakupan

AERO DECK saat ini paling tepat disebut **alternatif software gratis untuk media
dan automation deck berbasis hotkey di Windows**. Selain soundboard/video,
AERO DECK menyediakan system action, perpindahan deck, `Sequence`,
`Bersamaan`, `Random`, `Toggle`, `Delay`, Stop All, tray/startup, dan backup
lokal. Source code tersedia dengan lisensi MIT.

AERO DECK belum setara dengan keseluruhan ekosistem Stream Deck. Belum tersedia
plugin/Marketplace, integrasi native OBS atau layanan streaming, pages/folders,
key logic press/double-press/hold, aplikasi mobile/pairing, maupun kontrol
hardware, dial, dan touch strip. Action Windows juga tidak menjanjikan perilaku
lintas platform.

AERO DECK mengimplementasikan konsep umum workflow deck secara independen. Proyek ini tidak menggunakan kode, aset, plugin, atau protokol proprietary Elgato; tidak mengklaim kompatibilitas dengan perangkat Stream Deck; dan tidak berafiliasi, disponsori, atau didukung oleh Elgato maupun Corsair. Nama produk dan merek dagang pihak ketiga tetap milik pemegangnya masing-masing.

## Sumber resmi Elgato

- [Stream Deck Software Release Notes][elgato-release-index]
- [Stream Deck 7.4.1 Release Notes][elgato-7-4-1]
- [Stream Deck 7.4.0 Release Notes][elgato-7-4-0]
- [System Actions][elgato-system-actions]
- [Soundboard][elgato-soundboard]
- [Profiles, Pages, Pinned Actions, dan Smart Profiles][elgato-profiles]
- [Multi Actions dan Key Logic][elgato-multi-action]
- [Plugins, SDK, dan Marketplace][elgato-plugins]
- [OBS Studio, Discord, Spotify, YouTube, dan Twitch][elgato-obs]
- [Virtual Stream Deck dan Stream Deck Mobile][elgato-virtual]
- [Dials, Dial Stacks, Action Wheel, Action Trigger, dan Touch Strip][elgato-dials]

[elgato-release-index]: https://help.elgato.com/hc/en-us/sections/5162671529357-Elgato-Stream-Deck-Software-Release-Notes
[elgato-7-4-1]: https://help.elgato.com/hc/en-us/articles/45744678572817-Elgato-Stream-Deck-7-4-1-Release-Notes
[elgato-7-4-0]: https://help.elgato.com/hc/en-us/articles/45347482546193-Elgato-Stream-Deck-7-4-Release-Notes
[elgato-7-0]: https://help.elgato.com/hc/en-us/articles/38011940576273-Elgato-Stream-Deck-7-0-Release-Notes
[elgato-7-0-1]: https://help.elgato.com/hc/en-us/articles/39330355624977-Elgato-Stream-Deck-7-0-1-Release-Notes
[elgato-6-6]: https://help.elgato.com/hc/en-us/articles/26005306818701-Elgato-Stream-Deck-6-6-Release-Notes
[elgato-system-actions]: https://help.elgato.com/hc/en-us/articles/360028234471-Elgato-Stream-Deck-System-Actions-Hotkey-File-Open-Weburl-Media-Controls-
[elgato-soundboard]: https://help.elgato.com/hc/en-us/articles/360059017631-Elgato-Stream-Deck-Soundboard
[elgato-audio-output]: https://help.elgato.com/hc/en-us/articles/360027954592-Elgato-Stream-Deck-Change-Play-Audio-Action-Playback-Device
[elgato-profiles]: https://help.elgato.com/hc/en-us/articles/33556495589905-Elgato-Stream-Deck-Download-and-use-Profiles
[elgato-pages]: https://help.elgato.com/hc/en-us/articles/4410312027277-Elgato-Stream-Deck-Pages
[elgato-pinned]: https://help.elgato.com/hc/en-us/articles/26638431612429-Elgato-Stream-Deck-Pinned-Actions-and-Folders
[elgato-smart-profiles]: https://help.elgato.com/hc/en-us/articles/360053419071-Elgato-Stream-Deck-Smart-Profiles
[elgato-multi-action]: https://help.elgato.com/hc/en-us/articles/360027960912-Elgato-Stream-Deck-Multi-Actions
[elgato-backup]: https://help.elgato.com/hc/en-us/articles/360048424432
[elgato-action-sharing]: https://help.elgato.com/hc/en-us/articles/29655138607505-Elgato-Stream-Deck-Action-Sharing
[elgato-icons]: https://help.elgato.com/hc/en-us/articles/360028237271-Elgato-Stream-Deck-Customizing-Key-Icons
[elgato-screensaver]: https://help.elgato.com/hc/en-us/articles/26543873678477-Elgato-Stream-Deck-How-to-set-an-Image-or-GIF-as-a-Screensaver
[elgato-plugins]: https://help.elgato.com/hc/en-us/articles/360028232451-Elgato-Stream-Deck-Plugins
[elgato-sdk]: https://help.elgato.com/hc/en-us/articles/360028243711-Elgato-Stream-Deck-SDK-Software-Version-6-4-and-newer
[elgato-marketplace]: https://help.elgato.com/hc/en-us/articles/20319863034381-Elgato-Stream-Deck-Store-transition-to-Marketplace
[elgato-obs]: https://help.elgato.com/hc/en-us/articles/360028239431--Elgato-Stream-Deck-OBS-Studio-Integration
[elgato-discord]: https://help.elgato.com/hc/en-us/articles/4422740578189-Elgato-Stream-Deck-Pedal-Discord-Plugin-Setup
[elgato-spotify]: https://marketplace.elgato.com/product/spotify-integration-windows-5e3a6d60-570a-40f3-b186-dbcd122216a2
[elgato-youtube]: https://marketplace.elgato.com/product/youtube-1aff8623-89a4-456e-88a8-76724ae7cb4b
[elgato-twitch]: https://help.elgato.com/hc/en-us/articles/360028233511-Elgato-Stream-Deck-Twitch-integration
[elgato-virtual]: https://help.elgato.com/hc/en-us/articles/35492041288337-Elgato-Stream-Deck-How-to-Add-and-Remove-a-Virtual-Device-Virtual-Stream-Deck
[elgato-mobile]: https://help.elgato.com/hc/en-us/articles/16786832942221-Elgato-Stream-Deck-Mobile-2-0-Getting-Started
[elgato-dials]: https://help.elgato.com/hc/en-us/articles/10715833118989-Elgato-Stream-Deck-Dials-Introduction
[elgato-dial-stacks]: https://help.elgato.com/hc/en-us/articles/10843581380109-Elgato-Stream-Deck-Dial-Stacks
[elgato-action-wheel]: https://help.elgato.com/hc/en-us/articles/28742375481997-Elgato-Stream-Deck-Action-Wheel
[elgato-action-trigger]: https://help.elgato.com/hc/en-us/articles/29655069662609-Elgato-Stream-Deck-Action-Trigger
[elgato-touch-strip]: https://help.elgato.com/hc/en-us/articles/10567698991629-Elgato-Stream-Deck-Touch-Strip
