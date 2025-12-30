import React from "react";
import { PresentationCard } from "./PresentationCard";
import { PlusIcon } from "@radix-ui/react-icons";
import { useRouter } from "next/navigation";
import { PresentationResponse } from "@/app/(presentation-generator)/services/api/dashboard";

interface PresentationGridProps {
  presentations: PresentationResponse[];
  type: "slide" | "video";
  isLoading?: boolean;
  error?: string | null;
  onPresentationDeleted?: (presentationId: string) => void;
}

export const PresentationGrid = ({
  presentations,
  type,
  isLoading = false,
  error = null,
  onPresentationDeleted,
}: PresentationGridProps) => {
  const router = useRouter();
  const handleCreateNewPresentation = () => {
    if (type === "slide") {
      router.push("/upload");
    } else {
      router.push("/editor");
    }
  };

  const ShimmerCard = () => (
    <div className="flex flex-col gap-4 min-h-[200px] bg-card border border-border rounded-lg p-4 animate-pulse">
      <div className="w-full h-24 bg-muted rounded-lg"></div>
      <div className="space-y-3">
        <div className="h-4 bg-muted rounded w-3/4"></div>
        <div className="h-3 bg-muted rounded w-1/2"></div>
      </div>
    </div>
  );

  const CreateNewCard = () => (
    <div
      onClick={handleCreateNewPresentation}
      className="flex flex-col gap-4 min-h-[200px] cursor-pointer group border border-border hover:border-primary bg-card hover:bg-card/80 rounded-lg items-center justify-center transition-all duration-300"
    >
      <div className="rounded-full bg-muted group-hover:bg-primary/20 p-4 transition-all duration-300">
        <PlusIcon className="w-8 h-8 text-muted-foreground group-hover:text-primary transition-all duration-300" />
      </div>
      <div className="text-center">
        <h3 className="font-semibold text-foreground group-hover:text-primary mb-1">
          Create {type === "slide" ? "New" : "Video"} Presentation
        </h3>
        <p className="text-sm text-muted-foreground group-hover:text-foreground px-4">
          Start from scratch and bring your ideas to life
        </p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="flex flex-col gap-4 min-h-[200px] cursor-pointer group border border-border bg-card rounded-lg items-center justify-center animate-pulse">
          <div className="rounded-full bg-muted p-4">
            <div className="w-8 h-8" />
          </div>
          <div className="text-center space-y-2">
            <div className="h-4 bg-muted rounded w-32 mx-auto"></div>
            <div className="h-3 bg-muted rounded w-48 mx-auto"></div>
          </div>
        </div>
        {[...Array(3)].map((_, i) => (
          <ShimmerCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CreateNewCard />
        <div className="col-span-3 flex items-center justify-center">
          <div className="text-center text-muted-foreground">
            <p className="mb-2">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="text-primary hover:text-primary/80 underline"
            >
              Try again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <CreateNewCard />
      {presentations &&
        presentations.length > 0 &&
        presentations.map((presentation) => (
          <PresentationCard
            key={presentation.id}
            id={presentation.id}
            title={presentation.title}
            created_at={presentation.created_at}
            slide={presentation.slides[0]}
            onDeleted={onPresentationDeleted}
          />
        ))}
    </div>
  );
};
