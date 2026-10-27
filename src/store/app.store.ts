import {create} from 'zustand';
import {createJSONStorage, persist} from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {DEFAULT_THEME_ID, setActiveTheme} from '@/theme';

type AppState = {
  onboardingDone: boolean;
  finishOnboarding: () => void;
  themeId: string;
  setTheme: (id: string) => void;
};

export const useAppStore = create<AppState>()(
  persist(
    set => ({
      onboardingDone: false,
      finishOnboarding: () => set({onboardingDone: true}),
      themeId: DEFAULT_THEME_ID,
      setTheme: id => {
        setActiveTheme(id);
        set({themeId: id});
      },
    }),
    {
      name: 'app',
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => state => {
        if (state) {
          setActiveTheme(state.themeId);
        }
      },
    },
  ),
);
