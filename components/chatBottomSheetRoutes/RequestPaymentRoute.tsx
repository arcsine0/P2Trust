import { FC, Dispatch, SetStateAction } from "react";
import { ViewStyle } from "react-native";
import { TextInput, Divider, ActivityIndicator } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";

import { View, Text, Button } from "react-native-ui-lib";

import { RequestDetails } from "@/lib/helpers/types";
import { PaymentPlatforms } from "@/lib/helpers/collections";

import { MaterialCommunityIcons } from "@expo/vector-icons";

interface RequestPaymentRouteProps {
    dropdownStyle?: ViewStyle;
    disabled: boolean;
    requestDetails: RequestDetails;
    setRequestDetails: Dispatch<SetStateAction<RequestDetails>>;
    sendPaymentRequest: () => void;
}

const RequestPaymentRoute: FC<RequestPaymentRouteProps> = ({ dropdownStyle, disabled, requestDetails, setRequestDetails, sendPaymentRequest }) => {
    return (
        <View className="flex flex-col w-full p-2 items-center justify-start">
            <View className="flex flex-col w-full gap-2">
                <Text bodyLarge className="font-bold">Transaction Details</Text>
                <TextInput
                    className="rounded-lg overflow-scroll"
                    label="Amount"
                    value={requestDetails.amount?.toString()}
                    onChangeText={text => setRequestDetails({ ...requestDetails, amount: parseFloat(text) })}
                    keyboardType="numeric"
                />
                <Dropdown
                    style={dropdownStyle}
                    data={PaymentPlatforms}
                    value={requestDetails.platform}
                    onChange={value => setRequestDetails({ ...requestDetails, platform: value.value })}
                    labelField="label"
                    valueField="value"
                    placeholder="Select Payment Platform"
                />
                <Text bodyLarge className="font-bold">Your Account Details</Text>
                <TextInput
                    className="rounded-lg overflow-scroll"
                    label="Name"
                    value={requestDetails.accountName}
                    onChangeText={text => setRequestDetails({ ...requestDetails, accountName: text })}
                    keyboardType="default"
                />
                <TextInput
                    className="rounded-lg overflow-scroll"
                    label="Account Number"
                    value={requestDetails.accountNumber}
                    onChangeText={text => setRequestDetails({ ...requestDetails, accountNumber: text })}
                    keyboardType="default"
                />
                <Divider />
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
            </View>
        </View>
    )
}

export default RequestPaymentRoute;