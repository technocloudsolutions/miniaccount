import Image from "next/image";
import RegisterForm from '@/components/auth/RegisterForm';

export default function Register() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 dark:from-primary-950 dark:to-secondary-950">
      <div className="container mx-auto min-h-screen flex">
        {/* Left side - Branding */}
        <div className="hidden lg:flex lg:w-1/2 flex-col justify-center p-12">
          <div className="space-y-6 max-w-lg">
            <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl p-6 shadow-lg inline-block">
              <h1 className="text-3xl font-bold text-white">AccountEase</h1>
            </div>
            <h2 className="text-4xl font-bold text-gray-900 dark:text-white">
              Start your business journey
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Join thousands of businesses managing their finances efficiently with AccountEase.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-primary-600 dark:text-primary-400">Quick Setup</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Get started in minutes with our easy setup</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-primary-600 dark:text-primary-400">Secure Data</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Your business data is always protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Registration Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-primary-100 dark:border-primary-900">
            <div className="text-center space-y-2">
              <div className="lg:hidden flex justify-center mb-8">
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-4 shadow-lg">
                  <h1 className="text-2xl font-bold text-white">AccountEase</h1>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Create your account
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Fill in your details to get started with AccountEase
              </p>
            </div>

            <RegisterForm />

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Already have an account?{' '}
                <a
                  href="/"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 