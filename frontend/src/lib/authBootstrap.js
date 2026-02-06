import { getToken, getSavedUser } from "./api";

export function bootstrapAuth() {
  const token = getToken();
  const user = getSavedUser();

  if (!token || !user) {
    return { ready: true, user: null };
  }

  return { ready: true, user };
}
