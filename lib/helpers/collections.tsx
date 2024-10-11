export const Currencies = [
	{ label: "PHP", value: "PHP" },
	{ label: "USD", value: "USD" },
	{ label: "EUR", value: "EUR" },
];

export const PaymentPlatforms = [
	{ label: "GCash", value: "GCash" },
	{ label: "Paymaya", value: "Paymaya" },
];

export const FilterOptions = [
	{ label: "All", value: "All" },
	{ label: "Completed", value: "Completed" },
	{ label: "Cancelled", value: "Cancelled" },
];

export const PositiveTags = [
	"Fast Replies",
	"Easy Transaction",
	"Friendly",
	"Professional",
	"Fair Pricing",
];

export const NegativeTags = [
	"Slow Replies",
	"Difficult Transaction",
	"Unprofessional",
	"Overpriced",
	"Scam",
	"Impersonator",
]

export const IDTypes = [
	{ label: "National ID", value: "NationalID", disabled: false },
	{ label: "Passport", value: "Passport", disabled: true },
	{ label: "Drivers' Licence", value: "DriversLicence", disabled: true },
];

export const PhoneCountryCodes = [
	{ label: "(+1)", value: "+1" },
	{ label: "(+44)", value: "+44" },
	{ label: "(+61)", value: "+61" },
	{ label: "(+63)", value: "+63" },
	{ label: "(+91)", value: "+91" },
	{ label: "(+86)", value: "+86" },
	{ label: "(+81)", value: "+81" },
	{ label: "(+49)", value: "+49" },
	{ label: "(+33)", value: "+33" },
	{ label: "(+7)", value: "+7" },
	{ label: "(+55)", value: "+55" },
	{ label: "(+52)", value: "+52" },
	{ label: "(+34)", value: "+34" },
	{ label: "(+39)", value: "+39" },
	{ label: "(+82)", value: "+82" },
	{ label: "(+64)", value: "+64" },
	{ label: "(+27)", value: "+27" },
	{ label: "(+20)", value: "+20" },
	{ label: "(+30)", value: "+30" },
	{ label: "(+32)", value: "+32" },
	{ label: "(+31)", value: "+31" },
	{ label: "(+45)", value: "+45" },
	{ label: "(+46)", value: "+46" },
	{ label: "(+47)", value: "+47" },
	{ label: "(+48)", value: "+48" },
	{ label: "(+90)", value: "+90" },
	{ label: "(+41)", value: "+41" },
	{ label: "(+351)", value: "+351" },
	{ label: "(+372)", value: "+372" },
	{ label: "(+420)", value: "+420" },
	{ label: "(+971)", value: "+971" },
	{ label: "(+65)", value: "+65" },
	{ label: "(+66)", value: "+66" },
	{ label: "(+84)", value: "+84" },
	{ label: "(+358)", value: "+358" },
	{ label: "(+254)", value: "+254" },
	{ label: "(+233)", value: "+233" },
	{ label: "(+234)", value: "+234" },
	{ label: "(+94)", value: "+94" },
	{ label: "(+977)", value: "+977" },
	{ label: "(+880)", value: "+880" },
	{ label: "(+92)", value: "+92" },
	{ label: "(+212)", value: "+212" },
	{ label: "(+964)", value: "+964" },
	{ label: "(+353)", value: "+353" },
	{ label: "(+56)", value: "+56" },
	{ label: "(+54)", value: "+54" },
	{ label: "(+62)", value: "+62" }
];

export const CrucialSteps = [
	{ event: "payment_confirmed", label: "Confirmation of Payment" },
	{ event: "product_sent", label: "Confirmation of Product Sent" },
	{ event: "product_received", label: "Confirmation of Product Received" },
]