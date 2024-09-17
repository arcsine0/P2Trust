import { useState, useEffect } from "react";
import { View, ScrollView, TouchableHighlight } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Button, IconButton, Dialog, Portal, Text } from "react-native-paper";

import { router } from "expo-router";
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from "expo-camera";

import { supabase } from "@/supabase/config";

import { useMerchantData } from "@/lib/context/MerchantContext";

export default function TransactionScanScreen() {
	const [facing, setFacing] = useState<CameraType>("back");
	const [visible, setVisible] = useState(false);
	const [hasScanned, setHasScanned] = useState(false);

	const { setMerchantData } = useMerchantData();

	const [permission, requestPermission] = useCameraPermissions();
	const theme = useTheme();

	const toggleCameraFacing = () => {
		setFacing(current => (current === 'back' ? 'front' : 'back'));
	}

	const barcodeScanned = async (result: BarcodeScanningResult) => {
		if (result.data && hasScanned === false) {
			setHasScanned(true);

			const { data , error } = await supabase
				.from("accounts")
				.select()
				.eq("id", result.data);

			if (!error) {
				setMerchantData(data[0]);
				router.navigate("/(transaction)/lobby")
			} else {
				console.log(error);
				setHasScanned(false);
			}
		}
	}

	if (!permission) {
		return <View />
	}

	if (!permission.granted) {
		<Portal>
			<Dialog visible={visible} onDismiss={() => setVisible(false)}>
				<Dialog.Title>Alert</Dialog.Title>
				<Dialog.Content>
					<Text variant="bodyMedium">P2Trust needs permission to use camera</Text>
				</Dialog.Content>
				<Dialog.Actions>
					<Button onPress={requestPermission}>Allow</Button>
				</Dialog.Actions>
			</Dialog>
		</Portal>
	}

	return (
		<SafeAreaView className="flex flex-col w-screen h-screen items-start justify-start">
			<CameraView
				className="flex flex-row w-full h-3/4 p-5 items-end justify-center"
				facing={facing}
				barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
				onBarcodeScanned={(data) => barcodeScanned(data)}
			>
				<View className="flex flex-row items-center justify-center">
					<IconButton
						icon="camera-flip"
						mode="contained"
						iconColor={theme.colors.primary}
						size={20}
						onPress={() => toggleCameraFacing()}
					/>
				</View>
			</CameraView>
		</SafeAreaView>
	);
}