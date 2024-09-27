import { useState, useEffect, useRef } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Avatar, Chip, IconButton, Card, Button, Snackbar } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Notifications from "expo-notifications";
import { router } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";
import { getInitials } from "@/lib/helpers/functions";

export default function TransactionLobbyScreen() {
    const [roomID, setRoomID] = useState("");

    const [requestState, setRequestState] = useState("Transact");
    const [requestDisabled, setRequestDisabled] = useState(false);
    const [requestSnackVisible, setRequestSnackVisible] = useState(false);

    const [joinState, setJoinState] = useState("Waiting for Host...");
    const [joinDisabled, setJoinDisabled] = useState(true);
    const [joinVisible, setJoinVisible] = useState(false);

    const { userData } = useUserData();
    const { merchantData, setRole } = useMerchantData();

    const notificationsListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    const requestsChannel = supabase.channel(`requests_channel_${merchantData?.id}`);

    const requestTransaction = async () => {
        if (userData && merchantData) {
            requestsChannel
                .on("broadcast", { event: "queued" }, (payload) => {
                    const payloadData = payload.payload;

                    if (payloadData.sender_id === userData.id) {
                        setRequestState("Queued");
                        setRequestDisabled(true);

                        setJoinVisible(true);
                    }
                })
                .on("broadcast", { event: "accepted" }, (payload) => {
                    const payloadData = payload.payload;

                    if (payloadData.sender_id === userData.id) {
                        setRequestState("Request Accepted");
                        setJoinState("Join Room");
                        setJoinDisabled(false);

                        setRoomID(payloadData.room_id);
                    }
                })
                .on("broadcast", { event: "rejected" }, (payload) => {
                    const payloadData = payload.payload;

                    if (payloadData.sender_id === userData.id) {
                        setRequestState("Transact");
                        setRequestDisabled(false);
                        setRequestSnackVisible(true);

                        setJoinVisible(false);
                        setJoinState("Waiting for Host...");
                        setJoinDisabled(true);
                    }
                })
                .subscribe((status) => {
                    if (status === "SUBSCRIBED") {
                        requestsChannel.send({
                            type: "broadcast",
                            event: "request",
                            payload: {
                                created_at: Date,
                                sender_id: userData.id,
                                sender_name: userData.username,
                            }
                        })
                    }
                });
        }
    }

    const joinRoom = async () => {
        if (userData) {
            const { error } = await supabase
                .from("requests")
                .update({ status: "completed" })
                .eq("sender_id", userData.id);

            if (!error) {
                setRole("client");

                router.navigate(`/(transactionRoom)/room/${roomID}`);
            }
        }
    }

    useEffect(() => {
        notificationsListener.current = Notifications.addNotificationReceivedListener((notification) => {
            
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
           
        });

        return () => {
            notificationsListener.current &&
                Notifications.removeNotificationSubscription(notificationsListener.current);
            responseListener.current &&
                Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen p-2 items-start justify-between">
            {merchantData ?
                <View className="flex flex-col w-full h-full items-center justify-start">
                    <Card className="w-full mb-2">
                        <Card.Content className="flex flex-row w-full justify-between items-center">
                            <View className="flex flex-row items-center gap-5">
                                <Avatar.Text label={getInitials(merchantData.username)} size={35} />
                                <View className="flex">
                                    <Text variant="titleLarge" className="font-bold">{merchantData.username}</Text>
                                    <Text variant="titleSmall" className="font-semibold text-ellipsis">Recently Online</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                    <View className="flex flex-row w-full mb-2">
                        <Card className="mr-2 rounded-lg">
                            <Card.Content className="flex items-center justify-center">
                                <Text variant="bodyMedium">Queue: 0</Text>
                            </Card.Content>
                        </Card>
                        <Button
                            className="grow rounded-lg"
                            icon={"account-arrow-up"}
                            mode="contained"
                            onPress={() => requestTransaction()}
                            disabled={requestDisabled}
                        >
                            {requestState}
                        </Button>
                    </View>
                    {joinVisible ?
                        <Button
                            className="w-full rounded-lg"
                            icon={"account-arrow-up"}
                            mode="contained"
                            onPress={() => joinRoom()}
                            disabled={joinDisabled}
                        >
                            {joinState}
                        </Button>
                        : null}
                    {/* <Card>
                        <Card.Content>
                            <Text variant="bodyMedium">data to be placed here</Text>
                        </Card.Content>
                    </Card> */}
                    <Snackbar
                        visible={requestSnackVisible}
                        onDismiss={() => setRequestSnackVisible(false)}
                        action={{
                            label: "Dismiss",
                            onPress: () => setRequestSnackVisible(false),
                        }}
                    >
                        Invite Request Rejected or Expired
                    </Snackbar>
                </View>
                : null}
        </SafeAreaView>
    );
}