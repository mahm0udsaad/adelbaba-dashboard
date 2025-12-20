import { DisputeEvidence } from "@/src/services/disputes-api"
import { FileIcon, ImageIcon, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"

interface EvidenceListProps {
  evidence: DisputeEvidence[]
}

export function EvidenceList({ evidence }: EvidenceListProps) {
  if (evidence.length === 0) return null

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase text-muted-foreground tracking-wider">
        Evidence Files ({evidence.length})
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {evidence.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2 rounded bg-muted">
                {file.type === "pdf" ? (
                  <FileIcon className="h-4 w-4 text-rose-500" />
                ) : (
                  <ImageIcon className="h-4 w-4 text-blue-500" />
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{file.file_name}</p>
                <p className="text-xs text-muted-foreground">{file.human_readable_size}</p>
              </div>
            </div>
            <Button size="icon" variant="ghost" asChild>
              <a href={file.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </div>
        ))}
      </div>
    </div>
  )
}

