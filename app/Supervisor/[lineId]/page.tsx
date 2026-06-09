"use client";

import ProductionTable from "@/app/components/ProductionTable";
import { useParams } from "next/navigation";

export default function Page() {
  const params = useParams<{ lineId: string }>();
  const lineId = params.lineId;

  return (
    <div className="flex flex-col bg-neutral-50 rounded-xs w-full h-full">
      <div>
        <h1 className="text-2xl text-slate-900 font-extrabold p-4 font-sans text-center">{lineId} Line Overview Page</h1>
      </div>

      <ProductionTable />
    </div>
  );
}
