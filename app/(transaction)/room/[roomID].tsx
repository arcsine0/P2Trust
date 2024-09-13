import { useState, useEffect, useRef, useCallback } from "react";
import { useWindowDimensions, Platform, View, KeyboardAvoidingView, FlatList } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, TextInput, Avatar, Chip, IconButton, Card, Button, List } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { NativeViewGestureHandler } from "react-native-gesture-handler";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router, useLocalSearchParams } from "expo-router";

import { BottomSheetModal, BottomSheetView, BottomSheetModalProvider } from "@gorhom/bottom-sheet";

import { supabase } from "@/supabase/config";
import { Float } from "react-native/Libraries/Types/CodegenTypes";

type UserData = {
	id: string;
	username: string;
	push_token: string;
	[key: string]: any;
}

type Interaction =
	| {
		timestamp: Date;
		type: "user";
		from: string;
		data: {
			eventType: "user_joined" | "user_left" | "user_disconnected" | "user_reconnected";
		};
	}
	| {
		timestamp: Date;
		type: "payment";
		from: string;
		data: {
			eventType: "payment_requested" | "payment_sent" | "payment_received" | "payment_request_cancelled";
			amount: Float;
			currency: string;
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

const currencies = [
	{ label: "PHP", value: "PHP" },
	{ label: "USD", value: "USD" },
	{ label: "EUR", value: "EUR" },
]

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

	// messages
	const [message, setMessage] = useState("");

	// payments
	const [paymentAmount, setPaymentAmount] = useState<Float | undefined>(undefined);
	const [paymentCurrency, setPaymentCurrency] = useState<string | undefined>(undefined);
	const [paymentPlatform, setPaymentPlatform] = useState<string | undefined>(undefined);

	// merchant payment info
	const [merchantPaymentNumber, setMerchantPaymentNumber] = useState<string | undefined>(undefined);
	const [merchantPaymentName, setMerchantPaymentName] = useState<string | undefined>(undefined);

	const [showActions, setShowActions] = useState(false);

	const { roomID } = useLocalSearchParams<{ roomID: string }>();
	const layout = useWindowDimensions();
	const theme = useTheme();

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

	const sendPaymentRequest = (sender: string, amount: Float, currency: string) => {
		interactionsChannel.send({
			type: "broadcast",
			event: "payment",
			payload: {
				data: {
					from: sender,
					amount: amount,
					currency: currency,
				}
			}
		});
	}

	const getRoomData = async () => {
		try {
			await AsyncStorage.getItem("userData").then(async (userDataAsync) => {
				if (userDataAsync) {
					const userDataTemp = JSON.parse(userDataAsync);
					setUserData(userDataTemp);

					interactionsChannel
						.on("broadcast", { event: "user" }, (payload) => {
							const payloadData = payload.payload;

							switch (payloadData.type) {
								case "join":
									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "user",
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
						.on("broadcast", { event: "payment" }, (payload) => {
							const payloadData = payload.payload;

							setInteractions(curr => [...(curr || []), {
								timestamp: new Date(Date.now()),
								type: "payment",
								from: payloadData.data.from,
								data: {
									eventType: "payment_requested",
									amount: payloadData.data.amount,
									currency: payloadData.data.currency,
								},
							}]);
						})
						.subscribe(async (status) => {
							if (status === "SUBSCRIBED") {
								await interactionsChannel.track({ online_at: new Date().toISOString() });

								interactionsChannel.send({
									type: "broadcast",
									event: "user",
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

	const RequestPaymentRoute = () => (
		<View>
			{/* <Dropdown
				style={{ borderWidth: 0.5, borderRadius: 8 }}
				data={currencies}
				value={paymentCurrency}
				onChange={value => setPaymentCurrency(value.value)}
				labelField="label"
				valueField="value"
			/>
			<TextInput
				label="Amount"
				value={paymentAmount?.toString()}
				onChangeText={text => setPaymentAmount(parseFloat(text))}
				keyboardType="numeric"
			/> */}
			<Text variant="titleLarge">Test</Text>
		</View>
	)

	const SendPaymentRoute = () => (
		<View>
			<Text variant="titleLarge">Test</Text>
		</View>
	)

	// Actions Tabs
	const [tabIndex, setTabIndex] = useState(0);
	const [tabRoutes] = useState([
		{ key: "RequestPayment", title: "Request Payment" },
		{ key: "SendPayment", title: "Send Payment" },
	]);

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
									{inter.type === ("user") && (
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
									{inter.type === ("payment") && (
										<Chip
											icon={(() => {
												switch (inter.data.eventType) {
													case "payment_requested":
														return "cash-plus";
													case "payment_sent":
														return "cash-fast";
													case "payment_received":
														return "cash-check";
													case "payment_request_cancelled":
														return "cash-refund";
													default:
														return "information";
												}
											})()}
										>
											{inter.data.eventType === "payment_requested" && (
												<Text>{inter.from} has sent a payment request</Text>
											)}
											{inter.data.eventType === "payment_request_cancelled" && (
												<Text>{inter.from} has cancelled the payment request</Text>
											)}
											{inter.data.eventType === "payment_sent" && (
												<Text>{inter.from} has sent the payment</Text>
											)}
											{inter.data.eventType === "payment_received" && (
												<Text>{inter.from} has received the payment</Text>
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
				<View className="flex flex-row gap-2 mb-2 items-start justify-center">
					<TextInput
						className="grow rounded-lg overflow-scroll"
						label="Message"
						value={message}
						onChangeText={text => setMessage(text)}
						onSubmitEditing={() => sendMessage(message, userData?.username || "N/A")}
						multiline
					/>
					<View className="flex flex-col items-start justify-center">
						<Button
							className="rounded-lg mb-2 w-full"
							icon={"send"}
							mode="contained"
							onPress={() => sendMessage(message, userData?.username || "N/A")}
							disabled={!message}
						>
							Send
						</Button>
						<Button
							className="rounded-lg w-full"
							icon={"information"}
							mode="contained"
							onPress={() => setShowActions(!showActions)}
						>
							Actions
						</Button>
					</View>
				</View>
				{showActions &&
					<TabView
						navigationState={{ index: tabIndex, routes: tabRoutes }}
						renderScene={SceneMap({
							RequestPayment: RequestPaymentRoute,
							SendPayment: SendPaymentRoute,
						})}
						onIndexChange={index => setTabIndex(index)}
						initialLayout={{ width: layout.width }}
						renderTabBar={props => <TabBar {...props} 
							style={{ backgroundColor: theme.colors.primary, borderRadius: 8 }} 
							indicatorStyle={{ backgroundColor: theme.colors.background }}
							renderLabel={({ route }) => (
								<Text style={{ color: theme.colors.background }}>{route.title}</Text>
							)}
						/>}
					/>
				}
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}