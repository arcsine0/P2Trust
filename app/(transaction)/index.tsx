import { useState } from "react";
import { View, ScrollView, TouchableHighlight } from "react-native";
import { Text, Avatar, Chip, IconButton, Card, Button } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { db, fs } from "@/firebase/config";

export default function TransactionHomeScreen() {
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
                <Card.Content className="flex flex-col gap-2">
                    <View>
                        
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