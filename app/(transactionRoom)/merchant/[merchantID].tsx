import { useState, useEffect, useRef } from "react";

import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import { Platform, KeyboardAvoidingView, StyleSheet, StatusBar } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { useTheme, Avatar, Snackbar, ActivityIndicator, IconButton } from "react-native-paper";

import { Colors, View, Text, Card, Button, Marquee, MarqueeDirections, TouchableOpacity } from "react-native-ui-lib";

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

import { router, useNavigation, useLocalSearchParams } from "expo-router";
import { setStringAsync } from "expo-clipboard";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";
import { getInitials, formatISODate } from "@/lib/helpers/functions";
import { Transaction } from "@/lib/helpers/types";

import { UserCard } from "@/components/userCards/UserCard";

import { MerchantAnalytics } from "./MerchantAnalytics";
import { MerchantRatings } from "./MerchantRatings";
import { MerchantHistory } from "./MerchantHistory";

import { MaterialCommunityIcons, Octicons } from "@expo/vector-icons";

import { Float } from "react-native/Libraries/Types/CodegenTypes";

export default function MerchantInfoScreen() {
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

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const requestsChannel = supabase.channel(`requests_channel_${merchantID}`);

    const Tab = createMaterialTopTabNavigator();

    const MerchantAnalyticsScreen = () => (
        <MerchantAnalytics transactionList={transactionList} />
    )

    const MerchantRatingsScreen = () => (
        <MerchantRatings ratings={ratings} />
    )

    const MerchantHistoryScreen = () => (
        <MerchantHistory userData={userData} transactionList={transactionList} />
    )

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

            if (!error && data) {
                setMerchantData(data[0]);

                navigation.setOptions({
                    header: () => (
                        <View
                            className="flex flex-row w-full px-4 items-center justify-between"
                            style={styles.headerStyle}
                        >
                            <UserCard
                                idStyle={{ width: "50%" }}
                                name={data[0]?.firstname || "N/A"}
                                id={data[0]?.id || "123123"}
                            />
                            <View className="flex flex-row">
                                <IconButton
                                    icon="dots-vertical"
                                    onPress={() => {}}
                                />
                            </View>
                        </View>
                    ),
                });
            } else {
                console.log(error);
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
        // getMerchantLastActive();
    }, []);

    const styles = StyleSheet.create({
        headerStyle: {
            backgroundColor: Colors.bgDefault,
            paddingTop: insets.top + 4,
            paddingBottom: 4,
        }
    });

    return (
        <SafeAreaView className="flex flex-col w-full h-full pb-2 items-center justify-start">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex flex-col w-full h-full justify-between"
            >
                <Tab.Navigator>
                    <Tab.Screen name="Analytics" component={MerchantAnalyticsScreen} />
                    <Tab.Screen name="Ratings" component={MerchantRatingsScreen} />
                    <Tab.Screen name="History" component={MerchantHistoryScreen} />
                </Tab.Navigator>
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