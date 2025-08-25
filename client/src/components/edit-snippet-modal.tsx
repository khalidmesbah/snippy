import { useState, useEffect } from "react";
import { useUser } from "@clerk/clerk-react";
import { Loader2, Save, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";

import LANGUAGES from "@/lib/hljsLanguages.json";

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

interface Collection {
	id: string;
	user_id: string;
	name: string;
	color: string;
	created_at: string;
	updated_at: string;
}

interface EditSnippetModalProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	snippet: Snippet;
	onSnippetUpdated: (updatedSnippet: Snippet) => void;
}

const API_BASE_URL = "http://localhost:8080/api";

export function EditSnippetModal({
	open,
	onOpenChange,
	snippet,
	onSnippetUpdated,
}: EditSnippetModalProps) {
	const { user } = useUser();
	const [collections, setCollections] = useState<Collection[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string>("");
	const [formData, setFormData] = useState({
		title: snippet.title,
		content: snippet.content,
		language: snippet.language || "plaintext",
		collection_id: snippet.collection_id || "",
		is_public: snippet.is_public,
	});
	const [validationErrors, setValidationErrors] = useState({
		title: "",
		content: "",
	});

	const userId = user?.id;

	// Fetch collections when modal opens
	useEffect(() => {
		const fetchCollections = async () => {
			if (!userId || !open) return;

			try {
				const response = await fetch(
					`${API_BASE_URL}/collections?user_id=${userId}`,
				);
				if (response.ok) {
					const data = await response.json();
					setCollections(data?.data || []);
				}
			} catch (error) {
				console.error("Error fetching collections:", error);
			}
		};

		fetchCollections();
	}, [userId, open]);

	// Reset form when snippet changes or modal opens
	useEffect(() => {
		if (open && snippet) {
			setFormData({
				title: snippet.title || "",
				content: snippet.content || "",
				language: snippet.language || "plaintext",
				collection_id: snippet.collection_id || "",
				is_public: snippet.is_public || false,
			});
			setError("");
			setValidationErrors({ title: "", content: "" });
		}
	}, [snippet, open]);

	const validateForm = () => {
		const errors = { title: "", content: "" };
		let isValid = true;

		if (!formData.title.trim()) {
			errors.title = "Title is required";
			isValid = false;
		}

		if (!formData.content.trim()) {
			errors.content = "Code content is required";
			isValid = false;
		}

		setValidationErrors(errors);
		return isValid;
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();

		if (!validateForm() || !userId) return;

		setLoading(true);
		setError("");

		try {
			const updateData: any = {
				title: formData.title.trim(),
				content: formData.content.trim(),
				language: formData.language || "plaintext",
				is_public: formData.is_public,
			};

			// Only include collection_id if it has a value
			if (formData.collection_id) {
				updateData.collection_id = formData.collection_id;
			}

			const response = await fetch(
				`${API_BASE_URL}/snippets/${snippet.id}?user_id=${userId}`,
				{
					method: "PUT",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(updateData),
				},
			);

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || "Failed to update snippet");
			}

			// Fetch the updated snippet
			const snippetResponse = await fetch(
				`${API_BASE_URL}/snippets/${snippet.id}?user_id=${userId}`,
			);

			if (snippetResponse.ok) {
				const snippetData = await snippetResponse.json();
				onSnippetUpdated(snippetData.data);
			}

			// Close modal after successful update
			onOpenChange(false);
		} catch (error) {
			console.error("Error updating snippet:", error);
			setError(
				error instanceof Error ? error.message : "Failed to update snippet",
			);
		} finally {
			setLoading(false);
		}
	};

	const handleInputChange = (field: string, value: any) => {
		setFormData((prev) => ({ ...prev, [field]: value }));

		// Clear validation error when user starts typing
		if (field === "title" || field === "content") {
			setValidationErrors((prev) => ({ ...prev, [field]: "" }));
		}
	};

	const handleClose = () => {
		// Reset loading state when closing
		if (loading) return;

		// Reset form to original values
		setFormData({
			title: snippet.title || "",
			content: snippet.content || "",
			language: snippet.language || "plaintext",
			collection_id: snippet.collection_id || "",
			is_public: snippet.is_public || false,
		});
		setError("");
		setValidationErrors({ title: "", content: "" });
		onOpenChange(false);
	};

	// Don't render if no snippet
	if (!snippet) return null;

	return (
		<Dialog open={open} onOpenChange={handleClose}>
			<DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
				<DialogHeader>
					<DialogTitle>Edit Snippet</DialogTitle>
					<DialogDescription>
						Update your snippet details. Title and content are required.
					</DialogDescription>
				</DialogHeader>

				{error && (
					<Alert variant="destructive">
						<AlertDescription>{error}</AlertDescription>
					</Alert>
				)}

				<form onSubmit={handleSubmit} className="space-y-4">
					{/* Title */}
					<div className="space-y-2">
						<Label htmlFor="title">
							Title <span className="text-destructive">*</span>
						</Label>
						<Input
							id="title"
							value={formData.title}
							onChange={(e) => handleInputChange("title", e.target.value)}
							placeholder="Enter snippet title"
							className={validationErrors.title ? "border-destructive" : ""}
						/>
						{validationErrors.title && (
							<p className="text-sm text-destructive">
								{validationErrors.title}
							</p>
						)}
					</div>

					{/* Language */}
					<div className="space-y-2">
						<Label htmlFor="language">Language</Label>
						<Select
							value={formData.language}
							onValueChange={(value) => handleInputChange("language", value)}
						>
							<SelectTrigger>
								<SelectValue placeholder="Select language" />
							</SelectTrigger>
							<SelectContent className="max-h-[200px]">
								<SelectItem value="plaintext">Plain Text</SelectItem>
								{LANGUAGES.map((lang) => (
									<SelectItem key={lang} value={lang}>
										{lang}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Collection */}
					<div className="space-y-2">
						<Label htmlFor="collection">Collection</Label>
						<Select
							value={formData.collection_id || undefined}
							onValueChange={(value) =>
								handleInputChange(
									"collection_id",
									value === "none" ? "" : value,
								)
							}
						>
							<SelectTrigger>
								<SelectValue placeholder="No collection" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="none">No collection</SelectItem>
								{collections.map((collection) => (
									<SelectItem key={collection.id} value={collection.id}>
										{collection.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Code Content */}
					<div className="space-y-2">
						<Label htmlFor="content">
							Code Content <span className="text-destructive">*</span>
						</Label>
						<Textarea
							id="content"
							value={formData.content}
							onChange={(e) => handleInputChange("content", e.target.value)}
							placeholder="Enter your code here..."
							className={`min-h-[200px] font-mono text-sm ${
								validationErrors.content ? "border-destructive" : ""
							}`}
						/>
						{validationErrors.content && (
							<p className="text-sm text-destructive">
								{validationErrors.content}
							</p>
						)}
					</div>

					{/* Public Toggle */}
					<div className="flex items-center space-x-2">
						<Switch
							id="is_public"
							checked={formData.is_public}
							onCheckedChange={(checked) =>
								handleInputChange("is_public", checked)
							}
						/>
						<Label htmlFor="is_public" className="text-sm">
							Make this snippet public
						</Label>
					</div>
				</form>

				<DialogFooter className="gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={handleClose}
						disabled={loading}
					>
						<X className="h-4 w-4 mr-2" />
						Cancel
					</Button>
					<Button type="submit" onClick={handleSubmit} disabled={loading}>
						{loading ? (
							<Loader2 className="h-4 w-4 mr-2 animate-spin" />
						) : (
							<Save className="h-4 w-4 mr-2" />
						)}
						{loading ? "Saving..." : "Save Changes"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
