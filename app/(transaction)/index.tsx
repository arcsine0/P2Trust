import { useState, useEffect, useRef, useCallback } from "react";
import { View, ScrollView, TouchableHighlight } from "react-native";
import { Text, Avatar, Chip, IconButton, Card, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useIsFocused } from "@react-navigation/native";

import { router, useFocusEffect } from "expo-router";
import * as Notifications from "expo-notifications";

import { db } from "@/firebase/config";
import { ref, push, set, remove, onValue } from "firebase/database";

import AsyncStorage from "@react-native-async-storage/async-storage";


import QRCode from "react-qr-code";

type UserData = {
    uid: string;
    userName: string;
    pushToken: string;
    [key: string]: any;
}

export default function TransactionHomeScreen() {
    const [roomID, setRoomID] = useState("");
    const [userData, setUserData] = useState<UserData | undefined>(undefined);

    const isFocused = useIsFocused();
    const wasFocused = useRef(false);

    const notificationsListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

    const getInitials = (name: string) => {
        const words = name.trim().split(" ");
        let initials = "";

        for (let i = 0; i < Math.min(words.length, 2); i++) {
            if (words[i].length > 0) {
                initials += words[i][0].toUpperCase();
            }
        }

        return initials;
    }

    // const getRoomState = async () => {
    //     const roomStateAsync = await AsyncStorage.getItem("roomState");
    //     if (roomStateAsync) {
    //         setRoomState(Boolean(roomStateAsync));
    //     }
    // }

    const createRoom = async () => {
        const userDataAsync = await AsyncStorage.getItem("userData");

        if (userDataAsync) {
            const userData = JSON.parse(userDataAsync);

            try {
                const roomRef = push(ref(db, "rooms"));
                const id = roomRef.key;

                if (id) {
                    console.log(id);
                    setRoomID(id);

                    await set(roomRef, {
                        merchant: "",
                        client: ""
                    }).then(async () => {
                        await push(ref(db, `rooms/${id}/users`), {
                            uid: userData.uid
                        });
                    });
                }

            } catch (err) {
                console.log(err)
            }
        }
    }

    // const deleteRoom = async () => {
    //     await remove(ref(db, `rooms/${roomID}`));
    // }

    // const listenForConnections = async () => {
    //     const connectedRef = ref(db, `rooms/${roomID}/users`);
    //     onValue(connectedRef, (snapshot) => {
    //         const data = snapshot.val();
    //         console.log(data);
    //     })
    // }

    // useFocusEffect(
    //     useCallback(() => {
    //         let isScreenFocused = true;
    //         const roomLive = AsyncStorage.getItem("roomLive")

    //         if (isScreenFocused) {
    //             createRoom();
    //             listenForConnections();
    //         }

    //         return () => {
    //             isScreenFocused = false;
    //             deleteRoom();

    //             onValue(ref(db, `rooms/${roomID}/users`), () => null);
    //         };
    //     }, [])
    // );

    const getUserData = async () => {
        console.log("loading user data...");

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

    useEffect(() => {
        getUserData();

        notificationsListener.current = Notifications.addNotificationReceivedListener((notification) => {
            console.log(notification.request.content.title)
        });

        responseListener.current = Notifications.addNotificationResponseReceivedListener((response) => {
            console.log(response);
        });

        return () => {
            notificationsListener.current &&
                Notifications.removeNotificationSubscription(notificationsListener.current);
            responseListener.current &&
                Notifications.removeNotificationSubscription(responseListener.current);
        };
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-2 px-4 items-start justify-start">
            {userData ?
                <View className="flex flex-col w-full h-full items-center justify-start">
                    <Card className="w-full mb-2">
                        <Card.Content className="flex flex-row w-full justify-between items-center">
                            <View className="flex flex-row items-center gap-5">
                                <Avatar.Text label={getInitials("test merchant")} size={35} />
                                <View className="flex">
                                    <Text variant="titleLarge" className="font-bold">{userData.userName}</Text>
                                    <Text variant="titleSmall" className="font-semibold">{userData.uid}</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                    <Card className="w-full">
                        <Card.Content className="flex flex-col gap-3">
                            <View className="flex justify-center items-center border-2 rounded-lg p-5">
                                <QRCode
                                    size={256}
                                    className="h-auto w-full"
                                    value={userData.uid}
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
                </View>
                : null}
        </SafeAreaView>
    );
}