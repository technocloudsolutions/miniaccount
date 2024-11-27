import { AuthProvider } from '@/components/providers/AuthProvider'
import { InitializeDbButton } from '@/components/InitializeDbButton'
import './globals.css'
import { ShoppingBagIcon } from '@heroicons/react/24/outline';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const navigationItems = [
    // ... existing items
    {
      name: 'Purchases',
      href: '/dashboard/purchases',
      icon: ShoppingBagIcon
    },
    // ... other items
  ];

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
