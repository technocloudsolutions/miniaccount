// eslint-disable-next-line @typescript-eslint/no-unused-vars
import Image from "next/image";
import LoginForm from '@/components/auth/LoginForm';

export default function Home() {
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
              Welcome back to your business hub
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300">
              Manage your business finances with ease. Track sales, expenses, and generate reports in one place.
            </p>
            <div className="grid grid-cols-2 gap-4 pt-6">
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-primary-600 dark:text-primary-400">Easy Tracking</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Monitor your business performance in real-time</p>
              </div>
              <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow-sm">
                <h3 className="font-semibold text-primary-600 dark:text-primary-400">Smart Reports</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">Get insights with detailed analytics</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right side - Login Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6">
          <div className="w-full max-w-md space-y-8 bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-lg border border-primary-100 dark:border-primary-900">
            <div className="text-center space-y-2">
              <div className="lg:hidden flex justify-center mb-8">
                <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-xl p-4 shadow-lg">
                  <h1 className="text-2xl font-bold text-white">AccountEase</h1>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
                Sign in to your account
              </h2>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                Enter your credentials to access your account
              </p>
            </div>

            <LoginForm />

            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don&apos;t have an account?{' '}
                <a
                  href="/register"
                  className="font-medium text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 transition-colors"
                >
                  Create an account
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
