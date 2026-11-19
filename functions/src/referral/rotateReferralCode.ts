import { onSchedule } from 'firebase-functions/v2/scheduler';
import { performReferralRotation } from './performRotate';

export async function runRotateReferralCodeJob(referenceDate = new Date()) {
  return performReferralRotation('rotated', 'system', referenceDate);
}

export const rotateReferralCode = onSchedule(
  {
    schedule: '0 0 1 1,3,5,7,9,11 *',
    timeZone: 'Asia/Jakarta',
    region: 'asia-southeast2',
  },
  async () => {
    await runRotateReferralCodeJob(new Date());
  },
);
