'use client';
import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";

export default function Page() {
  const router = useRouter();
  const { isLoaded, isSignedIn } = useAuth();

  useEffect(() => {
    // Redirect to dashboard if user is already signed in
    if (isLoaded && isSignedIn) {
      router.push('/dashboard');
    }
  }, [isLoaded, isSignedIn, router]);

  const handleSignInComplete = async (signInData: any) => {
    try {
      // Save user to database
      await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          clerkId: signInData.createdUserId || signInData.userId,
          email: signInData.emailAddress
        }),
      });
      
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving user:', error);
    }
  };

  // If loading auth state or already signed in (before redirect happens), show nothing
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-[#0A0F1C] flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0F1C] py-12 px-4 sm:px-6 lg:px-8 flex flex-col justify-center">
      {/* Background Gradients */}
      <div className="fixed inset-0 overflow-hidden -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      </div>
      
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-white tracking-tight">PropChain</h1>
          </Link>
          <p className="mt-2 text-gray-400">Sign in to manage your property investments</p>
        </div>
        
        <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl overflow-hidden border border-gray-700/50 p-1">
          <SignIn
            appearance={{
              baseTheme: dark,
              elements: {
                formButtonPrimary: 
                  'bg-gradient-to-r from-blue-500 to-purple-500 hover:opacity-90 text-sm normal-case',
                card: 'bg-transparent shadow-none',
                headerTitle: 'text-white',
                headerSubtitle: 'text-gray-400',
                socialButtonsBlockButton: 'bg-gray-700 border-gray-600',
                socialButtonsBlockButtonText: 'text-white font-normal',
                socialButtonsBlockButtonIcon: 'text-white',
                dividerLine: 'bg-gray-600',
                dividerText: 'text-gray-400',
                formFieldLabel: 'text-gray-300',
                formFieldInput: 'bg-gray-700/50 border-gray-600 text-white',
                footerActionLink: 'text-blue-400 hover:text-blue-300',
                footerActionText: 'text-gray-400',
              },
            }}
            routing="hash"
            afterSignInUrl="/dashboard"
            signUpUrl="/signup"
            redirectUrl="/dashboard"
            afterSignIn={handleSignInComplete}
          />
        </div>
        
        <div className="mt-8 text-center">
          <p className="text-gray-400">
            Don't have an account?{' '}
            <Link href="/signup" className="text-blue-400 hover:text-blue-300">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
} 