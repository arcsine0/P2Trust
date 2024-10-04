import { FC, Dispatch, SetStateAction } from "react";
import { Icon, TouchableRipple, ActivityIndicator } from "react-native-paper";

import { View, Text, Button } from "react-native-ui-lib";

import { Image } from "expo-image";

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
}

const SendPaymentRoute: FC<SendPaymentRouteProps> = ({ disabled, paymentDetails, receipt, setReceipt, pickReceipt, sendPayment }) => {
    return (
        <View className="flex flex-col space-y-2 p-4 items-start justify-start">
            <Text bodyLarge className="font-bold">Payment Details</Text>
            <View className="flex flex-row w-full items-center justify-between">
                <Text body gray400>Requested Amount</Text>
                <Text body className="font-bold">
                    {
                        paymentDetails.currency === "PHP" ? "₱" :
                            paymentDetails.currency === "USD" ? "$" :
                                paymentDetails.currency === "EUR" ? "€" : "$"
                    }
                    {paymentDetails.amount}
                </Text>
            </View>
            <View className="flex flex-row w-full items-center justify-between">
                <Text body gray400>Platform</Text>
                <Text body className="font-bold">{paymentDetails.platform}</Text>
            </View>
            <View className="flex flex-row w-full items-center justify-between">
                <Text body gray400>Account Name</Text>
                <Text body className="font-bold">{paymentDetails.accountName}</Text>
            </View>
            <View className="flex flex-row w-full items-center justify-between">
                <Text body gray400>Account Number</Text>
                <Text body className="font-bold">{paymentDetails.accountNumber}</Text>
            </View>
            <View className="flex flex-col w-full space-y-1">
                <View className="flex flex-row w-full items-center justify-between">
                    <Text body gray400>Upload Receipt</Text>
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
                                <Text bodyLarge gray400>Upload Receipt</Text>
                            </View>
                        </TouchableRipple>
                        :
                        <Image
                            className="w-full"
                            source={{ uri: receipt.uri }}
                            contentFit="contain"
                        />
                    }
                </View>
            </View>
            <Button
                className="w-full rounded-lg"
                onPress={sendPayment}
                disabled={disabled}
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
        </View>
    )
}

export default SendPaymentRoute;