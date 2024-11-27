import { AuthProvider } from '@/components/providers/AuthProvider'
import { InitializeDbButton } from '@/components/InitializeDbButton'
import './globals.css'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <AuthProvider>
          {children}
          <InitializeDbButton />
        </AuthProvider>
      </body>
    </html>
  )
}
