# Harianku

Aplikasi pencatat harian dengan JavaScript biasa, tanpa framework dan tanpa proses build. Bisa dipasang di layar utama HP seperti aplikasi biasa dan tetap jalan tanpa internet.

## Isi

- Tugas: tenggat, prioritas, penanda terlambat, daftar selesai
- Keuangan: pemasukan dan pengeluaran, batas bulanan, rincian per kategori, sisa uang per hari
- Kebiasaan: centang 7 hari terakhir dan hitung hari berturut-turut
- Data: unduh CSV dan kirim otomatis ke Google Sheets

## Mencoba di komputer

Buka `index.html` di browser. Untuk mencoba fitur pemasangan, jalankan lewat server lokal:

```
python3 -m http.server 8000
```

lalu buka http://localhost:8000.

## Memasang di HP

Agar bisa dipasang, berkas harus dibuka lewat alamat https (membuka `index.html` langsung dari penyimpanan HP tidak bisa dipasang). Caranya:

1. Unggah seluruh isi folder ini ke layanan hosting statis yang gratis, misalnya Netlify, Cloudflare Pages, atau GitHub Pages. Semua berkas harus berada di folder yang sama.
2. Buka alamat situsnya di HP.
3. Android (Chrome): buka menu titik tiga, pilih "Instal aplikasi" atau "Tambahkan ke layar utama".
4. iPhone (Safari): ketuk tombol Bagikan, pilih "Tambahkan ke Layar Utama".

## Menyimpan ke Google Sheets

Di tab Data ada dua cara.

### Unduh CSV

Ketuk tombol Tugas, Keuangan, atau Kebiasaan. Di HP muncul lembar bagikan, pilih Sheets atau simpan ke Berkas. Di komputer berkasnya langsung terunduh. Buka di Google Sheets lewat File, Impor. Isi contoh tidak ikut diunduh.

### Kirim otomatis

Aplikasi mengirim semua data ke Google Sheet Anda lewat skrip Google Apps Script. Arahnya satu arah, dari aplikasi ke sheet.

1. Buat sheet kosong di sheets.new.
2. Buka Ekstensi, lalu Apps Script.
3. Hapus isi editor, lalu tempel isi `google-apps-script.gs`. Ganti nilai `KATA_SANDI` dengan kata sandi Anda sendiri, lalu simpan.
4. Klik Terapkan, lalu Penerapan baru. Pilih jenis Aplikasi web. Isi "Jalankan sebagai" dengan Saya dan "Yang memiliki akses" dengan Siapa saja. Klik Terapkan dan beri izin saat diminta. Kalau muncul peringatan aplikasi belum diverifikasi, pilih Lanjutan, lalu lanjutkan ke skrip Anda.
5. Salin URL aplikasi web yang berakhiran `/exec`.
6. Di aplikasi, buka tab Data, tempel URL dan kata sandi yang sama, centang "Kirim otomatis", lalu klik Simpan pengaturan.

Hasilnya tiga sheet yang ditulis ulang setiap kali data dikirim:

- `Tugas`: Tugas, Selesai, Tenggat, Prioritas
- `Keuangan`: Tanggal, Jenis, Kategori, Catatan, Jumlah
- `Kebiasaan`: Kebiasaan, Tanggal (satu baris untuk setiap hari yang dicentang)

Catatan penting:

- Isi tiga sheet itu ditimpa setiap kali data dikirim. Jangan menaruh catatan Anda sendiri di dalamnya. Gunakan sheet lain untuk rumus atau grafik yang merujuk ke sana.
- Kalau dua perangkat mengirim ke sheet yang sama, yang terakhir kirim menimpa yang lain.
- Siapa pun yang tahu URL skrip dan kata sandinya bisa menulis ke sheet Anda. Jangan bagikan keduanya.
- URL dan kata sandi disimpan di browser perangkat itu saja, bukan di sheet dan bukan di repositori.
- Kalau Anda mengubah skripnya nanti, buat Penerapan baru lagi agar perubahannya berlaku.

## Berkas

- `index.html`: struktur halaman
- `style.css`: tampilan, termasuk tema terang dan gelap otomatis
- `app.js`: seluruh logika aplikasi
- `manifest.webmanifest`: nama, warna, dan ikon aplikasi
- `sw.js`: service worker yang menyimpan berkas agar bisa dibuka tanpa internet
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`: ikon
- `google-apps-script.gs`: skrip yang ditempel di Google Sheet Anda (tidak perlu diunggah ke hosting)

## Penyimpanan

Data disimpan di localStorage browser dengan kunci `harianku-v1`. Data di HP dan di komputer terpisah dan tidak saling tersinkron, kecuali lewat Google Sheets satu arah di atas. Menghapus data situs di browser juga menghapus catatan Anda.

Saat pertama dibuka, aplikasi menampilkan data contoh. Tombol "Hapus semua contoh" membersihkannya.

## Memperbarui

Kalau Anda mengubah berkas aplikasi, naikkan nilai `CACHE` di `sw.js` (misalnya dari `harianku-v2` menjadi `harianku-v3`) supaya HP mengambil versi terbaru.
