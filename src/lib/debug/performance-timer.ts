export async function withQueryTimer<T>(
  label: string,
  promise: PromiseLike<T>
): Promise<T> {
  const start = performance.now();

  try {
    return await promise;
  } finally {
    logQueryTime(label, start);
  }
}

export async function withTimer<T>(
  label: string,
  callback: () => Promise<T>
): Promise<T> {
  const start = performance.now();

  try {
    return await callback();
  } finally {
    logQueryTime(label, start);
  }
}

function logQueryTime(label: string, start: number) {
  if (process.env.NODE_ENV === "production") return;

  const elapsed = Math.round(performance.now() - start);
  console.log(`[QueryTimer] ${label}: ${elapsed}ms`);
}
