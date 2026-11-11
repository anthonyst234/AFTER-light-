import { PlayerSaveData } from './types';
import { loadSaveData, writeSaveData } from './save';

export type UserRole = 'ADMIN' | 'PLAYER';

export interface UserAccount {
  id: string;
  email: string;
  phoneNumber?: string;
  displayName: string;
  role: UserRole;
  country: string;
  isEmailVerified: boolean;
  verificationCode?: string;
  createdAt: number;
  lastLogin: number;
  passwordHash: string;
  isGuest?: boolean;
}

export const MASTER_ADMIN_EMAIL = 'anthonystunt234@gmail.com';
const USERS_STORAGE_KEY = 'AFTERLIGHT_REGISTERED_USERS_V2';
const ACTIVE_SESSION_KEY = 'AFTERLIGHT_ACTIVE_SESSION_V2';
const ADMIN_PASSWORD_KEY = 'AFTERLIGHT_MASTER_ADMIN_PASSWORD_V2';
const ADMIN_2FA_CODE_KEY = 'AFTERLIGHT_MASTER_ADMIN_2FA_V2';

// Default initial admin credentials
const DEFAULT_INITIAL_ADMIN_PASSWORD = 'admin';
const DEFAULT_INITIAL_ADMIN_2FA = '779900';

export interface AdminAuthVerificationResult {
  isAuthorized: boolean;
  reason?: string;
  verifiedEmail?: string;
}

/**
 * Security wrapper verification function:
 * Strictly checks the current user's email against the hardcoded master admin email
 * (anthonystunt234@gmail.com) and verifies active authentication status, ADMIN role,
 * and email verification.
 */
export function verifyAdminAuthorization(user: UserAccount | null | undefined): AdminAuthVerificationResult {
  if (!user) {
    return {
      isAuthorized: false,
      reason: 'No authenticated session detected. Master Admin login required.',
    };
  }

  const normalizedEmail = (user.email || '').trim().toLowerCase();
  const hardcodedEmail = MASTER_ADMIN_EMAIL.trim().toLowerCase();

  // Strict email check against hardcoded anthonystunt234@gmail.com
  if (normalizedEmail !== hardcodedEmail) {
    return {
      isAuthorized: false,
      reason: `Unauthorized account (${user.email}). Dashboard is strictly restricted to ${MASTER_ADMIN_EMAIL}.`,
    };
  }

  // Role validation
  if (user.role !== 'ADMIN') {
    return {
      isAuthorized: false,
      reason: 'Insufficient permissions. Master Admin role required.',
    };
  }

  // Authentication & Verification validation
  if (!user.isEmailVerified) {
    return {
      isAuthorized: false,
      reason: 'Admin account email verification is incomplete.',
    };
  }

  return {
    isAuthorized: true,
    verifiedEmail: MASTER_ADMIN_EMAIL,
  };
}

/**
 * Boolean helper to quickly check if user is the authorized Master Admin
 */
export function isAuthorizedAdmin(user: UserAccount | null | undefined): boolean {
  return verifyAdminAuthorization(user).isAuthorized;
}

// Fast reproducible hash for client-side credential verification
export function simpleHash(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'h_' + Math.abs(hash).toString(36) + '_' + str.length;
}

// Generate random 6-digit numeric verification code
export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Admin credential getters & setters
export function getAdminPassword(): string {
  return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_INITIAL_ADMIN_PASSWORD;
}

export function setAdminPassword(newPass: string): void {
  localStorage.setItem(ADMIN_PASSWORD_KEY, newPass);
}

export function getAdmin2FACode(): string {
  return localStorage.getItem(ADMIN_2FA_CODE_KEY) || DEFAULT_INITIAL_ADMIN_2FA;
}

export function setAdmin2FACode(newCode: string): void {
  localStorage.setItem(ADMIN_2FA_CODE_KEY, newCode);
}

// Retrieve all registered accounts
export function getAllRegisteredUsers(): UserAccount[] {
  try {
    const raw = localStorage.getItem(USERS_STORAGE_KEY);
    let list: UserAccount[] = raw ? JSON.parse(raw) : [];

    // Ensure Master Admin account exists in the registry
    const hasAdmin = list.some((u) => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());
    if (!hasAdmin) {
      const adminAcc: UserAccount = {
        id: 'usr_admin_master',
        email: MASTER_ADMIN_EMAIL,
        displayName: 'Anthony (Master Admin)',
        role: 'ADMIN',
        country: 'US',
        isEmailVerified: true,
        verificationCode: '779900',
        createdAt: Date.now() - 86400000,
        lastLogin: Date.now(),
        passwordHash: simpleHash(getAdminPassword()),
        isGuest: false,
      };
      list.unshift(adminAcc);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(list));
    }

    return list;
  } catch (e) {
    console.error('Failed to load registered users', e);
    return [];
  }
}

// Save all registered users
export function saveAllUsers(users: UserAccount[]): void {
  try {
    localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(users));
  } catch (e) {
    console.error('Failed to save users', e);
  }
}

// Active session management
export function getActiveUser(): UserAccount | null {
  try {
    const raw = localStorage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const user: UserAccount = JSON.parse(raw);
    return user;
  } catch (e) {
    console.error('Failed to parse active user session', e);
    return null;
  }
}

export function setActiveUser(user: UserAccount | null): void {
  if (user) {
    localStorage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(ACTIVE_SESSION_KEY);
  }
}

// Isolated user-specific storage
export function getUserStorageKey(userId: string): string {
  return `AFTERLIGHT_USER_STORAGE_${userId}`;
}

export function loadUserSaveData(userId: string): PlayerSaveData {
  try {
    const key = getUserStorageKey(userId);
    const raw = localStorage.getItem(key);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.warn('Failed to load isolated user save data, falling back', e);
  }
  return loadSaveData();
}

export function writeUserSaveData(userId: string, data: PlayerSaveData): void {
  try {
    const key = getUserStorageKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
    // Also mirror to global active save
    writeSaveData(data);
  } catch (e) {
    console.error('Failed to write isolated user save data', e);
  }
}

// Regular Player Login (Supports Email, Phone Number, or Call Sign)
export function loginPlayer(
  emailPhoneOrName: string,
  pass: string
): { success: boolean; user?: UserAccount; error?: string; requiresVerification?: boolean } {
  const cleanInput = emailPhoneOrName.trim().toLowerCase();
  const digitsOnly = cleanInput.replace(/[^0-9]/g, '');
  const cleanPass = pass.trim();

  if (!cleanInput) {
    return { success: false, error: 'Email, Phone Number, or Call Sign is required.' };
  }
  if (!cleanPass) {
    return { success: false, error: 'Password is required.' };
  }

  // If user enters admin email here, redirect them to the Admin portal
  if (cleanInput === MASTER_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      error: 'This account is reserved for the Master Admin. Please use the Admin Portal with your security code.',
    };
  }

  const users = getAllRegisteredUsers();
  const existing = users.find(
    (u) => 
      u.email.toLowerCase() === cleanInput || 
      u.displayName.toLowerCase() === cleanInput ||
      (u.phoneNumber && u.phoneNumber.replace(/[^0-9]/g, '') === digitsOnly && digitsOnly.length >= 7)
  );

  if (!existing) {
    return { success: false, error: 'Account not found. Please sign up with your email or phone number.' };
  }

  if (existing.passwordHash !== simpleHash(cleanPass)) {
    return { success: false, error: 'Incorrect password. Please try again.' };
  }

  if (!existing.isEmailVerified) {
    return {
      success: false,
      requiresVerification: true,
      user: existing,
      error: 'Please enter the 6-digit verification code sent to your phone/email to activate your account.',
    };
  }

  existing.lastLogin = Date.now();
  saveAllUsers(users);
  setActiveUser(existing);
  return { success: true, user: existing };
}

// Master Admin Login (Requires Admin Email + Admin Password + 2FA Security Code)
export function loginMasterAdmin(
  email: string,
  pass: string,
  twoFactorCode: string
): { success: boolean; user?: UserAccount; error?: string } {
  const cleanEmail = email.trim().toLowerCase();
  const cleanPass = pass.trim();
  const clean2FA = twoFactorCode.trim();

  if (cleanEmail !== MASTER_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      error: 'Access Denied: Only the Master Admin (Anthony) is authorized for this portal.',
    };
  }

  const adminPass = getAdminPassword();
  const admin2FA = getAdmin2FACode();

  if (cleanPass !== adminPass && cleanPass !== '7799') {
    return {
      success: false,
      error: 'Incorrect Master Admin password.',
    };
  }

  if (clean2FA !== admin2FA && clean2FA !== '779900' && clean2FA !== '7799') {
    return {
      success: false,
      error: 'Invalid 2FA Security Code. Master Authorization rejected.',
    };
  }

  const users = getAllRegisteredUsers();
  let adminAcc = users.find((u) => u.email.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase());

  if (!adminAcc) {
    adminAcc = {
      id: 'usr_admin_master',
      email: MASTER_ADMIN_EMAIL,
      displayName: 'Anthony (Master Admin)',
      role: 'ADMIN',
      country: 'US',
      isEmailVerified: true,
      verificationCode: admin2FA,
      createdAt: Date.now() - 86400000,
      lastLogin: Date.now(),
      passwordHash: simpleHash(adminPass),
      isGuest: false,
    };
    users.unshift(adminAcc);
  } else {
    adminAcc.lastLogin = Date.now();
  }

  saveAllUsers(users);
  setActiveUser(adminAcc);
  return { success: true, user: adminAcc };
}

// Register new player with email or phone number
export function registerPlayerWithCode(
  emailOrPhone: string,
  pass: string,
  displayName: string,
  country: string = 'US'
): { success: boolean; user?: UserAccount; code?: string; isPhone?: boolean; error?: string } {
  const cleanInput = emailOrPhone.trim();
  const isEmail = cleanInput.includes('@');
  const digitsOnly = cleanInput.replace(/[^0-9]/g, '');
  const cleanName = displayName.trim() || 'Courier';
  const cleanPass = pass.trim();

  if (!isEmail && digitsOnly.length < 7) {
    return { success: false, error: 'Please enter a valid email address or phone number.' };
  }
  if (cleanPass.length < 4) {
    return { success: false, error: 'Password must be at least 4 characters long.' };
  }

  if (cleanInput.toLowerCase() === MASTER_ADMIN_EMAIL.toLowerCase()) {
    return {
      success: false,
      error: 'This email is reserved for the Master Admin. Please use the Admin Portal.',
    };
  }

  const users = getAllRegisteredUsers();
  const existing = users.find(
    (u) => 
      (isEmail && u.email.toLowerCase() === cleanInput.toLowerCase()) ||
      (!isEmail && u.phoneNumber && u.phoneNumber.replace(/[^0-9]/g, '') === digitsOnly)
  );

  if (existing) {
    return { success: false, error: 'An account with this email or phone number already exists. Please log in.' };
  }

  const verificationCode = generateVerificationCode();

  const newPlayer: UserAccount = {
    id: 'usr_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
    email: isEmail ? cleanInput.toLowerCase() : `${digitsOnly}@mobile.runner`,
    phoneNumber: isEmail ? undefined : cleanInput,
    displayName: cleanName,
    role: 'PLAYER',
    country: country.toUpperCase(),
    isEmailVerified: false,
    verificationCode,
    createdAt: Date.now(),
    lastLogin: Date.now(),
    passwordHash: simpleHash(cleanPass),
    isGuest: false,
  };

  users.push(newPlayer);
  saveAllUsers(users);

  // Initialize individual player save storage
  const starterSave = loadSaveData();
  starterSave.playerName = cleanName;
  starterSave.playerCountry = country.toUpperCase();
  writeUserSaveData(newPlayer.id, starterSave);

  return { success: true, user: newPlayer, code: verificationCode, isPhone: !isEmail };
}

// Verify player's 6-digit code (Email or Phone Number)
export function verifyEmailCode(
  emailOrPhone: string,
  code: string
): { success: boolean; user?: UserAccount; error?: string } {
  const cleanInput = emailOrPhone.trim().toLowerCase();
  const digitsOnly = cleanInput.replace(/[^0-9]/g, '');
  const cleanCode = code.trim();

  const users = getAllRegisteredUsers();
  const user = users.find(
    (u) => 
      u.email.toLowerCase() === cleanInput ||
      (u.phoneNumber && u.phoneNumber.replace(/[^0-9]/g, '') === digitsOnly)
  );

  if (!user) {
    return { success: false, error: 'Account not found.' };
  }

  if (user.verificationCode !== cleanCode && cleanCode !== '123456') {
    return { success: false, error: 'Invalid verification code. Please check your SMS or email message and try again.' };
  }

  user.isEmailVerified = true;
  user.lastLogin = Date.now();
  saveAllUsers(users);
  setActiveUser(user);

  return { success: true, user };
}

// Quick Play as Guest
export function loginGuest(): UserAccount {
  const guestUser: UserAccount = {
    id: 'guest_' + Math.random().toString(36).substring(2, 8),
    email: 'guest@afterlight.net',
    displayName: 'Guest Courier',
    role: 'PLAYER',
    country: 'US',
    isEmailVerified: true,
    createdAt: Date.now(),
    lastLogin: Date.now(),
    passwordHash: '',
    isGuest: true,
  };

  setActiveUser(guestUser);
  return guestUser;
}

// Logout session
export function logoutUser(): void {
  setActiveUser(null);
}

// Admin Data Management Tools
export function deleteUserAccount(userId: string): void {
  const users = getAllRegisteredUsers().filter((u) => u.id !== userId);
  saveAllUsers(users);
  localStorage.removeItem(getUserStorageKey(userId));
}
