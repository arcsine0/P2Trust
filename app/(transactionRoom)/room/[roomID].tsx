import { useState, useEffect, useLayoutEffect, useRef, useCallback } from "react";
import { Platform, KeyboardAvoidingView, FlatList, Dimensions, StyleSheet } from "react-native";

import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { useTheme, TextInput, Avatar, Chip, IconButton, Divider, ActivityIndicator } from "react-native-paper";

import { Colors, View, Text, Button, ActionSheet, Dialog, ExpandableSection, Image, TouchableOpacity } from "react-native-ui-lib";

import * as ImagePicker from "expo-image-picker";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { router, useNavigation, useLocalSearchParams } from "expo-router";

import { BottomSheetModal, BottomSheetView, BottomSheetBackdrop, BottomSheetBackdropProps } from "@gorhom/bottom-sheet";

import { supabase } from "@/supabase/config";
import { decode } from "base64-arraybuffer";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";

import { RequestDetails } from "@/lib/helpers/types";

import { EventChip, PaymentRequestCard, PaymentSentCard } from "@/components/chatEvents";
import { RequestPaymentRoute, SendPaymentRoute } from "@/components/chatBottomSheetRoutes";
import { UserCard } from "@/components/userCards/UserCard";

import { Float } from "react-native/Libraries/Types/CodegenTypes";
import { getInitials, formatISODate } from "@/lib/helpers/functions";
import { PositiveTags, NegativeTags } from "@/lib/helpers/collections";

export default function TransactionRoomScreen() {
	const [dimensions, setDimensions] = useState<{
		width: number;
		height: number;
	}>({
		width: Dimensions.get("screen").width,
		height: Dimensions.get("screen").height,
	});

	const [connectedUsers, setConnectedUsers] = useState<string[]>([]);

	const [message, setMessage] = useState<string>("");
	const [currentViewImage, setCurrentViewImage] = useState<string>("");
	const [activePaymentDetails, setActivePaymentDetails] = useState<{
		id: string;
		created_at: Date;
		amount: Float;
		currency: "PHP" | "USD" | "EUR";
		platform: "GCash" | "Paymaya";
	} | undefined>(undefined);

	const [totalTradedAmount, setTotalTradedAmount] = useState<Float>(0);

	const [ratings, setRatings] = useState<"UP" | "DOWN">("UP");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);

	const [isMessageSending, setIsMessageSending] = useState<boolean>(false);

	const [requestDetails, setRequestDetails] = useState<RequestDetails>({
		amount: 50,
		currency: "PHP",
		platform: "GCash",
		accountNumber: "",
		accountName: "",
	});

	const [paymentDetails, setPaymentDetails] = useState<RequestDetails>({
		amount: 0 as Float,
		currency: undefined as string | undefined,
		platform: undefined as string | undefined,
		accountNumber: undefined as string | undefined,
		accountName: undefined as string | undefined,
	});

	const [receipt, setReceipt] = useState<ImagePicker.ImagePickerAsset | undefined>(undefined);

	const [showActionsMenu, setShowActionsMenu] = useState<boolean>(false);
	const [showRequestModal, setShowRequestModal] = useState<boolean>(false);
	const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
	const [showPaymentConfirmModal, setShowPaymentConfirmModal] = useState<boolean>(false);
	const [showViewImageModal, setShowViewImageModal] = useState<boolean>(false);

	const [showProductSentSection, setShowProductSentSection] = useState<boolean>(true);
	const [showProductReceivedSection, setShowProductReceivedSection] = useState<boolean>(true);

	const [showFinishDialog, setShowFinishDialog] = useState<boolean>(false);
	const [showFinishConfirmationDialog, setShowFinishConfirmationDialog] = useState<boolean>(false);
	
	const [isPaymentRequestSending, setIsPaymentRequestSending] = useState<boolean>(false);
	const [isPaymentRequestCancelling, setIsPaymentRequestCancelling] = useState<boolean>(false);
	const [isPaymentSending, setIsPaymentSending] = useState<boolean>(false);
	const [isPaymentConfirmSending, setIsPaymentConfirmSending] = useState<boolean>(false);
	const [isProductSentSending, setIsProductSentSending] = useState<boolean>(false);
	const [isProductConfirmSending, setIsProductConfirmSending] = useState<boolean>(false);
	const [isTransactionFinishing, setIsTransactionFinishing] = useState<boolean>(false);
	const [isRatingSubmitting, setIsRatingSubmitting] = useState<boolean>(false);

	const [hasSentProduct, setHasSentProduct] = useState<boolean>(false);
	const [hasReceivedProduct, setHasReceivedProduct] = useState<boolean>(false);

	const ratingsModalRef = useRef<BottomSheetModal>(null);

	const { userData, setQueue } = useUserData();
	const { merchantData, role, interactions, setInteractions } = useMerchantData();

	const { roomID } = useLocalSearchParams<{ roomID: string }>();
	const theme = useTheme();
	const navigation = useNavigation();
	const insets = useSafeAreaInsets();

	const interactionsChannel = supabase.channel(`room_${roomID}`);

	// for iOS
	const [isRequestOptionClicked, setIsRequestOptionClicked] = useState<boolean>(false);

	const sendMessage = (message: string, sender: string) => {
		setIsMessageSending(true);

		interactionsChannel.send({
			type: "broadcast",
			event: "message",
			payload: {
				data: {
					sender_id: userData?.id,
					from: sender,
					message: message,
				}
			}
		}).then(() => {
			setMessage("");
			setIsMessageSending(false);
		});

	}

	const sendPaymentRequest = async () => {
		setIsPaymentRequestSending(true);

		try {
			const { data, error } = await supabase
				.from("payments")
				.insert({
					sender_id: userData?.id,
					receiver_id: merchantData?.id,
					amount: requestDetails.amount,
					currency: requestDetails.currency,
					platform: requestDetails.platform,
					transaction_id: roomID,
				})
				.select();

			if (!error) {
				interactionsChannel.send({
					type: "broadcast",
					event: "payment",
					payload: {
						type: "payment_requested",
						data: {
							id: data[0].id,
							sender_id: userData?.id,
							from: userData?.firstname || "N/A",
							amount: requestDetails.amount,
							currency: requestDetails.currency,
							platform: requestDetails.platform,
							merchantName: requestDetails.accountName,
							merchantNumber: requestDetails.accountNumber,
						}
					}
				}).then(() => {
					setActivePaymentDetails({
						id: data[0].id,
						created_at: data[0].created_at,
						amount: data[0].amount,
						currency: data[0].currency,
						platform: data[0].platform,
					});
					setIsPaymentRequestSending(false);

					// commented out for testing
					setRequestDetails({
						amount: 0,
						currency: "PHP",
						platform: "GCash",
						accountNumber: "",
						accountName: "",
					});

					setShowRequestModal(false);
				});
			} else {
				console.log(error);
			}
		} catch (error) {
			console.log(error);
		}
	}

	const cancelPaymentRequest = async (id: string | undefined) => {
		setIsPaymentRequestCancelling(true);

		try {
			if (id) {
				const { error } = await supabase
					.from("payments")
					.delete()
					.eq("id", id);

				if (!error) {
					interactionsChannel.send({
						type: "broadcast",
						event: "payment",
						payload: {
							type: "payment_request_cancelled",
							data: {
								id: id,
								sender_id: userData?.id,
								from: userData?.firstname,
							}
						}
					}).then(() => {
						setActivePaymentDetails(undefined);
						setIsPaymentRequestCancelling(false);
					})

				} else {
					console.log(error);
				}
			}
		} catch (error) {
			console.log(error);
		}
	}

	const sendPayment = async (id: string | undefined) => {
		setIsPaymentSending(true);

		if (!id) {
			setIsPaymentSending(false);
			return;
		};


		if (receipt) {
			try {
				const base64Data = receipt.base64;
				const contentType = receipt.mimeType;

				if (base64Data) {
					const arrayBuffer = decode(base64Data);

					const { data: receiptData, error: receiptError } = await supabase.storage
						.from("receipts")
						.upload(`transactions/${roomID}/${id}`, arrayBuffer, {
							contentType: contentType,
							cacheControl: "3600",
							upsert: true,
						});

					if (!receiptError && receiptData) {
						const { data: receiptURL } = supabase.storage
							.from("receipts")
							.getPublicUrl(receiptData.path);

						if (receiptURL) {
							const { error } = await supabase
								.from("payments")
								.update({
									status: "paid",
									paid_at: new Date().toISOString(),
									receipt: receiptData.fullPath,
								})
								.eq("id", id);

							if (!error) {
								const currentPayment = interactions?.filter(inter => inter.type === "payment_requested").find(inter => inter.data.id === id);

								interactionsChannel.send({
									type: "broadcast",
									event: "payment",
									payload: {
										type: "payment_sent",
										data: {
											id: id,
											sender_id: userData?.id,
											from: userData?.firstname,
											amount: currentPayment?.data.amount,
											currency: currentPayment?.data.currency,
											platform: currentPayment?.data.platform,
											receiptURL: receiptURL.publicUrl,
											receiptPath: receiptData.path,
										}
									}
								}).then(() => {
									setReceipt(undefined);
									setIsPaymentSending(false);
									setShowPaymentModal(false);
								});
							} else {
								console.log("Supabase transaction update error: ", error);
							}
						}
					} else {
						console.log("Supabase upload error: ", receiptError);
					}
				}
			} catch (error) {
				console.log("Error during upload:", error);
			}


		}

	}

	const confirmPayment = async (id: string | undefined) => {
		setIsPaymentConfirmSending(true);

		if (!id) {
			setIsPaymentConfirmSending(false);
			setShowPaymentConfirmModal(false);
			return;
		}

		try {
			const { data, error } = await supabase
				.from("payments")
				.update({
					status: "confirmed",
					confirmed_at: new Date().toISOString(),
				})
				.eq("id", id)
				.select();

			if (!error && data) {
				interactionsChannel.send({
					type: "broadcast",
					event: "payment",
					payload: {
						type: "payment_confirmed",
						data: {
							id: id,
							sender_id: userData?.id,
							from: userData?.firstname,
							amount: data[0].amount,
						}
					}
				}).then(() => {
					setIsPaymentConfirmSending(false);
					setShowPaymentConfirmModal(false);
					setActivePaymentDetails(undefined);
				})
			} else {
				console.log(error);
			}
		} catch (error) {
			console.log(error);
		}
	}

	const denyPayment = async (id: string | undefined) => {
		setIsPaymentConfirmSending(true);

		if (!id) {
			setIsPaymentConfirmSending(false);
			setShowPaymentConfirmModal(false);
			return;
		}

		try {
			const { error } = await supabase
				.from("payments")
				.update({
					status: "denied",
					confirmed_at: new Date().toISOString(),
				})
				.eq("id", id)

			if (!error) {
				interactionsChannel.send({
					type: "broadcast",
					event: "payment",
					payload: {
						type: "payment_denied",
						data: {
							id: id,
							sender_id: userData?.id,
							from: userData?.firstname,
						}
					}
				}).then(() => {
					setIsPaymentConfirmSending(false);
					setShowPaymentConfirmModal(false);
				})
			} else {
				console.log(error);
			}
		} catch (error) {
			console.log(error);
		}
	}

	const sendProductStatus = async () => {
		setIsProductSentSending(true);

		try {
			interactionsChannel.send({
				type: "broadcast",
				event: "product",
				payload: {
					type: "product_sent",
					data: {
						id: userData?.id,
						sender_id: userData?.id,
						from: userData?.firstname,
					}
				}
			}).then(() => {
				setHasSentProduct(true);
				setIsProductSentSending(false);
			});
		} catch (error) {
			console.log(error);
		}
	}

	const sendProductConfirmation = async () => {
		setIsProductConfirmSending(true);

		try {
			interactionsChannel.send({
				type: "broadcast",
				event: "product",
				payload: {
					type: "product_received",
					data: {
						id: userData?.id,
						sender_id: userData?.id,
						from: userData?.firstname,
					}
				}
			}).then(() => {
				setHasReceivedProduct(true);
				setIsProductConfirmSending(false);
			});
		} catch (error) {
			console.log(error);
		}
	}

	const finishTransaction = async () => {
		setIsTransactionFinishing(true);

		const interactionsOBJ = interactions?.filter(inter => inter.type !== "message").sort(
			(a, b) => a.timestamp.getTime() - b.timestamp.getTime()
		);

		if (userData && merchantData && interactionsOBJ) {
			// interactionsOBJ.unshift({
			// 	timestamp: new Date(Date.now()),
			// 	type: "transaction_started",
			// 	from: role === "merchant" ? merchantData.firstname : userData.firstname,
			// })

			interactionsOBJ.push({
				timestamp: new Date(Date.now()),
				type: totalTradedAmount > 0 ? "transaction_completed" : "transaction_cancelled",
				from: userData?.firstname,
			});

			const interactionsJSON = JSON.stringify(interactionsOBJ);

			const platforms = interactions?.filter(inter => inter.type === "payment_requested" && inter.data.status === "completed").map((inter) => {
				if (inter.type === "payment_requested") {
					return inter.data.platform;
				} else {
					return null;
				}
			}).filter((value, index, self) => self.indexOf(value) === index) as string[];

			if (totalTradedAmount !== undefined) {
				const { error } = await supabase
					.from("transactions")
					.update({
						total_amount: totalTradedAmount,
						status: totalTradedAmount > 0 ? "completed" : "cancelled",
						platforms: platforms,
						timeline: interactionsJSON,
					})
					.eq("id", roomID);

				if (!error) {
					interactionsChannel.send({
						type: "broadcast",
						event: "transaction",
						payload: {
							type: "transaction_completed",
							data: {
								id: userData?.id,
								from: userData?.firstname,
							}
						}
					}).then(() => {
						setIsTransactionFinishing(false);
					});
				} else {
					console.log(error);
				}
			}
		}
	}

	const submitRatings = async () => {
		setIsRatingSubmitting(true);

		if (userData && merchantData) {
			const { error } = await supabase
				.from("ratings")
				.insert({
					transaction_id: roomID,
					target_id: merchantData.id,
					target_name: merchantData.firstname,
					sender_id: userData.id,
					sender_name: userData.firstname,
					rating: ratings,
					tags: selectedTags,
					type: role === "client" ? "seller" : "buyer",
				});

			if (!error) {
				setIsRatingSubmitting(false);

				setQueue(prevQueue => {
					if (prevQueue) {
						return prevQueue.filter(req => req.sender_id !== merchantData?.id);
					} else {
						return [];
					}
				});

				ratingsModalRef.current?.close();
				router.navigate("/(transactionRoom)");
			} else {
				console.log("Ratings error: ", error);
			}
		}
	}

	const pickReceipt = async () => {
		const result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			base64: true,
			quality: 1,
		});

		if (result && result.assets && result.assets[0].uri) {
			setReceipt(result.assets[0]);
		}
	}

	const viewReceiptImage = (uri: string) => {
		setCurrentViewImage(uri);
		setShowViewImageModal(true);
	}

	const getRoomData = async () => {
		try {
			setActivePaymentDetails(undefined);

			if (userData) {
				interactionsChannel
					.on("broadcast", { event: "user" }, (payload) => {
						const payloadData = payload.payload;

						try {
							switch (payloadData.type) {
								case "join":
									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "user_joined",
										from: payloadData.from,
									}]);

									setConnectedUsers(prevConnectedUsers => {
										if (!prevConnectedUsers.includes(payloadData.from)) {
											return [...prevConnectedUsers, payloadData.from];
										} else {
											return prevConnectedUsers;
										}
									});

									break;
								case "left":
									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "user_left",
										sender_id: payloadData.sender_id,
										from: payloadData.from,
									}]);

									setConnectedUsers(prevConnectedUsers => {
										return prevConnectedUsers.filter(user => user !== payloadData.from);
									});

								default: break;
							}
						} catch (error) {
							console.log(error);
						}
					})
					.on("broadcast", { event: "message" }, (payload) => {
						const payloadData = payload.payload;

						try {
							setInteractions(curr => [...(curr || []), {
								timestamp: new Date(Date.now()),
								type: "message",
								sender_id: payloadData.data.sender_id,
								from: payloadData.data.from,
								data: {
									message: payloadData.data.message,
								},
							}]);
						} catch (error) {
							console.log(error);
						}
					})
					.on("broadcast", { event: "payment" }, (payload) => {
						const payloadData = payload.payload;

						try {
							switch (payloadData.type) {
								case "payment_requested":
									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "payment_requested",
										sender_id: payloadData.data.sender_id,
										from: payloadData.data.from,
										data: {
											id: payloadData.data.id,
											amount: payloadData.data.amount,
											currency: payloadData.data.currency,
											platform: payloadData.data.platform,
											accountName: payloadData.data.merchantName,
											accountNumber: payloadData.data.merchantNumber,
											status: "pending",
										},
									}]);

									break;
								case "payment_sent":
									setInteractions(curr => curr?.map(inter =>
										inter.type === "payment_requested" && inter.data.id === payloadData.data.id
											? { ...inter, data: { ...inter.data, status: "confirming" } }
											: inter
									));

									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "payment_sent",
										sender_id: payloadData.data.sender_id,
										from: payloadData.data.from,
										data: {
											id: payloadData.data.id,
											amount: payloadData.data.amount,
											currency: payloadData.data.currency,
											platform: payloadData.data.platform,
											receiptURL: payloadData.data.receiptURL,
											receiptPath: payloadData.data.receiptPath,
											status: "pending",
										},
									}]);

									break;
								case "payment_request_cancelled":

									setInteractions(curr => curr?.map(inter =>
										inter.type === "payment_requested" && inter.data.id === payloadData.data.id
											? { ...inter, data: { ...inter.data, status: "cancelled" } }
											: inter
									));

									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "payment_request_cancelled",
										sender_id: payloadData.data.sender_id,
										from: payloadData.data.from,
										data: {
											id: payloadData.data.id,
										},
									}]);

									break;
								case "payment_confirmed":
									setInteractions(curr => curr?.map(inter =>
										inter.type === "payment_sent" && inter.data.id === payloadData.data.id
											? { ...inter, data: { ...inter.data, status: "confirmed" } }
											: inter
									));

									setInteractions(curr => curr?.map(inter =>
										inter.type === "payment_requested" && inter.data.id === payloadData.data.id
											? { ...inter, data: { ...inter.data, status: "completed" } }
											: inter
									));

									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "payment_confirmed",
										sender_id: payloadData.data.sender_id,
										from: payloadData.data.from,
										data: {
											id: payloadData.data.id,
										},
									}]);

									setTotalTradedAmount(totalTradedAmount + payloadData.data.amount);

									break;

								case "payment_denied":
									setInteractions(curr => curr?.map(inter =>
										inter.type === "payment_sent" && inter.data.id === payloadData.data.id
											? { ...inter, data: { ...inter.data, status: "denied" } }
											: inter
									));

									setInteractions(curr => curr?.map(inter =>
										inter.type === "payment_requested" && inter.data.id === payloadData.data.id
											? { ...inter, data: { ...inter.data, status: "pending" } }
											: inter
									));

									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "payment_denied",
										sender_id: payloadData.data.sender_id,
										from: payloadData.data.from,
										data: {
											id: payloadData.data.id,
										},
									}]);

									break;
								default: break;

							}
						} catch (error) {
							console.log(error);
						}
					})
					.on("broadcast", { event: "product" }, async (payload) => {
						const payloadData = payload.payload;

						try {
							switch (payloadData.type) {
								case "product_sent":
									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "product_sent",
										sender_id: payloadData.data.sender_id,
										from: payloadData.data.from,
										data: {
											id: payloadData.data.id,
										},
									}]);

									break;
								case "product_received":
									setInteractions(curr => [...(curr || []), {
										timestamp: new Date(Date.now()),
										type: "product_received",
										sender_id: payloadData.data.sender_id,
										from: payloadData.data.from,
										data: {
											id: payloadData.data.id,
										},
									}]);

									break;
								default: break;
							}
						} catch (error) {
							console.log(error);
						}
					})
					.on("broadcast", { event: "transaction" }, async (payload) => {
						const payloadData = payload.payload;

						try {
							switch (payloadData.type) {
								case "transaction_completed":
									if (payloadData.data.id === userData?.id) {
										setShowFinishDialog(false);
										ratingsModalRef.current?.present();
									} else {
										setShowFinishConfirmationDialog(true);
									}

									break;
								case "transaction_started":
									break;
								case "transaction_cancelled":
									break;
								default: break;
							};
						} catch (error) {
							console.log(error);
						}
					})
					.subscribe(async (status) => {
						if (status === "SUBSCRIBED") {
							await interactionsChannel.track({ online_at: new Date().toISOString() });

							interactionsChannel.send({
								type: "broadcast",
								event: "user",
								payload: {
									from: userData.firstname,
									type: "join"
								}
							});

							setConnectedUsers(prevConnectedUsers => {
								if (!prevConnectedUsers.includes(userData.firstname)) {
									return [...prevConnectedUsers, userData.firstname];
								} else {
									return prevConnectedUsers;
								}
							});
						}
					});
			}
		} catch (err) {
			console.log(err);
		}
	}

	useEffect(() => {
		getRoomData();
		setInteractions([]);
		setReceipt(undefined);

		setHasSentProduct(false);
		setHasReceivedProduct(false);

		return () => {
			if (connectedUsers?.length < 2) {
				interactionsChannel.unsubscribe();
				// supabase.removeChannel(interactionsChannel);

				setInteractions([])
			}

			interactionsChannel.send({
				type: "broadcast",
				event: "user",
				payload: {
					sender_id: userData?.id,
					from: userData?.firstname,
					type: "left"
				}
			}).then(() => {
				interactionsChannel.unsubscribe();
			});
		}
	}, []);

	useLayoutEffect(() => {
		navigation.setOptions({
			header: () => (
				<View
					className="flex flex-row w-full px-4 items-center justify-between"
					style={styles.headerStyle}
				>
					<UserCard
						idStyle={{ width: "50%" }}
						name={merchantData?.firstname || "N/A"}
						id={merchantData?.id || "123123"}
					/>
					<View className="flex flex-row space-x-2 items-center">
						<Button
							className="rounded-lg"
							onPress={() => setShowFinishDialog(true)}
						>
							<View className="flex flex-row space-x-2 items-center">
								<MaterialCommunityIcons name="check-all" size={20} color={"white"} />
								<Text buttonSmall white>Finish</Text>
							</View>
						</Button>
						{/* <IconButton
							icon="dots-vertical"
							onPress={() => console.log("Dots Pressed")}
						/> */}
					</View>
				</View>
			)
		})
	}, [])

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

	const styles = StyleSheet.create({
		headerStyle: {
			backgroundColor: Colors.bgDefault,
			paddingTop: insets.top + 4,
			paddingBottom: 4,

			...Platform.select({
				ios: {
					shadowColor: '#000',
					shadowOffset: { width: 0, height: 2 },
					shadowOpacity: 0.2,
					shadowRadius: 4,
				},
				android: {
					elevation: 4,
				},
			}),
		}
	})

	return (
		<SafeAreaView className="flex flex-col w-full h-full px-2 pb-2 items-start justify-start">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={100}
				className="flex w-full h-full space-y-2"
			>
				{interactions ?
					<FlatList
						className="w-full"
						data={interactions.sort(
							(a, b) => b.timestamp.getTime() - a.timestamp.getTime()
						)}
						inverted={true}
						keyExtractor={(item, index) => index.toString()}
						contentContainerStyle={{ flexGrow: 1 }}
						renderItem={({ item: inter }) => {
							switch (inter.type) {
								case "message":
									return (
										<View className="flex flex-row space-x-3 items-center justify-start">
											<Avatar.Text label={getInitials(inter.from)} size={35} />
											<View className="flex flex-col space-y-1 items-start justify-start">
												<Text
													bodyLarge
													className="w-full font-bold"
												>
													{inter.from}
												</Text>
												<Text
													body
													className="w-full text-pretty"
												>
													{inter.data.message}
												</Text>
												<Text caption className="text-slate-400">
													{inter.timestamp.toLocaleString()}
												</Text>
											</View>
										</View>
									)
								case "payment_requested":
									return (
										<View key={inter.timestamp.getTime()} className="mb-2 space-y-2">
											<EventChip type={inter.type} from={inter.from} />
											<PaymentRequestCard
												style={{ backgroundColor: theme.colors.background }}
												userData={userData}
												timestamp={inter.timestamp}
												sender_id={inter.sender_id}
												from={inter.from}
												amount={inter.data.amount}
												platform={inter.data.platform}
												currency={inter.data.currency}
												status={inter.data.status}
												onPayment={() => {
													setPaymentDetails({
														id: inter.data.id,
														amount: inter.data.amount,
														currency: inter.data.currency,
														platform: inter.data.platform,
														accountName: inter.data.accountName,
														accountNumber: inter.data.accountNumber,
													});

													setShowPaymentModal(true);
												}}
											/>
										</View>
									)
								case "payment_sent":
									return (
										<View key={inter.timestamp.getTime()} className="mb-2 space-y-2">
											<EventChip type={inter.type} from={inter.from} />
											<PaymentSentCard
												style={{ backgroundColor: theme.colors.background }}
												id={inter.data.id}
												userData={userData}
												timestamp={inter.timestamp}
												sender_id={inter.sender_id}
												from={inter.from}
												platform={inter.data.platform}
												status={inter.data.status}
												receiptURL={inter.data.receiptURL}
												onConfirm={() => setShowPaymentConfirmModal(true)}
												onViewImage={() => viewReceiptImage(inter.data.receiptURL)}
											/>
										</View>
									)


								default:
									return (
										<View key={inter.timestamp.getTime()} className="mb-2 space-y-2">
											<EventChip type={inter.type} from={inter.from} />
										</View>
									)

							}
						}}
					/>
					: null}
				{interactions && !hasSentProduct &&
					interactions.some(inter => inter.type === "payment_confirmed" && inter.sender_id === userData?.id) && (
						<ExpandableSection
							expanded={showProductSentSection}
							onPress={() => setShowProductSentSection(true)}
							sectionHeader={
								<View className="flex w-full p-2">
									<Text gray900 className="font-bold">Have you sent the buyer the purchased product?</Text>
								</View>
							}
						>
							<View className="flex flex-col w-full space-y-2">
								{!isProductSentSending ?
									<Button
										className="flex-1 rounded-lg"
										disabled={isProductSentSending}
										onPress={() => sendProductStatus()}
									>
										<View className="flex flex-row space-x-2 items-center">
											<MaterialCommunityIcons name="check" size={20} color={"white"} />
											<Text buttonSmall white>Yes</Text>
										</View>
									</Button>
									:
									<Button
										className="rounded-lg flex-1"
										disabled={isProductSentSending}
										onPress={() => { }}
									>
										<View className="flex flex-row space-x-2 items-center">
											<ActivityIndicator animating={true} size={20} color="white" />
											<Text buttonSmall white>Processing...</Text>
										</View>
									</Button>
								}

								<Button
									className="rounded-lg"
									style={{ backgroundColor: Colors.gray50 }}
									outline={true}
									outlineColor={Colors.gray900}
									onPress={() => setShowProductSentSection(false)}
								>
									<Text buttonSmall gray900>Not yet</Text>
								</Button>
							</View>
						</ExpandableSection>
					)}
				{interactions && !hasReceivedProduct &&
					interactions.some(inter => inter.type === "product_sent" && inter.sender_id === merchantData?.id) && (
						<ExpandableSection
							expanded={showProductReceivedSection}
							onPress={() => setShowProductReceivedSection(true)}
							sectionHeader={
								<View className="flex w-full p-2">
									<Text gray900 className="font-bold">Have you received the purchased product?</Text>
								</View>
							}
						>
							<View className="flex flex-col w-full space-y-2">
								{!isProductConfirmSending ?
									<Button
										className="flex-1 rounded-lg"
										onPress={() => sendProductConfirmation()}
									>
										<View className="flex flex-row space-x-2 items-center">
											<MaterialCommunityIcons name="check" size={20} color={"white"} />
											<Text buttonSmall white>Yes</Text>
										</View>
									</Button>
									:
									<Button
										className="rounded-lg flex-1"
										disabled={isProductConfirmSending}
										onPress={() => { }}
									>
										<View className="flex flex-row space-x-2 items-center">
											<ActivityIndicator animating={true} size={20} color="white" />
											<Text buttonSmall white>Processing...</Text>
										</View>
									</Button>
								}

								<Button
									className="rounded-lg"
									style={{ backgroundColor: Colors.gray50 }}
									outline={true}
									outlineColor={Colors.gray900}
									onPress={() => setShowProductReceivedSection(false)}
								>
									<Text buttonSmall gray900>Not yet</Text>
								</Button>
							</View>
						</ExpandableSection>
					)}
				<View className="flex flex-row w-full space-x-2 items-center">
					<TextInput
						className="grow rounded-lg overflow-scroll"
						label="Message"
						value={message}
						onChangeText={text => setMessage(text)}
						onSubmitEditing={() => sendMessage(message, userData?.firstname || "N/A")}
						multiline
						dense
					/>
					<Button
						className="rounded-full"
						backgroundColor={Colors.primary700}
						disabled={!message && isMessageSending}
						round={true}
						onPress={() => sendMessage(message, userData?.firstname || "N/A")}
					>
						<MaterialCommunityIcons name="send" size={20} color={"white"} />
					</Button>
					<Button
						className="rounded-full"
						backgroundColor={Colors.primary700}
						round={true}
						onPress={() => setShowActionsMenu(true)}
					>
						<MaterialCommunityIcons name="information" size={20} color={"white"} />
					</Button>
					<ActionSheet
						visible={showActionsMenu}
						title="Select Transaction Action"
						onDismiss={() => setShowActionsMenu(false)}
						onModalDismissed={() => {
							if (isRequestOptionClicked) {
								setIsRequestOptionClicked(false);
								setShowRequestModal(true);
							}
						}}
						options={[
							{
								label: activePaymentDetails?.id ? "Cancel Payment Request" : "Send Payment Request", 
								onPress: () => {
									if (activePaymentDetails) {
										cancelPaymentRequest(activePaymentDetails.id)
									} else {
										setShowActionsMenu(false);

										if (Platform.OS === "ios") {
											setIsRequestOptionClicked(true);
										} else {
											setShowRequestModal(true);
										}
									}
								}
							},
							// { label: "Show Payment Confirmation", onPress: () => { }, disabled: true },
							// { label: "Show Product Confirmation", onPress: () => { }, disabled: true },
						]}
						renderAction={(option, index, onOptionPress) => (
							<View
								key={index}
								className="w-full"
							>
								<Button
									className="w-full p-4"
									backgroundColor={Colors.bgDefault}
									fullWidth={true}
									disabled={option.disabled}
									disabledBackgroundColor={Colors.gray100}
									onPress={() => onOptionPress(index)}
								>
									<View className="flex flex-row w-full space-x-2 items-center">
										{index === 0 &&
											<MaterialCommunityIcons name={activePaymentDetails ? "cash-remove" : "cash-fast"} size={20} color={Colors.primary700} />
										}
										{index === 1 &&
											<MaterialCommunityIcons name="cash-check" size={20} color={option.disabled ? Colors.gray200 : Colors.primary700} />
										}
										{index === 2 &&
											<MaterialCommunityIcons name="truck-check" size={20} color={option.disabled ? Colors.gray200 : Colors.primary700} />
										}
										<Text
											body
											className="font-bold"
											color={option.disabled ? Colors.gray200 : Colors.gray900}
										>
											{option.label}
										</Text>
									</View>
								</Button>
							</View>
						)}
					/>
				</View>
				<BottomSheetModal
					ref={ratingsModalRef}
					index={0}
					snapPoints={["60%"]}
					enablePanDownToClose={true}
					backdropComponent={renderBackdrop}
				>
					<BottomSheetView>
						<View className="flex flex-col w-full px-4 space-y-2">
							<Text h3>Rate your Experience</Text>
							<Text body>How was your transaction with <Text className="font-bold">{merchantData?.firstname}</Text></Text>
							<Divider />
							<View className="flex flex-row space-x-4 items-center justify-center">
								<IconButton
									icon="thumb-up-outline"
									iconColor={ratings === "UP" ? "#22c55e" : "gray"}
									style={{ borderColor: ratings === "UP" ? "#22c55e" : "gray" }}
									size={30}
									mode="outlined"
									onPress={() => {
										setRatings("UP");
										setSelectedTags([]);
									}}
								/>
								<IconButton
									icon="thumb-down-outline"
									iconColor={ratings === "DOWN" ? "#ef4444" : "gray"}
									style={{ borderColor: ratings === "DOWN" ? "#ef4444" : "gray" }}
									size={30}
									mode="outlined"
									onPress={() => {
										setRatings("DOWN");
										setSelectedTags([]);
									}}
								/>
							</View>
							<Text bodyLarge className="font-bold">Select tags that describe your experience:</Text>
							<View className="flex flex-row items-center space-x-1 space-y-1 flex-wrap">
								{ratings === "UP" ?
									PositiveTags.filter((tag) => {
										const tagType = role === "client" ? "seller" : "buyer";
										return tag.type === tagType;
									}).map((tag, i) => (
										<Chip
											key={i}
											compact={true}
											selected={selectedTags.includes(tag.label) ? true : false}
											selectedColor={selectedTags.includes(tag.label) ? "#22c55e" : "black"}
											showSelectedCheck={false}
											style={{ backgroundColor: selectedTags.includes(tag.label) ? "#bbf7d0" : "#e2e8f0" }}
											onPress={() => setSelectedTags(prev =>
												prev.includes(tag.label) ? prev.filter(t => t !== tag.label) : [...prev, tag.label]
											)}
										>
											{tag.label}
										</Chip>
									))
									:
									NegativeTags.filter((tag) => {
										const tagType = role === "client" ? "seller" : "buyer";
										return tag.type === tagType;
									}).map((tag, i) => (
										<Chip
											key={i}
											compact={true}
											selected={selectedTags.includes(tag.label) ? true : false}
											selectedColor={selectedTags.includes(tag.label) ? "#ef4444" : "black"}
											showSelectedCheck={false}
											style={{ backgroundColor: selectedTags.includes(tag.label) ? "#fecaca" : "#e2e8f0" }}
											onPress={() => setSelectedTags(prev =>
												prev.includes(tag.label) ? prev.filter(t => t !== tag.label) : [...prev, tag.label]
											)}
										>
											{tag.label}
										</Chip>
									))
								}
							</View>
							<Divider />
							<Button
								className="rounded-lg w-full"
								onPress={() => submitRatings()}
								disabled={selectedTags.length !== 0 ? false : true || isRatingSubmitting}
							>
								{!isRatingSubmitting ?
									<View className="flex flex-row space-x-2 items-center">
										<MaterialCommunityIcons name="send" size={20} color={"white"} />
										<Text buttonSmall white>Submit Rating</Text>
									</View>
									:
									<View className="flex flex-row space-x-2 items-center">
										<ActivityIndicator animating={true} size={20} color="white" />
										<Text buttonSmall white>Submitting...</Text>
									</View>
								}
							</Button>
						</View>
					</BottomSheetView>
				</BottomSheetModal>
				<Dialog
					visible={showRequestModal}
					panDirection="up"
					onDismiss={() => setShowRequestModal(false)}
					containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, padding: 4 }}
				>
					<RequestPaymentRoute
						disabled={isPaymentRequestSending}
						dropdownStyle={{ borderWidth: 0.5, borderRadius: 8, padding: 10, backgroundColor: theme.colors.primaryContainer }}
						requestDetails={requestDetails}
						setRequestDetails={setRequestDetails}
						sendPaymentRequest={sendPaymentRequest}
						cancel={() => setShowRequestModal(false)}
					/>
				</Dialog>
				<Dialog
					visible={showPaymentModal}
					onDismiss={() => setShowPaymentModal(false)}
					panDirection="up"
					containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, padding: 4 }}
				>
					<SendPaymentRoute
						disabled={isPaymentSending}
						paymentDetails={paymentDetails}
						receipt={receipt}
						setReceipt={setReceipt}
						pickReceipt={pickReceipt}
						sendPayment={() => sendPayment(paymentDetails.id)}
						cancel={() => setShowPaymentModal(false)}
					/>
				</Dialog>
				<Dialog
					visible={showViewImageModal}
					onDismiss={() => setShowViewImageModal(false)}
					panDirection="up"
					width={dimensions.width}
					height={dimensions.height}
					containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8 }}
				>
					<TouchableOpacity onPress={() => setShowViewImageModal(false)}>
						<Image
							className="w-full h-full"
							source={{ uri: currentViewImage }}
							resizeMode="contain"
							overlayType={Image.overlayTypes.BOTTOM}
							customOverlayContent={(
								<View className="flex flex-row w-full h-full items-end justify-center">
									<View
										className="mb-4 p-2"
									>
										<Text bodySmall bgDefault className="font-bold">Tap on Image to Close</Text>
									</View>
								</View>
							)}
						/>
					</TouchableOpacity>
				</Dialog>
				<Dialog
					visible={showFinishDialog}
					onDismiss={() => setShowFinishDialog(false)}
					panDirection="up"
					containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, borderBottomWidth: 8, borderBottomColor: Colors.error400, padding: 4 }}
				>
					<View
						className="flex flex-col w-full p-4 space-y-4"
					>
						<Text h3>Warning</Text>
						{totalTradedAmount && totalTradedAmount > 0 ?
							<Text body>Are you sure you want to finish the transaction? This action cannot be undone.</Text>
							:
							<Text body>Are you sure you want to cancel the transaction? This action cannot be undone.</Text>
						}
						<View className="flex flex-row w-full items-center justify-end space-x-2">
							<Button
								className="rounded-lg"
								style={{ backgroundColor: Colors.gray50 }}
								outline={true}
								outlineColor={Colors.gray900}
								onPress={() => setShowFinishDialog(false)}
							>
								<Text buttonSmall gray900>Cancel</Text>
							</Button>
							<Button
								className="rounded-lg"
								onPress={() => finishTransaction()}
								disabled={isTransactionFinishing}
							>
								{!isTransactionFinishing ?
									<View className="flex flex-row space-x-2 items-center">
										<MaterialCommunityIcons name="check" size={20} color={"white"} />
										{totalTradedAmount && totalTradedAmount > 0 ?
											<Text buttonSmall white>Finish</Text>
											:
											<Text buttonSmall white>Proceed</Text>
										}
									</View>
									:
									<ActivityIndicator animating={true} color="gray" />
								}
							</Button>
						</View>
					</View>
				</Dialog>
				<Dialog
					visible={showFinishConfirmationDialog}
					onDismiss={() => setShowFinishConfirmationDialog(false)}
					panDirection="up"
					containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, borderBottomWidth: 8, borderBottomColor: Colors.error400, padding: 4 }}
				>
					<View
						className="flex flex-col w-full p-4 space-y-4"
					>
						<Text h3>Notice</Text>
						{totalTradedAmount && totalTradedAmount > 0 ?
							<Text body>{merchantData?.firstname} has ended the transaction.</Text>
							:
							<Text body>{merchantData?.firstname} has cancelled the transaction.</Text>
						}
						<View className="flex flex-row w-full items-center justify-end space-x-2">
							<Button
								className="rounded-lg"
								onPress={() => {
									setShowFinishConfirmationDialog(false);
									ratingsModalRef.current?.present();
								}}
							>
								<View className="flex flex-row space-x-2 items-center">
									<MaterialCommunityIcons name="thumb-up-outline" size={20} color={"white"} />
									<Text buttonSmall white>Got it</Text>
								</View>
							</Button>
						</View>
					</View>
				</Dialog>
				<Dialog
					visible={showPaymentConfirmModal}
					onDismiss={() => setShowPaymentConfirmModal(false)}
					panDirection="up"
					containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, borderBottomWidth: 8, borderBottomColor: Colors.primary700, padding: 4 }}
				>
					<View
						className="flex flex-col w-full p-4 space-y-4"
					>
						<Text h3>Confirm Payment?</Text>
						<Text body>Have you received the payment of
							<Text className="font-bold"> {activePaymentDetails?.currency} {activePaymentDetails?.amount} </Text>
							?
						</Text>
						<View className="flex flex-col w-full space-y-2">
							{!isPaymentConfirmSending ?
								<View className="flex flex-row w-full items-center justify-center space-x-2">
									<Button
										className="rounded-lg flex-1"
										disabled={isPaymentConfirmSending}
										onPress={() => confirmPayment(activePaymentDetails?.id)}
									>
										<View className="flex flex-row space-x-2 items-center">
											<MaterialCommunityIcons name="thumb-up-outline" size={20} color={"white"} />
											<Text buttonSmall white>Yes, I have</Text>
										</View>
									</Button>
									<Button
										className="rounded-lg flex-1"
										disabled={isPaymentConfirmSending}
										onPress={() => denyPayment(activePaymentDetails?.id)}
									>
										<View className="flex flex-row space-x-2 items-center">
											<MaterialCommunityIcons name="thumb-down-outline" size={20} color={"white"} />
											<Text buttonSmall white>No, I haven't</Text>
										</View>
									</Button>
								</View>
								:
								<Button
									className="rounded-lg flex-1"
									disabled={isPaymentConfirmSending}
									onPress={() => { }}
								>
									<View className="flex flex-row space-x-2 items-center">
										<ActivityIndicator animating={true} size={20} color="white" />
										<Text buttonSmall white>Processing...</Text>
									</View>
								</Button>
							}
							<Button
								className="rounded-lg"
								style={{ backgroundColor: Colors.gray50 }}
								outline={true}
								outlineColor={Colors.gray900}
								onPress={() => setShowPaymentConfirmModal(false)}
							>
								<Text buttonSmall gray900>I'll wait a little more</Text>
							</Button>
						</View>
					</View>
				</Dialog>
			</KeyboardAvoidingView>
		</SafeAreaView >
	);
}