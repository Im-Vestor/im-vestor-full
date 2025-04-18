import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-4xl font-bold mb-4">404 - Page Not Found</h1>
      <p className="text-lg mb-8">
        Oops! The page you are looking for does not exist.
      </p>
      <Link href="/" className="text-primary hover:underline">
        Go back home
      </Link>
    </div>
  );
}