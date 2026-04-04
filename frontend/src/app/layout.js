import './globals.css';
import QueryProvider from '@/providers/QueryProvider';

export const metadata = {
  title: 'Mappin',
  description: 'Map-based geo-content platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
