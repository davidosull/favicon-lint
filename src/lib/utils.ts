import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import crypto from 'crypto';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function hashEmail(email: string): string {
  const salt = process.env.HASH_SALT || 'default-salt';
  return crypto
    .createHash('sha256')
    .update(email.toLowerCase() + salt)
    .digest('hex');
}

export function hashIP(ip: string): string {
  const salt = process.env.HASH_SALT || 'default-salt';
  return crypto
    .createHash('sha256')
    .update(ip + salt)
    .digest('hex');
}

export function normalizeDomain(url: string): string {
  try {
    let normalized = url.trim().toLowerCase();

    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }

    const urlObj = new URL(normalized);
    let hostname = urlObj.hostname;

    if (hostname.startsWith('www.')) {
      hostname = hostname.slice(4);
    }

    return hostname;
  } catch {
    return url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  }
}

export function getFullUrl(url: string): string {
  let normalized = url.trim();

  if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
    normalized = 'https://' + normalized;
  }

  return normalized;
}

export function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export function calculateScore(checks: { status: 'pass' | 'fail' | 'warning' | 'info' }[]): number {
  if (checks.length === 0) return 100;

  const weights = {
    pass: 1,
    warning: 0.5,
    info: 0.8,
    fail: 0
  };

  const totalScore = checks.reduce((sum, check) => sum + weights[check.status], 0);
  return Math.round((totalScore / checks.length) * 100);
}
