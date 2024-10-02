import { useContext, useState } from "react";
import { View, ScrollView, TouchableOpacity } from "react-native";
import { useTheme, Text, TextInput, Button, Divider, ActivityIndicator } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";

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
            <Text variant="displaySmall" className="font-bold">P2Trust</Text>
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
                value={password}
                onChangeText={setPassword}
            />
            <Button
                className="w-full rounded-lg"
                icon={"account-arrow-right-outline"}
                mode="contained"
                elevation={3}
                disabled={defaultLoginLoading}
                onPress={() => userLogin()}
            >
                {!defaultLoginLoading ? 
                    <Text variant="bodyMedium" className="font-bold text-white">Login</Text>
                :
                    <View className="flex flex-row space-x-2 items-center">
                        <ActivityIndicator animating={true} color="gray" />
                        <Text variant="bodyMedium" className="font-bold text-white">Logging In...</Text>
                    </View>
                }
            </Button>
            <Divider className="w-full" />
            <Button
                className="w-full rounded-lg"
                icon={"google-plus"}
                mode="contained"
                buttonColor={theme.colors.background}
                textColor="black"
                labelStyle={{ fontWeight: "bold" }}
                elevation={3}
                onPress={() => loginWithGoogle()}
            >
                Continue with Google
            </Button>
            <Button
                className="w-full rounded-lg"
                icon={"facebook"}
                mode="contained"
                buttonColor={theme.colors.background}
                textColor="black"
                labelStyle={{ fontWeight: "bold" }}
                elevation={3}
                onPress={() => loginWithFacebook()}
            >
                Continue with Facebook
            </Button>
            <Button
                className="w-full rounded-lg"
                icon={"phone"}
                mode="contained"
                buttonColor={theme.colors.background}
                textColor="black"
                labelStyle={{ fontWeight: "bold" }}
                elevation={3}
                onPress={() => loginWithPhone()}
            >
                Continue with Phone Number
            </Button>
            <Divider className="w-full" />
            <View className="flex flex-col space-y-1 items-center">
                <Text variant="bodyMedium">Don't have an account?</Text>
                <TouchableOpacity
                    onPress={() => router.push("/(login)/registerIdentifier")}
                >
                    <Text variant="bodyMedium" className="font-bold" style={{ color: theme.colors.primary }}>Create an account</Text>
                </TouchableOpacity>
            </View>
        </SafeAreaView>
    );
}