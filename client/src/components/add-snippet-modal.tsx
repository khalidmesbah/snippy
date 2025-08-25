import {
	Dialog,
	DialogTrigger,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogDescription,
	DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
	Select,
	SelectTrigger,
	SelectValue,
	SelectContent,
	SelectItem,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";

import { useForm } from "react-hook-form";
import { useState } from "react";

type AddSnippetModalProps = {
	collections: { id: string; name: string }[];
	userId: string;
	onSnippetCreated?: () => void;
};

type FormValues = {
	title: string;
	content: string;
	tags: string[];
	collection_id: string;
	is_public: boolean;
	is_favorite: boolean;
};

export function AddSnippetModal({
	collections,
	userId,
	onSnippetCreated,
}: AddSnippetModalProps) {
	const [open, setOpen] = useState(false);
	const { register, handleSubmit, reset, setValue, watch, formState } =
		useForm<FormValues>({
			defaultValues: {
				title: "",
				content: "",
				tags: [""],
				collection_id: "",
				is_public: false,
				is_favorite: false,
			},
		});
	const { isSubmitting } = formState;

	const onSubmit = async (values: FormValues) => {
		try {
			console.log(values, "kfjslakdjf lkasjdfk ljasd klfj");
			const res = await fetch("http://localhost:8080/api/snippets", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify({ ...values, user_id: userId }),
			});
			console.log(res, values, "kfjslakdjf lkasjdfk ljasd klfj");

			if (!res.ok) throw new Error("Failed to create snippet");

			if (onSnippetCreated) onSnippetCreated();

			reset();
			setOpen(false);
		} catch (err) {
			console.error(err);
		}
	};

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogTrigger asChild>
				<Button>Add Snippet</Button>
			</DialogTrigger>

			<DialogContent className="sm:max-w-[600px]">
				<DialogHeader>
					<DialogTitle>Create Snippet</DialogTitle>
					<DialogDescription>
						Fill out the details and hit "Create".
					</DialogDescription>
				</DialogHeader>

				<form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						<div>
							<Label htmlFor="title">Title</Label>
							<Input {...register("title", { required: true })} id="title" />
						</div>

						<div className="col-span-1 sm:col-span-2">
							<Label htmlFor="collection">Collection</Label>
							<Select
								value={watch("collection_id")}
								onValueChange={(val) => setValue("collection_id", val)}
							>
								<SelectTrigger>
									<SelectValue placeholder="Choose collection" />
								</SelectTrigger>
								<SelectContent>
									{collections.map((c) => (
										<SelectItem key={c.id} value={c.id}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>

						<div className="col-span-1 sm:col-span-2">
							<Label htmlFor="content">Content</Label>
							<textarea
								{...register("content", { required: true })}
								rows={6}
								className="w-full border rounded px-3 py-2"
							/>
						</div>
					</div>

					<div className="flex items-center gap-4">
						<div className="flex items-center gap-2">
							<Checkbox
								id="is_public"
								checked={watch("is_public")}
								onCheckedChange={(val) => setValue("is_public", !!val)}
							/>
							<Label htmlFor="is_public">Public</Label>
						</div>

						<div className="flex items-center gap-2">
							<Checkbox
								id="is_favorite"
								checked={watch("is_favorite")}
								onCheckedChange={(val) => setValue("is_favorite", !!val)}
							/>
							<Label htmlFor="is_favorite">Favorite</Label>
						</div>
					</div>

					<DialogFooter>
						<Button type="submit" disabled={isSubmitting}>
							Create
						</Button>
					</DialogFooter>
				</form>
			</DialogContent>
		</Dialog>
	);
}
