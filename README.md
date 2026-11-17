# Harianku

Aplikasi pencatat harian dengan JavaScript biasa, tanpa framework dan tanpa proses build. Bisa dipasang di layar utama HP seperti aplikasi biasa dan tetap jalan tanpa internet.

## Isi

- Tugas: tenggat, prioritas, penanda terlambat, daftar selesai
- Keuangan: pemasukan dan pengeluaran, batas bulanan, rincian per kategori, sisa uang per hari
- Kebiasaan: centang 7 hari terakhir dan hitung hari berturut-turut

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

## Berkas

- `index.html`: struktur halaman
- `style.css`: tampilan, termasuk tema terang dan gelap otomatis
- `app.js`: seluruh logika aplikasi
- `manifest.webmanifest`: nama, warna, dan ikon aplikasi
- `sw.js`: service worker yang menyimpan berkas agar bisa dibuka tanpa internet
- `icon-192.png`, `icon-512.png`, `apple-touch-icon.png`: ikon

## Penyimpanan

Data disimpan di localStorage browser dengan kunci `harianku-v1`. Data di HP dan di komputer terpisah dan tidak saling tersinkron. Menghapus data situs di browser juga menghapus catatan Anda.

Saat pertama dibuka, aplikasi menampilkan data contoh. Tombol "Hapus semua contoh" membersihkannya.

## Memperbarui

Kalau Anda mengubah berkas aplikasi, ganti nilai `CACHE` di `sw.js` (misalnya `harianku-v2`) supaya HP mengambil versi terbaru.
