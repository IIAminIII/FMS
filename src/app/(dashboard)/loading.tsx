import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return <div className="space-y-6"><div><Skeleton className="h-4 w-32" /><Skeleton className="mt-3 h-9 w-72" /><Skeleton className="mt-3 h-4 w-[28rem] max-w-full" /></div><div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">{Array.from({ length: 6 }, (_, i) => <Skeleton key={i} className="h-32 rounded-xl" />)}</div><div className="grid gap-5 xl:grid-cols-3"><Skeleton className="h-80 rounded-xl xl:col-span-2" /><Skeleton className="h-80 rounded-xl" /></div></div>;
}
