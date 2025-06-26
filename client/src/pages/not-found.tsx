import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 text-white flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-white mb-4">
          404
        </h1>
        <p className="text-gray-400 mb-8">
          Page not found
        </p>
        <a
          href="/"
          className="text-blue-400 hover:text-blue-200"
        >
          Go back home
        </a>
      </div>
    </div>
  );
}
