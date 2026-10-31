#pragma once
#include <stddef.h>
#include <stdint.h>

// Antrian store-and-forward di kartu micro SD. Satu payload per baris NDJSON.
// Semua fungsi aman dipanggil saat kartu tidak ada: begin() mengembalikan
// false dan sisanya menjadi no-op, jadi node tetap jalan tanpa SD.

bool storage_begin();
bool storage_available();

// Menambah payload ke ujung antrian. false bila SD tidak siap atau antrian
// sudah mencapai SD_BUFFER_MAX_LINES.
bool storage_bufferAppend(const char* payload, size_t len);

// Jumlah baris yang belum terkirim.
uint16_t storage_bufferCount();

// Kirim ulang dari baris terlama. attempt mengembalikan true bila terkirim.
// Baris yang sukses dibuang; pengiriman berhenti pada kegagalan pertama agar
// urutan waktu tidak tertukar. Mengembalikan jumlah baris yang terkirim.
typedef bool (*StorageSendFn)(const char* payload, size_t len);
uint16_t storage_bufferFlush(StorageSendFn attempt);
