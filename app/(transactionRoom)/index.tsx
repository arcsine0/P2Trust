import { useState, useEffect, useRef, useContext } from "react";
import { ScrollView } from "react-native";
import { useTheme, Avatar, Icon, IconButton, TouchableRipple, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { Colors, View, Text, Card, Button, Chip } from "react-native-ui-lib";

import { router, useNavigation } from "expo-router";

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";

import { Request } from "@/lib/helpers/types";
import { getInitials } from "@/lib/helpers/functions";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import QRCode from "react-qr-code";

export default function TransactionHomeScreen() {
    const [showBadge, setShowBadge] = useState(false);

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
        <SafeAreaView className="flex flex-col w-screen h-screen space-y-2 px-4 items-start justify-start">
            {userData ?
                <View className="flex flex-col w-full h-full space-y-2 items-center justify-start">
                    <Card
                        style={{ backgroundColor: Colors.bgDefault }}
                        className="flex flex-col w-full p-4 space-y-2 justify-center items-start"
                        elevation={10}
                    >
                        <View className="flex flex-row items-center gap-5">
                            <Avatar.Text label={getInitials(userData.username)} size={50} />
                            <View className="flex">
                                <Text h4>{userData.username}</Text>
                                <Text bodySmall className="text-ellipsis">ID: 123123</Text>
                            </View>
                        </View>
                    </Card>
                    <Card
                        style={{ backgroundColor: Colors.bgDefault }}
                        className="flex flex-col p-4 space-y-2"
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
                        <Button
                            className="rounded-lg"
                            onPress={() => router.navigate("/(transactionRoom)/scan")}
                        >
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="qrcode-scan" size={20} color={"white"} />
                                <Text buttonSmall white>Scan QR Code</Text>
                            </View>
                        </Button>
                    </Card>
                    <View className="w-full flex flex-row gap-1 items-center justify-center">
                        <TouchableRipple
                            className="flex p-4 items-center justify-center rounded-lg"
                            style={{ backgroundColor: Colors.primary700 }}
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
                            style={{ backgroundColor: Colors.primary700, opacity: queue && queue.length > 0 ? 1 : 0.75 }}
                            disabled={!joinRoomLoading && queue && queue.length > 0 ? false : true}
                            onPress={() => createRoom()}
                        >
                            <View className="flex flex-row w-full items-center justify-stretch">
                                {!joinRoomLoading ?
                                    <View className="flex flex-col items-start justify-center">
                                        <Text
                                            caption
                                            style={{ color: Colors.bgDefault }}
                                        >
                                            Next Client
                                        </Text>
                                        <Text
                                            bodyLarge
                                            style={{ color: Colors.bgDefault }}
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
                                        <Text body className="font-bold text-white">Creating the room...</Text>
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
                                    <Text h3>Invite Requests</Text>
                                    {requests && requests.length > 0 ?
                                        <ScrollView>
                                            {requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).map((req, i) => (
                                                <Card key={i}
                                                    style={{ backgroundColor: Colors.bgDefault }}
                                                    className="flex flex-row w-full p-4 justify-between items-center"
                                                >
                                                    <View className="flex flex-row items-center gap-5">
                                                        <Avatar.Text label={getInitials(req.sender_name)} size={35} />
                                                        <Text bodyLarge className="font-bold">{req.sender_name}</Text>
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
                                                </Card>
                                            ))}
                                        </ScrollView>
                                        :
                                        <Chip
                                            label={"No Invite Requests"}
                                            borderRadius={8}
                                            backgroundColor={Colors.primary200}
                                        />
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