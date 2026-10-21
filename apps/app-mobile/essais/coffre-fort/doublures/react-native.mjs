export const Platform = {
  get OS() {
    return globalThis.__plateforme ?? "ios";
  },
};

export const DevSettings = { reload() {} };
