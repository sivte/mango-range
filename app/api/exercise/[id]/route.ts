/**
 * Controller layer
 */

import { NextResponse } from "next/server";
import { exerciseService } from "@/services/exercise.service";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { id } = await context.params;

    // Delegate to service layer
    const config = await exerciseService.getExerciseConfig(id);

    return NextResponse.json(config, {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    if (error instanceof Error) {
      const statusCode = error.message.includes("not found") ? 404 : 400;

      return NextResponse.json(
        {
          error: error.message,
        },
        { status: statusCode }
      );
    }

    // Generic error
    return NextResponse.json(
      {
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
