import { FC, Dispatch, SetStateAction } from "react";
import { ViewStyle } from "react-native";
import { TextInput, Divider, ActivityIndicator } from "react-native-paper";
import { Dropdown } from "react-native-element-dropdown";

import { Colors, View, Text, Button, Picker, PickerModes } from "react-native-ui-lib";

import { RequestDetails } from "@/lib/helpers/types";
import { PaymentPlatforms, Currencies } from "@/lib/helpers/collections";

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
    return (
        <View className="flex flex-col w-full p-4 items-center justify-start">
            <View className="flex flex-col w-full space-y-4">
                <View className="flex flex-col w-full space-y-2">
                    <Text bodyLarge className="font-bold">Transaction Details</Text>
                    <View className="flex flex-row w-full space-x-2">
                        <Picker
                            value={requestDetails.currency}
                            mode={PickerModes.SINGLE}
                            fieldType="filter"
                            className="rounded-lg px-4 py-4"
                            style={{ backgroundColor: Colors.gray100, borderBottomWidth: 1, borderBottomColor: Colors.gray400 }}
                            onChange={value => setRequestDetails({ ...requestDetails, currency: value?.toString() })}
                        >
                            {Currencies.map((pl, i) => (
                                <Picker.Item key={i} label={pl.label} value={pl.value} />
                            ))}
                        </Picker>
                        <TextInput
                            className="rounded-lg flex-1 overflow-scroll"
                            style={{ backgroundColor: Colors.gray100 }}
                            label="Amount"
                            value={requestDetails.amount?.toString()}
                            onChangeText={text => setRequestDetails({ ...requestDetails, amount: parseFloat(text) })}
                            keyboardType="numeric"
                        />
                    </View>
                    <Picker
                        value={requestDetails.platform}
                        mode={PickerModes.SINGLE}
                        fieldType="filter"
                        className="rounded-lg px-4 py-2"
                        style={{ backgroundColor: Colors.gray100, borderBottomWidth: 1, borderBottomColor: Colors.gray400 }}
                        onChange={value => setRequestDetails({ ...requestDetails, platform: value?.toString() })}
                    >
                        {PaymentPlatforms.map((pl, i) => (
                            <Picker.Item key={i} label={pl.label} value={pl.value} />
                        ))}
                    </Picker>
                </View>
                <View className="flex flex-col w-full space-y-2">
                    <Text bodyLarge className="font-bold">Your Account Details</Text>
                    <TextInput
                        className="rounded-lg overflow-scroll"
                        style={{ backgroundColor: Colors.gray100 }}
                        label="Name"
                        value={requestDetails.accountName}
                        onChangeText={text => setRequestDetails({ ...requestDetails, accountName: text })}
                        keyboardType="default"
                    />
                    <TextInput
                        className="rounded-lg overflow-scroll"
                        style={{ backgroundColor: Colors.gray100 }}
                        label="Account Number"
                        value={requestDetails.accountNumber}
                        onChangeText={text => setRequestDetails({ ...requestDetails, accountNumber: text })}
                        keyboardType="default"
                    />
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