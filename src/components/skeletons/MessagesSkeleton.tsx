import { Skeleton } from "@/components/ui/skeleton";

export function ConversationListSkeleton() {
  return (
    <div className="space-y-2 p-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg px-3 py-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-3 w-12" />
            </div>
            <Skeleton className="h-3 w-full max-w-[180px]" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ChatMessagesSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className={`flex ${i % 2 === 0 ? "justify-end" : "justify-start"}`}>
          <Skeleton className={`h-12 rounded-2xl ${i % 2 === 0 ? "w-2/3" : "w-1/2"}`} />
        </div>
      ))}
    </div>
  );
}
