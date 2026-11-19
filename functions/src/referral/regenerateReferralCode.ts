import { onCall } from 'firebase-functions/v2/https';
import { writeAuditLog } from '../utils/audit';
import { assertActiveRole } from '../utils/auth';
import { performReferralRotation } from './performRotate';

export const regenerateReferralCode = onCall({ region: 'asia-southeast2' }, async (request) => {
  const caller = assertActiveRole(request, ['admin']);
  const res = await performReferralRotation('regenerated', caller.uid);
  await writeAuditLog({
    actorUid: caller.uid,
    action: 'referral:regenerate',
    target: 'secure/referral',
    after: { periodLabel: res.periodLabel },
  });
  return res;
});
