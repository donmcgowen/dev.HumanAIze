/**
 * PDF Extraction Module for Dexcom Clarity Reports
 * 
 * Extracts glucose readings and statistics from Dexcom Clarity PDF reports
 */

import { PDFParse } from "pdf-parse";

export interface ExtractedClarityData {
  averageGlucose?: number;
  minGlucose?: number;
  maxGlucose?: number;
  timeInRange?: number;
  timeAboveRange?: number;
  timeBelowRange?: number;
  standardDeviation?: number;
  coefficient?: number;
  estimatedA1C?: number;
  reportPeriod?: {
    startDate?: string;
    endDate?: string;
  };
  readings?: Array<{
    timestamp: string;
    value: number;
  }>;
  rawText: string;
}

/**
 * Extract text from PDF buffer
 */
export async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
  try {
    const parser = new PDFParse({ data: pdfBuffer });
    const data = await parser.getText();
    await parser.destroy();
    return data.text;
  } catch (error) {
    throw new Error(`Failed to parse PDF: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Parse Dexcom Clarity report text and extract key metrics
 */
export function parseClarityReportText(text: string): ExtractedClarityData {
  const data: ExtractedClarityData = {
    rawText: text,
  };

  // Extract average glucose (pattern: "Average Glucose: XXX mg/dL")
  const avgMatch = text.match(/Average\s+Glucose[:\s]+(\d+)\s*mg\/dL/i);
  if (avgMatch) {
    data.averageGlucose = parseInt(avgMatch[1], 10);
  }

  // Extract min glucose (pattern: "Lowest: XXX mg/dL")
  const minMatch = text.match(/Lowest[:\s]+(\d+)\s*mg\/dL/i);
  if (minMatch) {
    data.minGlucose = parseInt(minMatch[1], 10);
  }

  // Extract max glucose (pattern: "Highest: XXX mg/dL")
  const maxMatch = text.match(/Highest[:\s]+(\d+)\s*mg\/dL/i);
  if (maxMatch) {
    data.maxGlucose = parseInt(maxMatch[1], 10);
  }

  // Extract time in range, prioritizing explicit "XX% In Range" format.
  const inRangeMatch = text.match(/(\d+(?:\.\d+)?)\s*%\s+In\s+Range/i);
  if (inRangeMatch) {
    data.timeInRange = parseFloat(inRangeMatch[1]);
  } else {
    const tirMatch = text.match(/Time\s+in\s+Range[:\s]+(\d+(?:\.\d+)?)\s*%/i);
    if (tirMatch) {
      data.timeInRange = parseFloat(tirMatch[1]);
    }
  }

  // Extract time above range (pattern: "Time Above Range: XX%")
  const tarMatch = text.match(/Time\s+Above\s+Range[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  if (tarMatch) {
    data.timeAboveRange = parseFloat(tarMatch[1]);
  }

  // Extract time below range (pattern: "Time Below Range: XX%")
  const tbrMatch = text.match(/Time\s+Below\s+Range[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  if (tbrMatch) {
    data.timeBelowRange = parseFloat(tbrMatch[1]);
  }

  // Extract standard deviation
  const stdMatch = text.match(/Standard\s+Deviation[:\s]+(\d+(?:\.\d+)?)/i);
  if (stdMatch) {
    data.standardDeviation = parseFloat(stdMatch[1]);
  }

  // Extract coefficient of variation
  const cvMatch = text.match(/Coefficient\s+of\s+Variation[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  if (cvMatch) {
    data.coefficient = parseFloat(cvMatch[1]);
  }

  // Extract estimated A1C
  const a1cMatch = text.match(/Estimated\s+A1C[:\s]+(\d+(?:\.\d+)?)\s*%/i);
  if (a1cMatch) {
    data.estimatedA1C = parseFloat(a1cMatch[1]);
  }

  // Some reports provide GMI instead of Estimated A1C
  if (data.estimatedA1C === undefined) {
    const gmiMatch = text.match(/GMI[:\s]+(\d+(?:\.\d+)?)\s*%/i);
    if (gmiMatch) {
      data.estimatedA1C = parseFloat(gmiMatch[1]);
    }
  }

  // Final fallback: derive A1C estimate from average glucose
  if (data.estimatedA1C === undefined && typeof data.averageGlucose === "number") {
    data.estimatedA1C = Math.round((((data.averageGlucose / 28.7) + 2.15) * 100)) / 100;
  }

  // Extract report period dates
  const dateMatch = text.match(/(?:Report|Period)[:\s]*(\d{1,2}\/\d{1,2}\/\d{4})\s*(?:to|[-–])\s*(\d{1,2}\/\d{1,2}\/\d{4})/i);
  if (dateMatch) {
    data.reportPeriod = {
      startDate: dateMatch[1],
      endDate: dateMatch[2],
    };
  }

  return data;
}

/**
 * Generate insights from extracted Clarity data
 */
export function generateClarityInsights(data: ExtractedClarityData): string[] {
  const insights: string[] = [];

  if (!data.averageGlucose) {
    return ["Unable to extract glucose data from PDF. Please ensure it's a valid Dexcom Clarity report."];
  }

  // Average glucose insights
  if (data.averageGlucose < 70) {
    insights.push("⚠️ Your average glucose is low. Consider consulting with your healthcare provider about adjusting your insulin or medication.");
  } else if (data.averageGlucose < 100) {
    insights.push("✓ Your average glucose is in a healthy range. Keep up your current management strategy.");
  } else if (data.averageGlucose < 150) {
    insights.push("📊 Your average glucose is slightly elevated. Consider reviewing your diet and exercise routine.");
  } else {
    insights.push("⚠️ Your average glucose is elevated. Discuss with your healthcare provider about adjusting your diabetes management plan.");
  }

  // Time in range insights
  if (data.timeInRange) {
    if (data.timeInRange >= 70) {
      insights.push(`✓ Excellent time in range (${data.timeInRange.toFixed(1)}%). You're doing great with glucose management!`);
    } else if (data.timeInRange >= 50) {
      insights.push(`📊 Good time in range (${data.timeInRange.toFixed(1)}%). There's room for improvement with medication or lifestyle adjustments.`);
    } else {
      insights.push(`⚠️ Low time in range (${data.timeInRange.toFixed(1)}%). Consider working with your healthcare team to improve glucose control.`);
    }
  }

  // Variability insights
  if (data.coefficient) {
    if (data.coefficient < 30) {
      insights.push(`✓ Low glucose variability (${data.coefficient.toFixed(1)}%). Your glucose levels are stable and well-controlled.`);
    } else if (data.coefficient < 40) {
      insights.push(`📊 Moderate glucose variability (${data.coefficient.toFixed(1)}%). This is acceptable but could be improved.`);
    } else {
      insights.push(`⚠️ High glucose variability (${data.coefficient.toFixed(1)}%). Work on consistency in meals, exercise, and medication timing.`);
    }
  }

  // Estimated A1C insights
  if (data.estimatedA1C) {
    if (data.estimatedA1C < 5.7) {
      insights.push(`✓ Estimated A1C of ${data.estimatedA1C.toFixed(1)}% is excellent. Continue your current management.`);
    } else if (data.estimatedA1C < 7) {
      insights.push(`✓ Estimated A1C of ${data.estimatedA1C.toFixed(1)}% is within recommended range for many people with diabetes.`);
    } else if (data.estimatedA1C < 8) {
      insights.push(`📊 Estimated A1C of ${data.estimatedA1C.toFixed(1)}%. Consider adjustments to improve long-term glucose control.`);
    } else {
      insights.push(`⚠️ Estimated A1C of ${data.estimatedA1C.toFixed(1)}% is elevated. Discuss treatment adjustments with your healthcare provider.`);
    }
  }

  // Time above/below range insights
  if (data.timeAboveRange && data.timeAboveRange > 30) {
    insights.push(`⚠️ You're spending ${data.timeAboveRange.toFixed(1)}% of time above your target range. Review carb intake and medication timing.`);
  }

  if (data.timeBelowRange && data.timeBelowRange > 5) {
    insights.push(`⚠️ You're spending ${data.timeBelowRange.toFixed(1)}% of time below your target range. Be cautious of hypoglycemia risk.`);
  }

  return insights.length > 0 ? insights : ["No specific insights available from the PDF data."];
}

/**
 * Validate if PDF appears to be a Dexcom Clarity report
 */
export function validateClarityPDF(text: string): { valid: boolean; error?: string } {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: "PDF appears to be empty" };
  }

  const isClarityReport = /clarity|dexcom|glucose|average|time in range/i.test(text);
  if (!isClarityReport) {
    return { valid: false, error: "PDF does not appear to be a Dexcom Clarity report" };
  }

  return { valid: true };
}
