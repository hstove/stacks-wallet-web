import { analytics } from '@shared/utils/analytics';

export enum WorkerScript {
  DecryptionWorker = 'decryption-worker.js',
}

export function createWorker(scriptName: WorkerScript) {
  const worker = new Worker(scriptName);
  worker.addEventListener('error', error => {
    analytics?.track(`worker_error_thrown_${scriptName}`, { error });
  });

  return worker;
}
