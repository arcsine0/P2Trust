import { useState, useEffect, forwardRef, ForwardRefRenderFunction } from "react";
import { ViewStyle } from "react-native";

import { Colors, View, Text, Card, Button, Hint, TouchableOpacity } from "react-native-ui-lib";
import { Float } from "react-native/Libraries/Types/CodegenTypes";

import { router } from "expo-router";

import { WalletData } from "@/lib/helpers/types";

import { MaterialCommunityIcons, Ionicons } from "@expo/vector-icons";

interface TransactionEventProps {
    type: string;
    created_at: string;
    sender: string;
}

interface UserEventProps {
    type: string;
    created_at: string;
    sender: string;
}

interface PaymentEventProps {
    type: string;
    created_at: string;
    sender: string;
    recipient: string | undefined;
    amount: Float | undefined;
    wallet: WalletData | undefined;
    currency: string | undefined;
    platform: string | undefined;
    proof?: string | undefined;
    onViewImage?: () => void;
}

interface PaymentStatusEventProps {
    type: string;
    created_at: string;
    sender: string;
}

interface ProductStatusEventProps {
    type: string;
    created_at: string;
    sender: string;
}

const TransactionEventTemp: ForwardRefRenderFunction<typeof View, TransactionEventProps> = ({ type, created_at, sender }, ref) => {
    let title;

    switch (type) {
        case "transaction_started":
            title = "Transaction Started";
            break;
        default:
        case "transaction_completed":
            title = "Transaction Ended";
            break;
        case "transaction_cancelled":
            title = "Transaction Cancelled";
            break;
    }

    return (
        <Card padding-page ref={ref}>
            <View
                style={{ backgroundColor: Colors.gray100 }}
                className="flex flex-col w-full p-2 space-y-1 rounded-lg"
            >
                <Text body className="font-bold">{title}</Text>
                <Text bodySmall gray400>{created_at}</Text>
                <Text bodySmall>Initiated by: <Text className="font-bold">{sender}</Text></Text>
            </View>
        </Card>
    )
}

const UserEventTemp: ForwardRefRenderFunction<typeof View, UserEventProps> = ({ type, created_at, sender }, ref) => {
    return (
        <Card padding-page ref={ref}>
            <View
                style={{ backgroundColor: Colors.gray100 }}
                className="flex flex-col w-full p-2 space-y-1 rounded-lg"
            >
                <Text body className="font-bold">
                    {type === "user_joined" ? "User Joined the Transaction" : "User Left the Transaction"}
                </Text>
                <Text bodySmall gray400>{created_at}</Text>
                <View className="flex flex-row space-x-2 items-center">
                    {type === "user_joined" ?
                        <MaterialCommunityIcons name="arrow-right" size={10} color={Colors.gray900} />
                        :
                        <MaterialCommunityIcons name="arrow-left" size={10} color={Colors.gray900} />
                    }
                    <Text className="font-bold">{sender}</Text>
                </View>
            </View>
        </Card>
    )
}

const PaymentEventTemp: ForwardRefRenderFunction<typeof View, PaymentEventProps> = ({ type, created_at, sender, wallet, amount, currency, platform, proof, onViewImage }, ref) => {
    const [warnings, setWarnings] = useState<string[]>([]);
    const [showWarning, setShowWarning] = useState<boolean>(false);

    let currencySymbol;

    switch (currency) {
        default:
        case "PHP": currencySymbol = "₱"; break;
        case "USD": currencySymbol = "$"; break;
        case "EUR": currencySymbol = "€"; break;
    }

    useEffect(() => {
        if (wallet && wallet.current_owners && wallet.previous_owners) {
            let tempWarnings: string[] = [];
            if (wallet.current_owners.length > 1) { tempWarnings.push("Wallet has more than one concurrent owners"); }
            if (wallet.previous_owners.length > 1) { tempWarnings.push("Wallet has more than one past owners"); }

            setWarnings(tempWarnings);
        }
    }, [])

    if (wallet) return (
        <Card padding-page ref={ref} className="w-full">
            <View
                style={{ backgroundColor: Colors.gray100 }}
                className="flex flex-col w-full p-2 space-y-1 rounded-lg"
            >
                <Text body className="font-bold">
                    {type === "payment_requested" ? "Payment Request Sent" : "Payment Sent"}
                </Text>
                <Text bodySmall gray400>{created_at}</Text>
                <Text bodySmall>Sender: <Text className="font-bold">{sender}</Text></Text>
                <Text bodySmall>Amount: <Text className="font-bold">{currencySymbol}{amount}</Text></Text>
                <Card
                    style={{ backgroundColor: Colors.bgDefault }}
                    className="flex flex-col w-full p-2 space-y-2"
                >
                    <View className="flex flex-row w-full space-x-2 items-center justify-between">
                        <View className="flex flex-1 flex-col">
                            <Text bodySmall className="font-bold">Using Wallet</Text>
                            <Text bodySmall>Wallet ID: <Text className="font-bold">{wallet?.id || "123"}</Text></Text>
                            <Text bodySmall>Platform: <Text className="font-bold">{wallet?.platform || "GCash"}</Text></Text>
                        </View>
                        <View className="flex items-center justify-center">
                            {wallet && wallet.current_owners && wallet.previous_owners && (wallet.current_owners.length > 1 || wallet.previous_owners.length > 1) && (
                                <Hint
                                    visible={showWarning}
                                    message={
                                        <View className="flex flex-col items-start justify-center">
                                            {warnings.map((warning, i) => (
                                                <Text
                                                    key={i}
                                                    caption
                                                    bgDefault
                                                >
                                                    - {warning}
                                                </Text>
                                            ))}
                                        </View>
                                    }
                                    color={Colors.gray700}
                                    onBackgroundPress={() => setShowWarning(false)}
                                >
                                    <TouchableOpacity
                                        className="w-full"
                                        onPress={() => setShowWarning(!showWarning)}
                                    >
                                        <Ionicons
                                            name="warning-outline"
                                            size={30}
                                            color={Colors.warning400}
                                        />
                                    </TouchableOpacity>
                                </Hint>
                            )}
                        </View>
                    </View>
                    <Button
                        className="flex-1 rounded-lg"
                        backgroundColor={Colors.gray900}
                        onPress={() => router.push(`/wallet/${wallet.id}`)}
                    >
                        <View className="flex flex-row space-x-2 items-center">
                            <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.bgDefault} />
                            <Text buttonSmall bgDefault>See full details</Text>
                        </View>
                    </Button>
                </Card>
                {proof && (
                    <View className="flex flex-col space-y-2">
                        <Text bodySmall>Proof of Payment: <Text className="font-bold">{platform}</Text></Text>
                        <Button
                            className="flex-1 rounded-lg"
                            backgroundColor={Colors.gray900}
                            onPress={onViewImage}
                        >
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="magnify" size={20} color={Colors.bgDefault} />
                                <Text buttonSmall bgDefault>View Receipt</Text>
                            </View>
                        </Button>
                    </View>
                )}
            </View>
        </Card>
    )
}

const PaymentStatusEventTemp: ForwardRefRenderFunction<typeof View, PaymentStatusEventProps> = ({ type, created_at, sender }, ref) => {
    let title;
    let desc;

    switch (type) {
        case "payment_request_cancelled":
            title = "Payment Request Cancelled";
            desc = "Cancelled by: ";
            break;
        case "payment_confirmed":
            title = "Payment Confirmed";
            desc = "Confirmed by: ";
            break;
        case "payment_denied":
            title = "Payment Denied";
            desc = "Denied by: ";
            break;
    }

    return (
        <Card padding-page ref={ref}>
            <View
                style={{ backgroundColor: Colors.gray100 }}
                className="flex flex-col w-full p-2 space-y-1 rounded-lg"
            >
                <Text body className="font-bold">{title}</Text>
                <Text bodySmall gray400>{created_at}</Text>
                <Text bodySmall>{desc}<Text className="font-bold">{sender}</Text></Text>
            </View>
        </Card>
    )
}

const ProductStatusEventTemp: ForwardRefRenderFunction<typeof View, ProductStatusEventProps> = ({ type, created_at, sender }, ref) => {
    let title;
    let desc;

    switch (type) {
        case "product_sent":
            title = "Product Sent by User";
            desc = "Sender: ";
            break;
        case "product_received":
            title = "Product Received by User";
            desc = "Receiver: ";
            break;
    }

    return (
        <Card padding-page ref={ref}>
            <View
                style={{ backgroundColor: Colors.gray100 }}
                className="flex flex-col w-full p-2 space-y-1 rounded-lg"
            >
                <Text body className="font-bold">{title}</Text>
                <Text bodySmall gray400>{created_at}</Text>
                <Text bodySmall>{desc}<Text className="font-bold">{sender}</Text></Text>
            </View>
        </Card>
    )
}

export const TransactionEvent = forwardRef(TransactionEventTemp);
export const UserEvent = forwardRef(UserEventTemp);
export const PaymentEvent = forwardRef(PaymentEventTemp);
export const PaymentStatusEvent = forwardRef(PaymentStatusEventTemp);
export const ProductStatusEvent = forwardRef(ProductStatusEventTemp);