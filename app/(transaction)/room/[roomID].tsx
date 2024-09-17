import { useState, useEffect, useRef, useCallback } from "react";
import { useWindowDimensions, Platform, View, KeyboardAvoidingView, FlatList, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, TextInput, Avatar, Chip, IconButton, Card, Button, Menu } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";
import { NativeViewGestureHandler } from "react-native-gesture-handler";
import { TabView, SceneMap, TabBar } from "react-native-tab-view";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router, useLocalSearchParams } from "expo-router";

import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { Interaction } from "@/lib/helpers/types";
import { Currencies, PaymentPlatforms } from "@/lib/helpers/collections";

import { Float } from "react-native/Libraries/Types/CodegenTypes";

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

	const [showActionsMenu, setShowActionsMenu] = useState(false);

	const [actionsModalRoute, setActionsModalRoute] = useState("RequestPayment");
	const actionsModalRef = useRef<BottomSheetModal>(null);

	const { userData } = useUserData();

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

			actionsModalRef.current?.close();
		});
	}

	const getRoomData = async () => {
		try {
			if (userData) {
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
									from: userData.username,
									type: "join"
								}
							});
						}
					});
			}
		} catch (err) {
			console.log(err);
		}
	}

	const showActionsModal = (route: string) => {
		setActionsModalRoute(route);
		setShowActionsMenu(false);

		actionsModalRef.current?.present();
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
			<View className="flex flex-col w-full gap-2">
				<Text variant="titleMedium">Transaction Details</Text>
				<TextInput
					className="rounded-lg overflow-scroll"
					label="Amount"
					value={paymentDetails.amount?.toString()}
					onChangeText={text => setPaymentDetails({ ...paymentDetails, amount: parseFloat(text) })}
					keyboardType="numeric"
				/>
				<Dropdown
					style={{ borderWidth: 0.5, borderRadius: 8, padding: 10, backgroundColor: theme.colors.primaryContainer }}
					data={PaymentPlatforms}
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
			</View>
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

	const renderBackdrop = useCallback(
		(props: BottomSheetBackdropProps) => (
			<BottomSheetBackdrop 
				{...props}
				pressBehavior="close"
				appearsOnIndex={0}
				opacity={0.75}
			/>
		), []
	);

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
						<Menu
							visible={showActionsMenu}
							onDismiss={() => setShowActionsMenu(false)}
							anchor={
								<Button
									className="rounded-lg w-full"
									icon={"information"}
									mode="contained"
									onPress={() => setShowActionsMenu(true)}
								>
									Actions
								</Button>
							}>
							<Menu.Item 
								onPress={() => showActionsModal("RequestPayment")} 
								title="Request Payments" 
								leadingIcon="cash-plus"
							/>
							<Menu.Item 
								onPress={() => showActionsModal("SendPayment")} 
								title="Send Payments" 
								leadingIcon="cash-fast"
							/>
							<Menu.Item 
								onPress={() => showActionsModal("SendProof")} 
								title="Send Proof" 
								leadingIcon="account-cash"
							/>
						</Menu>

					</View>
				</View>
				<BottomSheetModal
					ref={actionsModalRef}
					index={0}
					snapPoints={["60%"]}
					enablePanDownToClose={true}
					backdropComponent={renderBackdrop}
				>
					<BottomSheetView>
						{actionsModalRoute === "RequestPayment" && RequestPaymentRoute()}
						{actionsModalRoute === "SendPayment" && SendPaymentRoute()}
						{actionsModalRoute === "SendProof" && SendProofRoute()}
					</BottomSheetView>
				</BottomSheetModal>
			</KeyboardAvoidingView>
		</SafeAreaView>
	);
}