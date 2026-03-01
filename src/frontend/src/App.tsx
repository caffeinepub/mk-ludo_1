import { Toaster } from "@/components/ui/sonner";
import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
  useNavigate,
  useParams,
} from "@tanstack/react-router";
import Layout from "./components/Layout";
import LoadingScreen from "./components/LoadingScreen";
import { useActor } from "./hooks/useActor";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetMe } from "./hooks/useQueries";
import AdminPage from "./pages/AdminPage";
import BattleRoomPage from "./pages/BattleRoomPage";
import LobbyPage from "./pages/LobbyPage";
import ProfilePage from "./pages/ProfilePage";
import ReferPage from "./pages/ReferPage";
import RegisterPage from "./pages/RegisterPage";
import SupportPage from "./pages/SupportPage";
import WalletPage from "./pages/WalletPage";

// Export navigate hook for use in other components
export { useNavigate, useParams };

function AuthGuard() {
  const { identity, isInitializing } = useInternetIdentity();
  const { isFetching: actorFetching } = useActor();
  const { data: me, isLoading: meLoading } = useGetMe();

  const isLoading = isInitializing || actorFetching || meLoading;

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!identity) {
    return <RegisterPage authMode="login" />;
  }

  if (!me) {
    return <RegisterPage authMode="register" />;
  }

  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

// Routes
const rootRoute = createRootRoute({
  component: AuthGuard,
});

const lobbyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: LobbyPage,
});

const walletRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/wallet",
  component: WalletPage,
});

const battleRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/battle/$battleId",
  component: BattleRoomPage,
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: AdminPage,
});

const referRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/refer",
  component: ReferPage,
});

const profileRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/profile",
  component: ProfilePage,
});

const supportRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/support",
  component: SupportPage,
});

const routeTree = rootRoute.addChildren([
  lobbyRoute,
  walletRoute,
  battleRoute,
  adminRoute,
  referRoute,
  profileRoute,
  supportRoute,
]);

const router = createRouter({ routeTree });

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          classNames: {
            toast: "bg-white border-gray-200 text-gray-900 font-body shadow-lg",
            success: "border-green-300",
            error: "border-red-300",
          },
        }}
      />
    </>
  );
}
