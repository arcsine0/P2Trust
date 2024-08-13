import { useState } from "react";
import { Text, View, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Picker } from "@react-native-picker/picker";
import { Octicons } from "@expo/vector-icons";

type SortOption = {
	type: string,
	sort: string
}

export default function HistoryScreen() {
	const [selectedSort, setSelectedSort] = useState<SortOption>({type: "amount", sort: "desc"});
	const [inputSearch, setInputSearch] = useState("")

	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-5 items-start justify-start">
			<Text className="font-bold text-slate-800 text-2xl">Transaction History</Text>
			<View className="flex flex-col gap-2 w-full">
				<View className="flex flex-row gap-2 h-[50px]">
					<Picker
						selectedValue={selectedSort}
						onValueChange={(val) => setSelectedSort({type: val.type, sort: selectedSort.sort})}
						className=""
					>
						<Picker.Item label="Amount" value={{type: "amount", sort: "desc"}} />
						<Picker.Item label="Date" value={{type: "date", sort: "desc"}} />
						<Picker.Item label="Name" value={{type: "name", sort: "desc"}} />
					</Picker>
					<View className="flex px-3 items-center justify-center bg-white shadow-md rounded-2xl">
						<TouchableOpacity
							onPress={() => setSelectedSort((prev) => ({...prev, sort: selectedSort.sort === "asc" ? "desc" : "asc"}))}
						>
							<Octicons name={selectedSort.sort === "asc" ? "sort-asc" : "sort-desc"} size={18} />
						</TouchableOpacity>
					</View>
					<TextInput 
						className="grow px-5 bg-white shadow-md rounded-2xl"
						value={inputSearch}
						onChangeText={setInputSearch}
						placeholder="Search merchant name..."
					/>
				</View>
				<View className="flex flex-col bg-white shadow-md rounded-2xl">
					<ScrollView className="flex flex-col p-2 divide-y divide-slate-200">
						<View className="flex flex-row p-2 items-center justify-between">
							<View className="flex flex-col">
								<Text className="font-semibold text-slate-500 text-sm">Date</Text>
								<Text className="font-bold text-slate-800 text-lg">Merchant Name</Text>
							</View>
							<View className="flex flex-col text-right">
								<Text className="font-semibold text-slate-500 text-sm">Amount Sent</Text>
								<Text className="font-bold text-slate-800 text-lg">₱100</Text>
							</View>
						</View>
						<View className="flex flex-row p-2 items-center justify-between">
							<View className="flex flex-col">
								<Text className="font-semibold text-slate-500 text-sm">Date</Text>
								<Text className="font-bold text-slate-800 text-lg">Merchant Name</Text>
							</View>
							<View className="flex flex-col text-right">
								<Text className="font-semibold text-slate-500 text-sm">Amount Sent</Text>
								<Text className="font-bold text-slate-800 text-lg">₱100</Text>
							</View>
						</View>
					</ScrollView>
				</View>
			</View>
		</SafeAreaView>
	);
}