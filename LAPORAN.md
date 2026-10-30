# Laporan Praktikum Modul 2 — Rendering Pipeline & Primitif 2D

**Nama:** ……………  **NIM:** ……………  **Mata kuliah:** Grafika Komputer (25MP7716G030)
**Subjek:** Candi Borobudur (sama dengan subjek Modul 1, folder `photos/borobudur_01…15.jpg`)

> Draf ini disiapkan dengan bantuan asisten AI untuk bagian A2–A4 (angka diambil dari hasil run di laptop sendiri). Bagian bertanda **[ISI]** / **[TULIS SENDIRI]** wajib ditulis sendiri. Baca semua draf sampai paham dan tulis ulang dengan kalimatmu — viva akan menanyakannya. Sesuaikan dengan aturan penggunaan AI di mata kuliah.

**Toolchain** [ISI dari laptopmu]: OS Windows 11 (10.0.22621) · Node ……(`node -v`) · Chrome ……(chrome://version) · three.js 0.160.0 · tanggal 30/10/2026

## 1. Input & penempatan di pipeline (A1)
**Sumber denah (jujur):** `myplan.json` adalah *skema sederhana* Borobudur (alas ± 120 × 120 m, 5 teras persegi + 3 teras bundar + stupa induk + 4 tangga + 28 stupa berlubang, 83 polyline) dengan dimensi **perkiraan**, dibuat oleh `gen_myplan.mjs`. Bukan hasil trace dari foto/sketsa denah — foto Modul 1 adalah foto pemandangan/stupa, bukan denah dari atas.

**Satu segmen dinding melewati 7 tahap** [TULIS SENDIRI, satu baris per tahap]:
1. Application — …
2. Vertex processing — …(petunjuk: `makeWorldToScreen` di `plan.mjs`: skala + offset + flip y)
3. Primitive assembly & clipping — …
4. Rasterisation — …(`lineBresenham`)
5. Fragment shading — …
6. Per-fragment operations — …
7. Framebuffer — …(`out/plan_scratch.ppm`)

**Jika satu tahap dilewati** [TULIS SENDIRI, pilih satu tahap, mis. flip y di tahap 2 → denah tampil terbalik].

## 2. Primitif from-scratch dicocokkan dengan referensi (A2)
**Reproduksi satu piksel secara manual.** Persegi 6×6 dibelah di diagonal y = x:
T1 = A(2,2) B(8,2) C(8,8), T2 = A(2,2) B(8,8) C(2,8); total E_AB(C) = 36 > 0 (konvensi y-bawah). Sampel di pusat piksel (x+0,5, y+0,5). Rumus: E_XY(P) = (Y_x−X_x)(P_y−X_y) − (Y_y−X_y)(P_x−X_x). Bias tiap edge X→Y: 0 jika (dy = 0 dan dx < 0) atau dy > 0, selain itu −1. Piksel "di dalam" jika ketiga E + bias ≥ 0.

**Piksel (4,4) → pusat (4.5, 4.5), tepat di diagonal (kasus on-edge):**
- T1: E_BC = −6·(4.5−8) = 21 (bias 0) → 21; E_CA = (−6)(4.5−8) − (−6)(4.5−8) = 0 (edge ini turun-ke-atas, dy = −6, bias −1) → **−1** ⇒ **tidak digambar**.
- T2: E_BC = 21 (bias 0); E_CA = 15 (bias −1) → 14; E_AB = 6·2.5 − 6·2.5 = 0 (dy = 6 > 0, bias 0) → **0** ⇒ **digambar**.
Jadi piksel on-edge ini dimiliki **tepat satu** segitiga (T2).

| Piksel | Pusat | T1 (E_BC, E_CA, E_AB setelah bias) | T2 | Hasil |
|---|---|---|---|---|
| (6,3) | (6.5,3.5) | 9, 17, 8 → semua ≥ 0 | 27, 26, −18 → ada < 0 | di dalam T1 |
| (4,4) | (4.5,4.5) | 21, **−1**, 14 → ditolak | 21, 14, **0** → lolos | on-edge → T2 |
| (3,6) | (3.5,6.5) | 27, −19, … → ditolak | 9, 8, 18 → semua ≥ 0 | di dalam T2 |

Cocok dengan kode: `node a2_check.mjs 4 4` (dan `6 3`, `3 6`) mencetak MATCH untuk semua kasus.
**DDA & Bresenham:** `tests.mjs` memverifikasi (2,1)→(9,5) = [(2,1),(3,2),(4,2),(5,3),(6,3),(7,4),(8,4),(9,5)] untuk keduanya; pada 20.000 garis acak keduanya 100 % identik (`lab2_lines.mjs`). Segitiga contoh A(1,1) B(6,2) C(3,7) byte-identik dengan `ref/tri_ref.ppm`. Hasil `node tests.mjs`: ALL CHECKS PASSED (13 ok, 0 fail). Catatan: `tri_ref.ppm` dibuat dari kode yang sama, jadi fungsinya cek regresi, bukan acuan independen.

## 3. Diagnosis & perbaikan celah shared-edge (A3)
**Bukti dari piksel** (`node triangle_gap_bug.mjs`, persegi 6×6 dibelah y = x):
| Aturan | once | twice | gaps |
|---|---|---|---|
| `>= 0` tanpa top-left | 30 | **6** | 0 |
| `> 0` tanpa top-left | 30 | 0 | **6** |
| dengan top-left | **36** | **0** | **0** |
Gambar: `out/gap_coverage_buggy.ppm` (merah = ganda) dan `out/gap_fixed.ppm`.

**Penyebab:** 6 piksel di diagonal (pusat (2.5,2.5)…(7.5,7.5)) punya edge function = 0 pada kedua segitiga. `>= 0` → keduanya menggambar (ganda); `> 0` → tak satu pun (celah).
**Perbaikan:** bias per-edge — 0 untuk edge yang "dimiliki" segitiga itu, −1 untuk lainnya — sehingga piksel on-edge lolos di tepat satu segitiga.
**Edge mana yang dapat bias 0 / −1** (aturan di `raster.mjs`): bias 0 jika edge horizontal dengan dx < 0 atau edge yang turun di layar (dy > 0); selainnya −1. Pada diagonal contoh: bagi T2 diagonalnya adalah edge A→B (dy = +6) → bias 0; bagi T1 diagonal yang sama adalah edge C→A (dy = −6) → bias −1. Maka piksel diagonal dimenangkan T2.

**Temuan tambahan (ukur sendiri, verifikasi dengan dosen):** modul menamai aturan ini "top-left". Namun dengan y-bawah dan total > 0 (searah jarum jam di layar), edge yang turun (dy > 0) berada di sisi **kanan** segitiga, dan edge horizontal dengan dx < 0 berada di sisi **bawah**. Uji `edge_test` pada persegi dengan pusat piksel tepat di tepi: kolom kiri tidak terisi, kolom kanan terisi, baris atas tidak terisi, baris bawah terisi. Secara geometris ini aturan *bottom-right*; tetap sah dan watertight karena konsisten (setiap piksel on-edge diklaim sekali). Sebut ini jika ditanya di viva.

## 4. Pustaka (Three.js) vs from-scratch, dan keputusannya (A4)
**Perbandingan** (`node compare.mjs out/plan_scratch.ppm plan_three.ppm`, laptop sendiri):
| Konfigurasi | Piksel identik | PSNR | SSIM | max \|diff\| |
|---|---|---|---|---|
| Kamera default (hasil laptopmu) | 453.017 / 480.000 | **21,3 dB** | **0,977** | 235 |
| Kamera digeser ½ piksel `?align=half`* | 478.170 / 480.000 | 35,5 dB | 0,999 | 176 |
\*Diukur asisten di Chromium headless (SwiftShader); ulangi sendiri: buka `/web/?align=half`, Export PPM, compare. [ISI angka milikmu bila diulang]

**Analisis selisih** (`out/plan_diff.png`, selisih ×6): gelap di semua tempat kecuali outline selebar ±1 piksel di sepanjang garis; interior siluet identik. Penyebab: (1) **konvensi sampel** — `raster.mjs` menyalakan piksel (x,y) berdasar pusat (x+0,5, y+0,5), sedangkan kamera ortografik Three.js menaruh koordinat x di *batas* piksel, sehingga garis 1 px terbelah ke dua piksel tetangga dan diredam; menggeser kamera ½ piksel menyelaraskan keduanya (21→35 dB); (2) **anti-aliasing MSAA** pustaka vs garis keras Bresenham; (3) beda penentuan piksel pada garis miring/lingkaran. Dua jebakan pipeline lain yang ditemui: kamera y-bawah membalik winding sehingga `ShapeGeometry` ter-cull (siluet hilang, PSNR 3,4 dB) sampai memakai `side: THREE.DoubleSide`; dan `setPixelRatio(1)` + ukuran kanvas eksplisit agar kedua gambar 800×600.

**Prediksi vs pengukuran forward/backward** (`node bench.mjs`, 374 segmen, 800×600, 20 iterasi):
| Zoom | Forward | Backward | Rasio |
|---|---|---|---|
| 1× | 2,021 ms | 4893,8 ms | 2422× |
| 10× | 3,802 ms | 3095,5 ms | 814× |
**Prediksi:** forward menggambar hanya piksel garis (≈ jumlah piksel total garis), backward menguji tiap piksel layar terhadap tiap segmen (800×600×374 ≈ 1,8·10⁸ uji jarak) sehingga forward jauh lebih cepat; forward naik saat zoom 10× (garis lebih panjang), backward kira-kira datar. [TULIS: apakah prediksi ini kamu tulis sebelum atau sesudah melihat hasil — tulis jujur.]
**Rekonsiliasi:** arah prediksi terbukti. Forward naik ±1,9× di zoom 10× (2,0 → 3,8 ms); backward tidak naik, kira-kira datar (4894 → 3096 ms; selisihnya dalam kisaran variasi mesin dan efek `break` saat sebuah piksel sudah menyala). Rasio menyusut 2422× → 814× karena biaya forward naik.
**Keputusan:** untuk viewer denah pan/zoom pakai **forward rasterization** (jauh lebih murah per frame).

**Pernyataan keterbatasan** (pilihan berbalik bila):
1. Zoom sangat besar tanpa clipping: forward tetap menelusuri seluruh panjang segmen walau sebagian besar di luar layar → biaya ∝ panjang garis (jutaan piksel), sedangkan backward tetap ~datar.
2. Efek per-piksel (anti-aliasing berbasis jarak, glow, SDF): backward alami karena tiap piksel menghitung jaraknya sendiri.
3. Jumlah segmen sangat banyak (10.000) di layar kecil + indeks spasial (grid): backward hanya menguji segmen di sel sekitar sehingga bisa mengejar; di GPU, backward per-piksel paralel murah.

## 5. Aksesibilitas legenda (A5)
Legenda: ramp **viridis** 5 langkah (luminansi bervariasi) + **label** teks + **bentuk penanda** berbeda per kategori (■ ◆ ▲ ● ‖). Screenshot: `out/legend_normal.png`, `out/legend_deuteranopia.png`, `out/legend_protanopia.png` [ISI: screenshot dari browsermu]. [TULIS SENDIRI: apakah kelima kategori tetap terbedakan di tiap filter? kategori mana yang paling mirip dan apa yang membedakannya — label dan bentuk penanda.]

## 6. Reproducibility & viva (A6)
- URL GitHub Pages: [ISI] — `https://<username>.github.io/<repo>/web/`
- Transkrip clone bersih (`git clone` → `npm install` → `npm test` hijau): [ISI tempel hasil terminal]
- Refleksi half-pixel Direct3D 9 vs 10 (±½ halaman; sumber + tanggal): [TULIS SENDIRI]
- Refleksi Lab 3 (tahap pipeline yang diambil alih pustaka vs yang tetap harus benar; apa yang pertama rusak pada 10.000 segmen): [TULIS SENDIRI]
