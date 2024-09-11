import { useState, useEffect, useRef } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Avatar, Chip, IconButton, Card, Button, Snackbar } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Notifications from "expo-notifications";
import { router } from "expo-router";

import { supabase } from "@/supabase/config";

type UserData = {
    id: string;
    username: string;
    push_token: string;
    [key: string]: any;
}

type RoomData = {
    id: string;
    [key: string]: any;
}

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

const sendPushNotification = async (pushToken: string, name: string) => {
    const message = {
        to: pushToken,
        sound: "default",
        title: `${name} would like to start a transaction with you`,
        body: "Accept or Reject the request in the Transactions Page!",
    };

    await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
            Accept: "application/json",
            "Accept-encoding": "gzip, deflate",
            "Content-Type": "application/json",
        },
        body: JSON.stringify(message),
    })
        .catch(err => console.log(err));
}

export default function TransactionLobbyScreen() {
    const [userData, setUserData] = useState<UserData | undefined>(undefined);

    const [roomID, setRoomID] = useState("");

    const [merchantID, setMerchantID] = useState("");
    const [merchantData, setMerchantData] = useState<UserData | undefined>(undefined);

    const [requestState, setRequestState] = useState("Transact");
    const [requestDisabled, setRequestDisabled] = useState(false);
    const [requestSnackVisible, setRequestSnackVisible] = useState(false);

    const [joinState, setJoinState] = useState("Waiting for Host...");
    const [joinDisabled, setJoinDisabled] = useState(true);
    const [joinVisible, setJoinVisible] = useState(false);

    const notificationsListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    const getUserData = async () => {
        try {
            await AsyncStorage.getItem("userData").then((userDataAsync) => {
                if (userDataAsync) {
                    const userData = JSON.parse(userDataAsync);
                    setUserData(userData)
                }
            });
        } catch (err) {
            console.log(err);
        }
    }

    const getMerchantID = async () => {
        const merchantIDAsync = await AsyncStorage.getItem("merchantID");
        if (merchantIDAsync) {
            setMerchantID(merchantIDAsync);

            const { data, error } = await supabase
                .from("accounts")
                .select()
                .eq("id", merchantIDAsync)

            if (!error) {
                setMerchantData({ ...data[0] } as UserData);
            }
        }
    }

    const requestTransaction = async () => {
        if (userData && merchantData) {
            const { error } = await supabase
                .from("requests")
                .insert({
                    status: "sent",
                    sender_id: userData.id,
                    sender_name: userData.username,
                    receiver_id: merchantData.id,
                    sender_push_token: userData.push_token,
                });

            if (!error) {
                sendPushNotification(merchantData.push_token, userData.username);
                setRequestState("Request Sent");
                setRequestDisabled(true);

                const requestListener = supabase
                    .channel("request_channel")
                    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "requests" }, async (payload) => {
                        const { data, error } = await supabase
                            .from("requests")
                            .select("status")
                            .eq("sender_id", userData.id)

                        if (!error) {
                            switch (data[0].status) {
                                case "queued":
                                    setRequestState("Queued");
                                    setJoinVisible(true);

                                    break;
                                case "room_hosted":
                                    setRequestState("Request Accepted");
                                    setJoinState("Join Room");
                                    
                                    break;
                                default:
                                    break;
                            }
                        } else {
                            console.log(error);
                        }
                    })
                    .on("postgres_changes", { event: "DELETE", schema: "public", table: "requests" }, async (payload) => {
                        const { data, error } = await supabase
                            .from("requests")
                            .select("status")
                            .eq("sender_id", userData.id)

                        if (!error) {
                            if (data.length === 0) {
                                setRequestState("Transact");
                                setRequestDisabled(false);
                                setRequestSnackVisible(true);

                                setJoinVisible(false);
                                setJoinState("Waiting for Host...");
                                setJoinDisabled(true);


                                requestListener.unsubscribe();
                                supabase.removeChannel(requestListener);
                            }
                        } else {
                            console.log(error);
                        }
                    })
                    .subscribe()
            }
        }
    }

    const joinRoom = async () => {
        if (userData) {
            const { error } = await supabase
                .from("requests")
                .update({ status: "completed" })
                .eq("sender_id", userData.id);

            if (!error) {
                router.navigate(`/(transaction)/room/${roomID}`);
            }
        }
    }

    useEffect(() => {
        getUserData();
        getMerchantID();

        notificationsListener.current = Notifications.addNotificationReceivedListener((notification) => {
            console.log(notification.request.content.data.roomID)
            setRoomID(notification.request.content.data.roomID);
            setJoinDisabled(false);
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            // console.log(response);
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