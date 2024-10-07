import { useState, useEffect } from "react";

import { KeyboardAvoidingView, Platform, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Divider, ActivityIndicator } from "react-native-paper";

import { View, Text, Button, Wizard, Colors } from "react-native-ui-lib";

import { router } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";

import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function RegisterScreen() {
    const [email, setEmail] = useState<string>("");
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [confirmationCode, setConfirmationCode] = useState<string>("");

    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [completedStepIndex, setCompletedStepIndex] = useState<number>(0);

    const { setUserData } = useUserData();

    const goToPrevStep = () => {
        const newActiveIndex = activeIndex === 0 ? 0 : activeIndex - 1;
        setActiveIndex(newActiveIndex);
    };

    const goToNextStep = () => {
        if (activeIndex === 2) {
            console.log("Form submitted!");
            return;
        }

        const newActiveIndex = activeIndex + 1;
        setActiveIndex(newActiveIndex);
        setCompletedStepIndex(newActiveIndex);
    };

    const getStepState = (index: number) => {
        let state = Wizard.States.DISABLED;

        if (completedStepIndex && completedStepIndex > index - 1) {
            state = Wizard.States.COMPLETED;
        } else if (activeIndex === index || completedStepIndex === index - 1) {
            state = Wizard.States.COMPLETED;
        }

        return state;
    }

    const emailAndNamesPage = () => {
        return (
            <View className="flex flex-col w-full space-y-2">
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="Email"
                    placeholder="example@email.com"
                    value={email}
                    onChangeText={setEmail}
                />
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="First Name"
                    placeholder="John"
                    value={firstName}
                    onChangeText={setFirstName}
                />
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="Last Name"
                    placeholder="Doe"
                    value={lastName}
                    onChangeText={setLastName}
                />
            </View>
        )
    }

    const passwordsPage = () => {
        return (
            <View className="flex flex-col w-full space-y-2">
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="Password"
                    secureTextEntry={true}
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="Confirm Password"
                    secureTextEntry={true}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
            </View>
        )
    }

    const confirmationPage = () => {
        return (
            <View className="flex flex-col w-full space-y-2">
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="Confirmation Code"
                    placeholder="XXX-XXX"
                    value={confirmationCode}
                    onChangeText={setConfirmationCode}
                />
            </View>
        )
    }

    const renderCurrentStep = () => {
        switch (activeIndex) {
            default:
            case 0:
                return emailAndNamesPage();
            case 1:
                return passwordsPage();
            case 2:
                return confirmationPage();
        }
    }

    const registerAccount = async () => {
        setIsRegistering(true);

        try {
            const { error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (!error) {
                setActiveIndex(2);
                setIsRegistering(false);
            } else {
                setIsRegistering(false);
                console.log(error);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const loginAccount = async () => {
        setIsLoggingIn(true);

        try {
            const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
                type: "email",
                email: email,
                token: confirmationCode,
            });

            if (!verifyError && sessionData && sessionData.user) {
                const uid = sessionData.user.id;

                const { data, error: updateError } = await supabase
                    .from("accounts")
                    .update({
                        firstname: firstName,
                        lastname: lastName,
                    })
                    .eq("id", uid)
                    .select();

                if (!updateError && data) {
                    setUserData(data[0]);
                    setIsLoggingIn(false);

                    router.push("/(tabs)/");
                } else {
                    setIsLoggingIn(false);
                    console.log("Error updating accounts table: ", updateError);
                }
            } else {
                setIsLoggingIn(false);
                console.log(verifyError);
            }

        } catch (error) {

        }
    }

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen px-4 pt-2 items-start justify-center">
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                keyboardVerticalOffset={100}
                className="flex w-full h-full space-y-4"
            >
                <Text h2 className="font-bold mt-32">Create an Account</Text>
                <Wizard
                    activeIndex={activeIndex}
                    onActiveIndexChanged={index => setActiveIndex(index)}
                    containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, elevation: 2 }}
                >
                    <Wizard.Step state={getStepState(0)} label="Email and Names" />
                    <Wizard.Step state={getStepState(1)} label="Passwords" />
                    <Wizard.Step state={getStepState(2)} label="Confirmation Code" />
                </Wizard>
                {renderCurrentStep()}
                <View className="flex flex-col w-full space-y-2">
                    <Button
                        className="w-full rounded-lg"
                        disabled={(() => {
                            switch (activeIndex) {
                                default:
                                case 0:
                                    return !email || !firstName || !lastName;
                                case 1:
                                    return !password || !confirmPassword || password !== confirmPassword || isRegistering;
                                case 2:
                                    return !confirmationCode || isLoggingIn;
                            }
                        })()}
                        onPress={() => {
                            switch (activeIndex) {
                                case 0:
                                    goToNextStep();
                                    break;
                                case 1:
                                    registerAccount();
                                    break;
                                case 2:
                                    loginAccount();
                                    break;
                            }
                        }}
                    >
                        {activeIndex === 0 && (
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="arrow-right" size={20} color={"white"} />
                                <Text buttonSmall white>Proceed</Text>
                            </View>
                        )}
                        {activeIndex === 1 && (
                            <>
                                {!isRegistering ?
                                    <View className="flex flex-row space-x-2 items-center">
                                        <MaterialCommunityIcons name="send" size={20} color={"white"} />
                                        <Text buttonSmall white>Sign Up</Text>
                                    </View>
                                    :
                                    <View className="flex flex-row space-x-2 items-center">
                                        <ActivityIndicator animating={true} color="gray" />
                                        <Text buttonSmall white>Processing...</Text>
                                    </View>
                                }
                            </>
                        )}
                        {activeIndex === 2 && (
                            <>
                                {!isLoggingIn ?
                                    <View className="flex flex-row space-x-2 items-center">
                                        <MaterialCommunityIcons name="send" size={20} color={"white"} />
                                        <Text buttonSmall white>Submit</Text>
                                    </View>
                                    :
                                    <View className="flex flex-row space-x-2 items-center">
                                        <ActivityIndicator animating={true} color="gray" />
                                        <Text buttonSmall white>Submitting...</Text>
                                    </View>
                                }
                            </>
                        )}

                    </Button>
                    <Button
                        className="w-full rounded-lg"
                        disabled={activeIndex !== 1}
                        onPress={() => goToPrevStep()}
                    >
                        <View className="flex flex-row space-x-2 items-center">
                            <MaterialCommunityIcons name="arrow-left" size={20} color={"white"} />
                            <Text buttonSmall white>Go Back</Text>
                        </View>
                    </Button>
                </View>

                <Divider className="w-full" />
                <View className="flex flex-col space-y-1 items-center">
                    <Text bodySmall>Have an existing account?</Text>
                    <TouchableOpacity
                        onPress={() => router.push("/(login)/")}
                    >
                        <Text
                            className="font-bold"
                            bodySmall
                            color={Colors.primary800}
                        >
                            Login
                        </Text>
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}