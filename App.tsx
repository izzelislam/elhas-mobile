import './global.css';
import {StatusBar, Text, View} from 'react-native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PortalHost} from '@rn-primitives/portal';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-foreground">Elhas Mobile</Text>
      </View>
      <PortalHost />
    </SafeAreaProvider>
  );
}

export default App;
