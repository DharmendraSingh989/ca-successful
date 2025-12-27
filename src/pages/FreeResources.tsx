import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { ChevronRight, Download, FileText, Lock } from "lucide-react";
import { categoriesAPI, filesAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { usePublishedResources } from "@/hooks/usePublishedResources";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const FreeResources = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [categories, setCategories] = useState<any[]>([]);

  const { resources: freeResources, loading: freeResourcesLoading } = usePublishedResources({
    resourceCategory: 'notes',
    category: activeCategory !== 'All' ? activeCategory : undefined,
  });

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const catsRes = await categoriesAPI.getAll();
        setCategories(catsRes.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
        setCategories([]);
      }
    };

    fetchCategories();
  }, []);

  return (
    <Layout>
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground text-center">
            Free Resources
          </h1>
          <p className="text-primary-foreground/80 text-center mt-2">
            Access free study materials, notes, and video lectures
          </p>
        </div>
      </div>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
              onClick={() => setActiveCategory("All")}
              className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                activeCategory === "All"
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-card text-foreground border border-border hover:border-primary hover:text-primary"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => setActiveCategory(category._id)}
                className={`px-6 py-2.5 rounded-full font-medium transition-all duration-200 ${
                  activeCategory === category._id
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-card text-foreground border border-border hover:border-primary hover:text-primary"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Free Resources */}
          <div className="space-y-4">
            {freeResourcesLoading ? (
              <>
                {[1, 2, 3].map(i => <Skeleton key={i} className="h-20" />)}
              </>
            ) : freeResources.length > 0 ? (
              freeResources.map((resource: any, index: number) => (
                <div
                  key={resource._id}
                  className="bg-card p-5 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-border flex items-center justify-between group animate-fade-in"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg flex items-center justify-center bg-green-100 dark:bg-green-900/30">
                      <FileText className="text-green-600" size={22} />
                    </div>
                    <div>
                      <span className="font-medium text-foreground block">{resource.title}</span>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-muted-foreground bg-green-100 dark:bg-green-900/20 px-2 py-0.5 rounded">
                          Free Resource
                        </span>
                        <span className="text-xs text-muted-foreground">
                          by {resource.createdBy.name}
                        </span>
                      </div>
                      {resource.description && (
                        <p className="text-sm text-muted-foreground mt-1">{resource.description}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => resource.fileUrl && window.open(resource.fileUrl, '_blank')}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>
              ))
            ) : (
              <div className="text-center text-muted-foreground py-12">No free resources found for this category.</div>
            )}
          </div>

          {/* Login Prompt */}
          <div className="mt-12 bg-secondary/50 rounded-xl p-8 text-center border border-border">
            <Lock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">Want More Resources?</h3>
            <p className="text-muted-foreground mb-4">
              Sign up for free to access 100+ additional study materials and exclusive content
            </p>
            <Button
              className="btn-primary"
              onClick={() => navigate("/login?tab=signup")}
            >
              Sign Up for Free
            </Button>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default FreeResources;