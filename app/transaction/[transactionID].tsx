import { useState, useEffect, useRef, useCallback } from "react";
import { useWindowDimensions, Platform, View, KeyboardAvoidingView, FlatList } from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Text, TextInput, Avatar, Chip, Card, Button, Menu, Dialog, Portal } from "react-native-paper";

import { router, useLocalSearchParams } from "expo-router";

import { supabase } from "@/supabase/config";

import { Transaction, Interaction } from "@/lib/helpers/types";

import { getInitials } from "@/lib/helpers/functions";

export default function TransactionDetailsScreen() {
    const [transaction, setTransaction] = useState<Transaction | null>(null)

    const { transactionID } = useLocalSearchParams<{ transactionID: string }>();

    const getTransactionData = async () => {
        const { data, error } = await supabase
            .from("transactions")
            .select("*")
            .eq("id", transactionID);

        if (!error) {
            console.log(data[0]);
            setTransaction(data[0]);
        } else {
            console.log(error);
        }
    }

    useEffect(() => {
        getTransactionData();
    }, []);

    return (
        <SafeAreaView className="flex flex-col w-full h-full px-2 pb-2 items-start justify-start">
			<KeyboardAvoidingView
				behavior={Platform.OS === "ios" ? "padding" : "height"}
				keyboardVerticalOffset={100}
				className="flex w-full h-full"
			>
                
            </KeyboardAvoidingView>
        </SafeAreaView>
    )
}