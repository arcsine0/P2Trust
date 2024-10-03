import { useState, useEffect, useRef, useContext } from "react";
import { View, ScrollView } from "react-native";
import { useTheme, Text, Avatar, Chip, Icon, IconButton, Card, Button, TouchableRipple, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { router, useFocusEffect } from "expo-router";

import { BottomSheetModal, BottomSheetView, BottomSheetScrollView } from "@gorhom/bottom-sheet";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";

import { Request } from "@/lib/helpers/types";
import { getInitials } from "@/lib/helpers/functions";

import QRCode from "react-qr-code";

export default function TransactionHomeScreen() {
    const [showBadge, setShowBadge] = useState(false);

    const { userData, requests, setRequests, queue, setQueue } = useUserData();
    const { setMerchantData, setRole } = useMerchantData();

    const [joinRoomLoading, setJoinRoomLoading] = useState<boolean>(false);

    const theme = useTheme();
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

        return () => {
            // requestChannel.unsubscribe();
        };
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-2 px-4 items-start justify-start">
            {userData ?
                <View className="flex flex-col w-full h-full items-center justify-start">
                    <Card className="w-full mb-2" style={{ backgroundColor: theme.colors.background }}>
                        <Card.Content className="flex flex-row w-full justify-between items-center">
                            <View className="flex flex-row items-center gap-5">
                                <Avatar.Text label={getInitials(userData.username)} size={35} />
                                <View className="flex">
                                    <Text variant="titleLarge" className="font-bold">{userData.username}</Text>
                                    <Text variant="titleSmall" className="font-semibold">{userData.id}</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                    <Card className="w-full mb-2" style={{ backgroundColor: theme.colors.background }}>
                        <Card.Content className="flex flex-col gap-3">
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
                            <Button
                                icon={"qrcode-scan"}
                                mode="contained"
                                onPress={() => router.navigate("/(transactionRoom)/scan")}
                            >
                                Scan QR Code
                            </Button>
                        </Card.Content>
                    </Card>
                    <View className="w-full flex flex-row gap-1 items-center justify-center">
                        <TouchableRipple
                            className="flex p-4 items-center justify-center rounded-lg"
                            style={{ backgroundColor: showBadge ? theme.colors.primary + "4D" : theme.colors.primary }}
                            onPress={() => {
                                requestsModalRef.current?.present();
                                setShowBadge(false);
                            }}
                        >
                            <View>
                                <Icon
                                    source="bell"
                                    color={theme.colors.background}
                                    size={25}
                                />
                            </View>
                        </TouchableRipple>
                        <TouchableRipple
                            className="flex flex-col p-2 items-center justify-center rounded-lg shadows-md grow"
                            style={{ backgroundColor: theme.colors.primary, opacity: queue && queue.length > 0 ? 1 : 0.75 }}
                            disabled={!joinRoomLoading && queue && queue.length > 0 ? false : true}
                            onPress={() => createRoom()}
                        >
                            <View className="flex flex-row w-full items-center justify-stretch">
                                {!joinRoomLoading ?
                                    <View className="flex flex-col gap-0 items-start justify-center">
                                        <Text
                                            variant="bodySmall"
                                            style={{ color: theme.colors.background, padding: 0 }}
                                        >
                                            Next Client
                                        </Text>
                                        <Text
                                            variant="titleMedium"
                                            style={{ color: theme.colors.background, padding: 0 }}
                                        >
                                            {queue && queue.length > 0 ?
                                                queue.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0].sender_name
                                                :
                                                "None"
                                            }
                                        </Text>
                                    </View>
                                    :
                                    <View className="flex flex-row space-x-2 items-center">
                                        <ActivityIndicator animating={true} color="gray" />
                                        <Text variant="bodyMedium" className="font-bold text-white">Creating the room...</Text>
                                    </View>
                                }

                            </View>
                        </TouchableRipple>
                        <BottomSheetModal
                            ref={requestsModalRef}
                            index={0}
                            snapPoints={["45%"]}
                            enablePanDownToClose={true}
                        >
                            <BottomSheetView>
                                <View className="flex flex-col w-full p-2 gap-2 items-start justify-start">
                                    <Text variant="titleLarge" className="font-bold">Invite Requests</Text>
                                    {requests && requests.length > 0 ?
                                        <ScrollView>
                                            {requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).map((req, i) => (
                                                <Card key={i} className="rounded-lg">
                                                    <Card.Content className="flex flex-row w-full justify-between items-center">
                                                        <View className="flex flex-row items-center gap-5">
                                                            <Avatar.Text label={getInitials(req.sender_name)} size={35} />
                                                            <Text variant="titleLarge" className="font-bold">{req.sender_name}</Text>
                                                        </View>
                                                        <View className="flex flex-row items-center justify-center">
                                                            <IconButton
                                                                icon="check"
                                                                mode="contained"
                                                                iconColor={theme.colors.primary}
                                                                size={20}
                                                                onPress={() => acceptRequest(req.sender_id)}
                                                            />
                                                            <IconButton
                                                                icon="trash-can"
                                                                mode="contained"
                                                                iconColor={theme.colors.primary}
                                                                size={20}
                                                                onPress={() => rejectRequest(req.sender_id)}
                                                            />
                                                        </View>
                                                    </Card.Content>
                                                </Card>
                                            ))}
                                        </ScrollView>
                                        :
                                        <Chip>No Invite Requests</Chip>
                                    }
                                </View>
                            </BottomSheetView>
                        </BottomSheetModal>
                    </View>
                </View>
                : null}
        </SafeAreaView>
    );
}