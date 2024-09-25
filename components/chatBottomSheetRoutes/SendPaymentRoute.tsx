import { FC, Dispatch, SetStateAction } from "react";
import { View, ViewStyle } from "react-native";
import { Text, Button, Icon, TouchableRipple } from "react-native-paper";
import { Image } from "expo-image";

import { ImagePickerAsset } from "expo-image-picker";

import { RequestDetails } from "@/lib/helpers/types";
import { PaymentPlatforms } from "@/lib/helpers/collections";

interface SendPaymentRouteProps {
    paymentDetails: RequestDetails;
    receipt: ImagePickerAsset | undefined;
    setReceipt: Dispatch<SetStateAction<ImagePickerAsset | undefined>>;
    pickReceipt: () => void;
    sendPayment: () => void;
}

const SendPaymentRoute: FC<SendPaymentRouteProps> = ({ paymentDetails, receipt, setReceipt, pickReceipt, sendPayment }) => {
    return (
        <View className="flex flex-col space-y-2 p-4 items-start justify-start">
            <Text variant="titleLarge" className="font-bold">Payment Details</Text>
            <View className="flex flex-row w-full items-center justify-between">
                <Text variant="bodySmall" className="text-slate-400">Requested Amount</Text>
                <Text variant="titleMedium" className="font-bold">
                    {
                        paymentDetails.currency === "PHP" ? "₱" :
                            paymentDetails.currency === "USD" ? "$" :
                                paymentDetails.currency === "EUR" ? "€" : "$"
                    }
                    {paymentDetails.amount}
                </Text>
            </View>
            <View className="flex flex-row w-full items-center justify-between">
                <Text variant="bodySmall" className="text-slate-400">Platform</Text>
                <Text variant="titleMedium" className="font-bold">{paymentDetails.platform}</Text>
            </View>
            <View className="flex flex-row w-full items-center justify-between">
                <Text variant="bodySmall" className="text-slate-400">Account Name</Text>
                <Text variant="titleMedium" className="font-bold">{paymentDetails.accountName}</Text>
            </View>
            <View className="flex flex-row w-full items-center justify-between">
                <Text variant="bodySmall" className="text-slate-400">Account Number</Text>
                <Text variant="titleMedium" className="font-bold">{paymentDetails.accountNumber}</Text>
            </View>
            <View className="flex flex-col w-full space-y-1">
                <View className="flex flex-row w-full items-center justify-between">
                    <Text variant="bodySmall" className="text-slate-400">Upload Receipt</Text>
                    <TouchableRipple onPress={() => setReceipt(undefined)}>
                        <View className="flex flex-row space-x-1 items-center justify-center">
                            <Icon
                                source="trash-can-outline"
                                size={15}
                                color={"#94a3b8"}
                            />
                            <Text variant="bodySmall" className="text-slate-400">Reset</Text>
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
                                <Text variant="titleSmall" className="text-slate-400">Upload Receipt</Text>
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
                className="rounded-lg w-full"
                icon={"information"}
                mode="contained"
                disabled={!receipt ? true : false}
                onPress={sendPayment}
            >
                Mark payment as sent
            </Button>
        </View>
    )
}

export default SendPaymentRoute;