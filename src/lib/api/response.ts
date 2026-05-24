import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { AppError } from "@/lib/errors";
import { logger } from "@/lib/logger";
import { corsHeaders } from "@/lib/security/cors";

export function jsonOk<T>(data: T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, data }, init);
}

export function jsonError(error: unknown) {
  if (error instanceof ZodError) {
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: "VALIDATION_ERROR",
          message: "The request payload is invalid.",
          issues: error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  if (error instanceof AppError) {
    logger.warn({ error }, error.message);
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: error.code,
          message: error.message,
          metadata: error.metadata,
        },
      },
      { status: error.statusCode },
    );
  }

  logger.error({ error }, "Unhandled API error");
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "BookLeaf support automation is temporarily unavailable.",
      },
    },
    { status: 500 },
  );
}

export function createSseResponse(events: AsyncIterable<{ event: string; data: unknown }>) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      try {
        for await (const event of events) {
          controller.enqueue(
            encoder.encode(`event: ${event.event}\ndata: ${JSON.stringify(event.data)}\n\n`),
          );
        }
      } catch (error) {
        controller.enqueue(
          encoder.encode(
            `event: error\ndata: ${JSON.stringify({
              message: "Streaming response failed.",
            })}\n\n`,
          ),
        );
        logger.error({ error }, "Streaming response failed");
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
      ...corsHeaders,
    },
  });
}
