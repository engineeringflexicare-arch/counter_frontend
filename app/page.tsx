import { redirect } from "next/navigation";

export default function Home() {
  redirect("/login");

  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800">Welcome to Flexicare Dashboard</h1>
    </div>
  );
}

// export default function Home() {
//   return (
//     <main className="flex  flex-col items-center justify-between ">
//       <CombinedTailwindLoader />
//     </main>
//   );
// }
