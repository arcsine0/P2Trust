import { useState, useEffect } from "react";
import { View } from "react-native";
import { Text, TextInput, Button, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";

export default function RegisterScreen() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");

    const setRegister = async () => {
        try {
            const creds = {
                email: email,
                pass: "",
                name: name,
            }

            await AsyncStorage.setItem("creds", JSON.stringify(creds));
            router.push("/(login)/registerPass")
        } catch(err) {
            console.log(err);
        }
    }

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-3 px-4 items-start justify-center">
            <Text variant="displaySmall" className="font-bold">Create Account</Text>
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
                label="Name"
                value={name}
                onChangeText={setName}
            />
            <Button
                className="w-full"
                icon={"check"}
                mode="contained"
                onPress={() => setRegister()}
            >
                Next
            </Button>
        </SafeAreaView>
    );
}