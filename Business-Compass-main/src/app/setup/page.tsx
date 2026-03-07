"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Upload,
  X,
  FileSpreadsheet,
  CheckCircle,
  ArrowLeft,
  Loader,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { storeFiles } from "@/lib/file-storage";
import { fetchSessionFiles } from "@/lib/shared-storage";

// Force dynamic rendering to use useSearchParams
export const dynamic = 'force-dynamic';

interface BranchFile {
  file: File | null;
  branch: string;
  label: string;
  required: boolean;
}

function SetupPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  // Check if we're in auto-load mode (sessionId present)
  const sessionId = searchParams?.get('sessionId');
  
  // State for upload mode
  const [uploadMode, setUploadMode] = useState<"separate" | "combined">("separate");
  
  // State for each branch file
  const [nswFile, setNswFile] = useState<File | null>(null);
  const [qldFile, setQldFile] = useState<File | null>(null);
  const [waFile, setWaFile] = useState<File | null>(null);
  const [combinedFile, setCombinedFile] = useState<File | null>(null);
  const [historicalFile, setHistoricalFile] = useState<File | null>(null);
  
  const [revenueTarget, setRevenueTarget] = useState("");
  
  // State for auto-loading from unified landing page
  // Initialize as true if sessionId is present to avoid flash
  const [isAutoLoading, setIsAutoLoading] = useState(!!sessionId);
  const [autoLoadError, setAutoLoadError] = useState<string | null>(null);

  useEffect(() => {
    // Clear any previous session data when entering setup
    sessionStorage.removeItem("dashboardData");
    sessionStorage.removeItem("useSampleData");
    sessionStorage.removeItem("useParsedData");
    sessionStorage.removeItem("analysisConfig");
    sessionStorage.removeItem("pendingFilesData");
  }, []);

  // Auto-load files from shared storage if sessionId is present
  useEffect(() => {
    const sessionId = searchParams?.get('sessionId');
    
    if (sessionId) {
      console.log('🔄 Auto-loading files from shared storage:', sessionId);
      setIsAutoLoading(true);
      
      fetchSessionFiles(sessionId)
        .then(async (data) => {
          if (data && data.files.length > 0) {
            console.log('✅ Files fetched from shared storage:', data.files.length);
            
            // Store files and redirect immediately (keep loading state)
            try {
              await storeFiles(data.files);
              console.log('✅ Files stored, navigating to dashboard...');
              
              sessionStorage.setItem(
                "analysisConfig",
                JSON.stringify({
                  fileCount: data.files.length,
                  branches: data.files.map(f => f.branch),
                  revenueTarget: null,
                  mode: "multi-branch",
                  autoLoaded: true,
                })
              );
              
              // Navigate immediately - no delay needed
              router.push("/loading-analysis");
            } catch (error) {
              console.error('Error processing files:', error);
              setAutoLoadError('Failed to process pre-uploaded files');
              setIsAutoLoading(false);
            }
          } else {
            setAutoLoadError('No files found in session');
            setIsAutoLoading(false);
          }
        })
        .catch((error) => {
          console.error('Error fetching files:', error);
          setAutoLoadError('Failed to fetch pre-uploaded files');
          setIsAutoLoading(false);
        });
    }
  }, [searchParams, router]);

  const handleFileUpload = (branch: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      switch (branch) {
        case "NSW":
          setNswFile(file);
          break;
        case "QLD":
          setQldFile(file);
          break;
        case "WA":
          setWaFile(file);
          break;
        case "COMBINED":
          setCombinedFile(file);
          break;
        case "HISTORICAL":
          setHistoricalFile(file);
          break;
      }
    }
  };

  const removeFile = (branch: string) => {
    switch (branch) {
      case "NSW":
        setNswFile(null);
        break;
      case "QLD":
        setQldFile(null);
        break;
      case "WA":
        setWaFile(null);
        break;
      case "COMBINED":
        setCombinedFile(null);
        break;
      case "HISTORICAL":
        setHistoricalFile(null);
        break;
    }
  };

  // At least one branch file must be uploaded
  const canGenerateDashboard = uploadMode === "combined" 
    ? combinedFile !== null 
    : (nswFile || qldFile || waFile);

  // FEATURE 4: File uniqueness validator
  const checkForDuplicateFiles = (): {
    hasDuplicates: boolean;
    duplicateGroups: Array<{ filename: string; branches: string[] }>;
  } => {
    const fileMap = new Map<string, Array<{ branch: string; size: number }>>();
    
    // Collect all uploaded files with their metadata
    const uploads = [
      { file: nswFile, branch: "NSW" },
      { file: qldFile, branch: "QLD" },
      { file: waFile, branch: "WA" },
      { file: historicalFile, branch: "HISTORICAL" }
    ].filter(u => u.file !== null);
    
    // Group files by name and size
    uploads.forEach(({ file, branch }) => {
      if (!file) return;
      const key = `${file.name}|${file.size}`;
      
      if (!fileMap.has(key)) {
        fileMap.set(key, []);
      }
      fileMap.get(key)!.push({ branch, size: file.size });
    });
    
    // Find duplicates (same file uploaded to multiple slots)
    const duplicateGroups: Array<{ filename: string; branches: string[] }> = [];
    
    fileMap.forEach((uploads, key) => {
      if (uploads.length > 1) {
        const [filename] = key.split('|');
        duplicateGroups.push({
          filename,
          branches: uploads.map(u => u.branch)
        });
      }
    });
    
    return {
      hasDuplicates: duplicateGroups.length > 0,
      duplicateGroups
    };
  };

  const handleGenerateDashboard = async () => {
    if (!canGenerateDashboard) return;

    // Collect files to process
    const filesToProcess: Array<{ file: File; branch: string }> = [];
    
    if (uploadMode === "combined" && combinedFile) {
      // Combined CSV: Upload same file 3 times (backend will filter)
      filesToProcess.push({ file: combinedFile, branch: "NSW" });
      filesToProcess.push({ file: combinedFile, branch: "QLD" });
      filesToProcess.push({ file: combinedFile, branch: "WA" });
    } else {
      // Separate files mode
      if (nswFile) filesToProcess.push({ file: nswFile, branch: "NSW" });
      if (qldFile) filesToProcess.push({ file: qldFile, branch: "QLD" });
      if (waFile) filesToProcess.push({ file: waFile, branch: "WA" });
    }
    
    if (historicalFile) filesToProcess.push({ file: historicalFile, branch: "HISTORICAL" });

    // FEATURE 4: Check for duplicate files  and warn user (only in separate mode)
    if (uploadMode === "separate") {
      const duplicateCheck = checkForDuplicateFiles();
      if (duplicateCheck.hasDuplicates) {
        console.warn('\n⚠️  DUPLICATE FILES DETECTED!');
        duplicateCheck.duplicateGroups.forEach(group => {
          console.warn(`   📁 "${group.filename}" uploaded to: ${group.branches.join(', ')}`);
        });
        console.warn('\n   This may cause issues - did you mean to use Combined CSV mode?');
        
        // Show browser alert to user
        const proceed = confirm(
          `⚠️ DUPLICATE FILE DETECTED\n\n` +
          duplicateCheck.duplicateGroups.map(g => 
            `"${g.filename}" is uploaded to: ${g.branches.join(', ')}`
          ).join('\n') +
          `\n\nYou're in "Separate CSV" mode but uploaded the same file multiple times.` +
          `\n\nDid you mean to use "Combined CSV" mode instead? Continue anyway?`
        );
        
        if (!proceed) {
          console.log('❌ Upload cancelled by user');
          return;
        }
      }
    }

    console.log('\n📦 SETUP PAGE - Preparing files for upload:');
    console.log('Upload mode:', uploadMode);
    console.log('Total files:', filesToProcess.length);
    filesToProcess.forEach(({ file, branch }) => {
      console.log(`  ${branch}: ${file.name} (${(file.size / 1024).toFixed(1)} KB)`);
    });

    try {
      // Store files in IndexedDB (no size limit issues)
      await storeFiles(filesToProcess);
      console.log('✅ All files stored in IndexedDB');
      
      // Store config metadata
      sessionStorage.setItem(
        "analysisConfig",
        JSON.stringify({
          fileCount: filesToProcess.length,
          branches: filesToProcess.map(f => f.branch),
          revenueTarget: revenueTarget
            ? parseFloat(revenueTarget.replace(/,/g, ""))
            : null,
          mode: "multi-branch",
        })
      );

      console.log('🚀 Navigating to loading-analysis page...\n');
      router.push("/loading-analysis");
      
    } catch (error) {
      console.error('Failed to process files:', error);
      alert('Failed to process files. Please try again.');
    }
  };

  // Skip rendering during auto-load - redirect happens in useEffect
  if (isAutoLoading) {
    // Show minimal loading while redirect is processing
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
          <style>{`
            @keyframes spin {
              from { transform: rotate(0deg); }
              to { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Auto-load error screen
  if (autoLoadError) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-card">
          <div className="container mx-auto px-4 sm:px-6 py-4">
            <h1 className="text-2xl font-bold">Initial Data Setup</h1>
          </div>
        </header>
        <main className="container mx-auto px-4 sm:px-6 py-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="pt-6">
              <div className="flex flex-col items-center text-center space-y-4">
                <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                  <X className="h-6 w-6 text-destructive" />
                </div>
                <h2 className="text-xl font-semibold">Failed to Load Files</h2>
                <p className="text-sm text-muted-foreground">{autoLoadError}</p>
                <Button onClick={() => {
                  setAutoLoadError(null);
                  window.location.href = '/setup';
                }}>
                  Upload Files Manually
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 sm:px-6 py-4">
          <h1 className="text-2xl font-bold">Initial Data Setup</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Upload your sales data to get started
          </p>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8">
        <div className="max-w-5xl mx-auto space-y-6">
          {/* Upload Mode Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Upload Mode</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="separate"
                    checked={uploadMode === "separate"}
                    onChange={(e) => setUploadMode(e.target.value as "separate" | "combined")}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-medium text-sm">Separate CSVs (one per branch)</p>
                    <p className="text-xs text-muted-foreground">Upload NSW.csv, QLD.csv, WA.csv separately</p>
                  </div>
                </label>
                
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="uploadMode"
                    value="combined"
                    checked={uploadMode === "combined"}
                    onChange={(e) => setUploadMode(e.target.value as "separate" | "combined")}
                    className="w-4 h-4 text-primary"
                  />
                  <div>
                    <p className="font-medium text-sm">Combined CSV (all branches in one file)</p>
                    <p className="text-xs text-muted-foreground">One CSV file with a "Branch" column containing NSW, QLD, WA</p>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Upload Sales Data Section */}
          {uploadMode === "combined" ? (
            // Combined CSV Upload
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  📤 Upload Combined CSV
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Combined CSV (must include a Branch column)
                </p>
                {!combinedFile ? (
                  <div
                    className={cn(
                      "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                      "border-border hover:border-primary/50"
                    )}
                  >
                    <input
                      type="file"
                      id="file-combined"
                      className="hidden"
                      accept=".xlsx,.xls,.csv"
                      onChange={handleFileUpload("COMBINED")}
                    />
                    <label
                      htmlFor="file-combined"
                      className="cursor-pointer flex flex-col items-center gap-3"
                    >
                      <Upload className="h-10 w-10 text-muted-foreground" />
                      <div>
                        <p className="text-sm font-medium text-foreground">
                          Drag and drop file here
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Limit 200MB per file • CSV
                        </p>
                      </div>
                      <Button type="button" variant="outline" size="sm">
                        Browse files
                      </Button>
                    </label>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between bg-secondary/50 rounded-md px-4 py-3">
                      <div className="flex items-center gap-3">
                        <FileSpreadsheet className="h-5 w-5 text-primary" />
                        <div>
                          <p className="text-sm font-medium">{combinedFile.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {(combinedFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeFile("COMBINED")}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                      <CheckCircle className="h-4 w-4" />
                      <span>Ready for analysis</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            // Separate Branch CSV Uploads
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {[
                { file: nswFile, branch: "NSW", label: "NSW Branch CSV" },
                { file: qldFile, branch: "QLD", label: "QLD Branch CSV" },
                { file: waFile, branch: "WA", label: "WA Branch CSV" },
              ].map((branchData) => (
                <Card key={branchData.branch}>
                  <CardHeader>
                    <CardTitle className="text-base">
                      {branchData.label}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {!branchData.file ? (
                      <div
                        className={cn(
                          "border-2 border-dashed rounded-lg p-6 text-center transition-colors",
                          "border-border hover:border-primary/50"
                        )}
                      >
                        <input
                          type="file"
                          id={`file-${branchData.branch}`}
                          className="hidden"
                          accept=".xlsx,.xls,.csv"
                          onChange={handleFileUpload(branchData.branch)}
                        />
                        <label
                          htmlFor={`file-${branchData.branch}`}
                          className="cursor-pointer flex flex-col items-center gap-2"
                        >
                          <Upload className="h-8 w-8 text-muted-foreground" />
                          <div>
                            <p className="text-sm font-medium text-foreground">
                              Upload file
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              CSV or Excel
                            </p>
                          </div>
                        </label>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between bg-secondary/50 rounded-md px-4 py-3">
                          <div className="flex items-center gap-3">
                            <FileSpreadsheet className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium truncate">{branchData.file.name}</p>
                              <p className="text-xs text-muted-foreground">
                                {(branchData.file.size / 1024).toFixed(1)} KB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0"
                            onClick={() => removeFile(branchData.branch)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                          <CheckCircle className="h-4 w-4" />
                          <span>Ready</span>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Historical Data Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                📊 Upload Historical Data
                <span className="text-xs font-normal text-muted-foreground ml-auto">
                  Optional
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Historical Sales Excel (with WA, QLD, NSW sheets)
              </p>
              {!historicalFile ? (
                <div
                  className={cn(
                    "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
                    "border-border hover:border-primary/50"
                  )}
                >
                  <input
                    type="file"
                    id="file-historical"
                    className="hidden"
                    accept=".xlsx,.xls"
                    onChange={handleFileUpload("HISTORICAL")}
                  />
                  <label
                    htmlFor="file-historical"
                    className="cursor-pointer flex flex-col items-center gap-3"
                  >
                    <Upload className="h-10 w-10 text-muted-foreground" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Drag and drop file here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Limit 200MB per file • XLSX, XLS
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm">
                      Browse files
                    </Button>
                  </label>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-secondary/50 rounded-md px-4 py-3">
                    <div className="flex items-center gap-3">
                      <FileSpreadsheet className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-medium">{historicalFile.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {(historicalFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => removeFile("HISTORICAL")}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    <span>Ready for analysis</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">
                Configuration (Optional)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="revenue-target">Revenue Target (Annual)</Label>
                <Input
                  id="revenue-target"
                  type="text"
                  placeholder="e.g., 75,000,000"
                  value={revenueTarget}
                  onChange={(e) => setRevenueTarget(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Used for target tracking and forecasting
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Upload Summary & Generate Button */}
          <Card className="border-primary/20">
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Upload Summary
                  </p>
                  <p className="text-xs sm:text-sm text-muted-foreground">
                    {uploadMode === "combined" 
                      ? combinedFile 
                        ? "Combined CSV uploaded ✓" 
                        : "Please upload combined CSV file"
                      : `${[nswFile, qldFile, waFile].filter(Boolean).length} of 3 branches uploaded`
                    }
                    {historicalFile && " + Historical data"}
                  </p>
                </div>
                <Button
                  size="lg"
                  disabled={!canGenerateDashboard}
                  onClick={handleGenerateDashboard}
                  className="w-full sm:w-auto"
                >
                  Generate Dashboard
                </Button>
              </div>
              {!canGenerateDashboard && (
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-3">
                  ⚠️ {uploadMode === "combined" 
                    ? "Please upload the combined CSV file to proceed" 
                    : "Upload at least one branch file to continue"}
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

export default function SetupPage() {
  return (
    <Suspense fallback={
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        minHeight: '100vh',
        background: '#ffffff'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '4px solid #e5e7eb',
            borderTop: '4px solid #3b82f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto'
          }}></div>
        </div>
      </div>
    }>
      <SetupPageContent />
    </Suspense>
  );
}
