import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index.tsx";
import NotFound from "./pages/NotFound.tsx";
import Groups from "./pages/Groups.tsx";
import GroupDetail from "./pages/GroupDetail.tsx";
import GroupCreate from "./pages/GroupCreate.tsx";
import GroupEdit from "./pages/GroupEdit.tsx";
import GroupRequests from "./pages/GroupRequests.tsx";
import GroupChat from "./pages/GroupChat.tsx";
import GroupEvents from "./pages/GroupEvents.tsx";
import GroupBoard from "./pages/GroupBoard.tsx";
import GroupPhotos from "./pages/GroupPhotos.tsx";
import GroupAnnouncements from "./pages/GroupAnnouncements.tsx";
import DirectMessage from "./pages/DirectMessage.tsx";
import ClassCreate from "./pages/ClassCreate.tsx";
import ClassChat from "./pages/ClassChat.tsx";
import Classes from "./pages/Classes.tsx";
import ClassDetail from "./pages/ClassDetail.tsx";
import Chat from "./pages/Chat.tsx";
import Login from "./pages/Login.tsx";
import Profile from "./pages/Profile.tsx";
import ProfileEdit from "./pages/ProfileEdit.tsx";
import Notifications from "./pages/Notifications.tsx";
import Points from "./pages/Points.tsx";
import InstructorApply from "./pages/InstructorApply.tsx";
import Admin from "./pages/Admin.tsx";
import LeaderBoard from "./pages/LeaderBoard.tsx";
import ClassBoard from "./pages/ClassBoard.tsx";
import AdRequest from "./pages/AdRequest.tsx";
import Stores from "./pages/Stores.tsx";
import Bookmarks from "./pages/Bookmarks.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
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
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<ProfileEdit />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/points" element={<Points />} />
          <Route path="/instructor/apply" element={<InstructorApply />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/leaders" element={<LeaderBoard />} />
          <Route path="/ads" element={<AdRequest />} />
          <Route path="/stores" element={<Stores />} />
          <Route path="/bookmarks" element={<Bookmarks />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
