import { useState, useEffect, useRef, useCallback } from "react";
import { View, ScrollView, TouchableHighlight } from "react-native";
import { Text, Avatar, Chip, IconButton, Card, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { router, useFocusEffect } from "expo-router";
import { useIsFocused } from "@react-navigation/native";

import { db } from "@/firebase/config";
import { ref, push, set, remove, onValue } from "firebase/database";

import AsyncStorage from "@react-native-async-storage/async-storage";

import QRCode from "react-qr-code";

export default function TransactionHomeScreen() {
    const [roomID, setRoomID] = useState("");
    const [roomState, setRoomState] = useState(true);

    const isFocused = useIsFocused();
    const wasFocused = useRef(false);

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

    const getRoomState = async () => {
        const roomStateAsync = await AsyncStorage.getItem("roomState");
        if (roomStateAsync) {
            setRoomState(Boolean(roomStateAsync));
        }
    }

    const createRoom = async () => {
        const uid = await AsyncStorage.getItem("UID");

        if (uid) {
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
                            uid: uid
                        });
                    });
                }

            } catch (err) {
                console.log(err)
            }
        }
    }

    const deleteRoom = async () => {
        await remove(ref(db, `rooms/${roomID}`));
    }

    const listenForConnections = async () => {
        const connectedRef = ref(db, `rooms/${roomID}/users`);
        onValue(connectedRef, (snapshot) => {
            const data = snapshot.val();
            console.log(data);
        })
    }

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
    useEffect(() => {
        getRoomState();
    }, []);

    useEffect(() => {
        // if (roomState === true) {
        //     createRoom();
        //     listenForConnections();
        // } else {
        //     deleteRoom();
        //     onValue(ref(db, `rooms/${roomID}/users`), () => null);
        // }
    }, [roomState]);
    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-2 px-4 items-start justify-start">
            <Card className="w-full">
                <Card.Content className="flex flex-row w-full justify-between items-center">
                    <View className="flex flex-row items-center gap-5">
                        <Avatar.Text label={getInitials("test merchant")} size={35} />
                        <View className="flex">
                            <Text variant="titleLarge" className="font-bold">Test Client</Text>
                            <Text variant="titleSmall" className="font-semibold">0000000</Text>
                        </View>
                    </View>
                </Card.Content>
            </Card>
            <Card className="w-full">
                <Card.Content className="flex flex-col gap-3">
                    <View className="flex justify-center items-center border-2 rounded-lg p-5">
                        {roomID ? 
                            <QRCode 
                                size={256}
                                className="h-auto w-full"
                                value={roomID}
                            />
                        : null}
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
        </SafeAreaView>
    );
}