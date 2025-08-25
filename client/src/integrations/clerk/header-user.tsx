import {
	SignedIn,
	SignInButton,
	SignedOut,
	UserButton,
	useUser,
} from "@clerk/clerk-react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

export default function HeaderUser() {
	const { isLoaded } = useUser();

	if (!isLoaded) {
		return (
			<div className="flex items-center space-x-2">
				<Skeleton className="h-9 w-20 rounded-md" />
			</div>
		);
	}

	return (
		<>
			<SignedIn>
				<UserButton
					appearance={{
						elements: {
							avatarBox:
								"w-9 h-9 ring-2 ring-green-500/20 hover:ring-green-500/40 transition-all duration-200",
						},
					}}
				/>
			</SignedIn>
			<SignedOut>
				<SignInButton>
					<Button
						variant="default"
						size="sm"
						className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200 border-0"
					>
						<LogIn className="w-4 h-4 mr-2" />
						Sign In
					</Button>
				</SignInButton>
			</SignedOut>
		</>
	);
}
