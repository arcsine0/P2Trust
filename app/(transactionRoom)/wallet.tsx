import { useState, useEffect } from "react";
import { Platform, KeyboardAvoidingView } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ActivityIndicator, IconButton, TextInput } from "react-native-paper";

import { Colors, View, Text, Button, Wizard, Card, Picker, PickerModes } from "react-native-ui-lib";

import { router, useNavigation } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";
import { PaymentPlatforms, PhoneCountryCodes } from "@/lib/helpers/collections";
import { sendVerification, checkVerification } from "@/lib/helpers/functions";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { WalletData } from "@/lib/helpers/types";

export default function UserWalletScreen() {
    const [activeIndex, setActiveIndex] = useState<number>(0);

    const [walletDetails, setWalletDetails] = useState<{
        accountName: string;
        accountNumber: string;
        platform: string | undefined;
        countryCode: string | undefined;
    }>({
        accountName: "",
        accountNumber: "",
        platform: "GCash",
        countryCode: "+63",
    });
    const [OTP, setOTP] = useState<string | undefined>(undefined);

    const [isOTPSending, setIsOTPSending] = useState<boolean>(false);
    const [isOTPVerifying, setIsOTPVerifying] = useState<boolean>(false);

    const { userData, setUserData } = useUserData();
    const navigation = useNavigation();

    const goToPrevStep = () => {
        const newActiveIndex = activeIndex === 0 ? 0 : activeIndex - 1;
        setActiveIndex(newActiveIndex);
    };

    const getStepState = (index: number) => {
        return activeIndex === index ? Wizard.States.ENABLED : Wizard.States.DISABLED;
    }

    const sendOTP = async () => {
        setIsOTPSending(true);

        try {
            const { data, error } = await supabase.auth.signInWithOtp({
                phone: `${walletDetails.countryCode?.trim()}${walletDetails.accountNumber.trim()}`
            });

            if (!error && data) {
                setActiveIndex(1);
            } else {
                console.log(error);
            }

            setActiveIndex(1);
        } catch (error) {
            console.log(error);
        }

        setIsOTPSending(false);
    }

    const verifyOTP = async () => {
        setIsOTPVerifying(true);

        if (userData && OTP) {
            try {
                const { data, error } = await supabase.auth.verifyOtp({
                    phone: `${walletDetails.countryCode?.trim()}${walletDetails.accountNumber.trim()}`,
                    token: OTP,
                    type: "sms",
                });

                if (!error && data) {
                    console.log(`${walletDetails.countryCode?.trim()}-${walletDetails.accountNumber.trim()}`);

                    const { data: walletDataTemp, error: walletError } = await supabase
                        .from("wallets")
                        .select("*")
                        .eq("account_number", `${walletDetails.countryCode?.trim()}-${walletDetails.accountNumber.trim()}`);

                    if (!walletError && walletDataTemp) {
                        const walletData: WalletData[] = walletDataTemp;
                        console.log("wallet data:", walletData);

                        if (walletData.length > 0) {
                            const { data: updatedAccountData, error: updatedAccountError } = await supabase
                                .from("accounts")
                                .update({
                                    wallets: [walletData[0].id]
                                })
                                .eq("id", userData.id)
                                .select("*");

                            if (!updatedAccountError && updatedAccountData) {
                                setUserData({
                                    ...updatedAccountData[0],
                                    wallets: [walletData[0]]
                                });
                            } else {
                                console.log(updatedAccountError);
                            }
                        } else {
                            const { data: createWalletData, error: createWalletError } = await supabase
                                .from("wallets")
                                .insert({
                                    current_owners: [userData?.id],
                                    previous_owners: [userData?.id],
                                    account_name: walletDetails.accountName,
                                    account_number: `${walletDetails.countryCode?.trim()}-${walletDetails.accountNumber.trim()}`,
                                    platform: walletDetails.platform,
                                })
                                .select("*");

                            if (!createWalletError && createWalletData) {
                                console.log(createWalletData);

                                const { data: updatedAccountData, error: updatedAccountError } = await supabase
                                    .from("accounts")
                                    .update({
                                        wallets: [...[userData.wallets], createWalletData[0].id]
                                    })
                                    .eq("id", userData?.id)
                                    .select("*");

                                if (!updatedAccountError && updatedAccountData) {
                                    setUserData({
                                        ...updatedAccountData[0],
                                        wallets: [createWalletData[0]]
                                    });
                                } else {
                                    console.log(updatedAccountError);
                                }
                            } else {
                                console.log(createWalletError);
                            }
                        }

                        const { data: walletUpdateData, error: walletUpdateError } = await supabase
                            .from("wallets")
                            .update({
                                current_owners: walletData[0].current_owners?.find(id => id === userData.id) ? [...walletData[0].current_owners] : [...(walletData[0].current_owners ?? []), userData.id],
                                previous_owners: walletData[0].previous_owners?.filter(id => id !== userData.id) || [],
                            })
                            .eq("id", walletData[0].id)
                            .select("*");

                        if (!walletUpdateError && walletUpdateData) {
                            console.log(walletUpdateData);
                            router.navigate("/(transactionRoom)/");
                        } else {
                            console.log(walletUpdateError);
                        }
                    } else {
                        console.log(walletError);
                    }
                } else {
                    console.log(error);
                }

                setIsOTPVerifying(false);

            } catch (error) {
                console.log(error);
                setIsOTPVerifying(false);
            }
        }
    }

    const walletDetailsPage = () => {
        if (walletDetails) return (
            <Card
                style={{
                    backgroundColor: Colors.bgDefault,
                }}
                elevation={4}
                className="flex flex-col w-full p-4 space-y-2"
            >
                <Text bodyLarge className="font-bold">Enter Wallet Details</Text>
                <Text bodySmall gray400>Note: Account name doesn't have to be your complete full name. Only the initials are required and will be used by other users to further verify if the account number belongs to you when sending funds through this wallet.</Text>
                <Text bodySmall gray400>Ex. R***** J*** C.</Text>
                <TextInput
                    className="rounded-lg overflow-scroll"
                    style={{ backgroundColor: Colors.gray100 }}
                    label="Name"
                    value={walletDetails.accountName}
                    onChangeText={text => setWalletDetails({ ...walletDetails, accountName: text })}
                    keyboardType="default"
                />
                <View className="flex flex-row w-full space-x-2 items-center">
                    <View
                        style={{ backgroundColor: Colors.gray100, paddingVertical: 13, elevation: 2 }}
                        className="px-2 rounded-lg"
                    >
                        <Picker
                            value={walletDetails.countryCode}
                            mode={PickerModes.SINGLE}
                            fieldType="filter"
                            showSearch={true}
                            onChange={value => setWalletDetails({ ...walletDetails, countryCode: value?.toString() })}
                        >
                            {PhoneCountryCodes.map((code, i) => (
                                <Picker.Item key={i} label={code.label} value={code.value} />
                            ))}
                        </Picker>
                    </View>
                    <TextInput
                        className="rounded-lg flex-1 overflow-scroll"
                        style={{ backgroundColor: Colors.gray100 }}
                        label="Account Number"
                        value={walletDetails.accountNumber}
                        onChangeText={text => setWalletDetails({ ...walletDetails, accountNumber: text })}
                        keyboardType="default"
                    />
                </View>
                <View style={{ backgroundColor: Colors.gray100, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 13, elevation: 2 }}>
                    <Picker
                        value={walletDetails.platform}
                        mode={PickerModes.SINGLE}
                        useDialog={true}
                        customPickerProps={{ migrateDialog: true, }}
                        trailingAccessory={<MaterialCommunityIcons name="chevron-down" size={20} color={Colors.gray900} />}
                        onChange={value => setWalletDetails({ ...walletDetails, platform: value?.toString() })}
                    >
                        {PaymentPlatforms.map((pl, i) => (
                            <Picker.Item key={i} label={pl.label} value={pl.value} />
                        ))}
                    </Picker>
                </View>
            </Card>
        )
    }

    const verifyOTPPage = () => {
        return (
            <Card
                style={{
                    backgroundColor: Colors.bgDefault,
                }}
                elevation={4}
                className="flex flex-col w-full p-4 space-y-2"
            >
                <Text bodyLarge className="font-bold">Verify OTP</Text>
                <Text bodySmall gray400>An OTP will be sent to the number connected to your wallet. Input the sent code into the input field below to finish binding the wallet to your account</Text>
                <TextInput
                    className="rounded-lg overflow-scroll"
                    style={{ backgroundColor: Colors.gray100 }}
                    label="OTP Code"
                    value={OTP}
                    onChangeText={text => setOTP(text)}
                    keyboardType="default"
                />
            </Card>
        )
    }

    const renderCurrentStep = () => {
        switch (activeIndex) {
            default:
            case 0:
                return walletDetailsPage();
            case 1:
                return verifyOTPPage();
        }
    }

    return (
        <SafeAreaView className="flex flex-col w-full h-full items-center justify-start">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex flex-col space-y-4 w-full h-full"
            >
                <Wizard
                    activeIndex={activeIndex}
                    onActiveIndexChanged={index => setActiveIndex(index)}
                    containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, elevation: 2 }}
                >
                    <Wizard.Step state={getStepState(0)} label="Enter Wallet Details" />
                    <Wizard.Step state={getStepState(1)} label="Verify OTP" />
                </Wizard>
                <View className="flex flex-col flex-1 w-full space-y-4 justify-between">
                    <View className="flex flex-col px-4">
                        {renderCurrentStep()}
                    </View>
                    <View
                        className="flex flex-row p-4 space-x-2 items-center"
                        style={{ backgroundColor: Colors.bgDefault }}
                    >
                        <Button
                            className="flex-1 rounded-lg"
                            backgroundColor={Colors.gray50}
                            outline={true}
                            outlineColor={Colors.gray900}
                            disabled={activeIndex === 0}
                            onPress={() => goToPrevStep()}
                        >
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="arrow-left" size={20} color={Colors.gray900} />
                                <Text buttonSmall gray900>Back</Text>
                            </View>
                        </Button>
                        <Button
                            className="flex-1 rounded-lg"
                            disabled={(() => {
                                switch (activeIndex) {
                                    case 0:
                                        return !walletDetails?.accountName || !walletDetails?.accountNumber || !walletDetails?.platform || isOTPSending;
                                    case 1:
                                        return !OTP || isOTPVerifying;
                                }
                            })()}
                            onPress={() => {
                                switch (activeIndex) {
                                    case 0:
                                        sendOTP();
                                        break;
                                    case 1:
                                        verifyOTP();
                                        break;
                                }
                            }}
                        >
                            {activeIndex === 0 && (
                                <>
                                    {!isOTPSending ?
                                        <View className="flex flex-row space-x-2 items-center">
                                            <MaterialCommunityIcons name="check" size={20} color="white" />
                                            <Text buttonSmall white>Submit</Text>
                                        </View>
                                        :
                                        <View className="flex flex-row space-x-2 items-center">
                                            <ActivityIndicator animating={true} color={Colors.gray900} />
                                            <Text buttonSmall white>Submitting...</Text>
                                        </View>
                                    }
                                </>
                            )}
                            {activeIndex === 1 && (
                                <>
                                    {!isOTPVerifying ?
                                        <View className="flex flex-row space-x-2 items-center">
                                            <MaterialCommunityIcons name="check" size={20} color="white" />
                                            <Text buttonSmall white>Verify</Text>
                                        </View>
                                        :
                                        <View className="flex flex-row space-x-2 items-center">
                                            <ActivityIndicator animating={true} color={Colors.gray900} />
                                            <Text buttonSmall white>Verifying...</Text>
                                        </View>
                                    }
                                </>
                            )}
                        </Button>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}