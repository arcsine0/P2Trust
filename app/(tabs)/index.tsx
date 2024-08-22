import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useTheme, Text, Card, Avatar, Chip, Icon } from "react-native-paper";

import { MaterialCommunityIcons as MCI } from "@expo/vector-icons";

export default function HomeScreen() {
	const theme = useTheme();

	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-5 items-start justify-start">
			<Text variant="headlineLarge" className="font-bold">Live Feed</Text>
			{/* <Text variant="labelLarge" style={{ color: theme.colors.secondary }}>Completed transactions and their status in real-time</Text> */}
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
