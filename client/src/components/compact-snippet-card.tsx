import { Link } from "@tanstack/react-router";
import { Star, GitFork, Globe, Folder, Beaker } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompactSnippetCardProps {
  snippet: {
    id: string;
    title: string;
    created_at: string;
    tag_names?: string[];
    is_favorite?: boolean;
    is_public?: boolean;
    forked_from?: string | null;
    collection_id?: string | null;
    fork_count?: number;
  };
  showStats?: boolean;
}

export const CompactSnippetCard = ({ snippet, showStats = false }: CompactSnippetCardProps) => (
  <Link to="/snippet/$id" params={{ id: snippet.id }} className="block">
    <div className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <h4 className="font-medium text-sm truncate">{snippet.title}</h4>
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            {new Date(snippet.created_at).toLocaleDateString()}
          </span>
        </div>
        
        {/* Tags at the bottom */}
        {snippet.tag_names && snippet.tag_names.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {snippet.tag_names.slice(0, 3).map((tagName: string) => (
              <Badge
                key={tagName}
                variant="secondary"
                className="text-xs px-1.5 py-0.5 max-w-[80px] truncate"
                title={tagName}
              >
                {tagName}
              </Badge>
            ))}
            {snippet.tag_names.length > 3 && (
              <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                +{snippet.tag_names.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
      
      {/* Indicator icons at bottom right */}
      <div className="flex items-center gap-1 ml-3 mt-auto">
        {snippet.is_favorite && (
          <Star className="h-3 w-3 fill-current text-yellow-500" />
        )}
        {snippet.is_public && (
          <Globe className="h-3 w-3 text-blue-500" />
        )}
        {snippet.forked_from && (
          <GitFork className="h-3 w-3 text-green-500" />
        )}
        {snippet.collection_id && (
          <Folder className="h-3 w-3 text-purple-500" />
        )}
        
        {/* Stats if showStats is true */}
        {showStats && snippet.fork_count && snippet.fork_count > 0 && (
          <div className="flex items-center gap-1 ml-2 text-xs text-muted-foreground">
            <GitFork className="h-3 w-3" />
            <span>{snippet.fork_count}</span>
          </div>
        )}
      </div>
    </div>
  </Link>
);
