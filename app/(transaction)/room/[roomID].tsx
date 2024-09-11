import { useState, useEffect, useRef } from "react";
import { Platform, View, KeyboardAvoidingView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, TextInput, Avatar, Chip, IconButton, Card, Button, Snackbar } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router, useLocalSearchParams } from "expo-router";

import { supabase } from "@/supabase/config";

type UserData = {
	id: string;
	username: string;
	push_token: string;
	[key: string]: any;
}

type Interaction =
	| {
		timestamp: Date;
		type: "event";
		from: string;
		data: {
			eventType: "user_joined" | "user_left" | "user_disconnected" | "user_reconnected" | "payment_sent" | "payment_received";
			// ... other event-specific data
		};
	}
	| {
		timestamp: Date;
		type: "message";
		from: string;
		data: {
			message: string;
		};
	}
	| {
		timestamp: Date;
		type: "submission";
		from: string;
		data: {
			submissionId: string;
		};
	};


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

export default function TransactionRoomScreen() {
	const [userData, setUserData] = useState<UserData | undefined>(undefined);
	const [interactions, setInteractions] = useState<Interaction[] | undefined>([]);

	const [message, setMessage] = useState("");

	const { roomID } = useLocalSearchParams<{ roomID: string }>();

	const interactionsChannel = supabase.channel(`room_${roomID}`);

	const sendMessage = (message: string, sender: string) => {
		interactionsChannel.send({
			type: "broadcast",
			event: "message",
			payload: {
				data: {
					from: sender,
					message: message,
				}
			}
		});
		setMessage("");
	}

	const getRoomData = async () => {
		try {
			await AsyncStorage.getItem("userData").then(async (userDataAsync) => {
				if (userDataAsync) {
					const userDataTemp = JSON.parse(userDataAsync);
					setUserData(userDataTemp);

					interactionsChannel
						.on("broadcast", { event: "event" }, (payload) => {
							const payloadData = payload.payload;

							switch (payloadData.type) {
								case "join":
									console.log(`User ${payloadData.from} has joined the room`)
									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "event",
										from: payloadData.from,
										data: {
											eventType: "user_joined",
										},
									}]);
									break;
								default:
									break;
							}
						})
						.on("broadcast", { event: "message" }, (payload) => {
							const payloadData = payload.payload;

							setInteractions(curr => [...(curr || []), {
								timestamp: new Date(Date.now()),
								type: "message",
								from: payloadData.data.from,
								data: {
									message: payloadData.data.message,
								},
							}]);
						})
						.subscribe(async (status) => {
							if (status === "SUBSCRIBED") {
								await interactionsChannel.track({ online_at: new Date().toISOString() });

								interactionsChannel.send({
									type: "broadcast",
									event: "event",
									payload: {
										from: userDataTemp.username,
										type: "join"
									}
								});
							}
						});
				}
			});
		} catch (err) {
			console.log(err);
		}
	}

	useEffect(() => {
		getRoomData();
		setInteractions([]);

		// console.log(`room_${roomID}`)

		return () => {
			interactionsChannel.unsubscribe();
			supabase.removeChannel(interactionsChannel);
		}
	}, []);

	return (
		<SafeAreaView className="flex flex-col w-screen h-full px-2 pb-2 items-start justify-start">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				className="w-full h-full"
			>
				<View className="flex w-full grow mb-2 items-center justify-center">
					{interactions ?
						<FlatList
							className="w-full"
							data={interactions.sort(
								(a, b) => b.timestamp.getTime() - a.timestamp.getTime()
							)}
							inverted={true}
							keyExtractor={(item, index) => index.toString()}
							renderItem={({ item: inter }) => (
								<View key={inter.timestamp.getTime()} className="mb-2">
									{inter.type === "event" && (
										<Chip
											icon={(() => {
												switch (inter.data.eventType) {
													case "user_joined":
														return "account-plus";
													case "user_left":
														return "account-minus";
													default:
														return "information";
												}
											})()}
										>
											{inter.data.eventType === "user_joined" && (
												<Text>{inter.from} joined the room</Text>
											)}
											{inter.data.eventType === "user_left" && (
												<Text>{inter.from} left the room</Text>
											)}
										</Chip>
									)}
									{inter.type === "message" && (
										<View className="flex flex-row mb-2 gap-2 items-center justify-start">
											<Avatar.Text label={getInitials(inter.from)} size={35} />
											<View className="flex flex-col items-start justify-start">
												<Text
													variant="titleSmall"
													className="w-full font-bold"
												>
													{inter.from}
												</Text>
												<Text
													variant="bodyMedium"
													className="w-full text-pretty"
												>
													{inter.data.message}
												</Text>
												<Text variant="bodySmall" className="text-slate-400">
													{inter.timestamp.toLocaleString()}
												</Text>
											</View>
										</View>
									)}
								</View>
							)}
						/>
						: null}
				</View>
				<View className="flex flex-row gap-2 items-start justify-center">
					<TextInput
						className="grow rounded-lg overflow-scroll"
						label="Message"
						value={message}
						onChangeText={text => setMessage(text)}
						onSubmitEditing={() => sendMessage(message, userData?.username || "N/A")}
						multiline
					/>
					<Button
						className="rounded-lg"
						icon={"send"}
						mode="contained"
						onPress={() => sendMessage(message, userData?.username || "N/A")}
						disabled={!message}
					>
						Send
					</Button>
				</View>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}