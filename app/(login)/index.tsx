import { useState } from "react";
import { TouchableOpacity } from "react-native";
import { useTheme, TextInput, Divider, ActivityIndicator } from "react-native-paper";
import { Colors, View, Text, Button, Picker, PickerModes } from "react-native-ui-lib";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { supabase } from "@/supabase/config";
import { GoogleSignin, statusCodes } from "@react-native-google-signin/google-signin";

import { useUserData } from "@/lib/context/UserContext";
import { PhoneCountryCodes } from "@/lib/helpers/collections";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("test1234");

    const [countryCode, setCountryCode] = useState<string | undefined>("+63");
    const [phoneNumber, setPhoneNumber] = useState<string>("");
    const [OTP, setOTP] = useState<string>("");

    const [defaultLoginLoading, setDefaultLoginLoading] = useState<boolean>(false);
    const [phoneLoginLoading, setPhoneLoginLoading] = useState<boolean>(false);
    const [phoneOTPSending, setPhoneOTPSending] = useState<boolean>(false);

    const [hasSentOTP, setHasSentOTP] = useState<boolean>(false);

    const [isEmailLogin, setIsEmailLogin] = useState<boolean>(true);

    const { setUserData, setRequests, setQueue } = useUserData();

    const theme = useTheme();

    // GoogleSignin.configure({
    //     webClientId: 
    // });

    const userLogin = async () => {
        setDefaultLoginLoading(true);

        const { data: { session }, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (!error) {
            if (session) {
                const { data, error } = await supabase
                    .from("accounts")
                    .select("*")
                    .eq("id", session.user.id);

                if (!error && data && data.length > 0) {
                    setDefaultLoginLoading(false);
                    setUserData(data[0]);
                    setRequests(null);
                    setQueue(null);

                    router.push("/(tabs)");
                } else {
                    console.log("Error logging in: ", error);
                    setDefaultLoginLoading(false);
                }
            }
        } else {
            setDefaultLoginLoading(false);
            console.log(error.message);
        }
    }

    // const loginWithGoogle = async () => {
    //     try {
    //         await GoogleSignin.hasPlayServices();
    //         const userInfo = await GoogleSignin.signIn();

    //         if (userInfo.data?.idToken) {
    //             console.log("success")
    //         }

    //     } catch (error) {
    //         console.log(error);
    //     }
    // }

    const sendOTP = async () => {
        setPhoneOTPSending(true);

        const { error } = await supabase.auth.signInWithOtp({
            phone: `${countryCode}${phoneNumber}`,
        });

        if (!error) {
            setHasSentOTP(true);
            setPhoneOTPSending(false);
        } else {
            setPhoneOTPSending(false);

            console.log(error);
        }
    }

    const loginWithPhone = async () => {
        setPhoneLoginLoading(true);

        const { data: { session }, error: loginError } = await supabase.auth.verifyOtp({
            type: "sms",
            phone: `${countryCode}${phoneNumber}`,
            token: OTP,
        });

        if (!loginError && session && session.user) {
            const { data, error } = await supabase
                .from("accounts")
                .select("*")
                .eq("id", session.user.id);

            if (!error) {
                setPhoneLoginLoading(false);
                setUserData(data[0]);

                router.push("/(tabs)");
            }
        }
    }

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen space-y-2 px-4 items-center justify-start">
            <Text h1 className="mt-32">P2Trust</Text>
            {isEmailLogin ?
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
                        label="Password"
                        secureTextEntry={true}
                        value={password}
                        onChangeText={setPassword}
                    />
                    <Button
                        className="w-full rounded-lg"
                        disabled={defaultLoginLoading}
                        onPress={() => userLogin()}
                    >
                        {!defaultLoginLoading ?
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="account-arrow-right" size={20} color={"white"} />
                                <Text buttonSmall white>Login</Text>
                            </View>

                            :
                            <View className="flex flex-row space-x-2 items-center">
                                <ActivityIndicator animating={true} size={20} color="white" />
                                <Text buttonSmall white>Logging In...</Text>
                            </View>
                        }
                    </Button>
                </View>
                :
                <View className="flex flex-col w-full space-y-2">
                    <View className="flex flex-row w-full space-x-2 items-center">
                        <View
                            style={{ backgroundColor: Colors.gray100, paddingVertical: 13, elevation: 2 }}
                            className="px-2 rounded-lg"
                        >
                            <Picker
                                value={countryCode}
                                mode={PickerModes.SINGLE}
                                fieldType="filter"
                                showSearch={true}
                                onChange={value => setCountryCode(value?.toString())}
                            >
                                {PhoneCountryCodes.map((code, i) => (
                                    <Picker.Item key={i} label={code.label} value={code.value} />
                                ))}
                            </Picker>
                        </View>
                        <TextInput
                            className="flex-1 rounded-lg"
                            mode="outlined"
                            label="Phone Number"
                            value={phoneNumber}
                            onChangeText={setPhoneNumber}
                        />
                    </View>
                    {hasSentOTP && (
                        <TextInput
                            className="flex-1 rounded-lg"
                            mode="outlined"
                            label="Confirmation Code"
                            value={OTP}
                            onChangeText={setOTP}
                        />
                    )}
                    {!hasSentOTP ?
                        <Button
                            className="w-full rounded-lg"
                            disabled={phoneOTPSending}
                            onPress={() => sendOTP()}
                        >
                            {!phoneOTPSending ?
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="account-arrow-right" size={20} color={"white"} />
                                    <Text buttonSmall white>Send OTP</Text>
                                </View>

                                :
                                <View className="flex flex-row space-x-2 items-center">
                                    <ActivityIndicator animating={true} size={20} color="white" />
                                    <Text buttonSmall white>Sending OTP...</Text>
                                </View>
                            }
                        </Button>
                        :
                        <Button
                            className="w-full rounded-lg"
                            disabled={phoneLoginLoading}
                            onPress={() => loginWithPhone()}
                        >
                            {!phoneLoginLoading ?
                                <View className="flex flex-row space-x-2 items-center">
                                    <MaterialCommunityIcons name="account-arrow-right" size={20} color={"white"} />
                                    <Text buttonSmall white>Submit</Text>
                                </View>

                                :
                                <View className="flex flex-row space-x-2 items-center">
                                    <ActivityIndicator animating={true} size={20} color="white" />
                                    <Text buttonSmall white>Submitting...</Text>
                                </View>
                            }
                        </Button>
                    }
                </View>
            }
            <Divider className="w-full" />
            {/* <Button
                className="w-full rounded-lg"
                style={{ backgroundColor: Colors.gray50 }}
                outline={true}
                onPress={() => loginWithGoogle()}
            >
                {!googleLoginLoading ?
                    <View className="flex flex-row space-x-2 items-center">
                        <MaterialCommunityIcons name="google-plus" size={20} color={Colors.primary800} />
                        <Text buttonSmall black>Continue with Google</Text>
                    </View>

                    :
                    <View className="flex flex-row space-x-2 items-center">
                        <ActivityIndicator animating={true} color="gray" />
                        <Text buttonSmall white>Logging In...</Text>
                    </View>
                }
            </Button> */}
            <Button
                className="w-full rounded-lg"
                style={{ backgroundColor: Colors.gray50 }}
                outline={true}
                disabled={defaultLoginLoading || phoneLoginLoading || phoneOTPSending}
                onPress={() => isEmailLogin ? setIsEmailLogin(false) : setIsEmailLogin(true)}
            >
                {isEmailLogin ?
                    <View className="flex flex-row space-x-2 items-center">
                        <MaterialCommunityIcons name="phone" size={20} color={Colors.primary800} />
                        <Text buttonSmall black>Continue with Phone Number</Text>
                    </View>
                    :
                    <View className="flex flex-row space-x-2 items-center">
                        <MaterialCommunityIcons name="email" size={20} color={Colors.primary800} />
                        <Text buttonSmall black>Continue with Email</Text>
                    </View>
                }

            </Button>
            <Divider className="w-full" />
            <View className="flex flex-col space-y-1 items-center">
                <Text bodySmall>Don't have an account?</Text>
                <TouchableOpacity
                    onPress={() => router.push("/(login)/register")}
                >
                    <Text
                        className="font-bold"
                        bodySmall
                        color={Colors.primary800}
                    >
                        Create an account
                    </Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}