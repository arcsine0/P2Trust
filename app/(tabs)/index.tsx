import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { useIsFocused } from "@react-navigation/native";
import { BottomTabNavigationProp } from "@react-navigation/bottom-tabs";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, Card, Avatar, Chip, IconButton, FAB, Portal } from "react-native-paper";

import { router } from "expo-router";

import { MaterialCommunityIcons as MCI } from "@expo/vector-icons";

type TabParamList = {
	Home: undefined;
	History: { name: string };
	Settings: { name: string };
};

type HomeScreenNavigationProp = BottomTabNavigationProp<TabParamList, "Home">;
type Props = {
	navigation: HomeScreenNavigationProp;
};

export default function HomeScreen({ navigation }: Props) {
	const [fabState, setFabState] = useState({ open: false });

	const isFocused = useIsFocused();
	const theme = useTheme();

	useEffect(() => {
		navigation.setOptions({
			headerRight: () => (
				<View className="flex flex-row">
					<IconButton
						icon="sort-variant"
						onPress={() => console.log("Sort Pressed")}
					/>
					<IconButton
						icon="dots-vertical"
						onPress={() => console.log("Dots Pressed")}
					/>
				</View>
			)
		});
	}, [navigation]);

	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-2 items-start justify-start">
			{isFocused ?
				<Portal>
					<FAB.Group
						open={fabState.open}
						visible
						icon={fabState.open ? "close" : "send"}
						actions={[
							{ 
								icon: "tray-arrow-up", 
								label: "Send Payment",
								onPress: () => router.push("/(tabs)/(transaction)") 
							},
							{ 
								icon: "tray-arrow-down", 
								label: "Receive Payment",
								onPress: () => router.push("/(tabs)/(transaction)") 
							}
						]}
						onStateChange={({ open }) => setFabState({ open })}
						style={{ paddingBottom: 80 }}
					/>
				</Portal>
			: null}
			<ScrollView className="w-full">
				<View className="flex flex-col p-2 gap-4">
					<Card>
						<Card.Content className="flex gap-2">
							<View className="flex flex-row w-full justify-between items-center">
								<View className="flex flex-row items-center gap-5">
									<Avatar.Text label="MN" size={35} />
									<View className="flex">
										<Text variant="titleLarge" className="font-bold">Merchant Name</Text>
										<Text variant="titleSmall" className="font-semibold">Account Number</Text>
									</View>
								</View>
								<MCI name="check-decagram" size={35} color={theme.colors.primary} />
							</View>
							<View className="flex flex-row items-center gap-2">
								<Chip icon={"cash"}>GCash</Chip>
								<Chip icon={"check-circle"}>Legit</Chip>
							</View>
						</Card.Content>
					</Card>
					<Card>
						<Card.Content className="flex gap-2">
							<View className="flex flex-row w-full justify-between items-center">
								<View className="flex flex-row items-center gap-5">
									<Avatar.Text label="MN" size={35} />
									<View className="flex">
										<Text variant="titleLarge" className="font-bold">Merchant Name</Text>
										<Text variant="titleSmall" className="font-semibold">Account Number</Text>
									</View>
								</View>
								<MCI name="alert-decagram" size={35} color={theme.colors.primary} />
							</View>
							<View className="flex flex-row items-center gap-2">
								<Chip icon={"cash"}>Paymaya</Chip>
								<Chip icon={"minus-circle"}>Possible Scam</Chip>
							</View>
						</Card.Content>
					</Card>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
