import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, Card, Avatar, Chip, IconButton, FAB, Portal } from "react-native-paper";

import { useIsFocused } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { router } from "expo-router";

import { ref, push, set, onValue } from "firebase/database";
import { doc, getDoc } from "firebase/firestore";
import { db, fs } from "@/firebase/config";

import { supabase } from "@/supabase/config";

import { MaterialCommunityIcons as MCI } from "@expo/vector-icons";

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

// this is just for testing
type TransactionInput = {
	timestamp: string;
	merchantName: string;
	merchantAccNum: string;
	clientName: string;
	amount: number;
	platform: string;
	verdict: string;
}

type Transaction = {
	id: string;
	created_at: Date;
	merchant: string;
	client: string;
	amount: number;
	platform: string;
	status: string;
	room_id: string;
}

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

	const isFocused = useIsFocused();
	const theme = useTheme();

	const addTransactionToLive = async (transactionData: TransactionInput) => {
		try {
			const transactionRef = push(ref(db, "transactions"));
			await set(transactionRef, {
				...transactionData,
				timestamp: Date.now()
			});
		} catch (err) {
			console.log(err)
		}
	}

	const testSendTransaction = () => {
		console.log("testing send transaction")

		addTransactionToLive({
			timestamp: Date.now().toString(),
			merchantName: "test merchant",
			merchantAccNum: "00000000",
			clientName: "test client",
			amount: 100,
			platform: "GCash",
			verdict: "legit"
		});
	}

	const getTransactions = async () => {
		// const transactionsRef = ref(db, "transactions");
		// onValue(transactionsRef, (snapshot) => {
		// 	const data = snapshot.val();

		// 	if (data) {
		// 		const transactionEntries = Object.entries(data);
		// 		const transactionArray = transactionEntries.map(([transactionId, transactionData]) => {
		// 			if (typeof transactionData === "object" && transactionData !== null) {
		// 				return {
		// 					id: transactionId,
		// 					...transactionData,
		// 				};
		// 			} else {
		// 				console.error(`Invalid transaction data for ID: ${transactionId}`, transactionData);
		// 				return null;
		// 			}
		// 		}).filter(Boolean) as Transaction[];

		// 		setTransactions(transactionArray);
		// 	} else {
		// 		setTransactions([]);
		// 	}
		// })
		const { data, error } = await supabase
			.from("transactions")
			.select()
			.order("created_at", { ascending: false });

		if (!error) {
			setTransactions(data);
		}
	}

	const redirectToTransactions = () => {
		AsyncStorage.setItem("roomState", "1");
		router.navigate("/(transaction)");
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

	// useEffect(() => {
	// 	if (isFocused) {
	// 		setTransactions([]);
	// 		loadTransactions();

	// 		AsyncStorage.setItem("roomState", "0");
	// 	}

	// 	return () => {
	// 		// const transactionsRef = ref(db, "transactions");
	// 		// onValue(transactionsRef, () => null);

	// 		supabase.removeChannel("live-feed");
	// 	}
	// }, [isFocused]);
	useEffect(() => {
		getTransactions();

		const liveFeedChannel = supabase
			.channel("live-feed")
			.on("postgres_changes", { event: "INSERT", schema: "public", table: "transactions" }, getTransactions)
			.on("postgres_changes", { event: "DELETE", schema: "public", table: "transactions" }, getTransactions)
			.subscribe();

		return () => {
			supabase.removeChannel(liveFeedChannel);
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
						<Card key={i}>
							<Card.Content className="flex gap-2">
								<View className="flex flex-row w-full justify-between items-center">
									<View className="flex flex-row items-center gap-5">
										<Avatar.Text label={getInitials(trans.merchant)} size={35} />
										<View className="flex">
											<Text variant="titleLarge" className="font-bold">{trans.merchant}</Text>
											<Text variant="titleSmall" className="font-semibold">00000</Text>
										</View>
									</View>
									{trans.status === "complete" ?
										<MCI name="check-decagram" size={35} color={theme.colors.primary} />
										:
										<MCI name="alert-decagram" size={35} color={theme.colors.primary} />
									}
								</View>
							</Card.Content>
						</Card>
					))}
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
