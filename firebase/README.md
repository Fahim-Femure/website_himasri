# firebase

Konfigurasi keamanan Firebase. Diisi agen saat membangun:

- `firestore.rules` — aturan sesuai `docs/05-firebase-backend.md` §4 dan matriks `docs/03-roles-and-access.md`.
- `firestore.indexes.json` — indeks sesuai `docs/04-data-model.md`.
- `storage.rules` — aturan berkas (hero, produk, materi, avatar).
- `tests/` — unit test Rules memakai `@firebase/rules-unit-testing` di emulator.

`firebase.json` dan `.firebaserc` berada di root proyek dan menunjuk ke berkas di folder ini.
