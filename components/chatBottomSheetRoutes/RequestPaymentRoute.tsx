import { FC, Dispatch, SetStateAction } from "react";
import { ViewStyle } from "react-native";
import { TextInput, Divider, ActivityIndicator } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";

import { Colors, View, Text, Button, Picker, PickerModes } from "react-native-ui-lib";

import { RequestDetails } from "@/lib/helpers/types";
import { PaymentPlatforms, Currencies } from "@/lib/helpers/collections";

import { useUserData } from "@/lib/context/UserContext";

import { MaterialCommunityIcons } from "@expo/vector-icons";

interface RequestPaymentRouteProps {
    disabled: boolean;
    dropdownStyle?: ViewStyle;
    requestDetails: RequestDetails;
    setRequestDetails: Dispatch<SetStateAction<RequestDetails>>;
    sendPaymentRequest: () => void;
    cancel: () => void;
}

const RequestPaymentRoute: FC<RequestPaymentRouteProps> = ({ dropdownStyle, disabled, requestDetails, setRequestDetails, sendPaymentRequest, cancel }) => {
    const { userData } = useUserData();

    if (userData) return (
        <View className="flex flex-col w-full p-4 items-center justify-start">
            <View className="flex flex-col w-full space-y-4">
                <View className="flex flex-col w-full space-y-2">
                    <Text bodyLarge className="font-bold">Using Wallet</Text>
                    {userData.wallets && userData.wallets.length > 0 && (
                        <View style={{ backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 13, elevation: 2 }}>
                            <Picker
                                value={requestDetails.wallet_id}
                                mode={PickerModes.SINGLE}
                                useDialog={true}
                                customPickerProps={{ migrateDialog: true, }}
                                trailingAccessory={<MaterialCommunityIcons name="chevron-down" size={20} color={Colors.gray900} />}
                                onChange={value => {
                                    if (userData && userData.wallets) {
                                        const selectedWallet = userData.wallets.filter(wallet => wallet.id === value?.toString())[0];
                                        setRequestDetails({
                                            ...requestDetails,
                                            wallet_id: value?.toString(),
                                            platform: selectedWallet.platform,
                                            accountName: selectedWallet.account_name,
                                            accountNumber: selectedWallet.account_number,
                                        })
                                    }
                                }}
                            >
                                {userData.wallets.map((wallet) => (
                                    <Picker.Item key={wallet.id} label={`${wallet.platform} - ${wallet.account_number}`} value={wallet.id} />
                                ))}
                            </Picker>
                        </View>
                    )}
                    <Text bodyLarge className="font-bold">Transaction Details</Text>
                    <View className="flex flex-row w-full space-x-2">
                        <View style={{ backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 13, elevation: 2 }}>
                            <Picker
                                value={requestDetails.currency}
                                mode={PickerModes.SINGLE}
                                useDialog={true}
                                customPickerProps={{ migrateDialog: true, }}
                                trailingAccessory={<MaterialCommunityIcons name="chevron-down" size={20} color={Colors.gray900} />}
                                onChange={value => setRequestDetails({ ...requestDetails, currency: value?.toString() })}
                            >
                                {Currencies.map((pl, i) => (
                                    <Picker.Item key={i} label={pl.label} value={pl.value} />
                                ))}
                            </Picker>
                        </View>

                        <TextInput
                            className="rounded-lg flex-1 overflow-scroll"
                            style={{ backgroundColor: Colors.gray100 }}
                            label="Amount"
                            value={requestDetails.amount?.toString() !== "NaN" ? requestDetails.amount?.toString() : "0"}
                            onChangeText={text => setRequestDetails({ ...requestDetails, amount: parseFloat(text) })}
                            keyboardType="numeric"
                        />
                    </View>
                </View>
                <Divider />
                <View className="flex flex-col w-full space-y-2">
                    <Button
                        className="rounded-lg"
                        onPress={sendPaymentRequest}
                        disabled={disabled}
                    >
                        {!disabled ?
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="send" size={20} color={"white"} />
                                <Text buttonSmall white>Send Request</Text>
                            </View>
                            :
                            <View className="flex flex-row space-x-2 items-center">
                                <ActivityIndicator animating={true} color="gray" />
                                <Text buttonSmall white>Sending Request...</Text>
                            </View>
                        }
                    </Button>
                    <Button
                        className="rounded-lg"
                        style={{ backgroundColor: Colors.gray50 }}
                        outline={true}
                        outlineColor={Colors.gray900}
                        onPress={cancel}
                    >
                        <Text buttonSmall gray900>Cancel</Text>
                    </Button>
                </View>
            </View>
        </View>
    )
}

export default RequestPaymentRoute;