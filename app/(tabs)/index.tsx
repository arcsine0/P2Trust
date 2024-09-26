import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, Card, Avatar, Chip, IconButton, FAB, Icon, Divider } from "react-native-paper";

import { useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { router } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { Transaction } from "@/lib/helpers/types";
import { formatISODate } from "@/lib/helpers/functions";

import AsyncStorage from "@react-native-async-storage/async-storage";

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
			.neq("status", "pending")
			.order("created_at", { ascending: false });

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
					{transactions && transactions.map((transaction: Transaction, i) => (
						<Card
							key={i}
							onPress={() => router.navigate(`/transaction/${transaction.id}`)}
							style={{ 
								backgroundColor: theme.colors.background,
								borderColor: transaction.status === "completed" ? "#22c55e" : "#ef4444",
							}}
							className="border-b-8"
						>
							<Card.Content className="flex flex-col space-y-2">
								<View className="flex flex-row w-full justify-between items-center">
									<Text variant="titleSmall" className="text-slate-400">{formatISODate(transaction.created_at.toLocaleString())}</Text>
									{transaction.status === "completed" ?
										<Chip className="bg-green-200 text-green-200" compact={true}>
											<Text variant="bodySmall">{transaction.status}</Text>
										</Chip>
										:
										<Chip className="bg-red-200 text-red-200" compact={true}>
											<Text variant="bodySmall">{transaction.status}</Text>
										</Chip>
									}
								</View>
								<View className="flex flex-col space-y-2">
									<View className="flex flex-row space-x-2 items-center justify-start">
										<Icon source="store" size={20} color={"#60a5fa"} />
										<Avatar.Text label={getInitials(JSON.parse(transaction.merchant).username)} size={20} />
										<Text variant="titleMedium" className="font-semibold">{JSON.parse(transaction.merchant).username}</Text>
									</View>
									<View className="flex flex-row space-x-2 items-center justify-start">
										<Icon source="account" size={20} color={"#4ade80"} />
										<Avatar.Text label={getInitials(JSON.parse(transaction.client).username)} size={20} />
										<Text variant="titleMedium" className="font-semibold">{JSON.parse(transaction.client).username}</Text>
									</View>
								</View>
								<View className="flex flex-row items-center justify-between">
									<View className="flex flex-row space-x-2 items-center justify-start">
										<Text variant="titleMedium" className="font-semibold text-slate-400">Total Amount:</Text>
										<Text variant="titleMedium" className="font-bold">{transaction.total_amount}</Text>
									</View>
									<Icon source="chevron-right" size={20} color={"#94a3b8"} />
								</View>
							</Card.Content>
						</Card>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
