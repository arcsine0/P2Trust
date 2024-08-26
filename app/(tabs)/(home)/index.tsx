import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, Card, Avatar, Chip, IconButton, FAB, Portal } from "react-native-paper";

import { useIsFocused, RouteProp } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { router } from "expo-router";

import { ref, push, set, onValue } from "firebase/database";
import { db, fs } from "@/firebase/config";

import { MaterialCommunityIcons as MCI } from "@expo/vector-icons";

type HomeParamList = {
    HomeScreen: undefined;
    Transaction: undefined;
}

type HomeScreenNavigationProp = NativeStackNavigationProp<HomeParamList, "HomeScreen">;
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
	timestamp: string;
	merchantName: string;
	merchantAccNum: string;
	clientName: string;
	amount: number;
	platform: string;
	verdict: string;
}

export default function HomeScreen({ navigation }: Props) {
	const [fabState, setFabState] = useState({ open: false });
	const [transactions, setTransactions] = useState<Transaction[]>([]);

	const isFocused = useIsFocused();
	const theme = useTheme();

	const getInitials = (name: string) => {
		const words = name.trim().split(" ");
		let initials = "";

		for (let i = 0; i < Math.min(words.length, 2); i++) {
			if (words[i].length > 0) {
				initials += words[i][0].toUpperCase();
			}
		}

		return initials;
	}

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

	const loadTransactions = async () => {
		const transactionsRef = ref(db, "transactions");
		onValue(transactionsRef, (snapshot) => {
			const data = snapshot.val();

			if (data) {
				const transactionEntries = Object.entries(data);
				const transactionArray = transactionEntries.map(([transactionId, transactionData]) => {
					if (typeof transactionData === "object" && transactionData !== null) {
						return {
							id: transactionId,
							...transactionData,
						};
					} else {
						console.error(`Invalid transaction data for ID: ${transactionId}`, transactionData);
						return null;
					}
				}).filter(Boolean) as Transaction[];

				setTransactions(transactionArray);
			} else {
				setTransactions([]);
			}
		})
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
		if (isFocused) {
			setTransactions([]);
			loadTransactions();
		}

		return () => {
			const transactionsRef = ref(db, "transactions");
			onValue(transactionsRef, () => null);
		}
	}, [isFocused]);

	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-2 items-start justify-start">
			{isFocused ?
				<FAB
					icon={"send"}
					onPress={() => navigation.push("Transaction")}
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
										<Avatar.Text label={getInitials(trans.merchantName)} size={35} />
										<View className="flex">
											<Text variant="titleLarge" className="font-bold">{trans.merchantName}</Text>
											<Text variant="titleSmall" className="font-semibold">{trans.merchantAccNum}</Text>
										</View>
									</View>
									{trans.verdict === "legit" ?
										<MCI name="check-decagram" size={35} color={theme.colors.primary} />
										:
										<MCI name="alert-decagram" size={35} color={theme.colors.primary} />
									}
								</View>
								<View className="flex flex-row items-center gap-2">
									<Chip icon={"cash"}>{trans.platform}</Chip>
									{trans.verdict === "legit" ?
										<Chip icon={"check-circle"}>Legit</Chip>
										:
										<Chip icon={"minus-circle"}>Possible Scam</Chip>
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
