import { useState, useEffect, useRef, useCallback } from "react";
import { useWindowDimensions, Platform, View, KeyboardAvoidingView, FlatList, ScrollView } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, ProgressBar, Avatar, Icon, Card, Button, Divider, TouchableRipple } from "react-native-paper";

import { router, useLocalSearchParams, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { Transaction, TimelineEvent } from "@/lib/helpers/types";

import { Ionicons, Octicons } from "@expo/vector-icons";
import { getInitials, formatISODate, formatTimeDifference } from "@/lib/helpers/functions";

export default function TransactionDetailsScreen() {
    const [transactionData, setTransactionData] = useState<Transaction | undefined>(undefined)
    const [transactionTimeline, setTransactionTimeline] = useState<TimelineEvent[] | undefined>(undefined);

    const [transactionLength, setTransactionLength] = useState<{
        startTime: number,
        endTime: number,
    } | undefined>(undefined);

    const { transactionID } = useLocalSearchParams<{ transactionID: string }>();

    const navigation = useNavigation();
    const theme = useTheme();

    const getTransactionData = async () => {
        try {
            const { data, error } = await supabase
                .from("transactions")
                .select("*")
                .eq("id", transactionID);

            if (!error) {
                setTransactionData(data[0]);
                setTransactionTimeline(data[0].timeline);
                setTransactionLength({
                    startTime: Date.parse(data[0].timeline[0].timestamp),
                    endTime: Date.parse(data[0].timeline[data[0].timeline.length - 1].timestamp),
                });

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
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        getTransactionData();
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-full h-full pb-2 items-center justify-start">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex flex-col w-full h-full justify-between"
            >
                <ScrollView className="w-full">
                    {transactionData ?
                        <View className="flex flex-col px-2 items-center justify-start">
                            <Card className="w-full mb-2" style={{ backgroundColor: theme.colors.background }}>
                                <Card.Content className="flex flex-col">
                                    <Text variant="titleMedium" className="font-bold">Merchant</Text>
                                    <View className="flex flex-row items-center justify-between">
                                        <TouchableRipple onPress={() => router.navigate(`/(transactionRoom)/merchant/${transactionData.merchantID}`)}>
                                            <View className="flex flex-row items-center gap-3">
                                                <Avatar.Text label={getInitials(transactionData.merchantName)} size={35} />
                                                <View className="flex flex-col w-1/2">
                                                    <Text variant="titleMedium" className="font-bold">{transactionData.merchantName}</Text>
                                                    <Text variant="bodySmall" className="text-slate-400">ID: 123123</Text>
                                                    <View className="flex flex-row gap-1 items-center">
                                                        <Ionicons name="thumbs-up-sharp" size={10} color={"#22c55e"} />
                                                        <Text variant="bodySmall">0</Text>
                                                        <Ionicons name="thumbs-down-sharp" size={10} color={"#ef4444"} />
                                                        <Text variant="bodySmall">0</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableRipple>

                                        <View></View>
                                        <View className="flex flex-col items-end justify-center">
                                            <Text variant="titleMedium" className="font-bold text-green-500">PHP{transactionData.total_amount}</Text>
                                            <Text variant="bodyMedium" className="text-slate-400">Received</Text>
                                        </View>
                                    </View>
                                    <Divider className="my-2" />
                                    <Text variant="titleMedium" className="font-bold">Client</Text>
                                    <View className="flex flex-row items-center justify-between">
                                        <TouchableRipple onPress={() => router.navigate(`/(transactionRoom)/merchant/${transactionData.clientID}`)}>
                                            <View className="flex flex-row items-center gap-3">
                                                <Avatar.Text label={getInitials(transactionData.clientName)} size={35} />
                                                <View className="flex flex-col w-1/2">
                                                    <Text variant="titleMedium" className="font-bold">{transactionData.clientName}</Text>
                                                    <Text variant="bodySmall" className="text-slate-400">ID: 123123</Text>
                                                    <View className="flex flex-row gap-1 items-center">
                                                        <Ionicons name="thumbs-up-sharp" size={10} color={"#22c55e"} />
                                                        <Text variant="bodySmall">0</Text>
                                                        <Ionicons name="thumbs-down-sharp" size={10} color={"#ef4444"} />
                                                        <Text variant="bodySmall">0</Text>
                                                    </View>
                                                </View>
                                            </View>
                                        </TouchableRipple>

                                        <View></View>
                                        <View className="flex flex-col items-end justify-center">
                                            <Text variant="titleMedium" className="font-bold text-red-500">-PHP{transactionData.total_amount}</Text>
                                            <Text variant="bodyMedium" className="text-slate-400">Sent</Text>
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                            <Card className="w-full mb-2 rounded-lg">
                                <Card.Content className="flex flex-col" style={{ backgroundColor: theme.colors.background }}>
                                    <View className="flex flex-row w-full items-center justify-between">
                                        <Text variant="titleMedium" className="font-bold">Transaction Timeline</Text>
                                        <View className="flex flex-row gap-2 items-center justify-end">
                                            <Octicons name="clock" size={15} color={"#94a3b8"} />
                                            {transactionLength ?
                                                <Text variant="bodyMedium" className="text-slate-400">{Math.round((transactionLength.endTime - transactionLength.startTime) / (1000 * 60))} mins</Text>
                                                :
                                                <Text variant="bodyMedium" className="text-slate-400">0 mins</Text>
                                            }

                                        </View>
                                    </View>
                                    <Divider className="my-2" />
                                    <View className="space-y-2">
                                        {transactionTimeline && transactionLength && transactionTimeline.sort(
                                            (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
                                        ).map((event, i) => {
                                            return (
                                                <View key={i} className="flex flex-row">
                                                    <View className="flex flex-col items-center mr-4">
                                                        <View className="w-3 h-3 rounded-full" style={{ backgroundColor: theme.colors.primary }}></View>
                                                        {i !== transactionTimeline.length - 1 &&
                                                            <View className="w-0.5 h-10" style={{ backgroundColor: theme.colors.primary }}></View>
                                                        }
                                                    </View>
                                                    <View className="flex flex-row items-start justify-between">
                                                        <View className="w-full">
                                                            <Text variant="titleMedium" className="font-bold">
                                                                {event.type === "transaction_started" ? "Transaction Started" : null}
                                                                {event.type === "user_joined" ? "User Joined" : null}
                                                                {event.type === "user_left" ? "User Left" : null}
                                                                {event.type === "payment_requested" ? "User Requested Payment" : null}
                                                                {event.type === "payment_request_cancelled" ? "User Cancelled Payment" : null}
                                                                {event.type === "payment_sent" ? "User Sent Payment" : null}
                                                                {event.type === "payment_confirmed" ? "User Confirmed Payment" : null}
                                                                {event.type === "payment_denied" ? "User Denied Payment" : null}
                                                                {event.type === "product_sent" ? "User Sent Product" : null}
                                                                {event.type === "product_received" ? "User Received Product" : null}
                                                            </Text>
                                                            <Text variant="bodyMedium" className="text-slate-400">{formatTimeDifference(event.timestamp, transactionLength.startTime, transactionLength.endTime)}</Text>
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
                <View className="w-full px-2 flex flex-row space-x-1">
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
