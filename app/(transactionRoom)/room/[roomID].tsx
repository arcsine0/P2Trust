import { useNavigation } from "expo-router";
import { useState, useEffect, useRef, useCallback } from "react";
import { useWindowDimensions, Platform, View, KeyboardAvoidingView, FlatList } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, TextInput, Avatar, Chip, Card, Button, Menu, Dialog, Portal, Icon, TouchableRipple } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";

import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";

import { FontAwesome6 } from "@expo/vector-icons";

import { router, useLocalSearchParams } from "expo-router";

import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";

import { Interaction, RequestDetails } from "@/lib/helpers/types";

import { EventChip, PaymentRequestCard, PaymentSentCard } from "@/components/chatEvents";
import { RequestPaymentRoute, SendPaymentRoute } from "@/components/chatBottomSheetRoutes";

import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { getInitials, formatISODate } from "@/lib/helpers/functions";

export default function TransactionRoomScreen() {
	const [interactions, setInteractions] = useState<Interaction[] | undefined>([]);

	// messages
	const [message, setMessage] = useState("");

	const [requestDetails, setRequestDetails] = useState<RequestDetails>({
		amount: 100,
		currency: "PHP",
		platform: "GCash",
		accountNumber: "Test Client",
		accountName: "09673127888",
	});

	const [paymentDetails, setPaymentDetails] = useState<RequestDetails>({
		amount: 0 as Float,
		currency: undefined as string | undefined,
		platform: undefined as string | undefined,
		accountNumber: undefined as string | undefined,
		accountName: undefined as string | undefined,
	});

	const [receiptURI, setReceiptURI] = useState<string | undefined>(undefined);

	const [showActionsMenu, setShowActionsMenu] = useState(false);
	const [showFinishDialog, setShowFinishDialog] = useState(false);

	const [actionsModalRoute, setActionsModalRoute] = useState("RequestPayment");
	const actionsModalRef = useRef<BottomSheetModal>(null);

	const { userData, setQueue } = useUserData();
	const { merchantData, role } = useMerchantData();

	const { roomID } = useLocalSearchParams<{ roomID: string }>();
	const layout = useWindowDimensions();
	const theme = useTheme();
	const navigation = useNavigation();

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
				type: "payment_requested",
				data: {
					from: userData?.username || "N/A",
					amount: requestDetails.amount,
					currency: "PHP",
					platform: requestDetails.platform,
					merchantName: requestDetails.accountName,
					merchantNumber: requestDetails.accountNumber,
				}
			}
		}).then(() => {
			// commented out for testing
			// setRequestDetails({
			// 	amount: 0,
			// 	currency: '',
			// 	platform: '',
			// 	accountNumber: '',
			// 	accountName: '',
			// });

			actionsModalRef.current?.close();
		});
	}

	const sendPayment = () => {
		interactionsChannel.send({
			type: "broadcast",
			event: "payment",
			payload: {
				type: "payment_sent",
				data: {
					from: userData?.username,
					proof: receiptURI,
				}
			}
		})
		console.log(receiptURI);
	}

	const pickReceipt = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			quality: 1,
		});

		if (result && result.assets && result.assets[0].uri) {
			console.log(result.assets[0].uri);
			setReceiptURI(result.assets[0].uri);
		}
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
									type: "user_joined",
									from: payloadData.from,
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

						switch (payloadData.type) {
							case "payment_requested":
								setInteractions(curr => [...(curr || []), {
									timestamp: new Date(Date.now()),
									type: "payment_requested",
									from: payloadData.data.from,
									data: {
										amount: payloadData.data.amount,
										currency: payloadData.data.currency,
										platform: payloadData.data.platform,
										accountName: payloadData.data.merchantName,
										accountNumber: payloadData.data.merchantNumber,
									},
								}]);

								break;
							case "payment_sent":
								setInteractions(curr => [...(curr || []), {
									timestamp: new Date(Date.now()),
									type: "payment_sent",
									from: payloadData.data.from,
									data: {
										proof: payloadData.data.proof,
									},
								}]);

								break;
							default: break;
						}

					})
					.on("broadcast", { event: "transaction" }, async (payload) => {
						const payloadData = payload.payload;

						switch (payloadData.data.eventType) {
							case "transaction_started":
								break;
							case "transaction_completed":
								interactionsChannel.unsubscribe();
								supabase.removeChannel(interactionsChannel);

								setQueue(prevQueue => {
									if (prevQueue) {
										return prevQueue.filter(req => req.sender_id !== merchantData?.id);
									} else {
										return [];
									}
								});

								router.navigate("/(transactionRoom)");

								break;
							case "transaction_cancelled":
								break;
							default: break;
						};

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

	const finishTransaction = async () => {
		const interactionsJSON = JSON.stringify(interactions?.filter(inter => inter.type !== "message").sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime()
		));

		const platforms = interactions?.filter(inter => inter.type === "payment_requested").map((inter) => {
			if (inter.type === "payment_requested") {
				return inter.data.platform;
			} else {
				return "";
			}
		}).filter((value, index, self) => self.indexOf(value) === index) as string[];

		const { error } = await supabase
			.from("transactions")
			.insert({
				total_amount: 0,
				merchant: JSON.stringify({
					id: role === "merchant" ? userData?.id : merchantData?.id,
					username: role === "merchant" ? userData?.username : merchantData?.username,
				}),
				client: JSON.stringify({
					id: role === "merchant" ? merchantData?.id : userData?.id,
					username: role === "merchant" ? merchantData?.username : userData?.username,
				}),
				status: "complete",
				platforms: platforms,
				timeline: interactionsJSON,
			});

		if (!error) {
			setShowFinishDialog(false);

			interactionsChannel.send({
				type: "broadcast",
				event: "transaction",
				payload: {
					data: {
						eventType: "transaction_completed",
					}
				}
			});
		} else {
			console.log(error);
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

		navigation.setOptions({
			headerLeft: () => (
				<View className="flex flex-row gap-2 items-center justify-start">
					{merchantData ?
						<Avatar.Text label={getInitials(merchantData.username)} size={30} />
						:
						<Avatar.Text label="N/A" size={30} />
					}
					<Text variant="titleMedium">{merchantData?.username || "N/A"}</Text>
				</View>
			),
			headerRight: () => (
				<Button
					className="rounded-lg"
					icon="check-all"
					mode="contained"
					onPress={() => setShowFinishDialog(true)}
				>
					Finish
				</Button>
			)
		})

		return () => {
			interactionsChannel.unsubscribe();
			supabase.removeChannel(interactionsChannel);
		}
	}, []);

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
							<View key={inter.timestamp.getTime()} className="mb-2 space-y-2">
								{inter.type !== "message" ?
									<EventChip type={inter.type} from={inter.from} />
									:
									<View className="flex flex-row gap-2 items-center justify-start">
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
								}
								{inter.type === "payment_requested" && (
									<PaymentRequestCard
										style={{ backgroundColor: theme.colors.background }}
										timestamp={inter.timestamp}
										amount={inter.data.amount}
										platform={inter.data.platform}
										currency={inter.data.currency}
										onPayment={() => {
											setPaymentDetails({
												amount: inter.data.amount,
												currency: inter.data.currency,
												platform: inter.data.platform,
												accountName: inter.data.accountName,
												accountNumber: inter.data.accountNumber,
											})
											setActionsModalRoute("SendPayment");

											actionsModalRef.current?.present()
										}}
									/>
								)}
								{inter.type === "payment_sent" && (
									<PaymentSentCard
										style={{ backgroundColor: theme.colors.background }}
										timestamp={inter.timestamp}
										from={inter.from}
										onConfirm={() => { }}
									/>
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
							{/* <Menu.Item
								onPress={() => showActionsModal("SendPayment")}
								title="Send Payments"
								leadingIcon="cash-fast"
							/> */}
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
						{actionsModalRoute === "RequestPayment" && (
							<RequestPaymentRoute
								dropdownStyle={{ borderWidth: 0.5, borderRadius: 8, padding: 10, backgroundColor: theme.colors.primaryContainer }}
								requestDetails={requestDetails}
								setRequestDetails={setRequestDetails}
								sendPaymentRequest={sendPaymentRequest}
							/>
						)}
						{actionsModalRoute === "SendPayment" && (
							<SendPaymentRoute
								paymentDetails={paymentDetails}
								receiptURI={receiptURI}
								setReceiptURI={setReceiptURI}
								pickReceipt={pickReceipt}
								sendPayment={sendPayment}
							/>
						)}
						{actionsModalRoute === "SendProof" && SendProofRoute()}
					</BottomSheetView>
				</BottomSheetModal>
				<Portal>
					<Dialog visible={showFinishDialog} onDismiss={() => setShowFinishDialog(false)}>
						<Dialog.Title>
							<Chip style={{ backgroundColor: theme.colors.error }}>
								<Text style={{ color: theme.colors.background }}>Warning</Text>
							</Chip>
						</Dialog.Title>
						<Dialog.Content>
							<Text variant="bodyMedium">Are you sure you want to finish the transaction? This action cannot be undone.</Text>
						</Dialog.Content>
						<Dialog.Actions>
							<Button onPress={() => setShowFinishDialog(false)}>Cancel</Button>
							<Button onPress={() => finishTransaction()}>Finish</Button>
						</Dialog.Actions>
					</Dialog>
				</Portal>
			</KeyboardAvoidingView>
		</SafeAreaView >
	);
}