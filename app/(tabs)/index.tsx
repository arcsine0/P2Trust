import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, Card, Avatar, Chip, IconButton, FAB, List } from "react-native-paper";

import { useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { router } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { Transaction } from "@/lib/helpers/types";

import { MaterialCommunityIcons as MCI } from "@expo/vector-icons";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { rgbaColor } from "react-native-reanimated/lib/typescript/reanimated2/Colors";

type TabParamList = {
	Home: undefined;
	History: { name: string };
	Settings: { name: string };
};

type HomeScreenNavigationProp = NativeStackNavigationProp<TabParamList, "Home">;
type Props = {
	navigation: HomeScreenNavigationProp;
};


const getInitials = (name: string) => {
	if (name) {
		const words = name.trim().split(" ");
		let initials = "";

		for (let i = 0; i < Math.min(words.length, 2); i++) {
			if (words[i].length > 0) {
				initials += words[i][0].toUpperCase();
			}
		}

		return initials;
	} else {
		return "N/A"
	}
}

export default function HomeScreen({ navigation }: Props) {
	const [transactions, setTransactions] = useState<Transaction[]>([]);

	const { userData } = useUserData();

	const isFocused = useIsFocused();
	const theme = useTheme();

	const getTransactions = async () => {
		const { data, error } = await supabase
			.from("transactions")
			.select()
			.order("created_at", { ascending: true });

		if (!error) {
			setTransactions(data);
		}
	}

	const redirectToTransactions = () => {
		AsyncStorage.setItem("roomState", "1");
		router.navigate("/(transactionRoom)");
	}

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

	useEffect(() => {
		getTransactions();

		const liveFeedChannel = supabase
			.channel("live-feed")
			.on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, getTransactions)
			.on("postgres_changes", { event: "DELETE", schema: "public", table: "transactions" }, getTransactions)
			.subscribe();

		return () => {
			liveFeedChannel.unsubscribe();
		}
	}, [isFocused]);

	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-2 items-start justify-start">
			{isFocused ?
				<FAB
					icon={"send"}
					onPress={() => redirectToTransactions()}
					className="absolute right-0 bottom-0 mb-36 mr-2 z-50"
				/>
				: null}
			<ScrollView className="w-full">
				<View className="flex flex-col p-2 gap-4">
					{transactions.map((trans: Transaction, i) => (
						<Card 
							key={i} 
							onPress={() => router.navigate(`/transaction/${trans.id}`)}
							style={{ backgroundColor: theme.colors.background }}
						>
							<Card.Content className="flex flex-col gap-2">
								<View className="flex flex-row w-full justify-between items-center">
									<View className="flex flex-row items-center gap-5">
										<Avatar.Text label={getInitials(JSON.parse(trans.merchant).username)} size={35} />
										<View className="flex">
											<Text variant="titleLarge" className="font-bold">{JSON.parse(trans.merchant).username}</Text>
											<View className="flex flex-row items-center justify-start">
												<MCI name="arrow-right-bottom" size={20} color={theme.colors.primary} />
												<Text variant="titleMedium" className="font-semibold">{JSON.parse(trans.client).username}</Text>
											</View>
										</View>

									</View>
									{trans.status === "complete" ?
										<MCI name="check-decagram" size={35} color={theme.colors.primary} />
										:
										<MCI name="alert-decagram" size={35} color={theme.colors.primary} />
									}
								</View>
								{/* <View className="flex flex-col items-start justify-center">
									<Text variant="bodyMedium" className="font-bold">Total Amount Transacted</Text>
									<Text variant="bodyLarge" className="font-semibold">{trans.total_amount}</Text>
								</View>
								<View className="flex flex-col items-start justify-center">
									<Text variant="bodyMedium" className="font-bold">Platforms</Text>
									<View className="flex flex-row items-center justify-start">
										{trans.platforms.map((plt, i) => (
											<Chip key={i}>{plt}</Chip>
										))}
									</View>
								</View> */}
							</Card.Content>
						</Card>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
