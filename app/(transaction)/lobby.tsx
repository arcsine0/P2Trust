import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

export default function TransactionLobbyScreen() {
    const [roomID, setRoomID] = useState("");
    const [merchantID, setMerchantID] = useState("");

    useEffect(() => {
        (async () => {
            const merchantIDAsync = await AsyncStorage.getItem("merchantID");
            if (merchantIDAsync) {
                setRoomID(merchantIDAsync);
            }
        });
    }, []);

	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-2 items-start justify-start">
			<View></View>
		</SafeAreaView>
	);
}