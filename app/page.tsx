import Link from "next/link";
import { HeartIcon } from "@/components/icons";
import { Badge } from "@/components/Badge";

export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center p-5 bg-background">
      <main className="max-w-[900px] w-full py-15 px-10">
        <div className="text-center mb-15">
          <h1 className="text-5xl font-extrabold mb-4 tracking-tight flex flex-col md:flex-row items-center justify-center gap-3 text-text-primary">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-16 h-16 md:w-12 md:h-12"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M21 11h-1.184a2.982 2.982 0 0 0-5.632 0H9.816a2.982 2.982 0 0 0-5.632 0H3a1 1 0 0 0 0 2h1.184a2.982 2.982 0 0 0 5.632 0h4.368a2.982 2.982 0 0 0 5.632 0H21a1 1 0 0 0 0-2M7 13a1 1 0 1 1 1-1a1 1 0 0 1-1 1m10 0a1 1 0 1 1 1-1a1 1 0 0 1-1 1"
              />
            </svg>
            <span>Range Component</span>
          </h1>
          <p className="text-lg leading-relaxed max-w-[600px] mx-auto text-text-secondary">
            Custom range slider component built with React and TypeScript
          </p>
          <div className="flex gap-2 flex-wrap justify-center mt-4">
            <Badge>Multi-touch support</Badge>
            <Badge>Push thumb control</Badge>
            <Badge>Editable values</Badge>
            <Badge>Fixed values mode</Badge>
            <Badge>Vertical/Horizontal support</Badge>
            <Badge>Thumb gap</Badge>
            <Badge>Custom formatting</Badge>
            <Badge>Step control</Badge>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-6 mb-15 justify-center items-center md:items-stretch">
          <Link
            href="/exercise/1"
            className="flex items-center justify-between rounded-lg p-8 no-underline cursor-pointer transition-colors w-full max-w-[450px] bg-card-bg border border-card-border text-foreground hover:border-(--card-hover-border)!"
          >
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3 text-text-primary">
                Exercise 1
              </h2>
              <p className="text-[15px] leading-relaxed mb-4 text-text-secondary">
                Normal range with editable min/max values. Drag handles or click
                values to edit.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge>Editable values</Badge>
                <Badge>1-100 range</Badge>
              </div>
            </div>
          </Link>

          <Link
            href="/exercise/2"
            className="flex items-center justify-between rounded-lg p-8 no-underline cursor-pointer transition-colors w-full max-w-[450px] bg-card-bg border border-card-border text-foreground hover:border-(--card-hover-border)!"
          >
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-3 text-text-primary">
                Exercise 2
              </h2>
              <p className="text-[15px] leading-relaxed mb-4 text-text-secondary">
                Fixed values range with predefined price points. Only selectable
                values from array.
              </p>
              <div className="flex gap-2 flex-wrap">
                <Badge>Currency format</Badge>
                <Badge>Fixed values</Badge>
              </div>
            </div>
          </Link>
        </div>

        <footer className="text-center pt-10 border-t border-(--border-color)">
          <p className="text-xs text-text-tertiary">
            Made with Next.js 16, React 19, TypeScript and love{" "}
            <HeartIcon className="w-3 h-3" />
          </p>
        </footer>
      </main>
    </div>
  );
}
