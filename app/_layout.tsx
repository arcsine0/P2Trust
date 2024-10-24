import { Stack } from "expo-router";

import { useColorScheme, KeyboardAvoidingView, Platform } from "react-native";

require("react-native-ui-lib/config").setConfig({ appScheme: "light" });

import { View, Text } from "react-native-ui-lib";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { UserProvider } from "@/lib/context/UserContext"

// import { Colors } from "@/constants/Colors";

import "react-native-reanimated";
import "../global.css";

require("@/constants/ThemeManager");

// Prevent the splash screen from auto-hiding before asset loading is complete.
// SplashScreen.preventAutoHideAsync();

console.log("root layout running!");

export default function RootLayout() {
	const colorScheme = useColorScheme();

	return (
		<GestureHandlerRootView>
			<BottomSheetModalProvider>
				<UserProvider>
					<Stack>
						<Stack.Screen name="(login)" options={{ headerShown: false }} />
						<Stack.Screen name="(tabs)" options={{ headerShown: false }} />
						<Stack.Screen name="(transactionRoom)" options={{ headerShown: false }} />
						<Stack.Screen
							name="transaction/[transactionID]"
							options={{
								headerTitle: "",
								headerLeft: () => (
									<View 
										className="flex flex-col mt-4 mb-2 items-start justify-center"
										style={{ marginRight: Platform.OS === "ios" ? 200 : 0 }}
									>
										<Text bodyLarge className="font-bold">Transaction Details</Text>
										<Text bodySmall>ID: </Text>
										<Text bodySmall>{Date.now()}</Text>
									</View>
								),
							}}
						/>
						<Stack.Screen name="+not-found" />
					</Stack>
				</UserProvider>
			</BottomSheetModalProvider>
		</GestureHandlerRootView>
	);
}
