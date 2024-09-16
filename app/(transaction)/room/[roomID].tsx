import { useState, useEffect, useRef, useCallback } from "react";
import { useWindowDimensions, Platform, View, KeyboardAvoidingView, FlatList, ScrollView } from "react-native";
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
			eventType: "payment_requested" | "payment_request_cancelled";
			amount: Float;
			currency: string;
			platform: string;
			merchantName: string;
			merchantNumber: string;
		};
	}
	| {
		timestamp: Date;
		type: "payment";
		from: string;
		data: {
			eventType: "payment_sent" | "payment_received";
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
];

const platforms = [
	{ label: "GCash", value: "GCash" },
	{ label: "Paymaya", value: "Paymaya" },
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

	const [paymentDetails, setPaymentDetails] = useState({
		amount: undefined as Float | undefined,
		currency: undefined as string | undefined,
		platform: undefined as string | undefined,
		merchantNumber: undefined as string | undefined,
		merchantName: undefined as string | undefined,
	});

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

	const sendPaymentRequest = () => {
		interactionsChannel.send({
			type: "broadcast",
			event: "payment",
			payload: {
				data: {
					eventType: "payment_requested",
					from: userData?.username || "N/A",
					amount: paymentDetails.amount,
					currency: "PHP",
					platform: paymentDetails.platform,
					merchantName: paymentDetails.merchantName,
					merchantNumber: paymentDetails.merchantNumber,
				}
			}
		}).then(() => {
			setPaymentDetails({
				amount: 0,
				currency: '',
				platform: '',
				merchantNumber: '',
				merchantName: '',
			});

			setShowActions(false);
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
								default: break;
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

							switch (payloadData.data.eventType) {
								case "payment_requested":
									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "payment",
										from: payloadData.data.from,
										data: {
											eventType: "payment_requested",
											amount: payloadData.data.amount,
											currency: payloadData.data.currency,
											merchantName: payloadData.data.merchantName,
											merchantNumber: payloadData.data.merchantNumber,
											platform: payloadData.data.platform,
										},
									}]);
									break;
								default: break;
							}
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
		<View className="flex flex-col w-full p-2 items-center justify-start">
			<ScrollView
				className="w-full"
				contentContainerStyle={{ flexGrow: 1, rowGap: 8 }}
			>
				<Text variant="titleMedium">Transaction Details</Text>
				<View className="flex flex-row w-full gap-2 items-center justify-center">
					{/* <Dropdown
						style={{ borderWidth: 0.5, borderRadius: 8 }}
						data={currencies}
						value={paymentCurrency}
						onChange={value => setPaymentCurrency(value.value)}
						labelField="label"
						valueField="value"
					/> */}
					<View className="w-full">
						<TextInput
							className="rounded-lg overflow-scroll"
							label="Amount"
							value={paymentDetails.amount?.toString()}
							onChangeText={text => setPaymentDetails({ ...paymentDetails, amount: parseFloat(text) })}
							keyboardType="numeric"
						/>
					</View>
				</View>
				<Dropdown
					style={{ borderWidth: 0.5, borderRadius: 8, padding: 10, backgroundColor: theme.colors.primaryContainer }}
					data={platforms}
					value={paymentDetails.platform}
					onChange={value => setPaymentDetails({ ...paymentDetails, platform: value.value })}
					labelField="label"
					valueField="value"
					placeholder="Select Payment Platform"
				/>
				<Text variant="titleMedium">Your Account Details</Text>
				<TextInput
					className="rounded-lg overflow-scroll"
					label="Name"
					value={paymentDetails.merchantName}
					onChangeText={text => setPaymentDetails({ ...paymentDetails, merchantName: text })}
					keyboardType="default"
				/>
				<TextInput
					className="rounded-lg overflow-scroll"
					label="Account Number"
					value={paymentDetails.merchantNumber}
					onChangeText={text => setPaymentDetails({ ...paymentDetails, merchantNumber: text })}
					keyboardType="default"
				/>
				<Button
					className="rounded-lg w-full"
					icon={"information"}
					mode="contained"
					onPress={() => sendPaymentRequest()}
				>
					Send Request
				</Button>
			</ScrollView>

		</View>
	)

	const SendPaymentRoute = () => (
		<View>
			<Text variant="titleLarge">Test</Text>
		</View>
	)

	const SendProofRoute = () => (
		<View>
			<Text variant="titleLarge">Test</Text>
		</View>
	)

	// Actions Tabs
	const [tabIndex, setTabIndex] = useState(0);
	const [tabRoutes] = useState([
		{ key: "RequestPayment", title: "Request Payment" },
		{ key: "SendPayment", title: "Send Payment" },
		{ key: "SendProof", title: "Send Proof" },
	]);

	return (

		<SafeAreaView className="flex flex-col w-full h-full px-2 pb-2 items-start justify-start">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={100}
				className="flex w-full h-full"
			>
				{interactions ?
					<FlatList
						className="w-full mb-2"
						data={interactions.sort(
							(a, b) => b.timestamp.getTime() - a.timestamp.getTime()
						)}
						inverted={true}
						keyExtractor={(item, index) => index.toString()}
						contentContainerStyle={{ flexGrow: 1 }}
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
									<View className="flex flex-col w-full">
										<Chip
											className="mb-2"
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
										{inter.data.eventType === "payment_requested" && (
											<Card 
												className="w-2/3"
												style={{ backgroundColor: theme.colors.background }}
											>
												<Card.Content className="flex flex-col p-2">
													<Text className="mb-2">Amount</Text>
													<Text className="mb-2 font-bold" variant="titleLarge">
														{inter.data.currency} {inter.data.amount}
													</Text>
													<Text className="mb-2">Platform</Text>
													<View className="flex flex-row mb-2 items-center justify-start">
														<Chip icon="cash">
															<Text>{inter.data.platform}</Text>
														</Chip>
													</View>
													<Button
														className="rounded-lg w-full"
														icon={"information"}
														mode="contained"
														onPress={() => { }}
													>
														Pay
													</Button>
												</Card.Content>
											</Card>
										)}
									</View>
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
							SendProof: SendProofRoute,
						})}
						onIndexChange={index => setTabIndex(index)}
						initialLayout={{ width: layout.width }}
						renderTabBar={props => <TabBar {...props}
							style={{ backgroundColor: theme.colors.primary, borderRadius: 8 }}
							indicatorStyle={{ backgroundColor: theme.colors.background }}
							scrollEnabled={true}
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