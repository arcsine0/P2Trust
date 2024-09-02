import { useState, useEffect } from "react";
import { View, ScrollView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Text, Avatar, Chip, IconButton, Card, Button } from "react-native-paper";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { db, fs } from "@/firebase/config";
import { ref, push, set, remove, onValue } from "firebase/database";
import { doc, getDoc, DocumentData } from "firebase/firestore";

type MerchantData = {
    id: string;
    userName: string;
    [key: string]: any;
}

export default function TransactionLobbyScreen() {
    const [roomID, setRoomID] = useState("");
    const [merchantID, setMerchantID] = useState("");
    const [merchantData, setMerchantData] = useState<MerchantData>({ id: "", userName: "" });

    const getMerchantID = async () => {
        const merchantIDAsync = await AsyncStorage.getItem("merchantID");
        if (merchantIDAsync) {
            setMerchantID(merchantIDAsync);
            console.log(merchantIDAsync);

            getDoc(doc(fs, "Accounts", merchantIDAsync))
                .then((sn) => {
                    if (sn.data) {
                        setMerchantData(curr => ({ ...curr, id: sn.id, ...sn.data() }));
                    }
                })
        }
    }

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

    useEffect(() => {
        getMerchantID();
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen p-2 items-start justify-start">
            {merchantData.id ?
                <View className="flex flex-col w-full h-full items-center justify-start">
                    <Card className="w-full">
                        <Card.Content className="flex flex-row w-full justify-between items-center">
                            <View className="flex flex-row items-center gap-5">
                                <Avatar.Text label={getInitials(merchantData.userName)} size={35} />
                                <View className="flex">
                                    <Text variant="titleLarge" className="font-bold">{merchantData.userName}</Text>
                                    <Text variant="titleSmall" className="font-semibold text-ellipsis">{merchantData.id}</Text>
                                </View>
                            </View>
                        </Card.Content>
                    </Card>
                    <Card>
                        <Card.Content>
                            <Text variant="bodyMedium">data to be placed here</Text>
                        </Card.Content>
                    </Card>

                </View>
                : null}
        </SafeAreaView>
    );
}