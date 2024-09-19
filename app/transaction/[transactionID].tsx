import { useState, useEffect, useRef, useCallback } from "react";
import { useWindowDimensions, Platform, View, KeyboardAvoidingView, FlatList, ScrollView } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, ProgressBar, Avatar, Chip, Card, Button, IconButton, Menu, Dialog, Portal } from "react-native-paper";

import { router, useLocalSearchParams, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { Transaction, TimelineEvent } from "@/lib/helpers/types";

import { getInitials, formatTimeDifference } from "@/lib/helpers/functions";

export default function TransactionDetailsScreen() {
    const [transactionData, setTransactionData] = useState<Transaction | null>(null)

    const { transactionID } = useLocalSearchParams<{ transactionID: string }>();

    const navigation = useNavigation();
    const theme = useTheme();

    const getTransactionData = async () => {
        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("id", transactionID);

        if (!error) {
            setTransactionData(data[0]);
        } else {
            console.log(error);
        }
    }

    useEffect(() => {
        getTransactionData();

        navigation.setOptions({
            headerRight: () => (
                <IconButton
                    icon="dots-vertical"
                    onPress={() => { }}
                />
            )
        });
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-full h-full px-2 pb-2 items-center justify-start">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex w-full h-full"
            >
                <ScrollView className="w-full">
                    {transactionData ?
                        <View className="flex flex-col items-center justify-start">
                            <Card className="mb-2 w-full" style={{ backgroundColor: theme.colors.background }}>
                                <Card.Content className="flex flex-col gap-2 items-start justify-start">
                                    <Text variant="titleLarge" className="font-bold">Transaction Details</Text>
                                    <Text variant="titleSmall" className="font-semibold">ID: {transactionData.id}</Text>
                                    <View className="flex flex-row items-center justify-start">
                                        <Text variant="titleMedium" className="font-bold mr-2">Merchant:</Text>
                                        <Chip avatar={<Avatar.Text label={getInitials(JSON.parse(transactionData.merchant).username)} size={20} />}>
                                            <Text className="font-semibold">{JSON.parse(transactionData.merchant).username}</Text>
                                        </Chip>
                                    </View>
                                    <View className="flex flex-row items-center justify-start">
                                        <Text variant="titleMedium" className="font-bold mr-2">Client:</Text>
                                        <Chip avatar={<Avatar.Text label={getInitials(JSON.parse(transactionData.client).username)} size={20} />}>
                                            <Text className="font-semibold">{JSON.parse(transactionData.client).username}</Text>
                                        </Chip>
                                    </View>
                                </Card.Content>
                            </Card>
                            <Card className="mb-2 w-full" style={{ backgroundColor: theme.colors.background }}>
                                <Card.Content className="flex flex-col gap-2 items-start justify-start">
                                    <Text variant="titleLarge" className="font-bold">Reputation</Text>
                                    <View className="flex flex-row w-full items-center justify-center">
                                        <IconButton
                                            icon="alert-decagram"
                                            iconColor={theme.colors.error}
                                            size={25}
                                            onPress={() => {}}
                                        />
                                        <ProgressBar
                                            className="w-[200]"
                                            progress={0.5}
                                        />
                                        <IconButton
                                            icon="check-decagram"
                                            iconColor="#44d45e"
                                            size={25}
                                            onPress={() => {}}
                                        />
                                    </View>
                                </Card.Content>
                            </Card>
                            <Card className="mb-2 w-full" style={{ backgroundColor: theme.colors.background }}>
                                <Card.Content className="flex flex-col gap-2 items-start justify-start">
                                    <Text variant="titleLarge" className="font-bold">Timeline</Text>
                                    <View className="flex flex-col items-start justify-start">
                                        {JSON.parse(transactionData.timeline).sort(
                                            (a: TimelineEvent, b: TimelineEvent) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
                                        ).map((inter: TimelineEvent, i: number, arr: TimelineEvent[]) => {
                                            const startTime = Date.parse(arr[0].timestamp);
                                            const endTime = Date.parse(arr[arr.length - 1].timestamp);

                                            return (
                                                <View key={i} className="w-full mb-1">
                                                    {inter.type === ("user") && (
                                                        <View className="flex flex-col mb-1">
                                                            <Chip
                                                                icon={(() => {
                                                                    switch (inter.data.eventType) {
                                                                        case "user_joined":
                                                                            return "account-plus";
                                                                        case "user_left":
                                                                            return "account-minus";
                                                                        default:
                                                                            return "information";
                                                                    }
                                                                })()}
                                                            >
                                                                {inter.data.eventType === "user_joined" && (
                                                                    <Text>{inter.from} joined the room</Text>
                                                                )}
                                                                {inter.data.eventType === "user_left" && (
                                                                    <Text>{inter.from} left the room</Text>
                                                                )}
                                                            </Chip>
                                                            <Text variant="bodySmall">{formatTimeDifference(inter.timestamp, startTime, endTime)}</Text>
                                                        </View>

                                                    )}
                                                    {inter.type === ("payment") && (
                                                        <View className="flex flex-col mb-1">
                                                            <Chip
                                                                className=""
                                                                icon={(() => {
                                                                    switch (inter.data.eventType) {
                                                                        case "payment_requested":
                                                                            return "cash-plus";
                                                                        case "payment_sent":
                                                                            return "cash-fast";
                                                                        case "payment_received":
                                                                            return "cash-check";
                                                                        case "payment_request_cancelled":
                                                                            return "cash-refund";
                                                                        default:
                                                                            return "information";
                                                                    }
                                                                })()}
                                                            >
                                                                {inter.data.eventType === "payment_requested" && (
                                                                    <Text>{inter.from} has sent a payment request</Text>
                                                                )}
                                                                {inter.data.eventType === "payment_request_cancelled" && (
                                                                    <Text>{inter.from} has cancelled the payment request</Text>
                                                                )}
                                                                {inter.data.eventType === "payment_sent" && (
                                                                    <Text>{inter.from} has sent the payment</Text>
                                                                )}
                                                                {inter.data.eventType === "payment_received" && (
                                                                    <Text>{inter.from} has received the payment</Text>
                                                                )}
                                                            </Chip>
                                                            <Text variant="bodySmall">{formatTimeDifference(inter.timestamp, startTime, endTime)}</Text>
                                                        </View>
                                                    )}
                                                </View>
                                            )
                                        })}
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                        : null}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
