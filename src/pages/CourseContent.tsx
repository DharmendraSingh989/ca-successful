import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { coursesAPI, enrollmentsAPI, filesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { GraduationCap, Clock, Calendar, CheckCircle, Users, BarChart3, Award, BookOpen, PlayCircle, Maximize } from "lucide-react";

// CourseVideo component moved outside to avoid conditional hook calls
const CourseVideo = ({ src, courseId, isVisible }: { src: string; courseId?: string | undefined; isVisible: boolean }) => {
  const [playUrl, setPlayUrl] = useState<string | null>(null);
  const [loadingUrl, setLoadingUrl] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    let mounted = true;
    (async () => {
      try {
        setLoadingUrl(true);
        const res: any = await filesAPI.getViewUrl(src, { courseId });
        if (mounted) setPlayUrl(res?.url || null);
      } catch (e) {
        console.error('video token error', e);
      } finally {
        if (mounted) setLoadingUrl(false);
      }
    })();
    return () => { mounted = false; };
  }, [src, courseId, isVisible]);

  const handleFullscreen = (e: React.MouseEvent) => {
    e.preventDefault();
    const video = e.currentTarget.previousElementSibling as HTMLVideoElement;
    if (video && video.requestFullscreen) {
      video.requestFullscreen().catch(err => {
        console.error('Failed to enter fullscreen:', err);
        toast.error('Failed to enter fullscreen mode');
      });
    }
  };

  if (!isVisible) return null;
  if (loadingUrl) return <div className="w-full h-full flex items-center justify-center"><Skeleton className="h-12 w-full"/></div>;
  if (!playUrl) return <div className="text-center text-muted-foreground">Unable to load video.</div>;
  return (
    <div className="relative w-full h-full">
      <video
        controls
        autoPlay
        className="w-full h-full object-cover"
        src={playUrl}
        onContextMenu={(e) => {
          e.preventDefault();
          toast.error('Right-click save/print is disabled to protect content');
        }}
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none'
        }}
      />
      <Button
        variant="secondary"
        size="sm"
        className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white border-none"
        onClick={handleFullscreen}
        title="Enter Fullscreen"
      >
        <Maximize size={16} />
      </Button>
    </div>
  );
};

// CourseDocument component for displaying documents inline
const CourseDocument = ({ src, courseId, title, isVisible }: { src: string; courseId?: string; title: string; isVisible: boolean }) => {
  const [docUrl, setDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isVisible) return;

    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const res: any = await filesAPI.getViewUrl(src, { courseId });
        if (mounted) setDocUrl(res?.url || null);
      } catch (e) {
        console.error('document load error', e);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [src, courseId, isVisible]);

  if (!isVisible) return null;
  if (loading) return <div className="w-full h-full flex items-center justify-center"><Skeleton className="h-12 w-full"/></div>;
  if (!docUrl) return <div className="text-center text-muted-foreground">Unable to load document.</div>;
  return (
    <div className="w-full h-full">
      <iframe
        src={docUrl}
        title={title}
        className="w-full h-full border-0"
        onContextMenu={(e) => {
          e.preventDefault();
          toast.error('Right-click is disabled to protect content');
        }}
      />
    </div>
  );
};

const CourseContent = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enrolled, setEnrolled] = useState(false);
  const [showMainVideo, setShowMainVideo] = useState<boolean>(false);
  const [activeItem, setActiveItem] = useState<any>(null);
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
        // which populate the `courseId` including `resources`, `content`, `videoUrl`.
        let enrollment = null;
        try {
          const check = await enrollmentsAPI.checkEnrollment({ courseId: id });
          enrollment = check?.enrollment || null;
          setEnrolled(!!enrollment);
        } catch (err) {
          enrollment = null;
          setEnrolled(false);
        }

        if (enrollment && enrollment._id) {
          try {
            const fullEnroll: any = await enrollmentsAPI.getById(enrollment._id);
            // `fullEnroll.courseId` contains populated course with resources
            setCourse(fullEnroll.courseId || null);
          } catch (err) {
            console.error('Failed to load enrollment details, falling back to public course', err);
            const res: any = await coursesAPI.getById(id);
            setCourse(res.course || res);
          }
        } else {
          // Not enrolled or free course - fetch public course (may include resources if free)
          const res: any = await coursesAPI.getById(id);
          setCourse(res.course || res);
        }
        // Regardless of how we obtained the course, fetch Resource documents linked to this course
        // (subadmins may upload Resources separately and link them via `courseId` field).
        try {
          const resResources: any = await (await import('@/lib/api')).resourcesAPI.getAll({ courseId: id, limit: 100 });
          const linkedResources = resResources?.resources || [];
          // Merge unique resources into course.resources array
          setCourse((prev: any) => {
            if (!prev) return prev;
            const existing = Array.isArray(prev.resources) ? prev.resources : [];
            const merged = [...existing];
            linkedResources.forEach((r: any) => {
              if (!merged.find((m: any) => (m._id && r._id && m._id.toString() === r._id.toString()) || (m.fileId && r.fileId && m.fileId === r.fileId))) {
                merged.push(r);
              }
            });
            return { ...prev, resources: merged };
          });
        } catch (e) {
          console.error('Failed to load linked resources for course', e);
        }
        // If the course has resources that are Appwrite file URLs, ensure we attempt to fetch proxied URLs when rendering.
      } catch (err) {
        console.error(err);
        toast.error('Failed to load course content');
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

  if (!course) return null;

  if (!enrolled) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-20 text-center">
          <h2 className="text-2xl font-semibold mb-4">You are not enrolled</h2>
          <p className="text-muted-foreground mb-6">Please enroll to access course content.</p>
          <div className="max-w-xs mx-auto">
            <Button onClick={() => navigate(`/course/${id}/enroll`)} className="w-full btn-primary">Enroll Now</Button>
          </div>
        </div>
      </Layout>
    );
  }

  // Find the main video URL - either course.videoUrl or first video resource
  const getMainVideoUrl = () => {
    if (course.videoUrl) return course.videoUrl;
    if (course.resources && course.resources.length > 0) {
      const videoResource = course.resources.find((r: any) => r.type === 'video' || r.resourceCategory === 'video');
      if (videoResource) return videoResource.url;
    }
    return null;
  };

  const mainVideoUrl = getMainVideoUrl();

  // helper to get proxied URL
  const getProxiedUrl = async (urlOrId: string | undefined) => {
    if (!urlOrId) return null;
    try {
      const res: any = await filesAPI.getViewUrl(urlOrId, { courseId: id });
      return res?.url || null;
    } catch (e) {
      console.error('Failed to get proxied url', e);
      return null;
    }
  };



  const highlights = [
    "Complete syllabus coverage",
    "Video lectures in HD quality",
    "Downloadable study materials",
    "Practice questions & mock tests",
    "Doubt clearing sessions",
    "Validity till next attempt",
  ];

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
            {/* Course Image & Basic Info */}
            <div className="lg:col-span-2">
              <div className="relative aspect-video bg-gradient-to-br from-primary to-navy rounded-xl overflow-hidden shadow-2xl mb-8">
                {course.thumbnail && (
                  <img
                    src={course.thumbnail}
                    alt={course.title}
                    className="w-full h-full object-cover"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6 text-white">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold opacity-80 mb-2">{course.category?.name || 'Course'}</p>
                      <h1 className="text-2xl md:text-3xl font-bold">{course.title}</h1>
                    </div>
                  </div>
                </div>
              </div>

              {/* Course Status Badge */}
              {course.publishStatus === 'draft' && (
                <span className="inline-block bg-yellow-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
                  Draft
                </span>
              )}
              {course.publishStatus === 'published' && (
                <span className="inline-block bg-green-600 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
                  Published
                </span>
              )}





              {/* Course Curriculum */}
              {course.topics && course.topics.length > 0 && (
                <div className="mb-8">
                  <h2 className="text-2xl font-semibold mb-6">Course Topics</h2>
                  <div className="bg-card rounded-lg border border-border overflow-hidden">
                    {course.topics.map((topic: string, index: number) => (
                      <div key={index} className="p-4 border-b border-border last:border-b-0 flex items-start gap-3">
                        <BookOpen className="text-primary flex-shrink-0 mt-1" size={18} />
                        <span>{topic}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Course Content Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-semibold mb-6">Course Content</h2>

                {/* Main video */}
                {mainVideoUrl && (
                  <div className="bg-card p-6 rounded-lg border border-border mb-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold flex items-center gap-2">
                        <PlayCircle size={20} />
                        Lecture Video
                      </h3>
                      <div>
                        {!showMainVideo ? (
                          <Button className="btn-primary" onClick={() => setShowMainVideo(true)}>View Video</Button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" onClick={() => setShowMainVideo(false)}>Close Video</Button>
                            <Button variant="outline" onClick={() => setShowMainVideo(true)}>Reload</Button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="w-full aspect-video bg-black rounded">
                      {showMainVideo ? <CourseVideo src={mainVideoUrl} courseId={id} isVisible={showMainVideo} /> : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground">Video is hidden. Click "View Video" to play.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Resources list */}
                {course.resources && course.resources.filter((r: any) => !(mainVideoUrl && (r.type === 'video' || r.resourceCategory === 'video') && r.url === mainVideoUrl)).length > 0 && (
                  <div className="bg-card p-6 rounded-lg border border-border mb-6">
                    <h3 className="font-semibold mb-4">Resources</h3>
                    <div className="space-y-3">
                      {course.resources.filter((r: any) => !(mainVideoUrl && (r.type === 'video' || r.resourceCategory === 'video') && r.url === mainVideoUrl)).map((r: any, idx: number) => (
                        <div key={r._id || r.id || idx} className="p-3 rounded-lg border border-border flex items-center justify-between">
                          <div>
                            <p className="font-medium">{r.title || r.fileName || r.name || 'Resource'}</p>
                            <p className="text-sm text-muted-foreground">{r.type || r.resourceCategory || 'Document'}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {r.url ? (
                              <Button variant="outline" onClick={async () => {
                                try {
                                  const res: any = await filesAPI.getViewUrl(r.url, { courseId: id });
                                  if (res?.url) window.open(res.url, '_blank');
                                  else toast.error('Failed to open resource');
                                } catch (e) {
                                  toast.error('Failed to open resource');
                                }
                              }}>Open</Button>
                            ) : (
                              <Button variant="ghost" onClick={() => toast.info('No preview available')}>No Preview</Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Chapters (if any) */}
                {course.chapters && course.chapters.length > 0 && (
                  <div className="bg-card p-6 rounded-lg border border-border mb-6">
                    <h3 className="font-semibold mb-4">Chapters</h3>
                    <div className="space-y-4">
                      {course.chapters.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)).map((ch: any) => (
                        <div key={ch._id || ch.title} className="border rounded-lg">
                          <div className="p-4 flex items-center justify-between">
                            <div>
                              <p className="font-semibold">{ch.title}</p>
                              {ch.description && <p className="text-sm text-muted-foreground">{ch.description}</p>}
                            </div>
                            <div className="text-sm text-muted-foreground">{(ch.items||[]).length} items</div>
                          </div>
                          <div className="p-4 border-t bg-background">
                            {(ch.items || []).sort((a: any, b: any) => (a.order||0) - (b.order||0)).map((it: any, idx: number) => (
                              <div key={it._id || idx} className="p-3 rounded-lg border border-border mb-3 flex items-center justify-between">
                                <div>
                                  <p className="font-medium">{it.title}</p>
                                  <p className="text-sm text-muted-foreground">{it.type}{it.duration ? ` • ${it.duration}` : ''}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                  {it.type === 'video' ? (
                                    <Button onClick={() => { setActiveItem({ src: it.url, title: it.title, type: it.type }); setShowMainVideo(false); }} className="btn-primary">Play</Button>
                                  ) : (it.type === 'pdf' || it.type === 'document') && it.url ? (
                                    <Button variant="outline" onClick={() => { setActiveItem({ src: it.url, title: it.title, type: it.type }); setShowMainVideo(false); }}>Read/View</Button>
                                  ) : it.url ? (
                                    <Button variant="outline" onClick={async () => {
                                      try {
                                        const res: any = await filesAPI.getViewUrl(it.url, { courseId: id });
                                        if (res?.url) window.open(res.url, '_blank');
                                        else toast.error('Failed to open resource');
                                      } catch (e) { toast.error('Failed to open resource'); }
                                    }}>Open</Button>
                                  ) : (
                                    <Button variant="ghost" onClick={() => toast.info('No preview available')}>No Preview</Button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Course Description/Content */}
                {course.content && (
                  <div
                    className="bg-card p-6 rounded-lg border border-border"
                    onContextMenu={handleContextMenu}
                    onCopy={handleCopy}
                    onPaste={handlePaste}
                    onSelectStart={handleSelectStart}
                  >
                    <h3 className="font-semibold mb-4">Course Details</h3>
                    <div className="prose max-w-none text-muted-foreground whitespace-pre-wrap">
                      {course.content}
                    </div>
                  </div>
                )}
                {/* Active chapter item player */}
                {activeItem && activeItem.src && (
                  <div className="bg-card p-6 rounded-lg border border-border mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold">{activeItem.title}</h3>
                      <div>
                        <Button variant="ghost" onClick={() => setActiveItem(null)}>Close</Button>
                      </div>
                    </div>
                    <div className="w-full aspect-video bg-black rounded">
                      {activeItem.type === 'video' ? (
                        <CourseVideo src={activeItem.src} courseId={id} isVisible={true} />
                      ) : (activeItem.type === 'pdf' || activeItem.type === 'document') ? (
                        <CourseDocument src={activeItem.src} courseId={id} title={activeItem.title} isVisible={true} />
                      ) : (
                        <div className="text-center text-muted-foreground">Unsupported content type.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* Fallback */}
                {!mainVideoUrl && (!course.resources || course.resources.length === 0) && !course.content && (
                  <div className="text-center text-muted-foreground py-12">
                    <p className="mb-4">No content uploaded for this course yet.</p>
                    <p className="text-sm">Please check back later or contact support.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Right Sidebar - Course Overview & About */}
            <div className="lg:col-span-1">
              <div className="sticky top-24 space-y-6">
                {/* Course Overview */}
                <div className="bg-card p-6 rounded-xl shadow-md border border-border">
                  <h3 className="text-xl font-semibold mb-4">Course Overview</h3>
                  <div className="space-y-4">
                    {course.instructor && (
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                          {course.instructor.charAt(0)}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground">Instructor</p>
                          <p className="font-semibold text-sm">{course.instructor}</p>
                        </div>
                      </div>
                    )}
                    {course.duration && (
                      <div className="flex items-center gap-2">
                        <Clock className="text-primary" size={18} />
                        <div>
                          <p className="text-sm text-muted-foreground">Duration</p>
                          <p className="font-semibold">{course.duration} Hours</p>
                        </div>
                      </div>
                    )}
                    {course.level && (
                      <div className="flex items-center gap-2">
                        <BarChart3 className="text-primary" size={18} />
                        <div>
                          <p className="text-sm text-muted-foreground">Level</p>
                          <p className="font-semibold capitalize">{course.level}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* About This Course */}
                {course.description && (
                  <div className="bg-card p-6 rounded-xl border border-border">
                    <h3 className="text-lg font-semibold mb-4">About This Course</h3>
                    <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{course.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default CourseContent;
