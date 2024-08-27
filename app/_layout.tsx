import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";

import { useColorScheme } from "react-native";
import { MD3LightTheme, MD3DarkTheme, PaperProvider } from "react-native-paper";
import { Colors } from "@/constants/Colors";

import "react-native-reanimated";
import "../global.css";

// Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

const customDarkTheme = { ...MD3DarkTheme, colors: Colors.dark }
const customLightTheme = { ...MD3LightTheme, colors: Colors.light }

console.log("root layout running!");

export default function RootLayout() {
	const colorScheme = useColorScheme();
	const paperTheme = colorScheme === "dark" ? customDarkTheme : customLightTheme;

	return (
		<PaperProvider theme={customLightTheme}>
			<Stack>
				<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
				<Stack.Screen name="(transaction)" options={{ headerShown: false }} />
				<Stack.Screen name="+not-found" />
			</Stack>
		</PaperProvider>
	);
}
