import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { ScrollView, StyleSheet, Platform } from "react-native";
import { Avatar, IconButton, ActivityIndicator } from "react-native-paper";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Colors, View, Text, Card, Button, TouchableOpacity, Dialog, Toast } from "react-native-ui-lib";

import { router, useNavigation } from "expo-router";
import { useCameraPermissions } from "expo-camera";

import { BottomSheetModal, BottomSheetView } from "@gorhom/bottom-sheet";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { useMerchantData } from "@/lib/context/MerchantContext";

import * as ImagePicker from "expo-image-picker";
import { scanFromURLAsync } from "expo-camera";

import { Request, WalletData } from "@/lib/helpers/types";
import { getInitials } from "@/lib/helpers/functions";

import { UserCard } from "@/components/userCards/UserCard";
import { WalletCard } from "@/components/userCards/WalletCard";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import QRCode from "react-qr-code";

const titles = [
    "Invite Requests",
    "Your QR Code",
    "Scan QR Code",
    "Upload QR Code",
    "Start Transaction",
    "Help"
];

const messages = [
    "View and manage invite requests from clients here.",
    "Share this QR code to clients to start a transaction as a merchant.",
    "Scan a client's QR code to start a transaction.",
    "Upload an image containing a client's QR code to start a transaction.",
    "Start a transaction with the currently queued client.",
    "Access help and support options here."
];

export default function TransactionHomeScreen() {
    const [showHint, setShowHint] = useState(false);
    const [showWalletsWarning, setShowWalletsWarning] = useState(false);

    const [QRError, setQRError] = useState<string>("");

    const { userData, setUserData, requests, setRequests, queue, setQueue } = useUserData();
    const { setMerchantData, setRole } = useMerchantData();

    const [joinRoomLoading, setJoinRoomLoading] = useState<boolean>(false);
    const [isWalletDeleting, setIsWalletDeleting] = useState<boolean>(false);

    const [showVerifyModal, setShowVerifyModal] = useState<boolean>(true);
    const [showDeleteWalletModal, setShowDeleteWalletModal] = useState<boolean>(false);

    const tutorialRef = useRef<any>(null);

    const navigation = useNavigation();
    const [permission, requestPermission] = useCameraPermissions();
    const insets = useSafeAreaInsets();

    const requestsModalRef = useRef<BottomSheetModal>(null);
    const walletsModalRef = useRef<BottomSheetModal>(null);

    const requestsChannel = supabase.channel(`requests_channel_${userData?.id}`);

    const acceptRequest = async (sender: string) => {
        if (requests) {
            requestsChannel.send({
                type: "broadcast",
                event: "queued",
                payload: {
                    sender_id: sender,
                }
            });

            const acceptedRequest = requests.find(req => req.sender_id === sender);

            if (acceptedRequest) {
                setQueue(prevQueue => {
                    if (prevQueue) {
                        return [acceptedRequest, ...prevQueue.filter(req => req.sender_id !== sender)];
                    } else {
                        return [acceptedRequest];
                    }
                });

                setRequests(prevRequests => {
                    if (prevRequests) {
                        return prevRequests.filter(req => req.sender_id !== sender)
                    } else {
                        return [];
                    }
                });
            }
        }

    }

    const rejectRequest = async (sender: string) => {
        requestsChannel.send({
            type: "broadcast",
            event: "rejected",
            payload: {
                sender_id: sender,
            }
        });

        setRequests(prevRequests => {
            if (prevRequests) {
                return prevRequests.filter(req => req.sender_id !== sender)
            } else {
                return [];
            }
        });
    }

    const createRoom = async () => {
        if (requests && queue && userData) {
            setJoinRoomLoading(true);

            const currentRequest = queue.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0];

            const { data: merchantData, error: merchantError } = await supabase
                .from("accounts")
                .select("*")
                .eq("id", currentRequest.sender_id);

            if (!merchantError && merchantData) {
                setMerchantData(merchantData[0]);

                const { data: transactionData, error: transactionError } = await supabase
                    .from("transactions")
                    .insert({
                        merchantID: userData.id,
                        merchantName: `${userData.firstname} ${userData.lastname}`,
                        clientID: currentRequest.sender_id,
                        clientName: currentRequest.sender_name,
                    })
                    .select()

                if (!transactionError && transactionData) {
                    requestsChannel.send({
                        type: "broadcast",
                        event: "accepted",
                        payload: {
                            sender_id: currentRequest.sender_id,
                            room_id: transactionData[0].id,
                        }
                    }).then(async () => {
                        setRole(currentRequest.sender_role === "client" ? "merchant" : "client");
                        setJoinRoomLoading(false);

                        router.navigate(`/(transactionRoom)/room/${transactionData[0].id}`);
                    });
                } else {
                    console.log("Transaction Error: ", transactionError);
                }
            }
        }
    }

    const loadMerchantData = async (qrValue: string) => {
        try {
            const qrData = JSON.parse(qrValue);

            try {
                if (qrData.auth === "P2Trust") {
                    const { data, error } = await supabase
                        .from("accounts")
                        .select("id")
                        .eq("id", qrData.id);

                    if (!error) {
                        router.navigate(`/(transactionRoom)/merchant/${qrData.id}`)
                    } else {
                        setQRError("Account of QR Code does not exist");
                    }
                } else {
                    setQRError("Invalid QR Code");
                }
            } catch (error) {
                setQRError("Invalid QR Code");
            }
        } catch (error) {
            setQRError("Scanned Image has no data");
        }
    }

    const scanQR = () => {
        if (permission && !permission.granted) {
            requestPermission().then(() => {
                if (permission.granted) {
                    router.navigate("/(transactionRoom)/scan");
                }
            });
        } else {
            router.navigate("/(transactionRoom)/scan");
        }
    }

    const pickImage = async () => {
        let result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            // allowsEditing: true,
            quality: 1,
        });

        if (result && result.assets && result.assets[0].uri) {
            try {
                const scannedResults = await scanFromURLAsync(result.assets[0].uri);

                if (scannedResults) {
                    loadMerchantData(scannedResults[0].data);
                } else {
                    setQRError("No QR found in image");
                }
            } catch (error) {
                setQRError("No QR found in image");
            }
        }
    }

    const deleteWallet = async () => {
        setIsWalletDeleting(true);

        if (userData && userData.wallets) {
            try {
                const { data: walletDataTemp, error: walletError } = await supabase
                    .from("wallets")
                    .select("*")
                    .eq("id", userData.wallets[0].id)

                if (!walletError && walletDataTemp) {
                    const walletData: WalletData = walletDataTemp[0];

                    const { data: accountData, error: accountError } = await supabase
                        .from("accounts")
                        .update(
                            {
                                wallets: []
                            }
                        )
                        .eq("id", userData?.id)
                        .select();

                    const { error: walletUpdateError } = await supabase
                        .from("wallets")
                        .update({
                            current_owners: walletData.current_owners?.filter(id => id !== userData?.id) || [],
                            previous_owners: walletData.previous_owners?.find(id => id === userData?.id) ? [...walletData.previous_owners, userData?.id] : [userData?.id],
                        })
                        .eq("id", walletData.id)

                    if (!accountError && !walletUpdateError && accountData) {
                        console.log(accountData);
                        setUserData(accountData[0]);
                        setShowDeleteWalletModal(false);
                    } else {
                        console.log(accountError);
                        console.log(walletUpdateError)
                    }
                } else {
                    console.log(walletError);
                }
            } catch (error) {
                console.log(error);
            }
        }

        setIsWalletDeleting(false);
    }

    useEffect(() => {
        if (userData) {
            setShowVerifyModal(userData.isVerified === false);
        }

        requestsChannel
            .on("broadcast", { event: "request" }, (payload) => {
                const payloadData = payload.payload;

                setShowHint(true);

                if (requests) {
                    setRequests([...requests?.filter(req => req.sender_id !== payload.data.sender_id) as Request[], payloadData])
                } else {
                    setRequests([payloadData]);
                }
            })
            .subscribe();

        return () => {
            setShowVerifyModal(false);
        };
    }, []);

    useLayoutEffect(() => {
        navigation.setOptions({
            header: () => (
                <View
                    className="flex flex-row w-full px-4 items-center justify-between"
                    style={styles.headerStyle}
                >
                    <UserCard
                        idStyle={{ width: "50%" }}
                        name={userData?.firstname || "N/A"}
                        id={userData?.id || "123123"}
                    />
                    <View className="flex flex-row">
                        <IconButton
                            ref={r => tutorialRef.current?.addTarget(r, "0")}
                            icon="account-plus-outline"
                            onPress={() => {
                                requestsModalRef.current?.present();
                                setShowHint(false);
                            }}
                        />

                        <IconButton
                            ref={r => tutorialRef.current?.addTarget(r, "5")}
                            icon="wallet-outline"
                            onPress={() => {
                                walletsModalRef.current?.present();
                            }}
                        />
                    </View>
                </View>
            ),
        });

        if (!userData?.wallets) {
            setShowWalletsWarning(true);
        }
    }, []);

    const styles = StyleSheet.create({
        headerStyle: {
            backgroundColor: Colors.bgDefault,
            paddingTop: insets.top + 4,
            paddingBottom: 4,

            ...Platform.select({
                ios: {
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.2,
                    shadowRadius: 4,
                },
                android: {
                    elevation: 4,
                },
            }),
        }
    });

    return (
        <SafeAreaView className="flex flex-col w-full h-full pb-2 items-start justify-start">
            {userData ?
                <View className="flex flex-col w-full h-full px-4 space-y-2 items-center justify-between">
                    <View className="flex flex-col flex-1 w-full space-y-2 items-center justify-center">
                        <Card
                            style={{ backgroundColor: Colors.bgDefault }}
                            className="flex flex-col w-full p-4 space-y-2"
                            elevation={10}
                        >
                            <View
                                ref={r => tutorialRef.current?.addTarget(r, "1")}
                                className="flex justify-center items-center border-2 rounded-lg p-5"
                            >
                                <QRCode
                                    size={256}
                                    className="h-auto w-full"
                                    value={JSON.stringify({
                                        auth: "P2Trust",
                                        id: userData.id
                                    })}
                                />
                            </View>
                            <Text bodySmall gray400 className="text-center">Share this QR code to start a transaction as a merchant</Text>
                        </Card>
                        {queue && queue.length > 0 ?
                            <Card
                                style={{ backgroundColor: Colors.bgDefault }}
                                className="flex flex-row w-full p-4 items-center justify-between"
                                elevation={10}
                            >
                                <Text body className="font-bold">Current Client</Text>
                                <View className="flex flex-row space-x-2 items-center justify-start">
                                    <Avatar.Text label={getInitials(queue.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0].sender_name)} size={20} />
                                    <Text bodySmall className="font-semibold">{queue.sort((a, b) => b.created_at.getTime() - a.created_at.getTime())[0].sender_name}</Text>
                                </View>
                            </Card>
                            :
                            null
                        }
                    </View>
                    <View className="flex flex-col w-full space-y-2">
                        <View className="flex flex-row space-x-2 items-center">
                            <Button
                                ref={r => tutorialRef.current?.addTarget(r, "2")}
                                className="flex-1 rounded-lg"
                                style={{ backgroundColor: Colors.gray50 }}
                                outline={true}
                                outlineColor={Colors.gray900}
                                disabled={!userData?.wallets}
                                onPress={() => scanQR()}
                            >
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="qrcode-scan" size={20} color={"black"} />
                                    <Text buttonSmall black>Scan QR Code</Text>
                                </View>
                            </Button>
                            <Button
                                ref={r => tutorialRef.current?.addTarget(r, "3")}
                                className="flex-1 rounded-lg"
                                style={{ backgroundColor: Colors.gray50 }}
                                outline={true}
                                outlineColor={Colors.gray900}
                                disabled={!userData?.wallets}
                                onPress={() => pickImage()}
                            >
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="file-upload" size={20} color={"black"} />
                                    <Text buttonSmall black>Upload QR</Text>
                                </View>
                            </Button>
                        </View>
                        <Button
                            ref={r => tutorialRef.current?.addTarget(r, "4")}
                            className="rounded-lg"
                            disabled={!joinRoomLoading && queue && queue.length > 0 ? false : true || !userData?.wallets}
                            onPress={() => createRoom()}
                        >
                            {!joinRoomLoading ?
                                <View className="flex flex-row space-x-2 items-center">
                                    <Text buttonSmall white>Start Transaction</Text>
                                    <MaterialCommunityIcons name="arrow-right" size={20} color={"white"} />
                                </View>
                                :
                                <View className="flex flex-row space-x-2 items-center">
                                    <ActivityIndicator animating={true} size={20} color="white" />
                                    <Text buttonSmall white>Joining Room...</Text>
                                </View>
                            }
                        </Button>
                    </View>
                    <BottomSheetModal
                        ref={requestsModalRef}
                        index={0}
                        snapPoints={["45%"]}
                        enablePanDownToClose={true}
                    >
                        <BottomSheetView>
                            <View className="flex flex-col w-full px-4 py-2 space-y-2 items-start justify-start">
                                <Text h3>Invite Requests</Text>
                                {requests && requests.length > 0 ?
                                    <ScrollView>
                                        <View className="flex flex-col w-full space-y-2 ">
                                            {requests.sort((a, b) => b.created_at.getTime() - a.created_at.getTime()).map((req, i) => (
                                                <Card key={i}
                                                    style={{ backgroundColor: Colors.bgDefault }}
                                                    className="flex flex-row w-full p-4 justify-between items-center"
                                                    elevation={10}
                                                >
                                                    <View className="flex flex-row items-center space-x-3">
                                                        <Avatar.Text label={getInitials(req.sender_name)} size={35} />
                                                        <View className="flex flex-col items-start justify-center">
                                                            <Text bodyLarge className="font-bold">{req.sender_name}</Text>
                                                            <Text caption className="font-bold">{req.sender_role === "client" ? "BUYER" : "SELLER"}</Text>
                                                        </View>
                                                    </View>
                                                    <View className="flex flex-row items-center justify-center">
                                                        <IconButton
                                                            icon="check"
                                                            mode="contained"
                                                            iconColor={Colors.primary700}
                                                            size={20}
                                                            onPress={() => acceptRequest(req.sender_id)}
                                                        />
                                                        <IconButton
                                                            icon="trash-can"
                                                            mode="contained"
                                                            iconColor={Colors.primary700}
                                                            size={20}
                                                            onPress={() => rejectRequest(req.sender_id)}
                                                        />
                                                    </View>
                                                </Card>
                                            ))}
                                        </View>
                                    </ScrollView>
                                    :
                                    <View
                                        style={{ backgroundColor: Colors.gray200 }}
                                        className="flex flex-col w-full px-10 py-20 space-y-1 items-center justify-center rounded-lg"
                                    >
                                        <Text bodyLarge black className="font-semibold">No Invite Requests</Text>
                                        <Text bodySmall black className="text-center">Ask clients to scan your QR and start transaction</Text>
                                    </View>
                                }
                            </View>
                        </BottomSheetView>
                    </BottomSheetModal>
                    <BottomSheetModal
                        ref={walletsModalRef}
                        index={0}
                        snapPoints={["45%"]}
                        enablePanDownToClose={true}
                    >
                        <BottomSheetView>
                            <View className="flex flex-col w-full px-4 py-2 space-y-2 items-start justify-start">
                                <View className="flex flex-row w-full items-center justify-between">
                                    <Text h3>Active Wallets</Text>
                                    <View className="flex flex-row space-x-1 items-center">
                                        {userData.wallets && userData.wallets.length ?
                                            <IconButton
                                                icon="trash-can-outline"
                                                onPress={() => { 
                                                    walletsModalRef.current?.dismiss();
                                                    setShowDeleteWalletModal(true);
                                                }}
                                            />
                                            :
                                            <IconButton
                                                icon="wallet-plus-outline"
                                                onPress={() => {
                                                    walletsModalRef.current?.dismiss();
                                                    router.navigate("/(transactionRoom)/wallet");
                                                }}
                                            />
                                        }
                                    </View>
                                </View>
                                {userData.wallets && userData.wallets.length > 0 ?
                                    <ScrollView>
                                        <View className="flex flex-col w-full space-y-2 ">
                                            {userData.wallets.map((wallet, i) => (
                                                <WalletCard
                                                    key={wallet.id}
                                                    walletData={wallet}
                                                    onPress={() => {
                                                        walletsModalRef.current?.dismiss();
                                                        router.push(`/wallet/${wallet.id}`);
                                                    }}
                                                />
                                            ))}
                                        </View>
                                    </ScrollView>
                                    :
                                    <View
                                        style={{ backgroundColor: Colors.gray200 }}
                                        className="flex flex-col w-full px-10 py-20 space-y-1 items-center justify-center rounded-lg"
                                    >
                                        <Text bodyLarge black className="font-semibold">No Active Wallets</Text>
                                        <Text bodySmall black className="text-center">Add wallets using the add button above to bind wallets to your account.</Text>
                                    </View>
                                }
                            </View>
                        </BottomSheetView>
                    </BottomSheetModal>
                </View>
                : null}
            <Dialog
                visible={userData?.isVerified === false && showVerifyModal}
                ignoreBackgroundPress={true}
                panDirection="up"
                containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, padding: 4 }}
            >
                <View
                    className="flex flex-col w-full p-4 space-y-8"
                >
                    <View className="flex flex-col w-full space-y-2">
                        <Text h3>Warning</Text>
                        <Text body>You cannot start a transaction with other users until you have verified your ID. Would you like to verify your ID now?</Text>
                    </View>
                    <View className="flex flex-row w-full items-center justify-end space-x-2">
                        <Button
                            className="rounded-lg"
                            onPress={() => router.back()}
                        >
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="arrow-left" size={20} color={"white"} />
                                <Text buttonSmall white>Go back</Text>
                            </View>
                        </Button>
                        <Button
                            className="rounded-lg"
                            onPress={() => {
                                setShowVerifyModal(false);
                                router.navigate("/(transactionRoom)/verify");
                            }}
                        >
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="thumb-up-outline" size={20} color={"white"} />
                                <Text buttonSmall white>Verify now</Text>
                            </View>
                        </Button>
                    </View>
                </View>
            </Dialog>
            <Dialog
                visible={showDeleteWalletModal}
                ignoreBackgroundPress={true}
                panDirection="up"
                containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, padding: 4 }}
            >
                <View
                    className="flex flex-col w-full p-4 space-y-8"
                >
                    <View className="flex flex-col w-full space-y-2">
                        <Text h3>Warning</Text>
                        <Text body>Are you sure that you want to unbind the wallet set to your account?</Text>
                    </View>
                    <View className="flex flex-row w-full items-center justify-end space-x-2">
                    <Button
                                className="rounded-lg"
                                style={{ backgroundColor: Colors.gray50 }}
                                outline={true}
                                outlineColor={Colors.gray900}
                                onPress={() => setShowDeleteWalletModal(false)}
                            >
                                <Text buttonSmall gray900>Cancel</Text>
                            </Button>
                        <Button
                            className="rounded-lg"
                            onPress={() => {
                                setShowDeleteWalletModal(false);
                                deleteWallet();
                            }}
                            disabled={isWalletDeleting}
                        >
                            {!isWalletDeleting ?
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={"white"} />
                                    <Text buttonSmall white>Delete</Text>
                                </View>
                                :
                                <View className="flex flex-row space-x-2 items-center">
                                    <ActivityIndicator animating={true} size={20} color="white" />
                                    <Text buttonSmall white>Deleting...</Text>
                                </View>
                            }

                        </Button>
                    </View>
                </View>
            </Dialog>

            <Toast
                visible={showHint}
                message={"A user has sent you an invite request."}
                position={'top'}
                action={{
                    label: "Open",
                    onPress: () => {
                        requestsModalRef.current?.present();
                        setShowHint(false);
                    },
                }}
                onDismiss={() => setShowHint(false)}
            />
            <Toast
                visible={showWalletsWarning}
                backgroundColor={Colors.error600}
                message={"No primary wallet set yet"}
                position={'top'}
                action={{
                    label: "Set",
                    onPress: () => {
                        walletsModalRef.current?.present();
                    },
                }}
                onDismiss={() => setShowHint(false)}
            />
        </SafeAreaView>
    );
}

