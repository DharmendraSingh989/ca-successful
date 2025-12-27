import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { testSeriesAPI, enrollmentsAPI, filesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle, Award, Users, FileText, Clock } from "lucide-react";

const TestSeriesContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [series, setSeries] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [proxiedUrl, setProxiedUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [currentFileTitle, setCurrentFileTitle] = useState<string | null>(null);

  // Content protection handlers
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.error('Right-click is disabled to protect content');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Disable common save/print shortcuts
    if ((e.ctrlKey || e.metaKey) && (e.key === 's' || e.key === 'p' || e.key === 'u' || e.key === 'c' || e.key === 'a' || e.key === 'x' || e.key === 'v')) {
      e.preventDefault();
      toast.error('This action is disabled to protect content');
    }
    // Disable F12 (developer tools)
    if (e.key === 'F12') {
      e.preventDefault();
      toast.error('Developer tools are disabled to protect content');
    }
    // Disable Print Screen
    if (e.key === 'PrintScreen') {
      e.preventDefault();
      toast.error('Screenshots are disabled to protect content');
    }
    // Disable other function keys that might be used for debugging
    if (e.key.startsWith('F') && e.key !== 'F5' && e.key !== 'F11') {
      e.preventDefault();
      toast.error('This action is disabled to protect content');
    }
  };

  const handleDragStart = (e: React.DragEvent) => {
    e.preventDefault();
    toast.error('Dragging is disabled to protect content');
  };

  const handleCopy = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Copying is disabled to protect content');
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    toast.error('Pasting is disabled to protect content');
  };

  const handleSelectStart = (e: React.MouseEvent) => {
    e.preventDefault();
    toast.error('Text selection is disabled to protect content');
  };

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      try {
        setLoading(true);

        // First, check if user is enrolled (paid). If so, fetch the enrollment details
        // which populate the `testSeriesId` including `tests`, `content`, etc.
        let enrollment = null;
        try {
          const check = await enrollmentsAPI.checkEnrollment({ testSeriesId: id });
          enrollment = check?.enrollment || null;
          setEnrolled(!!enrollment);
        } catch (err) {
          enrollment = null;
          setEnrolled(false);
        }

        if (enrollment && enrollment._id) {
          try {
            const fullEnroll: any = await enrollmentsAPI.getById(enrollment._id);
            // `fullEnroll.testSeriesId` contains populated test series with tests
            setSeries(fullEnroll.testSeriesId || null);
          } catch (err) {
            console.error('Failed to load enrollment details, falling back to public test series', err);
            const res: any = await testSeriesAPI.getById(id);
            setSeries(res.testSeries || res);
          }
        } else {
          // Not enrolled or free test series - fetch public test series
          const res: any = await testSeriesAPI.getById(id);
          setSeries(res.testSeries || res);
        }
      } catch (err) {
        console.error(err);
        toast.error('Failed to load test series');
        navigate(-1);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [id, navigate]);

  if (loading) return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </Layout>
  );

  if (!series) return null;

  if (!enrolled) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold mb-4">You are not enrolled</h2>
          <p className="text-muted-foreground mb-6">Please purchase or enroll to access tests and materials.</p>
          <div className="max-w-xs mx-auto">
            <Button onClick={() => navigate(`/testseries/${id}/enroll`)} className="w-full btn-primary">Purchase / Attempt</Button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div
        className="bg-background py-8"
        onContextMenu={handleContextMenu}
        onKeyDown={handleKeyDown}
        onDragStart={handleDragStart}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none'
        }}
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Main Content */}
            <div className="lg:col-span-2">
              {/* Test Series Header */}
              <div className="relative aspect-video bg-gradient-to-br from-primary to-navy rounded-xl overflow-hidden shadow-2xl mb-8">
                {series.thumbnail && (
                  <img
                    src={series.thumbnail}
                    alt={series.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold opacity-80 mb-2">Test Series</p>
                      <h1 className="text-2xl md:text-3xl font-bold">{series.title}</h1>
                    </div>
                  </div>
                </div>
              </div>

              {/* Embedded Reader (shows when a file is selected) */}
              {proxiedUrl && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-4">Reader</h2>
                  <div
                    className="bg-card p-4 rounded-lg border border-border"
                    onContextMenu={handleContextMenu}
                    onCopy={(e) => { e.preventDefault(); toast.error('Copying is disabled to protect content'); }}
                    onPaste={(e) => { e.preventDefault(); toast.error('Pasting is disabled to protect content'); }}
                    onSelectStart={(e) => { e.preventDefault(); toast.error('Text selection is disabled to protect content'); }}
                  >
                    <div className="relative">
                      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
                        <div className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                          </svg>
                          <span className="font-medium text-yellow-800">Content Protection Active</span>
                        </div>
                        <p className="text-yellow-700 mt-1">
                          This content is protected against unauthorized copying and downloading. Right-click, save, and print functions are disabled.
                        </p>
                      </div>

                      <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
                        <iframe
                          title={currentFileTitle || 'Test Document'}
                          src={proxiedUrl}
                          className="w-full h-[70vh]"
                          onContextMenu={(e) => { e.preventDefault(); toast.error('Right-click save/print is disabled to protect content'); }}
                        />

                        <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold opacity-75">
                          🔒 Protected
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-gray-500 text-center">Content served through secure proxy • Downloads and prints are disabled</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Tests List */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6">Available Tests</h2>
                {series.tests && series.tests.length > 0 ? (
                  <div className="space-y-4">
                    {series.tests.map((t: any, idx: number) => (
                      <div key={idx} className="bg-card p-6 rounded-lg border border-border">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <h3 className="font-semibold text-lg">{t.title || `Test ${idx + 1}`}</h3>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <FileText size={16} />
                                <span>{t.totalQuestions || '-'} questions</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock size={16} />
                                <span>{t.duration || 60} minutes</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {(t.pdfUrl || t.solutionUrl) ? (
                              <div className="flex items-center gap-2">
                                {t.pdfUrl && (
                                  <Button variant="outline" onClick={async () => {
                                    try {
                                      setLoadingPreview(true);
                                      setCurrentFileTitle(t.title || `Test ${idx + 1} - PDF`);
                                      const res: any = await filesAPI.getViewUrl(t.pdfUrl, { testSeriesId: id });
                                      if (res?.url) setProxiedUrl(res.url);
                                      else toast.error('Failed to load file');
                                    } catch (e) {
                                      toast.error('Failed to load file');
                                    } finally { setLoadingPreview(false); }
                                  }}>
                                    <FileText size={16} className="mr-2" />
                                    View PDF
                                  </Button>
                                )}
                                {t.solutionUrl && (
                                  <Button variant="outline" onClick={async () => {
                                    try {
                                      setLoadingPreview(true);
                                      setCurrentFileTitle(t.title || `Test ${idx + 1} - Solutions`);
                                      const res: any = await filesAPI.getViewUrl(t.solutionUrl, { testSeriesId: id });
                                      if (res?.url) setProxiedUrl(res.url);
                                      else toast.error('Failed to load file');
                                    } catch (e) {
                                      toast.error('Failed to load file');
                                    } finally { setLoadingPreview(false); }
                                  }}>
                                    <FileText size={16} className="mr-2" />
                                    View Solutions
                                  </Button>
                                )}
                                <Button variant="ghost" onClick={() => { setProxiedUrl(null); setCurrentFileTitle(null); }}>Close Reader</Button>
                              </div>
                            ) : (
                              <span className="text-sm text-muted-foreground">No uploaded content for this test.</span>
                            )}
                          </div>
                        </div>
                        {t.description && (
                          <p className="text-muted-foreground text-sm">{t.description}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-12">
                    <FileText className="mx-auto mb-4" size={48} />
                    <p>No tests uploaded for this series yet.</p>
                    <p className="text-sm mt-2">Please check back later.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <aside>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-lg font-semibold mb-4">About This Test Series</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{series.description}</p>

                {series.tests && series.tests.length > 0 && (
                  <div className="mt-6 pt-6 border-t border-border">
                    <h4 className="font-semibold mb-3">Series Includes</h4>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-3">
                        <CheckCircle className="text-primary mt-1" size={16} />
                        <span>{series.tests.length} Practice Tests</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Award className="text-primary mt-1" size={16} />
                        <span>Detailed Solutions</span>
                      </li>
                      <li className="flex items-start gap-3">
                        <Users className="text-primary mt-1" size={16} />
                        <span>Lifetime Access</span>
                      </li>
                    </ul>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default TestSeriesContent;
