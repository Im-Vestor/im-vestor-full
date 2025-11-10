import { Header } from '~/components/header';

export default function PublicPitch() {
  return (
    <main className="mx-auto min-h-screen max-w-6xl p-8">
      <Header />
      <div className="mt-12 flex gap-6">
        <div className="w-full rounded-xl border-2 border-white/10 bg-card p-12">
          <div className="mt-4 flex flex-col gap-4">
            <h1 className="text-2xl font-bold">Public Pitch</h1>
            <p className="text-sm text-white/50">
              {new Date().toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'long',
                year: 'numeric',
              })}
            </p>

            <div className="mt-4 flex flex-col gap-4">
              <p className="text-sm text-white/50">Under construction</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}