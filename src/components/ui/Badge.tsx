// /src/components/ui/Badge.tsx
const statusColors: Record<string, string> = {
  Success: "bg-green-100 text-green-800",
  Failed: "bg-red-100 text-red-800",
  Cancelled: "bg-yellow-100 text-yellow-800",
  Pending: "bg-gray-100 text-gray-800"
};

export default function Badge({ status }: { status: string }) {
  return (
    <span className={`px-2 py-1 text-xs rounded-full font-medium ${statusColors[status] || "bg-gray-100 text-gray-800"}`}>
      {status}
    </span>
  );
}
