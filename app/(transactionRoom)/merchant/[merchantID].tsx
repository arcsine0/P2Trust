import { useState, useEffect, useRef } from "react";

import { createMaterialTopTabNavigator } from "@react-navigation/material-top-tabs";

import { Platform, KeyboardAvoidingView, StyleSheet } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Snackbar, ActivityIndicator, IconButton } from "react-native-paper";

import { Colors, View, Text, Button, Picker, PickerModes, Dialog } from "react-native-ui-lib";

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

import { router, useNavigation, useLocalSearchParams } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";
import { RequestRoles } from "@/lib/helpers/collections";

import { UserCard } from "@/components/userCards/UserCard";

import { MerchantAnalytics } from "./MerchantAnalytics";
import { MerchantRatings } from "./MerchantRatings";
import { MerchantHistory } from "./MerchantHistory";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Ratings, Rating } from "@/lib/helpers/types";

export default function MerchantInfoScreen() {
    const [roomID, setRoomID] = useState("");

    const [requestRole, setRequestRole] = useState<string | undefined>("Buyer")

    const [requestState, setRequestState] = useState("Join Queue  ");
    const [requestDisabled, setRequestDisabled] = useState(false);
    const [requestSnackVisible, setRequestSnackVisible] = useState(false);

    const [joinState, setJoinState] = useState("Waiting for Host...");
    const [joinDisabled, setJoinDisabled] = useState(true);
    const [joinVisible, setJoinVisible] = useState(false);

    const [showWarningModal, setShowWarningModal] = useState<boolean>(false);

    const { merchantID } = useLocalSearchParams<{ merchantID: string }>();

    const { userData, transactionIDs } = useUserData();
    const { merchantData, ratings, setTransactions, setRatings, setMerchantData, setRole } = useMerchantData();

    const transactModalRef = useRef<BottomSheetModal>(null);

    const insets = useSafeAreaInsets();
    const navigation = useNavigation();

    const requestsChannel = supabase.channel(`requests_channel_${merchantID}`);

    const Tab = createMaterialTopTabNavigator();

    const sendRequest = () => {
        if (ratings) {
            const tags = ratings.merchant?.tags.map(tag => tag.tag);

            if (tags?.includes("Scam")) {
                setShowWarningModal(true);
            } else {
                requestTransaction();
            }
        }
    }

    const requestTransaction = async () => {
        if (userData && merchantData) {
            setShowWarningModal(false);
            
            requestsChannel
                .on("broadcast", { event: "queued" }, (payload) => {
                    const payloadData = payload.payload;

                    if (payloadData.sender_id === userData.id) {
                        transactModalRef.current?.snapToPosition("40%")

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
                        transactModalRef.current?.snapToPosition("30%")

                        setRequestState("Join Queue  ");
                        setRequestDisabled(false);
                        setRequestSnackVisible(true);

                        setJoinVisible(false);
                        setJoinState("Waiting for Host...");
                        setJoinDisabled(true);

                        requestsChannel.unsubscribe();
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
                                sender_role: requestRole === "Buyer" ? "client" : "merchant",
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

                setRole(requestRole === "Buyer" ? "client" : "merchant");

                router.push(`/(transactionRoom)/room/${roomID}`);
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
                                    onPress={() => { }}
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

            if (!error && transactionData && transactionIDs) {
                setTransactions(transactionData);
                // setTotalTransactions(transactionData ? transactionData.length : 0);
                // setAverageVolume(transactionData && transactionData.length > 0 ? parseFloat((transactionData.filter(transaction => transaction.status === "completed").reduce((a, b) => a + b.total_amount, 0) / transactionData.length).toFixed(2)) : 0);

            } else {
                console.log(error)
            }

        }
    }

    const getMerchantRatings = async () => {
        if (merchantID) {
            const { data, error } = await supabase
                .from("ratings")
                .select(`*`)
                .eq("target_id", merchantID);

            if (!error && data && transactionIDs) {
                const filteredData: Rating[] = data.filter((rating) => rating.transaction_id !== null && transactionIDs.includes(rating.transaction_id));
                const merchantRatings: Rating[] = filteredData.filter((rating) => rating.type === "seller");
                const clientRatings: Rating[] = filteredData.filter((rating) => rating.type === "buyer");

                setRatings({
                    merchant: {
                        positive: merchantRatings.filter((rating) => rating.rating === "UP").length,
                        negative: merchantRatings.filter((rating) => rating.rating === "DOWN").length,
                        total: merchantRatings.length,
                        tags: merchantRatings.reduce((acc, curr) => {
                            curr.tags.forEach((tag: string) => {
                                const existingTag = acc.find(t => t.tag === tag);
                                if (existingTag) {
                                    existingTag.count++;
                                } else {
                                    acc.push({ tag, count: 1, type: curr.rating === "UP" ? "Positive" : "Negative" });
                                }
                            });
                            return acc;
                        }, [] as { tag: string; count: number; type: "Positive" | "Negative" }[]),
                        list: merchantRatings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
                    },
                    client: {
                        positive: clientRatings.filter((rating) => rating.rating === "UP").length,
                        negative: clientRatings.filter((rating) => rating.rating === "DOWN").length,
                        total: clientRatings.length,
                        tags: clientRatings.reduce((acc, curr) => {
                            curr.tags.forEach((tag: string) => {
                                const existingTag = acc.find(t => t.tag === tag);
                                if (existingTag) {
                                    existingTag.count++;
                                } else {
                                    acc.push({ tag, count: 1, type: curr.rating === "UP" ? "Positive" : "Negative" });
                                }
                            });
                            return acc;
                        }, [] as { tag: string; count: number; type: "Positive" | "Negative" }[]),
                        list: clientRatings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()),
                    },
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
                <Tab.Navigator
                    screenOptions={() => ({
                        tabBarActiveTintColor: Colors.primary700,
                        tabBarInactiveTintColor: Colors.gray500,
                        tabBarPressColor: Colors.gray200,
                        tabBarBounces: true,
                    })}
                >
                    <Tab.Screen name="Analytics" component={MerchantAnalytics} />
                    <Tab.Screen name="Ratings" component={MerchantRatings} />
                    <Tab.Screen name="History" component={MerchantHistory} />
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
                {userData && merchantID !== userData.id &&
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
                }
                <Dialog
                    visible={showWarningModal}
                    onDismiss={() => setShowWarningModal(false)}
                    panDirection="up"
                    containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, padding: 4 }}
                >
                    <View
                        className="flex flex-col w-full p-4 space-y-4"
                    >
                        <Text h3>Warning</Text>
                        <Text body>This merchant has history of possibly fraudulent transactions.</Text>
                        <View className="flex flex-row w-full items-center justify-end space-x-2">
                            <Button
                                className="rounded-lg"
                                onPress={() => setShowWarningModal(false)}
                            >
                                <View className="flex flex-row space-x-2 items-center">
                                    <Text buttonSmall white>Cancel</Text>
                                </View>
                            </Button>
                            <Button
                                className="rounded-lg"
                                style={{ backgroundColor: Colors.gray50 }}
                                outline={true}
                                outlineColor={Colors.gray900}
                                onPress={() => requestTransaction()}
                            >
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="thumb-up-outline" size={20} color={Colors.gray900} />
                                    <Text buttonSmall gray900>Continue</Text>
                                </View>
                            </Button>
                        </View>
                    </View>
                </Dialog>
                <BottomSheetModal
                    ref={transactModalRef}
                    index={0}
                    snapPoints={["30%"]}
                    enablePanDownToClose={true}
                >
                    <BottomSheetView className="w-full h-full">
                        <View className="flex flex-col w-full px-4 py-2 space-y-2 items-start justify-start">
                            <Text bodyLarge className="font-bold">Transaction with {merchantData?.firstname}</Text>
                            <Text bodySmall gray900 className="font-bold">Transact as a:</Text>
                            <View className="w-full" style={{ backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 13, elevation: 2 }}>
                                <Picker
                                    value={requestRole}
                                    mode={PickerModes.SINGLE}
                                    useDialog={true}
                                    customPickerProps={{ migrateDialog: true, disabled: requestDisabled }}
                                    trailingAccessory={<MaterialCommunityIcons name="chevron-down" size={20} color={Colors.gray900} />}
                                    onChange={value => setRequestRole(value?.toString())}
                                >
                                    {RequestRoles.map((pl, i) => (
                                        <Picker.Item key={i} label={pl.label} value={pl.value} />
                                    ))}
                                </Picker>
                            </View>
                            {!joinVisible ?
                                <Button
                                    className="w-full rounded-lg"
                                    onPress={() => sendRequest()}
                                    disabled={requestDisabled || requestRole === undefined}
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