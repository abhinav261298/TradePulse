import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';

// Cleanup after each test case
afterEach(() => {
  cleanup();
});

// Mock localStorage
const localStorageMock = {
  getItem: (key: string) => {
    return localStorageMock.store[key] || null;
  },
  setItem: (key: string, value: string) => {
    localStorageMock.store[key] = value;
  },
  removeItem: (key: string) => {
    delete localStorageMock.store[key];
  },
  clear: () => {
    localStorageMock.store = {};
  },
  key: (index: number): string | null => {
    const keys = Object.keys(localStorageMock.store);
    return keys[index] || null;
  },
  get length(): number {
    return Object.keys(localStorageMock.store).length;
  },
  store: {} as Record<string, string>,
};

global.localStorage = localStorageMock as Storage;

// Mock window.confirm
global.confirm = () => true;
