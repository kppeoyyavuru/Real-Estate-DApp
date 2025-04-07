'use client';
import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { storeUserDetails } from "../../../../server/index";

export default function SignUpPage() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if user is already signed in
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSignUpComplete = async (signUpData: any) => {
    console.log("SignUp Data:", signUpData); // Debug log
    
    try {
      const result = await storeUserDetails(
        signUpData.createdUserId,
        signUpData.emailAddress
      );
      console.log("Database Result:", result); // Debug log
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  // If loading auth state or already signed in (before redirect happens), show nothing
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#0A0F1C]">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-5rem)] flex items-center justify-center bg-[#0A0F1C] relative overflow-hidden px-4">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-b from-transparent via-gray-900/50 to-transparent"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-6xl w-full grid lg:grid-cols-2 gap-8 items-center">
        {/* Left Side - Info */}
        <div className="hidden lg:block text-white p-8">
          <h1 className="text-4xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 text-transparent bg-clip-text">
            Join PropChain Today
          </h1>
          <p className="text-gray-300 mb-8">
            Start your journey into fractional real estate investment with blockchain technology.
          </p>
          
          {/* Features */}
          <div className="space-y-6">
            {[
              {
                title: "Secure Investment",
                description: "Military-grade encryption and blockchain security for your investments",
                icon: (
                  <svg className="w-6 h-6 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                )
              },
              {
                title: "Global Access",
                description: "Invest in properties worldwide from the comfort of your home",
                icon: (
                  <svg className="w-6 h-6 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )
              },
              {
                title: "Smart Contracts",
                description: "Automated and transparent transactions through blockchain",
                icon: (
                  <svg className="w-6 h-6 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                )
              }
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-gray-800/50 border border-gray-700/50">
                <div className="shrink-0">{feature.icon}</div>
                <div>
                  <h3 className="font-semibold mb-1">{feature.title}</h3>
                  <p className="text-sm text-gray-400">{feature.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Side - Sign Up Form */}
        <div className="w-full max-w-md mx-auto">
          <div className="p-8 rounded-2xl bg-gray-800/50 border border-gray-700/50 backdrop-blur-sm hover:shadow-[0_0_50px_rgba(99,102,241,0.1)] transition-shadow duration-300">
            <SignUp
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
                layout: {
                  socialButtonsPlacement: "bottom",
                  showOptionalFields: false,
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
              redirectUrl="/dashboard"
              afterSignUpUrl="/dashboard"
              afterSignUp={(signUpData: { createdUserId: string; emailAddress: string }) => handleSignUpComplete(signUpData)}
            />
          </div>
        </div>
      </div>
    </div>
  );
} 