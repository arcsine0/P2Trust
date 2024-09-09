import { useState, useEffect, useRef } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Avatar, Chip, IconButton, Card, Button } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";

import * as Notifications from "expo-notifications";

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


export default function TransactionLobbyScreen() {
    const [userData, setUserData] = useState<UserData | undefined>(undefined);

    const [roomID, setRoomID] = useState("");
    const [roomData, setRoomData] = useState<RoomData | undefined>(undefined);

    const [merchantID, setMerchantID] = useState("");
    const [merchantData, setMerchantData] = useState<UserData | undefined>(undefined);

    const notificationsListener = useRef<Notifications.Subscription>();
    const responseListener = useRef<Notifications.Subscription>();

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

    const sendPushNotification = async (pushToken: string, name: string) => {
        const message = {
            to: pushToken,
            sound: "default",
            title: `${name} would like to start a transaction with you`,
            body: "Accept or Reject the request in the Transactions Page!",
            data: {
                uid: userData?.id,
                token: userData?.pushToken,
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

    const pingMerchant = async () => {

    }

    const createRoom = async () => {

    }

    const queueClient = async () => {
        if (userData && merchantData) {
            sendPushNotification(merchantData.push_token, userData.username);
        }
    }

    useEffect(() => {
        getUserData();
        getMerchantID();

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
        <SafeAreaView className="flex flex-col w-screen h-screen p-2 items-start justify-start">
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
                    <View className="flex flex-row w-full mb-4">
                        <Card className="mr-2">
                            <Card.Content className="flex items-center justify-center">
                                <Text variant="bodyMedium">Queue: 0</Text>
                            </Card.Content>
                        </Card>
                        <Button
                            className="grow"
                            icon={"account-arrow-up"}
                            mode="contained"
                            onPress={() => queueClient()}
                        >
                            Transact
                        </Button>
                    </View>
                    {/* <Card>
                        <Card.Content>
                            <Text variant="bodyMedium">data to be placed here</Text>
                        </Card.Content>
                    </Card> */}

                </View>
                : null}
        </SafeAreaView>
    );
}