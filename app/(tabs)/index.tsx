import { Text, View, ScrollView, TouchableHighlight } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";

import { Octicons } from "@expo/vector-icons";

export default function HomeScreen() {
	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-5 p-5 items-start justify-start">
			<View className="flex flex-row w-full px-5 py-2 gap-3 items-center justify-between bg-red-500 border-1 border-white rounded-lg">
				<Octicons name="alert" size={40} />
				<View className="flex flex-col">
					<Text className="font-semibold text-red-800 text-sm">NEW FLAGGED MERCHANT</Text>
					<Text className="font-bold text-red-950 text-2xl">09XXX-XXX-XXXX</Text>
				</View>
			</View>
			<View className="flex flex-col w-full h-1/3">
				<Text className="font-bold text-slate-800 text-2xl">Recent Activity</Text>
				<View className="flex flex-col bg-white shadow-md rounded-lg">
					<ScrollView className="flex flex-col p-2 divide-y divide-slate-200">
						<View className="flex flex-row p-2 items-center justify-between">
							<View className="flex flex-col">
								<Text className="font-semibold text-slate-500 text-sm">Merchant</Text>
								<Text className="font-bold text-slate-800 text-lg">Merchant Name</Text>
							</View>
							<View className="flex flex-col text-right">
								<Text className="font-semibold text-slate-500 text-sm">Amount</Text>
								<Text className="font-bold text-slate-800 text-lg">₱100</Text>
							</View>
						</View>
						<View className="flex flex-row p-2 items-center justify-between">
							<View className="flex flex-col">
								<Text className="font-semibold text-slate-500 text-sm">Merchant</Text>
								<Text className="font-bold text-slate-800 text-lg">Merchant Name</Text>
							</View>
							<View className="flex flex-col text-right">
								<Text className="font-semibold text-slate-500 text-sm">Amount</Text>
								<Text className="font-bold text-slate-800 text-lg">₱100</Text>
							</View>
						</View>
					</ScrollView>
					<TouchableHighlight onPress={() => router.push("/(tabs)/history")}>
						<View className="flex flex-row p-[2px] items-center justify-center bg-blue-500 rounded-b-lg">
							<Text className="font-semibold text-white text-sm">View Full History</Text>
						</View>
					</TouchableHighlight>
				</View>
			</View>
			<View className="flex flex-col w-full">
				<Text className="font-bold text-slate-800 text-2xl">Live Feed</Text>
				<View className="flex flex-col p-2 bg-white divide-y divide-slate-200 shadow-md rounded-lg">
					<View className="flex flex-row p-2 items-center justify-between">
						<View className="flex flex-col">
							<Text className="font-semibold text-slate-500 text-sm">Merchant</Text>
							<Text className="font-bold text-slate-800 text-lg">Merchant Name</Text>
						</View>
						<View className="flex flex-col text-right">
							<Text className="font-semibold text-slate-500 text-sm">Given</Text>
							<Text className="font-bold text-slate-800 text-lg">1st Warning</Text>
						</View>
					</View>
					<View className="flex flex-row p-2 items-center justify-between">
						<View className="flex flex-col">
							<Text className="font-semibold text-slate-500 text-sm">Merchant</Text>
							<Text className="font-bold text-slate-800 text-lg">Merchant Name</Text>
						</View>
						<View className="flex flex-col text-right">
							<Text className="font-semibold text-slate-500 text-sm">Given</Text>
							<Text className="font-bold text-slate-800 text-lg">3rd Warning</Text>
						</View>
					</View>
				</View>
			</View>
		</SafeAreaView>
	);
}
