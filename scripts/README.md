# scripts

- `seed/seed.ts` — mengisi Firestore/Storage (emulator atau proyek) dengan data di `docs/07-content-and-seed-data.md` §4. Idempotent. Flag `--demo` hanya untuk emulator.
- `seed/bootstrap-admin.ts` — membuat akun admin pertama (`--nim --nama --password`) dan kode referal awal bila belum ada.

Jalankan lewat skrip npm di root: `npm run seed`, `npm run bootstrap:admin -- --nim ... --nama "..." --password ...`.
