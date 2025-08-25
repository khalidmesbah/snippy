import { Button } from "@/components/ui/button";
import { Heart, Edit, Trash2 } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";

type Snippet = {
	id: string;
	title: string;
	content: string;
	is_favorite: boolean;
};

type SnippetCardProps = {
	snippet: Snippet;
};

export function SnippetCard({ snippet }: SnippetCardProps) {
	const navigate = useNavigate();

	return (
		<div
			key={snippet.id}
			onClick={() =>
				navigate({ to: "/snippet/$id", params: { id: snippet.id } })
			}
			className="group relative w-full max-w-md mx-auto p-4 border rounded-md bg-card text-card-foreground shadow flex items-center cursor-pointer hover:bg-muted transition"
		>
			{/* Floating Action Bar */}
			<div
				className="absolute top-2 right-2 z-10 flex gap-1 rounded-md bg-background/80 backdrop-blur-md p-1 opacity-0 translate-y-[-4px] group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-200"
				onClick={(e) => e.stopPropagation()} // prevent card click propagation
			>
				<Button
					variant={snippet.is_favorite ? "default" : "outline"}
					size="icon"
					className="h-8 w-8"
					onClick={() => console.log("Favorite:", snippet.id)}
				>
					<Heart className="w-3.5 h-3.5" />
				</Button>
				<Button
					variant="outline"
					size="icon"
					className="h-8 w-8"
					onClick={() => console.log("Edit:", snippet.id)}
				>
					<Edit className="w-3.5 h-3.5" />
				</Button>
				<Button
					variant="destructive"
					size="icon"
					className="h-8 w-8"
					onClick={() => console.log("Delete:", snippet.id)}
				>
					<Trash2 className="w-3.5 h-3.5" />
				</Button>
			</div>

			<h3 className="text-base font-medium truncate w-full">{snippet.title}</h3>
		</div>
	);
}
