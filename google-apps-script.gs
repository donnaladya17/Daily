/*
  Harianku ke Google Sheets
  Tempel seluruh isi berkas ini di Ekstensi > Apps Script pada Google Sheet Anda.
  Ubah KATA_SANDI di bawah, lalu terbitkan sebagai aplikasi web (lihat README).
  Skrip ini menulis ulang tiga sheet: Tugas, Keuangan, dan Kebiasaan.
*/

var KATA_SANDI = 'ganti-dengan-kata-sandi-anda';

function doGet() {
  return json_({ ok: true, pesan: 'Skrip Harianku aktif. Data dikirim dari aplikasi.' });
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  try {
    lock.waitLock(20000);
    var data = JSON.parse(e.postData.contents);
    if (data.kataSandi !== KATA_SANDI) {
      return json_({ ok: false, pesan: 'kata sandi tidak cocok' });
    }
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    tulis_(ss, 'Tugas', data.tugas, []);
    tulis_(ss, 'Keuangan', data.keuangan, [0]);   // kolom 1 berisi tanggal
    tulis_(ss, 'Kebiasaan', data.kebiasaan, [1]); // kolom 2 berisi tanggal
    return json_({ ok: true });
  } catch (err) {
    return json_({ ok: false, pesan: String(err) });
  } finally {
    try { lock.releaseLock(); } catch (x) {}
  }
}

function tulis_(ss, nama, baris, kolomTanggal) {
  if (!baris || !baris.length) return;
  var sh = ss.getSheetByName(nama) || ss.insertSheet(nama);
  var tz = ss.getSpreadsheetTimeZone();
  var rows = baris.map(function (r, i) {
    return r.map(function (v, c) {
      if (i > 0 && kolomTanggal.indexOf(c) >= 0 && v) {
        return Utilities.parseDate(v, tz, 'yyyy-MM-dd');
      }
      // Teks yang diawali = + - @ dijadikan teks biasa, bukan rumus.
      if (typeof v === 'string' && /^[=+\-@]/.test(v)) return "'" + v;
      return v;
    });
  });
  sh.clearContents();
  sh.getRange(1, 1, rows.length, rows[0].length).setValues(rows);
  sh.getRange(1, 1, 1, rows[0].length).setFontWeight('bold');
  sh.setFrozenRows(1);
  if (rows.length > 1) {
    kolomTanggal.forEach(function (c) {
      sh.getRange(2, c + 1, rows.length - 1, 1).setNumberFormat('yyyy-mm-dd');
    });
  }
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
