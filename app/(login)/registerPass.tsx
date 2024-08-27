import { useState, useEffect } from "react";
import { View } from "react-native";
import { Text, TextInput, Button, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";

import { db, fs, auth } from "@/firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

type Credentials = {
    email: string;
    pass: string;
    name: string;
}

export default function RegisterScreen() {
    const [email, setEmail] = useState("");
    const [name, setName] = useState("");
    const [pass, setPass] = useState("");

    const [confPass, setConfPass] = useState("");

    const getCreds = async () => {
        try {
            const credsString = await AsyncStorage.getItem("creds");
            if (credsString) {
                const credsVal = JSON.parse(credsString);

                setEmail(credsVal.email);
                setName(credsVal.name);
            }
        } catch(err) {
            console.log(err);
        }
    }

    const setRegister = async () => {
        try {
            createUserWithEmailAndPassword(auth, email, pass)
                .then(async (userCredential) => {
                    const userID = userCredential.user.uid;
                    
                    await setDoc(doc(fs, "Accounts", userID), {
                        userName: name
                    });

                    await AsyncStorage.removeItem("creds");
                    router.push("/(login)/")
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;

                    console.log(errorCode, errorMessage)
                });
        } catch(err) {
            console.log(err);
        }
    }

    useEffect(() => {
        getCreds();
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-screen h-screen gap-3 px-4 items-start justify-center">
            <Text variant="displaySmall" className="font-bold">Create Account</Text>
            <TextInput
                className="w-full"
                mode="outlined"
                label="Password"
                placeholder="password_123"
                value={pass}
                onChangeText={setPass}
            />
            <TextInput
                className="w-full"
                mode="outlined"
                label="Confirm Password"
                value={confPass}
                onChangeText={setConfPass}
            />
            <Button
                className="w-full"
                icon={"check"}
                mode="contained"
                onPress={() => setRegister()}
            >
                Register
            </Button>
        </SafeAreaView>
    );
}