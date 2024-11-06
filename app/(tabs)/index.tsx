import { useState, useEffect } from "react";
import { ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Searchbar, IconButton, ActivityIndicator } from "react-native-paper";
import { Colors, View, Text, Fader, Dialog, Picker, PickerModes, Card } from "react-native-ui-lib";

import { useIsFocused } from "@react-navigation/native";

import { router, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { Transaction, UserData } from "@/lib/helpers/types";
import { SearchFilterOptions } from "@/lib/helpers/collections";

import { LiveFeedCard } from "@/components/transactionCards/LiveFeedCard";
import { UserCard } from "@/components/userCards/UserCard";

import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function HomeScreen() {
	const [transactions, setTransactions] = useState<Transaction[]>([]);
	const [searchResults, setSearchResults] = useState<Transaction | UserData | undefined>(undefined);

	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filterOption, setFilterOption] = useState<string | undefined>("Transactions")

	const [isSearching, setIsSearching] = useState<boolean>(false);

	const [showSearchModal, setShowSearchModal] = useState<boolean>(false);

	const { setTransactionIDs } = useUserData();

	const isFocused = useIsFocused();
	const navigation = useNavigation();

	const getTransactions = async () => {
		const { data, error } = await supabase
			.from("transactions")
			.select()
			.neq("status", "pending")
			.order("created_at", { ascending: false });

		if (!error) {
			setTransactions(data);
			setTransactionIDs(data.map(d => d.id));
		}
	}

	const searchTransaction = async () => {
		setIsSearching(true);

		const { data, error } = await supabase
			.from("transactions")
			.select()
			.eq("id", searchQuery)
			.neq("status", "pending");

		if (!error && data) {
			setIsSearching(false);
			setSearchResults(data[0]);
		} else {
			setIsSearching(false);
			setSearchResults(undefined);
		}
	}

	const searchMerchant = async () => {
		setIsSearching(true);

		const { data, error } = await supabase
			.from("accounts")
			.select()
			.eq("id", searchQuery);

		if (!error && data) {
			setIsSearching(false);
			setSearchResults(data[0]);
		} else {
			setIsSearching(false);
			setSearchResults(undefined);
		}
	}

	const isTransaction = (data: Transaction | UserData): data is Transaction => {
		return (data as Transaction).total_amount !== undefined;
	}

	useEffect(() => {
		getTransactions();

		navigation.setOptions({
			headerRight: () => (
				<View className="flex flex-row">
					<IconButton
						icon="magnify"
						onPress={() => setShowSearchModal(true)}
					/>
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
		<SafeAreaView className="flex flex-col w-screen h-screen pt-4 pb-2 items-start justify-start">
			<Fader visible={true} position="BOTTOM" />
			<Text h2 className="px-4 mb-2">Live Feed</Text>
			<ScrollView className="w-full">
				<View className="flex flex-col px-4 mb-40 space-y-4">
					{transactions && transactions.map((transaction: Transaction, i) => (
						<View>
							<LiveFeedCard
								key={transaction.id}
								transactionData={transaction}
								elevation={10}
								onPress={() => router.navigate(`/transaction/${transaction.id}`)}
							/>
						</View>
					))}
				</View>
			</ScrollView>
			<Dialog
				visible={showSearchModal}
				panDirection="up"
				top={true}
				onDismiss={() => {
					setSearchQuery("");
					setSearchResults(undefined);
					setShowSearchModal(false);
				}}
				containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, padding: 4, marginTop: 16 }}
			>
				<View className="flex flex-col w-full p-2 space-y-2">
					<View>
						<Searchbar
							placeholder="Search ID..."
							onChangeText={setSearchQuery}
							onSubmitEditing={() => {
								switch (filterOption) {
									case "Transactions": searchTransaction(); break;
									case "Merchants": searchMerchant(); break;
									default: break;
								}
							}}
							value={searchQuery}
							className="rounded-lg"
							style={{
								backgroundColor: Colors.gray100,
								height: 50
							}}
							inputStyle={{
								minHeight: 0
							}}
							elevation={1}
						/>
					</View>
					<View style={{ backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 13, elevation: 2 }}>
						<Picker
							value={filterOption}
							mode={PickerModes.SINGLE}
							useDialog={true}
							customPickerProps={{ migrateDialog: true, }}
							trailingAccessory={<MaterialCommunityIcons name="chevron-down" size={20} color={Colors.gray900} />}
							onChange={value => setFilterOption(value?.toString())}
						>
							{SearchFilterOptions.map((pl, i) => (
								<Picker.Item key={i} label={pl.label} value={pl.value} />
							))}
						</Picker>
					</View>
					<View className="w-full">
						{isSearching ?
							<View
								style={{ backgroundColor: Colors.gray200 }}
								className="flex flex-col w-full px-10 py-10 space-y-1 items-center justify-center rounded-lg"
							>
								<ActivityIndicator animating={true} size={20} color={Colors.gray900} />
							</View>
							:
							<>
								{!searchResults ?
									<View
										style={{ backgroundColor: Colors.gray200 }}
										className="flex flex-col w-full px-10 py-10 space-y-1 items-center justify-center rounded-lg"
									>
										<Text bodyLarge gray900 className="font-semibold">No Results</Text>
									</View>
									:
									<>
										{isTransaction(searchResults) ?
											<LiveFeedCard
												transactionData={searchResults}
												elevation={5}
												onPress={() => {
													setSearchQuery("");
													setSearchResults(undefined);
													setShowSearchModal(false);

													router.navigate(`/transaction/${searchResults.id}`)
												}}
											/>
											:
											<Card
												style={{ backgroundColor: Colors.bgDefault }}
												onPress={() => router.navigate(`/(transactionRoom)/merchant/${searchResults.id}`)}
												className="flex flex-col p-4 space-y-2"
												elevation={10}
											>
												<UserCard
													name={searchResults.firstname}
													id={"123123"}
												/>
											</Card>
										}
									</>
								}
							</>
						}
					</View>
				</View>
			</Dialog>
		</SafeAreaView>
	);
}
