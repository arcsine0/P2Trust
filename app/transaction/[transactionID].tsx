import { useState, useEffect, useRef, useCallback } from "react";
import { useWindowDimensions, Platform, View, KeyboardAvoidingView, FlatList, ScrollView } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, ProgressBar, Avatar, Icon, Card, Button, Divider } from "react-native-paper";

import { router, useLocalSearchParams, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { Transaction, TimelineEvent } from "@/lib/helpers/types";

import { Ionicons, Octicons } from "@expo/vector-icons";
import { getInitials, formatISODate, formatTimeDifference } from "@/lib/helpers/functions";

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

            navigation.setOptions({
                headerLeft: () => (
                    <View className="flex flex-col mb-2 items-start justify-center">
                        <Text variant="titleMedium" className="font-bold">Transaction Details</Text>
                        <Text variant="bodyMedium">ID: {data[0].id}</Text>
                        <Text variant="bodyMedium">{formatISODate(data[0].created_at.toLocaleString())}</Text>
                    </View>
                ),
            });
        } else {
            console.log(error);
        }
    }

    useEffect(() => {
        getTransactionData();
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-full h-full px-2 pb-2 items-center justify-start">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex flex-col w-full h-full justify-between"
            >
                <ScrollView className="w-full">
                    {transactionData ?
                        <View className="flex flex-col items-center justify-start">
                            <Card className="w-full mb-2" style={{ backgroundColor: theme.colors.background }}>
                                <Card.Content className="flex flex-col">
                                    <Text variant="titleMedium" className="font-bold">Merchant</Text>
                                    <View className="flex flex-row items-center justify-between">
                                        <View className="flex flex-row items-center gap-3">
                                            <Avatar.Text label={getInitials(JSON.parse(transactionData.merchant).username)} size={35} />
                                            <View className="flex flex-col w-1/2">
                                                <Text variant="titleMedium" className="font-bold">{JSON.parse(transactionData.merchant).username}</Text>
                                                <Text variant="bodySmall" className="text-slate-400">ID: 123123</Text>
                                                <View className="flex flex-row gap-1 items-center">
                                                    <Ionicons name="thumbs-up-sharp" size={10} color={"#22c55e"} />
                                                    <Text variant="bodySmall">0</Text>
                                                    <Ionicons name="thumbs-down-sharp" size={10} color={"#ef4444"} />
                                                    <Text variant="bodySmall">0</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View></View>
                                        <View className="flex flex-col items-end justify-center">
                                            <Text variant="titleMedium" className="font-bold text-green-500">PHP100</Text>
                                            <Text variant="bodyMedium" className="text-slate-400">Received</Text>
                                        </View>
                                    </View>
                                    <Divider className="my-2" />
                                    <Text variant="titleMedium" className="font-bold">Client</Text>
                                    <View className="flex flex-row items-center justify-between">
                                        <View className="flex flex-row items-center gap-3">
                                            <Avatar.Text label={getInitials(JSON.parse(transactionData.client).username)} size={35} />
                                            <View className="flex flex-col w-1/2">
                                                <Text variant="titleMedium" className="font-bold">{JSON.parse(transactionData.client).username}</Text>
                                                <Text variant="bodySmall" className="text-slate-400">ID: 123123</Text>
                                                <View className="flex flex-row gap-1 items-center">
                                                    <Ionicons name="thumbs-up-sharp" size={10} color={"#22c55e"} />
                                                    <Text variant="bodySmall">0</Text>
                                                    <Ionicons name="thumbs-down-sharp" size={10} color={"#ef4444"} />
                                                    <Text variant="bodySmall">0</Text>
                                                </View>
                                            </View>
                                        </View>
                                        <View></View>
                                        <View className="flex flex-col items-end justify-center">
                                            <Text variant="titleMedium" className="font-bold text-red-500">-PHP100</Text>
                                            <Text variant="bodyMedium" className="text-slate-400">Sent</Text>
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                            <Card className="w-full mb-2">
                                <Card.Content className="flex flex-col" style={{ backgroundColor: theme.colors.background }}>
                                    <View className="flex flex-row w-full items-center justify-between">
                                        <Text variant="titleMedium" className="font-bold">Transaction Timeline</Text>
                                        <View className="flex flex-row gap-2 items-center justify-end">
                                            <Octicons name="clock" size={15} color={"#94a3b8"} />
                                            <Text variant="bodyMedium" className="text-slate-400">0 mins</Text>
                                        </View>
                                    </View>
                                    <Divider className="my-2" />
                                    <View className="space-y-2">
                                        {JSON.parse(transactionData.timeline).sort(
                                            (a: TimelineEvent, b: TimelineEvent) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
                                        ).map((event: TimelineEvent, i: number, arr: TimelineEvent[]) => {
                                            const startTime = Date.parse(arr[0].timestamp);
                                            const endTime = Date.parse(arr[arr.length - 1].timestamp);

                                            return (
                                                <View key={i} className="flex flex-row">
                                                    <View className="flex flex-col items-center mr-4">
                                                        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }}></View>
                                                        {i !== JSON.parse(transactionData.timeline).length - 1 &&
                                                            <View className="w-0.5 h-10" style={{ backgroundColor: theme.colors.primary }}></View>
                                                        }
                                                    </View>
                                                    <View className="flex flex-row items-start justify-between">
                                                        <View className="w-full">
                                                            <Text variant="titleMedium" className="font-bold">
                                                                {event.data.eventType === "user_joined" ? "User Joined" : null}
                                                                {event.data.eventType === "user_left" ? "User Left" : null}
                                                                {event.data.eventType === "payment_requested" ? "User Requested Payment" : null}
                                                                {event.data.eventType === "payment_sent" ? "User Sent Payment" : null}
                                                            </Text>
                                                            <Text variant="bodyMedium" className="text-slate-400">{formatTimeDifference(event.timestamp, startTime, endTime)}</Text>
                                                            <Text variant="bodyMedium">{event.from}</Text>
                                                        </View>
                                                    </View>
                                                </View>
                                            )
                                        })}
                                    </View>
                                </Card.Content>
                            </Card>
                        </View>
                        : null}
                </ScrollView>
                <View className="w-full flex flex-row space-x-1">
                    <Button
                        className="rounded-lg"
                        icon="thumbs-up-down"
                        mode="contained"
                        onPress={() => { }}
                    >
                        Rate
                    </Button>
                    <Button
                        className="rounded-lg grow"
                        icon="comment-multiple"
                        mode="contained"
                        onPress={() => { }}
                    >
                        Comments
                    </Button>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
