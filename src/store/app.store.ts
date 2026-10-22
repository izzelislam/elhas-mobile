import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

type AppState = {
  onboardingDone: boolean;
  finishOnboarding: () => void;
};

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      onboardingDone: false,
      finishOnboarding: () => set({onboardingDone: true}),
    }),
    {name: 'app', storage: createJSONStorage(() => AsyncStorage)},
  ),
);
