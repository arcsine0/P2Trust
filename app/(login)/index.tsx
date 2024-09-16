import { useContext, useState } from "react";
import { View, ScrollView, TouchableHighlight } from "react-native";
import { useTheme, Text, TextInput, Button, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";

import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("test1234");

    const { userData, setUserData } = useUserData();

    const theme = useTheme();

    const userLogin = async () => {
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
                    setUserData(data[0]);
                    
                    router.push("/(tabs)");
                }
            }
        } else {
            console.log(error.message);
        }
    }

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-3 px-4 items-start justify-center">
            <Text variant="displaySmall" className="font-bold">Sign In</Text>
            <TextInput
                className="w-full"
                mode="outlined"
                label="Email"
                placeholder="example@email.com"
                value={email}
                onChangeText={setEmail}
            />
            <TextInput
                className="w-full"
                mode="outlined"
                label="Password"
                value={password}
                onChangeText={setPassword}
            />
            <Button
                className="w-full"
                icon={"account-arrow-right-outline"}
                mode="contained"
                onPress={() => userLogin()}
            >
                Login
            </Button>
            <Divider className="w-full" />
            {/* <View className="flex flex-row w-full justify-center items-center">
                <Text variant="labelLarge" style={{ color: theme.colors.primary }}>or</Text>
            </View> */}
            <Button
                className="w-full"
                icon={"account-plus-outline"}
                mode="contained"
                onPress={() => router.push("/(login)/registerIdentifier")}
            >
                Create an Account
            </Button>
        </SafeAreaView>
    );
}