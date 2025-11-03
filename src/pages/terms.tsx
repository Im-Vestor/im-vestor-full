import { Header } from "~/components/header";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import { useUser } from "@clerk/nextjs";
import { ArrowLeft, Loader2 } from "lucide-react";
import { api } from "~/utils/api";

export default function Terms() {
	const router = useRouter();
	const { isLoaded, isSignedIn } = useUser();
	const { data } = api.content.getByKey.useQuery({ key: "terms" });

	return (
		<main className="flex min-h-screen flex-col items-center pb-12">
			<div className="mt-4 w-[80%]">
				<Header />
			</div>
			{isLoaded && !isSignedIn && (
				<div className="mt-4">
					<Button
						onClick={() => router.push("/")}
						className="text-primary hover:opacity-70"
					>
						<ArrowLeft className="h-4 w-4 text-yellow-400" />
						Go Back to Home
					</Button>
				</div>
			)}
			<div className="mt-8 w-full max-w-5xl rounded-2xl border-4 border-white/10 bg-[#181920] bg-opacity-30 p-8 backdrop-blur-md">
				<h1 className="mb-8 text-center text-4xl font-semibold text-[#E5CD82]">
					{data?.title ?? 'Termos de Utilização'}
				</h1>
				<div className="space-y-6 text-neutral-100">
					{data?.contentHtml ? (
						<div className="prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: data.contentHtml }} />
					) : (
						<div className="flex items-center justify-center">
							<Loader2 className="h-4 w-4 animate-spin" />
						</div>
					)}
				</div>
			</div>
		</main>
	);
}


