import { useState, useEffect, useRef, useCallback } from "react";
import { Platform, KeyboardAvoidingView, FlatList, ScrollView } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Searchbar, Icon, IconButton } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";

import { Colors, View, Text, Card, Chip, Picker, PickerModes } from "react-native-ui-lib"

import { router, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";

import { FontAwesome6, MaterialCommunityIcons } from "@expo/vector-icons";

import { Transaction } from "@/lib/helpers/types";
import { FilterOptions } from "@/lib/helpers/collections";
import { getInitials } from "@/lib/helpers/functions";

export default function TransactionHistoryScreen() {
	const [transactions, setTransactions] = useState<Transaction[] | undefined>(undefined);
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [filterOption, setFilterOption] = useState<string | undefined>("All");

	const { userData } = useUserData();

	const theme = useTheme();
	const navigation = useNavigation();

	const getTransactions = async () => {
		try {
			if (userData) {
				const { data, error } = await supabase
					.from("transactions")
					.select("*")
					.or(`merchantID.eq.${userData.id},clientID.eq.${userData.id}`)
					.order("created_at", { ascending: false });

				if (!error) {
					setTransactions(data);
				}
			}
		} catch (error) {
			console.log(error);
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
	}, []);

	return (
		<SafeAreaView className="flex flex-col w-full h-full pt-4 pb-2 items-start justify-start">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={100}
				className="flex w-full h-full"
			>
				{userData ?
					<View className="flex flex-col space-y-2 w-full h-full">
						<Text h2 className="px-4">Transaction History</Text>
						<View className="flex flex-row px-4 space-x-2 items-center">
							<Searchbar
								placeholder="Search ID..."
								onChangeText={setSearchQuery}
								value={searchQuery}
								className="rounded-lg flex-1"
								style={{
									backgroundColor: Colors.gray100,
									height: 50
								}}
								inputStyle={{
									minHeight: 0
								}}
								elevation={1}
							/>
							<View style={{ backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 13, elevation: 2 }}>
								<Picker
									value={filterOption}
									mode={PickerModes.SINGLE}
									useDialog={true}
									customPickerProps={{ migrateDialog: true, }}
									trailingAccessory={<MaterialCommunityIcons name="chevron-down" size={20} color={Colors.gray900} />}
									onChange={value => setFilterOption(value?.toString())}
								>
									{FilterOptions.map((option, i) => (
										<Picker.Item key={i} label={option.label} value={option.value} />
									))}
								</Picker>
							</View>
						</View>
						<ScrollView className="w-full">
							<View className="flex flex-col px-4 mb-40 py-2 space-y-2 w-full">
								{transactions && transactions.filter(transaction => filterOption === "All" || transaction.status === filterOption?.toLocaleLowerCase()).filter(transaction => searchQuery === '' || transaction.id.includes(searchQuery)).map((trans) => (
									<Card
										key={trans.id}
										style={{ backgroundColor: Colors.bgDefault }}
										onPress={() => router.push(`/transaction/${trans.id}`)}
										className="flex flex-col p-4 space-y-2"
										elevation={10}
									>
										<View className="flex flex-row w-full justify-between items-center">
											<View className="flex flex-row space-x-2 items-center">
												<FontAwesome6
													name={"dollar-sign"}
													size={25}
													color={"#94a3b8"}
												/>
												<Text h4>{trans.total_amount}</Text>
											</View>
											{trans.status === "completed" ?
												<Chip
													label={trans.status}
													borderRadius={8}
													backgroundColor={Colors.success200}
													containerStyle={{ borderWidth: 0 }}
												/>
												:
												<Chip
													label={trans.status}
													borderRadius={8}
													backgroundColor={Colors.error200}
													containerStyle={{ borderWidth: 0 }}
												/>
											}
										</View>
										<View className="flex flex-row items-center justify-between">
											<View className="flex flex-col items-start justify-center">
												<View className="flex flex-row space-x-1 items-center">
													<Icon source="store" size={20} color={theme.colors.primary} />
													{trans.merchantID === userData.id ?
														<Text body className="font-bold">You (Merchant)</Text>
														:
														<Text body className="font-bold">{trans.merchantName}</Text>
													}
												</View>

												<View className="flex flex-row space-x-1 items-center">
													<Icon source="account" size={20} color={theme.colors.primary} />
													{trans.clientID === userData.id ?
														<Text bodySmall gray400 className="font-semibold">You (Client)</Text>
														:
														<Text bodySmall gray400 className="font-semibold">{trans.clientName}</Text>
													}
												</View>
											</View>
											<View className="flex flex-col items-end justify-start">
												<Text bodySmall gray400 className="font-semibold">{new Date(trans.created_at).toLocaleDateString()}</Text>
												<Text bodySmall gray400 className="font-semibold">{new Date(trans.created_at).toLocaleTimeString()}</Text>
											</View>
										</View>
										<View className="flex flex-row items-center justify-end">
											<Icon source="chevron-right" size={20} color={"#94a3b8"} />
										</View>
									</Card>
								))}
								{transactions && transactions.length <= 0 && (
									<View
										style={{ backgroundColor: Colors.gray200 }}
										className="flex flex-col w-full px-10 py-20 space-y-1 items-center justify-center rounded-lg"
									>
										<Text bodyLarge black className="font-semibold">No Transactions Yet</Text>
									</View>
								)}
							</View>
						</ScrollView>
					</View>
					: null}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}