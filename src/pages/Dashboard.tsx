import { useState, useEffect } from "react";
import { useNavigate, Link, useLocation } from "react-router-dom";
import Layout from "@/components/layout/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Settings, MapPin, FileText, LogOut, User, Camera, Loader2, BookOpen, PlayCircle, Lock, Copy, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { enrollmentsAPI, usersAPI } from "@/lib/api";

const menuItems = [
  { id: "courses", label: "My Courses", icon: BookOpen },
  { id: "test-series", label: "My Test Series", icon: FileText },
  { id: "books", label: "My Books", icon: BookOpen },
  { id: "resources", label: "My Resources", icon: FileText },
  { id: "settings", label: "Settings", icon: Settings },
  { id: "address", label: "Address", icon: MapPin },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState("courses");
  const [enrolledCourses, setEnrolledCourses] = useState<any[]>([]);
  const [savedResources, setSavedResources] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [user, setUser] = useState<any>(null);
  
  // Form states for settings
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    dateOfBirth: '',
  });
  
  // Form states for address
  const [addressData, setAddressData] = useState({
    street: '',
    city: '',
    state: '',
    country: 'India',
    postalCode: '',
  });

  // Phone OTP states
  const [showPhoneOTP, setShowPhoneOTP] = useState(false);
  const [phoneOTP, setPhoneOTP] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [tempPhone, setTempPhone] = useState('');

  // Load user and enrollments on mount
  useEffect(() => {
    // If URL contains ?tab=..., switch to that tab
    const params = new URLSearchParams(location.search);
    const tab = params.get('tab');
    if (tab) setActiveTab(tab);
    const userStr = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    if (!userStr || !token) {
      navigate("/login");
      return;
    }

    try {
      const userData = JSON.parse(userStr);
      setUser(userData);
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
      });
      setAddressData({
        street: userData.address?.street || '',
        city: userData.address?.city || '',
        state: userData.address?.state || '',
        country: userData.address?.country || 'India',
        postalCode: userData.address?.postalCode || '',
      });
    } catch {
      navigate("/login");
      return;
    }

    fetchEnrollments();
    fetchSavedResources();

    // Listen for storage changes (when resources are saved)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'savedResources') {
        fetchSavedResources();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [navigate]);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const res = await enrollmentsAPI.getAll();
      setEnrolledCourses(res.enrollments || []);
    } catch (err) {
      console.error('Error fetching enrollments:', err);
      toast.error('Failed to load enrollments');
    } finally {
      setLoading(false);
    }
  };

  const fetchSavedResources = () => {
    try {
      const saved = localStorage.getItem('savedResources');
      if (saved) {
        const resources = JSON.parse(saved);
        setSavedResources(resources);
      }
    } catch (err) {
      console.error('Error loading saved resources:', err);
    }
  };


  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const res = await usersAPI.updateProfile({
        name: formData.name,
        dateOfBirth: formData.dateOfBirth,
      });

      // Update user in localStorage with new data
      const updatedUser = {
        ...user,
        name: (res as any).name,
        dateOfBirth: (res as any).dateOfBirth,
        phone: (res as any).phone,
        address: (res as any).address,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success('Profile updated successfully!');
    } catch (err: any) {
      console.error('Update profile error:', err);
      toast.error(err.message || 'Failed to update profile');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOTP = async () => {
    if (!formData.phone) {
      toast.error('Please enter a phone number');
      return;
    }

    try {
      setOtpLoading(true);
      setTempPhone(formData.phone);
      const res = await usersAPI.sendPhoneOTP(formData.phone);
      setShowPhoneOTP(true);
      toast.success('OTP sent to your phone!');
      
      // Show OTP in dev mode (for testing)
      if ((res as any).otp) {
        console.log('OTP:', (res as any).otp);
      }
    } catch (err: any) {
      console.error('Send OTP error:', err);
      toast.error(err.message || 'Failed to send OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!phoneOTP) {
      toast.error('Please enter OTP');
      return;
    }

    try {
      setOtpLoading(true);
      const res = await usersAPI.verifyPhoneOTP(formData.phone, phoneOTP);

      // Update user with verified phone
      const updatedUser = {
        ...user,
        phone: (res as any).phone,
        phoneVerified: (res as any).phoneVerified,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      setShowPhoneOTP(false);
      setPhoneOTP('');
      toast.success('Phone verified successfully!');
    } catch (err: any) {
      console.error('Verify OTP error:', err);
      toast.error(err.message || 'Invalid OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  const handleUpdateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setSubmitting(true);
      const res = await usersAPI.updateProfile({
        address: addressData,
      });

      // Update user in localStorage with new address
      const updatedUser = {
        ...user,
        address: (res as any).address,
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);

      toast.success('Address updated successfully!');
    } catch (err: any) {
      console.error('Update address error:', err);
      toast.error(err.message || 'Failed to update address');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Show loading while checking auth
  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  // Don't render if not authenticated
  if (!user) {
    return null;
  }

  return (
    <Layout>
      <div className="bg-primary py-8">
        <div className="container mx-auto px-4">
          <h1 className="text-2xl md:text-3xl font-bold text-primary-foreground">
            Welcome, {user?.name || 'User'}
          </h1>
        </div>
      </div>

      <section className="py-12 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-6 py-4 text-left transition-colors ${
                      activeTab === item.id
                        ? "bg-accent text-accent-foreground"
                        : "hover:bg-secondary"
                    }`}
                  >
                    <item.icon size={20} />
                    <span className="font-medium">{item.label}</span>
                  </button>
                ))}
                <div className="border-t border-border">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-secondary text-destructive"
                  >
                    <LogOut size={20} />
                    <span className="font-medium">Logout</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="lg:col-span-3">
              {/* My Courses */}
              {activeTab === "courses" && (
                <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                  <h2 className="text-xl font-semibold mb-6">My Enrolled Courses</h2>
                  {enrolledCourses.length > 0 ? (
                    <div className="space-y-4">
                      {enrolledCourses.map((enrollment) => (
                        <div key={enrollment._id} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
                          <div className="w-24 h-16 bg-gradient-to-br from-primary to-navy rounded-lg flex items-center justify-center overflow-hidden">
                            {enrollment.courseId?.thumbnail ? (
                              <img src={enrollment.courseId.thumbnail} alt={enrollment.courseId.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="text-primary-foreground" size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{enrollment.courseId?.title || 'Course'}</h3>
                            <p className="text-sm text-muted-foreground">
                              Progress: {enrollment.progress || 0}%
                            </p>
                            <div className="w-full bg-secondary rounded-full h-2 mt-2">
                              <div
                                className="bg-accent h-2 rounded-full transition-all"
                                style={{ width: `${enrollment.progress || 0}%` }}
                              />
                            </div>
                          </div>
                          <Button className="btn-primary" onClick={() => navigate(`/course/${enrollment.courseId?._id}/content`)}>
                            <PlayCircle size={18} className="mr-2" /> Start Course
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <Lock className="mx-auto mb-4" size={48} />
                      <p>You haven't enrolled in any courses yet.</p>
                      <p className="text-sm mt-2">Purchase a course to get started!</p>
                      <Button onClick={() => navigate("/classes")} className="btn-primary mt-4">
                        Browse Courses
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "settings" && (
                <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                  <h2 className="text-xl font-semibold mb-6">Profile Settings</h2>

                  {/* Profile Picture */}
                  <div className="text-center mb-8 pb-8 border-b border-border">
                    <p className="text-sm font-medium mb-4">Profile Picture</p>
                    <div className="w-32 h-32 bg-secondary rounded-full mx-auto flex items-center justify-center mb-4">
                      <User className="text-muted-foreground" size={48} />
                    </div>
                    <div className="flex gap-2 justify-center">
                      <Button variant="secondary" size="sm" disabled>
                        <Camera size={16} className="mr-2" />
                        Choose Image
                      </Button>
                      <Button size="sm" className="btn-primary" disabled>
                        UPDATE IMAGE
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">Coming soon</p>
                  </div>

                  {/* Profile Form */}
                  <form onSubmit={handleUpdateProfile} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Name</label>
                      <Input
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter your name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Email</label>
                      <Input
                        type="email"
                        value={user?.email || ""}
                        className="bg-muted"
                        disabled
                      />
                      <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Phone {user?.phoneVerified && <CheckCircle className="inline text-green-600 ml-1" size={16} />}
                      </label>
                      <div className="flex gap-2">
                        <Input
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="Enter phone number"
                          disabled={showPhoneOTP}
                        />
                        {!user?.phoneVerified && (
                          <Button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={!formData.phone || otpLoading}
                            className="flex-shrink-0"
                          >
                            {otpLoading ? <Loader2 size={16} className="animate-spin" /> : "Send OTP"}
                          </Button>
                        )}
                      </div>
                    </div>

                    {showPhoneOTP && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <label className="block text-sm font-medium mb-2">Enter OTP</label>
                        <div className="flex gap-2">
                          <Input
                            type="text"
                            value={phoneOTP}
                            onChange={(e) => setPhoneOTP(e.target.value)}
                            placeholder="6-digit OTP"
                            maxLength={6}
                          />
                          <Button
                            type="button"
                            onClick={handleVerifyOTP}
                            disabled={!phoneOTP || otpLoading}
                            className="flex-shrink-0 btn-primary"
                          >
                            {otpLoading ? <Loader2 size={16} className="animate-spin" /> : "Verify"}
                          </Button>
                        </div>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium mb-2">Date of Birth</label>
                      <Input
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                      />
                    </div>

                    <Button
                      type="submit"
                      className="btn-primary w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Updating...
                        </>
                      ) : (
                        "Update Profile"
                      )}
                    </Button>
                  </form>
                </div>
              )}


              {activeTab === "address" && (
                <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                  <h2 className="text-xl font-semibold mb-6">My Address</h2>
                  
                  <form onSubmit={handleUpdateAddress} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium mb-2">Street Address</label>
                      <Input
                        value={addressData.street}
                        onChange={(e) => setAddressData({ ...addressData, street: e.target.value })}
                        placeholder="Enter street address"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">City</label>
                        <Input
                          value={addressData.city}
                          onChange={(e) => setAddressData({ ...addressData, city: e.target.value })}
                          placeholder="Enter city"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">State</label>
                        <Input
                          value={addressData.state}
                          onChange={(e) => setAddressData({ ...addressData, state: e.target.value })}
                          placeholder="Enter state"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium mb-2">Country</label>
                        <Input
                          value={addressData.country}
                          disabled
                          className="bg-muted"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-2">Postal Code</label>
                        <Input
                          value={addressData.postalCode}
                          onChange={(e) => setAddressData({ ...addressData, postalCode: e.target.value })}
                          placeholder="Enter postal code"
                        />
                      </div>
                    </div>

                    <Button
                      type="submit"
                      className="btn-primary w-full"
                      disabled={submitting}
                    >
                      {submitting ? (
                        <>
                          <Loader2 size={16} className="mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Address"
                      )}
                    </Button>

                    {(addressData.street || addressData.city || addressData.state || addressData.postalCode) && (
                      <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                        <p className="text-sm font-medium text-green-800 mb-2">Address Preview:</p>
                        <p className="text-sm text-green-700">
                          {addressData.street}<br />
                          {addressData.city}, {addressData.state} {addressData.postalCode}<br />
                          {addressData.country}
                        </p>
                      </div>
                    )}
                  </form>
                </div>
              )}

              {activeTab === "test-series" && (
                <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                  <h2 className="text-xl font-semibold mb-6">My Test Series</h2>
                  {enrolledCourses.filter(e => e.testSeriesId).length > 0 ? (
                    <div className="space-y-4">
                      {enrolledCourses.filter(e => e.testSeriesId).map((enrollment) => (
                        <div key={enrollment._id} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
                          <div className="w-24 h-16 bg-gradient-to-br from-primary to-navy rounded-lg flex items-center justify-center overflow-hidden">
                            {enrollment.testSeriesId?.thumbnail ? (
                              <img src={enrollment.testSeriesId.thumbnail} alt={enrollment.testSeriesId.title} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="text-primary-foreground" size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{enrollment.testSeriesId?.title || 'Test Series'}</h3>
                            <p className="text-sm text-muted-foreground">Purchased: {new Date(enrollment.enrollmentDate).toLocaleDateString()}</p>
                          </div>
                          <Button className="btn-primary" onClick={() => navigate(`/testseries/${enrollment.testSeriesId?._id}/content`)}>
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="mx-auto mb-4" size={48} />
                      <p>You haven't enrolled in any test series yet.</p>
                      <Button onClick={() => navigate("/test-series")} className="btn-primary mt-4">
                        Browse Test Series
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "books" && (
                <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                  <h2 className="text-xl font-semibold mb-6">My Books</h2>
                  {enrolledCourses.filter(e => e.bookId).length > 0 ? (
                    <div className="space-y-4">
                      {enrolledCourses.filter(e => e.bookId).map((enrollment) => (
                        <div key={enrollment._id} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
                          <div className="w-24 h-16 bg-gradient-to-br from-primary to-navy rounded-lg flex items-center justify-center overflow-hidden">
                            {enrollment.bookId?.thumbnail ? (
                              <img src={enrollment.bookId.thumbnail} alt={enrollment.bookId.title} className="w-full h-full object-cover" />
                            ) : (
                              <BookOpen className="text-primary-foreground" size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{enrollment.bookId?.title || 'Book'}</h3>
                            <p className="text-sm text-muted-foreground">Purchased: {new Date(enrollment.enrollmentDate).toLocaleDateString()}</p>
                          </div>
                          <Button className="btn-primary" onClick={() => navigate(`/books/${enrollment.bookId?._id}/read`)}>
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BookOpen className="mx-auto mb-4" size={48} />
                      <p>You haven't purchased any books yet.</p>
                      <Button onClick={() => navigate("/books")} className="btn-primary mt-4">
                        Browse Books
                      </Button>
                    </div>
                  )}
                </div>
              )}

              {activeTab === "resources" && (
                <div className="bg-card p-8 rounded-xl shadow-sm border border-border">
                  <h2 className="text-xl font-semibold mb-6">My Saved Resources</h2>
                  {savedResources.length > 0 ? (
                    <div className="space-y-4">
                      {savedResources.map((resource) => (
                        <div key={resource._id} className="flex items-center gap-4 p-4 bg-secondary/30 rounded-lg border border-border">
                          <div className="w-24 h-16 bg-gradient-to-br from-primary to-navy rounded-lg flex items-center justify-center overflow-hidden">
                            {resource.thumbnail ? (
                              <img src={resource.thumbnail} alt={resource.title} className="w-full h-full object-cover" />
                            ) : (
                              <FileText className="text-primary-foreground" size={24} />
                            )}
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold">{resource.title}</h3>
                            <p className="text-sm text-muted-foreground">Saved: {new Date(resource.savedAt).toLocaleDateString()}</p>
                          </div>
                          <Button className="btn-primary" onClick={() => navigate(`/free-resources`)}>
                            View
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="mx-auto mb-4" size={48} />
                      <p>You haven't saved any resources yet.</p>
                      <Button onClick={() => navigate("/free-resources")} className="btn-primary mt-4">
                        Browse Resources
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Dashboard;
