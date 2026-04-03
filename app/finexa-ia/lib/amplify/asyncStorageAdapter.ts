import AsyncStorage from '@react-native-async-storage/async-storage';
import type { KeyValueStorageInterface } from '@aws-amplify/core';

/** Adaptador Cognito / Amplify v6 para tokens en React Native */
export const amplifyAsyncStorage: KeyValueStorageInterface = {
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  getItem: (key) => AsyncStorage.getItem(key),
  removeItem: (key) => AsyncStorage.removeItem(key),
  clear: () => AsyncStorage.clear(),
};
