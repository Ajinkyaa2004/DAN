"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { transformData, detectColumns, parseCSV, parseXLSX, type ColumnDetectionResult, transformMultiBranchData } from "@/lib/csv-parser";
import { retrieveFiles, clearFiles } from "@/lib/file-storage";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";

const STEPS = [
  "Reading uploaded files...",
  "Parsing CSV data...",
  "Merging branch data...",
  "Computing insights...",
  "Generating dashboard...",
];

export default function LoadingAnalysisPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [needsManualSelection, setNeedsManualSelection] = useState(false);
  const [detectionResult, setDetectionResult] = useState<ColumnDetectionResult | null>(null);
  const [selectedColumns, setSelectedColumns] = useState<{
    revenueCol: string;
    dateCol: string;
    customerCol: string;
    segmentCol: string;
  }>({ revenueCol: "", dateCol: "", customerCol: "", segmentCol: "" });
  const [fileData, setFileData] = useState<File | null>(null);
  const [configData, setConfigData] = useState<any>(null);
  const hasProcessedRef = useRef(false);

  useEffect(() => {
    // Prevent double execution in React Strict Mode
    if (hasProcessedRef.current) return;
    hasProcessedRef.current = true;
    
    processUploadedFile();
  }, []);

  const processUploadedFile = async () => {
    try {
      // Get config from sessionStorage
      const config = sessionStorage.getItem("analysisConfig");
      if (!config) {
        router.push("/setup");
        return;
      }

      const parsed = JSON.parse(config);
      setConfigData(parsed);

      // Check if this is multi-branch mode
      if (parsed.mode === "multi-branch") {
        await processMultiBranchFiles(parsed);
      } else if (parsed.file && parsed.template) {
        // Single file mode (legacy)
        await processSingleFile(parsed);
      } else {
        setError("Invalid configuration");
      }
    } catch (err: any) {
      if (err.message === 'NEEDS_MANUAL_SELECTION' && err.detection) {
        setNeedsManualSelection(true);
        setDetectionResult(err.detection);
        setProgress(50);
      } else {
        setError(err instanceof Error ? err.message : "Failed to process file");
      }
    }
  };

  const processSingleFile = async (config: any) => {
    if (!config.file || !config.template) {
      setError("Missing file or template selection");
      return;
    }

    // Convert base64 back to File
    const base64Data = config.file.content.split(',')[1];
    const binaryData = atob(base64Data);
    const bytes = new Uint8Array(binaryData.length);
    for (let i = 0; i < binaryData.length; i++) {
      bytes[i] = binaryData.charCodeAt(i);
    }
    const blob = new Blob([bytes], { type: config.file.type });
    const file = new File([blob], config.file.name, { type: config.file.type });
    setFileData(file);

    await attemptTransform(file, config);
  };

  const processMultiBranchFiles = async (config: any) => {
    try {
      // Get file data from IndexedDB
      console.log('🔍 Loading files from IndexedDB...');
      
      const filesToProcess = await retrieveFiles();
      
      if (!filesToProcess || filesToProcess.length === 0) {
        console.error('❌ No file data found in IndexedDB');
        setError("No files were uploaded. Please go back to the setup page and upload your CSV files.");
        return;
      }

      console.log(`✅ Found ${filesToProcess.length} files in IndexedDB`);
      filesToProcess.forEach(({ file, branch }) => {
        console.log(`  📄 ${branch}: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
      });

      // Clear the file data from IndexedDB to free up space
      await clearFiles();
      console.log('🧹 Cleared file data from IndexedDB');
      console.log(`\n🚀 Processing ${filesToProcess.length} files...\n`);

      // Simulate progress
      let progressInterval = setInterval(() => {
        setProgress((prev) => {
          const next = prev + 2;
          if (next >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return next;
        });
      }, 100);

      try {
        // Parse and transform multi-branch data
        const dashboardData = await transformMultiBranchData(
          filesToProcess,
          config.revenueTarget
        );

        clearInterval(progressInterval);
        setProgress(100);

        // Store the generated data
        sessionStorage.setItem("dashboardData", JSON.stringify(dashboardData));
        sessionStorage.setItem("useParsedData", "true");
        
        // Navigate immediately
        router.push("/dashboard");
        
      } catch (transformErr: any) {
        clearInterval(progressInterval);
        
        if (transformErr.message === 'NEEDS_MANUAL_SELECTION' && transformErr.detection) {
          setNeedsManualSelection(true);
          setDetectionResult(transformErr.detection);
          setFileData(filesToProcess[0].file); // Store first file for manual selection
          setProgress(50);
        } else {
          throw transformErr;
        }
      }
      
    } catch (err: any) {
      console.error('Error processing files:', err);
      setError(err instanceof Error ? err.message : "Failed to process files. Please try again.");
    }
  };

  const attemptTransform = async (file: File, config: any, manualCols?: any) => {
    // Simulate progress
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 3;
        if (next >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return next;
      });
    }, 100);

    try {
      // Parse and transform data
      const dashboardData = await transformData(
        file,
        config.template,
        config.revenueTarget,
        config.segmentNames,
        manualCols
      );

      clearInterval(progressInterval);
      setProgress(100);

      // Store the generated data
      sessionStorage.setItem("dashboardData", JSON.stringify(dashboardData));
      sessionStorage.setItem("useParsedData", "true");
      
      // Navigate immediately
      router.push("/dashboard");
    } catch (err: any) {
      clearInterval(progressInterval);
      throw err;
    }
  };

  const handleManualSelection = async () => {
    if (!selectedColumns.revenueCol || !selectedColumns.dateCol) {
      setError("Please select at least a revenue column and a date column");
      return;
    }

    setNeedsManualSelection(false);
    setError(null);
    setProgress(50);

    try {
      // Filter out "_none" values
      const finalColumns = {
        revenueCol: selectedColumns.revenueCol,
        dateCol: selectedColumns.dateCol,
        customerCol: selectedColumns.customerCol === "_none" ? undefined : selectedColumns.customerCol,
        segmentCol: selectedColumns.segmentCol === "_none" ? undefined : selectedColumns.segmentCol,
      };
      await attemptTransform(fileData!, configData, finalColumns);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to process file");
    }
  };

  useEffect(() => {
    const stepIndex = Math.min(
      Math.floor(progress / (100 / STEPS.length)),
      STEPS.length - 1
    );
    setCurrentStep(stepIndex);
  }, [progress]);

  // Manual column selection UI
  if (needsManualSelection && detectionResult) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-2xl w-full space-y-6">
          <div className="text-center">
            <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-amber-500 mx-auto mb-4" />
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              Column Mapping Required
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-2">
              We couldn't automatically detect all required columns. Please manually select them below.
            </p>
          </div>

          <div className="bg-card border border-border rounded-lg p-4 sm:p-6 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="revenue-col" className="text-sm font-medium">
                Revenue Column <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedColumns.revenueCol}
                onValueChange={(val) =>
                  setSelectedColumns({ ...selectedColumns, revenueCol: val })
                }
              >
                <SelectTrigger id="revenue-col">
                  <SelectValue placeholder="Select revenue/sales/amount column" />
                </SelectTrigger>
                <SelectContent>
                  {detectionResult.allColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Column containing revenue, sales, or amount values
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="date-col" className="text-sm font-medium">
                Date Column <span className="text-destructive">*</span>
              </Label>
              <Select
                value={selectedColumns.dateCol}
                onValueChange={(val) =>
                  setSelectedColumns({ ...selectedColumns, dateCol: val })
                }
              >
                <SelectTrigger id="date-col">
                  <SelectValue placeholder="Select date/time column" />
                </SelectTrigger>
                <SelectContent>
                  {detectionResult.allColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Column containing transaction dates
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="customer-col" className="text-sm font-medium">
                Customer Column (Optional)
              </Label>
              <Select
                value={selectedColumns.customerCol}
                onValueChange={(val) =>
                  setSelectedColumns({ ...selectedColumns, customerCol: val })
                }
              >
                <SelectTrigger id="customer-col">
                  <SelectValue placeholder="Select customer/client column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {detectionResult.allColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="segment-col" className="text-sm font-medium">
                Segment Column (Optional)
              </Label>
              <Select
                value={selectedColumns.segmentCol}
                onValueChange={(val) =>
                  setSelectedColumns({ ...selectedColumns, segmentCol: val })
                }
              >
                <SelectTrigger id="segment-col">
                  <SelectValue placeholder="Select region/channel/category column" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_none">None</SelectItem>
                  {detectionResult.allColumns.map((col) => (
                    <SelectItem key={col} value={col}>
                      {col}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Column for grouping data by region, channel, etc.
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="outline" onClick={() => router.push("/setup")} className="w-full sm:w-auto">
              Back to Setup
            </Button>
            <Button 
              onClick={handleManualSelection}
              disabled={!selectedColumns.revenueCol || !selectedColumns.dateCol}
              className="w-full sm:w-auto"
            >
              Continue Analysis
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-4 sm:px-6">
        <div className="max-w-md w-full text-center space-y-6">
          <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-destructive mx-auto" />
          <div>
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              Analysis failed
            </h1>
            <p className="text-sm text-muted-foreground mt-2">
              {error}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={() => router.push("/setup")} className="w-full sm:w-auto">
              Back to Setup
            </Button>
            <Button
              variant="outline"
              onClick={() => window.location.reload()}
              className="w-full sm:w-auto"
            >
              Try Again
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'center', 
      alignItems: 'center', 
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        padding: '2.5rem',
        borderRadius: '24px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        textAlign: 'center',
        maxWidth: '480px',
        width: '100%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Animated background gradient */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'linear-gradient(90deg, #3b82f6, #10b981, #3b82f6)',
          backgroundSize: '200% 100%',
          animation: 'gradient-shift 2s ease infinite'
        }}></div>

        {/* Main loader animation */}
        <div style={{
          position: 'relative',
          display: 'inline-block',
          marginBottom: '2rem'
        }}>
          {/* Outer rotating ring */}
          <div style={{
            position: 'absolute',
            inset: '-10px',
            border: '4px solid transparent',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 2s linear infinite'
          }}></div>
          
          {/* Inner circle with icon */}
          <div style={{
            width: '80px',
            height: '80px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(59, 130, 246, 0.3)',
            animation: 'pulse 2s ease-in-out infinite'
          }}>
            <Loader2 style={{ width: '40px', height: '40px', color: 'white', animation: 'spin 1.5s linear infinite' }} />
          </div>

          {/* Orbiting dots */}
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '100px',
            height: '100px',
            animation: 'spin 3s linear infinite reverse'
          }}>
            <div style={{
              position: 'absolute',
              top: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              background: '#10b981',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(16, 185, 129, 0.5)'
            }}></div>
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: '50%',
              transform: 'translateX(-50%)',
              width: '8px',
              height: '8px',
              background: '#3b82f6',
              borderRadius: '50%',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.5)'
            }}></div>
          </div>
        </div>

        {/* Text content */}
        <h2 style={{ 
          fontSize: '1.75rem',
          fontWeight: '700',
          marginBottom: '0.75rem',
          color: '#1e293b',
          animation: 'fade-in 0.6s ease-out'
        }}>
          Analyzing Your Data
        </h2>
        <p style={{ 
          color: '#64748b',
          fontSize: '0.95rem',
          marginBottom: '2rem',
          lineHeight: '1.6'
        }}>
          Processing invoices and computing business insights
        </p>

        {/* Progress steps */}
        <div style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '0.75rem',
          marginBottom: '1.5rem'
        }}>
          {STEPS.map((step, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              gap: '0.5rem',
              fontSize: '0.875rem',
              color: i < currentStep ? '#10b981' : i === currentStep ? '#3b82f6' : '#94a3b8',
              fontWeight: i === currentStep ? '600' : 'normal'
            }}>
              {i < currentStep ? (
                <CheckCircle style={{ width: '16px', height: '16px' }} />
              ) : i === currentStep ? (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '3px solid #3b82f6',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
              ) : (
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '3px solid #e2e8f0',
                  borderRadius: '50%'
                }}></div>
              )}
              <span>{step}</span>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          height: '4px',
          background: '#f1f5f9',
          borderRadius: '999px',
          overflow: 'hidden'
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #3b82f6, #10b981)',
            borderRadius: '999px',
            transition: 'width 0.3s ease'
          }}></div>
        </div>

        <p style={{
          fontSize: '0.75rem',
          color: '#94a3b8',
          marginTop: '1.5rem'
        }}>
          This should only take a moment...
        </p>

        {/* CSS animations */}
        <style jsx>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          
          @keyframes pulse {
            0%, 100% { transform: scale(1); }
            50% { transform: scale(1.05); }
          }
          
          @keyframes fade-in {
            from { opacity: 0; transform: translateY(-10px); }
            to { opacity: 1; transform: translateY(0); }
          }
          
          @keyframes gradient-shift {
            0%, 100% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
          }
        `}</style>
      </div>
    </div>
  );
}
