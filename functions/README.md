# functions — Cloud Functions (2nd gen, TypeScript, Node 20)

Region: `asia-southeast2` (Jakarta). Daftar fungsi lengkap: `docs/05-firebase-backend.md` §3.

```
functions/src/
├─ index.ts          ← ekspor semua fungsi
├─ auth/             ← registerMember, checkReferralCode, approveMember, rejectMember
├─ referral/         ← rotateReferralCode (onSchedule), regenerateReferralCode, generator kode
├─ admin/            ← setUserRole, setUserStatus, adminResetPassword, trigger hapus berkas
└─ utils/            ← nimToEmail, validasi Zod bersama, assertRole, rate limit
```
