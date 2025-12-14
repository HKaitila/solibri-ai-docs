import { NextResponse } from "next/server";

// Mock articles data - In production, this would come from Zendesk
const mockArticles = [
  {
    id: "1",
    title: "IFC Standards Supported by Solibri",
    content: "This article describes which IFC standards Solibri supports including IFC 2x3, IFC 4, and IFC 4.3.",
    category: "Technical",
    updatedAt: new Date("2024-06-03").toISOString(),
  },
  {
    id: "2",
    title: "IFC Model Requirements",
    content: "The level of information in an IFC model affects how well Solibri can process it.",
    category: "Technical",
    updatedAt: new Date("2024-02-12").toISOString(),
  },
  {
    id: "3",
    title: "Clash Detection Overview",
    content: "Learn how to use Solibri's clash detection features to identify conflicts in your BIM models.",
    category: "Features",
    updatedAt: new Date("2024-05-15").toISOString(),
  },
  {
    id: "4",
    title: "Troubleshooting Common Crashes",
    content: "Common issues that cause Solibri to crash and how to resolve them.",
    category: "Support",
    updatedAt: new Date("2024-04-20").toISOString(),
  },
  {
    id: "5",
    title: "Ruleset Configuration Guide",
    content: "Configure rulesets to validate your BIM models against project standards.",
    category: "Technical",
    updatedAt: new Date("2024-03-10").toISOString(),
  },
  {
    id: "6",
    title: "API Integration Guide",
    content: "Integrate Solibri with your applications using our REST API.",
    category: "Integration",
    updatedAt: new Date("2024-01-05").toISOString(),
  },
  {
    id: "7",
    title: "Model Performance Optimization",
    content: "Tips for optimizing model performance and improving detection speed.",
    category: "Performance",
    updatedAt: new Date("2024-07-22").toISOString(),
  },
  {
    id: "8",
    title: "Getting Started with Solibri",
    content: "A beginner's guide to using Solibri for BIM collaboration and quality assurance.",
    category: "Tutorial",
    updatedAt: new Date("2024-08-01").toISOString(),
  },
  {
    id: "9",
    title: "Advanced Configuration Options",
    content: "Advanced settings for power users including ruleset customization and API usage.",
    category: "Advanced",
    updatedAt: new Date("2024-06-15").toISOString(),
  },
];

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      data: mockArticles,
    });
  } catch (error) {
    console.error("[/api/articles]", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Failed to fetch articles",
      },
      { status: 500 }
    );
  }
}