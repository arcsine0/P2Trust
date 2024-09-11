import { useState, useEffect, useRef } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Avatar, Chip, IconButton, Card, Button, Snackbar } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router, useLocalSearchParams } from "expo-router";

import { supabase } from "@/supabase/config";

type UserData = {
	id: string;
	username: string;
	push_token: string;
	[key: string]: any;
}


export default function TransactionRoomScreen() {
	const [userData, setUserData] = useState<UserData | undefined>(undefined);

	const { roomID } = useLocalSearchParams<{ roomID: string }>();

	const interactionsChannel = supabase.channel(`room_${roomID}`);

	const getUserData = async () => {
		try {
			await AsyncStorage.getItem("userData").then(async (userDataAsync) => {
				if (userDataAsync) {
					const userData = JSON.parse(userDataAsync);
					setUserData(userData);

					interactionsChannel
						.on("presence", { event: "join" }, ({ newPresences }) => {
							console.log(`${newPresences} has joined the room`)
						})
						.subscribe(async (status) => {
							if (status === "SUBSCRIBED") {
								await interactionsChannel.track({ online_at: new Date().toISOString() });
							}
						});
				}
			});
		} catch (err) {
			console.log(err);
		}
	}

	useEffect(() => {
		getUserData();

	}, []);

	return (
		<SafeAreaView className="flex flex-col w-screen h-screen gap-2 p-2 items-start justify-start">
			<View></View>
		</SafeAreaView>
	);
}