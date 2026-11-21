import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 text-center">
      <p className="text-6xl font-bold text-brand-600">404</p>
      <h1 className="mt-3 text-xl font-bold">Page not found</h1>
      <p className="mt-1 text-sm text-slate-500">The page you&apos;re looking for doesn&apos;t exist or was moved.</p>
      <Link href="/" className="mt-6 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white">Go home</Link>
    </div>
  );
}
