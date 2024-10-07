import { useState, useEffect } from "react";
import { useWindowDimensions, Platform, KeyboardAvoidingView, ScrollView } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Avatar, Divider, IconButton, TouchableRipple } from "react-native-paper";

import { Colors, View, Text, Card, Timeline } from "react-native-ui-lib";

import { router, useLocalSearchParams, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { Transaction, TimelineEvent } from "@/lib/helpers/types";

import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { getInitials, formatISODate, formatTimeDifference } from "@/lib/helpers/functions";

export default function TransactionDetailsScreen() {
    const [transactionData, setTransactionData] = useState<Transaction | undefined>(undefined)
    const [transactionTimeline, setTransactionTimeline] = useState<TimelineEvent[] | undefined>(undefined);

    const [userRating, setUserRating] = useState<{
        positive: number,
        negative: number,
    } | undefined>(undefined);

    const [merchantRating, setMerchantRating] = useState<{
        positive: number,
        negative: number,
    } | undefined>(undefined)

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
                const timeline = JSON.parse(data[0].timeline);

                const { data: userRatings, error: userRatingsError } = await supabase
                    .from("ratings")
                    .select("rating")
                    .eq("merchant_id", data[0].clientID);

                const { data: merchantRatings, error: merchantRatingsError } = await supabase
                    .from("ratings")
                    .select("rating")
                    .eq("merchant_id", data[0].merchantID);

                if (!userRatingsError && userRatings) {
                    setUserRating({
                        positive: userRatings.filter(rating => rating.rating === "UP").length,
                        negative: userRatings.filter(rating => rating.rating === "DOWN").length,
                    })
                }

                if (!merchantRatingsError && merchantRatings) {
                    setMerchantRating({
                        positive: merchantRatings.filter(rating => rating.rating === "UP").length,
                        negative: merchantRatings.filter(rating => rating.rating === "DOWN").length,
                    })
                }

                setTransactionData(data[0]);
                setTransactionTimeline(timeline);
                setTransactionLength({
                    startTime: Date.parse(timeline[0].timestamp),
                    endTime: Date.parse(timeline[timeline.length - 1].timestamp),
                });

                navigation.setOptions({
                    headerLeft: () => (
                        <View className="flex flex-col mt-4 mb-2 items-start justify-center">
                            <Text bodyLarge className="font-bold">Transaction Details</Text>
                            <Text bodySmall>ID: {data[0].id}</Text>
                            <Text bodySmall>{formatISODate(data[0].created_at.toLocaleString())}</Text>
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

        navigation.setOptions({
            headerRight: () => (
                <View className="flex flex-row">
                    <IconButton
                        icon="dots-vertical"
                        onPress={() => console.log("Dots Pressed")}
                    />
                </View>
            )
        });
    }, []);

    const renderTimelineContent = (event: TimelineEvent, index: number, anchorRef?: any) => {
        if (transactionLength) {
            return (
                <Card key={index} padding-page ref={anchorRef}>
                    <View marginT-5 padding-8 bg-grey70 br30>
                        <Text body className="font-bold">
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
                        <Text bodySmall gray400>{formatTimeDifference(event.timestamp, transactionLength.startTime, transactionLength.endTime)}</Text>
                        <Text bodySmall>{event.from}</Text>
                    </View>
                </Card>
            );
        }
    };

    return (
        <SafeAreaView className="flex flex-col w-full h-full pb-2 items-center justify-start">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex flex-col w-full h-full justify-between"
            >
                <ScrollView className="w-full">
                    {transactionData ?
                        <View className="flex flex-col px-4 pt-1 space-y-2 items-center justify-start">
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-col w-full p-4"
                                elevation={10}
                            >
                                <Text bodyLarge className="font-bold">Merchant</Text>
                                <View className="flex flex-row items-center justify-between">
                                    <TouchableRipple onPress={() => router.navigate(`/(transactionRoom)/merchant/${transactionData.merchantID}`)}>
                                        <View className="flex flex-row items-center space-x-3">
                                            <Avatar.Text label={getInitials(transactionData.merchantName)} size={35} />
                                            <View className="flex flex-col w-1/2">
                                                <Text body className="font-bold">{transactionData.merchantName}</Text>
                                                <Text bodySmall gray400>ID: 123123</Text>
                                                <View className="flex flex-row space-x-1 items-center">
                                                    <Ionicons name="thumbs-up-sharp" size={10} color={Colors.success500} />
                                                    <Text bodySmall>{merchantRating ? merchantRating.positive : 0}</Text>
                                                    <Ionicons name="thumbs-down-sharp" size={10} color={Colors.error500} />
                                                    <Text bodySmall>{merchantRating ? merchantRating.negative : 0}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableRipple>
                                    <View className="flex flex-col items-end justify-center">
                                        <Text body success400 className="font-bold">PHP {transactionData.total_amount}</Text>
                                        <Text caption gray400>Received</Text>
                                    </View>
                                </View>
                                <Divider className="my-2" />
                                <Text bodyLarge className="font-bold">Client</Text>
                                <View className="flex flex-row items-center justify-between">
                                    <TouchableRipple onPress={() => router.navigate(`/(transactionRoom)/merchant/${transactionData.clientID}`)}>
                                        <View className="flex flex-row items-center space-x-3">
                                            <Avatar.Text label={getInitials(transactionData.clientName)} size={35} />
                                            <View className="flex flex-col w-1/2">
                                                <Text body className="font-bold">{transactionData.clientName}</Text>
                                                <Text bodySmall gray400>ID: 123123</Text>
                                                <View className="flex flex-row space-x-1 items-center">
                                                    <Ionicons name="thumbs-up-sharp" size={10} color={Colors.success500} />
                                                    <Text bodySmall>{userRating ? userRating.positive : 0}</Text>
                                                    <Ionicons name="thumbs-down-sharp" size={10} color={Colors.error500} />
                                                    <Text bodySmall>{userRating ? userRating.negative : 0}</Text>
                                                </View>
                                            </View>
                                        </View>
                                    </TouchableRipple>

                                    <View></View>
                                    <View className="flex flex-col items-end justify-center">
                                        <Text body error400 className="font-bold">-PHP {transactionData.total_amount}</Text>
                                        <Text caption gray400>Sent</Text>
                                    </View>
                                </View>
                            </Card>
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-col w-full p-4"
                                elevation={10}
                            >
                                <View className="flex flex-row w-full items-center justify-between">
                                    <Text bodyLarge className="font-bold">Transaction Timeline</Text>
                                    <View className="flex flex-row gap-2 items-center justify-end">
                                        <Octicons name="clock" size={15} color={Colors.gray400} />
                                        {transactionLength ?
                                            <Text body gray400>{Math.round((transactionLength.endTime - transactionLength.startTime) / (1000 * 60))} mins</Text>
                                            :
                                            <Text body gray400>0 mins</Text>
                                        }
                                    </View>
                                </View>
                                <Divider className="my-2" />
                                <View className="flex flex-col items-start">
                                    {transactionTimeline && transactionLength && transactionTimeline.sort(
                                        (a, b) => Date.parse(a.timestamp) - Date.parse(b.timestamp)
                                    ).map((event, i) => {
                                        if (i == 0) {
                                            return (
                                                <Timeline
                                                    key={i}
                                                    bottomLine={{
                                                        type: Timeline.lineTypes.DASHED,
                                                        color: Colors.primary700,
                                                    }}
                                                    point={{
                                                        type: Timeline.pointTypes.CIRCLE,
                                                        color: Colors.primary700,
                                                    }}
                                                >
                                                    {renderTimelineContent(event, i)}
                                                </Timeline>
                                            )
                                        } else if (i > 0 && i < transactionTimeline.length - 1) {
                                            return (
                                                <Timeline
                                                    key={i}
                                                    topLine={{
                                                        state: Timeline.states.CURRENT
                                                    }}
                                                    bottomLine={{
                                                        state: Timeline.states.CURRENT,
                                                        color: Colors.primary700,
                                                    }}
                                                    point={{
                                                        type: Timeline.pointTypes.CIRCLE,
                                                        color: Colors.primary700,
                                                    }}
                                                >
                                                    {renderTimelineContent(event, i)}
                                                </Timeline>
                                            )
                                        } else {
                                            return (
                                                <Timeline
                                                    key={i}
                                                    topLine={{ 
                                                        type: Timeline.lineTypes.DASHED,
                                                    }}
                                                    point={{
                                                        type: Timeline.pointTypes.CIRCLE,
                                                        color: Colors.primary700,
                                                    }}
                                                >
                                                    {renderTimelineContent(event, i)}
                                                </Timeline>
                                            )
                                        }
                                    })}
                                </View>
                            </Card>
                        </View>
                        :
                        null
                    }
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
