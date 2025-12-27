import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { booksAPI, enrollmentsAPI, filesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { CheckCircle, Award, Users } from "lucide-react";

const BookReader = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [book, setBook] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);

  const [proxiedUrl, setProxiedUrl] = useState<string | null>(null);
  const [loadingPreview, setLoadingPreview] = useState(false);

  useEffect(() => {
    const fetch = async () => {
      if (!id) return;
      setLoading(true);
      try {
        // Check enrollment first
        let enrollment = null;
        try {
          const check: any = await enrollmentsAPI.checkEnrollment({ bookId: id });
          enrollment = check?.enrollment || null;
          setEnrolled(!!enrollment);
        } catch (err) {
          enrollment = null;
          setEnrolled(false);
        }

        if (enrollment && enrollment._id) {
          try {
            const fullEnroll: any = await enrollmentsAPI.getById(enrollment._id);
            setBook(fullEnroll.bookId || null);
          } catch (err) {
            console.error('Failed to load enrollment details, falling back to public book', err);
            const res: any = await booksAPI.getById(id);
            setBook(res.book || res);
          }
        } else {
          const res: any = await booksAPI.getById(id);
          setBook(res.book || res);
        }
      } catch (err) {
        console.error('Failed to fetch book', err);
        toast.error('Failed to load book');
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [id]);

  const fetchPreview = async () => {
    if (!book) return;
    const fileOrUrl = book.fileUrl || book.fileId;
    if (!fileOrUrl) return;
    try {
      setLoadingPreview(true);
      const res: any = await filesAPI.getViewUrl(fileOrUrl, { bookId: id });
      setProxiedUrl(res.url || null);
    } catch (e: any) {
      console.error('book view token error', e);
      const msg = e?.message || (e && e.message) || JSON.stringify(e);
      toast.error('Failed to load book preview: ' + msg);
      setProxiedUrl(null);
    } finally {
      setLoadingPreview(false);
    }
  };

  useEffect(() => {
    fetchPreview();
  }, [book, id]);

  if (loading) return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </Layout>
  );

  if (!book) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold mb-4">Book not found</h2>
          <p className="text-muted-foreground">We couldn't find this book. Please go back and try again.</p>
        </div>
      </Layout>
    );
  }

  if (!enrolled) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold mb-4">You don't have access</h2>
          <p className="text-muted-foreground mb-6">Please purchase the book to read it online.</p>
          <div className="max-w-xs mx-auto">
            <Button onClick={() => navigate(`/books/${id}/enroll`)} className="w-full btn-primary">Purchase Book</Button>
          </div>
        </div>
      </Layout>
    );
  }

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
            {/* Main area */}
            <div className="lg:col-span-2">
              <div className="relative aspect-video bg-gradient-to-br from-primary to-navy rounded-xl overflow-hidden shadow-2xl mb-8">
                {book.thumbnail && (
                  <img src={book.thumbnail} alt={book.title} className="w-full h-full object-cover" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div>
                    <p className="text-sm font-semibold opacity-80 mb-2">Book</p>
                    <h1 className="text-2xl md:text-3xl font-bold">{book.title}</h1>
                    <p className="text-sm mt-1">by {book.author || book.createdBy?.name || 'Unknown'}</p>
                  </div>
                </div>
              </div>



              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-4">Reader</h2>

                <div className="mb-4">
                  {!proxiedUrl && (
                    <Button onClick={fetchPreview} className="btn-primary">{loadingPreview ? 'Loading...' : 'View Book'}</Button>
                  )}
                  {proxiedUrl && (
                    <div className="flex items-center gap-2">
                      <Button onClick={() => { setProxiedUrl(null); }} variant="ghost">Close Reader</Button>
                      <Button onClick={fetchPreview} variant="outline">Reload</Button>
                    </div>
                  )}
                </div>

                <div
                  className="bg-card p-4 rounded-lg border border-border"
                  onContextMenu={handleContextMenu}
                  onCopy={handleCopy}
                  onPaste={handlePaste}
                  onSelectStart={handleSelectStart}
                >
                  {!book.fileUrl && !book.fileId && (
                    <div className="text-center text-muted-foreground">No file available for this book.</div>
                  )}

                  {(book.fileUrl || book.fileId) && (
                    proxiedUrl ? (
                      <div className="relative">
                        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                            <span className="font-medium text-yellow-800">Content Protection Active</span>
                          </div>
                          <p className="text-yellow-700 mt-1">This content is protected against unauthorized copying and downloading. Right-click, save, and print functions are disabled.</p>
                        </div>

                        <div className="relative border border-gray-300 rounded-lg overflow-hidden bg-white">
                          <iframe
                            title={book.title}
                            src={proxiedUrl}
                            className="w-full h-[70vh]"
                            onContextMenu={(e) => { e.preventDefault(); toast.error('Right-click save/print is disabled to protect content'); }}
                          />

                          <div
                            className="absolute inset-0 pointer-events-none opacity-3"
                            style={{
                              backgroundImage: `url("data:image/svg+xml,%3Csvg width='300' height='300' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='150' y='150' font-family=%27Arial%27 font-size='10' fill='red' text-anchor='middle' transform='rotate(-45 150 150)'%3EPROTECTED%3C/text%3E%3C/svg%3E")`,
                              backgroundRepeat: 'repeat',
                              backgroundSize: '300px 300px'
                            }}
                          />

                          <div className="absolute top-2 right-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-semibold opacity-75">🔒 Protected</div>
                        </div>

                        <div className="mt-2 text-xs text-gray-500 text-center">Content is served through secure proxy • Downloads and prints are disabled</div>
                      </div>
                    ) : (
                      <div className="text-center py-12">
                        <p className="mb-2">Unable to load book preview.</p>
                        <p className="text-sm text-muted-foreground">If you just purchased, try refreshing the page. If the problem persists, contact support.</p>
                        <div className="mt-4">
                          <Button className="mr-2" onClick={fetchPreview} disabled={loadingPreview}>{loadingPreview ? 'Retrying...' : 'Retry'}</Button>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <aside>
              <div className="bg-card p-6 rounded-xl border border-border">
                <h3 className="text-lg font-semibold mb-4">About This Book</h3>
                <p className="text-muted-foreground whitespace-pre-wrap">{book.description}</p>
              </div>
            </aside>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default BookReader;
