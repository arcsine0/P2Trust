import { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Avatar, IconButton, Icon } from "react-native-paper";

import { Colors, View, Text, Card, Chip } from "react-native-ui-lib";

import { useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { router, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { Transaction } from "@/lib/helpers/types";
import { formatISODate } from "@/lib/helpers/functions";

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

export default function HomeScreen() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);

	const { userData } = useUserData();

	const isFocused = useIsFocused();
	const theme = useTheme();
	const navigation = useNavigation();

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

	useEffect(() => {
		getTransactions();

		navigation.setOptions({
			headerRight: () => (
				<View className="flex flex-row">
					<IconButton
						icon="dots-vertical"
						onPress={() => console.log("Dots Pressed")}
					/>
				</View>
			)
		});

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
		<SafeAreaView className="flex flex-col w-screen h-screen pb-2 items-start justify-start">
			<Text h2 className="px-4 mb-2">Live Feed</Text>
			<ScrollView className="w-full">
				<View className="flex flex-col px-4 space-y-4">
					{transactions && transactions.map((transaction: Transaction, i) => (
						<Card
							key={i}
							onPress={() => router.navigate(`/transaction/${transaction.id}`)}
							style={{
								backgroundColor: Colors.bgDefault,
								borderBottomWidth: 8,
								borderColor: transaction.status === "completed" ? Colors.success400 : Colors.error400,
							}}
							elevation={10}
							className="flex flex-col p-4 space-y-2"
						>
							<View className="flex flex-row w-full justify-between items-center">
								<Text bodySmall gray400 className="font-semibold">{formatISODate(transaction.created_at.toLocaleString())}</Text>
								{transaction.status === "completed" ?
									<Chip
										label={transaction.status}
										borderRadius={8}
										backgroundColor={Colors.success200}
										containerStyle={{ borderWidth: 0 }}
									/>
									:
									<Chip
										label={transaction.status}
										borderRadius={8}
										backgroundColor={Colors.error200}
										containerStyle={{ borderWidth: 0 }}
									/>
								}
							</View>
							<View className="flex flex-col space-y-2">
								<View className="flex flex-row space-x-2 items-center justify-start">
									<Icon source="store" size={20} color={"#60a5fa"} />
									<Avatar.Text label={getInitials(transaction.merchantName)} size={20} />
									<Text body className="font-semibold">{transaction.merchantName}</Text>
								</View>
								<View className="flex flex-row space-x-2 items-center justify-start">
									<Icon source="account" size={20} color={"#4ade80"} />
									<Avatar.Text label={getInitials(transaction.clientName)} size={20} />
									<Text body className="font-semibold">{transaction.clientName}</Text>
								</View>
							</View>
							<View className="flex flex-row items-center justify-between">
								<View className="flex flex-row space-x-2 items-center justify-start">
									<Text body className="font-semibold text-slate-400">Total Amount:</Text>
									<Text body className="font-bold">{transaction.total_amount}</Text>
								</View>
								<Icon source="chevron-right" size={20} color={"#94a3b8"} />
							</View>
						</Card>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
