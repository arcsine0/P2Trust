import { useState, useEffect } from "react";
import { useWindowDimensions, Platform, KeyboardAvoidingView, ScrollView, Dimensions } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Avatar, Divider, IconButton, TouchableRipple, ActivityIndicator } from "react-native-paper";

import { Colors, View, Text, Card, Timeline, Dialog, TouchableOpacity, AnimatedImage, Image, Button } from "react-native-ui-lib";

import { router, useLocalSearchParams, useNavigation } from "expo-router";
import { setStringAsync } from "expo-clipboard";

import { supabase } from "@/supabase/config";

import { Transaction, TimelineEvent } from "@/lib/helpers/types";
import { CrucialSteps } from "@/lib/helpers/collections";
import { getInitials, formatISODate, formatTimeDifference } from "@/lib/helpers/functions";
import { useUserData } from "@/lib/context/UserContext";

import { Ionicons, MaterialCommunityIcons, Octicons } from "@expo/vector-icons";
import { TransactionEvent, UserEvent, PaymentEvent, PaymentStatusEvent, ProductStatusEvent } from "@/components/chatEvents/TimelineEvents";

export default function TransactionDetailsScreen() {
    const [dimensions, setDimensions] = useState<{
        width: number;
        height: number;
    }>({
        width: Dimensions.get("screen").width,
        height: Dimensions.get("screen").height,
    });

    const [transactionData, setTransactionData] = useState<Transaction | undefined>(undefined)
    const [transactionTimeline, setTransactionTimeline] = useState<TimelineEvent[] | undefined>(undefined);

    const [missingSteps, setMissingSteps] = useState<{
        event: string,
        label: string,
    }[] | undefined>(undefined);
    const [currentViewImage, setCurrentViewImage] = useState<string | undefined>("");

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

    const [showViewImageModal, setShowViewImageModal] = useState<boolean>(false);
    const [showFlagModal, setShowFlagModal] = useState<boolean>(false);

    const [isFlagged, setIsFlagged] = useState<boolean>(false);
    const [isFlagging, setIsFlagging] = useState<boolean>(false);

    const { transactionID } = useLocalSearchParams<{ transactionID: string }>();
    const { userData } = useUserData();

    const navigation = useNavigation();

    const viewReceiptImage = (uri: string | undefined) => {
        setCurrentViewImage(uri);
        setShowViewImageModal(true);
    }

    const addFlag = async () => {
        setIsFlagging(true);

        if (userData && transactionData) {
            const { error: flagError } = await supabase
                .from("transactions")
                .update({
                    flags: transactionData.flags + 1,
                    flagged_by: transactionData.flagged_by
                        ? [...transactionData.flagged_by.filter(id => id !== userData.id), userData.id]
                        : [userData.id]
                })
                .eq("id", transactionID);

            if (!flagError) {
                setIsFlagged(true);
                setIsFlagging(false);
                setShowFlagModal(false);
            } else {
                setIsFlagging(false);
                setShowFlagModal(false);
                console.log(flagError);
            }
        }
    }

    const removeFlag = async () => {
        setIsFlagging(true);

        if (userData && transactionData) {
            const { error: flagError } = await supabase
                .from("transactions")
                .update({
                    flags: transactionData.flags - 1,
                    flagged_by: [...transactionData.flagged_by.filter(id => id !== userData.id)]
                })
                .eq("id", transactionID);

            if (!flagError) {
                setIsFlagged(false);
                setIsFlagging(false);
                setShowFlagModal(false);
            } else {
                setIsFlagging(false);
                setShowFlagModal(false);
                console.log(flagError);
            }
        }
    }

    const getTransactionData = async () => {
        if (userData) {
            try {
                const { data, error } = await supabase
                    .from("transactions")
                    .select("*")
                    .eq("id", transactionID);

                if (!error && data) {
                    const timeline: TimelineEvent[] = JSON.parse(data[0].timeline);

                    const paymentSentCount = timeline.filter(event => event.type === "payment_sent").length;
                    const paymentConfirmationCount = timeline.filter(event =>
                        event.type === "payment_confirmed" || event.type === "payment_denied"
                    ).length;

                    const missingSteps = CrucialSteps.filter(crucialEvent => {
                        if (crucialEvent.label === "Confirmation of Payment") {
                            return paymentConfirmationCount < paymentSentCount;
                        } else {
                            return !timeline.some(event => event.type === crucialEvent.event);
                        }
                    }).map(event => ({ event: event.event, label: event.label }));

                    setMissingSteps(missingSteps);

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

                    if (data[0].flagged_by && data[0].flagged_by.includes(userData.id)) {
                        setIsFlagged(true);
                    } else {
                        setIsFlagged(false)
                    }

                    navigation.setOptions({
                        headerLeft: () => (
                            <View className="flex flex-col mt-4 mb-2 items-start justify-center">
                                <Text bodyLarge className="font-bold">Transaction Details</Text>
                                <TouchableOpacity onPress={async () => await setStringAsync(data[0].id)}>
                                    <Text bodySmall>ID: {data[0].id}</Text>
                                </TouchableOpacity>
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
    }

    useEffect(() => {
        getTransactionData();

        navigation.setOptions({
            headerRight: () => (
                <View className="flex flex-row">
                    <IconButton
                        icon={isFlagged ? "flag" : "flag-outline"}
                        onPress={() => setShowFlagModal(true)}
                    />
                </View>
            )
        });
    }, []);

    const renderTimelineContent = (event: TimelineEvent, index: number, anchorRef?: any) => {
        if (transactionLength) {
            switch (event.type) {
                case "transaction_started":
                case "transaction_completed":
                case "transaction_cancelled":
                    return (
                        <TransactionEvent
                            key={index}
                            ref={anchorRef}
                            type={event.type}
                            created_at={formatTimeDifference(event.timestamp, transactionLength.startTime, transactionLength.endTime)}
                            sender={event.from}
                        />
                    )
                case "user_joined":
                case "user_left":
                    return (
                        <UserEvent
                            key={index}
                            ref={anchorRef}
                            type={event.type}
                            created_at={formatTimeDifference(event.timestamp, transactionLength.startTime, transactionLength.endTime)}
                            sender={event.from}
                        />
                    )
                case "payment_requested":
                    return (
                        <PaymentEvent
                            key={index}
                            ref={anchorRef}
                            type={event.type}
                            created_at={formatTimeDifference(event.timestamp, transactionLength.startTime, transactionLength.endTime)}
                            sender={event.from}
                            recipient={""}
                            amount={event.data.amount}
                            currency={event.data.currency}
                            platform={event.data.platform}
                        />
                    )
                case "payment_sent":
                    return (
                        <PaymentEvent
                            key={index}
                            ref={anchorRef}
                            type={event.type}
                            created_at={formatTimeDifference(event.timestamp, transactionLength.startTime, transactionLength.endTime)}
                            sender={event.from}
                            recipient={event.recipient}
                            amount={event.data.amount}
                            currency={event.data.currency}
                            platform={event.data.platform}
                            proof={event.data.receiptURL}
                            onViewImage={() => viewReceiptImage(event.data.receiptURL)}
                        />
                    )
                case "payment_confirmed":
                case "payment_denied":
                    return (
                        <PaymentStatusEvent
                            key={index}
                            ref={anchorRef}
                            type={event.type}
                            created_at={formatTimeDifference(event.timestamp, transactionLength.startTime, transactionLength.endTime)}
                            sender={event.from}
                        />
                    )
                case "product_sent":
                case "product_received":
                    return (
                        <ProductStatusEvent
                            key={index}
                            ref={anchorRef}
                            type={event.type}
                            created_at={formatTimeDifference(event.timestamp, transactionLength.startTime, transactionLength.endTime)}
                            sender={event.from}
                        />
                    )
            }
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
                            {missingSteps && missingSteps.length > 0 && (
                                <Card
                                    style={{ backgroundColor: Colors.warning100 }}
                                    className="flex flex-row space-x-2 w-full p-4"
                                    elevation={10}
                                >
                                    <Ionicons name="warning-outline" size={20} colors={Colors.gray900} />
                                    <View className="flex flex-col flex-1 space-y-2">
                                        <Text bodyLarge className="font-bold">Missing Events</Text>
                                        <Text bodySmall>This transaction is missing <Text className="font-bold">{missingSteps.length}</Text> crucial steps:</Text>
                                        {missingSteps.map((step, i) => (
                                            <Text key={i} bodySmall>{`\u2022 ${step.label}`}</Text>
                                        ))}
                                    </View>
                                </Card>
                            )}
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
                <Dialog
                    visible={showViewImageModal}
                    onDismiss={() => setShowViewImageModal(false)}
                    panDirection="up"
                    width={dimensions.width}
                    height={dimensions.height}
                    containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8 }}
                >
                    <TouchableOpacity onPress={() => setShowViewImageModal(false)}>
                        <AnimatedImage
                            className="w-full h-full"
                            source={{ uri: currentViewImage }}
                            resizeMode="contain"
                            overlayType={Image.overlayTypes.BOTTOM}
                            customOverlayContent={(
                                <View className="flex flex-row w-full h-full items-end justify-center">
                                    <View
                                        className="mb-4 p-2"
                                    >
                                        <Text bodySmall bgDefault className="font-bold">Tap on Image to Close</Text>
                                    </View>
                                </View>
                            )}
                            loader={<ActivityIndicator animating={true} size={20} color={Colors.primary700} />}
                            animationDuration={500}
                        />
                    </TouchableOpacity>
                </Dialog>
                <Dialog
                    visible={showFlagModal}
                    panDirection="up"
                    onDismiss={() => setShowFlagModal(false)}
                    containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, padding: 4 }}
                >
                    <View className="flex flex-col w-full p-4 space-y-8">
                        <View className="flex flex-col w-full space-y-2">
                            <Text h3>Notice</Text>
                            <Text body>{isFlagged ? "Do you want to undo the flag?" : "Do you want to flag this transaction as possibly fraudulent?"}</Text>
                        </View>
                        <View className="flex flex-row w-full items-center justify-end space-x-2">
                            <Button
                                className="rounded-lg"
                                onPress={() => setShowFlagModal(false)}
                            >
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="close" size={20} color={"white"} />
                                    <Text buttonSmall white>Cancel</Text>
                                </View>
                            </Button>
                            <Button
                                className="rounded-lg"
                                disabled={isFlagging}
                                onPress={() => { isFlagged ? removeFlag() : addFlag() }}
                            >
                                {!isFlagging ?
                                    <View className="flex flex-row space-x-2 items-center">
                                        <MaterialCommunityIcons name={isFlagged ? "flag-remove" : "flag"} size={20} color={"white"} />
                                        <Text buttonSmall white>{isFlagged ? "Remove Flag?" : "Flag"}</Text>
                                    </View>
                                    :
                                    <View className="flex flex-row space-x-2 items-center">
                                        <ActivityIndicator animating={true} size={20} color="white" />
                                        <Text buttonSmall white>Submitting...</Text>
                                    </View>
                                }
                            </Button>
                        </View>
                    </View>
                </Dialog>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}
