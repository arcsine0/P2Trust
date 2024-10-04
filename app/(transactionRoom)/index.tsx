import { useState, useEffect, useRef } from "react";
import { ScrollView } from "react-native";
import { useTheme, Avatar, IconButton, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, View, Text, Card, Button, Chip, Picker } from "react-native-ui-lib";

import { router, useNavigation } from "expo-router";

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";

import * as ImagePicker from "expo-image-picker";
import { scanFromURLAsync } from "expo-camera";

import { Request } from "@/lib/helpers/types";
import { getInitials } from "@/lib/helpers/functions";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import QRCode from "react-qr-code";

export default function TransactionHomeScreen() {
    const [showBadge, setShowBadge] = useState(false);

    const [QRError, setQRError] = useState<string>("");

    const { userData, requests, setRequests, queue, setQueue } = useUserData();
    const { setMerchantData, setRole } = useMerchantData();

    const [joinRoomLoading, setJoinRoomLoading] = useState<boolean>(false);

    const theme = useTheme();
    const navigation = useNavigation();

    const requestsModalRef = useRef<BottomSheetModal>(null);

    const requestsChannel = supabase.channel(`requests_channel_${userData?.id}`);

    const acceptRequest = async (sender: string) => {
        if (requests) {
            console.log("Accepting request of", sender);

            requestsChannel.send({
                type: "broadcast",
                event: "queued",
                payload: {
                    sender_id: sender,
                }
            });

            const acceptedRequest = requests.find(req => req.sender_id === sender);

            if (acceptedRequest) {
                setQueue(prevQueue => {
                    if (prevQueue) {
                        return [acceptedRequest, ...prevQueue.filter(req => req.sender_id !== sender)];
                    } else {
                        return [acceptedRequest];
                    }
                });

                setRequests(prevRequests => {
                    if (prevRequests) {
                        return prevRequests.filter(req => req.sender_id !== sender)
                    } else {
                        return [];
                    }
                });
            }
        }

    }

    const rejectRequest = async (sender: string) => {
        console.log("Rejecting request of", sender);

        requestsChannel.send({
            type: "broadcast",
            event: "rejected",
            payload: {
                sender_id: sender,
            }
        });

        setRequests([...requests?.filter(req => req.sender_id !== sender) as Request[]]);
    }

    const createRoom = async () => {
        if (requests && queue && userData) {
            setJoinRoomLoading(true);

            const currentRequest = queue.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];

            const { data: merchantData, error: merchantError } = await supabase
                .from("accounts")
                .select("*")
                .eq("id", currentRequest.sender_id);

            if (!merchantError && merchantData) {
                setMerchantData(merchantData[0]);

                const { data: transactionData, error: transactionError } = await supabase
                    .from("transactions")
                    .insert({
                        merchantID: userData.id,
                        merchantName: userData.username,
                        clientID: currentRequest.sender_id,
                        clientName: currentRequest.sender_name,
                    })
                    .select()

                if (!transactionError && transactionData) {
                    requestsChannel.send({
                        type: "broadcast",
                        event: "accepted",
                        payload: {
                            sender_id: currentRequest.sender_id,
                            room_id: transactionData[0].id,
                        }
                    }).then(async () => {
                        setRole("merchant");
                        setJoinRoomLoading(false);

                        router.navigate(`/(transactionRoom)/room/${transactionData[0].id}`);
                    });
                } else {
                    console.log("Transaction Error: ", transactionError);
                }
            }
        }
    }

    const loadMerchantData = async (qrValue: string) => {
        try {
            const qrData = JSON.parse(qrValue);

            try {
                if (qrData.auth === "P2Trust") {
                    const { data, error } = await supabase
                        .from("accounts")
                        .select("id")
                        .eq("id", qrData.id);

                    if (!error) {
                        router.navigate(`/(transactionRoom)/merchant/${qrData.id}`)
                    } else {
                        setQRError("Account of QR Code does not exist");
                    }
                } else {
                    setQRError("Invalid QR Code");
                }
            } catch (error) {
                setQRError("Invalid QR Code");
            }
        } catch (error) {
            setQRError("Scanned Image has no data");
        }
    }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            // allowsEditing: true,
            quality: 1,
        });

        if (result && result.assets && result.assets[0].uri) {
            try {
                const scannedResults = await scanFromURLAsync(result.assets[0].uri);

                if (scannedResults) {
                    loadMerchantData(scannedResults[0].data);
                } else {
                    setQRError("No QR found in image");
                }
            } catch (error) {
                setQRError("No QR found in image");
            }
        }
    }

    useEffect(() => {
        requestsChannel
            .on("broadcast", { event: "request" }, (payload) => {
                const payloadData = payload.payload;

                if (requests) {
                    setRequests([...requests?.filter(req => req.sender_id !== payload.data.sender_id) as Request[], payloadData])
                } else {
                    setRequests([payloadData]);
                }

                setShowBadge(true);
            })
            .subscribe();

        navigation.setOptions({
            headerRight: () => (
                <View className="flex flex-row">
                    <IconButton
                        icon="account-plus-outline"
                        onPress={() => {
                            requestsModalRef.current?.present();
                            setShowBadge(false);
                        }}
                    />
                    <IconButton
                        icon="dots-vertical"
                        onPress={() => console.log("Dots Pressed")}
                    />
                </View>
            )
        });

        return () => {
            // requestChannel.unsubscribe();
        };
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-full h-full pb-2 items-start justify-start">
            {userData ?
                <View className="flex flex-col w-full h-full px-4 space-y-2 items-center justify-between">
                    <View className="flex flex-col flex-1 w-full space-y-2 items-center justify-center">
                        <Card
                            style={{ backgroundColor: Colors.bgDefault }}
                            className="flex flex-col w-full p-4 space-y-2"
                            elevation={10}
                        >
                            <View className="flex justify-center items-center border-2 rounded-lg p-5">
                                <QRCode
                                    size={256}
                                    className="h-auto w-full"
                                    value={JSON.stringify({
                                        auth: "P2Trust",
                                        id: userData.id
                                    })}
                                />
                            </View>
                            <Text bodySmall gray400 className="text-center">Share this QR code to start a transaction as a merchant</Text>
                        </Card>
                        {queue && queue.length > 0 ?
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-row w-full p-4 items-center justify-between"
                                elevation={10}
                            >
                                <Text body className="font-bold">Current Client</Text>
                                <View className="flex flex-row space-x-2 items-center justify-start">
                                    <Avatar.Text label={getInitials(queue.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0].sender_name)} size={20} />
                                    <Text bodySmall className="font-semibold">{queue.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0].sender_name}</Text>
                                </View>
                            </Card>
                            :
                            null
                        }
                    </View>
                    <View className="flex flex-col w-full space-y-2">
                        <View className="flex flex-row space-x-2 items-center">
                            <Button
                                className="flex-1 rounded-lg"
                                style={{ backgroundColor: Colors.gray50 }}
                                outline={true}
                                outlineColor={Colors.gray900}
                                onPress={() => router.navigate("/(transactionRoom)/scan")}
                            >
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="qrcode-scan" size={20} color={"black"} />
                                    <Text buttonSmall black>Scan QR Code</Text>
                                </View>
                            </Button>
                            <Button
                                className="flex-1 rounded-lg"
                                style={{ backgroundColor: Colors.gray50 }}
                                outline={true}
                                outlineColor={Colors.gray900}
                                onPress={() => pickImage()}
                            >
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="file-upload" size={20} color={"black"} />
                                    <Text buttonSmall black>Upload QR</Text>
                                </View>
                            </Button>
                        </View>
                        <Button
                            className="rounded-lg"
                            disabled={!joinRoomLoading && queue && queue.length > 0 ? false : true}
                            onPress={() => createRoom()}
                        >
                            {!joinRoomLoading ?
                                <View className="flex flex-row space-x-2 items-center">
                                    <Text buttonSmall white>Start Transaction</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color={"white"} />
                                </View>
                                :
                                <View className="flex flex-row space-x-2 items-center">
                                    <ActivityIndicator animating={true} size={20} color="white" />
                                    <Text buttonSmall white>Joining Room...</Text>
                                </View>
                            }
                        </Button>
                    </View>
                    <BottomSheetModal
                        ref={requestsModalRef}
                        index={0}
                        snapPoints={["45%"]}
                        enablePanDownToClose={true}
                    >
                        <BottomSheetView>
                            <View className="flex flex-col w-full px-4 py-2 space-y-2 items-start justify-start">
                                <Text h3>Invite Requests</Text>
                                {requests && requests.length > 0 ?
                                    <ScrollView>
                                        <View className="flex flex-col w-full space-y-2 ">
                                            {requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).map((req, i) => (
                                                <Card key={i}
                                                    style={{ backgroundColor: Colors.bgDefault }}
                                                    className="flex flex-row w-full p-4 justify-between items-center"
                                                    elevation={10}
                                                >
                                                    <View className="flex flex-row items-center space-x-3">
                                                        <Avatar.Text label={getInitials(req.sender_name)} size={35} />
                                                        <Text bodyLarge className="font-bold">{req.sender_name}</Text>
                                                    </View>
                                                    <View className="flex flex-row items-center justify-center">
                                                        <IconButton
                                                            icon="check"
                                                            mode="contained"
                                                            iconColor={Colors.primary700}
                                                            size={20}
                                                            onPress={() => acceptRequest(req.sender_id)}
                                                        />
                                                        <IconButton
                                                            icon="trash-can"
                                                            mode="contained"
                                                            iconColor={Colors.primary700}
                                                            size={20}
                                                            onPress={() => rejectRequest(req.sender_id)}
                                                        />
                                                    </View>
                                                </Card>
                                            ))}
                                        </View>
                                    </ScrollView>
                                    :
                                    <View
                                        style={{ backgroundColor: Colors.gray200 }}
                                        className="flex flex-col w-full px-10 py-20 space-y-1 items-center justify-center rounded-lg"
                                    >
                                        <Text bodyLarge black className="font-semibold">No Invite Requests</Text>
                                        <Text bodySmall black className="text-center">Ask clients to scan your QR and start transaction</Text>
                                    </View>
                                }
                            </View>
                        </BottomSheetView>
                    </BottomSheetModal>
                </View>
                : null}
        </SafeAreaView>
    );
}