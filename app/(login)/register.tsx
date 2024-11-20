import { useState, useEffect } from "react";

import { KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TextInput, Divider, ActivityIndicator } from "react-native-paper";

import { View, Text, Button, Wizard, Colors, Dialog, Checkbox, Modal } from "react-native-ui-lib";

import { router } from "expo-router";

import { supabase } from "@/supabase/config";

import { useUserData } from "@/lib/context/UserContext";

import { MaterialCommunityIcons } from "@expo/vector-icons";
import { dragDisable } from "d3";

export default function RegisterScreen() {
    const [email, setEmail] = useState<string>("");
    const [firstName, setFirstName] = useState<string>("");
    const [lastName, setLastName] = useState<string>("");
    const [password, setPassword] = useState<string>("");
    const [confirmPassword, setConfirmPassword] = useState<string>("");
    const [confirmationCode, setConfirmationCode] = useState<string>("");

    const [isRegistering, setIsRegistering] = useState<boolean>(false);
    const [isLoggingIn, setIsLoggingIn] = useState<boolean>(false);

    const [showPrivacyPolicy, setShowPrivacyPolicy] = useState<boolean>(false);
    const [isPrivacyChecked, setIsPrivacyChecked] = useState<boolean>(false);

    const [activeIndex, setActiveIndex] = useState<number>(0);
    const [completedStepIndex, setCompletedStepIndex] = useState<number>(0);

    const { setUserData } = useUserData();

    const goToPrevStep = () => {
        const newActiveIndex = activeIndex === 0 ? 0 : activeIndex - 1;
        setActiveIndex(newActiveIndex);
    };

    const goToNextStep = () => {
        if (activeIndex === 2) {
            console.log("Form submitted!");
            return;
        }

        const newActiveIndex = activeIndex + 1;
        setActiveIndex(newActiveIndex);
        setCompletedStepIndex(newActiveIndex);
    };

    const getStepState = (index: number) => {
        let state = Wizard.States.DISABLED;

        if (completedStepIndex && completedStepIndex > index - 1) {
            state = Wizard.States.COMPLETED;
        } else if (activeIndex === index || completedStepIndex === index - 1) {
            state = Wizard.States.COMPLETED;
        }

        return state;
    }

    const emailAndNamesPage = () => {
        return (
            <View className="flex flex-col w-full space-y-2">
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
                    label="First Name"
                    placeholder="John"
                    value={firstName}
                    onChangeText={setFirstName}
                />
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="Last Name"
                    placeholder="Doe"
                    value={lastName}
                    onChangeText={setLastName}
                />
            </View>
        )
    }

    const passwordsPage = () => {
        return (
            <View className="flex flex-col w-full space-y-2">
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="Password"
                    secureTextEntry={true}
                    value={password}
                    onChangeText={setPassword}
                />
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="Confirm Password"
                    secureTextEntry={true}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                />
            </View>
        )
    }

    const confirmationPage = () => {
        return (
            <View className="flex flex-col w-full space-y-2">
                <TextInput
                    className="w-full rounded-lg"
                    mode="outlined"
                    label="Confirmation Code"
                    placeholder="XXX-XXX"
                    value={confirmationCode}
                    onChangeText={setConfirmationCode}
                />
            </View>
        )
    }

    const renderCurrentStep = () => {
        switch (activeIndex) {
            default:
            case 0:
                return emailAndNamesPage();
            case 1:
                return passwordsPage();
            case 2:
                return confirmationPage();
        }
    }

    const registerAccount = async () => {
        setIsRegistering(true);

        try {
            const { error } = await supabase.auth.signUp({
                email: email,
                password: password,
            });

            if (!error) {
                setActiveIndex(2);
                setIsRegistering(false);
            } else {
                setIsRegistering(false);
                console.log(error);
            }
        } catch (error) {
            console.log(error);
        }
    }

    const loginAccount = async () => {
        setIsLoggingIn(true);

        try {
            const { data: sessionData, error: verifyError } = await supabase.auth.verifyOtp({
                type: "email",
                email: email,
                token: confirmationCode,
            });

            if (!verifyError && sessionData && sessionData.user) {
                const uid = sessionData.user.id;

                const { data, error: updateError } = await supabase
                    .from("accounts")
                    .update({
                        firstname: firstName,
                        lastname: lastName,
                    })
                    .eq("id", uid)
                    .select();

                if (!updateError && data) {
                    setUserData(data[0]);
                    setIsLoggingIn(false);

                    router.push("/(tabs)/");
                } else {
                    setIsLoggingIn(false);
                    console.log("Error updating accounts table: ", updateError);
                }
            } else {
                setIsLoggingIn(false);
                console.log(verifyError);
            }

        } catch (error) {

        }
    }

    return (
        <SafeAreaView
            className="flex flex-col w-screen h-screen space-y-4 px-4 pt-2 items-start justify-center"
        >
            <KeyboardAvoidingView
                className="flex w-full h-full space-y-4"
            >
                <Text h2 className="font-bold mt-32">Create an Account</Text>
                <Wizard
                    activeIndex={activeIndex}
                    onActiveIndexChanged={index => setActiveIndex(index)}
                    containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, elevation: 2 }}
                >
                    <Wizard.Step state={getStepState(0)} label="Email and Names" />
                    <Wizard.Step state={getStepState(1)} label="Passwords" />
                    <Wizard.Step state={getStepState(2)} label="Confirmation Code" />
                </Wizard>
                {renderCurrentStep()}
                <View className="flex flex-col w-full space-y-2">
                    <Button
                        className="w-full rounded-lg"
                        disabled={(() => {
                            switch (activeIndex) {
                                default:
                                case 0:
                                    return !email || !firstName || !lastName;
                                case 1:
                                    return !password || !confirmPassword || password !== confirmPassword || isRegistering;
                                case 2:
                                    return !confirmationCode || isLoggingIn;
                            }
                        })()}
                        onPress={() => {
                            switch (activeIndex) {
                                case 0:
                                    goToNextStep();
                                    break;
                                case 1:
                                    setShowPrivacyPolicy(true);
                                    break;
                                case 2:
                                    loginAccount();
                                    break;
                            }
                        }}
                    >
                        {activeIndex === 0 && (
                            <View className="flex flex-row space-x-2 items-center">
                                <MaterialCommunityIcons name="arrow-right" size={20} color={"white"} />
                                <Text buttonSmall white>Proceed</Text>
                            </View>
                        )}
                        {activeIndex === 1 && (
                            <>
                                {!isRegistering ?
                                    <View className="flex flex-row space-x-2 items-center">
                                        <MaterialCommunityIcons name="send" size={20} color={"white"} />
                                        <Text buttonSmall white>Sign Up</Text>
                                    </View>
                                    :
                                    <View className="flex flex-row space-x-2 items-center">
                                        <ActivityIndicator animating={true} color="gray" />
                                        <Text buttonSmall white>Processing...</Text>
                                    </View>
                                }
                            </>
                        )}
                        {activeIndex === 2 && (
                            <>
                                {!isLoggingIn ?
                                    <View className="flex flex-row space-x-2 items-center">
                                        <MaterialCommunityIcons name="send" size={20} color={"white"} />
                                        <Text buttonSmall white>Submit</Text>
                                    </View>
                                    :
                                    <View className="flex flex-row space-x-2 items-center">
                                        <ActivityIndicator animating={true} color="gray" />
                                        <Text buttonSmall white>Submitting...</Text>
                                    </View>
                                }
                            </>
                        )}

                    </Button>
                    <Button
                        className="w-full rounded-lg"
                        disabled={activeIndex !== 1}
                        onPress={() => goToPrevStep()}
                    >
                        <View className="flex flex-row space-x-2 items-center">
                            <MaterialCommunityIcons name="arrow-left" size={20} color={"white"} />
                            <Text buttonSmall white>Go Back</Text>
                        </View>
                    </Button>
                </View>

                <Divider className="w-full" />
                <View className="flex flex-col space-y-1 items-center">
                    <Text bodySmall>Have an existing account?</Text>
                    <TouchableOpacity
                        onPress={() => router.push("/(login)/")}
                    >
                        <Text
                            className="font-bold"
                            bodySmall
                            color={Colors.primary800}
                        >
                            Login
                        </Text>
                    </TouchableOpacity>
                </View>
                <Dialog
                    visible={showPrivacyPolicy}
                    onDismiss={() => setShowPrivacyPolicy(false)}
                    // panDirection="up"
                    containerStyle={{ backgroundColor: Colors.bgDefault, borderRadius: 8, padding: 4 }}
                >
                    <View
                        className="flex flex-col w-full p-4 space-y-4"
                    >
                        <Text h3>Privacy Policy</Text>
                        <ScrollView
                            style={{ height: 300, width: "100%" }}
                        >
                            <Text caption>
                                <Text caption className="font-bold">P2Trust Privacy Policy</Text>
                                {"\n\n"}
                                <Text caption className="font-bold">Effective Date:</Text> Nov 7, 2024{"\n\n"}
                                P2Trust respects your privacy and is committed to protecting your personal information.
                                This Privacy Policy explains how we collect, use, share, and protect the data you provide
                                when using the P2Trust mobile application ("App"). By using the App, you agree to the
                                terms outlined in this Privacy Policy.{"\n\n"}

                                <Text caption className="font-bold">1. Information We Collect</Text>{"\n"}
                                <Text caption className="font-bold">a. Personal Information</Text>{"\n"}
                                i. We collect the following information for identification, account setup, and
                                KYC (Know Your Customer) purposes:{"\n"}
                                1. Full Name{"\n"}
                                2. Email Address{"\n"}
                                3. Mobile Number{"\n"}
                                4. Identification (ID) Images: Collected during KYC verification for merchant
                                assessment and fraud prevention.{"\n\n"}

                                <Text caption className="font-bold">b. Transaction Data</Text>{"\n"}
                                i. To enhance transaction transparency and security, P2Trust collects:{"\n\n"}
                                <Text caption className="font-bold">c. Transaction History</Text>{"\n"}
                                i. Transaction dates, amounts, and identifiers.{"\n\n"}
                                <Text caption className="font-bold">d. Proof of Payment Images</Text>{"\n"}
                                i. Uploaded by users to verify transactions.{"\n\n"}
                                <Text caption className="font-bold">e. QR Codes</Text>{"\n"}
                                i. Used to facilitate quick data entry and payment confirmation.{"\n\n"}

                                <Text caption className="font-bold">2. Permissions We Request</Text>{"\n"}
                                a. P2Trust requires specific permissions to enable core functionality, including camera
                                access and file upload. Here’s how each permission is used:{"\n\n"}

                                <Text caption className="font-bold">i. Camera Access</Text>{"\n"}
                                1. Purpose: The camera is used to scan QR codes and capture images of IDs for KYC
                                verification.{"\n"}
                                2. Usage: Access is only active while scanning QR codes or capturing images for
                                KYC and is not used for any other purpose. Images are not stored permanently unless
                                uploaded by the user for verification purposes.{"\n\n"}

                                <Text caption className="font-bold">ii. File Upload Access</Text>{"\n"}
                                1. Purpose: File access allows users to upload images of QR codes and proofs of
                                payment.{"\n"}
                                2. Usage: Uploaded files are securely stored for transaction verification and fraud
                                prevention purposes. Files can be deleted by users at any time, and we do not access
                                files on your device outside of uploads initiated within the App.{"\n\n"}

                                <Text caption className="font-bold">3. How We Use Your Information</Text>{"\n"}
                                a. We use the information collected for the following purposes:{"\n"}
                                i. User Verification: Personal and ID data verify account ownership and authenticity.{"\n"}
                                ii. Transaction Security: Transaction history and proof of payments are used to confirm
                                and assess transaction legitimacy.{"\n"}
                                iii. Fraud Detection and Prevention: Transaction data and KYC images help protect users
                                by identifying and flagging potential fraudulent activities.{"\n"}
                                iv. Customer Support: Personal information helps us address inquiries and resolve
                                issues.{"\n\n"}

                                <Text caption className="font-bold">4. Data Sharing and Disclosure</Text>{"\n"}
                                a. P2Trust will not sell, trade, or otherwise transfer your data to third parties without
                                your consent, except:{"\n"}
                                i. When Legally Required: We may disclose information to comply with legal obligations,
                                such as court orders or regulatory requests.{"\n"}
                                ii. For Security and Fraud Prevention: Data may be shared with trusted partners or law
                                enforcement to detect and prevent fraudulent activities.{"\n\n"}

                                <Text caption className="font-bold">5. Data Storage and Security</Text>{"\n"}
                                a. We prioritize the security of your data. Measures include:{"\n"}
                                i. Encryption: All sensitive data is encrypted during storage and transmission.{"\n"}
                                ii. Access Control: Only authorized personnel have access to user data for legitimate
                                purposes.{"\n"}
                                b. We retain your data only as long as necessary for providing services, complying with
                                legal requirements, or resolving disputes. Once no longer needed, data is securely
                                deleted.{"\n\n"}

                                <Text caption className="font-bold">6. User Rights and Control</Text>{"\n"}
                                a. You have the following rights regarding your data:{"\n"}
                                i. Access: Request a copy of the data we hold about you.{"\n"}
                                ii. Correction: Update or correct inaccurate information.{"\n"}
                                iii. Deletion: Request deletion of your account and personal information.{"\n"}
                                iv. Withdrawal of Consent: Revoke consent for data usage by deleting your account.{"\n"}
                                b. For any requests or inquiries, please contact us at
                                <Text caption className="font-bold">contact.janscabs.dev@gmail.com</Text>.{"\n\n"}

                                <Text caption className="font-bold">7. Changes to This Privacy Policy</Text>{"\n"}
                                a. We may update this Privacy Policy to reflect changes in our practices or for legal
                                compliance. Any updates will be posted in the App, and significant changes will prompt
                                notification to all users. Your continued use of the App constitutes acceptance of the
                                updated policy.{"\n\n"}

                                <Text caption className="font-bold">8. Contact Us</Text>{"\n"}
                                a. If you have questions regarding this Privacy Policy or P2Trust’s data practices,
                                please contact us at:{" "}
                                <Text caption className="font-bold">contact.janscabs.dev@gmail.com</Text>
                            </Text>
                        </ScrollView>
                        <View className="flex flex-row w-full space-x-2 items-center">
                            <Checkbox
                                value={isPrivacyChecked}
                                onValueChange={setIsPrivacyChecked}
                            />
                            <Text bodySmall>I understand P2Trust's Privacy Policy</Text>
                        </View>
                        <View className="flex flex-row w-full items-center justify-end space-x-2">
                            <Button
                                className="rounded-lg"
                                style={{ backgroundColor: Colors.gray50 }}
                                outline={true}
                                outlineColor={Colors.gray900}
                                onPress={() => setShowPrivacyPolicy(false)}
                            >
                                <Text buttonSmall gray900>Cancel</Text>
                            </Button>
                            <Button
                                className="rounded-lg"
                                onPress={() => registerAccount()}
                                disabled={!isPrivacyChecked}
                            >
                                <Text buttonSmall white>Proceed</Text>
                            </Button>
                        </View>
                    </View>
                </Dialog>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}