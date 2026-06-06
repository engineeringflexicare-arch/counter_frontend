import { redirect } from "next/navigation";

export default function Home() {
  // මෙම පිටුවට පැමිණි වහාම /Superuser වෙත යොමු කෙරේ
  redirect("/login");

  // මෙම කොටස ක්‍රියාත්මක නොවනු ඇත, මන්ද redirect එක මගින් වහාම පිටුව මාරු වේ.
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <h1 className="text-4xl font-bold text-gray-800">Welcome to Flexicare Dashboard</h1>
    </div>
  );
}
