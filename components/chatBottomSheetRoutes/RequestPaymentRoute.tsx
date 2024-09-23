import { FC, Dispatch, SetStateAction } from "react";
import { View, ViewStyle } from "react-native";
import { Text, TextInput, Button, Chip } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";

import { RequestDetails } from "@/lib/helpers/types";
import { PaymentPlatforms } from "@/lib/helpers/collections";

interface RequestPaymentRouteProps {
    dropdownStyle?: ViewStyle;
    requestDetails: RequestDetails;
    setRequestDetails: Dispatch<SetStateAction<RequestDetails>>;
    sendPaymentRequest: () => void;
}

const RequestPaymentRoute: FC<RequestPaymentRouteProps> = ({ dropdownStyle, requestDetails, setRequestDetails, sendPaymentRequest }) => {
    return (
        <View className="flex flex-col w-full p-2 items-center justify-start">
            <View className="flex flex-col w-full gap-2">
                <Text variant="titleMedium">Transaction Details</Text>
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
                <Text variant="titleMedium">Your Account Details</Text>
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
                <Button
                    className="rounded-lg w-full"
                    icon={"information"}
                    mode="contained"
                    onPress={sendPaymentRequest}
                >
                    Send Request
                </Button>
            </View>
        </View>
    )
}

export default RequestPaymentRoute;