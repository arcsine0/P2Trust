import { useState, useEffect, useRef } from "react";
import { FlatList, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Avatar, Snackbar, ActivityIndicator, IconButton } from "react-native-paper";

import { Colors, View, Text, Card, Button } from "react-native-ui-lib";

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

import { router, useNavigation, useLocalSearchParams } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";
import { getInitials, formatISODate } from "@/lib/helpers/functions";
import { TransactionListItem } from "@/lib/helpers/types";

import RatingsBar from "@/components/analytics/RatingBar";

import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";

export default function TransactionLobbyScreen() {
    const [roomID, setRoomID] = useState("");

    const [transactionList, setTransactionList] = useState<TransactionListItem[] | undefined>(undefined)
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
            const { data, error } = await supabase
                .from("transactions")
                .select("id, created_at, clientName, total_amount, status")
                .eq(`merchantID`, merchantID);

            if (!error && data) {
                setTransactionList(data);

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

    useEffect(() => {
        loadMerchantData();
        loadMerchantTransactions();
        getMerchantRatings();

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
                                    {ratings && (
                                        <RatingsBar
                                            positive={ratings.positive}
                                            negative={ratings.negative}
                                            total={ratings.total}
                                            height={20}
                                        />
                                    )}
                                </View>
                            </Card>
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-col w-full p-4 space-y-2 justify-center items-start"
                                elevation={10}
                            >
                                <Text bodyLarge className="font-bold">Merchant Analytics</Text>
                                <View className="flex flex-row items-center justify-center">
                                    <View className="flex flex-col w-1/2 items-start justify-center">
                                        <Text bodySmall>Transactions</Text>
                                        <Text bodyLarge className="font-bold">{transactionList ? transactionList.length : 0}</Text>
                                    </View>
                                    <View className="flex flex-col w-1/2 items-start justify-center">
                                        <Text bodySmall>Avg. Amount Vol.</Text>
                                        <Text bodyLarge className="font-bold">{transactionList ? transactionList.filter(transaction => transaction.status === "completed").reduce((a, b) => a + b.total_amount, 0) / transactionList.length : 0}</Text>
                                    </View>
                                </View>
                            </Card>
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-col w-full p-4 space-y-1 justify-center items-start"
                                elevation={10}
                            >
                                <Text bodyLarge className="font-bold">Transaction History</Text>
                                {transactionList ? transactionList.map((transaction) => (
                                    <Card
                                        key={transaction.id}
                                        style={{ backgroundColor: Colors.bgDefault }}
                                        onPress={() => {
                                            console.log("routing to: ", transaction.id)
                                            router.navigate(`/transaction/${transaction.id}`);
                                        }}
                                        className="flex flex-row p-4 w-full items-center justify-between rounded-lg"
                                        elevation={10}
                                    >
                                        <View className="flex flex-row space-x-2 items-center justify-start">
                                            <Avatar.Text label={getInitials(transaction.clientName)} size={25} />
                                            <View className="flex flex-col items-start justify-center">
                                                <Text body className="font-bold">{transaction.clientName}</Text>
                                                <Text caption style={{ color: Colors.gray500 }}>{new Date(transaction.created_at).toLocaleDateString()}</Text>
                                            </View>
                                        </View>
                                        <View className="flex flex-row items-center justify-end">
                                            <View className="flex flex-col items-end justify-center">
                                                <Text caption>Amount</Text>
                                                <Text body className="font-bold">{transaction.total_amount}</Text>
                                            </View>
                                        </View>
                                    </Card>
                                )) : null}
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
                <View className="w-full px-4 pt-2 flex flex-row space-x-1">
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