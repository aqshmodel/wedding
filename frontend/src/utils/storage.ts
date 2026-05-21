import { v4 as uuidv4 } from 'uuid';

export const GUEST_SIDE_KEY = 'wedding_guest_side';
export const GUEST_NAME_KEY = 'wedding_guest_name';
export const GUEST_UUID_KEY = 'wedding_guest_uuid';

export const getGuestUuid = (): string => {
  let uuid = localStorage.getItem(GUEST_UUID_KEY);
  if (!uuid) {
    uuid = uuidv4();
    localStorage.setItem(GUEST_UUID_KEY, uuid);
  }
  return uuid;
};

export const getGuestSide = (): 'groom' | 'bride' | null => {
  return localStorage.getItem(GUEST_SIDE_KEY) as 'groom' | 'bride' | null;
};

export const setGuestSide = (side: 'groom' | 'bride') => {
  localStorage.setItem(GUEST_SIDE_KEY, side);
};

export const getGuestName = (): string => {
  return localStorage.getItem(GUEST_NAME_KEY) || '';
};

export const setGuestName = (name: string) => {
  localStorage.setItem(GUEST_NAME_KEY, name);
};
