import { FC, Dispatch, SetStateAction, useState } from "react";
import { Icon, TouchableRipple, ActivityIndicator, Divider } from "react-native-paper";

import { Colors, View, Text, Button, Image, Toast } from "react-native-ui-lib";

import { ImagePickerAsset } from "expo-image-picker";

import TextRecognition from "@react-native-ml-kit/text-recognition";

import { RequestDetails } from "@/lib/helpers/types";
import { parseDate } from "@/lib/helpers/functions";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { supabase } from "@/supabase/config";

interface SendPaymentRouteProps {
    disabled: boolean;
    paymentDetails: RequestDetails;
    receipt: ImagePickerAsset | undefined;
    setReceipt: Dispatch<SetStateAction<ImagePickerAsset | undefined>>;
    pickReceipt: () => void;
    sendPayment: (ref_num: string) => void;
    cancel: () => void;
}

const SendPaymentRoute: FC<SendPaymentRouteProps> = ({ disabled, paymentDetails, receipt, setReceipt, pickReceipt, sendPayment, cancel }) => {
    const [loadingState, setLoadingState] = useState<string>("Verifying...");
    const [isVerifying, setIsVerifying] = useState<boolean>(false);

    const [receiptError, setReceiptError] = useState<string>("");
    const [showReceiptError, setShowReceiptError] = useState<boolean>(false);

    const verifyReceipt = async () => {
        setLoadingState("Verifying...");
        setIsVerifying(true);

        if (receipt) {
            const ocrResult = await TextRecognition.recognize(receipt.uri);
            if (ocrResult) {
                const detectedTexts = ocrResult.blocks.map(block => block.text);

                const amountRegex = /P([1-9]\d{0,2}(?:,\d{3})?(?:\.\d{2})?)\b/;
                const dateRegex = /[A-Za-z]{3}\s\d{1,2},\s\d{4}\s\d{1,2}:\d{2}\s[APap][Mm]/;
                const refNumRegex = /\d{10}/;

                let receiptData = {
                    ref_num: "",
                    created_at: "",
                    amount: 0,
                }

                for (const text of detectedTexts) {
                    if (amountRegex.test(text)) {
                        const match = text.match(amountRegex);
                        if (match && match[1]) {
                            receiptData.amount = parseFloat(match[1].replace(",", ""));
                        }
                    } else if (dateRegex.test(text)) {
                        receiptData.created_at = parseDate(text)?.toISOString() || new Date().toISOString();
                    } else if (refNumRegex.test(text)) {
                        receiptData.ref_num = text;
                    }
                }

                // check date 
                const xHours = 8766; // for testing
                const timeDifferenceMs = Math.abs(new Date().getTime() - new Date(receiptData.created_at).getTime());
                const xHoursMs = xHours * 60 * 60 * 1000;

                if (timeDifferenceMs <= xHoursMs) {
                    if (receiptData.amount === paymentDetails.amount) {
                        const { data, error } = await supabase
                            .from("payments")
                            .select("id")
                            .eq("reference_number", receiptData.ref_num);

                        if (!error && data) {
                            if (data.length === 0) {
                                setLoadingState("Submitting...");
                                sendPayment(receiptData.ref_num);
                            } else {
                                setReceiptError("Receipt already exists.");
                                setShowReceiptError(true);
                            }
                        } else {
                            console.log(error);
                        }
                    } else {
                        setReceiptError("Receipt amount does not match with requested amount.");
                        setShowReceiptError(true);
                    }
                 } else {
                    setReceiptError("Receipt is too old.");
                    setShowReceiptError(true);
                }
            }
        }

        setIsVerifying(false);
    }

    return (
        <View className="flex flex-col space-y-2 p-4 items-start justify-start">
            <View className="flex flex-col w-full space-y-2">
                <Text bodyLarge className="font-bold">Payment Details</Text>
                <View className="flex flex-row w-full items-center justify-between">
                    <Text bodySmall gray400>Requested Amount</Text>
                    <Text bodySmall className="font-bold">
                        {
                            paymentDetails.currency === "PHP" ? "₱" :
                                paymentDetails.currency === "USD" ? "$" :
                                    paymentDetails.currency === "EUR" ? "€" : "$"
                        }
                        {paymentDetails.amount}
                    </Text>
                </View>
                <View className="flex flex-row w-full items-center justify-between">
                    <Text bodySmall gray400>Platform</Text>
                    <Text bodySmall className="font-bold">{paymentDetails.platform}</Text>
                </View>
                <View className="flex flex-row w-full items-center justify-between">
                    <Text bodySmall gray400>Account Name</Text>
                    <Text bodySmall className="font-bold">{paymentDetails.accountName}</Text>
                </View>
                <View className="flex flex-row w-full items-center justify-between">
                    <Text bodySmall gray400>Account Number</Text>
                    <Text bodySmall className="font-bold">{paymentDetails.accountNumber}</Text>
                </View>
                <View className="flex flex-col w-full space-y-1">
                    <View className="flex flex-row w-full items-center justify-between">
                        <Text bodySmall gray400>Upload Receipt</Text>
                        <TouchableRipple onPress={() => setReceipt(undefined)}>
                            <View className="flex flex-row space-x-1 items-center justify-center">
                                <Icon
                                    source="trash-can-outline"
                                    size={15}
                                    color={"#94a3b8"}
                                />
                                <Text caption gray400>Reset</Text>
                            </View>

                        </TouchableRipple>
                    </View>
                    <View className="flex flex-row w-full p-2 items-center justify-center border-2 border-dashed border-slate-499">
                        {!receipt ?
                            <TouchableRipple
                                className="flex flex-row w-full py-2 items-center justify-center"
                                onPress={() => pickReceipt()}
                            >
                                <View className="flex flex-row space-x-2 items-center justify-center">
                                    <Icon
                                        source="upload"
                                        size={20}
                                        color={"#94a3b8"}
                                    />
                                    <Text bodySmall gray400>Upload Receipt</Text>
                                </View>
                            </TouchableRipple>
                            :
                            <Image
                                className="w-full h-full"
                                source={{ uri: receipt.uri }}
                                resizeMode="contain"
                            />
                        }
                    </View>
                </View>
            </View>
            <View className="flex flex-col w-full space-y-2">
                <Button
                    className="w-full rounded-lg"
                    onPress={() => verifyReceipt()}
                    disabled={disabled || isVerifying || !receipt}
                >
                    {!disabled || isVerifying ?
                        <View className="flex flex-row space-x-2 items-center">
                            <MaterialCommunityIcons name="send" size={20} color={"white"} />
                            <Text buttonSmall white>Verify</Text>
                        </View>
                        :
                        <View className="flex flex-row space-x-2 items-center">
                            <ActivityIndicator animating={true} color="gray" />
                            <Text buttonSmall white>{loadingState}</Text>
                        </View>
                    }
                </Button>
                <Button
                    className="w-full rounded-lg"
                    style={{ backgroundColor: Colors.gray50 }}
                    outline={true}
                    outlineColor={Colors.gray900}
                    onPress={cancel}
                >
                    <Text buttonSmall gray900>Cancel</Text>
                </Button>
            </View>
            <Toast 
                visible={showReceiptError}
                message={receiptError}
                autoDismiss={2000}
                backgroundColor={Colors.error400}
                containerStyle={{ borderRadius: 8 }}
                onDismiss={() => setShowReceiptError(false)}
            />
        </View>
    )
}

export default SendPaymentRoute;