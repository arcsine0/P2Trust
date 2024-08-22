import { useState } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useTheme, Text, Card, Avatar, Chip, Icon } from "react-native-paper";

import { MaterialCommunityIcons as MCI } from "@expo/vector-icons";
export default function HistoryScreen() {
	const [inputSearch, setInputSearch] = useState("")

	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-5 items-start justify-start">
			
		</SafeAreaView>
	);
}