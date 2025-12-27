import { useState, useEffect } from "react";
import Layout from "@/components/layout/Layout";
import { categoriesAPI, testSeriesAPI } from "@/lib/api";
import { openRazorpay } from '@/utils/razorpay';
import { FileCheck, Clock, CheckCircle, Users, BarChart, Eye, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

const TestSeries = () => {
  const [categories, setCategories] = useState<any[]>([]);
  const [testSeries, setTestSeries] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [categoriesRes, seriesRes] = await Promise.all([
          categoriesAPI.getAll(),
          testSeriesAPI.getAll({ limit: 100 }),
        ]);
        setCategories(categoriesRes.categories || []);
        setTestSeries(seriesRes.testSeries || []);
      } catch (err) {
        console.error('Error fetching data:', err);
        setCategories([]);
        setTestSeries([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleCategoryChange = async (categoryId: string) => {
    setActiveCategory(categoryId);
    if (categoryId === "All") {
      const res = await testSeriesAPI.getAll({ limit: 100 });
      setTestSeries(res.testSeries || []);
    } else {
      const res = await testSeriesAPI.getByCategory(categoryId, { limit: 100 });
      setTestSeries(res.testSeries || []);
    }
  };

  const filteredSeries = testSeries.filter((series) => {
    const matchesSearch = series.title.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });



  const handleViewDetails = (test: any) => {
    navigate(`/testseries/${test._id}`);
  };

  return (
    <Layout>
      <div className="bg-primary py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold text-primary-foreground text-center">
            Test Series
          </h1>
          <p className="text-primary-foreground/80 text-center mt-2">
            Practice tests designed by AIR holders and top rankers
          </p>
        </div>
      </div>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          {/* Search */}
          <div className="max-w-md mx-auto mb-8">
            <input
              type="text"
              placeholder="Search test series..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-border focus:outline-none focus:ring-2 focus:ring-primary bg-card"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <button
              onClick={() => handleCategoryChange("All")}
              className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                activeCategory === "All"
                  ? "bg-accent text-accent-foreground border-2 border-accent"
                  : "bg-card text-foreground border-2 border-border hover:border-accent"
              }`}
            >
              All
            </button>
            {categories.map((category) => (
              <button
                key={category._id}
                onClick={() => handleCategoryChange(category._id)}
                className={`px-6 py-2 rounded-full font-medium transition-all duration-200 ${
                  activeCategory === category._id
                    ? "bg-accent text-accent-foreground border-2 border-accent"
                    : "bg-card text-foreground border-2 border-border hover:border-accent"
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>

          {/* Test Series Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {loading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-80 rounded-xl" />
                ))}
              </>
            ) : filteredSeries.length > 0 ? (
              filteredSeries.map((test: any, index: number) => (
                <div
                  key={test._id}
                  className="bg-card p-6 rounded-xl shadow-md hover:shadow-xl transition-all duration-300 border border-border animate-fade-in group"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-xl flex items-center justify-center flex-shrink-0">
                      <FileCheck className="text-green-600" size={28} />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-green-600 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded">
                        Published
                      </span>
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-foreground mb-3 group-hover:text-primary transition-colors line-clamp-2">
                    {test.title}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground mb-1">
                    by {test.createdBy?.name || 'Unknown'}
                  </p>
                  
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{test.description || 'No description available'}</p>

                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-4">
                    <FileCheck size={14} className="text-primary" />
                    <span>{test.totalTests || '—'} Tests</span>
                    <span>•</span>
                    <Clock size={14} className="text-primary" />
                    <span>{test.tests?.[0]?.duration || '60'} mins</span>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      {test.price > 0 ? (
                        <span className="text-xl font-bold text-primary">₨{test.price.toLocaleString()}</span>
                      ) : (
                        <span className="text-lg font-bold text-green-600">Free</span>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button
                      onClick={() => handleViewDetails(test)}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Eye size={16} className="mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground col-span-full py-12">No test series found.</p>
            )}
          </div>

          <div className="mt-16 bg-secondary/30 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-center text-foreground mb-8">Why Choose Our Test Series?</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <BarChart className="text-primary" size={32} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Detailed Analytics</h3>
                <p className="text-muted-foreground text-sm">Track your progress with comprehensive performance reports</p>
              </div>
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="text-primary" size={32} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">All India Ranking</h3>
                <p className="text-muted-foreground text-sm">Compare your performance with students across India</p>
              </div>
              <div className="text-center p-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="text-primary" size={32} />
                </div>
                <h3 className="font-semibold text-foreground mb-2">Expert Solutions</h3>
                <p className="text-muted-foreground text-sm">Detailed solutions and explanations by subject experts</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default TestSeries;
