import { useState, useEffect, useRef, useContext } from "react";
import { View, ScrollView } from "react-native";
import { useTheme, Text, Avatar, Portal, Modal, Icon, IconButton, Card, Button, TouchableRipple, Badge } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { router, useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { Request } from "@/lib/helpers/types";

import AsyncStorage from "@react-native-async-storage/async-storage";

import QRCode from "react-qr-code";

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

const sendPushNotification = async (pushToken: string, name: string, roomID: string) => {
    const message = {
        to: pushToken,
        sound: "default",
        title: `${name} has joined the room`,
        body: "Join the room to start the transaction!",
        data: {
            roomID: roomID,
        }
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

export default function TransactionHomeScreen() {
    const [roomID, setRoomID] = useState("");

    const [expanded, setExpanded] = useState(false);
    const [showRequests, setShowRequests] = useState(false);
    const [showBadge, setShowBadge] = useState(false);

    const { userData, requests, setRequests, queue, setQueue } = useUserData();

    const isFocused = useIsFocused();
    const wasFocused = useRef(false);

    const notificationsListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    const theme = useTheme();

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
        if (requests && queue) {
            const currentRequest = queue.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];
            const { error } = await supabase
                .from("requests")
                .update({ status: "room_hosted" })
                .eq("sender_id", currentRequest.sender_id)

            if (!error) {
                const { data, error } = await supabase
                    .from("rooms")
                    .insert({
                        user_1_id: userData?.id,
                        user_2_id: currentRequest.sender_id,
                        user_1_name: userData?.username,
                        user_2_name: currentRequest.sender_name,
                    })
                    .select();

                if (!error && data && userData) {
                    requestsChannel.send({
                        type: "broadcast",
                        event: "accepted",
                        payload: {
                            sender_id: currentRequest.sender_id,
                            room_id: data[0].id,
                        }
                    })

                    router.navigate(`/(transaction)/room/${data[0].id}`);
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

        notificationsListener.current = Notifications.addNotificationReceivedListener((notification) => {
            // console.log(notification.request.content.data)
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log(response);
        });

        return () => {
            notificationsListener.current &&
                Notifications.removeNotificationSubscription(notificationsListener.current);
            responseListener.current &&
                Notifications.removeNotificationSubscription(responseListener.current);

            // requestChannel.unsubscribe();
        };
    }, []);
    
    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-2 px-4 items-start justify-start">
            {userData ?
                <View className="flex flex-col w-full h-full items-center justify-start">
                    <Card className="w-full mb-2">
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
                    <Card className="w-full mb-2">
                        <Card.Content className="flex flex-col gap-3">
                            <View className="flex justify-center items-center border-2 rounded-lg p-5">
                                <QRCode
                                    size={256}
                                    className="h-auto w-full"
                                    value={userData.id}
                                />
                            </View>
                            <Button
                                icon={"qrcode-scan"}
                                mode="contained"
                                onPress={() => router.navigate("/(transaction)/scan")}
                            >
                                Scan QR Code
                            </Button>
                        </Card.Content>
                    </Card>
                    <View className="w-full flex flex-row gap-1 items-center justify-center">
                        <TouchableRipple
                            className="flex p-4 items-center justify-center rounded-lg"
                            style={{ backgroundColor: theme.colors.primary }}
                            onPress={() => {
                                setShowRequests(!showRequests);
                                setShowBadge(false);
                            }}
                        >
                            <View>
                                <Icon
                                    source="bell"
                                    color={theme.colors.background}
                                    size={25}
                                />
                                {showBadge ?
                                    <Badge></Badge>
                                    : null}
                            </View>
                        </TouchableRipple>
                        <TouchableRipple
                            className="flex flex-col p-2 items-center justify-center rounded-lg shadows-md grow"
                            style={{ backgroundColor: theme.colors.primary, opacity: queue && queue.length > 0 ? 1 : 0.75 }}
                            disabled={queue && queue.length > 0 ? false : true}
                            onPress={() => createRoom()}
                        >
                            <View className="flex flex-row w-full items-center justify-stretch">
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
                                {/* <Icon
                                    source="arrow-right-bold"
                                    color={theme.colors.background}
                                    size={30}
                                /> */}
                            </View>
                        </TouchableRipple>
                        <Portal>
                            <Modal
                                visible={showRequests}
                                onDismiss={() => setShowRequests(false)}
                                style={{ backgroundColor: theme.colors.background, width: "80%", height: "50%", borderRadius: 8, padding: 8, alignSelf: "center" }}
                            >
                                <View className="flex flex-col items-start justify-start">
                                    <Text variant="titleLarge">Invite Requests</Text>
                                    {requests && requests.length > 0 ?
                                        <ScrollView>
                                            {requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).map((req, i) => (
                                                <Card key={i}>
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
                                        <Text variant="titleLarge">No Invite Requests</Text>
                                    }
                                </View>
                            </Modal>
                        </Portal>
                    </View>
                </View>
                : null}
        </SafeAreaView>
    );
}