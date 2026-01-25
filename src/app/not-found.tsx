import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black text-white p-4">
      <h2 className="text-6xl font-black mb-4 text-cyber-neon">404</h2>
      <p className="text-xl text-gray-400 mb-8">System Error: Resource Not Found</p>
      <Link 
        href="/"
        className="px-6 py-3 bg-white text-black font-bold rounded-lg hover:bg-cyber-neon transition-colors"
      >
        Return Home
      </Link>
    </div>
  );
}