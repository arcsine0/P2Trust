import { useState, useEffect, useRef } from "react";
import { FlatList, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Avatar, Snackbar, ActivityIndicator, IconButton } from "react-native-paper";

import { Colors, View, Text, Card, Button } from "react-native-ui-lib";

import { PieChart, LineChart } from "react-native-gifted-charts";

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

import { router, useNavigation, useLocalSearchParams } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";
import { getInitials, formatISODate } from "@/lib/helpers/functions";
import { Transaction } from "@/lib/helpers/types";

import RatingsBar from "@/components/analytics/RatingBar";
import { HistoryCard } from "@/components/transactionCards/HistoryCard";

import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";

import { Float } from "react-native/Libraries/Types/CodegenTypes";

export default function TransactionLobbyScreen() {
    const [roomID, setRoomID] = useState("");

    const [lastActive, setLastActive] = useState<Date | undefined>(undefined);
    const [totalTransactions, setTotalTransactions] = useState<number>(0);
    const [averageVolume, setAverageVolume] = useState<Float>(0);

    const [transactionList, setTransactionList] = useState<Transaction[] | undefined>(undefined)
    const [ratings, setRatings] = useState<{
        positive: number,
        negative: number,
        total: number,
    } | undefined>(undefined);

    const [requestState, setRequestState] = useState("Join Queue  ");
    const [requestDisabled, setRequestDisabled] = useState(false);
    const [requestSnackVisible, setRequestSnackVisible] = useState(false);

    const [joinState, setJoinState] = useState("Waiting for Host...");
    const [joinDisabled, setJoinDisabled] = useState(true);
    const [joinVisible, setJoinVisible] = useState(false);

    const { merchantID } = useLocalSearchParams<{ merchantID: string }>();

    const { userData } = useUserData();
    const { merchantData, setMerchantData, setRole } = useMerchantData();

    const transactModalRef = useRef<BottomSheetModal>(null);

    const theme = useTheme();
    const navigation = useNavigation();

    const requestsChannel = supabase.channel(`requests_channel_${merchantID}`);

    const renderDot = (size: number, color: string) => (
        <View
            style={{
                height: size,
                width: size,
                borderRadius: 10,
                backgroundColor: color,
            }}

        />
    )

    const requestTransaction = async () => {
        if (userData && merchantData) {
            requestsChannel
                .on("broadcast", { event: "queued" }, (payload) => {
                    const payloadData = payload.payload;

                    if (payloadData.sender_id === userData.id) {
                        transactModalRef.current?.snapToPosition("30%")

                        setRequestState("Queued");
                        setRequestDisabled(true);

                        setJoinVisible(true);
                        setJoinState("Queued");
                    }
                })
                .on("broadcast", { event: "accepted" }, (payload) => {
                    const payloadData = payload.payload;

                    if (payloadData.sender_id === userData.id) {
                        setRequestState("Request Accepted");
                        setJoinState("Join Room");
                        setJoinDisabled(false);

                        setRoomID(payloadData.room_id);
                    }
                })
                .on("broadcast", { event: "rejected" }, (payload) => {
                    const payloadData = payload.payload;

                    if (payloadData.sender_id === userData.id) {
                        transactModalRef.current?.snapToPosition("25%")

                        setRequestState("Join Queue  ");
                        setRequestDisabled(false);
                        setRequestSnackVisible(true);

                        setJoinVisible(false);
                        setJoinState("Waiting for Host...");
                        setJoinDisabled(true);
                    }
                })
                .subscribe((status) => {
                    if (status === "SUBSCRIBED") {
                        requestsChannel.send({
                            type: "broadcast",
                            event: "request",
                            payload: {
                                created_at: Date,
                                sender_id: userData.id,
                                sender_name: `${userData.firstname} ${userData.lastname}`,
                            }
                        }).then(() => {
                            setRequestState("Waiting for Host...");
                            setRequestDisabled(true);
                        });
                    }
                });
        }
    }

    const joinRoom = async () => {
        setJoinDisabled(true);

        if (userData) {
            const { error } = await supabase
                .from("requests")
                .update({ status: "completed" })
                .eq("sender_id", userData.id);

            if (!error) {
                setJoinDisabled(false);

                transactModalRef.current?.close();

                setRole("client");

                router.navigate(`/(transactionRoom)/room/${roomID}`);
            }
        }
    }

    const loadMerchantData = async () => {
        if (merchantID) {
            const { data, error } = await supabase
                .from("accounts")
                .select("*")
                .eq("id", merchantID);

            if (!error) {
                setMerchantData(data[0]);
            }
        }
    }

    const loadMerchantTransactions = async () => {
        if (merchantID) {
            const { data: transactionData, error } = await supabase
                .from("transactions")
                .select("*")
                .or(`merchantID.eq.${merchantID},clientID.eq.${merchantID}`)
                .order("created_at", { ascending: false });

            if (!error && transactionData) {
                setTransactionList(transactionData);
                setTotalTransactions(transactionData ? transactionData.length : 0);
                setAverageVolume(transactionData && transactionData.length > 0 ? parseFloat((transactionData.filter(transaction => transaction.status === "completed").reduce((a, b) => a + b.total_amount, 0) / transactionData.length).toFixed(2)) : 0);

            } else {
                console.log(error)
            }

        }
    }

    const getMerchantRatings = async () => {
        if (merchantID) {
            const { data, error } = await supabase
                .from("ratings")
                .select("*")
                .eq(`merchant_id`, merchantID);

            if (!error && data) {
                setRatings({
                    positive: data.filter((rating) => rating.rating === "UP").length,
                    negative: data.filter((rating) => rating.rating === "DOWN").length,
                    total: data.length,
                });
            } else {
                console.log("Ratings error: ", error);
            }
        }
    }

    const getMerchantLastActive = async () => {
        // if (merchantID) {
        //     const { data, error } = await supabase.auth.getSession()

        //     if (!error && data) {
        //         console.log(data);
        //     } else {
        //         console.log(error);
        //     }
        // }
    }

    useEffect(() => {
        loadMerchantData();
        loadMerchantTransactions();

        getMerchantRatings();
        getMerchantLastActive();

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

    return (
        <SafeAreaView className="flex flex-col w-full h-full pb-2 items-center justify-start">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex flex-col w-full h-full justify-between"
            >
                <ScrollView className="w-full">
                    {merchantData ?
                        <View className="flex flex-col px-4 py-1 w-full h-full space-y-2 items-center justify-start">
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-col w-full p-4 space-y-2 justify-center items-start"
                                elevation={10}
                            >
                                <View className="flex flex-row items-center gap-5">
                                    <Avatar.Text label={getInitials(merchantData.firstname)} size={50} />
                                    <View className="flex">
                                        <Text h4>{merchantData.firstname} {merchantData.lastname}</Text>
                                        <Text bodySmall className="text-ellipsis">Merchant ID: 123123</Text>
                                        <View className="flex flex-row space-x-2 items-center justify-start">
                                            <Octicons name="clock" size={10} />
                                            <Text bodySmall>Online 5 mins ago</Text>
                                        </View>
                                    </View>
                                </View>
                            </Card>
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-col w-full p-4 space-y-2"
                                elevation={10}
                            >
                                <Text bodyLarge className="font-bold">Client Ratings</Text>
                                <View className="flex items-center justify-center">
                                    {ratings && ratings.total > 0 ?
                                        <RatingsBar
                                            positive={ratings.positive}
                                            negative={ratings.negative}
                                            total={ratings.total}
                                            height={20}
                                        />
                                        :
                                        <View
                                            className="flex w-full px-2 py-4 space-y-1 items-center justify-center"
                                            style={{ backgroundColor: Colors.gray200 }}
                                        >
                                            <Text bodyLarge black className="font-semibold">No Ratings Yet</Text>
                                            <Text bodySmall black className="text-center">Only users who have transacted with the merchant can rate them.</Text>
                                        </View>
                                    }
                                </View>
                            </Card>
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-col w-full p-4 space-y-2 justify-center items-start"
                                elevation={10}
                            >
                                <Text bodyLarge className="font-bold">Merchant Analytics</Text>
                                {/* <View className="flex flex-row items-center justify-center">
                                    <View className="flex flex-col w-1/2 items-start justify-center">
                                        <Text bodySmall>Transactions</Text>
                                        <Text bodyLarge className="font-bold">{totalTransactions}</Text>
                                    </View>
                                    <View className="flex flex-col w-1/2 items-start justify-center">
                                        <Text bodySmall>Avg. Amount Vol.</Text>
                                        <Text bodyLarge className="font-bold">{averageVolume}</Text>
                                    </View>
                                </View> */}
                                <Text body className="font-bold">Transactions</Text>
                                {transactionList && (
                                    <View className="flex flex-row space-x-4 items-center justify-center">
                                        <PieChart
                                            data={[
                                                { value: transactionList.filter(transaction => transaction.status === "completed").length, color: Colors.success400 },
                                                { value: transactionList.filter(transaction => transaction.status === "cancelled").length, color: Colors.error400 },
                                            ]}
                                            donut
                                            sectionAutoFocus
                                            radius={70}
                                            innerRadius={45}
                                            innerCircleColor={Colors.bgDefault}
                                            centerLabelComponent={() => (
                                                <View className="flex flex-col space-y-1 items-center justify-center">
                                                    <Text h2 className="font-bold">{transactionList.length}</Text>
                                                    <Text caption className="font-bold">Total</Text>
                                                </View>
                                            )}
                                        />
                                        <View className="flex flex-col space-y-2">
                                            <View className="flex flex-row space-x-2 items-center">
                                                {renderDot(10, Colors.success400)}
                                                <Text bodySmall className="font-semibold">Completed</Text>
                                            </View>
                                            <View className="flex flex-row space-x-2 items-center">
                                                {renderDot(10, Colors.error400)}
                                                <Text bodySmall className="font-semibold">Cancelled</Text>
                                            </View>
                                            <View className="flex flex-row space-x-2 items-center">
                                                {renderDot(10, Colors.warning400)}
                                                <Text bodySmall className="font-semibold">Flagged</Text>
                                            </View>
                                        </View>
                                    </View>
                                )}
                                <Text body className="font-bold">Transaction Volume in PHP</Text>
                                {transactionList && (
                                    <LineChart
                                        data={transactionList.map(transaction => ({ value: transaction.total_amount, dataPointText: transaction.total_amount.toString() }))}
                                        width={250}
                                        height={150}
                                        color={Colors.primary500}
                                        thickness={3}
                                        dataPointsColor={Colors.primary700}
                                        isAnimated
                                        areaChart
                                        noOfSections={3}
                                        startFillColor={Colors.primary200}
                                        hideYAxisText
                                        maxValue={Math.max(...transactionList.map(transaction => transaction.total_amount)) + 100}
                                        focusEnabled
                                    />
                                )}
                                <Text body className="font-bold">Daily Activity</Text>
                                {transactionList && (
                                    <LineChart
                                        data={transactionList.reduce((acc, transaction) => {
                                            const date = new Date(transaction.created_at).toLocaleDateString();
                                            const existingDate = acc.find(item => item.date === date);

                                            if (existingDate) {
                                                existingDate.value++;
                                            } else {
                                                acc.push({ date, value: 1 });
                                            }

                                            return acc;
                                        }, [] as { date: string, value: number }[]).map(item => ({ value: item.value, dataPointText: item.value.toString() }))}
                                        width={250}
                                        height={100}
                                        color={Colors.primary500}
                                        thickness={3}
                                        dataPointsColor={Colors.primary700}
                                        isAnimated
                                        areaChart
                                        noOfSections={3}
                                        startFillColor={Colors.primary200}
                                        hideYAxisText
                                        maxValue={Math.max(...transactionList.reduce((acc, transaction) => {
                                            const date = new Date(transaction.created_at).toLocaleDateString();
                                            const existingDate = acc.find(item => item.date === date);

                                            if (existingDate) {
                                                existingDate.value++;
                                            } else {
                                                acc.push({ date, value: 1 });
                                            }

                                            return acc;
                                        }, [] as { date: string, value: number }[]).map(item => item.value)) + 2}
                                        focusEnabled
                                    />
                                )}
                            </Card>
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-col w-full p-4 space-y-1 justify-center items-start"
                                elevation={10}
                            >
                                <Text bodyLarge className="font-bold">Transaction History</Text>
                                <View className="flex flex-col w-full space-y-2">
                                    {userData && transactionList && transactionList.map((transaction) => (
                                        <HistoryCard
                                            transactionData={transaction}
                                            userID={userData.id}
                                            elevation={0}
                                            onPress={() => router.navigate(`/transaction/${transaction.id}`)}
                                        />
                                    ))}
                                    {transactionList && transactionList.length <= 0 && (
                                        <View
                                            style={{ backgroundColor: Colors.gray200 }}
                                            className="flex flex-col w-full px-10 py-20 space-y-1 items-center justify-center rounded-lg"
                                        >
                                            <Text bodyLarge black className="font-semibold">No Transactions Yet</Text>
                                        </View>
                                    )}
                                </View>
                            </Card>
                        </View>
                        : null}
                </ScrollView>
                <Snackbar
                    visible={requestSnackVisible}
                    onDismiss={() => setRequestSnackVisible(false)}
                    action={{
                        label: "Dismiss",
                        onPress: () => setRequestSnackVisible(false),
                    }}
                >
                    Invite Request Rejected or Expired
                </Snackbar>
                <View
                    className="w-full px-4 pt-2 flex flex-row space-x-1"
                    style={{ backgroundColor: Colors.bgDefault }}
                >
                    <Button
                        className="rounded-lg grow"
                        onPress={() => transactModalRef.current?.present()}
                    >
                        <View className="flex flex-row space-x-2 items-center">
                            <MaterialCommunityIcons name="cash-fast" size={20} color={"white"} />
                            <Text buttonSmall white>Transact</Text>
                        </View>
                    </Button>
                </View>
                <BottomSheetModal
                    ref={transactModalRef}
                    index={0}
                    snapPoints={["25%"]}
                    enablePanDownToClose={true}
                >
                    <BottomSheetView className="w-full h-full">
                        <View className="flex flex-col w-full px-4 py-2 items-start justify-start">
                            <Text bodyLarge className="font-bold mb-2">Transaction with {merchantData?.firstname}</Text>
                            {!joinVisible ?
                                <Button
                                    className="w-full rounded-lg"
                                    onPress={() => requestTransaction()}
                                    disabled={requestDisabled}
                                >
                                    {!requestDisabled ?
                                        <View className="flex flex-row space-x-2 items-center">
                                            <MaterialCommunityIcons name="account-arrow-up" size={20} color={"white"} />
                                            <Text buttonSmall white>{requestState}</Text>
                                        </View>
                                        :
                                        <View className="flex flex-row space-x-2 items-center">
                                            <ActivityIndicator animating={true} color="gray" />
                                            <Text buttonSmall white>{requestState}</Text>
                                        </View>
                                    }
                                </Button>
                                :
                                <View className="flex flex-col w-full space-y-2 items-start justify-start">
                                    <View className="flex flex-col w-full px-4 py-2 items-center justify-center bg-slate-100 rounded-lg">
                                        <Text body className="font-bold">Your position in queue</Text>
                                        <Text
                                            bodyLarge
                                            className="font-bold"
                                            style={{ color: Colors.primary800 }}
                                        >
                                            1
                                        </Text>
                                    </View>
                                    <Button
                                        className="w-full rounded-lg"
                                        onPress={() => joinRoom()}
                                        disabled={joinDisabled}
                                    >
                                        {!joinDisabled ?
                                            <View className="flex flex-row space-x-2 items-center">
                                                <MaterialCommunityIcons name="account-arrow-right" size={20} color={"white"} />
                                                <Text buttonSmall white>{joinState}</Text>
                                            </View>
                                            :
                                            <View className="flex flex-row space-x-2 items-center">
                                                <ActivityIndicator animating={true} color="gray" />
                                                <Text buttonSmall white>{joinState}</Text>
                                            </View>
                                        }
                                    </Button>
                                </View>
                            }
                        </View>
                    </BottomSheetView>
                </BottomSheetModal>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}