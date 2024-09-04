import { useState, useEffect } from "react";
import { View, Platform } from "react-native";
import { Text, TextInput, Button, Divider } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { router } from "expo-router";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

import { fs, auth } from "@/firebase/config";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";

type Credentials = {
    email: string;
    pass: string;
    name: string;
}

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

const handleRegistrationError = (err: string) => {
    alert(err);
    throw new Error(err);
}

const registerForPushNotificationsAsync = async () => {
    if (Platform.OS === 'android') {
        Notifications.setNotificationChannelAsync('default', {
            name: 'default',
            importance: Notifications.AndroidImportance.MAX,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FF231F7C',
        });
    }

    // re-edit when testing using emulators is done
    // if (Device.isDevice) {

    // } else {
    //     handleRegistrationError('Must use physical device for push notifications');
    // }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
    }
    if (finalStatus !== 'granted') {
        handleRegistrationError('Permission not granted to get push token for push notification!');
        return;
    }
    const projectId =
        Constants?.expoConfig?.extra?.eas?.projectId ?? Constants?.easConfig?.projectId;
    if (!projectId) {
        handleRegistrationError('Project ID not found');
    }
    try {
        const pushTokenString = (
            await Notifications.getExpoPushTokenAsync({
                projectId,
            })
        ).data;
        console.log(pushTokenString);
        return pushTokenString;
    } catch (e: unknown) {
        handleRegistrationError(`${e}`);
    }
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
        } catch (err) {
            console.log(err);
        }
    }

    const setRegister = async () => {
        try {
            createUserWithEmailAndPassword(auth, email, pass)
                .then(async (userCredential) => {
                    const userID = userCredential.user.uid;

                    registerForPushNotificationsAsync()
                        .then(async (token) => {
                            if (token) {
                                await AsyncStorage.removeItem("creds");

                                setDoc(doc(fs, "Accounts", userID), {
                                    userName: name,
                                    pushToken: token,
                                }).then(async () => {
                                    await AsyncStorage.setItem("pushToken", token);

                                    router.push("/(login)/")
                                });
                            }
                        })
                })
                .catch((error) => {
                    const errorCode = error.code;
                    const errorMessage = error.message;

                    console.log(errorCode, errorMessage)
                });
        } catch (err) {
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