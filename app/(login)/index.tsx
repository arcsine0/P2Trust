import { useContext, useState } from "react";
import { ScrollView, TouchableOpacity } from "react-native";
import { useTheme, TextInput, Divider, ActivityIndicator } from "react-native-paper";
import { View, Text, Button, TextField } from "react-native-ui-lib";

import { MaterialCommunityIcons } from "@expo/vector-icons";

import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";

import { Colors } from "react-native-ui-lib";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("test1234");

    const [defaultLoginLoading, setDefaultLoginLoading] = useState<boolean>(false);
    const [googleLoginLoading, setGoogleLoginLoading] = useState<boolean>(false);
    const [facebookLoginLoading, setFacebookLoginLoading] = useState<boolean>(false);
    const [phoneLoginLoading, setPhoneLoginLoading] = useState<boolean>(false);

    const { userData, setUserData } = useUserData();

    const theme = useTheme();

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

                if (!error) {
                    setDefaultLoginLoading(false);
                    setUserData(data[0]);

                    router.push("/(tabs)");
                }
            }
        } else {
            setDefaultLoginLoading(false);
            console.log(error.message);
        }
    }

    const loginWithGoogle = async () => {

    }

    const loginWithFacebook = async () => {

    }

    const loginWithPhone = async () => {

    }

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen space-y-3 px-4 items-center justify-end">
            <Text h1>P2Trust</Text>
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
            <Divider className="w-full" />
            <Button
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
            </Button>
            <Button
                className="w-full rounded-lg"
                style={{ backgroundColor: Colors.gray50 }}
                outline={true}
                onPress={() => loginWithFacebook()}
            >
                {!facebookLoginLoading ?
                    <View className="flex flex-row space-x-2 items-center">
                        <MaterialCommunityIcons name="facebook" size={20} color={Colors.primary800} />
                        <Text buttonSmall black>Continue with Facebook</Text>
                    </View>
                    :
                    <View className="flex flex-row space-x-2 items-center">
                        <ActivityIndicator animating={true} color="gray" />
                        <Text buttonSmall white>Logging In...</Text>
                    </View>
                }
            </Button>
            <Button
                className="w-full rounded-lg"
                style={{ backgroundColor: Colors.gray50 }}
                outline={true}
                onPress={() => loginWithPhone()}
            >
                {!phoneLoginLoading ?
                    <View className="flex flex-row space-x-2 items-center">
                        <MaterialCommunityIcons name="phone" size={20} color={Colors.primary800} />
                        <Text buttonSmall black>Continue with Phone Number</Text>
                    </View>
                    :
                    <View className="flex flex-row space-x-2 items-center">
                        <ActivityIndicator animating={true} color="gray" />
                        <Text buttonSmall white>Logging In...</Text>
                    </View>
                }
            </Button>
            <Divider className="w-full" />
            <View className="flex flex-col space-y-1 items-center">
                <Text bodySmall>Don't have an account?</Text>
                <TouchableOpacity
                    onPress={() => router.push("/(login)/registerIdentifier")}
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