import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#0A0F1C] relative overflow-hidden px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-gray-900/50 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md mx-auto">
        <div className="p-8 rounded-2xl bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm hover:shadow-[0_0_50px_rgba(99,102,241,0.1)] transition-shadow duration-300">
          <SignIn
            appearance={{
              baseTheme: dark,
              elements: {
                formButtonPrimary: 
                  "bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 hover:shadow-[0_0_20px_rgba(99,102,241,0.3)] transition-all duration-300",
                card: "bg-transparent shadow-none",
                headerTitle: "text-white text-2xl",
                headerSubtitle: "text-white",
                socialButtonsBlockButton: "border-gray-700 hover:border-gray-600 text-white hover:bg-gray-800",
                socialButtonsBlockButtonText: "text-white",
                dividerLine: "bg-gray-700",
                dividerText: "text-white",
                formFieldLabel: "text-white",
                formFieldInput: "bg-gray-900/50 border-gray-700 text-white",
                footerActionLink: "text-blue-400 hover:text-blue-300",
                footerActionText: "text-white",
                formFieldInputShowPasswordButton: "text-white hover:text-gray-300",
                identityPreviewText: "text-white",
                identityPreviewEditButton: "text-blue-400 hover:text-blue-300",
                formFieldSuccessText: "text-green-400",
                formFieldErrorText: "text-red-400",
                formFieldInputPlaceholder: "text-gray-400",
                formFieldHintText: "text-white",
                otpCodeFieldInput: "text-white",
              },
              variables: {
                colorPrimary: "#6366f1",
                colorBackground: "#1f2937",
                colorInputBackground: "#111827",
                colorInputText: "#ffffff",
                colorTextOnPrimaryBackground: "#ffffff",
                colorText: "#ffffff",
                colorTextSecondary: "#ffffff",
              }
            }}
          />
        </div>
      </div>
    </div>
  );
}