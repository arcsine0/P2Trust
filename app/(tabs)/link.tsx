import { Text, View, ScrollView, TouchableHighlight } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { Octicons } from "@expo/vector-icons";

export default function LinkScreen() {
	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-5 p-5 items-start justify-start">
			<Text className="font-bold text-slate-800 text-2xl">Link E-Wallets / Cards</Text>
		</SafeAreaView>
	);
}