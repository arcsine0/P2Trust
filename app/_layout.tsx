import { Stack, useNavigation } from "expo-router";
import { createContext, useContext, useState, Dispatch, SetStateAction } from "react";
import { View } from "react-native";

import { useColorScheme, KeyboardAvoidingView, Platform } from "react-native";
import { MD3LightTheme, MD3DarkTheme, PaperProvider, Text, IconButton } from "react-native-paper";

import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { UserProvider } from "@/lib/context/UserContext"

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
										<View className="flex flex-col mt-4 mb-2 items-start justify-center">
											<Text variant="titleMedium" className="font-bold">Transaction Details</Text>
											<Text variant="bodyMedium">ID: </Text>
											<Text variant="bodyMedium">{Date.now()}</Text>
										</View>
									),
								}} 
							/>
							<Stack.Screen name="+not-found" />
						</Stack>
					</UserProvider>

				</BottomSheetModalProvider>
			</GestureHandlerRootView>
		</PaperProvider>
	);
}
