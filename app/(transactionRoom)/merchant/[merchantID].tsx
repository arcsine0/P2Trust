import { useState, useEffect, useRef } from "react";
import { View, FlatList, ScrollView, Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, Avatar, Chip, IconButton, Card, Button, Snackbar, DataTable } from "react-native-paper";

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

import { router, useLocalSearchParams } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";
import { getInitials, formatISODate } from "@/lib/helpers/functions";
import { TransactionListItem } from "@/lib/helpers/types";

import { Ionicons, Octicons } from "@expo/vector-icons";

export default function TransactionLobbyScreen() {
    const [roomID, setRoomID] = useState("");

    const [transactionList, setTransactionList] = useState<TransactionListItem[] | undefined>(undefined)

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
                                sender_name: userData.username,
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
        if (userData) {
            const { error } = await supabase
                .from("requests")
                .update({ status: "completed" })
                .eq("sender_id", userData.id);

            if (!error) {
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

    useEffect(() => {
        loadMerchantData();
        loadMerchantTransactions();
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
                        <View className="flex flex-col px-2 py-1 w-full h-full space-y-2 items-center justify-start">
                            <Card className="w-full" style={{ backgroundColor: theme.colors.background }}>
                                <Card.Content className="flex flex-col space-y-2 w-full justify-center items-start">
                                    <View className="flex flex-row items-center gap-5">
                                        <Avatar.Text label={getInitials(merchantData.username)} size={50} />
                                        <View className="flex">
                                            <Text variant="titleLarge" className="font-bold">{merchantData.username}</Text>
                                            <Text variant="bodyMedium" className="text-ellipsis">Merchant ID: 123123</Text>
                                            <View className="flex flex-row gap-1 items-center">
                                                <Ionicons name="thumbs-up-sharp" size={10} color={"#22c55e"} />
                                                <Text variant="bodySmall">0</Text>
                                                <Ionicons name="thumbs-down-sharp" size={10} color={"#ef4444"} />
                                                <Text variant="bodySmall">0</Text>
                                            </View>
                                        </View>
                                    </View>
                                    <View className="flex flex-row space-x-2 items-center justify-start">
                                        <Octicons name="clock" size={15} />
                                        <Text variant="bodyMedium">Online 5 mins ago</Text>
                                    </View>
                                </Card.Content>
                            </Card>
                            <Card className="w-full" style={{ backgroundColor: theme.colors.background }}>
                                <Card.Content className="flex flex-col space-y-2 w-full justify-center items-start">
                                    <Text variant="titleMedium" className="font-bold">Merchant Analytics</Text>
                                    <View className="flex flex-row items-center justify-center">
                                        <View className="flex flex-col w-1/2 items-start justify-center">
                                            <Text variant="bodyMedium">Total Transactions</Text>
                                            <Text variant="titleSmall" className="font-bold">{transactionList ? transactionList.length : 0}</Text>
                                        </View>
                                        <View className="flex flex-col w-1/2 items-start justify-center">
                                            <Text variant="bodyMedium">Average Volume</Text>
                                            <Text variant="titleSmall" className="font-bold">{transactionList ? transactionList.reduce((a, b) => a + b.total_amount, 0) / transactionList.length : 0}</Text>
                                        </View>
                                    </View>
                                </Card.Content>
                            </Card>
                            <Card className="w-full" style={{ backgroundColor: theme.colors.background }}>
                                <Card.Content className="flex flex-col space-y-1 w-full justify-center items-start">
                                    <Text variant="titleMedium" className="font-bold">Transaction History</Text>
                                    {transactionList ? transactionList.map((transaction) => (
                                        <Card
                                            key={transaction.id}
                                            className="w-full"
                                            style={{ backgroundColor: theme.colors.background }}
                                            onPress={() => router.navigate(`/transaction/${transaction.id}`)}
                                        >
                                            <Card.Content className="flex flex-row p-2 w-full items-center justify-between rounded-lg">
                                                <View className="flex flex-row space-x-2 items-center justify-start">
                                                    <Avatar.Text label={getInitials(transaction.clientName)} size={25} />
                                                    <View className="flex flex-col items-start justify-center">
                                                        <Text variant="bodyLarge" className="font-bold">{transaction.clientName}</Text>
                                                        <Text variant="bodySmall">{new Date(transaction.created_at).toLocaleDateString()}</Text>
                                                    </View>
                                                </View>
                                                <View className="flex flex-row items-center justify-end">
                                                    <View className="flex flex-col items-end justify-center">
                                                        <Text variant="bodySmall">Amount</Text>
                                                        <Text variant="bodyLarge" className="font-bold">{transaction.total_amount}</Text>
                                                    </View>
                                                </View>
                                            </Card.Content>
                                        </Card>
                                    )) : null}
                                </Card.Content>
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
                <View className="w-full px-2 flex flex-row space-x-1">
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
                        icon="cash-fast"
                        mode="contained"
                        onPress={() => transactModalRef.current?.present()}
                    >
                        Transact
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
                            <Text variant="titleMedium" className="font-bold mb-2">Transaction with {merchantData?.username}</Text>
                            {!joinVisible ?
                                <Button
                                    className="w-full rounded-lg"
                                    icon={"account-arrow-up"}
                                    mode="contained"
                                    onPress={() => requestTransaction()}
                                    disabled={requestDisabled}
                                >
                                    {requestState}
                                </Button>
                                :
                                <View className="flex flex-col w-full space-y-2 items-start justify-start">
                                    <View className="flex flex-col w-full px-4 py-2 items-center justify-center bg-slate-100 rounded-lg">
                                        <Text variant="bodyMedium" className="font-bold">Your position in queue</Text>
                                        <Text
                                            variant="bodyLarge"
                                            className="font-bold"
                                            style={{ color: theme.colors.primary }}
                                        >
                                            1
                                        </Text>
                                    </View>
                                    <Button
                                        className="w-full rounded-lg"
                                        icon={"account-arrow-up"}
                                        mode="contained"
                                        onPress={() => joinRoom()}
                                        disabled={joinDisabled}
                                    >
                                        {joinState}
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