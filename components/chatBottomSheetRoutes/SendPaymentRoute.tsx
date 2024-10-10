import { FC, Dispatch, SetStateAction, useEffect } from "react";
import { Icon, TouchableRipple, ActivityIndicator, Divider } from "react-native-paper";

import { Colors, View, Text, Button, Image } from "react-native-ui-lib";

import { ImagePickerAsset } from "expo-image-picker";

import { RequestDetails } from "@/lib/helpers/types";
import { PaymentPlatforms } from "@/lib/helpers/collections";

import { MaterialCommunityIcons } from "@expo/vector-icons";

interface SendPaymentRouteProps {
    disabled: boolean;
    paymentDetails: RequestDetails;
    receipt: ImagePickerAsset | undefined;
    setReceipt: Dispatch<SetStateAction<ImagePickerAsset | undefined>>;
    pickReceipt: () => void;
    sendPayment: () => void;
    cancel: () => void;
}

const SendPaymentRoute: FC<SendPaymentRouteProps> = ({ disabled, paymentDetails, receipt, setReceipt, pickReceipt, sendPayment, cancel }) => {
    console.log(receipt?.uri);
    
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
                                source={{ uri: receipt.uri}}
                                resizeMode="contain"
                            />
                        }
                    </View>
                </View>
            </View>
            <View className="flex flex-col w-full space-y-2">
                <Button
                    className="w-full rounded-lg"
                    onPress={sendPayment}
                    disabled={disabled || !receipt}
                >
                    {!disabled ?
                        <View className="flex flex-row space-x-2 items-center">
                            <MaterialCommunityIcons name="send" size={20} color={"white"} />
                            <Text buttonSmall white>Send Payment</Text>
                        </View>
                        :
                        <View className="flex flex-row space-x-2 items-center">
                            <ActivityIndicator animating={true} color="gray" />
                            <Text buttonSmall white>Sending Payment...</Text>
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
        </View>
    )
}

export default SendPaymentRoute;