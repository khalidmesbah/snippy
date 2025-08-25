// Updated snippet route with syntax highlighting and improved share functionality
import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useUser } from "@clerk/clerk-react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import {
	ArrowLeft,
	Share,
	Edit3,
	Trash2,
	Copy,
	Heart,
	HeartOff,
	Globe,
	Lock,
	Check,
	GitFork,
	Loader2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";

import { EditSnippetModal } from "@/components/edit-snippet-modal";

interface Snippet {
	id: string;
	user_id: string;
	collection_id?: string;
	title: string;
	content: string;
	language: string;
	is_public: boolean;
	is_favorite: boolean;
	position: number;
	fork_count: number;
	forked_from?: string;
	created_at: string;
	updated_at: string;
}

const API_BASE_URL = "http://localhost:8080/api";

export const Route = createFileRoute("/snippet/$id")({
	loader: async ({ params }) => {
		const snippetRes = await fetch(
			`${API_BASE_URL}/snippets/${params.id}?user_id=user_30awHESGBrmH8MvigWQEtnHBxUi`,
		);

		if (!snippetRes.ok) {
			throw new Error("Failed to fetch snippet");
		}

		const snippetData = await snippetRes.json();
		return { snippet: snippetData.data };
	},
	component: SnippetDetail,
});

function SnippetDetail() {
	const navigate = useNavigate();
	const { user } = useUser();
	const { snippet: initialSnippet } = Route.useLoaderData();

	const [snippet, setSnippet] = useState<Snippet>(initialSnippet);
	const [copySuccess, setCopySuccess] = useState(false);
	const [shareSuccess, setShareSuccess] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [editModalOpen, setEditModalOpen] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const userId = user?.id;
	const isOwner = snippet?.user_id === userId;

	const handleCopy = async () => {
		if (!snippet) return;

		try {
			await navigator.clipboard.writeText(snippet.content);
			setCopySuccess(true);
			setTimeout(() => setCopySuccess(false), 2000);
		} catch (err) {
			console.error("Failed to copy:", err);
		}
	};

	const handleSnippetUpdated = (updatedSnippet: Snippet) => {
		setSnippet(updatedSnippet);
	};

	const toggleFavorite = async () => {
		if (!snippet || !userId) return;

		try {
			const response = await fetch(
				`${API_BASE_URL}/snippets/${snippet.id}?user_id=${userId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						is_favorite: !snippet.is_favorite,
					}),
				},
			);

			if (response.ok) {
				const snippetResponse = await fetch(
					`${API_BASE_URL}/snippets/${snippet.id}?user_id=${userId}`,
				);
				if (snippetResponse.ok) {
					const snippetData = await snippetResponse.json();
					setSnippet(snippetData.data);
				}
			}
		} catch (error) {
			console.error("Error toggling favorite:", error);
		}
	};

	const togglePublic = async () => {
		if (!snippet || !userId || !isOwner) return;

		try {
			const response = await fetch(
				`${API_BASE_URL}/snippets/${snippet.id}?user_id=${userId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						is_public: !snippet.is_public,
					}),
				},
			);

			if (response.ok) {
				const snippetResponse = await fetch(
					`${API_BASE_URL}/snippets/${snippet.id}?user_id=${userId}`,
				);
				if (snippetResponse.ok) {
					const snippetData = await snippetResponse.json();
					setSnippet(snippetData.data);
				}
			}
		} catch (error) {
			console.error("Error toggling public status:", error);
		}
	};

	const handleDelete = async () => {
		if (!userId) return;

		setDeleting(true);
		try {
			const response = await fetch(
				`${API_BASE_URL}/snippets/${snippet.id}?user_id=${userId}`,
				{
					method: "DELETE",
				},
			);

			if (response.ok) {
				setDeleteDialogOpen(false);
				navigate({ to: "/" });
			} else {
				throw new Error("Failed to delete snippet");
			}
		} catch (error) {
			console.error("Error deleting snippet:", error);
		} finally {
			setDeleting(false);
		}
	};

	const handleFork = async () => {
		if (!snippet || !userId) return;

		try {
			const response = await fetch(
				`${API_BASE_URL}/snippets/${snippet.id}/fork`,
				{
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify({
						user_id: userId,
					}),
				},
			);

			if (response.ok) {
				const result = await response.json();
				navigate({ to: `/snippet/${result.data.id}` });
			}
		} catch (error) {
			console.error("Error forking snippet:", error);
		}
	};

	const handleShare = async () => {
		const url = window.location.href;
		try {
			await navigator.clipboard.writeText(url);
			setShareSuccess(true);
			setTimeout(() => setShareSuccess(false), 2000);
		} catch (err) {
			console.error("Failed to copy URL:", err);
		}
	};

	const formatDate = (dateString: string) => {
		return new Date(dateString).toLocaleDateString();
	};

	const getLanguageForHighlighter = (language: string) => {
		const languageMap: { [key: string]: string } = {
			javascript: "javascript",
			typescript: "typescript",
			python: "python",
			java: "java",
			cpp: "cpp",
			"c++": "cpp",
			c: "c",
			csharp: "csharp",
			"c#": "csharp",
			php: "php",
			ruby: "ruby",
			go: "go",
			rust: "rust",
			html: "markup",
			css: "css",
			sql: "sql",
			json: "json",
			xml: "xml",
			yaml: "yaml",
			bash: "bash",
			shell: "bash",
		};

		return languageMap[language.toLowerCase()] || "text";
	};

	if (!snippet) {
		return (
			<div className="flex flex-col items-center justify-center min-h-[400px] text-center">
				<h2 className="text-2xl font-bold mb-2">Snippet not found</h2>
				<p className="text-muted-foreground mb-4">
					The snippet you're looking for doesn't exist or you don't have access
					to it.
				</p>
				<Button onClick={() => navigate({ to: "/" })}>
					<ArrowLeft className="h-4 w-4 mr-2" />
					Go back
				</Button>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background p-4">
			<div className="flex items-center justify-between mb-6">
				<Button
					variant="ghost"
					onClick={() => navigate({ to: "/" })}
					className="flex items-center gap-2"
				>
					<ArrowLeft className="h-4 w-4" />
					Back
				</Button>

				<div className="flex items-center gap-2">
					{snippet.is_public && (
						<Button variant="ghost" size="sm" onClick={handleShare}>
							{shareSuccess ? (
								<Check className="h-4 w-4 text-green-600" />
							) : (
								<Share className="h-4 w-4" />
							)}
							{shareSuccess ? "Copied!" : "Share"}
						</Button>
					)}

					{!isOwner && snippet.is_public && (
						<Button variant="ghost" size="sm" onClick={handleFork}>
							<GitFork className="h-4 w-4" />
							Fork ({snippet.fork_count})
						</Button>
					)}

					{isOwner && (
						<>
							<Button
								variant="ghost"
								size="sm"
								onClick={() => setEditModalOpen(true)}
							>
								<Edit3 className="h-4 w-4" />
								Edit
							</Button>

							<Dialog
								open={deleteDialogOpen}
								onOpenChange={setDeleteDialogOpen}
							>
								<DialogTrigger asChild>
									<Button
										variant="ghost"
										size="sm"
										className="text-destructive"
									>
										<Trash2 className="h-4 w-4" />
										Delete
									</Button>
								</DialogTrigger>
								<DialogContent>
									<DialogHeader>
										<DialogTitle>Delete Snippet</DialogTitle>
										<DialogDescription>
											Are you sure you want to delete this snippet? This action
											cannot be undone.
										</DialogDescription>
									</DialogHeader>
									<DialogFooter>
										<Button
											variant="outline"
											onClick={() => setDeleteDialogOpen(false)}
											disabled={deleting}
										>
											Cancel
										</Button>
										<Button
											variant="destructive"
											onClick={handleDelete}
											disabled={deleting}
										>
											{deleting ? (
												<Loader2 className="h-4 w-4 animate-spin mr-2" />
											) : null}
											Delete
										</Button>
									</DialogFooter>
								</DialogContent>
							</Dialog>
						</>
					)}
				</div>
			</div>

			<Card className="mb-6">
				<CardContent className="p-0">
					<div className="p-4 border-b">
						<div className="flex items-center gap-3 mb-3">
							<h1 className="text-2xl font-bold">{snippet.title}</h1>
							<Badge variant="secondary">{snippet.language}</Badge>
							{snippet.forked_from && (
								<Badge variant="outline">
									<GitFork className="h-3 w-3 mr-1" />
									Forked
								</Badge>
							)}
						</div>
					</div>

					<div className="relative">
						<SyntaxHighlighter
							language={getLanguageForHighlighter(snippet.language)}
							style={vscDarkPlus}
							customStyle={{
								margin: 0,
								borderRadius: 0,
								fontSize: "14px",
							}}
							showLineNumbers={true}
						>
							{snippet.content}
						</SyntaxHighlighter>
						<Button
							variant="secondary"
							size="sm"
							className="absolute top-3 right-3"
							onClick={handleCopy}
						>
							{copySuccess ? (
								<Check className="h-4 w-4 text-green-600" />
							) : (
								<Copy className="h-4 w-4" />
							)}
						</Button>
					</div>
				</CardContent>
			</Card>

			<div className="flex items-center justify-between text-sm text-muted-foreground">
				<div className="flex items-center gap-4">
					<span>by {snippet.user_id}</span>
					<span>{formatDate(snippet.created_at)}</span>
					<div className="flex items-center gap-2">
						{isOwner && (
							<Button
								variant="ghost"
								size="sm"
								onClick={togglePublic}
								className="h-8 px-2"
							>
								{snippet.is_public ? (
									<Globe className="h-4 w-4" />
								) : (
									<Lock className="h-4 w-4" />
								)}
								{snippet.is_public ? "Public" : "Private"}
							</Button>
						)}
						{!snippet.is_public && !isOwner && (
							<Badge variant="secondary">
								<Lock className="h-3 w-3 mr-1" />
								Private
							</Badge>
						)}
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="ghost"
						size="sm"
						onClick={toggleFavorite}
						className="h-8 px-2"
					>
						{snippet.is_favorite ? (
							<Heart className="h-4 w-4 fill-red-500 text-red-500" />
						) : (
							<HeartOff className="h-4 w-4" />
						)}
					</Button>
					<span>Last updated {formatDate(snippet.updated_at)}</span>
				</div>
			</div>

			<EditSnippetModal
				open={editModalOpen}
				onOpenChange={setEditModalOpen}
				snippet={snippet}
				onSnippetUpdated={handleSnippetUpdated}
			/>
		</div>
	);
}
