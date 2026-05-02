import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { RealtimeNotifier } from "./components/RealtimeNotifier";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { OnboardingTour } from "./components/OnboardingTour";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import NotFound from "./pages/NotFound.tsx";

// Lazy-loaded routes — split into chunks for faster initial load
const Groups = lazy(() => import("./pages/Groups.tsx"));
const GroupDetail = lazy(() => import("./pages/GroupDetail.tsx"));
const GroupCreate = lazy(() => import("./pages/GroupCreate.tsx"));
const GroupEdit = lazy(() => import("./pages/GroupEdit.tsx"));
const GroupRequests = lazy(() => import("./pages/GroupRequests.tsx"));
const GroupChat = lazy(() => import("./pages/GroupChat.tsx"));
const GroupEvents = lazy(() => import("./pages/GroupEvents.tsx"));
const GroupBoard = lazy(() => import("./pages/GroupBoard.tsx"));
const GroupPhotos = lazy(() => import("./pages/GroupPhotos.tsx"));
const GroupAnnouncements = lazy(() => import("./pages/GroupAnnouncements.tsx"));
const DirectMessage = lazy(() => import("./pages/DirectMessage.tsx"));
const ClassCreate = lazy(() => import("./pages/ClassCreate.tsx"));
const ClassChat = lazy(() => import("./pages/ClassChat.tsx"));
const Classes = lazy(() => import("./pages/Classes.tsx"));
const ClassDetail = lazy(() => import("./pages/ClassDetail.tsx"));
const Chat = lazy(() => import("./pages/Chat.tsx"));
const Profile = lazy(() => import("./pages/Profile.tsx"));
const ProfileEdit = lazy(() => import("./pages/ProfileEdit.tsx"));
const Notifications = lazy(() => import("./pages/Notifications.tsx"));
const Points = lazy(() => import("./pages/Points.tsx"));
const InstructorApply = lazy(() => import("./pages/InstructorApply.tsx"));
const Admin = lazy(() => import("./pages/Admin.tsx"));
const LeaderBoard = lazy(() => import("./pages/LeaderBoard.tsx"));
const ClassBoard = lazy(() => import("./pages/ClassBoard.tsx"));
const AdRequest = lazy(() => import("./pages/AdRequest.tsx"));
const Stores = lazy(() => import("./pages/Stores.tsx"));
const Bookmarks = lazy(() => import("./pages/Bookmarks.tsx"));
const PublicProfile = lazy(() => import("./pages/PublicProfile.tsx"));
const FollowList = lazy(() => import("./pages/FollowList.tsx"));
const Recommendations = lazy(() => import("./pages/Recommendations.tsx"));
const TagSearch = lazy(() => import("./pages/TagSearch.tsx"));
const Attendance = lazy(() => import("./pages/Attendance.tsx"));
const Search = lazy(() => import("./pages/Search.tsx"));
const MyCalendar = lazy(() => import("./pages/MyCalendar.tsx"));
const BlockedUsers = lazy(() => import("./pages/BlockedUsers.tsx"));
const Payment = lazy(() => import("./pages/Payment.tsx"));
const Terms = lazy(() => import("./pages/Terms.tsx"));
const Privacy = lazy(() => import("./pages/Privacy.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const RouteFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
  </div>
);

const App = () => (
  <ErrorBoundary>
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <RealtimeNotifier />
          <OnboardingTour />
          <Suspense fallback={<RouteFallback />}>
          <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/new" element={<GroupCreate />} />
          <Route path="/groups/:id/edit" element={<GroupEdit />} />
          <Route path="/groups/:id/requests" element={<GroupRequests />} />
          <Route path="/groups/:id/chat" element={<GroupChat />} />
          <Route path="/groups/:id/events" element={<GroupEvents />} />
          <Route path="/groups/:id/board" element={<GroupBoard />} />
          <Route path="/groups/:id/photos" element={<GroupPhotos />} />
          <Route path="/groups/:id/announcements" element={<GroupAnnouncements />} />
          <Route path="/groups/:id" element={<GroupDetail />} />
          <Route path="/classes" element={<Classes />} />
          <Route path="/classes/new" element={<ClassCreate />} />
          <Route path="/classes/:id/chat" element={<ClassChat />} />
          <Route path="/classes/:id/board" element={<ClassBoard />} />
          <Route path="/classes/:id" element={<ClassDetail />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/dm/:peerId" element={<DirectMessage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/profile/edit" element={<ProtectedRoute><ProfileEdit /></ProtectedRoute>} />
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/points" element={<ProtectedRoute><Points /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/instructor/apply" element={<ProtectedRoute><InstructorApply /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute requireRole="admin"><Admin /></ProtectedRoute>} />
          <Route path="/users/:id" element={<PublicProfile />} />
          <Route path="/users/:id/follows" element={<FollowList />} />
          <Route path="/follows" element={<ProtectedRoute><FollowList /></ProtectedRoute>} />
          <Route path="/recommendations" element={<ProtectedRoute><Recommendations /></ProtectedRoute>} />
          <Route path="/tags/:tag" element={<TagSearch />} />
          <Route path="/attendance" element={<ProtectedRoute><Attendance /></ProtectedRoute>} />
          <Route path="/search" element={<Search />} />
          <Route path="/calendar" element={<ProtectedRoute><MyCalendar /></ProtectedRoute>} />
          <Route path="/blocked" element={<ProtectedRoute><BlockedUsers /></ProtectedRoute>} />
          <Route path="/leaders" element={<LeaderBoard />} />
          <Route path="/ads" element={<AdRequest />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/bookmarks" element={<ProtectedRoute><Bookmarks /></ProtectedRoute>} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/privacy" element={<Privacy />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
