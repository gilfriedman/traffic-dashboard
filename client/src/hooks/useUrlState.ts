import { useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';

export function useUrlState<T extends string>(
  key: string,
  defaultValue: T,
  allowedValues: readonly T[]
): [T, (next: T) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(key);
  const value = (allowedValues as readonly string[]).includes(raw ?? '') ? (raw as T) : defaultValue;

  const setValue = useCallback(
    (next: T) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next === defaultValue) {
            updated.delete(key);
          } else {
            updated.set(key, next);
          }
          return updated;
        },
        { replace: true }
      );
    },
    [key, defaultValue, setSearchParams]
  );

  return [value, setValue];
}

export function useUrlBoolean(key: string): [boolean, (next: boolean) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const value = searchParams.get(key) === '1';

  const setValue = useCallback(
    (next: boolean) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next) {
            updated.set(key, '1');
          } else {
            updated.delete(key);
          }
          return updated;
        },
        { replace: true }
      );
    },
    [key, setSearchParams]
  );

  return [value, setValue];
}

export function useUrlNullableState<T extends string>(
  key: string,
  allowedValues: readonly T[]
): [T | null, (next: T | null) => void] {
  const [searchParams, setSearchParams] = useSearchParams();
  const raw = searchParams.get(key);
  const value = raw && (allowedValues as readonly string[]).includes(raw) ? (raw as T) : null;

  const setValue = useCallback(
    (next: T | null) => {
      setSearchParams(
        (prev) => {
          const updated = new URLSearchParams(prev);
          if (next == null) {
            updated.delete(key);
          } else {
            updated.set(key, next);
          }
          return updated;
        },
        { replace: true }
      );
    },
    [key, setSearchParams]
  );

  return [value, setValue];
}
