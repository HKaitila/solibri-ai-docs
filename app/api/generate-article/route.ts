import { NextRequest, NextResponse } from 'next/server';
import { ClaudeProvider } from '../providers/llm/claude';

export async function POST(request: NextRequest) {
  try {
    const { releaseNotes, title } = await request.json();

    if (!releaseNotes || !title) {
      return NextResponse.json(
        { success: false, message: 'Missing releaseNotes or title' },
        { status: 400 }
      );
    }

    const llm = new ClaudeProvider();

    const content = await llm.generateUpdate(releaseNotes, `# ${title}\n\n[Article to be created]`);

    return NextResponse.json({
      success: true,
      data: { content },
    });
  } catch (error) {
    console.error('[Generate Article] Error:', error);
    return NextResponse.json(
      { success: false, message: error instanceof Error ? error.message : 'Failed to generate article' },
      { status: 500 }
    );
  }
}
