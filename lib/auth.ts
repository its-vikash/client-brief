// ── Auth layer — Supabase when configured, localStorage fallback otherwise ────
//
// ARCHITECTURE:
//   • When NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY are set
//     to real values → all auth goes through Supabase (email+password, JWT sessions).
//   • Otherwise → localStorage-based auth (SHA-256 hashed passwords).
//
// The UI calls the same functions (login, signup, logout, getCurrentUser)
// regardless of which backend is active.

import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface AuthUser {
  id:        string;
  name:      string;
  email:     string;
  initials:  string;
  role:      string;
  createdAt: string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

async function hashPassword(password: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(password));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function looksLikeHash(s: string): boolean {
  return /^[0-9a-f]{64}$/.test(s);
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

function makeInitials(name: string): string {
  return name.trim().split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// ── localStorage account store (fallback only) ────────────────────────────────

const LS_AUTH_KEY      = "cb_auth_user";
const LS_ACCOUNTS_KEY  = "cb_accounts";

interface StoredAccount { passwordHash: string; user: AuthUser; }

function getAccounts(): Record<string, StoredAccount> {
  if (typeof window === "undefined") return {};
  try { const r = localStorage.getItem(LS_ACCOUNTS_KEY); return r ? JSON.parse(r) : {}; }
  catch { return {}; }
}
function saveAccounts(a: Record<string, StoredAccount>) {
  localStorage.setItem(LS_ACCOUNTS_KEY, JSON.stringify(a));
}

// ── Supabase helpers ──────────────────────────────────────────────────────────

function supabaseUserToAuthUser(user: { id: string; email?: string; user_metadata?: Record<string, string> }): AuthUser {
  const name = user.user_metadata?.name ?? user.email ?? "User";
  return {
    id:        user.id,
    name,
    email:     user.email ?? "",
    initials:  makeInitials(name),
    role:      user.user_metadata?.role ?? "Independent studio",
    createdAt: user.user_metadata?.createdAt ?? new Date().toISOString(),
  };
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function signup(
  name:     string,
  email:    string,
  password: string,
  role      = "Independent studio"
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (!isValidEmail(email))          return { ok: false, error: "Please enter a valid email address." };
  if (name.trim().length < 2)        return { ok: false, error: "Name must be at least 2 characters." };
  if (password.length < 6)           return { ok: false, error: "Password must be at least 6 characters." };

  // ── Supabase path ──────────────────────────────────────────────────────────
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signUp({
      email: email.toLowerCase().trim(),
      password,
      options: {
        data: { name: name.trim(), role, createdAt: new Date().toISOString() },
      },
    });
    if (error) {
      if (error.message.toLowerCase().includes("already registered"))
        return { ok: false, error: "An account with this email already exists." };
      return { ok: false, error: error.message };
    }
    if (!data.user) return { ok: false, error: "Signup failed. Please try again." };
    return { ok: true, user: supabaseUserToAuthUser(data.user) };
  }

  // ── localStorage fallback ──────────────────────────────────────────────────
  const key      = email.toLowerCase().trim();
  const accounts = getAccounts();
  if (accounts[key]) return { ok: false, error: "An account with this email already exists." };

  const user: AuthUser = {
    id:        crypto.randomUUID(),
    name:      name.trim(),
    email:     key,
    initials:  makeInitials(name),
    role,
    createdAt: new Date().toISOString(),
  };
  accounts[key] = { passwordHash: await hashPassword(password), user };
  saveAccounts(accounts);
  localStorage.setItem(LS_AUTH_KEY, JSON.stringify(user));
  return { ok: true, user };
}

export async function login(
  email:    string,
  password: string
): Promise<{ ok: true; user: AuthUser } | { ok: false; error: string }> {
  if (!isValidEmail(email)) return { ok: false, error: "Please enter a valid email address." };
  const GENERIC = "Incorrect email or password.";

  // ── Supabase path ──────────────────────────────────────────────────────────
  if (isSupabaseConfigured()) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: email.toLowerCase().trim(),
      password,
    });
    if (error || !data.user) return { ok: false, error: GENERIC };
    return { ok: true, user: supabaseUserToAuthUser(data.user) };
  }

  // ── localStorage fallback ──────────────────────────────────────────────────
  const accounts = getAccounts();
  const key      = email.toLowerCase().trim();
  const account  = accounts[key];
  if (!account) return { ok: false, error: GENERIC };

  // Support both old format (account.password plain-text) and new (account.passwordHash)
  const storedHash = account.passwordHash ?? (account as unknown as { password?: string }).password ?? "";

  let match = false;
  if (looksLikeHash(storedHash)) {
    // Modern hashed password
    match = (await hashPassword(password)) === storedHash;
  } else {
    // Legacy plain-text password — compare directly then upgrade
    match = storedHash === password;
    if (match) {
      accounts[key] = { ...account, passwordHash: await hashPassword(password) };
      saveAccounts(accounts);
    }
  }
  if (!match) return { ok: false, error: GENERIC };

  localStorage.setItem(LS_AUTH_KEY, JSON.stringify(account.user));
  return { ok: true, user: account.user };
}

export function logout(): void {
  if (typeof window === "undefined") return;
  if (isSupabaseConfigured()) {
    // Fire and forget — redirect is handled by the calling component
    supabase.auth.signOut().catch(console.error);
  }
  localStorage.removeItem(LS_AUTH_KEY);
}

export function getCurrentUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  // For Supabase we read from localStorage cache written by getSupabaseUser()
  // The actual session is in the supabase auth storage — this is just a quick
  // synchronous check for the auth guard (the async version is getSupabaseUser).
  try {
    const raw = localStorage.getItem(LS_AUTH_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  } catch { return null; }
}

/** Async version — refreshes from Supabase session if configured. */
export async function getSupabaseUser(): Promise<AuthUser | null> {
  if (!isSupabaseConfigured()) return getCurrentUser();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) {
    localStorage.removeItem(LS_AUTH_KEY);
    return null;
  }
  const user = supabaseUserToAuthUser(session.user);
  // Keep the LS cache in sync so getCurrentUser() is fast
  localStorage.setItem(LS_AUTH_KEY, JSON.stringify(user));
  return user;
}

export async function resetPassword(
  email: string, oldPassword: string, newPassword: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (newPassword.length < 6)        return { ok: false, error: "New password must be at least 6 characters." };
  if (oldPassword === newPassword)   return { ok: false, error: "New password must be different from the current one." };

  if (isSupabaseConfigured()) {
    // Supabase: verify old password by re-authenticating, then update
    const loginResult = await login(email, oldPassword);
    if (!loginResult.ok) return { ok: false, error: "Current password is incorrect." };
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  }

  // localStorage fallback
  const loginResult = await login(email, oldPassword);
  if (!loginResult.ok) return { ok: false, error: "Current password is incorrect." };
  const accounts = getAccounts();
  const key      = email.toLowerCase().trim();
  accounts[key]  = { passwordHash: await hashPassword(newPassword), user: accounts[key].user };
  saveAccounts(accounts);
  return { ok: true };
}

/** Emergency: wipe ALL local data (dev / locked-out users). */
export function wipeAndReset(): void {
  if (typeof window === "undefined") return;
  for (const k of Object.keys(localStorage)) {
    if (k.startsWith("cb_")) localStorage.removeItem(k);
  }
  localStorage.removeItem(LS_AUTH_KEY);
  localStorage.removeItem(LS_ACCOUNTS_KEY);
  console.info("[client-brief] All local data cleared. Please sign up again.");
}
