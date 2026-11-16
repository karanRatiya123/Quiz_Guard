/**
 * Exam paper upload.
 *
 * The app has no backend endpoint yet, so this simulates the network round trip
 * and reports progress on the way. The screen only depends on this signature —
 * swap the body for the real request (fetch + FormData, or a signed URL PUT that
 * forwards `xhr.upload.onprogress` to `onProgress`) when the endpoint exists, and
 * nothing in the UI has to change.
 */

export type UploadableFile = {
  uri: string;
  name: string;
  mimeType?: string;
  size?: number;
};

export type UploadTask = {
  /** Resolves when the paper is on the server, rejects if it is cancelled. */
  promise: Promise<{ uri: string }>;
  /** Aborts the upload; the promise then rejects with `UploadCancelledError`. */
  cancel: () => void;
};

/** Thrown when the upload is cancelled — the screen treats this as "no error". */
export class UploadCancelledError extends Error {
  constructor() {
    super('Upload cancelled');
    this.name = 'UploadCancelledError';
  }
}

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

/** Steps that read like real upload progress: quick start, slower tail. */
const STEPS = 22;
const STEP_MS = 85;

export function uploadPaper(
  file: UploadableFile,
  onProgress: (fraction: number) => void,
): UploadTask {
  let cancelled = false;

  const promise = (async () => {
    onProgress(0);

    for (let step = 1; step <= STEPS; step += 1) {
      await delay(STEP_MS);
      if (cancelled) throw new UploadCancelledError();

      const linear = step / STEPS;
      // Ease-out: most of the bar fills early, the last chunk takes its time.
      const eased = 1 - (1 - linear) ** 2;
      onProgress(Math.min(0.98, eased));
    }

    if (cancelled) throw new UploadCancelledError();
    onProgress(1);
    return { uri: file.uri };
  })();

  return {
    promise,
    cancel: () => {
      cancelled = true;
    },
  };
}
