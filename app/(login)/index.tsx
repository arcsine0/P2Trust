import { useState } from "react";
import { View, ScrollView, TouchableHighlight } from "react-native";
import { useTheme, Text, TextInput, Button, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import { router } from "expo-router";

import { fs, auth } from "@/firebase/config";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";

import AsyncStorage from "@react-native-async-storage/async-storage";

export default function LoginScreen() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");

    const theme = useTheme();

    const userLogin = () => {
        signInWithEmailAndPassword(auth, email, password)
            .then(async (userCredentials) => {
                const user = userCredentials.user;

                getDoc(doc(fs, "Accounts", user.uid))
                    .then(async (sn) => {
                        if (sn) {
                            const userData = {
                                ...sn.data(),
                                uid: user.uid,
                            }
                            
                            await AsyncStorage.setItem("userData", JSON.stringify(userData))
                                .then(() => {
                                    router.push("/(tabs)");
                                });
                        }
                    });
            })
            .catch((error) => {
                const errorCode = error.code;
                const errorMessage = error.message;

                console.log(errorCode, errorMessage);
            });
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