import { useState, useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { useTheme, IconButton } from "react-native-paper";

import { Colors, View, Text, Button, Dialog } from "react-native-ui-lib";

import { router } from "expo-router";
import { CameraView, CameraType, useCameraPermissions, BarcodeScanningResult } from "expo-camera";

import { supabase } from "@/supabase/config";

import { MaterialCommunityIcons } from "@expo/vector-icons";

export default function TransactionScanScreen() {
	const [facing, setFacing] = useState<CameraType>("back");
	const [visible, setVisible] = useState(false);
	const [hasScanned, setHasScanned] = useState(false);

	const [QRError, setQRError] = useState("");

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
						router.navigate(`/(transactionRoom)/merchant/${qrData.id}`);
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
	
	return (
		<SafeAreaView className="flex flex-col w-screen h-screen items-start justify-start">
			{permission && permission.granted && (
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
							iconColor={Colors.primary700}
							size={20}
							onPress={() => toggleCameraFacing()}
						/>
					</View>
				</CameraView>
			)}
		</SafeAreaView>
	);
}