import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AuthUser, DraftInspection, TokenStore } from "@labelly/shared";

const TOKEN_KEY = "labelly.authToken";
const USER_KEY = "labelly.authUser";
const DRAFTS_KEY = "labelly.draftInspections";

let cachedToken: string | null = null;
let cachedUser: AuthUser | null = null;

export const tokenStore: TokenStore = {
  getToken: () => cachedToken,
  setToken: (token: string | null) => {
    cachedToken = token;
  },
  clear: () => {
    cachedToken = null;
  },
};

export async function hydrateAuth(): Promise<{
  token: string | null;
  user: AuthUser | null;
}> {
  try {
    const [token, userJson] = await Promise.all([
      AsyncStorage.getItem(TOKEN_KEY),
      AsyncStorage.getItem(USER_KEY),
    ]);
    cachedToken = token;
    cachedUser = userJson ? (JSON.parse(userJson) as AuthUser) : null;
  } catch {
    cachedToken = null;
    cachedUser = null;
  }
  return { token: cachedToken, user: cachedUser };
}

export async function persistAuth(
  token: string | null,
  user: AuthUser | null
): Promise<void> {
  cachedToken = token;
  cachedUser = user;
  tokenStore.setToken(token);
  await AsyncStorage.multiSet([
    [TOKEN_KEY, token ?? ""],
    [USER_KEY, user ? JSON.stringify(user) : ""],
  ]);
}

export async function clearStoredAuth(): Promise<void> {
  cachedToken = null;
  cachedUser = null;
  tokenStore.setToken(null);
  await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
}

export function getCachedUser(): AuthUser | null {
  return cachedUser;
}

export async function loadDrafts(): Promise<DraftInspection[]> {
  try {
    const raw = await AsyncStorage.getItem(DRAFTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as DraftInspection[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeDrafts(drafts: DraftInspection[]): Promise<void> {
  await AsyncStorage.setItem(DRAFTS_KEY, JSON.stringify(drafts));
}

export async function addDraft(draft: DraftInspection): Promise<void> {
  const drafts = await loadDrafts();
  await writeDrafts([draft, ...drafts]);
}

export async function updateDraft(draft: DraftInspection): Promise<void> {
  const drafts = await loadDrafts();
  await writeDrafts(
    drafts.map((d) => (d.inspectionId === draft.inspectionId ? draft : d))
  );
}

export async function removeDraft(inspectionId: string): Promise<void> {
  const drafts = await loadDrafts();
  await writeDrafts(drafts.filter((d) => d.inspectionId !== inspectionId));
}