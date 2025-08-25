//

import { useEffect, useMemo, useState } from "react";
import {
	createFileRoute,
	redirect,
	useLoaderData,
} from "@tanstack/react-router";

import { SnippetCard } from "@/components/snippet-card";
import { Input } from "@/components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import {
	Popover,
	PopoverTrigger,
	PopoverContent,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { MultiSelect } from "@/components/multi-select";
import { AddSnippetModal } from "@/components/add-snippet-modal";
import { useAuth, useUser } from "@clerk/clerk-react";

export const Route = createFileRoute("/")({
	loader: async () => {
		const [snippetsRes, collectionsRes] = await Promise.all([
			fetch("http://localhost:8080/api/snippets"),
			fetch("http://localhost:8080/api/collections?user_id=user_123"),
		]);

		if (!snippetsRes.ok || !collectionsRes.ok)
			throw new Error("Failed to fetch data");

		const [snippets, collections] = await Promise.all([
			snippetsRes.json(),
			collectionsRes.json(),
		]);

		return { snippets: snippets.data, collections: collections.data };
	},

	component: App,
});

function App() {
	const { snippets: rawSnippets, collections } = useLoaderData({ from: "/" });
	const [search, setSearch] = useState("");
	const [sortField, setSortField] = useState("created_at");
	const [sortOrder, setSortOrder] = useState("desc");
	const [filters, setFilters] = useState({
		tags: [] as string[],
		collections: [] as string[],
		forked: false,
		public: false,
		favorite: false,
	});
	const { user } = useUser();

	console.dir(user);

	console.log(rawSnippets, collections);

	const totalCount = rawSnippets.length;
	const publicCount = rawSnippets.filter((s) => s.is_public).length;
	const favoriteCount = rawSnippets.filter((s) => s.is_favorite).length;
	const forkedCount = rawSnippets.filter((s) => s.forked_from !== null).length;

	const snippets = useMemo(() => {
		let data = [...rawSnippets];

		if (search) {
			data = data.filter((s) =>
				(s.title + s.content).toLowerCase().includes(search.toLowerCase()),
			);
		}

		// if (filters.tags.length > 0)
		// 	data = data.filter((s) => filters.tags.includes(s.language));

		if (filters.collections.length > 0)
			data = data.filter(
				(s) => s.collection_id && filters.collections.includes(s.collection_id),
			);

		if (filters.forked) data = data.filter((s) => s.forked_from !== null);
		if (filters.public) data = data.filter((s) => s.is_public === true);
		if (filters.favorite) data = data.filter((s) => s.is_favorite === true);

		data.sort((a, b) => {
			const aValue = a[sortField];
			const bValue = b[sortField];
			if (sortOrder === "asc") return aValue > bValue ? 1 : -1;
			return aValue < bValue ? 1 : -1;
		});

		return data;
	}, [rawSnippets, search, sortField, sortOrder, filters]);

	const clearFilters = () => {
		setFilters({
			tags: [],
			collections: [],
			forked: false,
			public: false,
			favorite: false,
		});
	};

	if (!user) {
		return <div>user not found</div>;
	}

	return (
		<div className="px-4 py-6">
			{/* 🔼 Header Section */}
			<div className="flex flex-wrap justify-between items-center mb-6 gap-4">
				<div>
					<h2 className="text-2xl font-semibold">My Snippets</h2>
					<p className="text-muted-foreground text-sm">
						All your snippets • {totalCount} total ({publicCount} public,{" "}
						{favoriteCount} favorites, {forkedCount} forked)
					</p>
				</div>
				<AddSnippetModal
					userId={user.id}
					collections={collections}
					onSnippetCreated={() => window.location.reload()}
				/>
			</div>

			{/* 🔍 Filters + Search */}
			<div className="flex flex-wrap gap-4 mb-6 items-end">
				<Input
					placeholder="Search snippets..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="flex-1 min-w-[200px]"
				/>

				<div className="flex flex-col justify-center gap-1">
					<label className="text-sm text-muted-foreground">Sort By</label>
					<div className="flex gap-2">
						<select
							value={sortField}
							onChange={(e) => setSortField(e.target.value)}
							className="border rounded px-2 py-1 bg-background text-foreground"
						>
							<option value="created_at">Created</option>
							<option value="updated_at">Updated</option>
							<option value="title">Title</option>
						</select>

						<ToggleGroup
							type="single"
							value={sortOrder}
							onValueChange={(v) => setSortOrder(v || "desc")}
							className="items-center"
						>
							<ToggleGroupItem value="asc">Asc</ToggleGroupItem>
							<ToggleGroupItem value="desc">Desc</ToggleGroupItem>
						</ToggleGroup>
					</div>
				</div>

				{/* 	<div className="flex items-end gap-2"> */}
				{/* 		<Popover> */}
				{/* 			<PopoverTrigger asChild> */}
				{/* 				<Button variant="outline">Filters</Button> */}
				{/* 			</PopoverTrigger> */}
				{/* 			<PopoverContent className="gap-4 w-[260px] flex flex-col items-center"> */}
				{/* 				<MultiSelect */}
				{/* 					options={hljsLanguages.map((lang) => ({ */}
				{/* 						label: lang, */}
				{/* 						value: lang, */}
				{/* 					}))} */}
				{/* 					onValueChange={(langs) => */}
				{/* 						setFilters((f) => ({ ...f, tags: langs })) */}
				{/* 					} */}
				{/* 					defaultValue={filters.tags} */}
				{/* 					placeholder="tags" */}
				{/* 				/> */}
				{/**/}
				{/* 				<MultiSelect */}
				{/* 					options={collections.map((c) => ({ */}
				{/* 						label: c.name, */}
				{/* 						value: c.id, */}
				{/* 					}))} */}
				{/* 					onValueChange={(vals) => */}
				{/* 						setFilters((f) => ({ ...f, collections: vals })) */}
				{/* 					} */}
				{/* 					defaultValue={filters.collections} */}
				{/* 					placeholder="Collections" */}
				{/* 				/> */}
				{/**/}
				{/* 				<ToggleGroup */}
				{/* 					type="multiple" */}
				{/* 					className="flex gap-2 flex-wrap" */}
				{/* 					value={Object.entries(filters) */}
				{/* 						.filter( */}
				{/* 							([key, val]) => */}
				{/* 								["public", "favorite", "forked"].includes(key) && val, */}
				{/* 						) */}
				{/* 						.map(([key]) => key)} */}
				{/* 					onValueChange={(values: string[]) => */}
				{/* 						setFilters((f) => ({ */}
				{/* 							...f, */}
				{/* 							public: values.includes("public"), */}
				{/* 							favorite: values.includes("favorite"), */}
				{/* 							forked: values.includes("forked"), */}
				{/* 						})) */}
				{/* 					} */}
				{/* 				> */}
				{/* 					{(["public", "favorite", "forked"] as const).map((key) => ( */}
				{/* 						<ToggleGroupItem key={key} value={key}> */}
				{/* 							{key.charAt(0).toUpperCase() + key.slice(1)} */}
				{/* 						</ToggleGroupItem> */}
				{/* 					))} */}
				{/* 				</ToggleGroup> */}
				{/**/}
				{/* 				<Button */}
				{/* 					variant="destructive" */}
				{/* 					className="px-4 text-sm" */}
				{/* 					onClick={clearFilters} */}
				{/* 				> */}
				{/* 					Clear Filters */}
				{/* 				</Button> */}
				{/* 			</PopoverContent> */}
				{/* 		</Popover> */}
				{/* 	</div> */}
			</div>

			{/* 📄 Snippet Grid */}
			<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
				{snippets.map((snippet) => (
					<SnippetCard key={snippet.id} snippet={snippet} />
				))}
			</div>
		</div>
	);
}
