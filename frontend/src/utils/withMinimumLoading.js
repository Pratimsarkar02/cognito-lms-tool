export const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const withMinimumLoading = async (asyncTask, minDuration = 800) => {
  const [result] = await Promise.all([
    asyncTask(),
    wait(minDuration),
  ]);
  return result;
};

/* 

export const MIN_BUTTON_LOADING_MS = 1000;

export const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const withMinimumLoading = async (
  asyncTask,
  minDuration = MIN_BUTTON_LOADING_MS
) => {
  const [result] = await Promise.all([
    asyncTask(),
    wait(minDuration),
  ]);
  return result;
};

 */