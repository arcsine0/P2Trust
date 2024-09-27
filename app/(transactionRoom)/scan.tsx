import { useState, useEffect } from "react";
import { View, ScrollView, TouchableHighlight } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, Button, IconButton, Dialog, Portal, Text } from "react-native-paper";

import { router } from "expo-router";
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult, scanFromURLAsync } from "expo-camera";
import * as ImagePicker from "expo-image-picker";

import { supabase } from "@/supabase/config";

import { useMerchantData } from "@/lib/context/MerchantContext";

export default function TransactionScanScreen() {
	const [facing, setFacing] = useState<CameraType>("back");
	const [visible, setVisible] = useState(false);
	const [hasScanned, setHasScanned] = useState(false);

	const [QRError, setQRError] = useState("");

	const { setMerchantData } = useMerchantData();

	const [permission, requestPermission] = useCameraPermissions();
	const theme = useTheme();

	const toggleCameraFacing = () => {
		setFacing(current => (current === 'back' ? 'front' : 'back'));
	}

	const loadMerchantData = async (qrValue: string) => {
		try {
			const qrData = JSON.parse(qrValue);

			try {
				if (qrData.auth === "P2Trust") {
					const { data, error } = await supabase
						.from("accounts")
						.select("id")
						.eq("id", qrData.id);

					if (!error) {
						router.navigate(`/(transactionRoom)/merchant/${qrData.id}`)
					} else {
						setQRError("Account of QR Code does not exist");
						setHasScanned(false);
					}
				} else {
					setQRError("Invalid QR Code");
				}
			} catch (error) {
				setQRError("Invalid QR Code");
			}
		} catch (error) {
			setQRError("Scanned Image has no data");
		}
	}

	const barcodeScanned = async (result: BarcodeScanningResult) => {
		if (result.data && hasScanned === false) {
			setHasScanned(true);

			loadMerchantData(result.data);
		}
	}

	const pickImage = async () => {
		let result = await ImagePicker.launchImageLibraryAsync({
			mediaTypes: ImagePicker.MediaTypeOptions.Images,
			// allowsEditing: true,
			quality: 1,
		});

		if (result && result.assets && result.assets[0].uri) {
			try {
				const scannedResults = await scanFromURLAsync(result.assets[0].uri);

				if (scannedResults) {
					loadMerchantData(scannedResults[0].data);
				} else {
					setQRError("No QR found in image");
				}
			} catch (error) {
				setQRError("No QR found in image");
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
				<View className="flex flex-row space-x-2 items-center justify-center">
					<IconButton
						icon="camera-flip"
						mode="contained"
						iconColor={theme.colors.primary}
						size={20}
						onPress={() => toggleCameraFacing()}
					/>
					<Button
						className="rounded-lg"
						icon={"file-upload"}
						mode="contained"
						onPress={() => pickImage()}
					>
						Upload Image
					</Button>
				</View>
			</CameraView>
		</SafeAreaView>
	);
}