import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function FormSkeleton() {
  return (
    <Card>
      <CardHeader className="space-y-2">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-2/3" />
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Form fields */}
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        
        {/* Toggle */}
        <div className="flex items-center justify-between mt-4 p-4 border rounded-lg">
          <div>
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-3 w-32 mt-1" />
          </div>
          <Skeleton className="h-6 w-10 rounded-full" />
        </div>
        
        {/* Button */}
        <div className="flex justify-end mt-4">
          <Skeleton className="h-10 w-20" />
        </div>
      </CardContent>
    </Card>
  );
}