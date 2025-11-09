import Link from "next/link";
import { notFound } from "next/navigation";
import { getExerciseConfig } from "@/app/actions";
import { ArrowLeftIcon } from "@/components/icons";
import { ExerciseContent } from "./ExerciseContent";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ExercisePage({ params }: PageProps) {
  const { id } = await params;

  let config;
  try {
    config = await getExerciseConfig(id);
  } catch {
    notFound();
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-10 relative">
      <Link
        href="/"
        className="absolute top-10 left-10 no-underline text-sm font-medium flex items-center gap-1 transition-opacity hover:opacity-60"
      >
        <ArrowLeftIcon className="w-4 h-4" />
        <span>Back</span>
      </Link>

      <div className="max-w-[600px] w-full">
        <h1 className="text-2xl font-semibold mb-2 text-center">
          Exercise {id}
        </h1>

        <ExerciseContent exerciseId={id} config={config} />
      </div>
    </div>
  );
}
